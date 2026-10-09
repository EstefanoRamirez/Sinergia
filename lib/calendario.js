/*
  Calendario de clases (lo edita el equipo en /admin). Se guarda en KV como cal:datos:
    { sesiones: [{ fecha, inicio, fin, taller, detalle }], destacado: { texto, hasta } | null, editado, editadoPor }
  Mientras nadie lo edite desde el panel, la web usa el archivo datos/calendario.json.
*/
import { texto } from "./servidor.js";
import { fechaValida } from "./admin.js";

export const MAX_SESIONES = 300;
const hora = (h) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(h || "") ? h : "");

// Revisa y limpia lo que llega del panel. Devuelve { datos } o { error }.
export function limpiarCalendario(d) {
  if (!d || !Array.isArray(d.sesiones)) return { error: "Datos inválidos." };
  if (d.sesiones.length > MAX_SESIONES) return { error: `Máximo ${MAX_SESIONES} clases.` };
  const sesiones = [];
  for (const s of d.sesiones) {
    if (!s || typeof s !== "object") continue;
    const fecha = texto(s.fecha, 10);
    const taller = texto(s.taller, 100);
    if (!fecha && !taller) continue; // fila vacía
    if (!fechaValida(fecha)) return { error: `Revisa la fecha de «${taller || "una clase"}».` };
    if (!taller) return { error: `Escribe el nombre del taller del ${fecha}.` };
    const inicio = hora(s.inicio), fin = hora(s.fin);
    if (s.inicio && !inicio) return { error: `Revisa la hora de inicio del ${fecha}.` };
    if (s.fin && !fin) return { error: `Revisa la hora de fin del ${fecha}.` };
    sesiones.push({ fecha, inicio, fin, taller, detalle: texto(s.detalle, 140) });
  }
  sesiones.sort((a, b) => (a.fecha + a.inicio).localeCompare(b.fecha + b.inicio));
  let destacado = null;
  if (d.destacado && typeof d.destacado === "object") {
    const t = texto(d.destacado.texto, 120);
    const hasta = texto(d.destacado.hasta, 10);
    if (hasta && !fechaValida(hasta)) return { error: "Revisa la fecha «hasta» del aviso destacado." };
    if (t) destacado = { texto: t, hasta };
  }
  return { datos: { sesiones, destacado } };
}

export async function leerCalendario(env) {
  if (!env.SUSCRIPTORES) return null;
  return JSON.parse((await env.SUSCRIPTORES.get("cal:datos")) || "null");
}
