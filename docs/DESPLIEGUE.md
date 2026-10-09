# Publicar la web de Sinergia — guía completa

Guía pensada para publicar por primera vez. Sigue las fases **en orden** y no te saltes las pruebas: cada paso
termina con **✅ Cómo saber que salió bien**.

- **Tiempo:** unas 3 horas repartidas en dos días (el cambio del dominio puede tardar algunas horas en verse en todo el mundo).
- **Costo:** $0. Todo es gratis salvo el dominio y el hosting de correo, que ya pagas.
- **Tranquilidad:** hasta la **Fase 6** nadie ve nada nuevo: la web vieja de Wix y los correos siguen igual.
  Y si en la Fase 6 algo sale mal, se deshace en un minuto (está explicado ahí).

> Los botones de Cloudflare, GitHub y Google a veces cambian de nombre o salen en inglés.
> Si no encuentras uno exacto, busca el parecido en la misma pantalla.

### Cómo está hoy tu dominio (revisado el 9 de octubre de 2026)
| Qué | Dónde está | ¿Se toca? |
|---|---|---|
| El dominio y su DNS (la "guía telefónica" del dominio) | Hosting **79dec** → cPanel → **Editor de zona** | Solo 2 registros, en la Fase 6 |
| Correos `@sinergia.ec` (info, capacitacion, cramirez, sistemas) | Hosting 79dec (cPanel), servidor `54.39.107.70` | **No** |
| `www.sinergia.ec` | Wix | Sí: pasa a la web nueva |
| `sinergia.ec` (sin www) | Mitad Wix (`185.230.63.107`) y mitad hosting (`54.39.107.70`) | Sí: se quita la parte de Wix |
| Registros de correo SPF, DKIM, DMARC y Brevo | Editor de zona | **No** |

> Dato extra: hoy los correos entran por `sinergia.ec`, que apunta mitad a Wix. Eso puede hacer que **algunos correos
> entrantes fallen sin que lo sepas**. En la Fase 6 se corrige solo, al quitar la parte de Wix.

---

## Fase 0 · Lo que necesitas antes de empezar (15 min)
1. **Cuenta de GitHub** con acceso al repositorio `EstefanoRamirez/Sinergia` (la tuya).
2. **Cuenta de Cloudflare** gratis: [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up). Úsala con un correo que revises siempre.
3. **Una cuenta de Gmail de la empresa** (por ejemplo `sinergia.capacitacion@gmail.com`). Desde ella saldrán los correos
   automáticos de la web (recuperar contraseña, avisos de boletines) y en ella vivirá la hoja de inscripciones.
   Gmail gratis permite unos 100 correos al día, suficiente para empezar.
4. **Acceso al cPanel de 79dec** (el mismo donde ves las cuentas de correo).
5. **El celular del dueño** (para los avisos por WhatsApp).
6. Activa la **verificación en dos pasos** en GitHub, Cloudflare y la cuenta de Gmail. Es lo que más protege la web.

✅ Puedes entrar a las cuatro cuentas (GitHub, Cloudflare, Gmail y cPanel).

---

## Fase 1 · Poner el repositorio en privado (2 min)
El código y los textos quedan visibles solo para ti. Cloudflare igual puede publicarlo.
1. Abre **github.com/EstefanoRamirez/Sinergia** → **Settings** (arriba a la derecha del repositorio).
2. Baja hasta el final, a **Danger Zone** → **Change visibility** → **Change to private**.
3. Confirma (GitHub te pide escribir el nombre del repositorio o tu contraseña).
4. Ya que estás ahí: **Branches** → borra la rama vieja `sinergia-capacitacion` (icono de basurero). Su contenido ya está en `main`.

✅ Junto al nombre del repositorio aparece la etiqueta **Private**.

> En privado, GitHub da 2.000 minutos gratis al mes para tareas automáticas. La web usa unos 750 (vigilancia cada hora y respaldo semanal).

