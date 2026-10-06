/*
  Sinergia — comportamiento del sitio (todas las páginas).
  Partes: WhatsApp · tema · encabezado y menú · scroll suave (Lenis) · animaciones
          al bajar · cifras · paralaje · frase palabra por palabra · servicios con
          barra de avance · vista previa del índice · carruseles · cintas · galería
          · formulario de contacto.
  Si quien visita pidió "reducir movimiento" en su equipo, se desactivan las animaciones.
*/
(function () {
  "use strict";

  var WHATSAPP = "593969094855";
  var MENSAJE_WA = "¡Hola, Sinergia! Me gustaría recibir información sobre sus capacitaciones.";

  var calma = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finoPuntero = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var lenis = null;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var limitar = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var enlaceWa = function (texto) {
    return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(texto || MENSAJE_WA);
  };

  // ---------- WhatsApp: cada enlace con data-wa abre el chat con un mensaje listo ----------
  var initWhatsApp = function () {
    $$("[data-wa]").forEach(function (a) {
      a.href = enlaceWa(a.getAttribute("data-wa"));
      a.target = "_blank";
      a.rel = "noopener";
    });
  };

  // ---------- Año del pie ----------
  var initAnio = function () {
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  };

  // ---------- Tema claro / oscuro ----------
  var initTema = function () {
    var root = document.documentElement;
    $$("[data-theme-toggle]").forEach(function (btn) {
      var etiqueta = function () {
        var oscuro = root.getAttribute("data-theme") === "dark";
        btn.setAttribute("aria-label", oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      };
      etiqueta();
      btn.addEventListener("click", function () {
        var t = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", t);
        try { localStorage.setItem("sinergia-tema", t); } catch (e) {}
        etiqueta();
      });
    });
  };

  // ---------- Encabezado: cambia de fondo al bajar y se esconde al bajar rápido ----------
  var initEncabezado = function () {
    var header = $("[data-header]");
    if (!header) return;
    var ultimo = window.scrollY;
    var onScroll = function () {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 40);
      if (!document.body.classList.contains("sg-menu-open")) {
        header.classList.toggle("is-hidden", y > 400 && y > ultimo + 2);
        if (y < ultimo - 2) header.classList.remove("is-hidden");
      }
      ultimo = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
    onScroll();
  };

  // ---------- Menú a pantalla completa ----------
  var initMenu = function () {
    var menu = $("[data-menu]");
    var btn = $("[data-menu-toggle]");
    if (!menu || !btn) return;
    var label = $(".sg-menu-btn-label", btn);
    var abierto = false;

    var setOpen = function (open) {
      if (open === abierto) return;
      abierto = open;
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      if (label) label.textContent = open ? "Cerrar" : "Menú";
      document.body.classList.toggle("sg-menu-open", open);
      document.body.classList.toggle("sg-lock", open);
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { menu.classList.add("is-open"); });
        });
        var primero = $("a", menu);
        if (primero) setTimeout(function () { primero.focus({ preventScroll: true }); }, 350);
      } else {
        menu.classList.remove("is-open");
        setTimeout(function () { if (!abierto) menu.hidden = true; }, calma ? 0 : 800);
      }
    };

    btn.setAttribute("aria-label", "Abrir menú");
    btn.addEventListener("click", function () { setOpen(!abierto); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (!abierto) return;
      if (e.key === "Escape") { setOpen(false); btn.focus(); }
      if (e.key === "Tab") {
        // Mantiene el foco dentro del menú y su botón
        var focos = [btn].concat($$("a, button", menu));
        var i = focos.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); focos[focos.length - 1].focus(); }
        else if (!e.shiftKey && i === focos.length - 1) { e.preventDefault(); focos[0].focus(); }
      }
    });
  };

  // ---------- Scroll suave ----------
  var initLenis = function () {
    if (calma || typeof window.Lenis !== "function") return;
    lenis = new window.Lenis({ autoRaf: true, lerp: 0.1, anchors: { offset: -90 } });
  };

  // ---------- Animaciones al aparecer en pantalla ----------
  var initReveal = function () {
    $$(".sg-lines").forEach(function (el) {
      $$(".sg-line > span", el).forEach(function (s, i) { s.style.setProperty("--i", i); });
    });
    $$("[data-delay]").forEach(function (el) { el.style.setProperty("--d", el.getAttribute("data-delay") + "s"); });
    var els = $$("[data-reveal], .sg-lines");
    if (!("IntersectionObserver" in window) || calma) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    // Un elemento recortado por completo (data-reveal="mask") no cuenta como visible,
    // así que para esos se vigila a su contenedor.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        (en.target._revela || [en.target]).forEach(function (el) { el.classList.add("is-in"); });
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    els.forEach(function (el) {
      if (el.getAttribute("data-reveal") !== "mask") { io.observe(el); return; }
      var padre = el.parentElement;
      (padre._revela = padre._revela || []).push(el);
      io.observe(padre);
    });
  };

  // ---------- Cifras que cuentan ----------
  var initCifras = function () {
    var els = $$("[data-count]");
    if (!els.length) return;
    var fmt = new Intl.NumberFormat("es-EC");
    var pintar = function (el, v) { el.textContent = (el.getAttribute("data-prefix") || "") + fmt.format(v) + (el.getAttribute("data-suffix") || ""); };
    // data-since="2016": cuenta los años desde ese año hasta hoy
    els.forEach(function (el) {
      var desde = el.getAttribute("data-since");
      if (desde) { el.setAttribute("data-count", new Date().getFullYear() - parseInt(desde, 10)); pintar(el, parseInt(el.getAttribute("data-count"), 10)); }
    });
    var correr = function (el) {
      var fin = parseInt(el.getAttribute("data-count"), 10) || 0;
      var desde = parseInt(el.getAttribute("data-from"), 10) || 0;
      if (calma) { pintar(el, fin); return; }
      var t0 = null, dur = 1800;
      var paso = function (t) {
        if (!t0) t0 = t;
        var p = limitar((t - t0) / dur, 0, 1);
        pintar(el, Math.round(desde + (fin - desde) * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    };
    if (!("IntersectionObserver" in window)) { els.forEach(correr); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { correr(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  };

  // ---------- Efectos ligados al scroll: paralaje, frase y barra de avance ----------
  var initScrollFx = function () {
    var parallax = $$("[data-parallax]");
    var frases = $$("[data-words]");
    var pins = $$("[data-progress]");

    // Divide la frase en palabras para iluminarlas una a una
    frases.forEach(function (el) {
      var partir = function (nodo) {
        Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var s = document.createElement("span");
              s.className = "sg-word";
              s.textContent = p;
              frag.appendChild(s);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) {
            partir(n);
          }
        });
      };
      partir(el);
    });

    if (calma || (!parallax.length && !frases.length && !pins.length)) return;

    var vh = window.innerHeight;
    window.addEventListener("resize", function () { vh = window.innerHeight; }, { passive: true });

    var tick = function () {
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var f = parseFloat(el.getAttribute("data-parallax")) || 0.12;
        var centro = r.top + r.height / 2 - vh / 2;
        el.style.transform = "translate3d(0," + (-centro * f).toFixed(1) + "px,0)";
      });
      frases.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = limitar((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
        var palabras = el._palabras || (el._palabras = $$(".sg-word", el));
        var n = Math.round(p * palabras.length);
        palabras.forEach(function (w, i) { w.classList.toggle("is-on", i < n); });
      });
      pins.forEach(function (el) {
        var cont = el.closest("[data-progress-scope]") || el.parentNode;
        var r = cont.getBoundingClientRect();
        var p = limitar((vh * 0.5 - r.top) / Math.max(1, r.height - vh * 0.3), 0, 1);
        el.style.setProperty("--p", p.toFixed(3));
      });
    };

    var pendiente = false;
    window.addEventListener("scroll", function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () { pendiente = false; tick(); });
    }, { passive: true });
    tick();
  };

  // ---------- Índice: imagen que sigue al cursor ----------
  var initPreview = function () {
    var lista = $("[data-preview-list]");
    if (!lista || !finoPuntero || calma) return;
    var caja = document.createElement("div");
    caja.className = "sg-preview";
    caja.setAttribute("aria-hidden", "true");
    var imgs = {};
    $$("[data-preview]", lista).forEach(function (a) {
      var src = a.getAttribute("data-preview");
      if (imgs[src]) return;
      var img = new Image();
      img.alt = "";
      img.decoding = "async";
      img.src = src;
      caja.appendChild(img);
      imgs[src] = img;
    });
    document.body.appendChild(caja);

    var x = 0, y = 0, tx = 0, ty = 0, activo = false, raf = null;
    var mover = function () {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      caja.style.transform = "translate3d(" + (x - 150) + "px," + (y - 112) + "px,0) scale(" + (activo ? 1 : 0.6) + ")";
      if (activo || Math.abs(tx - x) > 0.5) raf = requestAnimationFrame(mover); else raf = null;
    };
    lista.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(mover);
    });
    $$("[data-preview]", lista).forEach(function (a) {
      a.addEventListener("pointerenter", function (e) {
        if (!activo) { x = tx = e.clientX; y = ty = e.clientY; }
        activo = true;
        caja.classList.add("is-on");
        Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle("is-on", k === a.getAttribute("data-preview")); });
        if (!raf) raf = requestAnimationFrame(mover);
      });
    });
    lista.addEventListener("pointerleave", function () { activo = false; caja.classList.remove("is-on"); });
  };

  // ---------- Carruseles (testimonios) ----------
  var initSliders = function () {
    $$("[data-slider]").forEach(function (s) {
      var track = $(".sg-slider-track", s);
      if (!track) return;
      var paso = function (dir) {
        var item = track.firstElementChild;
        var ancho = item ? item.getBoundingClientRect().width + 20 : track.clientWidth;
        track.scrollBy({ left: dir * ancho, behavior: calma ? "auto" : "smooth" });
      };
      $$("[data-prev]", s).forEach(function (b) { b.addEventListener("click", function () { paso(-1); }); });
      $$("[data-next]", s).forEach(function (b) { b.addEventListener("click", function () { paso(1); }); });
      track.setAttribute("data-lenis-prevent-horizontal", "");
    });
  };

  // ---------- Cintas en movimiento: duplica el contenido para que el giro no tenga cortes ----------
  var initCintas = function () {
    $$(".sg-marquee").forEach(function (m) {
      var track = $(".sg-marquee-track", m);
      if (!track) return;
      var copia = track.cloneNode(true);
      copia.setAttribute("aria-hidden", "true");
      $$("a, button", copia).forEach(function (el) { el.tabIndex = -1; });
      m.appendChild(copia);
      m.classList.add("is-ready");
    });
  };

  // ---------- Galería con visor ----------
  var initGaleria = function () {
    var items = $$("[data-full]");
    if (!items.length || typeof HTMLDialogElement !== "function") return;

    var dlg = document.createElement("dialog");
    dlg.className = "sg-lightbox";
    dlg.setAttribute("aria-label", "Visor de fotos");
    dlg.innerHTML =
      '<img alt="">' +
      '<button type="button" class="sg-lightbox-btn sg-lightbox-close" aria-label="Cerrar"><svg aria-hidden="true"><use href="#i-close"/></svg></button>' +
      '<button type="button" class="sg-lightbox-btn sg-lightbox-prev" aria-label="Foto anterior"><svg aria-hidden="true"><use href="#i-chev-left"/></svg></button>' +
      '<button type="button" class="sg-lightbox-btn sg-lightbox-next" aria-label="Foto siguiente"><svg aria-hidden="true"><use href="#i-chev-right"/></svg></button>' +
      '<p class="sg-lightbox-count" aria-live="polite"></p>';
    document.body.appendChild(dlg);

    var img = $("img", dlg), cuenta = $(".sg-lightbox-count", dlg), actual = 0;
    var mostrar = function (i) {
      actual = (i + items.length) % items.length;
      var it = items[actual];
      img.src = it.getAttribute("data-full");
      img.alt = ($("img", it) || {}).alt || "";
      cuenta.textContent = (actual + 1) + " / " + items.length;
    };
    var cerrar = function () { dlg.close(); };

    items.forEach(function (it, i) {
      it.addEventListener("click", function () {
        mostrar(i);
        dlg.showModal();
        if (lenis) lenis.stop();
      });
    });
    dlg.addEventListener("close", function () { if (lenis) lenis.start(); items[actual].focus(); });
    $(".sg-lightbox-close", dlg).addEventListener("click", cerrar);
    $(".sg-lightbox-prev", dlg).addEventListener("click", function () { mostrar(actual - 1); });
    $(".sg-lightbox-next", dlg).addEventListener("click", function () { mostrar(actual + 1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) cerrar(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") mostrar(actual - 1);
      if (e.key === "ArrowRight") mostrar(actual + 1);
    });
    // Deslizar con el dedo
    var x0 = null;
    dlg.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  };

  // ---------- Formulario de contacto: arma el mensaje y abre WhatsApp ----------
  var initFormulario = function () {
    var form = $("[data-contact-form]");
    if (!form) return;
    var estado = $(".sg-form-status", form);
    var servicio = new URLSearchParams(location.search).get("servicio");
    var select = form.elements.interes;
    if (servicio && select) {
      Array.prototype.forEach.call(select.options, function (o) { if (o.value === servicio) select.value = servicio; });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var faltan = [];
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || !el.required) return;
        var ok = el.value.trim() !== "" && el.checkValidity();
        el.setAttribute("aria-invalid", String(!ok));
        if (!ok) faltan.push(el);
      });
      if (faltan.length) {
        estado.textContent = "Revisa los campos marcados para continuar.";
        faltan[0].focus();
        return;
      }
      var v = function (n) { return form.elements[n] ? form.elements[n].value.trim() : ""; };
      var lineas = [
        "¡Hola, Sinergia! Les escribo desde su página web.",
        "",
        "*Nombre:* " + v("nombre") + " " + v("apellido"),
        v("empresa") ? "*Empresa:* " + v("empresa") : "",
        "*Correo:* " + v("email"),
        v("telefono") ? "*Teléfono:* " + v("telefono") : "",
        v("interes") ? "*Me interesa:* " + v("interes") : "",
        "",
        v("mensaje")
      ].filter(function (l, i, arr) { return l !== "" || (arr[i - 1] !== "" && i > 0); });
      var url = enlaceWa(lineas.join("\n").trim());
      estado.textContent = "Abriendo WhatsApp con tu mensaje…";
      var w = window.open(url, "_blank");
      if (w) w.opener = null; else location.href = url;
    });
  };

  var iniciar = function () {
    initLenis();
    initWhatsApp();
    initAnio();
    initTema();
    initEncabezado();
    initMenu();
    initCintas();
    initReveal();
    initCifras();
    initScrollFx();
    initPreview();
    initSliders();
    initGaleria();
    initFormulario();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
