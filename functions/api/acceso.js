/*
  POST /api/acceso — cuentas de la zona de boletines (registro gratuito con correo y contraseña).

  { accion: "crear", nombre, apellido, email, whatsapp, clave, acepto, novedades } → crea la cuenta y abre sesión.
  { accion: "entrar", email, clave }  → si la contraseña es correcta, abre una sesión de 30 días (cookie sg_ses).
  { accion: "salir" }                 → cierra la sesión.

  No necesita ningún servicio de correos. Las contraseñas nunca se guardan: en KV queda solo su huella
  (PBKDF2-SHA256 con sal aleatoria). Las sesiones también se guardan como huella (SHA-256).
  ¿Alguien olvidó su contraseña? Borra su clave "cuenta:<correo>" en el KV (ver docs/DESPLIEGUE.md) y que se registre otra vez.
*/
import {
  json, leerJson, texto, correoValido, telefonoInternacional, fechaEcuador, sha256, aleatorioHex, permitir,
  anotarPlanilla, avisarDueno, leerCookie, textoConsentimiento, VERSION_POLITICA
} from "../../lib/servidor.js";

const DIAS_SESION = 30;
const ITERACIONES = 100000; // máximo que permite Cloudflare Workers para PBKDF2

const aHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const deHex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

async function huellaClave(clave, sal, iteraciones) {
  const llave = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: deHex(sal), iterations: iteraciones }, llave, 256);
  return aHex(bits);
}

// Comparación en tiempo constante
function iguales(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function abrirSesion(kv, email) {
  const token = aleatorioHex(32);
  await kv.put("ses:" + (await sha256(token)), email, { expirationTtl: DIAS_SESION * 86400 });
  return json({ ok: true }, 200, {
    "Set-Cookie": `sg_ses=${token}; Path=/; Max-Age=${DIAS_SESION * 86400}; HttpOnly; Secure; SameSite=Lax`
  });
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.SUSCRIPTORES) return json({ ok: false, error: "La zona de suscriptores aún no está activada." }, 503);
  const d = await leerJson(request, 3000);
  if (!d) return json({ ok: false, error: "Datos inválidos" }, 400);
  const kv = env.SUSCRIPTORES;
  const ip = request.headers.get("CF-Connecting-IP") || "0";

  if (d.accion === "salir") {
    const token = leerCookie(request, "sg_ses");
    if (/^[a-f0-9]{64}$/.test(token)) await kv.delete("ses:" + (await sha256(token)));
    return json({ ok: true }, 200, { "Set-Cookie": "sg_ses=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax" });
  }

  const email = texto(d.email, 120).toLowerCase();
  const clave = typeof d.clave === "string" ? d.clave : "";
  if (!correoValido(email)) return json({ ok: false, error: "Escribe un correo válido." }, 400);

  if (d.accion === "entrar") {
    if (!(await permitir(env, "entrar-ip:" + ip, 20, 900)) || !(await permitir(env, "entrar:" + email, 8, 900))) {
      return json({ ok: false, error: "Demasiados intentos. Espera 15 minutos e intenta otra vez." }, 429);
    }
    const cuenta = JSON.parse((await kv.get("cuenta:" + email)) || "null");
    // Si no existe la cuenta se calcula igual una huella, para que la respuesta tarde lo mismo
    const huella = await huellaClave(clave, cuenta ? cuenta.sal : "00".repeat(16), cuenta ? cuenta.it : ITERACIONES);
    if (!cuenta || !iguales(huella, cuenta.h)) return json({ ok: false, error: "Correo o contraseña incorrectos." }, 400);
    return abrirSesion(kv, email);
  }

  if (d.accion === "crear") {
    const p = {
      nombre: texto(d.nombre, 60),
      apellido: texto(d.apellido, 60),
      whatsapp: telefonoInternacional(d.whatsapp),
      novedades: d.novedades === true,
      fecha: fechaEcuador()
    };
    if (!p.nombre || !p.apellido) return json({ ok: false, error: "Escribe tu nombre y apellido." }, 400);
    if (!p.whatsapp) return json({ ok: false, error: "Revisa tu número de WhatsApp." }, 400);
    if (clave.length < 8 || clave.length > 100) return json({ ok: false, error: "La contraseña debe tener al menos 8 caracteres." }, 400);
    if (d.acepto !== true) return json({ ok: false, error: "Debes aceptar la política de privacidad." }, 400);
    if (!(await permitir(env, "crear-ip:" + ip, 5, 3600))) return json({ ok: false, error: "Demasiados registros seguidos. Intenta en una hora." }, 429);
    if (await kv.get("cuenta:" + email)) return json({ ok: false, error: "Ya existe una cuenta con ese correo. Ingresa con tu contraseña." }, 409);

    const sal = aleatorioHex(16);
    await kv.put("cuenta:" + email, JSON.stringify({ sal, it: ITERACIONES, h: await huellaClave(clave, sal, ITERACIONES), alta: p.fecha }));
    const previo = JSON.parse((await kv.get("sub:" + email)) || "null");
    await kv.put("sub:" + email, JSON.stringify({
      nombre: p.nombre, apellido: p.apellido, whatsapp: p.whatsapp,
      novedades: p.novedades || (previo && previo.novedades) || false,
      alta: (previo && previo.alta) || p.fecha, actualizado: p.fecha,
      consentimiento: { fecha: p.fecha, version: VERSION_POLITICA }
    }));

    // Aviso a Sinergia (hoja de cálculo y WhatsApp del dueño) sin hacer esperar a la persona
    const nombreCompleto = `${p.nombre} ${p.apellido}`;
    const waCliente = `https://wa.me/${p.whatsapp}?text=${encodeURIComponent(`¡Hola, ${p.nombre.split(" ")[0]}! Te saluda Sinergia Capacitación Empresarial. Gracias por registrarte en nuestra zona de boletines.`)}`;
    const avisos = Promise.all([
      anotarPlanilla(env, {
        fecha: p.fecha, tipo: "Cuenta de boletines", nombre: p.nombre, apellido: p.apellido, correo: email,
        whatsapp: "+" + p.whatsapp, enlace: waCliente, empresa: "", interes: "Boletines",
        novedades: p.novedades ? "Sí" : "No", mensaje: "", pagina: "/boletines",
        consentimiento: textoConsentimiento(p.fecha)
      }),
      avisarDueno(env, `Sinergia web · Nueva cuenta de boletines\n${nombreCompleto} · +${p.whatsapp}\n${email}\n\nResponder: ${waCliente}`)
    ]).catch(() => {});
    if (typeof waitUntil === "function") waitUntil(avisos);

    return abrirSesion(kv, email);
  }

  return json({ ok: false, error: "Acción desconocida" }, 400);
}
