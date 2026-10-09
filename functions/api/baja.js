/*
  /api/baja?e=<correo>&t=<firma> — darse de baja de los correos de novedades (enlace al pie de cada aviso).
  GET muestra un botón de confirmación (así los antivirus que abren enlaces no dan de baja a nadie por error);
  POST hace la baja. La firma impide dar de baja a otra persona.
*/
import { correoValido, esc, mismoOrigen } from "../../lib/servidor.js";
import { firmaValida, darDeBaja } from "../../lib/suscriptores.js";

function pagina(titulo, cuerpo, estado = 200) {
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(titulo)} · Sinergia</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#faf7f4;color:#141112;font:18px/1.6 Arial,Helvetica,sans-serif;padding:24px}main{max-width:460px;background:#fff;padding:36px;border-top:6px solid #bb0f17}h1{font-size:24px;margin:0 0 12px}button,a.b{display:inline-block;margin-top:16px;padding:14px 22px;border:0;background:#bb0f17;color:#fff;font:bold 16px Arial,sans-serif;cursor:pointer;text-decoration:none}</style></head>
<body><main><h1>${esc(titulo)}</h1>${cuerpo}</main></body></html>`, {
    status: estado,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "no-referrer"
    }
  });
}

async function revisar(env, url) {
  const email = String(url.searchParams.get("e") || "").toLowerCase().slice(0, 120);
  const t = String(url.searchParams.get("t") || "");
  if (!env.SUSCRIPTORES || !correoValido(email) || !(await firmaValida(env, email, t))) return null;
  return { email, t };
}

const invalido = () => pagina("Enlace no válido", "<p>Este enlace no es válido. Si quieres dejar de recibir nuestros correos, escríbenos a info@sinergia.ec o por WhatsApp al 096 909 4855.</p>", 400);

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const d = await revisar(env, url);
  if (!d) return invalido();
  return pagina("¿Dejar de recibir novedades?", `<p>Ya no enviaremos boletines ni novedades por correo a <strong>${esc(d.email)}</strong>. Tu cuenta para leer los boletines en la web sigue activa.</p>
<form method="post" action="/api/baja?e=${encodeURIComponent(d.email)}&amp;t=${d.t}"><button type="submit">Sí, darme de baja</button></form>`);
}

export async function onRequestPost({ request, env }) {
  if (!mismoOrigen(request)) return invalido();
  const d = await revisar(env, new URL(request.url));
  if (!d) return invalido();
  await darDeBaja(env, d.email);
  return pagina("Listo, te diste de baja", `<p>No recibirás más correos de novedades en <strong>${esc(d.email)}</strong>. Si cambias de opinión, puedes volver a suscribirte en la web.</p><a class="b" href="/">Ir a la web</a>`);
}
