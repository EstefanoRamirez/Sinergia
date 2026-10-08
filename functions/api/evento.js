/*
  POST /api/evento — cuenta los clics en los botones de WhatsApp de la web (medición de conversiones).

  La página lo envía con navigator.sendBeacon: { evento: "whatsapp", pagina: "/webinars", boton: "Pedir Información" }.
  No guarda datos personales ni usa cookies: solo fecha, página y texto del botón, en la pestaña
  "Clics WhatsApp" de la hoja de cálculo (si está configurada).
*/
import { fechaEcuador, texto } from "../../lib/servidor.js";

const EVENTOS = ["whatsapp"];

export async function onRequestPost({ request, env, waitUntil }) {
  // Solo se aceptan avisos enviados desde la propia web
  const origen = request.headers.get("Origin") || request.headers.get("Referer") || "";
  let mismoSitio = false;
  try { mismoSitio = new URL(origen).host === new URL(request.url).host; } catch (e) {}
  if (!mismoSitio) return new Response(null, { status: 403 });

  let d = null;
  try { d = JSON.parse((await request.text()).slice(0, 1000)); } catch (e) {}
  if (!d || !EVENTOS.includes(d.evento)) return new Response(null, { status: 400 });

  const pagina = /^\/[a-z0-9/-]{0,60}$/.test(d.pagina) ? d.pagina : "/";
  const boton = texto(d.boton, 60);

  if (env.PLANILLA_URL && env.PLANILLA_CLAVE) {
    const envio = fetch(env.PLANILLA_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ clave: env.PLANILLA_CLAVE, accion: "clic", fecha: fechaEcuador(), pagina, boton }),
      redirect: "follow"
    }).catch(() => {});
    if (typeof waitUntil === "function") waitUntil(envio);
  }
  return new Response(null, { status: 204 });
}
