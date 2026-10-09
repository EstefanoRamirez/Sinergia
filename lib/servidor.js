/*
  Funciones compartidas por las funciones de Cloudflare (functions/api/*).
  Esta carpeta no se publica: functions/_middleware.js la bloquea.

  Variables de entorno (Cloudflare → Pages → proyecto → Settings → Variables and Secrets):
    ADMIN_EMAILS       Correos con acceso al panel /admin, separados por coma (p. ej. la secretaria y el desarrollador).
    CLAVE_EQUIPO       Opcional (secreta): contraseña compartida con la que esos correos entran al panel sin activar nada.
    RESEND_API_KEY     Opcional: clave de Resend para enviar correos (secreta). Si no está, los correos
                       (recuperar contraseña, avisos) se envían desde Gmail con la hoja de Google (Apps Script).
    EMAIL_FROM         Remitente, p. ej. "Sinergia <web@sinergia.ec>".
    EMAIL_TO           Correos que reciben inscripciones y mensajes, separados por coma.
    PLANILLA_URL       Dirección de la aplicación web de Google Apps Script (docs/planilla-inscripciones.gs).
    PLANILLA_CLAVE     La misma clave escrita en ese script (secreta).
    WHATSAPP_AVISOS    Aviso por WhatsApp al dueño con CallMeBot: "593969094855:CLAVE" (secreta).
    TURNSTILE_SITEKEY, TURNSTILE_SECRET
                       Opcional: antispam de Cloudflare Turnstile en formularios y registro. Solo si llega spam.
    WA_TOKEN, WA_PHONE_ID, WA_PLANTILLA
                       Opcional: WhatsApp Cloud API de Meta para escribirle automáticamente al cliente
                       con una plantilla aprobada (ver docs/DESPLIEGUE.md).
  Enlace (binding) de KV: SUSCRIPTORES → guarda suscriptores, cuentas (huellas de contraseñas) y sesiones.
*/

export const SITIO = "https://www.sinergia.ec";
export const WHATSAPP_SINERGIA = "593969094855";
// Versión de la Política de privacidad que la persona acepta en los formularios (cámbiala si la política cambia)
export const VERSION_POLITICA = "octubre de 2026";

export function textoConsentimiento(fecha) {
  return `Aceptó la Política de privacidad (versión ${VERSION_POLITICA}) el ${fecha}`;
}

export function json(datos, estado = 200, extra = {}) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra }
  });
}

export async function leerJson(request, max = 10000) {
  const largo = parseInt(request.headers.get("Content-Length") || "0", 10);
  if (largo > max) return null;
  const raw = await request.text();
  if (raw.length > max) return null;
  try {
    const d = JSON.parse(raw);
    return d && typeof d === "object" ? d : null;
  } catch (e) {
    return null;
  }
}

export function texto(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").trim().slice(0, max);
}

export function correoValido(c) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c) && c.length <= 120;
}

// 0991234567 → 593991234567 (Ecuador). Devuelve "" si no parece un número válido.
export function telefonoInternacional(tel) {
  let d = String(tel || "").replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 10) d = "593" + d.slice(1);
  if (d.length === 9 && d.startsWith("9")) d = "593" + d;
  return d.length >= 8 && d.length <= 15 ? d : "";
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function fechaEcuador() {
  const d = new Date(Date.now() - 5 * 3600 * 1000); // Ecuador: UTC−5
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export function lista(v) {
  return String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
}

export async function sha256(t) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function aleatorioHex(bytes = 32) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Límite simple de intentos por clave (por ejemplo, por IP) usando KV
// Si la base falla (por ejemplo, se acabó la cuota diaria gratuita de escrituras), no se bloquea a nadie:
// la protección principal contra abusos queda en la regla de Cloudflare (docs/DESPLIEGUE.md, paso 16).
export async function permitir(env, clave, maximo, segundos) {
  if (!env.SUSCRIPTORES) return true;
  const k = "lim:" + clave;
  try {
    const n = parseInt(await env.SUSCRIPTORES.get(k), 10) || 0;
    if (n >= maximo) return false;
    await env.SUSCRIPTORES.put(k, String(n + 1), { expirationTtl: Math.max(60, segundos) });
  } catch (e) {}
  return true;
}

// Antispam (Cloudflare Turnstile). Si no está configurado, deja pasar todo.
export async function verificarHumano(env, request, token) {
  if (!env.TURNSTILE_SECRET || !env.TURNSTILE_SITEKEY) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const cuerpo = new FormData();
    cuerpo.append("secret", env.TURNSTILE_SECRET);
    cuerpo.append("response", token);
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) cuerpo.append("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: cuerpo });
    const j = await r.json();
    return j.success === true;
  } catch (e) {
    return true; // si Cloudflare no responde, no se bloquea a personas reales (siguen los límites de intentos)
  }
}
export const MENSAJE_ROBOT = "No pudimos confirmar que no eres un robot. Recarga la página e intenta otra vez.";

