/*
  GET /sitemap.xml — lista de páginas para Google.
  Se arma sola con js/productos.js: al agregar un producto, aparece aquí sin hacer nada más.
*/

const PAGINAS = [
  ["/", "1.0", "weekly"],
  ["/tienda", "0.9", "weekly"],
  ["/catalogo", "0.8", "monthly"],
  ["/nosotros", "0.5", "yearly"],
  ["/contacto", "0.5", "yearly"],
  ["/envios", "0.4", "yearly"],
  ["/privacidad", "0.2", "yearly"]
];

export async function onRequestGet({ request, env }) {
  const origen = new URL(request.url).origin;
  const res = await env.ASSETS.fetch(new URL("/js/productos.js", request.url));
  const src = await res.text();
  const catalogo = JSON.parse(src.slice(src.indexOf("{", src.indexOf("window.MEDICOL")), src.lastIndexOf("}") + 1));

  const urls = PAGINAS.map(([ruta, prioridad, frecuencia]) => ({ loc: origen + ruta, prioridad, frecuencia }))
    .concat(Object.keys(catalogo.categorias).map((cat) => ({
      loc: `${origen}/tienda?cat=${cat}`, prioridad: "0.8", frecuencia: "weekly"
    })))
    .concat(catalogo.productos.map((p) => ({
      loc: `${origen}/producto?id=${encodeURIComponent(p.id)}`, prioridad: p.destacado ? "0.8" : "0.7", frecuencia: "monthly"
    })));

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u.loc.replace(/&/g, "&amp;")}</loc><changefreq>${u.frecuencia}</changefreq><priority>${u.prioridad}</priority></url>`).join("\n") +
    "\n</urlset>\n";

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" }
  });
}
