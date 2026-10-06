// Se carga en el <head> de todas las páginas, antes de dibujar nada.
// 1) Marca que hay JavaScript (para preparar animaciones sin esconder contenido si algo falla).
// 2) Muestra la pantalla de carga roja solo la primera vez en la sesión; si no, una cortina breve.
// 3) Página 404 en una dirección profunda: fija la base "/" para que carguen estilos y fotos.
(function () {
  var d = document.documentElement;

  if (d.getAttribute("data-pagina") === "404" && /^https?:$/.test(location.protocol) && !document.querySelector("base")) {
    var base = document.createElement("base");
    base.href = "/";
    document.head.appendChild(base);
  }

  if (d.classList.contains("js")) return;
  d.classList.add("js");

  var calma = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var visto = false;
  try { visto = sessionStorage.getItem("sg-cargado") === "1"; } catch (e) {}
  if (!calma) d.classList.add(visto ? "sg-cortina-on" : "sg-carga-on");

  // Seguro: si por algo no corre el resto del sitio, la pantalla de carga se quita sola.
  setTimeout(function () { d.classList.remove("sg-carga-on", "sg-cortina-on"); }, 5000);
})();
