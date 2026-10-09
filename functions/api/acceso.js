/*
  POST /api/acceso — cuentas de la zona de boletines (registro gratuito con correo y contraseña).

  { accion: "crear", nombre, apellido, email, whatsapp, clave, acepto, novedades } → crea la cuenta y abre sesión.
  { accion: "entrar", email, clave }      → si la contraseña es correcta, abre una sesión de 30 días (cookie __Host-sg_ses).
  { accion: "recuperar", email }          → envía al correo un enlace (válido 1 hora) para crear una contraseña nueva.
                                            También sirve para activar el acceso de un correo de ADMIN_EMAILS.
  { accion: "restablecer", token, clave } → guarda la contraseña nueva, cierra las sesiones anteriores y abre una nueva.
  { accion: "estado" }                    → dice si hay sesión y si es administradora.
  { accion: "salir" }                     → cierra la sesión.

  Las contraseñas nunca se guardan: en KV queda solo su huella (PBKDF2-SHA256 con sal aleatoria).
  Las sesiones y los enlaces de recuperación también se guardan solo como huella (SHA-256).
*/
import {
  json, leerJson, texto, correoValido, telefonoInternacional, fechaEcuador, sha256, aleatorioHex, permitir,
  anotarPlanilla, avisarDueno, leerCookie, textoConsentimiento, VERSION_POLITICA, enviarCorreo, puedeEnviarCorreo,
  marcoCorreo, botonCorreo, abrirSesion, emailDeSesion, esAdmin, mismoOrigen, lista, COOKIE_SESION,
  verificarHumano, MENSAJE_ROBOT
} from "../../lib/servidor.js";
import { guardarSuscriptor } from "../../lib/suscriptores.js";

const ITERACIONES = 100000; // máximo que permite Cloudflare Workers para PBKDF2
const MINUTOS_ENLACE = 60;

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

function claveValida(clave) {
  return typeof clave === "string" && clave.length >= 8 && clave.length <= 100;
}

