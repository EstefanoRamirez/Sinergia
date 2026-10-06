/*
  GET /catalogo — el catálogo preparado para Google.
  Escribe cada producto con sus características antes de enviar la página.
  En el navegador, js/tienda.js lo vuelve a dibujar con fotos y botones.
*/

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const pagina = await env.ASSETS.fetch(new Request(new URL("/catalogo", url), request));

  let catalogo;
  try {
    const src = await (await env.ASSETS.fetch(new URL("/js/productos.js", url))).text();
    catalogo = JSON.parse(src.slice(src.indexOf("{", src.indexOf("window.MEDICOL")), src.lastIndexOf("}") + 1));
  } catch (e) {
    return pagina;
  }

  const fichas = catalogo.productos.map((p) => {
    const precio = p.precio == null ? "Precio a consultar" : `$${Number(p.precio).toFixed(2)}${p.etiqueta ? " · " + p.etiqueta : ""}`;
    const img = p.imagenes[0].replace(/principal\.webp$/, "principal-400.webp");
    return `<article class="mc-sheet">
        <img src="${esc(img)}" alt="${esc(p.nombre)}" loading="lazy" width="600" height="600">
        <div><span class="mc-kicker">${esc(catalogo.categorias[p.categoria] || "")}</span>
          <h2><a href="producto.html?id=${encodeURIComponent(p.id)}">${esc(p.nombre)}</a></h2>
          <p class="mc-sheet-price">${esc(precio)}</p>
          <ul class="mc-checks">${p.caracteristicas.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
        </div>
      </article>`;
  }).join("");

  return new HTMLRewriter()
    .on("#mc-catalog", { element: (el) => el.setInnerContent(fichas, { html: true }) })
    .on("head", { element: (el) => el.append(`<link rel="canonical" href="${esc(url.origin)}/catalogo">`, { html: true }) })
    .transform(pagina);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
