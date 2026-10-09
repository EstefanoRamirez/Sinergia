/*
  Suscriptores (KV, enlace SUSCRIPTORES):
    sub:<correo>     → { nombre, apellido, whatsapp, novedades, alta, actualizado, consentimiento, baja? }
                       con un resumen en los metadatos ({ n, w, nov, alta }) para listar sin leer uno por uno.
    cuenta:<correo>  → cuenta con contraseña de la zona de boletines (si la creó).
    cfg:baja         → clave aleatoria para firmar los enlaces «darme de baja» de los correos.
*/
import { aleatorioHex, fechaEcuador } from "./servidor.js";

export async function guardarSuscriptor(kv, email, datos) {
  const metadata = {
    n: `${datos.nombre || ""} ${datos.apellido || ""}`.trim().slice(0, 120),
    w: String(datos.whatsapp || "").slice(0, 20),
    nov: !!datos.novedades,
    alta: String(datos.alta || "").slice(0, 40)
  };
  await kv.put("sub:" + email, JSON.stringify(datos), { metadata });
}

async function listarClaves(kv, prefijo) {
  const claves = [];
  let cursor;
  do {
    const r = await kv.list({ prefix: prefijo, cursor, limit: 1000 });
    claves.push(...r.keys);
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor && claves.length < 20000);
  return claves;
}

// Lista completa de suscriptores. Los antiguos sin metadatos se leen uno por uno (como máximo 400 por vez).
export async function leerSuscriptores(env) {
  const kv = env.SUSCRIPTORES;
  const [subs, cuentas] = await Promise.all([listarClaves(kv, "sub:"), listarClaves(kv, "cuenta:")]);
  const conCuenta = new Set(cuentas.map((k) => k.name.slice(7)));
  let lecturas = 0;
  const lista = [];
  for (const k of subs) {
    const email = k.name.slice(4);
    let m = k.metadata;
    if (!m && lecturas < 400) {
      lecturas++;
      const d = JSON.parse((await kv.get(k.name)) || "null");
      if (d) m = { n: `${d.nombre || ""} ${d.apellido || ""}`.trim(), w: d.whatsapp || "", nov: !!d.novedades, alta: d.alta || "" };
    }
    m = m || {};
    lista.push({ email, nombre: m.n || "", whatsapp: m.w || "", novedades: !!m.nov, alta: m.alta || "", cuenta: conCuenta.has(email) });
  }
  return lista;
}

// ---------- Enlace para darse de baja de los correos de novedades ----------
async function claveBaja(env) {
  let c = await env.SUSCRIPTORES.get("cfg:baja");
  if (!c) {
    c = aleatorioHex(32);
    await env.SUSCRIPTORES.put("cfg:baja", c);
  }
  return c;
}

async function firma(env, email) {
  const llave = await crypto.subtle.importKey("raw", new TextEncoder().encode(await claveBaja(env)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const f = await crypto.subtle.sign("HMAC", llave, new TextEncoder().encode("baja:" + email));
  return [...new Uint8Array(f)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function enlaceBaja(env, origen, email) {
  return `${origen}/api/baja?e=${encodeURIComponent(email)}&t=${await firma(env, email)}`;
}

export async function firmaValida(env, email, t) {
  if (!/^[a-f0-9]{32}$/.test(t || "")) return false;
  const esperada = await firma(env, email);
  let r = 0;
  for (let i = 0; i < 32; i++) r |= esperada.charCodeAt(i) ^ t.charCodeAt(i);
  return r === 0;
}

export async function darDeBaja(env, email) {
  const kv = env.SUSCRIPTORES;
  const d = JSON.parse((await kv.get("sub:" + email)) || "null");
  if (!d) return false;
  if (d.novedades) await guardarSuscriptor(kv, email, { ...d, novedades: false, baja: fechaEcuador() });
  return true;
}