---

## Fase 2 · Publicar la web en Cloudflare con el repositorio privado (15 min)
1. Cloudflare → menú izquierdo **Workers & Pages** → **Create** (o **Create application**).
2. Elige la pestaña **Pages** (no "Workers") → **Connect to Git** (o **Import an existing Git repository**).
3. **Conectar GitHub** (solo la primera vez): se abre GitHub y te pide instalar la app **Cloudflare Workers and Pages**.
   - Elige **Only select repositories** → marca **Sinergia** → **Install & Authorize**.
   - Como el repositorio es privado, este permiso es lo que deja a Cloudflare leerlo. Nadie más lo ve.
   - Si después no aparece el repositorio: GitHub → tu foto → **Settings** → **Applications** → **Installed GitHub Apps** →
     **Cloudflare Workers and Pages** → **Configure** → agrega **Sinergia** → **Save**.
4. Elige el repositorio **Sinergia** → **Begin setup**.
5. Configuración:
   - **Project name:** `sinergia-ec` (si está ocupado, `sinergia-capacitacion`). Será tu dirección de prueba: `https://sinergia-ec.pages.dev`.
     ⚠️ No uses `sinergia.pages.dev`: ese nombre es de otra persona y es otra web.
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** déjalo **vacío**
   - **Build output directory:** déjalo vacío (si te obliga a escribir algo, pon `/`)
6. **Save and Deploy**. Espera 1 o 2 minutos.

✅ Abre `https://sinergia-ec.pages.dev` (la tuya): se ve la web nueva. Los formularios todavía no guardan nada (al enviar, se abre WhatsApp); eso se activa en las fases siguientes.

> A partir de ahora, **cada vez que se suben cambios a `main`, Cloudflare publica solo** en 1 o 2 minutos.
> En **Deployments** ves cada publicación y puedes volver a una anterior con **Rollback**.

---

## Fase 3 · Base de datos de la web (KV) (5 min)
Guarda cuentas de boletines, suscriptores, boletines del panel y el calendario.
1. Cloudflare → **Storage & Databases** → **KV** → **Create** (o **Create namespace**) → nombre: `sinergia-suscriptores` → **Add**.
2. Ve a tu proyecto: **Workers & Pages** → `sinergia-ec` → **Settings** → **Bindings** → **Add** → **KV namespace**:
   - **Variable name:** `SUSCRIPTORES` (exactamente así, en mayúsculas)
   - **KV namespace:** `sinergia-suscriptores` → **Save**.

✅ En **Settings → Bindings** aparece `SUSCRIPTORES → sinergia-suscriptores`.

---

## Fase 4 · Hoja de inscripciones y correos automáticos (Google) (20 min)
Con la **cuenta de Gmail de la empresa** de la Fase 0:
1. Crea una hoja de Google llamada **Inscripciones Sinergia**.
2. **Extensiones → Apps Script** → borra todo lo que haya y pega el contenido completo de `docs/planilla-inscripciones.gs`.
3. Arriba del código, cambia:
   - `CLAVE` → una clave inventada, larga, solo letras y números (por ejemplo `k8Tq2Rmz7Lx4Wv9Pn3`). Anótala: se usa en la Fase 5.
   - `NOMBRE_REMITENTE` → déjalo como `Sinergia Capacitación Empresarial` (así aparece en los correos).
4. Guarda (icono de disquete).
5. Arriba, en la lista de funciones, elige **configurar** → **Ejecutar** → **Revisar permisos** → elige la cuenta →
   si aparece "Google no verificó esta app": **Configuración avanzada → Ir a … (no seguro)** (es tu propio script) → **Permitir**.
   Entre los permisos está **enviar correos como tú**: así salen gratis los correos de la web.
