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
        if (!el.closest(".sg-hero, .sg-cabecera, .sg-modal, [data-boletines]")) el.setAttribute("data-anim", "letras");
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
        var st = new window.SplitText(el, { type: "words" });
        gsap.fromTo(st.words, { opacity: 0.14 }, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
      });
    }

    // Portada: al bajar, el texto sube y se desvanece y la foto se queda atrás
    var hero = $(".sg-hero");
    if (hero) {
      var cont = $("[data-hero-contenido]", hero);
      if (cont) gsap.to(cont, { y: -140, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom 20%", scrub: true } });
      gsap.to($(".sg-hero-media", hero), { yPercent: 28, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      gsap.to($(".sg-hero-sombra", hero), { backgroundColor: "rgba(10,8,9,0.6)", ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    }

    // Tira de fotos: además de moverse sola, avanza con el scroll
    $$(".sg-tira").forEach(function (t) {
      gsap.fromTo(t, { x: 0 }, { x: -260, ease: "none", scrollTrigger: { trigger: t, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Bloque rojo final: se abre en círculo desde el centro
    $$(".sg-llamado").forEach(function (el) {
      gsap.fromTo(el, { clipPath: "circle(18% at 50% 60%)" }, { clipPath: "circle(110% at 50% 50%)", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 25%", scrub: true } });
    });

    // Fotos: se inclinan un poco según la velocidad del scroll
    var inclinables = $$(".sg-tira img");
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
    var cintas = $$(".sg-cinta .sg-cinta-pista");
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
      var voltear = function () {
        var v = t.classList.toggle("is-volteada");
        t.setAttribute("aria-pressed", String(v));
      };
      t.addEventListener("click", function () { if (!finoPuntero) voltear(); });
      t.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); voltear(); } });
    });
  };

  // ---------- Galería con visor ----------
  var initGaleria = function () {
    var items = $$("[data-full]");
    if (!items.length || typeof HTMLDialogElement !== "function") return;
    var dlg = document.createElement("dialog");
    dlg.className = "sg-visor";
    dlg.setAttribute("aria-label", "Visor de fotos");
    dlg.innerHTML =
      '<img alt="">' +
      '<button type="button" class="sg-visor-btn sg-visor-cerrar" aria-label="Cerrar"><svg aria-hidden="true"><use href="#i-close"/></svg></button>' +
      '<button type="button" class="sg-visor-btn sg-visor-ant" aria-label="Foto anterior"><svg aria-hidden="true"><use href="#i-chev-left"/></svg></button>' +
      '<button type="button" class="sg-visor-btn sg-visor-sig" aria-label="Foto siguiente"><svg aria-hidden="true"><use href="#i-chev-right"/></svg></button>' +
      '<p class="sg-visor-cuenta" aria-live="polite"></p>';
    document.body.appendChild(dlg);
    var img = $("img", dlg), cuenta = $(".sg-visor-cuenta", dlg), actual = 0;
    var mostrar = function (i) {
      actual = (i + items.length) % items.length;
      img.src = items[actual].getAttribute("data-full");
      img.alt = ($("img", items[actual]) || {}).alt || "";
      cuenta.textContent = (actual + 1) + " / " + items.length;
    };
    items.forEach(function (it, i) {
      it.addEventListener("click", function () { mostrar(i); dlg.showModal(); pararScroll(true); });
    });
    dlg.addEventListener("close", function () { pararScroll(false); items[actual].focus(); });
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

  var mostrarOk = function (form, d, respuesta) {
    var caja = document.createElement("div");
    caja.className = "sg-ok";
    caja.setAttribute("tabindex", "-1");
    var nombre = (d.nombre || "").split(" ")[0];
    var esRegistro = d.tipo === "registro" || d.tipo === "inscripcion";
    caja.innerHTML = "<h3></h3><p></p>";
    $("h3", caja).textContent = "¡Gracias" + (nombre ? ", " + nombre : "") + "!";
    $("p", caja).textContent = esRegistro
      ? "Tu registro quedó guardado. Te escribiremos por WhatsApp para confirmar tu inscripción. Ya puedes entrar a Boletines con tu correo."
      : "Recibimos tu mensaje. Te responderemos por WhatsApp a la brevedad.";
    var btn = document.createElement("a");
    btn.className = "sg-btn";
    btn.href = (respuesta && respuesta.whatsapp) || enlaceWa(textoWa(d));
    btn.target = "_blank";
    btn.rel = "noopener";
    btn.innerHTML = 'Escribirnos ahora por WhatsApp <svg aria-hidden="true"><use href="#i-wa"/></svg>';
    caja.appendChild(btn);
    form.replaceWith(caja);
    caja.focus();
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
            mostrarOk(form, d, r);
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
    var excluidas = ["privacidad", "terminos", "cookies", "boletines", "404", "contacto"];
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
    var pasoEntrar = $("[data-paso='entrar']", zona);
    var pasoCrear = $("[data-paso='crear']", zona);
    var pasoLista = $("[data-paso='lista']", zona);
    var lista = $("[data-lista-boletines]", zona);

    var ver = function (paso) {
      [pasoEntrar, pasoCrear, pasoLista].forEach(function (p) { if (p) p.hidden = p !== paso; });
    };
    var api = function (cuerpo) {
      return fetch("/api/acceso", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) })
        .then(function (r) { return r.json(); });
    };
    var pintarLista = function (items) {
      lista.innerHTML = "";
      if (!items.length) {
        lista.innerHTML = '<p class="sg-lead">Pronto publicaremos el primer boletín. Te avisaremos por WhatsApp.</p>';
        return;
      }
      items.forEach(function (b) {
        var art = document.createElement("article");
        art.className = "sg-doc";
        art.innerHTML =
          '<div class="sg-doc-portada sg-doc-portada--roja"><span class="sg-doc-contra" aria-hidden="true"></span><span class="sg-doc-paginas" aria-hidden="true"></span><span class="sg-doc-brillo" aria-hidden="true"></span><span class="sg-doc-tipo"></span><img class="sg-doc-sello" src="images/marca/simbolo-blanco.webp" alt="" width="600" height="549"><h3></h3></div>' +
          '<div class="sg-doc-info"><p></p><div class="sg-doc-acciones"><a target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-eye"/></svg>Ver</a><a download><svg aria-hidden="true"><use href="#i-download"/></svg>Descargar</a></div></div>';
        $(".sg-doc-tipo", art).textContent = "Boletín · " + (b.fecha || "");
        $("h3", art).textContent = b.titulo;
        $(".sg-doc-info p", art).textContent = b.resumen || "";
        var url = "/api/boletines?archivo=" + encodeURIComponent(b.archivo);
        var links = $$(".sg-doc-acciones a", art);
        links[0].href = url;
        links[1].href = url + "&descargar=1";
        lista.appendChild(art);
      });
    };
    var cargarLista = function () {
      return fetch("/api/boletines", { credentials: "same-origin" })
        .then(function (r) { if (!r.ok) throw new Error("sin sesión"); return r.json(); })
        .then(function (j) { $("[data-correo-sesion]", zona).textContent = j.email || ""; pintarLista(j.boletines || []); ver(pasoLista); });
    };

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
        var destino = b.getAttribute("data-ir") === "crear" ? pasoCrear : pasoEntrar;
        ver(destino);
        $("input", destino).focus();
      });
    });

    var enviar = function (f, cuerpo, espera) {
      var est = $(".sg-estado", f), boton = $("button[type=submit]", f);
      if (!/^https?:$/.test(location.protocol)) { est.textContent = "La zona de boletines funciona con la web publicada."; return; }
      boton.disabled = true;
      est.textContent = espera;
      api(cuerpo).then(function (j) {
        boton.disabled = false;
        if (j.ok) { est.textContent = ""; f.reset(); cargarLista(); }
        else est.textContent = j.error || "No pudimos completar el ingreso. Intenta otra vez.";
      }).catch(function () { boton.disabled = false; est.textContent = "No pudimos conectarnos. Intenta otra vez."; });
    };

    $("form", pasoEntrar).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      if (validar(f).length) { $(".sg-estado", f).textContent = "Escribe tu correo y tu contraseña."; return; }
      enviar(f, { accion: "entrar", email: f.elements.email.value.trim().toLowerCase(), clave: f.elements.clave.value }, "Ingresando…");
    });

    $("form", pasoCrear).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, est = $(".sg-estado", f);
      var faltan = validar(f);
      if (faltan.length) { est.textContent = f.elements.clave.value && f.elements.clave.value.length < 8 ? "La contraseña debe tener al menos 8 caracteres." : "Revisa los campos marcados para continuar."; faltan[0].focus(); return; }
      if (f.elements.clave.value !== f.elements.clave2.value) {
        f.elements.clave2.setAttribute("aria-invalid", "true");
        est.textContent = "Las contraseñas no coinciden.";
        f.elements.clave2.focus();
        return;
      }
      enviar(f, {
        accion: "crear",
        nombre: f.elements.nombre.value.trim(), apellido: f.elements.apellido.value.trim(),
        email: f.elements.email.value.trim().toLowerCase(), whatsapp: f.elements.whatsapp.value.trim(),
        clave: f.elements.clave.value, novedades: f.elements.novedades.checked, acepto: f.elements.acepto.checked
      }, "Creando tu cuenta…");
    });

    $$("[data-salir]", zona).forEach(function (b) {
      b.addEventListener("click", function () { api({ accion: "salir" }).finally(function () { ver(pasoEntrar); }); });
    });

    if (!/^https?:$/.test(location.protocol)) { ver(pasoEntrar); return; }
    cargarLista().catch(function () { ver(pasoEntrar); });
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
    initTransiciones();
    initAnimaciones();
    initCursor();
    initCarga().then(animarPortada);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
