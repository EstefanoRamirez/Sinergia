/*
  /api/admin/boletines — administración de boletines (solo correos de ADMIN_EMAILS con acceso activado).

  GET                         → lista completa (con los archivos de cada boletín).
  POST   (multipart/form-data) titulo, fecha (AAAA-MM-DD), resumen, tipo ("pdf" | "imagenes"),
                               archivos (1 PDF o hasta 40 imágenes JPG/PNG/WebP), medidas (JSON [[ancho, alto], …])
                               → crea un boletín.
  PUT    (multipart/form-data) id, titulo, fecha, resumen, quitar (JSON con ids de imágenes a quitar),
                               archivos (PDF nuevo que reemplaza al anterior, o imágenes que se agregan), medidas
                               → edita un boletín.
  DELETE ?id=<boletín>         → elimina el boletín y sus archivos.

  Los archivos se revisan por sus primeros bytes (no por el nombre) y se guardan en KV (lib/boletines.js).
*/
import { json, texto, fechaEcuador, aleatorioHex, puedeEnviarCorreo } from "../../../lib/servidor.js";
import { autorizar, fechaValida, hoyIso } from "../../../lib/admin.js";
import { leerLista, guardarLista, tipoReal, TIPOS_PERMITIDOS, MAX_IMAGENES } from "../../../lib/boletines.js";

const MAX_PETICION = 90 * 1024 * 1024;

// Revisa y guarda los archivos recibidos. Devuelve { archivos } o { error }.
async function guardarArchivos(env, form, tipoBoletin) {
  const archivos = form.getAll("archivos").filter((f) => f && typeof f === "object" && typeof f.arrayBuffer === "function" && f.size > 0);
  let medidas = [];
  try { medidas = JSON.parse(String(form.get("medidas") || "[]")); } catch (e) { medidas = []; }
  const listos = [];
  for (let i = 0; i < archivos.length; i++) {
    const f = archivos[i];
    const bytes = await f.arrayBuffer();
    const tipo = tipoReal(bytes);
    if (!tipo) return { error: `«${texto(f.name, 60)}» no es un PDF ni una imagen JPG, PNG o WebP válida.` };
    if (tipoBoletin === "pdf" && tipo !== "application/pdf") return { error: "Para un boletín en PDF, sube un archivo PDF." };
    if (tipoBoletin === "imagenes" && tipo === "application/pdf") return { error: "Para un boletín con imágenes, sube solo JPG, PNG o WebP." };
    if (bytes.byteLength > TIPOS_PERMITIDOS[tipo].max) {
      return { error: `«${texto(f.name, 60)}» pesa demasiado (máximo ${TIPOS_PERMITIDOS[tipo].max / 1024 / 1024} MB).` };
    }
    const m = Array.isArray(medidas[i]) ? medidas[i] : [];
    const ancho = Math.max(0, Math.min(20000, parseInt(m[0], 10) || 0));
    const alto = Math.max(0, Math.min(20000, parseInt(m[1], 10) || 0));
    listos.push({ bytes, tipo, nombre: texto(f.name, 100), ancho, alto });
  }
  const guardados = [];
  for (const a of listos) {
    const id = aleatorioHex(16);
    await env.SUSCRIPTORES.put("bolarch:" + id, a.bytes, { metadata: { tipo: a.tipo, nombre: a.nombre } });
    guardados.push({ id, tipo: a.tipo, nombre: a.nombre, tam: a.bytes.byteLength, ancho: a.ancho, alto: a.alto });
  }
  return { archivos: guardados };
}

async function borrarArchivos(env, archivos) {
  await Promise.all((archivos || []).map((a) => env.SUSCRIPTORES.delete("bolarch:" + a.id)));
}

async function leerFormulario(request) {
  const largo = parseInt(request.headers.get("Content-Length") || "0", 10);
  if (largo > MAX_PETICION) return null;
  try { return await request.formData(); } catch (e) { return null; }
}

function datosBase(form) {
  const titulo = texto(form.get("titulo"), 120);
  const fecha = texto(form.get("fecha"), 10) || hoyIso();
  const resumen = texto(form.get("resumen"), 400);
  if (!titulo) return { error: "Escribe el título del boletín." };
  if (!fechaValida(fecha)) return { error: "Revisa la fecha." };
  return { titulo, fecha, resumen };
}

