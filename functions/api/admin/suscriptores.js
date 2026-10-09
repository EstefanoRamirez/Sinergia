/*
  GET /api/admin/suscriptores            → lista de suscriptores (solo administración).
  GET /api/admin/suscriptores?formato=csv → la misma lista para abrir en Excel o Google Sheets.
*/
import { json } from "../../../lib/servidor.js";
import { autorizar, hoyIso } from "../../../lib/admin.js";
import { leerSuscriptores } from "../../../lib/suscriptores.js";

// Evita que una celda que empieza con = + - @ se ejecute como fórmula al abrir el archivo
const celda = (v) => {
  let t = String(v == null ? "" : v);
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export async function onRequestGet({ request, env }) {
  const auth = await autorizar(request, env);
  if (auth.error) return auth.error;
  const lista = (await leerSuscriptores(env)).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  if (new URL(request.url).searchParams.get("formato") === "csv") {
    const filas = [["Nombre", "Correo", "WhatsApp", "Acepta novedades", "Cuenta en la web", "Alta"]]
      .concat(lista.map((s) => [s.nombre, s.email, s.whatsapp ? "https://wa.me/" + s.whatsapp : "", s.novedades ? "Sí" : "No", s.cuenta ? "Sí" : "No", s.alta]));
    // Punto y coma: Excel en español (Ecuador) separa columnas así. La marca BOM hace que respete las tildes.
    const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="suscriptores-sinergia-${hoyIso()}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  }
  return json({ ok: true, suscriptores: lista });
}