// ¿Hay algún medio para enviar correos? (Resend o Gmail mediante la hoja de Google)
export function puedeEnviarCorreo(env) {
  return !!((env.RESEND_API_KEY && env.EMAIL_FROM) || (env.PLANILLA_URL && env.PLANILLA_CLAVE));
}

export async function enviarCorreo(env, { to, subject, html, text, reply_to }) {
  if (!to || !to.length) return false;
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return enviarCorreoGmail(env, { to, subject, html, text, reply_to });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html, text, reply_to })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Envío gratuito desde la cuenta de Google dueña de la hoja (MailApp de Apps Script)
async function enviarCorreoGmail(env, { to, subject, html, text, reply_to }) {
  if (!env.PLANILLA_URL || !env.PLANILLA_CLAVE) return false;
  const r = await Promise.all(to.map(async (para) => {
    try {
      const res = await fetch(env.PLANILLA_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ clave: env.PLANILLA_CLAVE, accion: "correo", para, asunto: subject, html, texto: text, responder: reply_to || "" }),
        redirect: "follow"
      });
      if (!res.ok) return false;
      const j = await res.json().catch(() => ({}));
      return j.ok === true;
    } catch (e) {
      return false;
    }
  }));
  return r.every(Boolean);
}

export async function anotarPlanilla(env, fila) {
  if (!env.PLANILLA_URL || !env.PLANILLA_CLAVE) return false;
  try {
    const res = await fetch(env.PLANILLA_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ clave: env.PLANILLA_CLAVE, ...fila }),
      redirect: "follow"
    });
    if (!res.ok) return false;
    const r = await res.json().catch(() => ({}));
    return r.ok === true;
  } catch (e) {
    return false;
  }
}

// Aviso al dueño por WhatsApp (CallMeBot). WHATSAPP_AVISOS = "593...:clave,593...:clave"
export async function avisarDueno(env, mensaje) {
  const destinos = lista(env.WHATSAPP_AVISOS);
  if (!destinos.length) return false;
  const r = await Promise.all(destinos.map(async (d) => {
    const [tel, clave] = d.split(":");
    if (!tel || !clave) return false;
    const url = "https://api.callmebot.com/whatsapp.php?phone=%2B" + encodeURIComponent(telefonoInternacional(tel)) +
      "&text=" + encodeURIComponent(mensaje) + "&apikey=" + encodeURIComponent(clave);
    try { return (await fetch(url)).ok; } catch (e) { return false; }
  }));
  return r.some(Boolean);
}

// Mensaje automático al cliente con WhatsApp Cloud API (opcional; requiere una plantilla aprobada por Meta
// con un parámetro: el nombre del cliente).
export async function escribirCliente(env, telefono, nombre) {
  if (!env.WA_TOKEN || !env.WA_PHONE_ID || !env.WA_PLANTILLA || !telefono) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${env.WA_PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telefono,
        type: "template",
        template: {
          name: env.WA_PLANTILLA,
          language: { code: "es" },
          components: [{ type: "body", parameters: [{ type: "text", text: nombre }] }]
        }
      })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Plantilla de correo sencilla con los colores de Sinergia