async function conSesion(env, email, gen, extra = {}) {
  return json({ ok: true, ...extra }, 200, { "Set-Cookie": await abrirSesion(env, email, gen) });
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.SUSCRIPTORES) return json({ ok: false, error: "La zona de suscriptores aún no está activada." }, 503);
  if (!mismoOrigen(request)) return json({ ok: false, error: "Origen no permitido" }, 403);
  const d = await leerJson(request, 3000);
  if (!d) return json({ ok: false, error: "Datos inválidos" }, 400);
  const kv = env.SUSCRIPTORES;
  const ip = request.headers.get("CF-Connecting-IP") || "0";
  const espera = (p) => { if (typeof waitUntil === "function") waitUntil(p); };

  if (d.accion === "salir") {
    const token = leerCookie(request, COOKIE_SESION);
    if (/^[a-f0-9]{64}$/.test(token)) await kv.delete("ses:" + (await sha256(token)));
    return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE_SESION}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  }

  if (d.accion === "estado") {
    const email = await emailDeSesion(request, env);
    return json({ ok: true, sesion: !!email, email, admin: await esAdmin(env, email) });
  }

  if (d.accion === "restablecer") {
    const token = typeof d.token === "string" ? d.token : "";
    if (!/^[a-f0-9]{64}$/.test(token)) return json({ ok: false, error: "El enlace no es válido. Pide uno nuevo." }, 400);
    if (!claveValida(d.clave)) return json({ ok: false, error: "La contraseña debe tener al menos 8 caracteres." }, 400);
    if (!(await permitir(env, "rest-ip:" + ip, 10, 3600))) return json({ ok: false, error: "Demasiados intentos. Prueba en una hora." }, 429);
    const llave = "rec:" + (await sha256(token));
    const rec = JSON.parse((await kv.get(llave)) || "null");
    if (!rec || !rec.email) return json({ ok: false, error: "El enlace venció o ya se usó. Pide uno nuevo." }, 400);
    await kv.delete(llave); // un enlace sirve una sola vez

    const previa = JSON.parse((await kv.get("cuenta:" + rec.email)) || "null");
    const sal = aleatorioHex(16);
    const gen = ((previa && previa.gen) || 0) + 1; // invalida todas las sesiones anteriores
    const cuenta = {
      ...(previa || { alta: fechaEcuador() }),
      sal, it: ITERACIONES, h: await huellaClave(d.clave, sal, ITERACIONES),
      gen, verificado: true, cambio: fechaEcuador()
    };
    await kv.put("cuenta:" + rec.email, JSON.stringify(cuenta));
    return conSesion(env, rec.email, gen, { admin: await esAdmin(env, rec.email) });
  }

  const email = texto(d.email, 120).toLowerCase();
  const clave = typeof d.clave === "string" ? d.clave : "";
  if (!correoValido(email)) return json({ ok: false, error: "Escribe un correo válido." }, 400);

  if (d.accion === "recuperar") {
    if (!puedeEnviarCorreo(env)) return json({ ok: false, error: "El envío de correos aún no está activado. Escríbenos por WhatsApp." }, 503);
    if (!(await verificarHumano(env, request, d.turnstile))) return json({ ok: false, error: MENSAJE_ROBOT }, 400);
    if (!(await permitir(env, "rec-ip:" + ip, 6, 3600))) return json({ ok: false, error: "Demasiados intentos. Prueba en una hora." }, 429);
    const respuesta = json({ ok: true }); // misma respuesta exista o no la cuenta (no revela qué correos están registrados)
    if (!(await permitir(env, "rec:" + email, 3, 3600))) return respuesta;

    const cuenta = await kv.get("cuenta:" + email);
    const admin = lista(env.ADMIN_EMAILS).map((c) => c.toLowerCase()).includes(email);
    if (!cuenta && !admin) return respuesta;

    const token = aleatorioHex(32);
    await kv.put("rec:" + (await sha256(token)), JSON.stringify({ email }), { expirationTtl: MINUTOS_ENLACE * 60 });
    const enlace = `${new URL(request.url).origin}/${admin ? "admin" : "boletines"}#clave=${token}`;
    const titulo = cuenta ? "Crea tu nueva contraseña" : "Activa tu acceso de administración";
    espera(enviarCorreo(env, {
      to: [email],
      subject: `${titulo} · Sinergia`,
      html: marcoCorreo(titulo, `<p style="font-size:15px;line-height:1.6">Recibimos un pedido para ${cuenta ? "cambiar la contraseña de tu cuenta" : "activar tu acceso"} en la web de Sinergia. Toca el botón para crear tu contraseña. El enlace vence en ${MINUTOS_ENLACE} minutos y sirve una sola vez.</p>
${botonCorreo(enlace, "Crear mi contraseña")}
<p style="font-size:13px;color:#7a7173;margin-top:18px">Si no lo pediste, ignora este correo: tu contraseña actual sigue igual.</p>`),
      text: `${titulo}. Abre este enlace (vence en ${MINUTOS_ENLACE} minutos): ${enlace}\nSi no lo pediste, ignora este correo.`
    }));
    return respuesta;
  }

  if (d.accion === "entrar") {
    if (!(await permitir(env, "entrar-ip:" + ip, 20, 900)) || !(await permitir(env, "entrar:" + email, 8, 900))) {
      return json({ ok: false, error: "Demasiados intentos. Espera 15 minutos e intenta otra vez." }, 429);
    }
    const cuenta = JSON.parse((await kv.get("cuenta:" + email)) || "null");
    // Si no existe la cuenta se calcula igual una huella, para que la respuesta tarde lo mismo
    const huella = await huellaClave(clave, cuenta ? cuenta.sal : "00".repeat(16), cuenta ? cuenta.it : ITERACIONES);
    if (!cuenta || !iguales(huella, cuenta.h)) return json({ ok: false, error: "Correo o contraseña incorrectos." }, 400);
    return conSesion(env, email, cuenta.gen || 0, { admin: await esAdmin(env, email) });
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
    if (!claveValida(clave)) return json({ ok: false, error: "La contraseña debe tener al menos 8 caracteres." }, 400);
    if (d.acepto !== true) return json({ ok: false, error: "Debes aceptar la política de privacidad." }, 400);
    if (!(await verificarHumano(env, request, d.turnstile))) return json({ ok: false, error: MENSAJE_ROBOT }, 400);
    if (!(await permitir(env, "crear-ip:" + ip, 5, 3600))) return json({ ok: false, error: "Demasiados registros seguidos. Intenta en una hora." }, 429);
    if (await kv.get("cuenta:" + email)) return json({ ok: false, error: "Ya existe una cuenta con ese correo. Ingresa con tu contraseña o usa «¿Olvidaste tu contraseña?»." }, 409);

    const sal = aleatorioHex(16);
    await kv.put("cuenta:" + email, JSON.stringify({ sal, it: ITERACIONES, h: await huellaClave(clave, sal, ITERACIONES), gen: 0, alta: p.fecha }));
    const previo = JSON.parse((await kv.get("sub:" + email)) || "null");
    await guardarSuscriptor(kv, email, {
      nombre: p.nombre, apellido: p.apellido, whatsapp: p.whatsapp,
      novedades: p.novedades || (previo && previo.novedades) || false,
      alta: (previo && previo.alta) || p.fecha, actualizado: p.fecha,
      consentimiento: { fecha: p.fecha, version: VERSION_POLITICA }
    });

    // Aviso a Sinergia (hoja de cálculo y WhatsApp del dueño) sin hacer esperar a la persona
    const nombreCompleto = `${p.nombre} ${p.apellido}`;
    const waCliente = `https://wa.me/${p.whatsapp}?text=${encodeURIComponent(`¡Hola, ${p.nombre.split(" ")[0]}! Te saluda Sinergia Capacitación Empresarial. Gracias por registrarte en nuestra zona de boletines.`)}`;
    espera(Promise.all([
      anotarPlanilla(env, {
        fecha: p.fecha, tipo: "Cuenta de boletines", nombre: p.nombre, apellido: p.apellido, correo: email,
        whatsapp: "+" + p.whatsapp, enlace: waCliente, empresa: "", interes: "Boletines",
        novedades: p.novedades ? "Sí" : "No", mensaje: "", pagina: "/boletines",
        consentimiento: textoConsentimiento(p.fecha)
      }),
      avisarDueno(env, `Sinergia web · Nueva cuenta de boletines\n${nombreCompleto} · +${p.whatsapp}\n${email}\n\nResponder: ${waCliente}`)
    ]).catch(() => {}));

    return conSesion(env, email, 0, { admin: await esAdmin(env, email) });
  }

  return json({ ok: false, error: "Acción desconocida" }, 400);
}
