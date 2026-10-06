# Colchones Medicol — tienda web

Web estática con carrito, checkout por WhatsApp y avisos de pedido, publicada en Cloudflare Pages.
Guía completa para publicar: [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).

## Tareas frecuentes

| Quiero… | Qué hacer |
|---|---|
| Cambiar un precio, texto o foto de un producto | Editar `js/productos.js` |
| Agregar un producto | Copiar un bloque en `js/productos.js` y crear su carpeta en `images/productos/<id>/` |
| Cambiar el número de WhatsApp de los pedidos | `js/productos.js` → `"whatsapp"` y el número visible en `plantillas/partes/encabezado.html` y `pie.html` |
| Cambiar el menú, la barra superior o el pie | Editar `plantillas/partes/` y ejecutar `bash plantillas/armar-paginas.sh` |
| Cambiar el contenido de una página | Editar `plantillas/paginas/<página>.html` y ejecutar `bash plantillas/armar-paginas.sh` |
| Reemplazar el catálogo en PDF | Guardarlo como `descargas/catalogo-colchones-medicol.pdf` (menos de 25 MB) |
| Publicar los cambios | `git add -A` → `git commit -m "..."` → `git push` |

> Los `.html` de la raíz se **generan** con `bash plantillas/armar-paginas.sh`: no se editan a mano.
> El comando se ejecuta en la terminal de VS Code (Git Bash), dentro de la carpeta del proyecto.

## Páginas
- `index.html` — inicio
- `tienda.html` — tienda con filtros (`?cat=mascotas|colchones|cojines|promociones`, `?q=búsqueda`)
- `producto.html?id=...` — ficha de producto (una sola página para todos)
- `carrito.html` y `checkout.html` — compra; el pedido se confirma por WhatsApp
- `catalogo.html` — catálogo con descarga del PDF
- `nosotros.html`, `contacto.html`, `404.html` (dirección inexistente)

## Carpetas
- `plantillas/` — piezas con las que se arman las páginas (`partes/`, `paginas/`, `armar-paginas.sh`).
- `images/productos/<id>/` — `principal.webp` (tarjeta y galería), `principal-400.webp` (celular), `principal.jpg` (vista previa al compartir) y `ficha.webp` (página del catálogo).
- `images/categorias/`, `images/ambiente/` — fotos del inicio y de las categorías.
- `images/marca/` — íconos (pestaña, iPhone, Android) e imagen para compartir.
- `descargas/` — catálogo en PDF.
- `css/` — `base.css` (tipografía, íconos, pie y testimonios), `medicol.css` (resto del diseño), `bootstrap-base.css` (solo las reglas usadas de Bootstrap), `vendor/` (Swiper).
- `js/` — `productos.js` (datos), `tienda.js` (tienda, carrito, pedidos), `script.js` (menú, banner, tema), `tema.js` (modo oscuro), `vendor/` (Swiper).
- `functions/` — servidor en Cloudflare: `api/pedido.js` (avisos de pedido), `producto.js`, `tienda.js`, `catalogo.js` (páginas preparadas para Google), `sitemap.xml.js`, `robots.txt.js`, `_middleware.js` (oculta carpetas internas).
- `docs/` — guía de publicación y script de la hoja de pedidos.
- `originales/` — archivos originales pesados (no se suben a GitHub).

## Seguridad
- `_headers`: política de seguridad del contenido (CSP), HTTPS obligatorio y caché. Si se agrega un servicio externo (por ejemplo Google Analytics), hay que permitirlo ahí.
- No se usan scripts escritos dentro del HTML: todo va en archivos `.js` para que la CSP los permita.
- Los precios de cada pedido se recalculan en el servidor; las claves van como secretos en Cloudflare.

## Créditos
Diseño y código propios de Colchones Medicol. Librerías de código abierto (licencia MIT): Bootstrap (parte), Swiper y normalize.css; sus avisos de licencia están al inicio de cada archivo.