export async function onRequest({ request, env }) {
  const auth = await autorizar(request, env);
  if (auth.error) return auth.error;

  if (request.method === "GET") {
    // Junto a cada boletín va el estado de su aviso por correo (si se envió)
    const avisos = {};
    const r = await env.SUSCRIPTORES.list({ prefix: "aviso:", limit: 1000 });
    r.keys.forEach((k) => { if (k.metadata) avisos[k.name.slice(6)] = k.metadata; });
    const boletines = (await leerLista(env)).map((b) => ({ ...b, aviso: avisos[b.id] || null }));
    return json({ ok: true, email: auth.email, boletines, correo: puedeEnviarCorreo(env) });
  }

  if (request.method === "POST") {
    const form = await leerFormulario(request);
    if (!form) return json({ ok: false, error: "No se pudo leer el envío (¿archivos demasiado grandes?)." }, 400);
    const base = datosBase(form);
    if (base.error) return json({ ok: false, error: base.error }, 400);
    const tipo = form.get("tipo") === "imagenes" ? "imagenes" : "pdf";
    const cantidad = form.getAll("archivos").filter((f) => f && typeof f === "object" && f.size > 0).length;
    if (!cantidad) return json({ ok: false, error: tipo === "pdf" ? "Elige el archivo PDF." : "Elige al menos una imagen." }, 400);
    if (tipo === "pdf" && cantidad > 1) return json({ ok: false, error: "Sube un solo PDF por boletín." }, 400);
    if (tipo === "imagenes" && cantidad > MAX_IMAGENES) return json({ ok: false, error: `Máximo ${MAX_IMAGENES} imágenes por boletín.` }, 400);
    const r = await guardarArchivos(env, form, tipo);
    if (r.error) return json({ ok: false, error: r.error }, 400);
    const ahora = fechaEcuador();
    const nuevo = { id: aleatorioHex(16), ...base, tipo, archivos: r.archivos, creado: ahora, editado: ahora, editadoPor: auth.email };
    const lista = await leerLista(env);
    lista.unshift(nuevo);
    await guardarLista(env, lista);
    return json({ ok: true, boletin: nuevo });
  }

  if (request.method === "PUT") {
    const form = await leerFormulario(request);
    if (!form) return json({ ok: false, error: "No se pudo leer el envío (¿archivos demasiado grandes?)." }, 400);
    const id = texto(form.get("id"), 32);
    const lista = await leerLista(env);
    const i = lista.findIndex((b) => b.id === id);
    if (i < 0) return json({ ok: false, error: "Ese boletín ya no existe." }, 404);
    const base = datosBase(form);
    if (base.error) return json({ ok: false, error: base.error }, 400);
    const actual = lista[i];

    let quitar = [];
    try { quitar = JSON.parse(String(form.get("quitar") || "[]")); } catch (e) { quitar = []; }
    quitar = Array.isArray(quitar) ? quitar.filter((x) => typeof x === "string") : [];

    const r = await guardarArchivos(env, form, actual.tipo);
    if (r.error) return json({ ok: false, error: r.error }, 400);

    let archivos = actual.archivos || [];
    let aBorrar = [];
    if (actual.tipo === "pdf") {
      if (r.archivos.length > 1) { await borrarArchivos(env, r.archivos); return json({ ok: false, error: "Sube un solo PDF." }, 400); }
      if (r.archivos.length === 1) { aBorrar = archivos; archivos = r.archivos; }
    } else {
      aBorrar = archivos.filter((a) => quitar.includes(a.id));
      archivos = archivos.filter((a) => !quitar.includes(a.id)).concat(r.archivos);
      if (!archivos.length) { await borrarArchivos(env, r.archivos); return json({ ok: false, error: "El boletín debe tener al menos una imagen." }, 400); }
      if (archivos.length > MAX_IMAGENES) { await borrarArchivos(env, r.archivos); return json({ ok: false, error: `Máximo ${MAX_IMAGENES} imágenes por boletín.` }, 400); }
    }
    lista[i] = { ...actual, ...base, archivos, editado: fechaEcuador(), editadoPor: auth.email };
    await guardarLista(env, lista);
    await borrarArchivos(env, aBorrar);
    return json({ ok: true, boletin: lista[i] });
  }

  if (request.method === "DELETE") {
    const id = new URL(request.url).searchParams.get("id") || "";
    const lista = await leerLista(env);
    const b = lista.find((x) => x.id === id);
    if (!b) return json({ ok: false, error: "Ese boletín ya no existe." }, 404);
    await guardarLista(env, lista.filter((x) => x.id !== id));
    await borrarArchivos(env, b.archivos);
    await env.SUSCRIPTORES.delete("aviso:" + id);
    return json({ ok: true });
  }

  return json({ ok: false, error: "Método no permitido" }, 405);
}
