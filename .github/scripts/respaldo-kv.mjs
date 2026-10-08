// Descarga los suscriptores y cuentas de la base KV de Cloudflare a un archivo JSON
// (formato compatible con "wrangler kv bulk put" para restaurarlo). Lo usa .github/workflows/respaldo.yml.
// Omite los datos temporales: límites de intentos (lim:), sesiones abiertas (ses:) y enlaces de recuperación (rec:).
// Los archivos de boletines (bolarch:) se guardan en base64 con sus metadatos.
import { writeFileSync } from "node:fs";

const { CF_API_TOKEN, CF_ACCOUNT_ID, KV_NAMESPACE_ID } = process.env;
if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !KV_NAMESPACE_ID) {
  console.error("Faltan CF_API_TOKEN, CF_ACCOUNT_ID o KV_NAMESPACE_ID");
  process.exit(1);
}
const base = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}`;
const headers = { Authorization: `Bearer ${CF_API_TOKEN}` };

const claves = [];
let cursor = "";
do {
  const res = await fetch(`${base}/keys?limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, { headers });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error("No se pudo listar las claves: " + JSON.stringify(j.errors || res.status));
  claves.push(...j.result.map((k) => ({ name: k.name, metadata: k.metadata })));
  cursor = (j.result_info && j.result_info.cursor) || "";
} while (cursor);

const guardar = claves.filter((k) => !/^(lim|ses|rec):/.test(k.name));
const datos = [];
for (const { name: key, metadata } of guardar) {
  const res = await fetch(`${base}/values/${encodeURIComponent(key)}`, { headers });
  if (!res.ok) throw new Error(`No se pudo leer ${key}: ${res.status}`);
  const fila = key.startsWith("bolarch:")
    ? { key, value: Buffer.from(await res.arrayBuffer()).toString("base64"), base64: true }
    : { key, value: await res.text() };
  if (metadata) fila.metadata = metadata;
  datos.push(fila);
}
writeFileSync("respaldo-kv.json", JSON.stringify(datos, null, 1));
console.log(`Respaldo listo: ${datos.length} registros (de ${claves.length} claves en total).`);
