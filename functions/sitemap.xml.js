/*
  GET /sitemap.xml — lista de páginas para Google.
  Si agregas una página nueva en plantillas/paginas/, súmala aquí.
*/

const PAGINAS = [
  ["/", "1.0", "monthly"],
  ["/servicios", "0.9", "monthly"],
  ["/webinars", "0.9", "weekly"],
  ["/nosotros", "0.8", "yearly"],
  ["/clientes", "0.7", "monthly"],
  ["/testimonios", "0.7", "monthly"],
  ["/galeria", "0.6", "monthly"],
  ["/biblioteca", "0.6", "monthly"],
  ["/boletines", "0.5", "monthly"],
  ["/contacto", "0.8", "yearly"],
  ["/privacidad", "0.2", "yearly"],
  ["/terminos", "0.2", "yearly"],
  ["/cookies", "0.1", "yearly"]
];

export function onRequestGet({ request }) {
  const origen = new URL(request.url).origin;
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    PAGINAS.map(([ruta, prioridad, frecuencia]) =>
      `  <url><loc>${origen}${ruta}</loc><changefreq>${frecuencia}</changefreq><priority>${prioridad}</priority></url>`).join("\n") +
    "\n</urlset>\n";

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" }
  });
}
