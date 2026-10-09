# Sinergia Capacitación Empresarial — sitio web

Web de Sinergia Capacitación Empresarial Oportuna, publicada en Cloudflare Pages (reemplaza al sitio de Wix).
Guía para publicar y configurar correos, hoja de cálculo y boletines: [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).

## Tareas frecuentes

| Quiero… | Qué hacer |
|---|---|
| Cambiar el texto de una página | Editar `plantillas/paginas/<página>.html` y ejecutar `bash plantillas/armar-paginas.sh` |
| Cambiar el menú, el pie, la ventana "Inscríbete" o el aviso de cookies | Editar `plantillas/partes/` y ejecutar `bash plantillas/armar-paginas.sh` |
| Publicar, editar o borrar un boletín (PDF o imágenes) | Desde la web: **/admin** (guía en `docs/GUIA-PANEL.md`) |
| Agregar fechas al calendario de Webinars | Desde la web: **/admin** → pestaña **Calendario** (el archivo `datos/calendario.json` queda solo como respaldo) |
| Ver o descargar los suscriptores | **/admin** → pestaña **Suscriptores** → «Descargar Excel (CSV)» |
| Publicar un PDF en Webinars o Biblioteca | Guardarlo en `descargas/` y seguir el comentario de la tarjeta en `plantillas/paginas/webinars.html` o `biblioteca.html` |
| Agregar una foto a la galería | Ver el comentario al inicio de `plantillas/paginas/galeria.html` |
| Agregar un cliente | Logo en `images/clientes/` (WebP, ~360 px) y una línea en `plantillas/paginas/clientes.html` |
| Cambiar el número de WhatsApp | `js/sitio.js` → `WHATSAPP`, `lib/servidor.js` → `WHATSAPP_SINERGIA` y el número visible en las plantillas |
| Publicar los cambios | `git add -A` → `git commit -m "..."` → `git push` |

> Los `.html` de la raíz se **generan** con `bash plantillas/armar-paginas.sh`: no se editan a mano.

## Páginas
`index` · `nosotros` · `servicios` · `webinars` · `biblioteca` · `boletines` (solo suscriptores) · `clientes` · `galeria` · `testimonios` · `contacto` · `privacidad` · `terminos` · `cookies` · `gracias` (tras enviar un formulario, fuera de Google) · `admin` (panel interno, fuera de Google) · `404`

Direcciones limpias (`/nosotros`, sin `.html`). Las direcciones de las webs viejas de Wix redirigen con 301 (`_redirects`).

## Lo que hace el sitio
- **Pantalla de carga** roja con el logo subiendo (primera visita) y **cortina roja** al cambiar de página.
- **Portada con máscara líquida** (`js/portada.js`): la foto se ve en blanco y negro y el cursor revela el color.
- **Animaciones** con GSAP + ScrollTrigger + SplitText y **scroll suave** con Lenis (`js/sitio.js`). Funcionan siempre, sin depender de la configuración del equipo. El contenido se ve aunque falle una animación.
- **Testimonios** en tarjetas rojas que se voltean al pasar el cursor (en celular se ve todo de una vez).
- **Franja «Próximo programa»** bajo la portada, armada con el calendario: muestra la próxima clase y un aviso corto (p. ej. el pronto pago); se oculta sola cuando no hay clases próximas.
- **Cifras** en la portada (+1.000 profesionales capacitados, años desde 2016 —se calcula solo—, +30 empresas e instituciones) con contador animado.
- **Preguntas frecuentes** en Webinars (certificado, grabaciones, factura electrónica, pagos…), también como datos estructurados para Google.
- **Ventana "Inscríbete"** que no interrumpe al llegar: se abre al leer media página, al ir a salir o tras 40 segundos (una vez por semana, nunca si ya se registró ni mientras se escribe en un formulario), y **aviso de cookies** pequeño.
- **Formularios** (inscripción, registro y contacto) → `/api/formulario`: fila en la hoja de Google, aviso por WhatsApp al dueño con el botón para escribirle al cliente (y correo, si se activa Resend) y luego la página **/gracias**. Si el servidor no responde, se abre WhatsApp con los datos.
- **Medición sin cookies**: Cloudflare Web Analytics (visitas) y `/api/evento` (cada clic en WhatsApp queda en la hoja).
- **Datos estructurados** para Google (empresa y migas de pan) desde `plantillas/partes/datos-negocio.json`.
- **Monitoreo y respaldos** con GitHub Actions (`.github/workflows/`): revisión cada hora de la web y de `/api/estado`, y copia semanal cifrada de la base de suscriptores.
- **Boletines** para suscriptores: registro gratuito e ingreso con correo y contraseña; «¿Olvidaste tu contraseña?» envía un enlace por correo (gratis, desde Gmail con la hoja de Google) → `/api/acceso` y `/api/boletines`.
- **Panel `/admin`** (solo correos de `ADMIN_EMAILS` que activaron su acceso por correo), con tres pestañas:
  - **Boletines:** publicar, editar y borrar en PDF (se ven como libro) o imágenes (galería) y **avisar por correo** a quienes aceptaron novedades (8 correos por vez; si Gmail llega a su límite diario, se continúa otro día). Cada correo trae un enlace para darse de baja (`/api/baja`, firmado) → `/api/admin/boletines`, `/api/admin/aviso`.
  - **Calendario:** las clases del calendario de Webinars y el aviso corto de la portada → `/api/admin/calendario` (público: `/api/calendario`).
  - **Suscriptores:** lista con buscador y descarga en CSV para Excel → `/api/admin/suscriptores`.
