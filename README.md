# Sinergia Capacitación Empresarial — sitio web

Web estática de Sinergia Capacitación Empresarial Oportuna, publicada en Cloudflare Pages.
Reemplaza al sitio de Wix. Guía para publicar: [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).

## Tareas frecuentes

| Quiero… | Qué hacer |
|---|---|
| Cambiar el texto de una página | Editar `plantillas/paginas/<página>.html` y ejecutar `bash plantillas/armar-paginas.sh` |
| Cambiar el menú, el pie o los íconos | Editar `plantillas/partes/` y ejecutar `bash plantillas/armar-paginas.sh` |
| Cambiar el número de WhatsApp | `js/sitio.js` → `WHATSAPP`, y el número visible en `plantillas/partes/` y `plantillas/paginas/contacto.html` |
| Anunciar un webinar | `plantillas/paginas/webinars.html` → copiar un bloque `<article class="sg-card">` en "Próximos webinars" |
| Agregar una foto a la galería | Ver el comentario al inicio de la galería en `plantillas/paginas/galeria.html` |
| Agregar un cliente | Guardar el logo en `images/clientes/` (WebP, ~360 px) y copiar una línea en `plantillas/paginas/clientes.html` |
| Subir documentos a la Biblioteca | Ver el comentario en `plantillas/paginas/biblioteca.html` (los PDF van en `descargas/`) |
| Publicar los cambios | `git add -A` → `git commit -m "..."` → `git push` |

> Los `.html` de la raíz se **generan** con `bash plantillas/armar-paginas.sh`: no se editan a mano.

## Páginas
`index` (inicio) · `nosotros` · `servicios` · `webinars` · `clientes` · `testimonios` · `galeria` · `biblioteca` · `contacto` · `terminos` · `404`

## Animaciones
- **Portada con máscara líquida** (`js/portada.js`): la foto se ve en blanco y negro y el cursor revela el color con una mancha orgánica y una estela. En celular la mancha flota sola y sigue el dedo.
- **Scroll suave** con [Lenis](https://github.com/darkroomengineering/lenis) (`js/vendor/lenis.min.js`, licencia MIT).
- **Al bajar** (`js/sitio.js`): títulos que suben línea por línea, fotos que se revelan, paralaje, cifras que cuentan, frase que se ilumina palabra por palabra, servicios con columna fija y barra de avance, cintas de texto y logos en movimiento, vista previa que sigue al cursor en "Explora Sinergia".
- Todo se desactiva si quien visita activó "reducir movimiento" en su equipo.

## Carpetas
- `plantillas/` — piezas con las que se arman las páginas (`partes/`, `paginas/`, `armar-paginas.sh`).
- `images/` — fotos en WebP: `marca/` (logo, íconos, imagen para compartir), `portada/`, `nosotros/`, `servicios/`, `contacto/`, `testimonios/`, `clientes/`, `galeria/` (cada foto con una copia de 640 px para la cuadrícula).
- `css/sinergia.css` — todo el diseño (modo claro y oscuro, celular).
- `js/` — `tema.js` (modo oscuro sin parpadeo), `sitio.js` (menú, animaciones, galería, formulario), `portada.js` (máscara de la portada), `vendor/` (Lenis).
- `functions/` — Cloudflare: `sitemap.xml.js`, `robots.txt.js`, `_middleware.js` (oculta carpetas internas).

## Seguridad
- `_headers`: política de seguridad del contenido (CSP) estricta — solo scripts y estilos propios, sin código dentro del HTML, sin marcos externos — más HTTPS obligatorio y caché.
- El formulario de contacto no envía datos a ningún servidor: arma el mensaje y abre WhatsApp.
- Si se agrega un servicio externo (por ejemplo Google Analytics o un mapa), hay que permitirlo en `_headers`.

## Créditos
Diseño y código propios. Librerías de código abierto (licencia MIT): Lenis y normalize.css.
