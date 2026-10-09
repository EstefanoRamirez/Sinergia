/*
  /api/admin/calendario — editar el calendario de clases desde el panel (solo administración).
  GET → { sesiones, destacado } (de KV, o del archivo datos/calendario.json si aún no se editó)
  PUT { sesiones: [{ fecha, inicio, fin, taller, detalle }], destacado: { texto, hasta } } → guarda.
*/
import { json, leerJson, fechaEcuador } from "../../../lib/servidor.js";
import { autorizar } from "../../../lib/admin.js";
import { leerCalendario, limpiarCalendario } from "../../../lib/calendario.js";

export async function onRequest({ request, env }) {
  const auth = await autorizar(request, env);
  if (auth.error) return auth.error;

  if (request.method === "GET") {
    let c = await leerCalendario(env);
    if (!c && env.ASSETS) {
      try {
        const r = await env.ASSETS.fetch(new URL("/datos/calendario.json", request.url));
        if (r.ok) c = await r.json();
      } catch (e) { c = null; }
    }
    c = c || { sesiones: [] };
    return json({ ok: true, sesiones: c.sesiones || [], destacado: c.destacado || null, editado: c.editado || "", editadoPor: c.editadoPor || "" });
  }

  if (request.method === "PUT") {
    const d = await leerJson(request, 120000);
    const r = limpiarCalendario(d);
    if (r.error) return json({ ok: false, error: r.error }, 400);
    const datos = { ...r.datos, editado: fechaEcuador(), editadoPor: auth.email };
    await env.SUSCRIPTORES.put("cal:datos", JSON.stringify(datos));
    return json({ ok: true, ...datos });
  }

  return json({ ok: false, error: "Método no permitido" }, 405);
}
