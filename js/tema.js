// Aplica el tema claro u oscuro antes de dibujar la página (evita un destello blanco).
// Se carga en el <head> de todas las páginas.
(function () {
  var d = document.documentElement, t;

  // Página 404 en una dirección profunda (por ejemplo /a/b/c): los estilos, fotos y enlaces
  // deben buscarse desde la raíz del sitio. Solo aplica con la web publicada (http/https).
  if (d.getAttribute("data-pagina") === "404" && /^https?:$/.test(location.protocol) && !document.querySelector("base")) {
    var base = document.createElement("base");
    base.href = "/";
    document.head.appendChild(base);
  }

  if (d.classList.contains("js")) return; // ya se ejecutó
  d.classList.add("js");
  try { t = localStorage.getItem("medicol-tema"); } catch (e) {}
  if (t !== "dark" && t !== "light") {
    t = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  d.setAttribute("data-theme", t);
  d.setAttribute("data-bs-theme", t);
})();