export function marcoCorreo(titulo, contenido) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f4efea;font-family:Arial,Helvetica,sans-serif;color:#141112">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff">
<tr><td style="background:#bb0f17;color:#ffffff;padding:22px 28px;font-size:18px;font-weight:bold;letter-spacing:4px">SINERGIA</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 18px;font-size:20px">${esc(titulo)}</h1>
${contenido}
</td></tr>
<tr><td style="padding:18px 28px;background:#141112;color:#bdb5b6;font-size:12px">Sinergia Capacitación Empresarial · Calle E8-A e Ismael Solís, Quito · (02) 219-1187</td></tr>
</table></td></tr></table></body></html>`;
}

export function botonCorreo(href, etiqueta, color = "#bb0f17") {
  return `<a href="${esc(href)}" style="display:inline-block;margin:6px 8px 6px 0;padding:12px 20px;background:${color};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px">${esc(etiqueta)}</a>`;
}

// Sesión de la zona de boletines (cookie __Host-sg_ses con un token aleatorio; en KV se guarda su huella).
// El prefijo __Host- obliga al navegador a usarla solo en este dominio exacto y por HTTPS.
export const COOKIE_SESION = "__Host-sg_ses";
export function leerCookie(request, nombre) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + nombre + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : "";
}

// Devuelve el correo de la sesión abierta, o "" si no hay sesión válida.
// La sesión guarda la "generación" de la cuenta: al cambiar la contraseña, las sesiones anteriores dejan de valer.
export async function emailDeSesion(request, env) {
  if (!env.SUSCRIPTORES) return "";
  const token = leerCookie(request, COOKIE_SESION);
  if (!/^[a-f0-9]{64}$/.test(token)) return "";
  const guardado = await env.SUSCRIPTORES.get("ses:" + (await sha256(token)));
  if (!guardado) return "";
  let ses;
  try { ses = JSON.parse(guardado); } catch (e) { ses = null; }
  if (!ses || typeof ses !== "object") return ""; // formato antiguo: se pide ingresar de nuevo
  const cuenta = JSON.parse((await env.SUSCRIPTORES.get("cuenta:" + ses.e)) || "null");
  if (!cuenta || (cuenta.gen || 0) !== ses.g) return "";
  return ses.e;
}

// Suscriptores: sesión de 30 días. Administración: sesión corta (vence a las 4 horas y la cookie se borra al cerrar
// el navegador), para que nadie pueda usar el panel si alguien se olvida de salir en una computadora ajena.
export const HORAS_SESION_ADMIN = 4;
export async function abrirSesion(env, email, gen, admin = false) {
  const token = aleatorioHex(32);
  const segundos = admin ? HORAS_SESION_ADMIN * 3600 : 30 * 86400;
  await env.SUSCRIPTORES.put("ses:" + (await sha256(token)), JSON.stringify({ e: email, g: gen || 0 }), { expirationTtl: segundos });
  return `${COOKIE_SESION}=${token}; Path=/;${admin ? "" : ` Max-Age=${segundos};`} HttpOnly; Secure; SameSite=Lax`;
}

// ¿Este correo puede administrar? Debe estar en ADMIN_EMAILS y haber confirmado su correo (enlace enviado).
export async function esAdmin(env, email) {
  if (!email) return false;
  const admins = lista(env.ADMIN_EMAILS).map((c) => c.toLowerCase());
  if (!admins.includes(email)) return false;
  const cuenta = JSON.parse((await env.SUSCRIPTORES.get("cuenta:" + email)) || "null");
  return !!(cuenta && cuenta.verificado);
}

// Protección contra envíos desde otros sitios (CSRF): si el navegador indica el origen, debe ser este mismo sitio
export function mismoOrigen(request) {
  const origen = request.headers.get("Origin");
  if (!origen) {
    const sitio = request.headers.get("Sec-Fetch-Site");
    return !sitio || sitio === "same-origin" || sitio === "none";
  }
  try { return new URL(origen).host === new URL(request.url).host; } catch (e) { return false; }
}
