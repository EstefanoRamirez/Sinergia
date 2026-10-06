/*
  GET /tienda[?cat=...]  — la tienda preparada para Google.
  Escribe la lista de productos (y el título de la categoría) antes de enviar la página,
  para que Google la lea sin esperar a JavaScript. En el navegador, js/tienda.js la
  vuelve a dibujar con filtros y botones. Lee los datos de js/productos.js.
*/

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const pagina = await env.ASSETS.fetch(new Request(new URL("/tienda", url), request));

  let catalogo;
  try {
    const src = await (await env.ASSETS.fetch(new URL("/js/productos.js", url))).text();
    catalogo = JSON.parse(src.slice(src.indexOf("{", src.indexOf("window.MEDICOL")), src.lastIndexOf("}") + 1));
  } catch (e) {
    return pagina;
  }

  const cat = url.searchParams.get("cat");
  const nombreCat = catalogo.categorias[cat];
  const lista = catalogo.productos.filter((p) =>
    !nombreCat || p.categoria === cat || (cat === "promociones" && p.promo));

  const tarjetas = lista.map((p) => {
    const precio = p.precio == null ? "Precio a consultar" : `$${Number(p.precio).toFixed(2)}`;
    const enlace = `producto.html?id=${encodeURIComponent(p.id)}`;
    const img = p.imagenes[0].replace(/principal\.webp$/, "principal-400.webp");
    return `<article class="mc-card">
        <a class="mc-card-media" href="${enlace}"><img src="${esc(img)}" alt="${esc(p.nombre)}" loading="lazy" width="800" height="800"></a>
        <div class="mc-card-body">
          <span class="mc-card-cat">${esc(catalogo.categorias[p.categoria] || "")}</span>
          <h3 class="mc-card-title"><a href="${enlace}">${esc(p.nombre)}</a></h3>
          <p class="mc-card-price">${esc(precio)}</p>
        </div>
      </article>`;
  }).join("");

  let rw = new HTMLRewriter()
    .on("#mc-shop-grid", { element: (el) => el.setInnerContent(tarjetas, { html: true }) })
    .on("#mc-shop-count", { element: (el) => el.setInnerContent(`<strong>${lista.length}</strong> productos`, { html: true }) })
    .on("head", {
      element: (el) => el.append(`<link rel="canonical" href="${esc(url.origin + "/tienda" + (nombreCat ? "?cat=" + cat : ""))}">`, { html: true })
    });

  if (nombreCat) {
    const titulo = `${nombreCat} · Tienda · Colchones Medicol`;
    const desc = `${nombreCat} en Colchones Medicol: ${lista.slice(0, 4).map((p) => p.nombre).join(", ")} y más. Envíos en Quito y retiro en tienda.`;
    rw = rw
      .on("title", { element: (el) => el.setInnerContent(titulo) })
      .on("#mc-shop-title", { element: (el) => el.setInnerContent(nombreCat) })
      .on('meta[name="description"]', { element: (el) => el.setAttribute("content", desc) })
      .on('meta[property="og:title"]', { element: (el) => el.setAttribute("content", titulo) })
      .on('meta[property="og:description"]', { element: (el) => el.setAttribute("content", desc) });
  }

  return rw.transform(pagina);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
