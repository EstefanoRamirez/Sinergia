/*
  GET /robots.txt — indica a Google qué rastrear y dónde está el sitemap.
*/

export function onRequestGet({ request }) {
  const origen = new URL(request.url).origin;
  const texto = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /docs/",
    "Disallow: /api/",
    "Disallow: /admin",
    "Disallow: /gracias",
    "",
    `Sitemap: ${origen}/sitemap.xml`,
    ""
  ].join("\n");
  return new Response(texto, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" }
  });
}
