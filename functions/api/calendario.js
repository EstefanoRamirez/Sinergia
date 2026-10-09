/*
  GET /api/calendario — fechas de clases para el calendario de Webinars y la franja «Próximo programa».
  Si todavía no se editó desde el panel, responde 404 y la web usa datos/calendario.json.
*/
import { json } from "../../lib/servidor.js";
import { leerCalendario } from "../../lib/calendario.js";

export async function onRequestGet({ env }) {
  const c = await leerCalendario(env);
  if (!c) return json({ ok: false }, 404);
  return json({ ok: true, sesiones: c.sesiones || [], destacado: c.destacado || null }, 200, { "Cache-Control": "public, max-age=60" });
}
