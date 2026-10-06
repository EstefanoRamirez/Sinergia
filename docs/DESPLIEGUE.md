# Guía para publicar la web de Colchones Medicol

Esta guía te lleva **paso a paso**, desde tu computadora hasta la web funcionando con dominio propio, correos, avisos de WhatsApp y hoja de pedidos.

- Sigue los pasos **en orden**. No te saltes ninguno.
- Cada paso termina con **✅ Cómo saber que salió bien**. No avances hasta verlo.
- Donde algo puede fallar, verás **⚠️ Si algo sale mal**.
- Los pasos 17 y 18 son de **seguridad**: no los dejes para después.
- Tiempo total: **2 a 3 horas** (buena parte es esperar verificaciones).

> Los nombres de botones de Cloudflare, Resend y Google pueden cambiar un poco con el tiempo o aparecer en inglés. Si no encuentras un botón exacto, busca uno con un nombre parecido en la misma pantalla.

---

## Índice

- [Antes de empezar](#antes-de-empezar)
- [PASO 1. Crear tu archivo de claves](#paso-1-crear-tu-archivo-de-claves)
- [PASO 2. Revisar la web en tu computadora](#paso-2-revisar-la-web-en-tu-computadora)
- [PASO 3. Poner el repositorio de GitHub en privado](#paso-3-poner-el-repositorio-de-github-en-privado)
- [PASO 4. Conectar tu carpeta con GitHub](#paso-4-conectar-tu-carpeta-con-github)
- [PASO 5. Subir el código a GitHub](#paso-5-subir-el-código-a-github)
- [PASO 6. Crear la cuenta de Cloudflare](#paso-6-crear-la-cuenta-de-cloudflare)
- [PASO 7. Publicar la web en Cloudflare Pages](#paso-7-publicar-la-web-en-cloudflare-pages)
- [PASO 8. Comprar y conectar el dominio](#paso-8-comprar-y-conectar-el-dominio)
- [PASO 9. Correos de pedido con Resend](#paso-9-correos-de-pedido-con-resend)
- [PASO 10. Aviso de WhatsApp al dueño con CallMeBot](#paso-10-aviso-de-whatsapp-al-dueño-con-callmebot)
- [PASO 11. Hoja de pedidos en Google Sheets](#paso-11-hoja-de-pedidos-en-google-sheets)
- [PASO 12. Protección anti-bots con Turnstile](#paso-12-protección-anti-bots-con-turnstile)
- [PASO 13. Guardar las claves en Cloudflare](#paso-13-guardar-las-claves-en-cloudflare)
- [PASO 14. Prueba final](#paso-14-prueba-final)
- [PASO 15. Aparecer en Google](#paso-15-aparecer-en-google)
- [PASO 16. Enseñarle al dueño](#paso-16-enseñarle-al-dueño)
- [PASO 17. Proteger tus cuentas (verificación en dos pasos)](#paso-17-proteger-tus-cuentas-verificación-en-dos-pasos)
- [PASO 18. Límite de pedidos por minuto (Cloudflare)](#paso-18-límite-de-pedidos-por-minuto-cloudflare)
- [PASO 19. Cuando crezcan los pedidos](#paso-19-cuando-crezcan-los-pedidos)
- [Anexo A. Hacer cambios después](#anexo-a-hacer-cambios-después)
- [Anexo B. Solución de problemas](#anexo-b-solución-de-problemas)

---

## Antes de empezar

### Qué vas a tener al final

- La web en `https://colchonesmedicol.com` (o el dominio que compres).
- En cada pedido:
  1. **WhatsApp del cliente** al negocio (099 880 4606) con el pedido completo.
  2. **Correo** al dueño con qué despachar, dónde entregar y botones para responder al cliente.
  3. **Aviso de WhatsApp** al celular del dueño con enlaces para confirmar el pedido y avisar que va en camino.
  4. **Fila nueva en una hoja de Google** (tipo Excel) con todos los datos y una columna *Estado*.
  5. **Correo de confirmación al cliente**, si dejó su correo.

### Costos

| Servicio | Para qué | Costo |
|---|---|---|
| GitHub | Guardar el código en privado | Gratis |
| Cloudflare Pages | Publicar la web y la función de pedidos | Gratis (permite tiendas) |
| Resend | Enviar los correos | Gratis hasta 100 correos al día y 3.000 al mes |
| CallMeBot | Aviso de WhatsApp al dueño | Gratis |
| Google Sheets | Hoja de pedidos | Gratis |
| Dominio `.com` | La dirección de la web | ≈ USD 10–11 al año |

> **No uses Vercel gratis:** su plan gratuito prohíbe el uso comercial.

### Qué necesitas tener a mano

| Qué | Para qué paso |
|---|---|
| Tu cuenta de GitHub (EstefanoRamirez) | Pasos 3 a 5 |
| Un correo de Gmail (puede ser el tuyo) | Paso 11 |
| **El celular del dueño** con WhatsApp | Paso 10 |
| Una tarjeta de crédito o débito | Paso 8 (dominio) |
| VS Code abierto en la carpeta del proyecto | Pasos 2, 4, 5 y 12 |

### Resumen de todas las claves

Durante la guía vas a juntar **8 datos**. Esta tabla te dice de dónde sale cada uno. **No tienes que memorizarla**: cada paso te lo recuerda.

| Nombre | ¿Quién lo crea? | Cómo se ve | Dónde se pega | Paso |
|---|---|---|---|---|
| `RESEND_API_KEY` | **Se genera** en Resend | Empieza con `re_` (unos 36 caracteres) | Cloudflare (secreto) | 9 |
| `EMAIL_FROM` | **Lo escribes tú** | `Colchones Medicol <pedidos@avisos.colchonesmedicol.com>` | Cloudflare | 9 |
| `EMAIL_TO` | **Lo escribes tú** | `medicolscc@hotmail.com` | Cloudflare | 9 |
| `WHATSAPP_AVISOS` | **Lo armas tú** con la apikey que **genera** CallMeBot | `593998804606:1234567` (número, dos puntos, apikey) | Cloudflare (secreto) | 10 |
| `PLANILLA_CLAVE` | **La inventas tú** | Solo letras y números, 20 o más, por ejemplo `MedicolPedidos2026xQ7k` | En el script de Google **y** en Cloudflare (secreto) | 11 |
| `PLANILLA_URL` | **Se genera** en Google | Empieza con `https://script.google.com/macros/s/` y termina en `/exec` | Cloudflare | 11 |
| Site Key de Turnstile | **Se genera** en Cloudflare | Empieza con `0x4AAAA` | Archivo `js/productos.js` | 12 |
| `TURNSTILE_SECRET` | **Se genera** en Cloudflare | Empieza con `0x4AAAA` (más larga que la Site Key) | Cloudflare (secreto) | 12 |

---

## PASO 1. Crear tu archivo de claves

Vas a necesitar un lugar seguro para ir anotando las claves.

1. Abre el **Bloc de notas** de Windows.
2. Guarda el archivo como `claves-medicol.txt` en tu carpeta **Documentos**, **fuera** de la carpeta `ColchonesMedicol`.

> ⚠️ **Nunca** guardes este archivo dentro de la carpeta del proyecto: se subiría a GitHub y cualquiera con acceso vería las claves.

3. Copia esto dentro del archivo y guárdalo:

```
RESEND_API_KEY =
EMAIL_FROM = Colchones Medicol <pedidos@avisos.colchonesmedicol.com>
EMAIL_TO = medicolscc@hotmail.com
WHATSAPP_AVISOS =
PLANILLA_CLAVE =
PLANILLA_URL =
TURNSTILE_SITE_KEY =
TURNSTILE_SECRET =
```

✅ **Cómo saber que salió bien:** tienes `claves-medicol.txt` en Documentos, no en la carpeta del proyecto.

---

## PASO 2. Revisar la web en tu computadora

1. Abre la carpeta `ColchonesMedicol` en el Explorador de Windows.
2. Haz doble clic en `index.html`. Se abre en el navegador.
3. Recorre la web: tienda, un producto, añade algo al carrito, ve al carrito y al checkout (no confirmes el pedido).

> Desde tu computadora **no** llegan correos ni avisos: eso solo funciona con la web publicada.

4. Si cambiaste algo en la carpeta `plantillas/`, arma las páginas antes de seguir:
   1. En VS Code: menú **Terminal → New Terminal**.
   2. Arriba a la derecha de la terminal, en la flecha junto al **+**, elige **Git Bash** (no PowerShell).
   3. Escribe y pulsa Enter:

```bash
bash plantillas/armar-paginas.sh
```

✅ **Cómo saber que salió bien:** la terminal muestra `armada: index.html`, `armada: tienda.html`, etc., y al final `Listo.`

⚠️ **Si algo sale mal:**
- **`bash: command not found`** o un error rojo en PowerShell: no elegiste **Git Bash**. Repite el punto 2.
- **`No such file or directory`**: la terminal no está en la carpeta del proyecto. Escribe `cd ~/Documents/ColchonesMedicol` y repite.

---

## PASO 3. Poner el repositorio de GitHub en privado

1. Entra a https://github.com/EstefanoRamirez/ColchonesMedicol
2. Si te pide iniciar sesión, usa tu usuario **EstefanoRamirez** y tu contraseña (**la escribes tú**). Si tienes verificación en dos pasos, te pedirá un código de 6 dígitos (**se genera** en tu app o te llega por SMS).
3. Arriba, pestaña **Settings** (ícono de engranaje).
4. Baja hasta el final, a la zona roja **Danger Zone**.
5. **Change repository visibility** → **Change visibility** → **Change to private**.
6. GitHub te pide confirmar: escribe exactamente `EstefanoRamirez/ColchonesMedicol` y pulsa el botón de confirmar. Puede pedirte otra vez la contraseña o el código.

✅ **Cómo saber que salió bien:** junto al nombre del repositorio aparece la etiqueta **Private**.

⚠️ **Si algo sale mal:** si no ves **Settings**, no iniciaste sesión con la cuenta dueña del repositorio.

---

## PASO 4. Conectar tu carpeta con GitHub

Tu carpeta apunta a una dirección vieja de GitHub que ya no existe. Esto se hace **una sola vez**.

1. En VS Code abre una terminal **Git Bash** (como en el paso 2).
2. Escribe estos comandos **uno por uno**, pulsando Enter después de cada uno:

```bash
git remote set-url origin https://github.com/EstefanoRamirez/ColchonesMedicol.git
```

```bash
git fetch origin
```

```bash
git reset origin/main
```

```bash
git update-ref -d refs/remotes/gh/main
```

Qué hace cada uno:
- `git remote set-url`: cambia la dirección de GitHub por la correcta.
- `git fetch`: descarga la información de lo que hay en GitHub.
- `git reset origin/main`: pone tu historial encima del de GitHub **sin borrar ningún archivo** de tu carpeta.
- `git update-ref -d`: borra una referencia temporal que quedó de antes. Si dice `error` o no muestra nada, no importa.

> ⚠️ **Nunca** escribas `git reset --hard`. Ese sí borraría todos los cambios.

3. Comprueba que tu nombre está configurado:

```bash
git config user.name
```

Debe mostrar tu nombre. Si no muestra nada, escribe (con tus datos):

```bash
git config --global user.name "Carlos Estefano Ramirez Cevallos"
git config --global user.email "161258452+EstefanoRamirez@users.noreply.github.com"
```

✅ **Cómo saber que salió bien:** escribe `git status`. Debe mostrar muchos archivos en rojo (modificados o nuevos). Es normal: son todos los cambios que vas a subir en el paso 5.

⚠️ **Si algo sale mal:**
- **`git fetch` pide usuario y contraseña, o se abre una ventana:** es el administrador de credenciales de Git. Elige **Sign in with your browser**, inicia sesión en GitHub y autoriza. **No** escribas tu contraseña de GitHub en la terminal: GitHub ya no la acepta.
- **`Repository not found`:** revisa que el repositorio exista y que hayas iniciado sesión con la cuenta EstefanoRamirez.

---

## PASO 5. Subir el código a GitHub

1. En la terminal Git Bash:

```bash
git add -A
```

```bash
git commit -m "Tienda completa: páginas, carrito, checkout, modo oscuro y avisos de pedido"
```

```bash
git push origin main
```

2. Si se abre una ventana del navegador pidiendo autorizar a GitHub, acepta.

✅ **Cómo saber que salió bien:**
- La terminal termina con algo como `main -> main`.
- En GitHub (recarga la página) ves las carpetas `functions`, `plantillas`, `images` y archivos como `tienda.html`.
- **No** debe aparecer la carpeta `originales` (está excluida a propósito).

⚠️ **Si algo sale mal:**
- **`rejected ... (fetch first)`:** alguien subió cambios desde la página de GitHub. Escribe `git pull --rebase origin main` y luego repite `git push origin main`.
- **`nothing to commit`:** ya estaba todo subido. Sigue con el paso 6.
- **El push tarda mucho:** es normal la primera vez (sube unos 10 MB de fotos y el PDF).

---

## PASO 6. Crear la cuenta de Cloudflare

1. Entra a https://dash.cloudflare.com/sign-up
2. Escribe tu correo y una contraseña **nueva** (**la inventas tú**, mínimo 8 caracteres). Anótala en un lugar seguro.
3. Cloudflare te envía un correo: ábrelo y pulsa **Verify email**.
4. Si te pregunta qué quieres hacer o qué plan, elige el plan **Free** (gratis).

✅ **Cómo saber que salió bien:** ves el panel de Cloudflare, con el menú a la izquierda.

---

## PASO 7. Publicar la web en Cloudflare Pages

### 7.1 Crear el proyecto

1. En el menú izquierdo pulsa **Workers & Pages** (puede estar dentro de **Compute** o **Build**).
2. Pulsa **Create** (o **Create application**).
3. Elige la pestaña **Pages**. Si solo ves opciones de *Workers*, busca el enlace **"Looking to deploy Pages? Get started"**.
4. **Import an existing Git repository** → **Get started**.
5. **Connect GitHub**. Se abre GitHub para instalar la app **Cloudflare Workers and Pages**:
   - Elige **Only select repositories**.
   - En la lista, marca **ColchonesMedicol**.
   - Pulsa **Install & Authorize**. Puede pedirte tu contraseña de GitHub.
6. De vuelta en Cloudflare, elige **ColchonesMedicol** → **Begin setup**.

### 7.2 Configurar la compilación

Llena **exactamente** así:

| Campo | Valor |
|---|---|
| Project name | `colchonesmedicol` |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | *(déjalo vacío)* |
| Build output directory | `/` |

> El **Project name** define tu dirección provisional: `colchonesmedicol.pages.dev`. Si Cloudflare dice que el nombre ya existe, usa `colchonesmedicol-ec` y recuerda que tu dirección provisional cambia.

7. Pulsa **Save and Deploy**. Espera 1 o 2 minutos.

✅ **Cómo saber que salió bien:**
- Cloudflare muestra **Success** y un enlace.
- Pulsa **Continue to project** y abre `https://colchonesmedicol.pages.dev`: debe verse la web.
- Prueba `https://colchonesmedicol.pages.dev/docs/DESPLIEGUE.md`: debe decir **No encontrado** (la guía está oculta, como debe ser).

⚠️ **Si algo sale mal:**
- **El despliegue falla por el directorio o el comando de compilación:** ve a **Settings** → **Build** → **Build configurations** → **Edit**, escribe `exit 0` en **Build command** y guarda. Luego **Deployments** → en el último despliegue, menú **⋯** → **Retry deployment**.
- **No aparece ColchonesMedicol en la lista:** en GitHub ve a **Settings** (de tu cuenta, no del repositorio) → **Applications** → **Cloudflare Workers and Pages** → **Configure**, y agrega el repositorio.

Desde ahora, **cada `git push` actualiza la web sola** en más o menos un minuto.

---

## PASO 8. Comprar y conectar el dominio

### Opción A (recomendada): dominio `.com` en Cloudflare

1. Menú izquierdo: **Domain Registration** → **Register Domains**.
2. Busca `colchonesmedicol.com`.
3. Pulsa **Purchase**. Llena los datos del titular (nombre del dueño o de la empresa, dirección, teléfono; **los escribes tú**) y paga con tarjeta.
4. Cloudflare te envía un correo para **verificar los datos del titular**. Ábrelo y confirma: si no lo haces en 15 días, el dominio se suspende.
5. Espera a que el dominio aparezca como **Active** (de minutos a una hora).

### Opción B: dominio `.ec` o `.com.ec`

Cloudflare no vende dominios `.ec`. Cómpralo en un registrador ecuatoriano (por ejemplo, NIC.EC o un proveedor autorizado) y luego:

1. En Cloudflare: **Add a domain** (o **Onboard a domain**) → escribe tu dominio → plan **Free**.
2. Cloudflare te muestra **dos nameservers** (tipo `ada.ns.cloudflare.com`). Anótalos.
3. En la página donde compraste el dominio, busca **Nameservers** o **DNS** y reemplaza los que hay por esos dos.
4. Espera a que Cloudflare diga **Active** (puede tardar hasta 24 horas).

### 8.1 Conectar el dominio con la web (ambas opciones)

1. **Workers & Pages** → proyecto **colchonesmedicol** → pestaña **Custom domains**.
2. **Set up a custom domain** → escribe `colchonesmedicol.com` → **Continue** → **Activate domain**.
3. Repite con `www.colchonesmedicol.com`.

✅ **Cómo saber que salió bien:** en 5 a 30 minutos, `https://colchonesmedicol.com` y `https://www.colchonesmedicol.com` muestran la web con el candado de conexión segura.

### 8.2 Si tu dominio NO es `colchonesmedicol.com`

La imagen que se ve al compartir el enlace y los datos para Google tienen escrito `https://www.colchonesmedicol.com`. Cámbialo por tu dominio:

1. En VS Code: menú **Edit → Replace in Files** (Ctrl + Shift + H).
2. Buscar: `https://www.colchonesmedicol.com` · Reemplazar: `https://www.tudominio.com`.
3. En **files to include** escribe `plantillas/` y pulsa **Replace All**.
4. Arma las páginas (`bash plantillas/armar-paginas.sh`) y sube los cambios (paso 5).

⚠️ **Si algo sale mal:**
- **El dominio no carga después de 30 minutos:** en **Custom domains** revisa que diga **Active**. Si dice **Pending**, espera un poco más.
- **`ERR_SSL` o aviso de conexión no segura:** el certificado todavía se está creando. Espera 15 minutos.

---

## PASO 9. Correos de pedido con Resend

### 9.1 Crear la cuenta

1. Entra a https://resend.com → **Get started**.
2. Crea la cuenta con tu cuenta de GitHub o de Google (lo más fácil), o con correo y contraseña (**la inventas tú**).

### 9.2 Verificar el dominio

Resend recomienda enviar desde un **subdominio**, así que usarás `avisos.colchonesmedicol.com`.

1. Menú **Domains** → **Add Domain**.
2. Name: `avisos.colchonesmedicol.com` · Region: la que viene por defecto → **Add**.
3. Aparece el botón **Sign in to Cloudflare** (configuración automática). Púlsalo, inicia sesión en Cloudflare y autoriza. Resend agrega los registros solo.
4. Pulsa **Verify DNS Records**.

Si **no** aparece el botón de Cloudflare:

1. Resend muestra una tabla con 3 o 4 registros (tipo **MX** y **TXT**).
2. En otra pestaña: Cloudflare → tu dominio → **DNS** → **Records** → **Add record**.
3. Copia **cada** registro tal cual (Type, Name, Content y Priority si tiene). En **Proxy status** deja la nube **gris** (**DNS only**).
4. Vuelve a Resend → **Verify DNS Records**.

✅ **Cómo saber que salió bien:** el dominio dice **Verified** (de minutos a un par de horas).

### 9.3 Crear la clave

1. Menú **API Keys** → **Create API Key**.
2. Llena así:
   - Name: `web-medicol`
   - Permission: **Sending access**
   - Domain: `avisos.colchonesmedicol.com`
3. **Add**.
4. **Se genera** una clave que empieza con `re_`. **Cópiala en ese momento** y pégala en tu `claves-medicol.txt`, en `RESEND_API_KEY`.

> ⚠️ La clave **solo se muestra una vez**. Si la pierdes, bórrala en Resend y crea otra.

5. En tu archivo de claves, revisa también:
   - `EMAIL_FROM = Colchones Medicol <pedidos@avisos.colchonesmedicol.com>` (si tu dominio es otro, cámbialo).
   - `EMAIL_TO = medicolscc@hotmail.com`. Para recibir también en tu correo, sepáralos con coma y **sin espacios**: `medicolscc@hotmail.com,tucorreo@gmail.com`.

✅ **Cómo saber que salió bien:** tienes `RESEND_API_KEY` (empieza con `re_`), `EMAIL_FROM` y `EMAIL_TO` en tu archivo de claves.

⚠️ **Si algo sale mal:**
- **El dominio sigue en *Pending* después de 2 horas:** revisa en Cloudflare → **DNS** que los registros estén exactamente como dice Resend, con la nube **gris**.
- **Más adelante los correos llegan a *Correo no deseado* en Hotmail:** ábrelo, marca **No es correo no deseado** y agrega `pedidos@avisos.colchonesmedicol.com` a los contactos.

---

## PASO 10. Aviso de WhatsApp al dueño con CallMeBot

Esto se hace **en el celular del dueño**, una sola vez. Toma 5 minutos.

1. En el celular del dueño, abre https://www.callmebot.com/blog/free-api-whatsapp-messages/
2. La página muestra el **número del bot**. Guárdalo en los contactos del dueño con el nombre **Avisos Web**.
3. Abre WhatsApp, busca el contacto **Avisos Web** y envíale **exactamente** el mensaje que indica la página. Hoy es:

```
I allow callmebot to send me messages
```

4. En uno o dos minutos el bot responde con un mensaje que incluye **apikey**: un número de unos 6 o 7 dígitos (**se genera**). Anótalo.
5. Arma el dato así: número del dueño en formato internacional (sin `+`, sin espacios, sin el 0 inicial), dos puntos y la apikey:

```
593998804606:1234567
```

(`1234567` es un ejemplo: usa la apikey real).

6. Pégalo en tu archivo de claves, en `WHATSAPP_AVISOS`.

**Para recibir también tú los avisos:** repite los pasos 1 a 5 en **tu** celular y separa ambos datos con coma, sin espacios:

```
593998804606:1234567,593987654321:7654321
```

7. **Prueba la apikey:** en el navegador de tu computadora abre esta dirección, cambiando la apikey:

```
https://api.callmebot.com/whatsapp.php?phone=+593998804606&text=Prueba&apikey=1234567
```

✅ **Cómo saber que salió bien:** al celular del dueño le llega un WhatsApp que dice **Prueba**.

⚠️ **Si algo sale mal:**
- **El bot no responde en 5 minutos:** sigue las instrucciones de la página (a veces piden esperar o enviar el mensaje de nuevo). CallMeBot es un servicio gratuito sin garantía; si falla, el pedido igual llega por correo y por el WhatsApp del cliente.
- **La prueba dice `APIKey is invalid`:** revisa que el número sea el mismo celular donde se activó el bot y que la apikey no tenga espacios.
- **El dueño cambia de número:** hay que repetir este paso con el número nuevo.

---

## PASO 11. Hoja de pedidos en Google Sheets

### 11.1 Crear la hoja y pegar el script

1. Entra a https://sheets.new con tu cuenta de Google. Se crea una hoja en blanco.
2. Arriba a la izquierda, cambia *Hoja de cálculo sin título* por **Pedidos Medicol**.
3. Menú **Extensiones** → **Apps Script**. Se abre otra pestaña con un editor de código.
4. Borra todo lo que haya en el editor.
5. En VS Code abre `docs/planilla-pedidos.gs`, selecciona todo (Ctrl + A), cópialo (Ctrl + C) y pégalo en el editor de Google (Ctrl + V).
6. **Inventa** la clave de la hoja: solo letras y números, sin espacios ni tildes, de 20 caracteres o más. Ejemplo: `MedicolPedidos2026xQ7k`.
7. En el editor de Google, busca la línea:

```js
const CLAVE = "cambia-esta-clave-123";
```

   y cambia el texto entre comillas por tu clave:

```js
const CLAVE = "MedicolPedidos2026xQ7k";
```

8. Pega la misma clave en tu archivo de claves, en `PLANILLA_CLAVE`.
9. Guarda: ícono del disquete o **Ctrl + S**.

> ⚠️ Cambia la clave **solo en el editor de Google**, **nunca** en el archivo `docs/planilla-pedidos.gs` de tu carpeta: ese archivo se sube a GitHub.

### 11.2 Preparar la hoja (una sola vez)

1. En la barra de arriba del editor hay un menú desplegable con nombres de funciones. Elige **configurar**.
2. Pulsa **▶ Ejecutar**.
3. La primera vez Google pide permisos:
   1. **Revisar permisos** → elige tu cuenta de Google.
   2. Sale *"Google no verificó esta app"*. Es normal: la app es tu propio script. Pulsa **Configuración avanzada** (o **Avanzado**) → **Ir a Pedidos Medicol (no seguro)**.
   3. Pulsa **Permitir**.
4. Vuelve a la pestaña de la hoja.

✅ **Cómo saber que salió bien:** hay una pestaña **Pedidos** con los títulos en azul oscuro (Fecha, Pedido, Estado, Cliente…).

5. **Prueba:** en el editor elige la función **probar** → **▶ Ejecutar**.

✅ **Cómo saber que salió bien:** en la hoja aparece un pedido de ejemplo con el estado **Nuevo** en amarillo. Bórralo: clic derecho en el número de la fila → **Borrar fila**.

### 11.3 Publicar el script

1. En el editor, arriba a la derecha: **Implementar** → **Nueva implementación**.
2. Junto a *Seleccionar tipo*, pulsa el engranaje ⚙ → **Aplicación web**.
3. Llena así:

| Campo | Valor |
|---|---|
| Descripción | `pedidos web` |
| Ejecutar como | **Yo** (tu correo) |
| Quién tiene acceso | **Cualquier usuario** |

4. **Implementar**. Si vuelve a pedir permisos, repite lo del punto 11.2.3.
5. **Se genera** la **URL de la aplicación web**. Empieza con `https://script.google.com/macros/s/` y termina en `/exec`. Cópiala con el botón **Copiar** y pégala en tu archivo de claves, en `PLANILLA_URL`.

> ⚠️ **"Cualquier usuario"** es necesario para que la web pueda escribir en la hoja. No es un riesgo: sin la `PLANILLA_CLAVE` correcta, el script rechaza todo.

### 11.4 Compartir la hoja con el dueño

1. En la hoja, botón **Compartir** (arriba a la derecha).
2. Escribe el correo del dueño → rol **Editor** → **Enviar**.
3. En el celular del dueño, instala **Hojas de cálculo de Google** (Google Sheets) e inicia sesión con ese correo.

> Si algún día necesitan el archivo de Excel: en la hoja, **Archivo** → **Descargar** → **Microsoft Excel (.xlsx)**.

⚠️ **Si algo sale mal:**
- **"No se encontró la función configurar":** no guardaste el script. Pulsa Ctrl + S y vuelve a intentarlo.
- **Si más adelante cambias el script:** **Implementar** → **Gestionar implementaciones** → lápiz ✏ → **Versión: Nueva versión** → **Implementar**. Así la URL **no cambia**. Si haces una *Nueva implementación*, se genera **otra** URL y debes actualizar `PLANILLA_URL` en Cloudflare.

---

## PASO 12. Protección anti-bots con Turnstile

Evita que alguien envíe pedidos falsos en masa, que llenarían de avisos al dueño y gastarían los correos gratis.

### 12.1 Crear el widget

1. Cloudflare → menú izquierdo **Turnstile** → **Add widget** (o **Add site**).
2. Llena así:

| Campo | Valor |
|---|---|
| Widget name | `checkout medicol` |
| Hostnames | `colchonesmedicol.com`, `www.colchonesmedicol.com` y `colchonesmedicol.pages.dev` (uno por uno, pulsando **Add**) |
| Widget mode | **Managed** |
| Pre-clearance | **No** |

3. **Create**. **Se generan** dos claves:
   - **Site Key:** empieza con `0x4AAAA`. Es pública. Anótala en `TURNSTILE_SITE_KEY`.
   - **Secret Key:** también empieza con `0x4AAAA`, pero es más larga. Es **secreta**. Anótala en `TURNSTILE_SECRET`.

### 12.2 Poner la Site Key en la web

1. En VS Code abre `js/productos.js`.
2. Busca la línea:

```js
"turnstileSiteKey": "",
```

3. Pega la Site Key entre las comillas:

```js
"turnstileSiteKey": "0x4AAAAAAA-tu-site-key",
```

4. Guarda (Ctrl + S) y súbelo:

```bash
git add -A
git commit -m "Activo Turnstile"
git push origin main
```

✅ **Cómo saber que salió bien:** en un minuto, en la web publicada, entra al checkout con algo en el carrito. Normalmente **no verás nada nuevo**: la verificación es invisible y solo muestra un recuadro si sospecha de un robot.

> ⚠️ **Muy importante:** pon **las dos** claves o **ninguna**. Si guardas `TURNSTILE_SECRET` en Cloudflare (paso 13) pero la Site Key **no** está en `js/productos.js`, el servidor rechazará **todos** los pedidos: el cliente igual enviará su WhatsApp, pero no llegarán el correo, el aviso ni la fila de la hoja.

---

## PASO 13. Guardar las claves en Cloudflare

Aquí pasas los datos de tu `claves-medicol.txt` a Cloudflare.

1. Cloudflare → **Workers & Pages** → proyecto **colchonesmedicol** → **Settings** → **Variables and Secrets**.
2. Por cada fila de esta tabla pulsa **Add**, elige el **Type**, escribe el **Variable name** exactamente igual (con mayúsculas y guiones bajos) y pega el **Value** desde tu archivo de claves. Entorno: **Production**.

| Variable name | Type | Value |
|---|---|---|
| `RESEND_API_KEY` | **Secret** | la clave `re_...` |
| `EMAIL_FROM` | Text | `Colchones Medicol <pedidos@avisos.colchonesmedicol.com>` |
| `EMAIL_TO` | Text | `medicolscc@hotmail.com` |
| `WHATSAPP_AVISOS` | **Secret** | `593998804606:1234567` |
| `PLANILLA_URL` | Text | `https://script.google.com/macros/s/.../exec` |
| `PLANILLA_CLAVE` | **Secret** | tu clave inventada |
| `TURNSTILE_SECRET` | **Secret** | la Secret Key `0x4AAAA...` |
| `CONFIRMAR_CLIENTE` | Text | *(opcional)* escribe `no` solo si **no** quieres enviar correo de confirmación al cliente |

3. Pulsa **Save** (o **Deploy**).
4. Para que la web use las claves nuevas: pestaña **Deployments** → en el despliegue de arriba, menú **⋯** → **Retry deployment**. Espera a que diga **Success**.

> Las variables de tipo **Secret** no se pueden volver a ver después de guardarlas, solo reemplazar. Por eso las guardas primero en tu archivo de claves.

⚠️ **Si algo sale mal:**
- **Pegaste un espacio al inicio o al final:** bórralo. Un espacio de más hace que la clave no funcione.
- **Escribiste mal el nombre** (por ejemplo `RESEND_APIKEY`): bórrala y créala con el nombre exacto de la tabla.
- **No hiciste *Retry deployment*:** los cambios de variables solo se aplican en un despliegue nuevo.

---

## PASO 14. Prueba final

Haz un pedido de prueba **desde tu celular** en `https://colchonesmedicol.com`:

1. Añade el *Colchón para perros pequeños* al carrito → **Finalizar compra**.
2. Llena con **tu** nombre y **tu** número. En **Referencia** escribe `PRUEBA - NO DESPACHAR`.
3. Pulsa **Confirmar pedido**.

Debe pasar **todo** esto:

| Qué | Dónde mirar | Tiempo |
|---|---|---|
| Se abre WhatsApp con el pedido ordenado | Tu celular | Al instante |
| Llega el correo *"Nuevo pedido MED-..."* | Correo de `EMAIL_TO` (revisa también *Correo no deseado*) | Hasta 1 minuto |
| Llega el aviso *"¡Nuevo pedido en la web!"* | WhatsApp del dueño, desde el contacto **Avisos Web** | Hasta 1 minuto |
| Aparece una fila con estado **Nuevo** | Hoja **Pedidos Medicol** | Hasta 1 minuto |

4. Si dejaste tu correo en el pedido, también te llega *"¡Recibimos su pedido!"*.
5. Borra la fila de prueba de la hoja y avísale al dueño que era una prueba.

✅ **Cómo saber que salió bien:** llegaron las 4 cosas de la tabla.

Si algo no llegó, revisa el [Anexo B](#anexo-b-solución-de-problemas).

---

## PASO 15. Aparecer en Google

### 15.1 Google Search Console

1. Entra a https://search.google.com/search-console con tu cuenta de Google.
2. **Agregar propiedad** → elige **Dominio** → escribe `colchonesmedicol.com` → **Continuar**.
3. **Se genera** un registro **TXT** que empieza con `google-site-verification=`. Cópialo.
4. En otra pestaña: Cloudflare → tu dominio → **DNS** → **Records** → **Add record**:

| Campo | Valor |
|---|---|
| Type | `TXT` |
| Name | `@` |
| Content | el texto `google-site-verification=...` |

5. **Save** → vuelve a Search Console → **Verificar**. Si falla, espera 10 minutos y vuelve a intentarlo.
6. Menú **Sitemaps** → escribe `sitemap.xml` → **Enviar**.

✅ **Cómo saber que salió bien:** en **Sitemaps** aparece `sitemap.xml` con estado **Correcto**. Google tarda de días a semanas en mostrar la web en los resultados.

### 15.2 Google Business Profile (muy recomendado)

1. Entra a https://business.google.com con el correo del negocio.
2. Crea el perfil: nombre **Colchones Medicol**, categoría **Tienda de colchones**, teléfono y la web.
3. Google verifica el negocio (por llamada, SMS, video o una postal).

Así el negocio aparece en Google Maps, con horario, fotos y reseñas.

### 15.3 Probar cómo se ve el enlace al compartir

Envía `https://colchonesmedicol.com` por WhatsApp a ti mismo: debe verse una vista previa con la imagen de los perros y el logo. También puedes probarlo en https://developers.facebook.com/tools/debug/

---

## PASO 16. Enseñarle al dueño

Uso diario, en 4 pasos:

1. **Llega un pedido:** le llega un WhatsApp *"¡Nuevo pedido en la web!"* con qué despachar y a dónde.
2. **Confirmar al cliente:** toca el enlace de *"Confirmar el pedido al cliente"*. Se abre el chat del cliente con el mensaje ya escrito: solo pulsa **Enviar**.
3. **Despacho:** cuando el pedido salga, toca el enlace de *"Avisar que va en camino"* y pulsa **Enviar**.
4. **Hoja de pedidos:** en la columna **Estado** elige *Confirmado*, *En camino*, *Entregado* o *Cancelado*. Cada estado tiene su color.

### Regla de oro: el total que vale

El mensaje de WhatsApp que envía el cliente se arma en **su** celular, así que alguien con malas intenciones podría cambiarle los precios antes de enviarlo.

**El total que vale es el del correo, el del aviso "Total verificado" y el de la hoja**, porque esos los calcula el sistema con los precios reales de la web. Si el WhatsApp del cliente muestra otro total, se cobra el del correo.

### Cómo se crea el número de pedido

Tiene la forma **MED-AAMMDD-XXXX**; por ejemplo, `MED-260930-7H9L`:

- `MED`: Medicol.
- `260930`: la fecha del pedido (año 26, mes 09, día 30).
- `7H9L`: cuatro letras o números al azar (hay más de 1,6 millones de combinaciones por día).

El mismo número aparece en el WhatsApp del cliente, el correo, el aviso y la hoja.

---

## PASO 17. Proteger tus cuentas (verificación en dos pasos)

**Este es el paso de seguridad más importante.** La web no guarda contraseñas ni tarjetas, así que el mayor riesgo real es que alguien entre a **tus cuentas** y cambie la web o lea los pedidos. La verificación en dos pasos pide, además de la contraseña, un código de 6 dígitos que **se genera** en tu celular cada 30 segundos.

### 17.1 Instalar una app de códigos

1. En tu celular instala **Google Authenticator** o **Microsoft Authenticator** (gratis, en Play Store o App Store).
2. No hace falta configurar nada todavía: la usarás en los pasos siguientes.

### 17.2 Activarla en cada cuenta

Haz esto en **las cuatro** cuentas. El proceso es parecido en todas:

| Cuenta | Dónde se activa |
|---|---|
| **GitHub** | Tu foto (arriba a la derecha) → **Settings** → **Password and authentication** → **Enable two-factor authentication** |
| **Cloudflare** | Tu perfil (arriba a la derecha) → **My Profile** → **Authentication** → **Two-Factor Authentication** |
| **Google** (la cuenta de la hoja) | https://myaccount.google.com/security → **Verificación en dos pasos** |
| **Resend** | **Settings** → **Account** o **Security** → **Two-factor authentication** |

En cada una:

1. Elige **Authenticator app** (app de autenticación).
2. Aparece un **código QR**. Abre tu app de códigos → **+** → **Escanear código QR** y apunta al QR.
3. La app muestra un código de 6 dígitos (**se genera** solo). Escríbelo en la página para confirmar.
4. La página te muestra **códigos de recuperación** (**se generan**; suelen ser 8 a 16 códigos de letras y números). **Guárdalos** en tu `claves-medicol.txt` o imprímelos. Sirven para entrar si pierdes el celular.

✅ **Cómo saber que salió bien:** al cerrar sesión y volver a entrar, después de la contraseña te pide el código de 6 dígitos.

⚠️ **Si algo sale mal:**
- **"Código inválido":** la hora de tu celular debe estar en automático (Ajustes → Fecha y hora → Automática).
- **Si pierdes el celular:** entra con uno de los **códigos de recuperación**. Sin ellos, recuperar la cuenta es muy difícil.

---

## PASO 18. Límite de pedidos por minuto (Cloudflare)

Una segunda barrera contra pedidos falsos, además de Turnstile: si alguien envía muchos pedidos seguidos desde el mismo lugar, Cloudflare lo bloquea unos segundos. El plan gratuito incluye una regla de este tipo.

> Necesita que tu dominio esté en Cloudflare (paso 8).

1. Cloudflare → en la lista de dominios, pulsa **colchonesmedicol.com**.
2. Menú izquierdo: **Security** → **WAF** → pestaña **Rate limiting rules** → **Create rule**.
3. Llena así:

| Campo | Valor |
|---|---|
| Rule name | `Limite pedidos` |
| Field | `URI Path` |
| Operator | `equals` |
| Value | `/api/pedido` |
| With the same characteristics | **IP** (viene por defecto) |
| When rate exceeds | `3` requests per `10 seconds` (en el plan gratuito, 10 segundos es la única opción) |
| Then take action | **Block** |
| For duration | `10 seconds` |

4. **Deploy**.

✅ **Cómo saber que salió bien:** la regla aparece en la lista con estado **Enabled**. Un cliente normal nunca la activa: nadie confirma 3 pedidos en 10 segundos.

⚠️ **Si algo sale mal:** si no ves **Rate limiting rules**, busca **Security rules** → **Create rule** → **Rate limiting rule**. El nombre del menú cambia a veces.

---

## PASO 19. Cuando crezcan los pedidos

Todo lo gratis alcanza de sobra para empezar. Revisa esta tabla cada mes:

| Si pasa esto… | Límite gratis | Qué hacer |
|---|---|---|
| Más de **30 a 40 pedidos al día** | Resend: 100 correos al día. Cada pedido gasta 1 correo al dueño, más 1 al cliente si dejó su correo, más 1 por cada correo extra en `EMAIL_TO` | **Opción A:** en Cloudflare cambia `CONFIRMAR_CLIENTE` a `no` (deja de enviar el correo al cliente). **Opción B:** Resend → **Settings** → **Billing** → plan **Pro** (≈ USD 20 al mes, 50.000 correos) |
| Los avisos de WhatsApp llegan tarde o no llegan | CallMeBot es gratuito y sin garantía | Pasar a la **API oficial de WhatsApp Business** (cobra centavos por mensaje). Requiere un desarrollador |
| Más de **100 pedidos al día** o necesitas control de stock y cobro con tarjeta en la web | — | Pasar a una plataforma de tienda (Shopify o WooCommerce) o agregar base de datos y pasarela de pago (por ejemplo, Payphone) |

Cómo ver cuántos correos se envían: Resend → **Emails** (lista con fecha de cada correo) o **Usage**.

---

## Anexo A. Hacer cambios después

Después de **cualquier** cambio, súbelo así (terminal **Git Bash**):

```bash
git add -A
git commit -m "Describe el cambio aquí"
git push origin main
```

En más o menos un minuto la web se actualiza.

| Quiero… | Qué hacer |
|---|---|
| Cambiar un precio, texto o foto de un producto | Editar `js/productos.js` y subir |
| Cambiar el menú, la barra superior o el pie | Editar `plantillas/partes/`, ejecutar `bash plantillas/armar-paginas.sh` y subir |
| Cambiar el contenido de una página | Editar `plantillas/paginas/<página>.html`, ejecutar `bash plantillas/armar-paginas.sh` y subir |
| Cambiar el número de WhatsApp de los pedidos | `js/productos.js` → `"whatsapp"`; y el número visible en `plantillas/partes/encabezado.html` y `pie.html` → armar las páginas → subir |
| Cambiar quién recibe correos o avisos | Cloudflare → Variables (paso 13) → **Retry deployment** |
| Reemplazar el catálogo en PDF | Guardarlo como `descargas/catalogo-colchones-medicol.pdf` (**menos de 25 MB**) y subir |

> ⚠️ **No edites** los `.html` de la raíz (`index.html`, `tienda.html`…) directamente: se sobrescriben al armar las páginas. Edita siempre los de `plantillas/`.
>
> ⚠️ Si agregas un servicio externo con código (por ejemplo, Google Analytics o el píxel de Meta), la política de seguridad lo bloqueará. Hay que permitir su dominio en el archivo `_headers` (línea `Content-Security-Policy`) y poner su código en un archivo `.js`, no dentro del HTML.

---

## Anexo B. Solución de problemas

| Síntoma | Qué revisar |
|---|---|
| La web no se actualiza después de `git push` | Cloudflare → proyecto → **Deployments**: el último debe decir **Success**. Si dice **Failed**, abre el despliegue y lee el error. |
| No llega el correo | En Resend, el dominio debe decir **Verified**. Revisa `RESEND_API_KEY` y que `EMAIL_FROM` termine en `@avisos.colchonesmedicol.com`. Revisa **Correo no deseado**. En Resend → **Emails** puedes ver si salió y por qué falló. |
| No llega el aviso de WhatsApp | `WHATSAPP_AVISOS` con el formato `593998804606:1234567`, sin `+` ni espacios. Haz la prueba del paso 10.7. |
| No aparece la fila en la hoja | `PLANILLA_URL` debe terminar en `/exec`. La clave debe ser **idéntica** en el script y en `PLANILLA_CLAVE`. *Quién tiene acceso* debe decir **Cualquier usuario**. |
| No llega nada (ni correo, ni aviso, ni fila) | Si pusiste `TURNSTILE_SECRET`, la Site Key debe estar en `js/productos.js` (paso 12.2) y tu dominio en los *Hostnames* del widget. |
| Cambiaste una variable y no hizo efecto | **Deployments** → **⋯** → **Retry deployment**. |
| Quieres ver los errores de la función de pedidos | Cloudflare → proyecto → **Deployments** → el despliegue → **Functions** → **Real-time logs** → **Begin log stream**, y haz un pedido de prueba. |
| La página se ve sin estilos | Borra la caché del navegador (Ctrl + F5). Si solo pasa en tu computadora, abre `index.html` desde la carpeta del proyecto, no desde otra ubicación. |
| `git push` dice `rejected` | `git pull --rebase origin main` y luego `git push origin main`. |
| Se llenan los correos gratis (100 al día) | Revisa en Resend → **Emails** si hay pedidos falsos. Activa Turnstile (paso 12) y el límite de pedidos (paso 18). Si los pedidos son reales, mira el paso 19. |