6. **Implementar → Nueva implementación** → engranaje → **Aplicación web**:
   - Ejecutar como: **Yo** · Quién tiene acceso: **Cualquier usuario** → **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`).

✅ La hoja tiene la fila de títulos en rojo, la columna **Estado** con una lista (Nuevo, Contactado, Inscrito, Pagado, No interesado) y una pestaña **Clics WhatsApp**, y tienes anotadas la **URL** y la **CLAVE**.

> Si algún día cambias el código del script: **Implementar → Gestionar implementaciones → lápiz → Versión: Nueva versión → Implementar**. La URL no cambia.

### Aviso por WhatsApp al dueño (CallMeBot, gratis)
1. Desde el celular del dueño, sigue las instrucciones de [callmebot.com](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
   (agregar el número del bot y mandarle un mensaje) para recibir su **apikey**.
2. Arma el dato así: `593969094855:APIKEY` (si son varios números, sepáralos con coma).

---

## Fase 5 · Claves de la web en Cloudflare (10 min)
Proyecto `sinergia-ec` → **Settings** → **Variables and Secrets** → **Add** (una por una). En las marcadas como secretas elige el tipo **Secret** (o **Encrypt**). Todas en el entorno **Production**.

| Nombre | Valor | Tipo |
|---|---|---|
| `PLANILLA_URL` | la URL `/exec` de la Fase 4 | Texto |
| `PLANILLA_CLAVE` | la CLAVE de la Fase 4 | **Secret** |
| `WHATSAPP_AVISOS` | `593969094855:APIKEY` | **Secret** |
| `ADMIN_EMAILS` | `capacitacion@sinergia.ec, cramirez@sinergia.ec, info@sinergia.ec, sistemas@sinergia.ec` | Texto |
| `CLAVE_EQUIPO` | la contraseña compartida del panel «Equipo» (larga; no «Sinergia + año». Ej.: cuatro palabras al azar y un número) | **Secret** |

Luego vuelve a publicar para que las tome: **Deployments** → los tres puntos (⋯) de la última → **Retry deployment**.

> Las claves viven solo aquí. **Nunca** las escribas en el código ni las mandes por WhatsApp; para compartir `CLAVE_EQUIPO` con el profesor y la secretaria, díganla en persona o usen un gestor de contraseñas (Bitwarden es gratis).

✅ Abre `https://sinergia-ec.pages.dev/api/estado`: debe decir `"kv":true,"planilla":true,"avisos":true`.

---

## Fase 6a · Probar todo en la dirección de prueba (30 min)
Hazlo en la computadora **y** en tu iPhone, en `https://sinergia-ec.pages.dev`. Marca cada punto:

**Visitante**
- [ ] La portada carga con la pantalla roja y el logo; el scroll va suave.
- [ ] La franja «Próximo programa» muestra el Programa NIIF.
- [ ] Todas las secciones del menú abren bien (Nosotros, Servicios, Webinars, Biblioteca, Galería, Testimonios, Contacto).
- [ ] Webinars: el calendario marca el día de hoy; las preguntas frecuentes se abren; el PDF del programa se ve y se descarga.
- [ ] Llena la ventana **Inscríbete** con tus datos → te lleva a **¡Gracias!**, aparece una fila en la hoja y le llega un WhatsApp al dueño.
- [ ] El formulario de **Contacto** también llega a la hoja.
- [ ] Un botón de WhatsApp abre el chat con el mensaje ya escrito.

**Suscriptor**
- [ ] **/boletines** → crea una cuenta con un correo tuyo personal → entras a la zona de boletines.
- [ ] Sal, toca «¿Olvidaste tu contraseña?» → te llega el correo (revisa no deseado) → creas otra contraseña y entras.

