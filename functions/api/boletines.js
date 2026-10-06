/*
  GET /api/boletines                 → lista de boletines (solo con sesión de suscriptor).
  GET /api/boletines?archivo=x.pdf   → muestra el PDF (agrega &descargar=1 para descargarlo).

  Los PDF y la lista viven en boletines-privados/ (bloqueada al público por _middleware.js).
  Para publicar un boletín: guarda el PDF en esa carpeta y agrégalo a boletines-privados/lista.json.
*/
import { json, emailDeSesion } from "../../lib/servidor.js";

export async function onRequestGet({ request, env }) {
  const email = await emailDeSesion(request, env);
  if (!email) return json({ ok: false, error: "Inicia sesión" }, 401);

  const url = new URL(request.url);
  const res = await env.ASSETS.fetch(new URL("/boletines-privados/lista.json", url));
  const lista = res.ok ? await res.json().catch(() => []) : [];
  const boletines = Array.isArray(lista) ? lista : [];

  const archivo = url.searchParams.get("archivo");
  if (!archivo) return json({ ok: true, email, boletines });

  const item = boletines.find((b) => b.archivo === archivo);
  if (!item || !/^[\w.-]+\.pdf$/i.test(archivo)) return json({ ok: false, error: "No existe" }, 404);
  const pdf = await env.ASSETS.fetch(new URL("/boletines-privados/" + archivo, url));
  if (!pdf.ok) return json({ ok: false, error: "No existe" }, 404);
  const modo = url.searchParams.get("descargar") ? "attachment" : "inline";
  return new Response(pdf.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${modo}; filename="${archivo}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
