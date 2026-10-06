(function () {

  "use strict";

  // Menú móvil
  var initMenu = function () {
    var header = document.querySelector(".mc-header");
    var nav = document.getElementById("mc-nav");
    var burger = document.querySelector(".mc-burger");
    if (!header || !nav || !burger) return;

    var setOpen = function (open) {
      if (open) nav.style.setProperty("--mc-nav-top", header.getBoundingClientRect().bottom + "px");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("mc-lock", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    };

    burger.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        burger.focus();
      }
    });

    window.matchMedia("(min-width: 992px)").addEventListener("change", function (e) {
      if (e.matches) setOpen(false);
    });

    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Resalta la página actual en el menú
    var here = location.pathname.split("/").pop() || "index.html";
    var cat = new URLSearchParams(location.search).get("cat");
    nav.querySelectorAll("a").forEach(function (a) {
      var url = new URL(a.getAttribute("href"), location.href);
      var page = url.pathname.split("/").pop();
      var linkCat = url.searchParams.get("cat");
      if (page === here && linkCat === cat) a.classList.add("is-active");
    });
  };

  // Banner principal
  var initHero = function () {
    var el = document.querySelector(".mc-hero .swiper");
    if (!el || typeof Swiper !== "function") return;

    // Cambia sola cada HERO_DELAY ms (también con las flechas); la barra dorada marca el tiempo
    var HERO_DELAY = 6000;
    var hero = document.querySelector(".mc-hero");
    hero.style.setProperty("--mc-hero-delay", HERO_DELAY + "ms");

    var swiper = new Swiper(el, {
      loop: true,
      speed: 1000,
      effect: "fade",
      fadeEffect: { crossFade: true },
      autoplay: {
        delay: HERO_DELAY,
        disableOnInteraction: false
      },
      navigation: {
        prevEl: ".mc-hero-prev",
        nextEl: ".mc-hero-next"
      },
      pagination: {
        el: ".mc-hero .swiper-pagination",
        clickable: true
      },
      a11y: {
        prevSlideMessage: "Anterior",
        nextSlideMessage: "Siguiente",
        paginationBulletMessage: "Ir a la diapositiva {{index}}"
      }
    });

    // Botón de pausa (accesibilidad: todo lo que se mueve solo debe poder detenerse)
    var pause = hero.querySelector(".mc-hero-pause");
    var setPaused = function (paused) {
      hero.classList.toggle("is-paused", paused);
      if (paused) swiper.autoplay.stop(); else swiper.autoplay.start();
      if (pause) {
        pause.setAttribute("aria-pressed", String(paused));
        pause.setAttribute("aria-label", paused ? "Reanudar el banner" : "Pausar el banner");
      }
    };
    // El banner siempre empieza en movimiento; solo se detiene si la persona pulsa pausa
    if (pause) {
      pause.addEventListener("click", function () {
        setPaused(!hero.classList.contains("is-paused"));
      });
    }
  };

  // Carruseles de productos: desde tablet se deslizan y al llegar al final vuelven al primero;
  // en móvil se desactivan y los productos se muestran todos hacia abajo.
  var initCarousels = function () {
    if (typeof Swiper !== "function") return;

    var carousels = Array.prototype.slice.call(document.querySelectorAll(".mc-carousel"));
    if (!carousels.length) return;

    var desktop = window.matchMedia("(min-width: 768px)");
    var instances = [];

    var create = function () {
      instances = carousels.map(function (c) {
        return new Swiper(c.querySelector(".swiper"), {
          slidesPerView: 2,
          spaceBetween: 20,
          rewind: true,
          speed: 700,
          autoplay: {
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          },
          navigation: {
            prevEl: c.querySelector(".mc-carousel-prev"),
            nextEl: c.querySelector(".mc-carousel-next")
          },
          pagination: {
            el: c.querySelector(".swiper-pagination"),
            clickable: true
          },
          breakpoints: {
            992: { slidesPerView: 3, spaceBetween: 24 },
            1200: { slidesPerView: 4, spaceBetween: 28 }
          }
        });
      });
    };

    var destroy = function () {
      instances.forEach(function (s) { s.destroy(true, true); });
      instances = [];
    };

    var update = function () {
      if (desktop.matches && !instances.length) create();
      else if (!desktop.matches && instances.length) destroy();
    };

    desktop.addEventListener("change", update);
    update();
  };

  // Testimonios
  var initTestimonials = function () {
    var el = document.querySelector(".testimonial-swiper");
    if (!el || typeof Swiper !== "function") return;

    new Swiper(el, {
      loop: true,
      autoplay: { delay: 6000, disableOnInteraction: false },
      navigation: {
        nextEl: "#testimonios .mc-t-next",
        prevEl: "#testimonios .mc-t-prev"
      },
      pagination: {
        el: "#testimonios .swiper-pagination",
        clickable: true
      }
    });
  };

  // Aparición suave al hacer scroll
  var initReveal = function () {
    var items = document.querySelectorAll(".mc-reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    items.forEach(function (el) { observer.observe(el); });
  };

  // Tema claro / oscuro: sigue al sistema, salvo que la persona lo cambie con el botón
  var THEME_KEY = "medicol-tema";

  var initTheme = function () {
    var root = document.documentElement;
    var buttons = document.querySelectorAll("[data-theme-toggle]");
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    var meta = document.querySelector("meta[name=theme-color]");

    var saved = function () {
      try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
    };

    var apply = function (theme) {
      root.setAttribute("data-theme", theme);
      root.setAttribute("data-bs-theme", theme);
      if (meta) meta.setAttribute("content", theme === "dark" ? "#0A0F15" : "#1A2530");
      buttons.forEach(function (b) {
        b.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
        b.setAttribute("aria-pressed", String(theme === "dark"));
      });
    };

    apply(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* sin almacenamiento: dura esta visita */ }
        apply(next);
      });
    });

    media.addEventListener("change", function (e) {
      if (!saved()) apply(e.matches ? "dark" : "light");
    });

    // El catálogo en PDF siempre se imprime en modo claro
    var printTheme = null;
    window.addEventListener("beforeprint", function () {
      printTheme = root.getAttribute("data-theme");
      apply("light");
    });
    window.addEventListener("afterprint", function () {
      if (printTheme) apply(printTheme);
    });
  };

  var initYear = function () {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initMenu();
    initHero();
    initCarousels();
    initTestimonials();
    initReveal();
    initYear();
  });

})();
