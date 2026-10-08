/*
  GET /api/boletines                 → lista de boletines (solo con sesión de suscriptor).
  GET /api/boletines?id=<archivo>    → un archivo subido desde el panel /admin (PDF o imagen).
  GET /api/boletines?archivo=x.pdf   → un PDF antiguo de boletines-privados/ (agrega &descargar=1 para descargarlo).

  Los boletines nuevos se suben desde /admin (ver lib/boletines.js). Los antiguos viven en boletines-privados/,
  carpeta bloqueada al público por _middleware.js.
*/
import { json, emailDeSesion } from "../../lib/servidor.js";
import { leerLista, listaPublica, TIPOS_PERMITIDOS, nombreSeguro } from "../../lib/boletines.js";

const CABECERAS_ARCHIVO = {
  "Cache-Control": "private, max-age=3600",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
  "Cross-Origin-Resource-Policy": "same-origin"
};

export async function onRequestGet({ request, env }) {
  const email = await emailDeSesion(request, env);
  if (!email) return json({ ok: false, error: "Inicia sesión" }, 401);

  const url = new URL(request.url);
  const modo = url.searchParams.get("descargar") ? "attachment" : "inline";

  // Archivo subido desde el panel
  const id = url.searchParams.get("id");
  if (id !== null) {
    if (!/^[a-f0-9]{32}$/.test(id)) return json({ ok: false, error: "No existe" }, 404);
    const lista = await leerLista(env);
    const dueno = lista.find((b) => (b.archivos || []).some((a) => a.id === id));
    if (!dueno) return json({ ok: false, error: "No existe" }, 404);
    const { value, metadata } = await env.SUSCRIPTORES.getWithMetadata("bolarch:" + id, { type: "stream" });
    if (!value || !metadata || !TIPOS_PERMITIDOS[metadata.tipo]) return json({ ok: false, error: "No existe" }, 404);
    const nombre = nombreSeguro(metadata.nombre, TIPOS_PERMITIDOS[metadata.tipo].ext);
    const cabeceras = { ...CABECERAS_ARCHIVO, "Content-Type": metadata.tipo, "Content-Disposition": `${modo}; filename="${nombre}"` };
    // El visor de PDF del navegador no abre documentos con "sandbox"; a los PDF no se les pone esa regla
    if (metadata.tipo === "application/pdf") delete cabeceras["Content-Security-Policy"];
    return new Response(value, { headers: cabeceras });
  }

  const { items, antiguos } = await listaPublica(env, request);

  // PDF antiguo publicado con GitHub
  const archivo = url.searchParams.get("archivo");
  if (!archivo) return json({ ok: true, email, boletines: items });

  const item = antiguos.find((b) => b.archivo === archivo);
  if (!item || !/^[\w.-]+\.pdf$/i.test(archivo)) return json({ ok: false, error: "No existe" }, 404);
  const pdf = await env.ASSETS.fetch(new URL("/boletines-privados/" + archivo, url));
  if (!pdf.ok) return json({ ok: false, error: "No existe" }, 404);
  return new Response(pdf.body, {
    headers: { "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin", "Cache-Control": "private, no-store", "Content-Type": "application/pdf", "Content-Disposition": `${modo}; filename="${archivo}"` }
  });
}
