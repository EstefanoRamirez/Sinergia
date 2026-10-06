/*
  Bloquea archivos internos del proyecto para que no se vean en la web
  (guía de publicación, código del servidor, notas).
  Solo se ejecuta en las rutas listadas en _routes.json.
*/

const PRIVADO = [/^\/docs(\/|$)/i, /^\/plantillas(\/|$)/i,/^\/functions(\/|$)/i, /^\/originales(\/|$)/i, /^\/readme(\.md)?$/i, /^\/\.git/i];

export async function onRequest({ request, next }) {
  const ruta = new URL(request.url).pathname;
  if (PRIVADO.some((r) => r.test(ruta))) {
    return new Response("No encontrado", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return next();
}
