/*
  Funciones compartidas por las funciones de Cloudflare (functions/api/*).
  Esta carpeta no se publica: functions/_middleware.js la bloquea.

  Variables de entorno (Cloudflare → Pages → proyecto → Settings → Variables and Secrets):
    RESEND_API_KEY     Clave de Resend para enviar correos (secreta).
    EMAIL_FROM         Remitente, p. ej. "Sinergia <web@sinergia.ec>".
    EMAIL_TO           Correos que reciben inscripciones y mensajes, separados por coma.
    PLANILLA_URL       Dirección de la aplicación web de Google Apps Script (docs/planilla-inscripciones.gs).
    PLANILLA_CLAVE     La misma clave escrita en ese script (secreta).
    WHATSAPP_AVISOS    Aviso por WhatsApp al dueño con CallMeBot: "593969094855:CLAVE" (secreta).
    WA_TOKEN, WA_PHONE_ID, WA_PLANTILLA
                       Opcional: WhatsApp Cloud API de Meta para escribirle automáticamente al cliente
                       con una plantilla aprobada (ver docs/DESPLIEGUE.md).
  Enlace (binding) de KV: SUSCRIPTORES → guarda suscriptores, códigos de acceso y sesiones.
*/

export const SITIO = "https://www.sinergia.ec";
export const WHATSAPP_SINERGIA = "593969094855";

export function json(datos, estado = 200, extra = {}) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra }
  });
}

export async function leerJson(request, max = 10000) {
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
export async function permitir(env, clave, maximo, segundos) {
  if (!env.SUSCRIPTORES) return true;
  const k = "lim:" + clave;
  const n = parseInt(await env.SUSCRIPTORES.get(k), 10) || 0;
  if (n >= maximo) return false;
  await env.SUSCRIPTORES.put(k, String(n + 1), { expirationTtl: Math.max(60, segundos) });
  return true;
}

export async function enviarCorreo(env, { to, subject, html, text, reply_to }) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !to || !to.length) return false;
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

// Sesión de la zona de boletines (cookie sg_ses con un token aleatorio; en KV se guarda su huella)
export function leerCookie(request, nombre) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + nombre + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : "";
}

export async function emailDeSesion(request, env) {
  if (!env.SUSCRIPTORES) return "";
  const token = leerCookie(request, "sg_ses");
  if (!/^[a-f0-9]{64}$/.test(token)) return "";
  return (await env.SUSCRIPTORES.get("ses:" + (await sha256(token)))) || "";
}