**Equipo** (candado «Equipo» al pie de la página)
- [ ] Entra con `info@sinergia.ec` y la `CLAVE_EQUIPO` → ves las pestañas Boletines, Calendario y Suscriptores.
- [ ] Publica un boletín de prueba en PDF con «Avisar por correo» marcado → a tu correo personal (si aceptaste novedades) llega el aviso.
- [ ] En ese correo, toca «date de baja» → confirma → ya no recibirías más avisos.
- [ ] Publica uno de prueba con 2 imágenes → en /boletines se ve como galería.
- [ ] Pestaña **Calendario**: agrega una clase de prueba → guarda → aparece en Webinars. Luego quítala y guarda.
- [ ] Pestaña **Suscriptores**: aparece tu cuenta; «Descargar Excel (CSV)» baja el archivo.
- [ ] Toca **Salir**. Borra los boletines de prueba antes (Editar → Eliminar).

✅ Todo marcado. Si algo falla, anota qué hiciste y qué viste (una captura ayuda) y lo revisamos **antes** de la Fase 6b.

---

## Fase 6b · Conectar www.sinergia.ec (el cambio real) (20 min + espera)
Haz esto en un horario tranquilo (por ejemplo, un viernes en la tarde o un sábado).

**1. Anota cómo está hoy** (tu plan para volver atrás). cPanel → **Dominios** → **Editor de zona** → `sinergia.ec` → **Administrar**. Saca una captura de toda la lista. Hoy deben verse, entre otros:
- `www.sinergia.ec` → CNAME → `pointing.wixdns.net`
- `sinergia.ec` → A → `185.230.63.107` (Wix) **y** `sinergia.ec` → A → `54.39.107.70` (hosting)

**2. Avisa a Cloudflare.** Proyecto `sinergia-ec` → **Custom domains** → **Set up a custom domain** → escribe `www.sinergia.ec` → **Continue**.
Cloudflare te dirá que agregues un **CNAME**: `www` → `sinergia-ec.pages.dev`. Déjala abierta.

**3. Cambia solo estos dos registros en el Editor de zona de cPanel:**
| Registro | Antes | Después |
|---|---|---|
| `www.sinergia.ec` (CNAME) | `pointing.wixdns.net` | `sinergia-ec.pages.dev` (tu dirección de prueba, sin `https://`) |
| `sinergia.ec` (A) `185.230.63.107` | existe | **Eliminar** este (el de Wix). El otro, `54.39.107.70`, **se queda** |

⚠️ **No toques nada más:** ni MX, ni `mail`, `webmail`, `cpanel`, `autodiscover`, ni los TXT (SPF `v=spf1…`, `default._domainkey`, `_dmarc`, `brevo-code`). De ellos dependen los correos.

**4. Que `sinergia.ec` (sin www) lleve a `www`.** cPanel → **Dominios** → **Redirecciones** (Redirects):
- Tipo: **Permanente (301)** · Dominio: `sinergia.ec` · Redirige a: `https://www.sinergia.ec/` · elige **Redirigir solo sin www** (*Only redirect without www*) · marca **Redirección comodín** (*Wild Card Redirect*) → **Agregar**.
- Si cPanel muestra **SSL/TLS Status** con `sinergia.ec` sin certificado, toca **Run AutoSSL** para que también tenga candado.

**5. Espera.** En Cloudflare → **Custom domains** el estado pasa de *Verifying* a **Active** (de 5 minutos a unas horas).

✅ Cuando diga **Active**:
- [ ] `https://www.sinergia.ec` abre la web nueva con candado (prueba también con los datos del celular, sin Wi-Fi).
- [ ] `sinergia.ec` y `http://www.sinergia.ec` terminan en `https://www.sinergia.ec`.
- [ ] Una dirección vieja de Wix, por ejemplo `https://www.sinergia.ec/quienes-somos`, lleva a la página nueva que le corresponde.
- [ ] Mándate un correo desde Gmail a `info@sinergia.ec` y responde desde `info@`: entra y sale normal.

**Si algo sale mal (volver atrás en 1 minuto):** en el Editor de zona pon otra vez `www` → CNAME → `pointing.wixdns.net`. La web de Wix vuelve a verse mientras lo revisamos. Por eso **no borres Wix todavía**.

