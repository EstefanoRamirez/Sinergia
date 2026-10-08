/*
  GET /api/estado — revisión rápida para el monitoreo (GitHub Actions o UptimeRobot).
  Responde 200 si la web y la base de suscriptores (KV) funcionan; 503 si falta algo.
  No muestra datos ni claves: solo si cada parte está configurada.
*/
export async function onRequestGet({ env }) {
  let kv = false;
  if (env.SUSCRIPTORES) {
    try {
      await env.SUSCRIPTORES.get("estado:prueba"); // lectura de prueba (no escribe nada)
      kv = true;
    } catch (e) {
      kv = false;
    }
  }
  const estado = { ok: kv, kv, planilla: !!(env.PLANILLA_URL && env.PLANILLA_CLAVE), avisos: !!env.WHATSAPP_AVISOS };
  return new Response(JSON.stringify(estado), {
    status: kv ? 200 : 503,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
