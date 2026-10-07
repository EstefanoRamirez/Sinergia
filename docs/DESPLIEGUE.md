# Publicar la web de Sinergia

Sigue los pasos **en orden**. Cada uno termina con **✅ Cómo saber que salió bien**.
Tiempo total: 1 a 2 horas. Todo es gratis salvo el dominio, que ya tienes.

> Los nombres de los botones de Cloudflare, Resend y Google pueden cambiar un poco o aparecer en inglés.
> Si no encuentras uno exacto, busca uno parecido en la misma pantalla.

---

## 1. Publicar en Cloudflare Pages
1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Elige el repositorio **EstefanoRamirez/Sinergia**, rama **main**.
3. Build settings: **Framework preset: None** · **Build command:** (vacío) · **Build output directory:** `/`
4. **Save and Deploy**.

✅ Te da una dirección `https://<proyecto>.pages.dev` con la web funcionando (sin formularios todavía: al enviar uno, se abre WhatsApp).

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
4. Elige la función **configurar** y presiona **Ejecutar** (acepta los permisos).
5. **Implementar → Nueva implementación → Aplicación web** · Ejecutar como: **Yo** · Acceso: **Cualquier usuario** → **Implementar** y copia la URL.

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
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO` | solo si hiciste el paso 4 opcional | Sí / No / No |

Luego **Retry deployment**.

✅ Prueba final: llena la ventana **Inscríbete** con tus datos. Debe aparecer una fila en la hoja y llegar un WhatsApp al dueño con el botón para escribirte. Luego entra a **/boletines**, crea una cuenta con correo y contraseña, y verás la zona de suscriptores.

### Si alguien olvida su contraseña
No hace falta servicio de correos: la persona te escribe por WhatsApp (hay un enlace bajo el formulario). En Cloudflare → **Workers & Pages** → **KV** → `SUSCRIPTORES` → busca la clave `cuenta:` seguida de su correo (por ejemplo `cuenta:ana@empresa.com`) y bórrala. Luego dile que vuelva a registrarse con una contraseña nueva; sus datos de suscriptora se conservan.

## 8. (Opcional) WhatsApp automático al cliente
Para que el cliente reciba un WhatsApp automático apenas se inscribe hace falta la **WhatsApp Cloud API de Meta** (cuenta de Meta Business verificada, número dedicado y una plantilla aprobada; los mensajes iniciados por la empresa tienen costo por conversación).
Cuando lo tengas, agrega `WA_TOKEN`, `WA_PHONE_ID` y `WA_PLANTILLA` (la plantilla debe tener un parámetro: el nombre del cliente).
Mientras tanto, el dueño recibe el aviso con un botón que abre el chat con el cliente y un saludo ya escrito: un toque y listo.

## 9. Aparecer en Google
1. [Google Search Console](https://search.google.com/search-console) → agrega `sinergia.ec`.
2. **Sitemaps** → envía `https://www.sinergia.ec/sitemap.xml`.

## 10. Al terminar
- Despublica los sitios viejos de Wix para que Google no muestre páginas duplicadas.
- Activa la verificación en dos pasos en GitHub, Cloudflare, Resend y Google.
