/*
  Aviso por correo de un boletín nuevo a quienes aceptaron recibir novedades (solo administración).

  POST { id } → envía el siguiente grupo de correos (8 por vez) y responde cuántos faltan.
               El panel lo repite solo hasta terminar. Si Gmail llega a su límite diario
               (unos 100 correos con una cuenta gratuita), se pausa y se continúa otro día.
  GET ?id=    → estado del aviso de ese boletín.

  KV: aviso:<id> → { total, enviados, pendientes: [correos], inicio, fin? } (metadatos: { total, enviados })
*/
import { json, leerJson, esc, fechaEcuador, enviarCorreo, puedeEnviarCorreo, marcoCorreo, botonCorreo } from "../../../lib/servidor.js";
import { autorizar } from "../../../lib/admin.js";
import { leerLista, fechaLegible } from "../../../lib/boletines.js";
import { leerSuscriptores, enlaceBaja } from "../../../lib/suscriptores.js";

const LOTE = 8;

const resumen = (a) => ({ total: a.total, enviados: a.enviados, faltan: a.pendientes.length, inicio: a.inicio, fin: a.fin || "" });

async function guardar(kv, id, a) {
  await kv.put("aviso:" + id, JSON.stringify(a), { metadata: { total: a.total, enviados: a.enviados, faltan: a.pendientes.length } });
}

export async function onRequest({ request, env }) {
  const auth = await autorizar(request, env);
  if (auth.error) return auth.error;
  const kv = env.SUSCRIPTORES;

  if (request.method === "GET") {
    const id = new URL(request.url).searchParams.get("id") || "";
    const a = JSON.parse((await kv.get("aviso:" + id)) || "null");
    return json({ ok: true, aviso: a ? resumen(a) : null });
  }
  if (request.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  const d = await leerJson(request, 1000);
  const id = d && typeof d.id === "string" ? d.id : "";
  const b = (await leerLista(env)).find((x) => x.id === id);
  if (!b) return json({ ok: false, error: "Ese boletín ya no existe." }, 404);
  if (!puedeEnviarCorreo(env)) return json({ ok: false, error: "El envío de correos aún no está activado (falta conectar la hoja de Google)." }, 503);

  // Evita que dos personas envíen el mismo aviso a la vez
  if (await kv.get("aviso-enviando:" + id)) return json({ ok: false, error: "Ese aviso ya se está enviando. Espera un momento." }, 409);
  await kv.put("aviso-enviando:" + id, "1", { expirationTtl: 60 });

  try {
    let a = JSON.parse((await kv.get("aviso:" + id)) || "null");
    if (!a) {
      const destinatarios = (await leerSuscriptores(env)).filter((s) => s.novedades).map((s) => s.email);
      a = { total: destinatarios.length, enviados: 0, pendientes: destinatarios, inicio: fechaEcuador(), por: auth.email };
    }

    const origen = new URL(request.url).origin;
    const enlace = `${origen}/boletines`;
    const fecha = fechaLegible(b.fecha);
    let pausado = false;
    for (let i = 0; i < LOTE && a.pendientes.length; i++) {
      const email = a.pendientes[0];
      const baja = await enlaceBaja(env, origen, email);
      const ok = await enviarCorreo(env, {
        to: [email],
        subject: `Nuevo boletín: ${b.titulo} · Sinergia`,
        html: marcoCorreo("Tenemos un boletín nuevo para ti", `<p style="font-size:17px;font-weight:bold;margin:0 0 6px">${esc(b.titulo)}</p>
<p style="font-size:13px;color:#7a7173;margin:0 0 14px">${esc(fecha)}</p>
${b.resumen ? `<p style="font-size:15px;line-height:1.6">${esc(b.resumen)}</p>` : ""}
${botonCorreo(enlace, "Leer el boletín")}
<p style="font-size:12px;color:#7a7173;margin-top:22px;line-height:1.5">Recibes este correo porque aceptaste recibir novedades de Sinergia. Si ya no quieres recibirlos, <a href="${esc(baja)}" style="color:#7a7173">date de baja aquí</a>.</p>`),
        text: `Nuevo boletín de Sinergia: ${b.titulo} (${fecha}).\n${b.resumen ? b.resumen + "\n" : ""}Léelo en ${enlace}\n\nPara no recibir más estos correos: ${baja}`
      });
      if (!ok) { pausado = true; break; }
      a.pendientes.shift();
      a.enviados++;
    }
    if (!a.pendientes.length && !a.fin) a.fin = fechaEcuador();
    await guardar(kv, id, a);
    return json({ ok: true, aviso: resumen(a), pausado });
  } finally {
    await kv.delete("aviso-enviando:" + id);
  }
}
