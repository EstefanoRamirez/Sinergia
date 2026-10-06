/*
  POST /api/acceso — ingreso a la zona de boletines (solo suscriptores registrados, sin contraseñas).

  { accion: "codigo", email }            → si el correo está registrado, le envía un código de 6 números (vence en 10 min).
  { accion: "verificar", email, codigo } → si el código es correcto, abre una sesión de 30 días (cookie sg_ses).
  { accion: "salir" }                    → cierra la sesión.

  En KV solo se guardan huellas (SHA-256) de los códigos y sesiones, nunca los valores reales.
*/
import {
  json, leerJson, texto, correoValido, sha256, aleatorioHex, permitir, enviarCorreo,
  marcoCorreo, leerCookie, esc
} from "../../lib/servidor.js";

const DIAS_SESION = 30;

export async function onRequestPost({ request, env }) {
  if (!env.SUSCRIPTORES) return json({ ok: false, error: "La zona de suscriptores aún no está activada." }, 503);
  const d = await leerJson(request, 2000);
  if (!d) return json({ ok: false, error: "Datos inválidos" }, 400);
  const kv = env.SUSCRIPTORES;
  const ip = request.headers.get("CF-Connecting-IP") || "0";

  if (d.accion === "salir") {
    const token = leerCookie(request, "sg_ses");
    if (/^[a-f0-9]{64}$/.test(token)) await kv.delete("ses:" + (await sha256(token)));
    return json({ ok: true }, 200, { "Set-Cookie": "sg_ses=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax" });
  }

  const email = texto(d.email, 120).toLowerCase();
  if (!correoValido(email)) return json({ ok: false, error: "Escribe un correo válido." }, 400);

  if (d.accion === "codigo") {
    if (!(await permitir(env, "cod-ip:" + ip, 10, 3600))) return json({ ok: false, error: "Demasiados intentos. Prueba en una hora." }, 429);
    const sub = JSON.parse((await kv.get("sub:" + email)) || "null");
    if (!sub) return json({ ok: false, error: "Ese correo no está registrado. Regístrate gratis con el botón de abajo." }, 404);
    if (!(await permitir(env, "cod:" + email, 1, 60))) return json({ ok: false, error: "Ya te enviamos un código. Espera un minuto para pedir otro." }, 429);

    const n = new Uint32Array(1);
    crypto.getRandomValues(n);
    const codigo = String(n[0] % 1000000).padStart(6, "0");
    await kv.put("codigo:" + email, JSON.stringify({ h: await sha256(email + ":" + codigo), intentos: 0 }), { expirationTtl: 600 });

    const enviado = await enviarCorreo(env, {
      to: [email],
      subject: `Tu código de acceso: ${codigo}`,
      html: marcoCorreo(`Hola, ${sub.nombre}`, `<p style="font-size:15px;line-height:1.6">Este es tu código para entrar a los boletines de Sinergia. Vence en 10 minutos.</p>
<p style="font-size:34px;font-weight:bold;letter-spacing:10px;margin:22px 0;color:#bb0f17">${esc(codigo)}</p>
<p style="font-size:13px;color:#7a7173">Si no lo pediste, ignora este correo.</p>`),
      text: `Tu código para entrar a los boletines de Sinergia es ${codigo}. Vence en 10 minutos.`
    });
    if (!enviado) return json({ ok: false, error: "No pudimos enviar el código. Escríbenos por WhatsApp." }, 503);
    return json({ ok: true });
  }

  if (d.accion === "verificar") {
    const codigo = texto(d.codigo, 6).replace(/\D/g, "");
    const guardado = JSON.parse((await kv.get("codigo:" + email)) || "null");
    if (!guardado) return json({ ok: false, error: "El código venció. Pide uno nuevo." }, 400);
    if (guardado.intentos >= 5) {
      await kv.delete("codigo:" + email);
      return json({ ok: false, error: "Demasiados intentos. Pide un código nuevo." }, 429);
    }
    if ((await sha256(email + ":" + codigo)) !== guardado.h) {
      guardado.intentos += 1;
      await kv.put("codigo:" + email, JSON.stringify(guardado), { expirationTtl: 600 });
      return json({ ok: false, error: "Código incorrecto." }, 400);
    }
    await kv.delete("codigo:" + email);
    const token = aleatorioHex(32);
    await kv.put("ses:" + (await sha256(token)), email, { expirationTtl: DIAS_SESION * 86400 });
    return json({ ok: true }, 200, {
      "Set-Cookie": `sg_ses=${token}; Path=/; Max-Age=${DIAS_SESION * 86400}; HttpOnly; Secure; SameSite=Lax`
    });
  }

  return json({ ok: false, error: "Acción desconocida" }, 400);
}