---

## Fase 7 · Después de publicar (el mismo día o al siguiente, 40 min)

### Google y Bing
1. [Google Search Console](https://search.google.com/search-console) → **Agregar propiedad** → **Dominio** → `sinergia.ec`.
   Google te da un registro **TXT**: agrégalo en cPanel → **Editor de zona** → **Agregar registro** → TXT, nombre `sinergia.ec`, valor el que te dio Google. No borres los otros TXT. Vuelve y toca **Verificar**.
2. **Sitemaps** → envía `https://www.sinergia.ec/sitemap.xml`.
3. **Inspección de URLs** → `https://www.sinergia.ec/` → **Solicitar indexación**.
4. [Bing Webmaster Tools](https://www.bing.com/webmasters) → **Importar desde Google Search Console**.

✅ En unos días Search Console muestra las páginas indexadas.

### Perfil de Empresa en Google (ya existe)
La ficha **«Sinergia Capacitación Empresarial Oportuna»** ya está en Google Maps, pero **todavía sin reseñas**.
1. [business.google.com](https://business.google.com) → reclama o verifica la ficha si aún no es tuya.
2. Revisa la categoría (agrega «Centro de formación»), el horario (L–V 08:00–18:00, sáb 09:00–14:00), el sitio `https://www.sinergia.ec` y sube fotos.
3. Pide reseñas con este enlace directo (también está en la web):
   `https://search.google.com/local/writereview?placeid=ChIJRbo_xVeX1ZER_KQJn7INdJ0`

### Estadísticas de visitas (sin cookies)
Proyecto `sinergia-ec` → **Metrics** → **Web Analytics** → **Enable**. No usa cookies, así que no hay que pedir permiso a los visitantes.
- Visitas a **/gracias** = formularios enviados.
- La hoja de Google: pestaña de inscripciones (con la página de origen) y pestaña **Clics WhatsApp**.

### Aviso si la web se cae
- **UptimeRobot** (recomendado, gratis): [uptimerobot.com](https://uptimerobot.com) → **New monitor** → **HTTP(s)** → `https://www.sinergia.ec/api/estado` → cada 5 minutos → alerta a tu correo.
- **GitHub** (ya incluido): repositorio → **Settings** → **Secrets and variables** → **Actions** → pestaña **Variables** → **New repository variable**: `VIGILAR_URL` = `https://www.sinergia.ec`. Revisa cada hora y te escribe si falla.

### Copia de seguridad semanal de suscriptores y boletines
La web completa ya está respaldada en GitHub, y las inscripciones en la hoja de Google (**Archivo → Historial de versiones**). Para la base KV:
1. Cloudflare → tu foto → **My Profile** → **API Tokens** → **Create Token** → **Create Custom Token** → permiso **Account · Workers KV Storage · Read** → **Create** → copia el token.
2. Copia tu **Account ID** (página principal de Cloudflare, a la derecha, o en la barra de la dirección) y el **ID** del KV `sinergia-suscriptores` (Storage & Databases → KV).
3. GitHub → repositorio → **Settings** → **Secrets and variables** → **Actions**:
   - Pestaña **Secrets**: `CF_API_TOKEN` (el token), `CF_ACCOUNT_ID` y `CLAVE_RESPALDO` (una contraseña larga inventada; guárdala en un lugar seguro, sin ella no se puede abrir el respaldo).
   - Pestaña **Variables**: `KV_NAMESPACE_ID`.
4. **Actions** → **Respaldo de suscriptores** → **Run workflow** para probarlo. Luego corre solo cada lunes y cada copia se guarda 90 días.

Para **restaurar**: descarga el respaldo en **Actions → Respaldo de suscriptores → Artifacts** y, en una terminal,
`openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in respaldo-kv-AAAA-MM-DD.json.enc -out respaldo.json` (pide la CLAVE_RESPALDO) y
`npx wrangler kv bulk put respaldo.json --namespace-id=<ID del KV>`.

### Entregar el panel al equipo
Pásales `docs/GUIA-PANEL.md` y la `CLAVE_EQUIPO` en persona. Explícales el candado «Equipo» al pie de la web.

---

## Fase 8 · Una semana después
- [ ] Si todo va bien, en Wix: **Configuración → Dominios** → desconecta `sinergia.ec`, y **despublica** los sitios `my-site-3` y `sinergia` (así Google no muestra páginas duplicadas). Si pagas un plan de Wix, cancela la renovación.
- [ ] Revisa en Search Console que no haya errores y en la hoja que lleguen inscripciones.
- [ ] Revisa en Cloudflare → **Workers & Pages** → `sinergia-ec` → **Metrics** que no haya errores en las funciones.

---

## Si algo no funciona
| Síntoma | Qué revisar |
|---|---|
| Los formularios abren WhatsApp en vez de ir a «¡Gracias!» | `/api/estado` dice `planilla:false` → revisa `PLANILLA_URL` y `PLANILLA_CLAVE` (Fase 5) y que el script esté implementado como **Cualquier usuario** |
| No llegan correos de «recuperar contraseña» ni avisos | Revisa la carpeta de no deseado. En el script, **Ejecuciones** muestra errores. Gmail gratis: unos 100 al día |
| «La zona de suscriptores aún no está activada» | Falta el enlace KV `SUSCRIPTORES` (Fase 3) o hacer **Retry deployment** |
| El panel dice «Sin permisos» | El correo no está en `ADMIN_EMAILS` (revisa comas y espacios) o falta **Retry deployment** |
| `www.sinergia.ec` sigue mostrando Wix | Espera (hasta unas horas) o prueba con los datos del celular. Revisa que el CNAME de `www` diga `sinergia-ec.pages.dev` |
| Dejaron de llegar correos a `@sinergia.ec` | Revisa en el Editor de zona que los registros MX, `mail` y TXT estén como en tu captura del paso 1 de la Fase 6b |
| Un cambio en el código no se ve | Cloudflare → **Deployments**: el último debe decir *Success*. Recarga con Ctrl+F5 |

---

## Opcional, más adelante
- **Antispam Turnstile** (solo si llega spam en los formularios): Cloudflare → **Turnstile** → **Add widget** → dominio `sinergia.ec`, modo **Managed** → guarda `TURNSTILE_SITEKEY` (texto) y `TURNSTILE_SECRET` (secret) en **Variables and Secrets** → **Retry deployment**. La web ya está preparada.
- **Pasar el DNS a Cloudflare** (más protección: reglas contra ataques, Bot Fight Mode). Implica copiar con cuidado **todos** los registros de correo y cambiar los servidores DNS donde está registrado el dominio. No hace falta para empezar; si lo quieres, hazlo con ayuda y con la captura del Editor de zona a mano.
- **Correos con Resend** (para recibir además un correo por cada inscripción): cuenta en [resend.com](https://resend.com), verificar `sinergia.ec` y guardar `RESEND_API_KEY`, `EMAIL_FROM` y `EMAIL_TO`. Si lo activas, agrega Resend a la Política de privacidad.
- **WhatsApp automático al cliente** (WhatsApp Cloud API de Meta, con costo por conversación): `WA_TOKEN`, `WA_PHONE_ID` y `WA_PLANTILLA`.

## Reglas de oro
- Las contraseñas y claves van **solo** en Cloudflare (Fase 5) y en los secretos de GitHub. Nunca en el código.
- Verificación en dos pasos en GitHub, Cloudflare y Gmail.
- Antes de tocar el Editor de zona, **captura de pantalla**. Nunca borres MX ni TXT.
- Para cambiar textos de la web: ver `README.md` (tareas frecuentes). Para el panel: `docs/GUIA-PANEL.md`.
