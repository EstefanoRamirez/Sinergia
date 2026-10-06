/*
  GET /producto?id=...  — ficha de producto preparada para Google y para compartir.

  La ficha normalmente se dibuja en el navegador con JavaScript. Esta función, antes de
  enviar la página, le escribe el título, la descripción, la imagen para compartir
  (WhatsApp, Facebook), los datos estructurados de producto y el contenido básico,
  para que Google y las vistas previas vean el producto sin esperar a JavaScript.
  No hay que tocar nada aquí: lee los datos de js/productos.js.
*/

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const pagina = await env.ASSETS.fetch(new Request(new URL("/producto", url), request));

  let catalogo;
  try {
    catalogo = await cargarCatalogo(url, env);
  } catch (e) {
    return pagina;
  }

  const p = catalogo.productos.find((x) => x.id === url.searchParams.get("id"));
  if (!p) {
    return new HTMLRewriter()
      .on("head", { element: (el) => el.append('<meta name="robots" content="noindex">', { html: true }) })
      .transform(new Response(pagina.body, { status: 404, headers: pagina.headers }));
  }

  const origen = url.origin;
  const direccion = `${origen}/producto?id=${encodeURIComponent(p.id)}`;
  const imagen = origen + "/" + (p.imagenCompartir || p.imagenes[0]).replace(/\.webp$/, ".jpg");
  const categoria = catalogo.categorias[p.categoria] || "";
  const titulo = `${p.nombre} · Colchones Medicol`;
  const precio = p.precio == null ? "Precio a consultar" : `$${Number(p.precio).toFixed(2)}`;
  const descripcion = `${p.resumen} ${precio}. Envíos en Quito y retiro en tienda.`;

  const datos = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    description: p.resumen,
    image: p.imagenes.map((i) => origen + "/" + i),
    category: categoria,
    brand: { "@type": "Brand", name: "Medicol" },
    sku: p.id
  };
  if (p.precio != null) {
    datos.offers = {
      "@type": "Offer",
      price: Number(p.precio).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: direccion,
      seller: { "@type": "Organization", name: "Colchones Medicol" }
    };
  }

  const contenido = `<div class="mc-product mc-product-ssr">
      <div class="mc-gallery"><img src="/${esc(p.imagenes[0])}" alt="${esc(p.nombre)}" width="800" height="800"></div>
      <div class="mc-product-info">
        <span class="mc-product-cat">${esc(categoria)}</span>
        <h1>${esc(p.nombre)}</h1>
        <div class="mc-product-price"><strong>${esc(precio)}</strong></div>
        <p class="mc-product-summary">${esc(p.resumen)}</p>
        <ul class="mc-checks">${p.caracteristicas.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      </div>
    </div>`;

  const meta = (valor) => ({ element: (el) => { el.setAttribute("content", valor); } });

  return new HTMLRewriter()
    .on("title", { element: (el) => el.setInnerContent(titulo) })
    .on('meta[name="description"]', meta(descripcion))
    .on('meta[property="og:title"]', meta(titulo))
    .on('meta[property="og:description"]', meta(descripcion))
    .on('meta[property="og:image"]', meta(imagen))
    .on('meta[property="og:image:width"]', { element: (el) => el.remove() })
    .on('meta[property="og:image:height"]', { element: (el) => el.remove() })
    .on('meta[property="og:image:alt"]', meta(p.nombre))
    .on('meta[property="og:type"]', meta("product"))
    .on("head", {
      element: (el) => {
        el.append(`<link rel="canonical" href="${esc(direccion)}">`, { html: true });
        el.append(`<meta property="og:url" content="${esc(direccion)}">`, { html: true });
        el.append(`<script type="application/ld+json">${JSON.stringify(datos).replace(/</g, "\\u003c")}</script>`, { html: true });
      }
    })
    .on("[data-crumb-name]", { element: (el) => el.setInnerContent(p.nombre) })
    .on("[data-crumb-cat]", {
      element: (el) => {
        el.setInnerContent(categoria);
        el.setAttribute("href", `tienda.html?cat=${p.categoria}`);
      }
    })
    .on("#mc-product", { element: (el) => el.setInnerContent(contenido, { html: true }) })
    .transform(pagina);
}

async function cargarCatalogo(url, env) {
  const res = await env.ASSETS.fetch(new URL("/js/productos.js", url));
  const src = await res.text();
  const inicio = src.indexOf("{", src.indexOf("window.MEDICOL"));
  return JSON.parse(src.slice(inicio, src.lastIndexOf("}") + 1));
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
