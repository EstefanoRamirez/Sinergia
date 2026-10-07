# Sinergia Capacitación Empresarial — sitio web

Web de Sinergia Capacitación Empresarial Oportuna, publicada en Cloudflare Pages (reemplaza al sitio de Wix).
Guía para publicar y configurar correos, hoja de cálculo y boletines: [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).

## Tareas frecuentes

| Quiero… | Qué hacer |
|---|---|
| Cambiar el texto de una página | Editar `plantillas/paginas/<página>.html` y ejecutar `bash plantillas/armar-paginas.sh` |
| Cambiar el menú, el pie, la ventana "Inscríbete" o el aviso de cookies | Editar `plantillas/partes/` y ejecutar `bash plantillas/armar-paginas.sh` |
| Publicar un boletín (solo suscriptores) | Ver `boletines-privados/LEEME.md` |
| Publicar un PDF en Webinars o Biblioteca | Guardarlo en `descargas/` y seguir el comentario de la tarjeta en `plantillas/paginas/webinars.html` o `biblioteca.html` |
| Agregar una foto a la galería | Ver el comentario al inicio de `plantillas/paginas/galeria.html` |
| Agregar un cliente | Logo en `images/clientes/` (WebP, ~360 px) y una línea en `plantillas/paginas/clientes.html` |
| Cambiar el número de WhatsApp | `js/sitio.js` → `WHATSAPP`, `lib/servidor.js` → `WHATSAPP_SINERGIA` y el número visible en las plantillas |
| Publicar los cambios | `git add -A` → `git commit -m "..."` → `git push` |

> Los `.html` de la raíz se **generan** con `bash plantillas/armar-paginas.sh`: no se editan a mano.

## Páginas
`index` · `nosotros` · `servicios` · `webinars` · `biblioteca` · `boletines` (solo suscriptores) · `clientes` · `galeria` · `testimonios` · `contacto` · `privacidad` · `terminos` · `cookies` · `404`

## Lo que hace el sitio
- **Pantalla de carga** roja con el logo subiendo (primera visita) y **cortina roja** al cambiar de página.
- **Portada con máscara líquida** (`js/portada.js`): la foto se ve en blanco y negro y el cursor revela el color.
- **Animaciones** con GSAP + ScrollTrigger + SplitText y **scroll suave** con Lenis (`js/sitio.js`). Se desactivan si el visitante pidió "reducir movimiento". El contenido siempre se ve aunque falle una animación.
- **Testimonios** en tarjetas rojas que se voltean al pasar el cursor (en celular se ve todo de una vez).
- **Ventana "Inscríbete"** al abrir el sitio (una vez por semana, nunca si ya se registró) y **aviso de cookies** pequeño.
- **Formularios** (inscripción, registro y contacto) → `/api/formulario`: correo a Sinergia, fila en la hoja de Google y aviso por WhatsApp al dueño con el botón para escribirle al cliente. Si el servidor no responde, se abre WhatsApp con los datos.
- **Boletines** para suscriptores: ingreso con correo y un código de 6 números (sin contraseñas) → `/api/acceso` y `/api/boletines`.

## Carpetas
- `plantillas/` — piezas con las que se arman las páginas.
- `images/` — fotos en WebP (cada foto grande tiene una copia más liviana para celular).
- `fonts/` y `css/fuentes.css` — tipografías alojadas en el sitio: Cormorant Garamond (portada), Bricolage Grotesque (textos) y DM Mono (etiquetas).
- `css/sinergia.css` — todo el diseño.
- `js/` — `tema.js` (pantalla de carga sin parpadeo), `sitio.js`, `portada.js`, `vendor/` (GSAP y Lenis).
- `functions/` — servidor en Cloudflare: `api/formulario.js`, `api/acceso.js`, `api/boletines.js`, `sitemap.xml.js`, `robots.txt.js`, `_middleware.js`.
- `lib/servidor.js` — funciones compartidas del servidor (correo, hoja, WhatsApp, sesiones).
- `boletines-privados/` — PDF de boletines (no públicos).
- `descargas/` — PDF públicos.
- `docs/` — guía de publicación y script de la hoja de cálculo.

## Seguridad y privacidad
- `_headers`: política de seguridad del contenido estricta (todo se sirve desde el propio sitio; sin código ni estilos dentro del HTML), HTTPS obligatorio y caché.
- `functions/_middleware.js` oculta carpetas internas (`docs/`, `plantillas/`, `functions/`, `lib/`, `boletines-privados/`).
- Formularios con campo trampa contra robots, límite de envíos por IP y aceptación obligatoria de la política de privacidad.
- Zona de boletines sin contraseñas: códigos de un solo uso que vencen en 10 minutos (máximo 5 intentos) y sesión en cookie segura (HttpOnly, Secure). En la base solo se guardan huellas SHA-256 de códigos y sesiones.
- Política de privacidad conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (`privacidad.html`), términos y política de cookies.

## Créditos
Diseño y desarrollo: Estéfano Ramírez. Librerías: GSAP (licencia estándar gratuita de GreenSock), Lenis y normalize.css (MIT). Fuentes con licencia SIL Open Font License.
