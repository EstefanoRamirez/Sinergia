/*
  GET /api/config — ajustes públicos que necesita la web.
  turnstile: clave pública de Cloudflare Turnstile (antispam). Vacía = desactivado.
*/
import { json } from "../../lib/servidor.js";

export function onRequestGet({ env }) {
  return json({ ok: true, turnstile: env.TURNSTILE_SITEKEY && env.TURNSTILE_SECRET ? env.TURNSTILE_SITEKEY : "" }, 200, { "Cache-Control": "public, max-age=300" });
}
