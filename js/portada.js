/*
  Sinergia — portada con máscara líquida (solo en el inicio).

  La foto de fondo se ve en blanco y negro con un velo rojo. Donde pasa el cursor
  aparece una mancha orgánica que deja ver la misma foto a todo color, y deja una
  estela que se desvanece. En celulares (o antes de mover el mouse) la mancha flota
  sola despacio para que se descubra el efecto; con el dedo también se puede mover.

  Cómo funciona: en un <canvas> se dibuja la foto a color y se recorta con una
  "máscara" que se pinta a baja resolución (así los bordes quedan suaves, como líquido).
  Se pausa cuando la portada no se ve o la pestaña está oculta, y no se ejecuta si
  quien visita pidió reducir el movimiento.
*/
(function () {
  "use strict";

  var hero = document.querySelector("[data-hero]");
  if (!hero) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var foto = hero.querySelector(".sg-hero-base");
  if (!foto) return;

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  var ctx = canvas.getContext("2d");
  var mascara = document.createElement("canvas");
  var mctx = mascara.getContext("2d");
  if (!ctx || !mctx) return;
  hero.querySelector(".sg-hero-media").appendChild(canvas);

  var tactil = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var ESCALA_MASCARA = 0.22; // la máscara se dibuja pequeña y se agranda: bordes suaves
  var W = 0, H = 0, dpr = 1, R = 0;
  var img = null;

  // Estado del cursor y la estela
  var puntero = { x: 0, y: 0, dentro: false, ultimoMov: 0 };
  var cabeza = { x: 0, y: 0, r: 0 };
  var estela = [];
  var visible = true, raf = null, t0 = performance.now(), ultimoT = t0;
  var autonomo = true; // la mancha flota sola hasta que alguien mueve el mouse

  var medir = function () {
    var rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, tactil ? 1.25 : 1.5);
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    mascara.width = Math.max(1, Math.round(W * ESCALA_MASCARA));
    mascara.height = Math.max(1, Math.round(H * ESCALA_MASCARA));
    R = Math.min(W, H) * (tactil ? 0.26 : 0.17);
  };

  // Igual que object-fit: cover; object-position: 50% 40% del CSS
  var dibujarFoto = function () {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var cw = canvas.width, ch = canvas.height;
    var s = Math.max(cw / iw, ch / ih);
    var dw = iw * s, dh = ih * s;
    ctx.filter = "saturate(1.3) brightness(1.12)"; // color más vivo (si el navegador lo admite)
    ctx.drawImage(img, (cw - dw) * 0.5, (ch - dh) * 0.4, dw, dh);
    ctx.filter = "none";
  };

  // Mancha con borde ondulado que cambia con el tiempo
  var mancha = function (x, y, r, t, semilla) {
    if (r < 1) return;
    var pasos = 36;
    mctx.beginPath();
    for (var i = 0; i <= pasos; i++) {
      var a = (i / pasos) * Math.PI * 2;
      var k = 1 +
        0.09 * Math.sin(3 * a + t * 1.4 + semilla) +
        0.06 * Math.sin(5 * a - t * 1.9 + semilla * 2.1) +
        0.03 * Math.sin(8 * a + t * 2.7 + semilla * 0.7);
      var px = x + Math.cos(a) * r * k, py = y + Math.sin(a) * r * k;
      if (i === 0) mctx.moveTo(px, py); else mctx.lineTo(px, py);
    }
    mctx.closePath();
    mctx.fill();
  };

  var cuadro = function (ahora) {
    raf = null;
    var dt = Math.min(0.05, (ahora - ultimoT) / 1000);
    ultimoT = ahora;
    var t = (ahora - t0) / 1000;

    // Si nadie mueve el mouse por un rato, la mancha vuelve a flotar sola
    if (!tactil && !autonomo && !puntero.dentro && ahora - puntero.ultimoMov > 4000) autonomo = true;

    var objetivoX, objetivoY, objetivoR;
    if (autonomo) {
      objetivoX = W * (0.5 + 0.3 * Math.sin(t * 0.35));
      objetivoY = H * (0.45 + 0.18 * Math.sin(t * 0.52 + 1.2));
      objetivoR = R * 0.85;
    } else {
      objetivoX = puntero.x;
      objetivoY = puntero.y;
      objetivoR = puntero.dentro ? R : 0;
    }

    var antesX = cabeza.x, antesY = cabeza.y;
    var suave = 1 - Math.pow(0.0008, dt); // seguimiento con inercia
    cabeza.x += (objetivoX - cabeza.x) * suave;
    cabeza.y += (objetivoY - cabeza.y) * suave;
    cabeza.r += (objetivoR - cabeza.r) * (1 - Math.pow(0.02, dt));

    // Deja estela según la velocidad
    var vel = Math.hypot(cabeza.x - antesX, cabeza.y - antesY);
    if (cabeza.r > 4 && vel > 1.5) {
      estela.push({ x: cabeza.x, y: cabeza.y, r: Math.min(R * 0.75, 18 + vel * 2.2), vida: 1, semilla: Math.random() * 6 });
      if (estela.length > 46) estela.shift();
    }
    for (var i = estela.length - 1; i >= 0; i--) {
      estela[i].vida -= dt * 0.85;
      if (estela[i].vida <= 0) estela.splice(i, 1);
    }

    // 1) Máscara pequeña
    var m = ESCALA_MASCARA;
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.clearRect(0, 0, mascara.width, mascara.height);
    mctx.setTransform(m, 0, 0, m, 0, 0);
    mctx.fillStyle = "#fff";
    for (var j = 0; j < estela.length; j++) {
      var e = estela[j];
      var v = e.vida * e.vida * (3 - 2 * e.vida); // suavizado
      mancha(e.x, e.y, e.r * v, t, e.semilla);
    }
    mancha(cabeza.x, cabeza.y, cabeza.r, t, 0);

    // 2) Foto a color recortada por la máscara
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (cabeza.r > 0.5 || estela.length) {
      dibujarFoto();
      ctx.globalCompositeOperation = "destination-in";
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(mascara, 0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    }

    var sigue = autonomo || puntero.dentro || cabeza.r > 0.5 || estela.length > 0;
    if (visible && sigue && !document.hidden) raf = requestAnimationFrame(cuadro);
  };

  var arrancar = function () {
    if (!raf && visible && img && !document.hidden) {
      ultimoT = performance.now();
      raf = requestAnimationFrame(cuadro);
    }
  };

  var moverA = function (x, y) {
    var r = hero.getBoundingClientRect();
    puntero.x = x - r.left;
    puntero.y = y - r.top;
    puntero.ultimoMov = performance.now();
    if (autonomo && !tactil) {
      autonomo = false;
    }
    arrancar();
  };

  hero.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    puntero.dentro = true;
    moverA(e.clientX, e.clientY);
  });
  hero.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "touch") return;
    puntero.dentro = false;
    puntero.ultimoMov = performance.now();
    arrancar();
  });
  // En celular: al tocar y arrastrar, la mancha sigue el dedo; al soltar vuelve a flotar
  hero.addEventListener("touchmove", function (e) {
    var tq = e.touches[0];
    autonomo = false;
    puntero.dentro = true;
    moverA(tq.clientX, tq.clientY);
  }, { passive: true });
  hero.addEventListener("touchend", function () {
    puntero.dentro = false;
    setTimeout(function () { if (!puntero.dentro) { autonomo = true; arrancar(); } }, 1200);
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) arrancar();
    }).observe(hero);
  }
  document.addEventListener("visibilitychange", arrancar);

  var redimensionar = function () {
    medir();
    arrancar();
  };
  window.addEventListener("resize", redimensionar, { passive: true });

  // Usa la misma foto ya descargada (no se baja otra imagen)
  var listo = function () {
    img = foto;
    medir();
    cabeza.x = W * 0.5;
    cabeza.y = H * 0.45;
    hero.classList.add("is-liquid");
    arrancar();
  };
  if (foto.complete && foto.naturalWidth) listo();
  else foto.addEventListener("load", listo, { once: true });
})();
