/*
  Permisos del panel /admin: solo correos de ADMIN_EMAILS con el acceso activado (ver lib/servidor.js → esAdmin).
  Las peticiones que cambian algo (todo lo que no es GET) además deben venir de este mismo sitio (CSRF).
*/
import { json, emailDeSesion, esAdmin, mismoOrigen } from "./servidor.js";

export async function autorizar(request, env) {
  if (!env.SUSCRIPTORES) return { error: json({ ok: false, error: "La base de datos no está activada." }, 503) };
  if (request.method !== "GET" && !mismoOrigen(request)) return { error: json({ ok: false, error: "Origen no permitido" }, 403) };
  const email = await emailDeSesion(request, env);
  if (!email) return { error: json({ ok: false, error: "Inicia sesión" }, 401) };
  if (!(await esAdmin(env, email))) return { error: json({ ok: false, error: "Esta cuenta no tiene permisos de administración." }, 403) };
  return { email };
}

export function fechaValida(f) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f || "");
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export function hoyIso() {
  return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
}
