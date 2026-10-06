(function () {

  "use strict";

  var DATA = window.MEDICOL;
  var CART_KEY = "medicol-carrito-v1";
  var ORDER_KEY = "medicol-ultimo-pedido";

  /* ---------- Utilidades ---------- */

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var money = function (n) {
    return "$" + Number(n).toFixed(2);
  };

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var getProduct = function (id) {
    return DATA.productos.filter(function (p) { return p.id === id; })[0];
  };

  var productUrl = function (p) {
    return "producto.html?id=" + encodeURIComponent(p.id);
  };

  var waLink = function (text) {
    return "https://wa.me/" + DATA.whatsapp + "?text=" + encodeURIComponent(text);
  };

  /* ---------- Mensajes de WhatsApp ---------- */

  // Saludo según la hora: ¡Buenos días / Buenas tardes / Buenas noches!
  var greeting = function (to) {
    var h = new Date().getHours();
    var saludo = h >= 5 && h < 12 ? "¡Buenos días" : (h >= 12 && h < 19 ? "¡Buenas tardes" : "¡Buenas noches");
    return saludo + ", " + (to || "Colchones Medicol") + "!";
  };

  // Arma un mensaje con saludo, párrafos separados y despedida
  var message = function (parts) {
    return [greeting()].concat(parts).concat(["¡Muchas gracias!"]).join("\n\n");
  };

  var optionLine = function (p, opcion) {
    return opcion ? "\n*" + (p.opciones ? p.opciones.titulo : "Opción") + ":* " + opcion : "";
  };

  var quoteText = function (p, opcion) {
    return message([
      "Me gustaría cotizar el siguiente producto:",
      "*Producto:* " + p.nombre + optionLine(p, opcion),
      "¿Podrían indicarme el precio y la disponibilidad, por favor?"
    ]);
  };

  var buyText = function (p, opcion, qty) {
    return message([
      "Me interesa comprar el siguiente producto:",
      "*Producto:* " + p.nombre + optionLine(p, opcion) +
        "\n*Cantidad:* " + (qty || 1) +
        (p.precio != null ? "\n*Precio:* " + money(p.precio) + " c/u" : ""),
      "¿Me confirman la disponibilidad, por favor?"
    ]);
  };

  var storage = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (e) { /* almacenamiento no disponible: el carrito vive solo en esta visita */ }
    }
  };

  /* ---------- Carrito ---------- */

  var memoryCart = null;

  var readCart = function () {
    var items = memoryCart || storage.get(CART_KEY, []);
    return (Array.isArray(items) ? items : []).filter(function (it) {
      var p = getProduct(it.id);
      return p && p.precio != null && it.cantidad > 0;
    });
  };

  var writeCart = function (items) {
    memoryCart = items;
    storage.set(CART_KEY, items);
    updateCartBadge();
    document.dispatchEvent(new CustomEvent("mc:cart"));
  };

  var addToCart = function (id, opcion, cantidad) {
    var p = getProduct(id);
    if (!p || p.precio == null) return;
    var items = readCart();
    var qty = Math.max(1, parseInt(cantidad, 10) || 1);
    var existing = items.filter(function (it) { return it.id === id && it.opcion === (opcion || ""); })[0];
    if (existing) {
      existing.cantidad = Math.min(99, existing.cantidad + qty);
    } else {
      items.push({ id: id, opcion: opcion || "", cantidad: Math.min(99, qty) });
    }
    writeCart(items);
    showToast(qty + " × " + p.nombre + " añadido al carrito");
  };

  var setQty = function (index, qty) {
    var items = readCart();
    if (!items[index]) return;
    qty = parseInt(qty, 10) || 0;
    if (qty <= 0) {
      items.splice(index, 1);
    } else {
      items[index].cantidad = Math.min(99, qty);
    }
    writeCart(items);
  };

  // Totales, aplicando la promoción "2do a mitad de precio" por producto
  var cartTotals = function (items) {
    var subtotal = 0;
    var perProduct = {};
    items.forEach(function (it) {
      var p = getProduct(it.id);
      subtotal += p.precio * it.cantidad;
      perProduct[it.id] = (perProduct[it.id] || 0) + it.cantidad;
    });
    var descuento = 0;
    Object.keys(perProduct).forEach(function (id) {
      var p = getProduct(id);
      if (p.promo === "segundo-mitad") {
        descuento += Math.floor(perProduct[id] / 2) * p.precio * 0.5;
      }
    });
    var unidades = items.reduce(function (n, it) { return n + it.cantidad; }, 0);
    return { subtotal: subtotal, descuento: descuento, total: subtotal - descuento, unidades: unidades };
  };

  var updateCartBadge = function () {
    var n = cartTotals(readCart()).unidades;
    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = n;
      el.setAttribute("data-count", n);
    });
    $$("[data-cart-label]").forEach(function (el) {
      el.setAttribute("aria-label", "Carrito, " + n + (n === 1 ? " producto" : " productos"));
    });
  };

  /* ---------- Aviso ---------- */

  var toastTimer;
  var showToast = function (text, sinEnlace) {
    var toast = $(".mc-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "mc-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.innerHTML = "<span>" + esc(text) + "</span>" + (sinEnlace ? "" : "<a href=\"carrito.html\">Ver carrito</a>");
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 3500);
  };

  /* ---------- Tarjeta de producto ---------- */

  var hasChoices = function (p) {
    return p.opciones && p.opciones.valores.length > 1;
  };

  var firstOption = function (p) {
    return p.opciones ? p.opciones.valores[0] : "";
  };

  var cardAction = function (p, extraClass) {
    if (p.precio == null) {
      return "<a class=\"btn-mc btn-mc-wa " + extraClass + "\" href=\"" + waLink(quoteText(p)) + "\" target=\"_blank\" rel=\"noopener\">Cotizar</a>";
    }
    if (hasChoices(p)) {
      return "<a class=\"btn-mc btn-mc-dark " + extraClass + "\" href=\"" + productUrl(p) + "\">Elegir " + esc(p.opciones.titulo.toLowerCase()) + "</a>";
    }
    return "<button type=\"button\" class=\"btn-mc btn-mc-dark " + extraClass + "\" data-add=\"" + p.id + "\">Añadir al carrito</button>";
  };

  // Versión chica de la foto principal (carrito, resumen y catálogo)
  var thumbSrc = function (p) {
    return p.imagenes[0].replace(/principal\.webp$/, "principal-400.webp");
  };

  // Foto de tarjeta: versión de 400 px en celular y la grande en pantallas amplias
  var cardImage = function (p) {
    var src = p.imagenes[0];
    var small = /principal\.webp$/.test(src) ? src.replace(/principal\.webp$/, "principal-400.webp") : "";
    return "<img src=\"" + (small || src) + "\"" +
      (small ? " srcset=\"" + small + " 400w, " + src + " 800w\" sizes=\"(min-width: 1200px) 300px, (min-width: 768px) 33vw, 50vw\"" : "") +
      " alt=\"" + esc(p.nombre) + "\" loading=\"lazy\" decoding=\"async\" width=\"800\" height=\"800\">";
  };

  var renderCard = function (p) {
    var badge = p.etiqueta ? "<span class=\"mc-badge" + (p.promo ? " mc-badge-gold" : "") + "\">" + esc(p.etiqueta) + "</span>" : "";
    var price = p.precio == null
      ? "<p class=\"mc-card-price mc-card-price-ask\">Precio a consultar</p>"
      : "<p class=\"mc-card-price\">" + money(p.precio) + (p.etiqueta === "El par" ? " <small>el par</small>" : "") + "</p>";

    return "<article class=\"mc-card\">" +
      "<a class=\"mc-card-media\" href=\"" + productUrl(p) + "\" aria-label=\"" + esc(p.nombre) + "\">" + badge +
      cardImage(p) + "</a>" +
      "<div class=\"mc-card-body\">" +
      "<span class=\"mc-card-cat\">" + esc(DATA.categorias[p.categoria]) + "</span>" +
      "<h3 class=\"mc-card-title\"><a href=\"" + productUrl(p) + "\">" + esc(p.nombre) + "</a></h3>" +
      "<div class=\"mc-card-buy\">" + price + "<div class=\"mc-card-actions\">" + cardAction(p, "btn-mc-block") + "</div></div>" +
      cardAction(p, "mc-card-mobile-btn") +
      "</div></article>";
  };

  /* ---------- Inicio y carruseles ---------- */

  var renderCarousels = function () {
    $$("[data-products]").forEach(function (el) {
      var filter = el.getAttribute("data-products");
      var list = DATA.productos.filter(function (p) {
        if (filter === "destacados") return p.destacado;
        if (filter === "todos") return true;
        return p.categoria === filter;
      });
      var slide = el.getAttribute("data-slides") !== null;
      el.innerHTML = list.map(function (p) {
        return slide ? "<div class=\"swiper-slide\">" + renderCard(p) + "</div>" : renderCard(p);
      }).join("");
    });
  };

  /* ---------- Tienda ---------- */

  var PRICE_RANGES = {
    "hasta-30": function (p) { return p.precio != null && p.precio < 30; },
    "30-80": function (p) { return p.precio != null && p.precio >= 30 && p.precio <= 80; },
    "mas-80": function (p) { return p.precio != null && p.precio > 80; },
    "consultar": function (p) { return p.precio == null; }
  };

  var inCategory = function (p, cat) {
    if (cat === "promociones") return p.categoria === "promociones" || !!p.promo;
    return p.categoria === cat;
  };

  var initShop = function () {
    var grid = $("#mc-shop-grid");
    if (!grid) return;

    var params = new URLSearchParams(window.location.search);
    var q = (params.get("q") || "").trim();
    var form = $("#mc-filters");
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    var catBox = $("#mc-filter-cats");

    catBox.innerHTML = Object.keys(DATA.categorias).map(function (key) {
      var count = DATA.productos.filter(function (p) { return inCategory(p, key); }).length;
      return "<label><input type=\"checkbox\" name=\"cat\" value=\"" + key + "\"> " + esc(DATA.categorias[key]) + " <span>" + count + "</span></label>";
    }).join("");

    var initialCat = params.get("cat");
    if (initialCat) {
      var box = form.querySelector("input[name=cat][value=\"" + initialCat + "\"]");
      if (box) box.checked = true;
    }

    var searchInput = $("#mc-search-input");
    if (searchInput && q) searchInput.value = q;

    var title = $("#mc-shop-title");
    if (title && initialCat && DATA.categorias[initialCat]) title.textContent = DATA.categorias[initialCat];

    // Nombre de la pestaña según lo que se está viendo
    if (initialCat && DATA.categorias[initialCat]) document.title = DATA.categorias[initialCat] + " · Tienda · Colchones Medicol";
    if (q) document.title = "Búsqueda: " + q + " · Tienda · Colchones Medicol";

    var normalize = function (s) {
      return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    };

    var render = function () {
      var cats = $$("input[name=cat]:checked", form).map(function (i) { return i.value; });
      var prices = $$("input[name=precio]:checked", form).map(function (i) { return i.value; });
      var sort = $("#mc-sort").value;
      var term = normalize(q);

      var list = DATA.productos.filter(function (p) {
        if (cats.length && !cats.some(function (c) { return inCategory(p, c); })) return false;
        if (prices.length && !prices.some(function (r) { return PRICE_RANGES[r](p); })) return false;
        if (term && normalize(p.nombre + " " + p.resumen + " " + DATA.categorias[p.categoria]).indexOf(term) === -1) return false;
        return true;
      });

      var priceOf = function (p) { return p.precio == null ? Infinity : p.precio; };
      if (sort === "precio-asc") list.sort(function (a, b) { return priceOf(a) - priceOf(b); });
      if (sort === "precio-desc") list.sort(function (a, b) { return (b.precio || 0) - (a.precio || 0); });
      if (sort === "nombre") list.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, "es"); });
      if (sort === "destacados") list.sort(function (a, b) { return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0); });

      $("#mc-shop-count").innerHTML = "<strong>" + list.length + "</strong> " + (list.length === 1 ? "producto" : "productos") +
        (q ? " para “" + esc(q) + "”" : "");

      grid.innerHTML = list.length ? list.map(renderCard).join("") :
        "<div class=\"mc-empty\" style=\"grid-column:1/-1\"><h2>Sin resultados</h2><p>Prueba con otro filtro o escríbenos por WhatsApp y te ayudamos a encontrarlo.</p>" +
        "<a class=\"btn-mc btn-mc-wa\" href=\"" + waLink(message([q ? "Estoy buscando el siguiente producto: *" + q + "*." : "Estoy buscando un producto y no lo encuentro en la tienda.", "¿Podrían ayudarme, por favor?"])) + "\" target=\"_blank\" rel=\"noopener\">Preguntar por WhatsApp</a></div>";
    };

    form.addEventListener("change", render);
    $("#mc-sort").addEventListener("change", render);
    $("#mc-filter-clear").addEventListener("click", function () {
      $$("input", form).forEach(function (i) { i.checked = false; });
      q = "";
      if (searchInput) searchInput.value = "";
      if (title) title.textContent = "Tienda";
      document.title = "Tienda · Colchones Medicol";
      window.history.replaceState(null, "", "tienda.html");
      render();
    });

    var toggle = $("#mc-filter-toggle");
    toggle.addEventListener("click", function () {
      var open = form.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    render();
  };

  /* ---------- Ficha de producto ---------- */

  var initProduct = function () {
    var root = $("#mc-product");
    if (!root) return;

    var id = new URLSearchParams(window.location.search).get("id");
    var p = getProduct(id);

    if (!p) {
      root.innerHTML = "<div class=\"mc-empty\"><h2>Producto no encontrado</h2><p>Puede que el enlace haya cambiado.</p>" +
        "<a class=\"btn-mc btn-mc-dark\" href=\"tienda.html\">Ir a la tienda</a></div>";
      return;
    }

    document.title = p.nombre + " · Colchones Medicol";
    var meta = $("meta[name=description]");
    if (meta) meta.setAttribute("content", p.resumen);
    $$("[data-crumb-cat]").forEach(function (a) {
      a.textContent = DATA.categorias[p.categoria];
      a.href = "tienda.html?cat=" + p.categoria;
    });
    $$("[data-crumb-name]").forEach(function (el) { el.textContent = p.nombre; });

    var slides = p.imagenes.map(function (src, i) {
      return "<div class=\"swiper-slide\"><img src=\"" + src + "\" alt=\"" + esc(p.nombre) + (i ? " — imagen " + (i + 1) : "") + "\"" + (i ? " loading=\"lazy\"" : "") + "></div>";
    }).join("");

    var options = "";
    if (p.opciones) {
      options = "<div class=\"mc-product-block\"><span class=\"mc-label\" id=\"mc-opt-label\">" + esc(p.opciones.titulo) + "</span>" +
        "<div class=\"mc-options\" role=\"radiogroup\" aria-labelledby=\"mc-opt-label\">" +
        p.opciones.valores.map(function (v, i) {
          return "<label><input type=\"radio\" name=\"opcion\" value=\"" + esc(v) + "\"" + (i === 0 ? " checked" : "") + "><span>" + esc(v) + "</span></label>";
        }).join("") + "</div></div>";
    }

    var priceHtml = p.precio == null
      ? "<strong>Precio a consultar</strong>"
      : "<strong>" + money(p.precio) + "</strong>" + (p.etiqueta ? "<span class=\"mc-badge" + (p.promo ? " mc-badge-gold" : "") + "\">" + esc(p.etiqueta) + "</span>" : "");

    var deal = "";
    if (p.promo === "segundo-mitad") {
      deal = "<div class=\"mc-deal\"><strong>Promoción:</strong> llévate 2 por <strong>" + money(p.precio * 1.5) + "</strong> y ahorra " + money(p.precio / 2) + ". El descuento se aplica solo en el carrito." +
        "<br><button type=\"button\" data-add=\"" + p.id + "\" data-qty=\"2\">Añadir 2 al carrito</button></div>";
    }

    var buy = p.precio == null
      ? "<div class=\"mc-buy\"><a class=\"btn-mc btn-mc-wa\" id=\"mc-wa-buy\" href=\"" + waLink(quoteText(p, firstOption(p))) + "\" target=\"_blank\" rel=\"noopener\">" + waIcon() + " Cotizar por WhatsApp</a></div>"
      : "<div class=\"mc-buy\">" +
        "<div class=\"mc-qty\"><button type=\"button\" data-step=\"-1\" aria-label=\"Quitar uno\">−</button>" +
        "<input type=\"number\" id=\"mc-qty\" value=\"1\" min=\"1\" max=\"99\" inputmode=\"numeric\" aria-label=\"Cantidad\">" +
        "<button type=\"button\" data-step=\"1\" aria-label=\"Añadir uno\">+</button></div>" +
        "<button type=\"button\" class=\"btn-mc btn-mc-dark\" id=\"mc-add\">Añadir al carrito</button>" +
        "<a class=\"btn-mc btn-mc-wa btn-mc-block\" id=\"mc-wa-buy\" href=\"#\" target=\"_blank\" rel=\"noopener\">" + waIcon() + " Comprar por WhatsApp</a>" +
        "</div>" + deal;

    root.innerHTML =
      "<div class=\"mc-product\">" +
        "<div class=\"mc-gallery\">" +
          "<div class=\"swiper mc-gallery-main\"><div class=\"swiper-wrapper\">" + slides + "</div>" +
          (p.imagenes.length > 1 ? "<div class=\"swiper-button-prev\"></div><div class=\"swiper-button-next\"></div>" : "") + "</div>" +
          (p.imagenes.length > 1 ? "<div class=\"swiper mc-gallery-thumbs\"><div class=\"swiper-wrapper\">" + slides + "</div></div>" : "") +
        "</div>" +
        "<div class=\"mc-product-info\">" +
          "<a class=\"mc-product-cat\" href=\"tienda.html?cat=" + p.categoria + "\">" + esc(DATA.categorias[p.categoria]) + "</a>" +
          "<h1>" + esc(p.nombre) + "</h1>" +
          "<div class=\"mc-product-price\">" + priceHtml + "</div>" +
          "<p class=\"mc-product-summary\">" + esc(p.resumen) + "</p>" +
          options +
          "<div class=\"mc-product-block\">" + buy + "</div>" +
          "<ul class=\"mc-trust\">" +
            "<li><svg class=\"icon\" aria-hidden=\"true\"><use href=\"#i-truck\"></use></svg> Envíos dentro de Quito en menos de 5 días</li>" +
            "<li><svg class=\"icon\" aria-hidden=\"true\"><use href=\"#i-store\"></use></svg> Opción de retiro en tienda</li>" +
            "<li><svg class=\"icon\" aria-hidden=\"true\"><use href=\"#i-package\"></use></svg> Empaque seguro</li>" +
          "</ul>" +
        "</div>" +
      "</div>" +
      "<div class=\"mc-tabs\">" +
        "<ul class=\"nav nav-tabs\" role=\"tablist\">" +
          "<li class=\"nav-item\" role=\"presentation\"><button class=\"nav-link active\" id=\"tab-carac\" data-bs-toggle=\"tab\" data-bs-target=\"#pane-carac\" type=\"button\" role=\"tab\" aria-controls=\"pane-carac\" aria-selected=\"true\">Características</button></li>" +
          "<li class=\"nav-item\" role=\"presentation\"><button class=\"nav-link\" id=\"tab-envio\" data-bs-toggle=\"tab\" data-bs-target=\"#pane-envio\" type=\"button\" role=\"tab\" aria-controls=\"pane-envio\" aria-selected=\"false\">Envío y pago</button></li>" +
        "</ul>" +
        "<div class=\"tab-content\">" +
          "<div class=\"tab-pane fade show active\" id=\"pane-carac\" role=\"tabpanel\" aria-labelledby=\"tab-carac\"><ul class=\"mc-checks\">" +
            p.caracteristicas.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>" +
          "<div class=\"tab-pane fade\" id=\"pane-envio\" role=\"tabpanel\" aria-labelledby=\"tab-envio\"><ul class=\"mc-checks\">" +
            "<li>Envíos dentro de Quito en menos de 5 días.</li>" +
            "<li>También puedes retirar tu pedido directamente en tienda.</li>" +
            "<li>Pago por transferencia bancaria, en efectivo contra entrega o con tarjeta mediante link de pago.</li>" +
            "<li>Al finalizar tu pedido te contactamos por WhatsApp para confirmar la entrega.</li>" +
          "</ul></div>" +
        "</div>" +
      "</div>";

    // Galería
    if (typeof Swiper === "function") {
      var thumbs = p.imagenes.length > 1 ? new Swiper(root.querySelector(".mc-gallery-thumbs"), {
        slidesPerView: 4,
        spaceBetween: 10,
        watchSlidesProgress: true
      }) : null;
      new Swiper(root.querySelector(".mc-gallery-main"), {
        spaceBetween: 0,
        navigation: {
          nextEl: root.querySelector(".mc-gallery-main .swiper-button-next"),
          prevEl: root.querySelector(".mc-gallery-main .swiper-button-prev")
        },
        thumbs: thumbs ? { swiper: thumbs } : undefined
      });
    }

    var qtyInput = $("#mc-qty");
    var waBuy = $("#mc-wa-buy");
    var selectedOption = function () {
      var checked = root.querySelector("input[name=opcion]:checked");
      return checked ? checked.value : "";
    };
    var refreshWa = function () {
      if (!waBuy) return;
      waBuy.href = p.precio == null
        ? waLink(quoteText(p, selectedOption()))
        : waLink(buyText(p, selectedOption(), qtyInput ? qtyInput.value : 1));
    };

    root.addEventListener("change", refreshWa);
    root.addEventListener("input", refreshWa);

    $$("[data-step]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = (parseInt(qtyInput.value, 10) || 1) + parseInt(btn.getAttribute("data-step"), 10);
        qtyInput.value = Math.min(99, Math.max(1, v));
        refreshWa();
      });
    });

    var addBtn = $("#mc-add");
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        addToCart(p.id, selectedOption(), qtyInput.value);
      });
    }

    refreshWa();

    // Relacionados
    var related = $("#mc-related");
    if (related) {
      var list = DATA.productos.filter(function (o) { return o.id !== p.id && o.categoria === p.categoria; });
      if (list.length < 4) {
        list = list.concat(DATA.productos.filter(function (o) { return o.id !== p.id && o.categoria !== p.categoria && o.destacado; }));
      }
      related.innerHTML = list.slice(0, 4).map(renderCard).join("");
    }
  };

  /* ---------- Página del carrito ---------- */

  var initCartPage = function () {
    var root = $("#mc-cart");
    if (!root) return;

    var render = function () {
      var items = readCart();
      if (!items.length) {
        root.innerHTML = "<div class=\"mc-empty\"><h2>Tu carrito está vacío</h2><p>Descubre nuestros colchones y cojines, y la promoción del 2do colchón para mascota a mitad de precio.</p>" +
          "<div class=\"mc-btn-row\" style=\"justify-content:center\"><a class=\"btn-mc btn-mc-dark\" href=\"tienda.html\">Ir a la tienda</a>" +
          "<a class=\"btn-mc btn-mc-outline\" href=\"producto.html?id=colchon-mascota\">Ver colchón para mascota</a></div></div>";
        return;
      }

      var totals = cartTotals(items);
      var perProduct = {};
      items.forEach(function (it) { perProduct[it.id] = (perProduct[it.id] || 0) + it.cantidad; });

      var rows = items.map(function (it, i) {
        var p = getProduct(it.id);
        var promoNote = "";
        if (p.promo === "segundo-mitad") {
          promoNote = perProduct[p.id] >= 2
            ? "<span class=\"mc-save\">Promo 2do a mitad de precio aplicada</span>"
            : "<span class=\"mc-save\">Añade otro y el 2do sale a mitad de precio</span>";
        }
        return "<div class=\"mc-cart-row\">" +
          "<img src=\"" + thumbSrc(p) + "\" alt=\"\" width=\"100\" height=\"100\">" +
          "<div class=\"mc-cart-info\"><h2 class=\"mc-cart-name\"><a href=\"" + productUrl(p) + "\">" + esc(p.nombre) + "</a></h2>" +
          "<div class=\"mc-cart-meta\">" + (it.opcion ? esc(p.opciones ? p.opciones.titulo : "Opción") + ": " + esc(it.opcion) + "<br>" : "") +
          money(p.precio) + " c/u" + promoNote + "</div></div>" +
          "<div class=\"mc-qty\"><button type=\"button\" data-line=\"" + i + "\" data-step=\"-1\" aria-label=\"Quitar uno\">−</button>" +
          "<input type=\"number\" value=\"" + it.cantidad + "\" min=\"0\" max=\"99\" data-line=\"" + i + "\" aria-label=\"Cantidad de " + esc(p.nombre) + "\">" +
          "<button type=\"button\" data-line=\"" + i + "\" data-step=\"1\" aria-label=\"Añadir uno\">+</button></div>" +
          "<div class=\"mc-cart-total\">" + money(p.precio * it.cantidad) + "</div>" +
          "<button type=\"button\" class=\"mc-cart-remove\" data-remove=\"" + i + "\" aria-label=\"Eliminar " + esc(p.nombre) + "\"><svg class=\"icon\" aria-hidden=\"true\"><use href=\"#i-trash\"></use></svg></button>" +
          "</div>";
      }).join("");

      root.innerHTML =
        "<div class=\"mc-cart-layout\">" +
          "<div>" +
            "<div class=\"mc-cart-head\"><span></span><span>Producto</span><span>Cantidad</span><span style=\"text-align:right\">Subtotal</span><span></span></div>" +
            rows +
            "<p style=\"margin-top:24px\"><a class=\"btn-mc btn-mc-outline\" href=\"tienda.html\">Seguir comprando</a></p>" +
          "</div>" +
          "<aside class=\"mc-summary\" aria-label=\"Resumen del pedido\">" +
            "<h2>Resumen</h2>" +
            "<div class=\"mc-summary-row\"><span>Subtotal (" + totals.unidades + ")</span><span>" + money(totals.subtotal) + "</span></div>" +
            (totals.descuento ? "<div class=\"mc-summary-row is-discount\"><span>Promo 2do a mitad de precio</span><span>−" + money(totals.descuento) + "</span></div>" : "") +
            "<div class=\"mc-summary-row\"><span>Envío</span><span>Se confirma por WhatsApp</span></div>" +
            "<div class=\"mc-summary-total\"><span>Total</span><span>" + money(totals.total) + "</span></div>" +
            "<a class=\"btn-mc btn-mc-dark btn-mc-block\" href=\"checkout.html\">Finalizar compra</a>" +
            "<p class=\"mc-summary-note\">En el siguiente paso eliges entrega a domicilio o retiro en tienda, y la forma de pago.</p>" +
          "</aside>" +
        "</div>";
    };

    root.addEventListener("click", function (e) {
      var step = e.target.closest("[data-step]");
      var remove = e.target.closest("[data-remove]");
      var items = readCart();
      if (step) {
        var i = parseInt(step.getAttribute("data-line"), 10);
        setQty(i, items[i].cantidad + parseInt(step.getAttribute("data-step"), 10));
      } else if (remove) {
        setQty(parseInt(remove.getAttribute("data-remove"), 10), 0);
      }
    });

    root.addEventListener("change", function (e) {
      if (e.target.matches("input[data-line]")) {
        setQty(parseInt(e.target.getAttribute("data-line"), 10), e.target.value);
      }
    });

    document.addEventListener("mc:cart", render);
    render();
  };

  /* ---------- Checkout ---------- */

  var summaryHtml = function (items) {
    var totals = cartTotals(items);
    return "<h2>Tu pedido</h2>" +
      items.map(function (it) {
        var p = getProduct(it.id);
        return "<div class=\"mc-summary-item\"><img src=\"" + thumbSrc(p) + "\" alt=\"\" width=\"56\" height=\"56\">" +
          "<span><strong>" + esc(p.nombre) + "</strong>" + (it.opcion ? esc(it.opcion) + " · " : "") + "Cant. " + it.cantidad + "</span>" +
          "<span>" + money(p.precio * it.cantidad) + "</span></div>";
      }).join("") +
      "<div class=\"mc-summary-row\"><span>Subtotal</span><span>" + money(totals.subtotal) + "</span></div>" +
      (totals.descuento ? "<div class=\"mc-summary-row is-discount\"><span>Promo 2do a mitad de precio</span><span>−" + money(totals.descuento) + "</span></div>" : "") +
      "<div class=\"mc-summary-row\"><span>Envío</span><span>Se confirma por WhatsApp</span></div>" +
      "<div class=\"mc-summary-total\"><span>Total</span><span>" + money(totals.total) + "</span></div>";
  };

  var orderId = function () {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return "MED-" + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  };

  var initCheckout = function () {
    var root = $("#mc-checkout");
    if (!root) return;
    var abierto = Date.now(); // para descartar envíos automáticos demasiado rápidos

    var items = readCart();
    if (!items.length) {
      root.innerHTML = "<div class=\"mc-empty\"><h2>No hay productos en tu carrito</h2><p>Añade productos para finalizar tu compra.</p>" +
        "<a class=\"btn-mc btn-mc-dark\" href=\"tienda.html\">Ir a la tienda</a></div>";
      return;
    }

    var form = $("#mc-checkout-form");
    $("#mc-checkout-summary").innerHTML = summaryHtml(items) +
      "<button type=\"submit\" form=\"mc-checkout-form\" class=\"btn-mc btn-mc-dark btn-mc-block\">Confirmar pedido</button>" +
      "<p class=\"mc-summary-note\">Al confirmar se abrirá WhatsApp con el detalle de tu pedido para coordinar el pago y la entrega.</p>" +
      "<p class=\"mc-checkout-legal\">Al confirmar aceptas nuestra <a href=\"privacidad.html\" target=\"_blank\">Política de privacidad</a> " +
      "y las condiciones de <a href=\"envios.html\" target=\"_blank\">envíos, cambios y devoluciones</a>.</p>";
    root.hidden = false;

    // Verificación anti-bots de Cloudflare (Turnstile). Solo se activa si hay clave configurada.
    var captcha = null;
    if (DATA.turnstileSiteKey) {
      captcha = document.createElement("div");
      captcha.className = "cf-turnstile mc-captcha";
      captcha.setAttribute("data-sitekey", DATA.turnstileSiteKey);
      captcha.setAttribute("data-appearance", "interaction-only");
      captcha.setAttribute("data-language", "es");
      captcha.setAttribute("data-theme", document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
      form.appendChild(captcha);
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    var toggleAddress = function () {
      var delivery = form.querySelector("input[name=entrega]:checked").value;
      var address = $("#mc-address-fields");
      address.hidden = delivery !== "domicilio";
      $$("input, textarea", address).forEach(function (i) {
        if (i.hasAttribute("data-required")) i.required = delivery === "domicilio";
      });
    };
    form.addEventListener("change", function (e) {
      if (e.target.name === "entrega") toggleAddress();
      var field = e.target.closest(".mc-field");
      if (field) field.classList.remove("has-error");
    });
    toggleAddress();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      $$(".mc-field", form).forEach(function (field) {
        var input = field.querySelector("input, select, textarea");
        if (!input || field.closest("[hidden]")) return;
        var ok = input.checkValidity();
        field.classList.toggle("has-error", !ok);
        if (!ok && valid) {
          input.focus();
          valid = false;
        }
      });
      if (!valid) return;

      var captchaToken = captcha ? String(new FormData(form).get("cf-turnstile-response") || "") : "";
      if (captcha && !captchaToken) {
        showToast("Estamos verificando que no eres un robot. Intenta confirmar de nuevo en unos segundos.", true);
        return;
      }

      var data = new FormData(form);
      var val = function (name) { return String(data.get(name) || "").trim(); };
      var cart = readCart();
      var totals = cartTotals(cart);
      var id = orderId();
      var domicilio = val("entrega") === "domicilio";
      var pagos = { transferencia: "Transferencia bancaria", efectivo: "Efectivo contra entrega", tarjeta: "Tarjeta (link de pago)" };

      var productLines = cart.map(function (it) {
        var p = getProduct(it.id);
        return "• " + it.cantidad + " × " + p.nombre + (it.opcion ? " (" + it.opcion + ")" : "") + " — " + money(p.precio * it.cantidad);
      }).join("\n");

      var totalLines = "Subtotal: " + money(totals.subtotal) +
        (totals.descuento ? "\nPromo 2do a mitad de precio: −" + money(totals.descuento) : "") +
        "\n*Total: " + money(totals.total) + "* (envío por confirmar)";

      var clientLines = "*Nombre:* " + val("nombre") +
        "\n*Teléfono:* " + val("telefono") +
        (val("email") ? "\n*Correo:* " + val("email") : "") +
        (val("cedula") ? "\n*Cédula/RUC:* " + val("cedula") : "");

      var deliveryLines = domicilio
        ? "Envío a domicilio\n*Ciudad:* " + val("ciudad") + "\n*Sector:* " + val("sector") + "\n*Dirección:* " + val("direccion") + "\n*Referencia:* " + val("referencia")
        : "Retiro en tienda";

      var text = message([
        "Acabo de realizar un pedido en su tienda en línea y quisiera confirmarlo.",
        "*Pedido:* " + id,
        "*PRODUCTOS*\n" + productLines,
        totalLines,
        "*MIS DATOS*\n" + clientLines,
        "*ENTREGA*\n" + deliveryLines,
        "*FORMA DE PAGO*\n" + pagos[val("pago")]
      ].concat(val("notas") ? ["*NOTAS*\n" + val("notas")] : []).concat([
        "Quedo a la espera de su confirmación."
      ]));

      var link = waLink(text);
      storage.set(ORDER_KEY, { id: id, fecha: new Date().toISOString(), total: totals.total, link: link });
      window.open(link, "_blank", "noopener");

      // Aviso al negocio (correo + WhatsApp) desde el servidor. Si falla, el pedido igual llega por WhatsApp.
      try {
        fetch("/api/pedido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            id: id,
            items: cart,
            cliente: { nombre: val("nombre"), telefono: val("telefono"), email: val("email"), cedula: val("cedula") },
            entrega: domicilio
              ? { tipo: "domicilio", ciudad: val("ciudad"), sector: val("sector"), direccion: val("direccion"), referencia: val("referencia") }
              : { tipo: "retiro" },
            pago: val("pago"),
            notas: val("notas"),
            web: val("web"),
            turnstile: captchaToken,
            t: Date.now() - abierto
          })
        }).catch(function () { /* sin servidor (por ejemplo, abriendo el archivo local) */ });
      } catch (err) { /* navegador sin fetch */ }

      writeCart([]);
      root.innerHTML = "<div class=\"mc-success\"><span class=\"mc-kicker\">Pedido registrado</span>" +
        "<h2 class=\"mc-title\">¡Gracias, " + esc(String(data.get("nombre")).split(" ")[0]) + "!</h2>" +
        "<div class=\"mc-order-id\">" + id + "</div>" +
        "<p>Te abrimos WhatsApp con el detalle de tu pedido. Envía el mensaje para que confirmemos la disponibilidad, el pago y la entrega.</p>" +
        "<div class=\"mc-btn-row\" style=\"justify-content:center;margin-top:24px\">" +
        "<a class=\"btn-mc btn-mc-wa\" href=\"" + link + "\" target=\"_blank\" rel=\"noopener\">" + waIcon() + " Abrir WhatsApp de nuevo</a>" +
        "<a class=\"btn-mc btn-mc-outline\" href=\"index.html\">Volver al inicio</a></div></div>";
      window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 160 });
    });
  };

  /* ---------- Catálogo imprimible ---------- */

  var initCatalog = function () {
    var root = $("#mc-catalog");
    if (!root) return;

    root.innerHTML = DATA.productos.map(function (p) {
      var price = p.precio == null ? "Precio a consultar" : money(p.precio) + (p.etiqueta ? " · " + p.etiqueta : "");
      return "<article class=\"mc-sheet mc-reveal\">" +
        "<img src=\"" + thumbSrc(p) + "\" alt=\"" + esc(p.nombre) + "\" loading=\"lazy\" width=\"600\" height=\"600\">" +
        "<div><span class=\"mc-kicker\">" + esc(DATA.categorias[p.categoria]) + "</span>" +
        "<h2>" + esc(p.nombre) + "</h2>" +
        "<p class=\"mc-sheet-price\">" + price + "</p>" +
        "<ul class=\"mc-checks\">" + p.caracteristicas.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" +
        "<div class=\"mc-sheet-links mc-no-print\"><a class=\"btn-mc btn-mc-dark\" href=\"" + productUrl(p) + "\">Ver producto</a>" +
        "<a class=\"btn-mc btn-mc-wa\" href=\"" + waLink(p.precio == null ? quoteText(p) : buyText(p, firstOption(p), 1)) + "\" target=\"_blank\" rel=\"noopener\">" + waIcon() + " WhatsApp</a></div>" +
        "</div></article>";
    }).join("");

  };

  /* ---------- Enlaces de WhatsApp y teléfono ---------- */

  function waIcon() {
    return "<svg class=\"mc-ico\" aria-hidden=\"true\"><use href=\"#mc-wa\"></use></svg>";
  }

  var initContactLinks = function () {
    $$("[data-wa]").forEach(function (a) {
      a.href = waLink(message([a.getAttribute("data-wa") || "Me gustaría recibir información sobre sus productos."]));
      a.target = "_blank";
      a.rel = "noopener";
    });
  };

  var initContactForm = function () {
    var form = $("#mc-contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var d = new FormData(form);
      var text = message([
        "Mi nombre es " + String(d.get("nombre")).trim() + ".",
        String(d.get("mensaje")).trim()
      ].concat(d.get("telefono") ? ["Mi número de contacto es " + String(d.get("telefono")).trim() + "."] : []));
      window.open(waLink(text), "_blank", "noopener");
    });
  };

  /* ---------- Descarga del catálogo en PDF ---------- */

  // Los botones "Descargar PDF" descargan siempre el catálogo oficial de descargas/.
  var CATALOGO_PDF = "descargas/catalogo-colchones-medicol.pdf";

  var initCatalogPdf = function () {
    $$("[data-catalogo-pdf]").forEach(function (link) {
      link.href = CATALOGO_PDF;
      link.setAttribute("download", "Catalogo-Colchones-Medicol.pdf");
      link.setAttribute("type", "application/pdf");
    });
  };

  /* ---------- Clics globales ---------- */

  // Pestañas de la ficha de producto (Características / Envío y pago)
  document.addEventListener("click", function (e) {
    var tab = e.target.closest("[data-bs-toggle=\"tab\"]");
    if (!tab) return;
    e.preventDefault();
    var nav = tab.closest("[role=tablist]");
    var pane = document.querySelector(tab.getAttribute("data-bs-target"));
    if (!nav || !pane) return;
    $$("[data-bs-toggle=\"tab\"]", nav).forEach(function (t) {
      var active = t === tab;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
      var p = document.querySelector(t.getAttribute("data-bs-target"));
      if (p) p.classList.toggle("active", active);
      if (p) p.classList.toggle("show", active);
    });
  });

  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (!add) return;
    e.preventDefault();
    var p = getProduct(add.getAttribute("data-add"));
    addToCart(p.id, firstOption(p), add.getAttribute("data-qty") || 1);
  });

  window.addEventListener("storage", function (e) {
    if (e.key === CART_KEY) {
      memoryCart = null;
      updateCartBadge();
      document.dispatchEvent(new CustomEvent("mc:cart"));
    }
  });

  window.MedicolTienda = { renderCarousels: renderCarousels };

  document.addEventListener("DOMContentLoaded", function () {
    renderCarousels();
    updateCartBadge();
    initContactLinks();
    initShop();
    initProduct();
    initCartPage();
    initCheckout();
    initCatalog();
    initCatalogPdf();
    initContactForm();
    document.dispatchEvent(new CustomEvent("mc:rendered"));
  });

})();
