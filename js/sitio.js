/*
  Sinergia — comportamiento del sitio (todas las páginas).

  Partes: pantalla de carga y cortina · WhatsApp · encabezado y menús · scroll suave (Lenis)
          · animaciones con GSAP · cintas · testimonios · galería · formularios
          · ventana de suscripción · aviso de cookies · zona de boletines.

  Regla de oro: el contenido siempre se ve aunque falle algo. Las animaciones preparan
  sus estados iniciales aquí mismo, solo si las librerías cargaron bien.
*/
(function () {
  "use strict";

  var WHATSAPP = "593969094855";
  var MENSAJE_WA = "¡Hola, Sinergia! Me gustaría recibir información sobre sus capacitaciones.";

  var html = document.documentElement;
  // Las animaciones son parte de la identidad del sitio: se muestran siempre, aunque el equipo
  // tenga desactivados los "efectos de animación" (decisión del cliente).
  var calma = false;
  var finoPuntero = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // Equipos modestos (poca memoria, pocos núcleos o "ahorro de datos"): mismas animaciones, en versión liviana
  var nav = window.navigator;
  var ligero = (nav.deviceMemory && nav.deviceMemory <= 4) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
    !!(nav.connection && nav.connection.saveData);
  if (ligero) document.documentElement.classList.add("sg-ligero");
  var hayGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var gsap = window.gsap;
  var lenis = null;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var guardar = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var leer = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };

  var enlaceWa = function (texto) {
    return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(texto || MENSAJE_WA);
  };

  // ---------- WhatsApp ----------
  var initWhatsApp = function () {
    $$("[data-wa]").forEach(function (a) {
      a.href = enlaceWa(a.getAttribute("data-wa"));
      a.target = "_blank";
      a.rel = "noopener";
    });
    $$("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  };

  // ---------- Scroll suave conectado a GSAP ----------
  var initLenis = function () {
    if (calma || typeof window.Lenis !== "function") return;
    lenis = new window.Lenis({ lerp: 0.09, anchors: { offset: -90 }, autoRaf: !hayGsap });
    if (hayGsap) {
      lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  };
  var pararScroll = function (si) { if (lenis) { if (si) lenis.stop(); else lenis.start(); } };

  // ---------- Pantalla de carga y cortina ----------
  // Devuelve una promesa que se cumple cuando la pantalla ya se fue (para empezar la portada).
  var initCarga = function () {
    return new Promise(function (listo) {
      var carga = $(".sg-carga");
      var cortina = $(".sg-cortina");
      var terminar = function () {
        html.classList.remove("sg-carga-on", "sg-cortina-on");
        try { sessionStorage.setItem("sg-cargado", "1"); } catch (e) {}
        listo();
      };

      if (html.classList.contains("sg-carga-on") && carga && hayGsap) {
        var num = $("[data-carga-num]");
        var cuenta = { v: 0 };
        var tl = gsap.timeline({ onComplete: terminar });
        tl.to(cuenta, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: function () { if (num) num.textContent = String(Math.round(cuenta.v)).padStart(3, "0"); } }, 0)
          .to(".sg-carga-logo img", { yPercent: -110, duration: 0.6, ease: "power3.in" }, 1.7)
          .to(carga, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, 2.0);
      } else if (html.classList.contains("sg-cortina-on") && cortina && hayGsap) {
        gsap.to(cortina, { yPercent: -100, duration: 0.75, ease: "power4.inOut", delay: 0.05, onComplete: function () { gsap.set(cortina, { clearProps: "transform" }); terminar(); } });
      } else {
        terminar();
      }
    });
  };

  // Al ir a otra página del sitio: la cortina roja entra desde abajo y luego navega
  var initTransiciones = function () {
    var cortina = $(".sg-cortina");
    if (!cortina || calma) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // mismo lugar (anclas)
      e.preventDefault();
      cortina.classList.add("is-saliendo");
      setTimeout(function () { location.href = url.href; }, 520);
    });
    // Si el navegador vuelve con la flecha "atrás", quitar la cortina
    window.addEventListener("pageshow", function (e) { if (e.persisted) cortina.classList.remove("is-saliendo"); });
  };

  // ---------- Encabezado ----------
  var initEncabezado = function () {
    var header = $("[data-header]");
    if (!header) return;
    var hayPortada = !!$(".sg-hero, .sg-cabecera");
    var ultimo = window.scrollY;
    var onScroll = function () {
      var y = window.scrollY;
      header.classList.toggle("is-solido", !hayPortada || y > 60);
      if (!document.body.classList.contains("sg-menu-abierto")) {
        if (y > 500 && y > ultimo + 4) header.classList.add("is-escondido");
        else if (y < ultimo - 4 || y < 200) header.classList.remove("is-escondido");
      }
      ultimo = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    header.addEventListener("focusin", function () { header.classList.remove("is-escondido"); });
    onScroll();

    // Submenú (Biblioteca): también con clic y teclado
    $$("[data-sub]").forEach(function (sub) {
      var btn = $("button", sub);
      btn.addEventListener("click", function () {
        var abierto = sub.classList.toggle("is-abierto");
        btn.setAttribute("aria-expanded", String(abierto));
      });
      document.addEventListener("click", function (e) {
        if (!sub.contains(e.target)) { sub.classList.remove("is-abierto"); btn.setAttribute("aria-expanded", "false"); }
      });
      sub.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { sub.classList.remove("is-abierto"); btn.setAttribute("aria-expanded", "false"); btn.focus(); }
      });
    });
  };

  // ---------- Menú del celular ----------
  var initMovil = function () {
    var panel = $("[data-movil]");
    var btn = $("[data-burger]");
    if (!panel || !btn) return;
    var abierto = false;
    var poner = function (si) {
      if (si === abierto) return;
      abierto = si;
      btn.setAttribute("aria-expanded", String(si));
      btn.setAttribute("aria-label", si ? "Cerrar menú" : "Abrir menú");
      var txt = $(".sg-burger-txt", btn);
      if (txt) txt.textContent = si ? "Cerrar" : "Menú";
      document.body.classList.toggle("sg-menu-abierto", si);
      document.body.classList.toggle("sg-bloqueo", si);
      // Con el menú abierto, el resto de la página no recibe el foco del teclado
      $$("main, footer, .sg-nav, .sg-header-inner > .sg-nav-cta:not(.sg-burger)").forEach(function (el) { el.inert = si; });
      pararScroll(si);
      if (si) {
        panel.hidden = false;
        $$(".sg-movil-nav a", panel).forEach(function (a, i) { a.style.transitionDelay = (0.2 + i * 0.045) + "s"; });
        requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add("is-abierto"); }); });
      } else {
        panel.classList.remove("is-abierto");
        setTimeout(function () { if (!abierto) panel.hidden = true; }, 700);
      }
    };
    btn.addEventListener("click", function () { poner(!abierto); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a, [data-abrir-registro]")) poner(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && abierto) { poner(false); btn.focus(); } });
  };

  // ---------- Cintas en movimiento (texto y fotos) ----------
  var initCintas = function () {
    $$(".sg-cinta, .sg-tira").forEach(function (m) {
      var pista = $(".sg-cinta-pista", m);
      if (!pista) return;
      var copia = pista.cloneNode(true);
      copia.setAttribute("aria-hidden", "true");
      $$("a, button", copia).forEach(function (el) { el.tabIndex = -1; });
      $$("img", copia).forEach(function (img) { img.alt = ""; });
      m.appendChild(copia);
      m.classList.add("is-lista");
    });
  };

  // ---------- Animaciones con GSAP ----------
  var initAnimaciones = function () {
    if (!hayGsap || calma) return;
    gsap.registerPlugin(window.ScrollTrigger);
    var ST = window.ScrollTrigger;
    // Los títulos grandes se animan letra por letra (más abajo); se marcan antes para no animarlos dos veces
    if (typeof window.SplitText === "function") {
      $$(".sg-display, .sg-titulo").forEach(function (el) {
        if (!el.closest(".sg-hero, .sg-cabecera, .sg-modal, [data-boletines], [data-admin]")) el.setAttribute("data-anim", ligero ? "lineas" : "letras");
      });
    }
    var partir = function (el) {
      if (typeof window.SplitText !== "function") return null;
      gsap.registerPlugin(window.SplitText);
      return new window.SplitText(el, { type: "lines", linesClass: "sg-linea", mask: "lines" });
    };

    // Títulos que suben línea por línea
    $$("[data-anim='lineas']").forEach(function (el) {
      if (el.closest(".sg-hero, .sg-cabecera")) return; // la portada se anima al terminar la carga
      var s = partir(el);
      if (!s) return;
      gsap.from(s.lines, { yPercent: 110, duration: 1.2, ease: "power4.out", stagger: 0.09, scrollTrigger: { trigger: el, start: "top 88%" } });
    });

    // Aparecer suave
    $$("[data-anim='sube']").forEach(function (el) {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: "power3.out", delay: parseFloat(el.getAttribute("data-retraso")) || 0, scrollTrigger: { trigger: el, start: "top 90%" } });
    });

    // Grupos que aparecen uno tras otro
    $$("[data-anim='grupo']").forEach(function (el) {
      gsap.from(el.children, { y: 60, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 85%" } });
    });

    // Fotos que se descubren de abajo hacia arriba y se acomodan
    $$("[data-anim='foto']").forEach(function (el) {
      var img = $("img", el);
      var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%" } });
      tl.from(el, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.4, ease: "power4.inOut" });
      if (img) tl.from(img, { scale: 1.35, duration: 1.8, ease: "power3.out" }, 0);
    });

    // Paralaje
    $$("[data-parallax]").forEach(function (el) {
      var f = parseFloat(el.getAttribute("data-parallax")) || 0.15;
      gsap.fromTo(el, { yPercent: -f * 50 }, { yPercent: f * 50, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Foto que se abre de marco a pantalla completa al bajar (quiénes somos)
    $$("[data-anim='abre']").forEach(function (el) {
      var img = $("img", el);
      if (ligero) { // sin recorte animado (repinta toda la foto en cada cuadro): solo el acercamiento
        if (img) gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        return;
      }
      gsap.fromTo(el, { clipPath: "inset(8% 7% 8% 7%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "top 15%", scrub: true } });
      if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Portadas internas: la foto se aleja al bajar
    $$(".sg-cabecera-img img").forEach(function (img) {
      gsap.fromTo(img, { yPercent: 0 }, { yPercent: 12, ease: "none", scrollTrigger: { trigger: img.closest(".sg-cabecera"), start: "top top", end: "bottom top", scrub: true } });
    });

    // Testimonios: las tarjetas entran girando un poco
    $$(".sg-testimonios").forEach(function (g) {
      gsap.from($$(".sg-tarjeta", g), { y: 80, rotate: 2, opacity: 0, duration: 1.2, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: g, start: "top 85%" } });
    });

    // ---- Efectos de scroll al estilo de las webs premium ----

    // Títulos grandes: letra por letra
    if (typeof window.SplitText === "function") {
      $$("[data-anim='letras']").forEach(function (el) {
        var st = new window.SplitText(el, { type: "lines,words,chars", linesClass: "sg-linea", mask: "lines" });
        gsap.from(st.chars, { yPercent: 115, duration: 1, ease: "power4.out", stagger: 0.018, scrollTrigger: { trigger: el, start: "top 88%" } });
      });

      // Textos que se iluminan palabra por palabra mientras bajas
      $$("[data-anim='llenar']").forEach(function (el) {
        var st = new window.SplitText(el, { type: "words", aria: "none" });
        gsap.fromTo(st.words, { opacity: 0.14 }, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
      });
    }

    // Portada: al bajar, el texto sube y se desvanece y la foto se queda atrás
    var hero = $(".sg-hero");
    if (hero) {
      var cont = $("[data-hero-contenido]", hero);
      if (cont) gsap.to(cont, { y: -140, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom 20%", scrub: true } });
      gsap.to($(".sg-hero-media", hero), { yPercent: 28, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      // Oscurece la foto al bajar con una capa que solo cambia su opacidad (no obliga a repintar)
      var sombra = $(".sg-hero-sombra", hero);
      if (sombra) {
        var velo = document.createElement("div");
        velo.className = "sg-hero-velo";
        sombra.appendChild(velo);
        gsap.to(velo, { opacity: 1, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      }
    }

    // Tira de fotos: además de moverse sola, avanza con el scroll
    $$(".sg-tira").forEach(function (t) {
      gsap.fromTo(t, { x: 0 }, { x: -260, ease: "none", scrollTrigger: { trigger: t, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Bloque rojo final: se abre en círculo desde el centro
    $$(".sg-llamado").forEach(function (el) {
      if (ligero) { gsap.from(el, { y: 60, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }); return; }
      gsap.fromTo(el, { clipPath: "circle(18% at 50% 60%)" }, { clipPath: "circle(110% at 50% 50%)", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 25%", scrub: true } });
    });

    // Fotos: se inclinan un poco según la velocidad del scroll
    var inclinables = ligero ? [] : $$(".sg-tira img");
    if (inclinables.length) {
      var inclinar = gsap.quickTo(inclinables, "skewY", { duration: 0.6, ease: "power3" });
      ST.create({ onUpdate: function (self) { inclinar(Math.max(-2.5, Math.min(2.5, self.getVelocity() / -700))); } });
    }

    // Galería y logos: aparecen en tandas a medida que llegan a la pantalla
    var lotes = $$(".sg-galeria-item, .sg-logos li");
    if (lotes.length) {
      gsap.set(lotes, { y: 50, opacity: 0 });
      ST.batch(lotes, { start: "top 92%", once: true, onEnter: function (b) { gsap.to(b, { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.08 }); } });
    }

    // La cinta acelera según la velocidad del scroll
    var cintas = ligero ? [] : $$(".sg-cinta .sg-cinta-pista");
    if (cintas.length) {
      ST.create({
        onUpdate: function (self) {
          var v = Math.min(4, 1 + Math.abs(self.getVelocity()) / 900);
          cintas.forEach(function (p) { p.getAnimations && p.getAnimations().forEach(function (a) { a.playbackRate = v; }); });
        }
      });
    }

    window.addEventListener("load", function () { ST.refresh(); });
  };

  // Portada: el título sube después de la pantalla de carga
  var animarPortada = function () {
    var hero = $(".sg-hero, .sg-cabecera");
    if (!hero || !hayGsap || calma) return;
    var titulo = $("[data-anim='lineas']", hero);
    var tl = gsap.timeline();
    if (titulo && typeof window.SplitText === "function") {
      gsap.registerPlugin(window.SplitText);
      var s = new window.SplitText(titulo, { type: "lines", linesClass: "sg-linea", mask: "lines" });
      tl.from(s.lines, { yPercent: 115, duration: 1.4, ease: "power4.out", stagger: 0.1 }, 0.05);
    }
    var resto = $$("[data-anim='entra']", hero);
    if (resto.length) tl.from(resto, { y: 30, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.08 }, 0.45);
    var foto = $(".sg-hero-media, .sg-cabecera-img", hero);
    if (foto) tl.from(foto, { scale: 1.12, duration: 2.2, ease: "power3.out" }, 0);
  };

  // ---------- Testimonios: voltear con toque o teclado ----------
  var initTarjetas = function () {
    $$(".sg-tarjeta").forEach(function (t) {
      var boton = $(".sg-tarjeta-boton", t);
      if (!boton) return;
      // Con el mouse la tarjeta se voltea al pasar por encima; con toque o teclado (Enter/Espacio), con el botón
      boton.addEventListener("click", function (e) {
        if (finoPuntero && e.detail > 0) return;
        var v = t.classList.toggle("is-volteada");
        boton.setAttribute("aria-pressed", String(v));
      });
    });
  };

  // ---------- Galería con visor ----------
  // Funciona también con fotos agregadas después (boletines con imágenes): cada bloque [data-galeria]
  // es un grupo propio; las fotos sueltas de la página forman otro grupo.
  var initGaleria = function () {
    if (typeof HTMLDialogElement !== "function") return;
    var dlg = null, img, cuenta, items = [], actual = 0;
    var crear = function () {
      dlg = document.createElement("dialog");
      dlg.className = "sg-visor";
      dlg.setAttribute("aria-label", "Visor de fotos");
      dlg.innerHTML =
        '<img alt="">' +
        '<button type="button" class="sg-visor-btn sg-visor-cerrar" aria-label="Cerrar"><svg aria-hidden="true"><use href="#i-close"/></svg></button>' +
        '<button type="button" class="sg-visor-btn sg-visor-ant" aria-label="Foto anterior"><svg aria-hidden="true"><use href="#i-chev-left"/></svg></button>' +
        '<button type="button" class="sg-visor-btn sg-visor-sig" aria-label="Foto siguiente"><svg aria-hidden="true"><use href="#i-chev-right"/></svg></button>' +
        '<p class="sg-visor-cuenta" aria-live="polite"></p>';
      document.body.appendChild(dlg);
      img = $("img", dlg);
      cuenta = $(".sg-visor-cuenta", dlg);
      dlg.addEventListener("close", function () { pararScroll(false); if (items[actual]) items[actual].focus(); });
      $(".sg-visor-cerrar", dlg).addEventListener("click", function () { dlg.close(); });
      $(".sg-visor-ant", dlg).addEventListener("click", function () { mostrar(actual - 1); });
      $(".sg-visor-sig", dlg).addEventListener("click", function () { mostrar(actual + 1); });
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") mostrar(actual - 1);
        if (e.key === "ArrowRight") mostrar(actual + 1);
      });
      var x0 = null;
      dlg.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      dlg.addEventListener("touchend", function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
        x0 = null;
      });
    };
    var mostrar = function (i) {
      actual = (i + items.length) % items.length;
      img.src = items[actual].getAttribute("data-full");
      img.alt = ($("img", items[actual]) || {}).alt || "";
      cuenta.textContent = (actual + 1) + " / " + items.length;
      var multiple = items.length > 1;
      $(".sg-visor-ant", dlg).hidden = !multiple;
      $(".sg-visor-sig", dlg).hidden = !multiple;
    };
    document.addEventListener("click", function (e) {
      var it = e.target.closest && e.target.closest("[data-full]");
      if (!it) return;
      e.preventDefault();
      var grupo = it.closest("[data-galeria]");
      items = grupo ? $$("[data-full]", grupo) : $$("[data-full]").filter(function (x) { return !x.closest("[data-galeria]"); });
      if (!dlg) crear();
      mostrar(items.indexOf(it));
      dlg.showModal();
      pararScroll(true);
    });
  };

  // ---------- Formularios ----------
  // Envía a /api/formulario (correo a Sinergia + hoja de cálculo + aviso por WhatsApp).
  // Si el servidor no responde (por ejemplo, abriendo la web en la computadora),
  // abre WhatsApp con el mensaje listo para que nada se pierda.
  var validar = function (form) {
    var faltan = [];
    $$("input, select, textarea", form).forEach(function (el) {
      if (!el.name || el.closest(".sg-trampa")) return;
      var ok = el.type === "checkbox" ? (!el.required || el.checked) : (!el.required || el.value.trim() !== "") && el.checkValidity();
      var marca = el.type === "checkbox" ? el.closest(".sg-check") : el;
      marca.setAttribute("aria-invalid", String(!ok));
      if (!ok) faltan.push(el);
    });
    return faltan;
  };

  var datosDe = function (form) {
    var d = { tipo: form.getAttribute("data-form"), pagina: location.pathname };
    $$("input, select, textarea", form).forEach(function (el) {
      if (!el.name) return;
      d[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
    });
    return d;
  };

  var textoWa = function (d) {
    var l = ["¡Hola, Sinergia! " + (d.tipo === "contacto" ? "Les escribo desde su página web." : "Quiero inscribirme / registrarme.")];
    l.push("", "*Nombre:* " + (d.nombre || "") + " " + (d.apellido || ""));
    if (d.empresa) l.push("*Empresa:* " + d.empresa);
    if (d.email) l.push("*Correo:* " + d.email);
    if (d.whatsapp) l.push("*WhatsApp:* " + d.whatsapp);
    if (d.interes) l.push("*Me interesa:* " + d.interes);
    if (d.mensaje) l.push("", d.mensaje);
    return l.join("\n");
  };

  var abrirWa = function (texto) {
    var w = window.open(enlaceWa(texto), "_blank");
    if (w) w.opener = null; else location.href = enlaceWa(texto);
  };

  // Después de enviar un formulario: guarda lo necesario para personalizar la página de gracias y va a ella
  var irAGracias = function (d, respuesta) {
    try {
      sessionStorage.setItem("sg-gracias", JSON.stringify({
        tipo: d.tipo,
        nombre: (d.nombre || "").split(" ")[0],
        wa: (respuesta && respuesta.whatsapp) || enlaceWa(textoWa(d)),
        volver: location.pathname + location.search
      }));
    } catch (e) {}
    location.href = "/gracias";
  };

  var initGracias = function () {
    var zona = $("[data-gracias]");
    if (!zona) return;
    var g = null;
    try { g = JSON.parse(sessionStorage.getItem("sg-gracias")); sessionStorage.removeItem("sg-gracias"); } catch (e) {}
    if (!g) return;
    var textos = {
      registro: "Ya estás en nuestra lista. Te escribiremos por WhatsApp con los próximos webinars, talleres y novedades.",
      inscripcion: "Recibimos tu inscripción. Te escribiremos por WhatsApp con las fechas, el horario, el valor y los datos para el pago.",
      contacto: "Recibimos tu mensaje. Te responderemos por WhatsApp a la brevedad."
    };
    if (g.nombre) $("[data-gracias-titulo]", zona).textContent = "¡Gracias, " + g.nombre + "!";
    if (textos[g.tipo]) $("[data-gracias-texto]", zona).textContent = textos[g.tipo];
    if (typeof g.wa === "string" && g.wa.indexOf("https://wa.me/") === 0) $("[data-gracias-wa]", zona).href = g.wa;
    if (typeof g.volver === "string" && /^\/(?!\/)/.test(g.volver) && g.volver.indexOf("/gracias") !== 0) $("[data-gracias-volver]", zona).href = g.volver;
  };

  // ---------- Fecha de hoy en Ecuador (UTC−5, sin horario de verano) ----------
  var hoyEcuador = function () {
    var d = new Date(Date.now() - 5 * 3600 * 1000);
    return { a: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), iso: d.toISOString().slice(0, 10) };
  };
  var msHastaMedianoche = function () {
    var ahora = Date.now() - 5 * 3600 * 1000;
    return 86400000 - (ahora % 86400000) + 1000;
  };

  // Bloques que aparecen o desaparecen solos según la fecha: data-hasta="AAAA-MM-DD" / data-desde="AAAA-MM-DD"
  var aplicarFechas = function () {
    var hoy = hoyEcuador().iso;
    $$("[data-hasta]").forEach(function (el) { if (hoy > el.getAttribute("data-hasta")) el.hidden = true; });
    $$("[data-desde]").forEach(function (el) { el.hidden = hoy < el.getAttribute("data-desde"); });
  };
  var initFechas = function () {
    aplicarFechas();
    // Botones que eligen una opción del formulario de inscripción
    $$("[data-elegir]").forEach(function (b) {
      b.addEventListener("click", function () {
        var sel = $("form[data-form] select[name=interes]");
        if (sel) sel.value = b.getAttribute("data-elegir");
      });
    });
  };

  // ---------- Calendario: solo el mes actual, con hoy resaltado; cambia solo de día y de mes ----------
  var initCalendario = function () {
    var cal = $("[data-calendario]");
    if (!cal) return;
    var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    var grilla = $("[data-calendario-grilla]", cal);
    var lista = $("[data-calendario-lista]");
    var sesiones = [];
    var reloj = null;
    var dos = function (n) { return (n < 10 ? "0" : "") + n; };

    var dibujar = function () {
      var h = hoyEcuador();
      var prefijo = h.a + "-" + dos(h.m + 1) + "-";
      var mes = MESES[h.m];
      $("[data-calendario-mes]", cal).textContent = mes.charAt(0).toUpperCase() + mes.slice(1) + " " + h.a;
      $("[data-calendario-hoy]", cal).textContent = DIAS[new Date(Date.UTC(h.a, h.m, h.d)).getUTCDay()] + " " + h.d;
      var delMes = sesiones.filter(function (s) { return s.fecha.indexOf(prefijo) === 0; });
      var conClase = {};
      delMes.forEach(function (s) { conClase[+s.fecha.slice(8, 10)] = true; });

      grilla.innerHTML = "";
      var primero = (new Date(Date.UTC(h.a, h.m, 1)).getUTCDay() + 6) % 7; // lunes = 0
      var total = new Date(Date.UTC(h.a, h.m + 1, 0)).getUTCDate();
      for (var i = 0; i < primero; i++) {
        var vacio = document.createElement("li");
        vacio.className = "sg-dia sg-dia--vacio";
        vacio.setAttribute("aria-hidden", "true");
        grilla.appendChild(vacio);
      }
      for (var d = 1; d <= total; d++) {
        var li = document.createElement("li");
        li.className = "sg-dia" + (d === h.d ? " sg-dia--hoy" : "") + (d < h.d ? " sg-dia--pasado" : "") + (conClase[d] ? " sg-dia--clase" : "");
        li.textContent = d;
        var etiqueta = d + " de " + mes + (d === h.d ? ", hoy" : "") + (conClase[d] ? ", hay clase" : "");
        li.setAttribute("aria-label", etiqueta);
        if (d === h.d) li.setAttribute("aria-current", "date");
        grilla.appendChild(li);
      }

      if (lista) {
        lista.innerHTML = "";
        var proximas = delMes.filter(function (s) { return s.fecha >= h.iso; });
        if (!proximas.length) {
          var nada = document.createElement("li");
          nada.className = "sg-agenda-vacio";
          nada.textContent = "No hay más clases este mes. Escríbenos por WhatsApp para conocer las próximas fechas.";
          lista.appendChild(nada);
        }
        proximas.forEach(function (s) {
          var dia = +s.fecha.slice(8, 10);
          var item = document.createElement("li");
          if (s.fecha === h.iso) item.className = "is-hoy";
          item.innerHTML = '<span class="sg-agenda-fecha"><strong></strong><small></small></span><span class="sg-agenda-texto"><strong></strong><small></small></span>';
          $(".sg-agenda-fecha strong", item).textContent = dia;
          $(".sg-agenda-fecha small", item).textContent = DIAS[new Date(Date.UTC(h.a, h.m, dia)).getUTCDay()].slice(0, 3);
          $(".sg-agenda-texto strong", item).textContent = s.taller;
          $(".sg-agenda-texto small", item).textContent = (s.detalle ? s.detalle + " · " : "") + s.inicio + " a " + s.fin + (s.fecha === h.iso ? " · hoy" : "");
          lista.appendChild(item);
        });
      }
      // Al llegar la medianoche de Ecuador, avanza al día (y al mes) siguiente
      clearTimeout(reloj);
      reloj = setTimeout(function () { dibujar(); aplicarFechas(); }, msHastaMedianoche());
    };

    dibujar();
    if (!/^https?:$/.test(location.protocol)) return;
    fetch("/datos/calendario.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        sesiones = (j && Array.isArray(j.sesiones) ? j.sesiones : []).filter(function (s) { return s && /^\d{4}-\d{2}-\d{2}$/.test(s.fecha); });
        dibujar();
      })
      .catch(function () { dibujar(); });
  };

  // Cuenta los clics en WhatsApp (sin cookies ni datos personales) para medir conversiones
  var initMedicion = function () {
    if (!/^https?:$/.test(location.protocol) || !navigator.sendBeacon) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="https://wa.me/"]');
      if (!a) return;
      var boton = (a.getAttribute("aria-label") || a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
      try { navigator.sendBeacon("/api/evento", JSON.stringify({ evento: "whatsapp", pagina: location.pathname, boton: boton })); } catch (err) {}
    }, true);
  };

  var initFormularios = function () {
    var servicio = new URLSearchParams(location.search).get("servicio");
    $$("form[data-form]").forEach(function (form) {
      var estado = $(".sg-estado", form);
      if (servicio && form.elements.interes) {
        Array.prototype.forEach.call(form.elements.interes.options, function (o) { if (o.value === servicio) form.elements.interes.value = servicio; });
      }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var faltan = validar(form);
        if (faltan.length) {
          estado.textContent = "Revisa los campos marcados para continuar.";
          faltan[0].focus();
          return;
        }
        var d = datosDe(form);
        var boton = $("button[type=submit]", form);
        boton.disabled = true;
        estado.textContent = "Enviando…";
        var fin = function (ok, r) {
          boton.disabled = false;
          if (ok) {
            if (d.tipo === "registro") guardar("sg-registrado", "1");
            irAGracias(d, r);
          } else {
            estado.textContent = "No pudimos enviarlo desde aquí; te abrimos WhatsApp con tus datos para que no se pierdan.";
            abrirWa(textoWa(d));
          }
        };
        if (!/^https?:$/.test(location.protocol)) { fin(false); return; }
        fetch("/api/formulario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
          .then(function (r) { return r.json().then(function (j) { return { estado: r.status, ok: r.ok && j.ok, j: j }; }); })
          .then(function (res) {
            // Datos por corregir o demasiados envíos: se muestra el aviso sin abrir WhatsApp
            if (res.estado === 400 || res.estado === 429) {
              boton.disabled = false;
              estado.textContent = res.j.error || "Revisa los datos e intenta otra vez.";
              return;
            }
            fin(res.ok, res.j);
          })
          .catch(function () { fin(false); });
      });
    });
  };

  // ---------- Ventana de suscripción ----------
  var initRegistro = function () {
    var dlg = $("[data-registro]");
    if (!dlg || typeof HTMLDialogElement !== "function") return;
    var abrir = function () {
      if (dlg.open) return;
      dlg.showModal();
      pararScroll(true);
    };
    var cerrar = function () { dlg.close(); };
    dlg.addEventListener("close", function () {
      pararScroll(false);
      guardar("sg-registro-visto", String(Date.now()));
    });
    $$("[data-abrir-registro]").forEach(function (b) { b.addEventListener("click", abrir); });
    $$("[data-cerrar-registro]", dlg).forEach(function (b) { b.addEventListener("click", cerrar); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) cerrar(); });

    // Se abre sola en la primera visita (luego, cada 7 días si no se registró)
    var pagina = document.body.getAttribute("data-page");
    var excluidas = ["privacidad", "terminos", "cookies", "boletines", "404", "contacto", "gracias", "admin"];
    var visto = parseInt(leer("sg-registro-visto"), 10) || 0;
    var reciente = Date.now() - visto < 7 * 24 * 3600 * 1000;
    if (!leer("sg-registrado") && !reciente && excluidas.indexOf(pagina) === -1) {
      setTimeout(abrir, html.classList.contains("sg-carga-on") ? 5200 : 3500);
    }
  };

  // ---------- Aviso de cookies ----------
  var initCookies = function () {
    var aviso = $("[data-cookies]");
    if (!aviso || leer("sg-cookies-v2") === "ok") return;
    setTimeout(function () {
      aviso.hidden = false;
      requestAnimationFrame(function () { aviso.classList.add("is-visible"); });
    }, 1800);
    $("[data-cookies-ok]", aviso).addEventListener("click", function () {
      guardar("sg-cookies-v2", "ok");
      aviso.classList.remove("is-visible");
      setTimeout(function () { aviso.hidden = true; }, 600);
    });
  };

  // ---------- Zona de boletines (solo suscriptores) ----------
  var initBoletines = function () {
    var zona = $("[data-boletines]");
    if (!zona) return;
    var pasos = {};
    ["entrar", "crear", "recuperar", "nueva", "lista"].forEach(function (k) { pasos[k] = $("[data-paso='" + k + "']", zona); });
    var lista = $("[data-lista-boletines]", zona);
    var tokenClave = "";

    var ver = function (nombre) {
      Object.keys(pasos).forEach(function (k) { if (pasos[k]) pasos[k].hidden = k !== nombre; });
    };
    var api = function (cuerpo) {
      return fetch("/api/acceso", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) })
        .then(function (r) { return r.json(); });
    };
    var libro = function (b) {
      var art = document.createElement("article");
      art.className = "sg-doc";
      art.innerHTML =
        '<div class="sg-doc-portada sg-doc-portada--roja"><span class="sg-doc-contra" aria-hidden="true"></span><span class="sg-doc-paginas" aria-hidden="true"></span><span class="sg-doc-brillo" aria-hidden="true"></span><span class="sg-doc-tipo"></span><img class="sg-doc-sello" src="images/marca/simbolo-blanco.webp" alt="" width="600" height="549"><h3></h3></div>' +
        '<div class="sg-doc-info"><p></p><div class="sg-doc-acciones"><a target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-eye"/></svg>Ver</a><a download><svg aria-hidden="true"><use href="#i-download"/></svg>Descargar</a></div></div>';
      $(".sg-doc-tipo", art).textContent = "Boletín · " + (b.fecha || "");
      $("h3", art).textContent = b.titulo || "Boletín";
      $(".sg-doc-info p", art).textContent = b.resumen || "";
      var links = $$(".sg-doc-acciones a", art);
      links[0].href = b.url;
      links[1].href = b.url + "&descargar=1";
      return art;
    };
    var galeria = function (b) {
      var sec = document.createElement("section");
      sec.className = "sg-boletin-fotos";
      sec.setAttribute("data-galeria", "");
      sec.innerHTML = '<div class="sg-boletin-fotos-cabeza"><p class="sg-etiqueta"></p><h3></h3><p></p></div><div class="sg-galeria"></div>';
      $(".sg-etiqueta", sec).textContent = "Boletín · " + (b.fecha || "");
      $("h3", sec).textContent = b.titulo || "Boletín";
      $(".sg-boletin-fotos-cabeza p:last-child", sec).textContent = b.resumen || "";
      var grilla = $(".sg-galeria", sec);
      (b.imagenes || []).forEach(function (im, i) {
        var bt = document.createElement("button");
        bt.type = "button";
        bt.className = "sg-galeria-item";
        bt.setAttribute("data-full", im.url);
        bt.setAttribute("aria-label", "Ampliar imagen " + (i + 1) + " de " + (b.titulo || "boletín"));
        var foto = document.createElement("img");
        foto.src = im.url;
        foto.alt = (b.titulo || "Boletín") + ", imagen " + (i + 1);
        foto.loading = "lazy";
        foto.decoding = "async";
        if (im.ancho && im.alto) { foto.width = im.ancho; foto.height = im.alto; }
        bt.appendChild(foto);
        grilla.appendChild(bt);
      });
      return sec;
    };
    var pintarLista = function (items) {
      lista.innerHTML = "";
      if (!items.length) {
        lista.innerHTML = '<p class="sg-lead">Pronto publicaremos el primer boletín. Te avisaremos por WhatsApp.</p>';
        return;
      }
      // En orden de fecha: los PDF seguidos se agrupan en una fila de libros; cada galería va aparte
      var libros = null;
      items.forEach(function (b) {
        if (b.tipo === "imagenes") { lista.appendChild(galeria(b)); libros = null; return; }
        if (!libros) { libros = document.createElement("div"); libros.className = "sg-docs"; lista.appendChild(libros); }
        libros.appendChild(libro(b));
      });
    };
    var cargarLista = function () {
      return fetch("/api/boletines", { credentials: "same-origin" })
        .then(function (r) { if (!r.ok) throw new Error("sin sesión"); return r.json(); })
        .then(function (j) { $("[data-correo-sesion]", zona).textContent = j.email || ""; pintarLista(j.boletines || []); ver("lista"); });
    };

    var abrirLista = function () { cargarLista().catch(function () { ver("entrar"); }); };

    // Mostrar u ocultar la contraseña
    $$("[data-ver-clave]", zona).forEach(function (b) {
      b.addEventListener("click", function () {
        var input = b.parentElement.querySelector("input");
        var mostrar = input.type === "password";
        input.type = mostrar ? "text" : "password";
        b.setAttribute("aria-pressed", String(mostrar));
        b.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
      });
    });
    $$("[data-ir]", zona).forEach(function (b) {
      b.addEventListener("click", function () {
        var destino = b.getAttribute("data-ir");
        ver(destino);
        var campo = pasos[destino] && $("input", pasos[destino]);
        if (campo) campo.focus();
      });
    });

    var enviar = function (f, cuerpo, espera, alTerminar) {
      var est = $(".sg-estado", f), boton = $("button[type=submit]", f);
      if (!/^https?:$/.test(location.protocol)) { est.textContent = "La zona de boletines funciona con la web publicada."; return; }
      boton.disabled = true;
      est.textContent = espera;
      api(cuerpo).then(function (j) {
        boton.disabled = false;
        if (j.ok) { est.textContent = ""; f.reset(); (alTerminar || abrirLista)(j, est); }
        else est.textContent = j.error || "No pudimos completar el ingreso. Intenta otra vez.";
      }).catch(function () { boton.disabled = false; est.textContent = "No pudimos conectarnos. Intenta otra vez."; });
    };
    var claveRepetida = function (f, est) {
      var faltan = validar(f);
      if (faltan.length) { est.textContent = f.elements.clave.value && f.elements.clave.value.length < 8 ? "La contraseña debe tener al menos 8 caracteres." : "Revisa los campos marcados para continuar."; faltan[0].focus(); return false; }
      if (f.elements.clave.value !== f.elements.clave2.value) {
        f.elements.clave2.setAttribute("aria-invalid", "true");
        est.textContent = "Las contraseñas no coinciden.";
        f.elements.clave2.focus();
        return false;
      }
      return true;
    };

    $("form", pasos.entrar).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      if (validar(f).length) { $(".sg-estado", f).textContent = "Escribe tu correo y tu contraseña."; return; }
      enviar(f, { accion: "entrar", email: f.elements.email.value.trim().toLowerCase(), clave: f.elements.clave.value }, "Ingresando…");
    });

    $("form", pasos.crear).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      if (!claveRepetida(f, $(".sg-estado", f))) return;
      enviar(f, {
        accion: "crear",
        nombre: f.elements.nombre.value.trim(), apellido: f.elements.apellido.value.trim(),
        email: f.elements.email.value.trim().toLowerCase(), whatsapp: f.elements.whatsapp.value.trim(),
        clave: f.elements.clave.value, novedades: f.elements.novedades.checked, acepto: f.elements.acepto.checked
      }, "Creando tu cuenta…");
    });

    $("form", pasos.recuperar).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      if (validar(f).length) { $(".sg-estado", f).textContent = "Escribe un correo válido."; return; }
      enviar(f, { accion: "recuperar", email: f.elements.email.value.trim().toLowerCase() }, "Enviando…", function (j, est) {
        est.textContent = "Listo. Si el correo está registrado, te llegará un enlace en unos minutos. Revisa también la carpeta de correo no deseado.";
      });
    });

    $("form", pasos.nueva).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      if (!claveRepetida(f, $(".sg-estado", f))) return;
      enviar(f, { accion: "restablecer", token: tokenClave, clave: f.elements.clave.value }, "Guardando…", function () {
        tokenClave = "";
        abrirLista();
      });
    });

    $$("[data-salir]", zona).forEach(function (b) {
      b.addEventListener("click", function () { api({ accion: "salir" }).finally(function () { ver("entrar"); }); });
    });

    // ¿Llegó desde el enlace del correo? (#clave=…) → pedir la contraseña nueva y borrar el enlace de la barra
    var m = location.hash.match(/^#clave=([a-f0-9]{64})$/);
    if (m) {
      tokenClave = m[1];
      try { history.replaceState(null, "", location.pathname + location.search); } catch (err) {}
      ver("nueva");
      return;
    }
    if (!/^https?:$/.test(location.protocol)) { ver("entrar"); return; }
    cargarLista().catch(function () { ver("entrar"); });
  };

  // ---------- Cursor propio (solo con mouse): punto rojo que sigue con suavidad ----------
  var initCursor = function () {
    if (!finoPuntero || !hayGsap) return;
    var c = document.createElement("div");
    c.className = "sg-cursor is-oculto";
    c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    var x = gsap.quickTo(c, "x", { duration: 0.45, ease: "power3" });
    var y = gsap.quickTo(c, "y", { duration: 0.45, ease: "power3" });
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      c.classList.remove("is-oculto");
      x(e.clientX); y(e.clientY);
      var t = e.target.closest ? e.target : null;
      var ver = t && t.closest(".sg-galeria-item, .sg-acceso, .sg-tarjeta, .sg-doc-portada, .sg-pago-img");
      var enlace = !ver && t && t.closest("a, button, summary, label, select");
      c.classList.toggle("is-grande", !!ver);
      c.classList.toggle("is-enlace", !!enlace);
      c.textContent = ver ? (ver.classList.contains("sg-tarjeta") ? "Leer" : "Ver") : "";
    }, { passive: true });
    document.addEventListener("mouseleave", function () { c.classList.add("is-oculto"); });
  };

  var iniciar = function () {
    initLenis();
    initWhatsApp();
    initEncabezado();
    initMovil();
    initCintas();
    initTarjetas();
    initGaleria();
    initFormularios();
    initRegistro();
    initCookies();
    initBoletines();
    initGracias();
    initMedicion();
    initFechas();
    initCalendario();
    initTransiciones();
    initAnimaciones();
    initCursor();
    initCarga().then(animarPortada);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
