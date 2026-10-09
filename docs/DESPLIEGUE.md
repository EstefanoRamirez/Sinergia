# Publicar la web de Sinergia

Sigue los pasos **en orden**. Cada uno termina con **✅ Cómo saber que salió bien**.
Tiempo total: 1 a 2 horas. Todo es gratis salvo el dominio, que ya tienes.

> Los nombres de los botones de Cloudflare, GitHub, Google y Bing pueden cambiar un poco o aparecer en inglés.
> Si no encuentras uno exacto, busca uno parecido en la misma pantalla.

---

## 1. Publicar en Cloudflare Pages
1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Elige el repositorio **EstefanoRamirez/Sinergia**, rama **main**.
3. Build settings: **Framework preset: None** · **Build command:** (vacío) · **Build output directory:** `/`
4. **Save and Deploy**.

✅ Te da una dirección `https://<proyecto>.pages.dev` con la web funcionando (sin formularios todavía: al enviar uno, se abre WhatsApp).


> La dirección de prueba que te dé Cloudflare (algo como `sinergia-abc.pages.dev`) es la tuya. **No uses `sinergia.pages.dev`**: ese nombre ya lo tiene otra persona y es otra web.
## 2. Base de datos de suscriptores (KV)
Sirve para los registros y el ingreso a Boletines.
1. Cloudflare → **Storage & Databases** → **KV** → **Create** → nombre: `sinergia-suscriptores`.
2. En tu proyecto de Pages → **Settings** → **Bindings** → **Add** → **KV namespace**.
   - Variable name: `SUSCRIPTORES` (exactamente así) · KV namespace: `sinergia-suscriptores`.
3. Vuelve a publicar: **Deployments** → los tres puntos del último → **Retry deployment**.

✅ En `/boletines`, al escribir un correo no registrado aparece "Ese correo no está registrado".

## 3. Conectar el dominio www.sinergia.ec
1. Proyecto de Pages → **Custom domains** → **Set up a custom domain** → `www.sinergia.ec`. Repite con `sinergia.ec`.
2. Sigue las instrucciones: si el dominio ya está en Cloudflare se configura solo; si no, agrega el registro **CNAME** que te indique donde administras el dominio.

⚠️ **No borres los registros MX ni TXT**: de ellos dependen los correos `@sinergia.ec`.

✅ `https://www.sinergia.ec` abre la web nueva con el candado.

## 4. (Opcional) Correos con Resend
No es necesario: la web funciona sin servicio de correos (las inscripciones llegan a la hoja de cálculo y al WhatsApp del dueño, y la zona de boletines usa contraseña). Solo si algún día quieres recibir además un correo por cada inscripción:

