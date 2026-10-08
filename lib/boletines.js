/*
  Boletines guardados desde el panel /admin (en la base KV de Cloudflare, enlace SUSCRIPTORES).

    bol:lista          → lista de boletines: [{ id, titulo, fecha, resumen, tipo: "pdf" | "imagenes",
                          archivos: [{ id, tipo, nombre, tam, ancho, alto }], creado, editado, editadoPor }]
    bolarch:<id>       → el archivo (PDF o imagen), con { tipo, nombre } como metadatos.

  También se leen los boletines antiguos de boletines-privados/lista.json (publicados con GitHub).
*/

export const TIPOS_PERMITIDOS = {
  "application/pdf": { max: 20 * 1024 * 1024, ext: "pdf" },
  "image/jpeg": { max: 8 * 1024 * 1024, ext: "jpg" },
  "image/png": { max: 8 * 1024 * 1024, ext: "png" },
  "image/webp": { max: 8 * 1024 * 1024, ext: "webp" }
};
export const MAX_IMAGENES = 40;

export async function leerLista(env) {
  if (!env.SUSCRIPTORES) return [];
  const l = JSON.parse((await env.SUSCRIPTORES.get("bol:lista")) || "[]");
  return Array.isArray(l) ? l : [];
}

export async function guardarLista(env, lista) {
  await env.SUSCRIPTORES.put("bol:lista", JSON.stringify(lista));
}

// Reconoce el tipo real del archivo por sus primeros bytes (no se confía en el nombre ni en lo que diga el navegador)
export function tipoReal(bytes) {
  const b = new Uint8Array(bytes.slice(0, 12));
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "application/pdf"; // %PDF-
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return "";
}

// Nombre de archivo seguro para mostrar y descargar
export function nombreSeguro(nombre, ext) {
  const base = String(nombre || "boletin").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\.[a-z0-9]{1,5}$/i, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "boletin";
  return `${base}.${ext}`;
}

// Lista para los suscriptores: boletines del panel (más nuevos primero) y luego los de GitHub
export async function listaPublica(env, request) {
  const propios = (await leerLista(env)).slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const items = propios.map((b) => {
    const base = { id: b.id, titulo: b.titulo, fecha: fechaLegible(b.fecha), resumen: b.resumen || "", tipo: b.tipo };
    if (b.tipo === "imagenes") {
      base.imagenes = (b.archivos || []).map((a) => ({ url: `/api/boletines?id=${a.id}`, ancho: a.ancho || 0, alto: a.alto || 0 }));
    } else {
      base.url = `/api/boletines?id=${(b.archivos && b.archivos[0] && b.archivos[0].id) || ""}`;
    }
    return base;
  });

  let antiguos = [];
  try {
    const res = await env.ASSETS.fetch(new URL("/boletines-privados/lista.json", request.url));
    const l = res.ok ? await res.json() : [];
    if (Array.isArray(l)) antiguos = l;
  } catch (e) {}
  antiguos.forEach((b) => {
    if (b && /^[\w.-]+\.pdf$/i.test(b.archivo)) {
      items.push({ titulo: b.titulo, fecha: b.fecha, resumen: b.resumen || "", tipo: "pdf", url: `/api/boletines?archivo=${encodeURIComponent(b.archivo)}` });
    }
  });
  return { items, antiguos };
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export function fechaLegible(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return String(iso || "");
  return `${+m[3]} de ${MESES[+m[2] - 1]} de ${m[1]}`;
}