- **Calendario** en Webinars: solo el mes actual, con el día de hoy resaltado; avanza solo (hora de Ecuador). Fechas desde el panel (o, si nunca se editó, `datos/calendario.json`). Los precios con fecha límite se ocultan solos (`data-hasta` / `data-desde`).
- **Antispam opcional** (Cloudflare Turnstile) en formularios y registro: queda apagado hasta poner `TURNSTILE_SITEKEY` y `TURNSTILE_SECRET` (ver `docs/DESPLIEGUE.md`, paso 16).
- **Modo liviano** automático en equipos modestos (poca memoria o pocos núcleos): mismas animaciones con menos carga para que el scroll vaya fluido.

## Carpetas
- `plantillas/` — piezas con las que se arman las páginas.
- `images/` — fotos en WebP (cada foto grande tiene una copia más liviana para celular).
- `fonts/` y `css/fuentes.css` — tipografías alojadas en el sitio: Bricolage Grotesque (títulos y textos), DM Mono (etiquetas) y Cormorant Garamond (detalles).
- `css/sinergia.css` — todo el diseño.
- `js/` — `tema.js` (pantalla de carga sin parpadeo), `sitio.js`, `portada.js`, `vendor/` (GSAP y Lenis).
- `functions/` — servidor en Cloudflare: `api/formulario.js`, `api/acceso.js`, `api/boletines.js`, `api/calendario.js`, `api/baja.js`, `api/config.js`, `api/evento.js`, `api/estado.js`, `api/admin/*` (panel), `sitemap.xml.js`, `robots.txt.js`, `_middleware.js`.
- `lib/` — funciones compartidas del servidor: `servidor.js` (correo, hoja, WhatsApp, sesiones, antispam), `admin.js` (permisos del panel), `boletines.js`, `calendario.js`, `suscriptores.js`.
- `boletines-privados/` — PDF de boletines (no públicos).
- `descargas/` — PDF públicos.
- `docs/` — guía de publicación y script de la hoja de cálculo.

## Seguridad y privacidad
- `_headers`: política de seguridad del contenido estricta (todo se sirve desde el propio sitio, salvo el contador de Cloudflare Web Analytics; sin código ni estilos dentro del HTML), HTTPS obligatorio, caché de un año para CSS/JS versionados y `noindex` en la copia `*.pages.dev`.
- `functions/_middleware.js` oculta carpetas internas (`docs/`, `plantillas/`, `functions/`, `lib/`, `boletines-privados/`).
- Formularios con campo trampa contra robots, límite de envíos por IP, revisión de origen (contra envíos desde otros sitios) y aceptación obligatoria de la política de privacidad (se guarda la fecha y la versión aceptada).
- Cookie de sesión `__Host-sg_ses` (HttpOnly, Secure, SameSite=Lax). Al cambiar la contraseña se cierran todas las sesiones anteriores. Enlaces de recuperación de un solo uso que vencen en 1 hora, sin revelar si un correo está registrado.
- Subidas del panel revisadas por su contenido real (PDF, JPG, PNG o WebP), con límite de tamaño; las imágenes se sirven con una política que impide ejecutar código.
- Exportación de suscriptores protegida contra fórmulas maliciosas al abrirla en Excel; enlaces de baja firmados (nadie puede dar de baja a otra persona) y con botón de confirmación.
- `/.well-known/security.txt` para reportar problemas de seguridad.
- Zona de boletines con contraseña: en la base solo se guarda su huella (PBKDF2-SHA256, 100 000 iteraciones, sal aleatoria), con límite de intentos por correo y por IP. Sesión en cookie segura (HttpOnly, Secure) de la que solo se guarda la huella SHA-256.
- Política de privacidad conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (`privacidad.html`), términos y política de cookies.

## Créditos
Diseño y desarrollo: Estéfano Ramírez. Fotos de stock: Pexels y Vecteezy (créditos en `terminos.html`). Librerías: GSAP (licencia estándar gratuita de GreenSock), Lenis y normalize.css (MIT). Fuentes con licencia SIL Open Font License.