1. Crea una cuenta en [resend.com](https://resend.com) → **Domains** → **Add domain** → `sinergia.ec`.
2. Agrega en tu DNS los registros que te muestra Resend (son TXT/MX en un subdominio, no tocan tus correos actuales) y espera a que diga **Verified**.
3. **API Keys** → **Create API key** (permiso *Sending access*) y cópiala.

Si lo activas, agrega Resend en la lista de proveedores de la Política de privacidad.

## 5. Hoja de cálculo de inscripciones (Google Sheets)
1. Crea una hoja de Google llamada **Inscripciones Sinergia**.
2. **Extensiones → Apps Script** → borra todo y pega el contenido de `docs/planilla-inscripciones.gs`.
3. Cambia `CLAVE` por una tuya (letras y números) y guarda.
4. Elige la función **configurar** y presiona **Ejecutar** y acepta los permisos (incluye **enviar correos como tú**: así salen gratis los correos de "recuperar contraseña" y de activación del panel, desde esta cuenta de Google).
5. **Implementar → Nueva implementación → Aplicación web** · Ejecutar como: **Yo** · Acceso: **Cualquier usuario** → **Implementar** y copia la URL.

> Si más adelante cambias el código del script: **Implementar → Gestionar implementaciones → lápiz → Versión: Nueva versión → Implementar** (la URL no cambia).
> Usa para la hoja la cuenta de Google de la empresa (por ejemplo la de info@): los correos saldrán desde ella. Gmail permite unos 100 correos al día.

✅ La hoja tiene la fila de títulos en rojo y la columna **Estado** con una lista (Nuevo, Contactado, Inscrito, Pagado, No interesado).

## 6. Aviso por WhatsApp al dueño (CallMeBot, gratis)
1. Desde el celular del dueño, sigue las instrucciones de [callmebot.com](https://www.callmebot.com/blog/free-api-whatsapp-messages/) para obtener su **apikey**.
2. Arma el dato así: `593969094855:APIKEY` (varios números se separan con coma).

## 7. Guardar las claves en Cloudflare
Proyecto de Pages → **Settings** → **Variables and Secrets** → agrega (marca **Encrypt** en las secretas):

| Nombre | Valor | ¿Secreta? |
|---|---|---|
| `PLANILLA_URL` | la URL del paso 5 | No |
| `PLANILLA_CLAVE` | la CLAVE del paso 5 | Sí |
| `WHATSAPP_AVISOS` | el dato del paso 6 | Sí |
| `ADMIN_EMAILS` | correos que pueden entrar al panel «Equipo» (`/admin`), separados por coma: `capacitacion@sinergia.ec, cramirez@sinergia.ec, info@sinergia.ec, sistemas@sinergia.ec` | No |
| `CLAVE_EQUIPO` | contraseña compartida con la que esos correos entran al panel (larga y que no sea «Sinergia + año»: por ejemplo cuatro palabras al azar y un número) | Sí |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO` | solo si hiciste el paso 4 opcional | Sí / No / No |
| `TURNSTILE_SITEKEY`, `TURNSTILE_SECRET` | solo si activas el antispam opcional del paso 16 | No / Sí |

Luego **Retry deployment**.

✅ Prueba final: llena la ventana **Inscríbete** con tus datos. Debe aparecer una fila en la hoja y llegar un WhatsApp al dueño con el botón para escribirte. Luego entra a **/boletines**, crea una cuenta con correo y contraseña, y verás la zona de suscriptores.

### Contraseñas olvidadas y acceso al panel
- **Suscriptores:** en `/boletines` → «¿Olvidaste tu contraseña?» → les llega un correo con un enlace (vale 1 hora y una sola vez) para crear otra. Las sesiones abiertas en otros equipos se cierran solas.
- **Panel de boletines (`/admin`):** quien esté en `ADMIN_EMAILS` entra a `/admin` → «Activar mi acceso u olvidé mi contraseña» → recibe el enlace en su correo → crea su contraseña y ya puede publicar. Guía para la secretaria: `docs/GUIA-PANEL.md`.

## 8. (Opcional) WhatsApp automático al cliente
Para que el cliente reciba un WhatsApp automático apenas se inscribe hace falta la **WhatsApp Cloud API de Meta** (cuenta de Meta Business verificada, número dedicado y una plantilla aprobada; los mensajes iniciados por la empresa tienen costo por conversación).
Cuando lo tengas, agrega `WA_TOKEN`, `WA_PHONE_ID` y `WA_PLANTILLA` (la plantilla debe tener un parámetro: el nombre del cliente).
Mientras tanto, el dueño recibe el aviso con un botón que abre el chat con el cliente y un saludo ya escrito: un toque y listo.

## 9. Una sola versión del dominio y candado (HTTPS)
La versión oficial es **https://www.sinergia.ec**. Las demás (`sinergia.ec`, `http://…`, `*.pages.dev`) deben llevar a ella.
1. Cloudflare → tu dominio `sinergia.ec` → **Rules** → **Redirect Rules** → **Create rule** → plantilla **Redirect from root to WWW** (o créala así):
   - Si: *Hostname* **equals** `sinergia.ec`
   - Entonces: *Dynamic* → `concat("https://www.sinergia.ec", http.request.uri.path)` · código **301** · marca **Preserve query string**.
2. **SSL/TLS** → **Edge Certificates** → activa **Always Use HTTPS** y deja **Minimum TLS Version** en 1.2.
3. El certificado (candado) lo emite y **renueva solo** Cloudflare; no hay que hacer nada más.
4. La copia en `*.pages.dev` ya le dice a Google que no la muestre (cabecera `X-Robots-Tag: noindex` en `_headers`).

> Si el dominio **no** está administrado en Cloudflare (sus "nameservers" son de otra empresa), lo más simple es pasarlo a Cloudflare (gratis): **Add a site** → copia **todos** los registros, en especial **MX y TXT** de los correos, y luego cambia los nameservers donde compraste el dominio.

✅ `http://sinergia.ec/webinars` termina en `https://www.sinergia.ec/webinars`.

## 10. Estadísticas de visitas y conversiones (sin cookies)
1. Proyecto de Pages → **Metrics** → **Web Analytics** → **Enable**. Cloudflare agrega solo su contador; la web ya lo permite en su política de seguridad. No usa cookies, así que no hace falta pedir permiso a los visitantes.
2. **Conversiones**, dónde verlas:
   - Visitas a la página **/gracias** en Web Analytics = formularios enviados.
   - Pestaña **Inscripciones** de la hoja: cada inscripción, registro o mensaje, con la página desde donde llegó.
   - Pestaña **Clics WhatsApp** de la hoja: cada toque en un botón de WhatsApp, con la página y el botón.

✅ Al día siguiente, Web Analytics muestra visitas por página, país y dispositivo.

## 11. Aviso si la web se cae
Usa una de las dos (o ambas):
- **UptimeRobot** (recomendado, gratis): crea una cuenta en [uptimerobot.com](https://uptimerobot.com) → **New monitor** → tipo **HTTP(s)** → URL `https://www.sinergia.ec/api/estado` → cada 5 minutos → alerta a tu correo o Telegram.
- **GitHub** (ya incluido): GitHub → repositorio → **Settings** → **Secrets and variables** → **Actions** → pestaña **Variables** → **New repository variable**: `VIGILAR_URL` = `https://www.sinergia.ec`. Cada hora revisa la web y, si falla, GitHub te envía un correo.

> GitHub pausa las tareas programadas de repositorios públicos sin cambios por 60 días; si te llega ese aviso, entra a **Actions** y vuelve a activarla. UptimeRobot no tiene ese límite.

## 12. Copias de seguridad automáticas
Qué está respaldado y dónde:
- **La web completa** (código, textos, fotos): en GitHub, con todo el historial de cambios.
- **Inscripciones, mensajes y clics**: en la hoja de Google, que guarda su propio historial (**Archivo → Historial de versiones**).
- **Suscriptores y cuentas de boletines** (base KV): respaldo semanal cifrado con GitHub Actions. Para activarlo:
  1. Cloudflare → **My Profile** → **API Tokens** → **Create Token** → **Custom token** → permiso **Account · Workers KV Storage · Read** → crea y copia el token.
  2. Copia tu **Account ID** (aparece a la derecha en la página principal de tu cuenta de Cloudflare) y el **ID** del KV `sinergia-suscriptores` (Storage & Databases → KV).
  3. GitHub → **Settings** → **Secrets and variables** → **Actions**:
     - Pestaña **Secrets**: `CF_API_TOKEN` (el token), `CF_ACCOUNT_ID` (el Account ID) y `CLAVE_RESPALDO` (una contraseña larga que inventes y guardes en un lugar seguro).
     - Pestaña **Variables**: `KV_NAMESPACE_ID` (el ID del KV).
  4. **Actions** → **Respaldo de suscriptores** → **Run workflow** para probarlo. Luego corre solo cada lunes y cada copia se guarda 90 días.

Para **restaurar** un respaldo: descárgalo desde **Actions → Respaldo de suscriptores → Artifacts**, descífralo con
`openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in respaldo-kv-AAAA-MM-DD.json.enc -out respaldo.json` (te pedirá la CLAVE_RESPALDO)
y súbelo con `npx wrangler kv bulk put respaldo.json --namespace-id=<ID del KV>`.

## 13. Aparecer en Google (Search Console)
1. Entra a [Google Search Console](https://search.google.com/search-console) → **Agregar propiedad** → tipo **Dominio** → `sinergia.ec`.
2. Google te da un registro **TXT**: agrégalo en Cloudflare → **DNS** → **Add record** (tipo TXT, nombre `@`). No borres ningún TXT existente. Vuelve y presiona **Verificar**.
3. **Sitemaps** → envía `https://www.sinergia.ec/sitemap.xml`.
4. **Inspección de URLs** → pega `https://www.sinergia.ec/` → **Solicitar indexación**.

✅ En unos días aparece la cobertura de las 13 páginas.

## 14. Aparecer en Bing (Bing Webmaster Tools)
1. Entra a [Bing Webmaster Tools](https://www.bing.com/webmasters) con tu cuenta Microsoft o Google.
2. Elige **Importar desde Google Search Console** (trae el sitio y el sitemap ya verificados). Si no, agrega el sitio y verifica con el registro que te indique.
3. **Sitemaps** → confirma `https://www.sinergia.ec/sitemap.xml`.

## 15. Perfil de Empresa en Google (ya existe)
La ficha **«Sinergia Capacitación Empresarial Oportuna»** ya está en Google Maps (Calle E8-A y Ismael Solís, +593 96 909 4855, sinergia.ec), pero **todavía no tiene reseñas**.
1. Entra a [business.google.com](https://business.google.com) con la cuenta de la empresa y **reclama o verifica** la ficha si aún no es tuya.
2. Revisa la **categoría** (hoy dice «Consultora de administración empresarial»; puedes agregar «Centro de formación»), el **horario** (L–V 08:00–18:00, sáb 09:00–14:00) y sube **fotos** de los cursos.
3. Pide reseñas a tus participantes con este enlace directo (también está en la web, en Testimonios y en la página de gracias):
   `https://search.google.com/local/writereview?placeid=ChIJRbo_xVeX1ZER_KQJn7INdJ0`

## 16. Protección contra abusos (Cloudflare, gratis)
1. Tu dominio en Cloudflare → **Security** → **WAF** → **Rate limiting rules** → **Create rule**:
   - Nombre: `Limite API` · Si: *URI Path* **starts with** `/api/` · Mismo IP · **20 solicitudes cada 10 segundos** → Acción **Block** por 10 segundos.
2. **Security** → **Bots** → activa **Bot Fight Mode**.
3. **Security** → **Settings** → nivel de seguridad **Medium**.

Así, un ataque que intente adivinar contraseñas o llenar los formularios se corta antes de llegar al sitio, y la base gratuita no se agota.

4. **(Opcional, solo si empieza a llegar spam en los formularios) Turnstile**, la casilla antispam gratuita de Cloudflare:
   Cloudflare → **Turnstile** → **Add widget** → nombre `Sinergia`, dominio `sinergia.ec`, modo **Managed** → copia la *Site Key* y la *Secret Key*.
   Guárdalas en Pages → **Settings** → **Variables and Secrets** como `TURNSTILE_SITEKEY` y `TURNSTILE_SECRET` (esta última, secreta) → **Retry deployment**.
   La web ya está preparada: casi siempre la verificación es invisible y solo a veces pide tocar una casilla. Para apagarla, borra esas dos variables.

## 17. Al terminar
- Despublica los sitios viejos de Wix (`my-site-3` y `sinergia`) para que Google no muestre páginas duplicadas.
- **Haz privado el repositorio de GitHub** (desde aquí no tengo permiso para cambiarlo): github.com/EstefanoRamirez/Sinergia → **Settings** → **General** → al final, **Danger Zone** → **Change visibility** → **Make private** → confirma escribiendo el nombre. Cloudflare Pages sigue publicando igual. La vigilancia corre cada hora para no pasar de los 2.000 minutos gratis al mes de GitHub Actions en repositorios privados.
- Borra la rama vieja `sinergia-capacitacion` (GitHub → **Branches** → icono de basurero); su contenido ya está en `main`.
- Activa la verificación en dos pasos en GitHub, Cloudflare, Google y Microsoft.
- Nunca subas a GitHub la CLAVE de la hoja, los tokens ni contraseñas: van solo en Cloudflare y en los secretos de GitHub.
