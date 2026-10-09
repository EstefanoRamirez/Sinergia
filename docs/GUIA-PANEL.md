# Guía del panel de Sinergia

Panel en **www.sinergia.ec/admin** con tres pestañas: **Boletines** (lo que ven los suscriptores en www.sinergia.ec/boletines), **Calendario** (las clases de la página Webinars y la franja «Próximo programa» de la portada) y **Suscriptores**.

## Cómo llegar al panel
Desde cualquier computadora o celular: abre **www.sinergia.ec**, baja hasta el final de la página y toca el candado **«Equipo»** (abajo, junto al nombre del diseñador). También puedes escribir directamente **www.sinergia.ec/admin**.

## Entrar con la contraseña del equipo
En el panel pueden entrar **capacitacion@**, **cramirez@**, **info@** y **sistemas@sinergia.ec**. Todos usan la **misma contraseña del equipo** (te la da Estéfano):
1. Toca el candado **«Equipo»** al pie de la web.
2. Escribe tu correo de Sinergia y la contraseña del equipo → **Ingresar**.

Para cambiar la contraseña del equipo, Estéfano la cambia en Cloudflare (variable `CLAVE_EQUIPO`) y luego alguien toca **«Salir en todas las computadoras»**.

## (Opcional) Contraseña propia
Si alguien prefiere su propia contraseña (además de la del equipo):
1. Toca el candado **«Equipo»** al pie de la web.
2. Toca **«Activar mi acceso u olvidé mi contraseña»** y escribe tu correo de trabajo.
3. Revisa tu correo (y la carpeta de no deseado): llega un mensaje de Sinergia con el botón **«Crear mi contraseña»**. El enlace vale una hora.
4. Crea tu contraseña. Ya estás dentro del panel.

Las siguientes veces solo escribes tu correo y tu contraseña. Si la olvidas, repite los pasos 2 a 4.

## Publicar un boletín
1. Elige el formato:
   - **PDF**: un solo archivo (máximo 20 MB). Los suscriptores lo ven como un libro que pueden abrir o descargar.
   - **Imágenes JPG o PNG**: una o varias (hasta 40). Se ven como una galería; al tocar una foto se amplía. Las imágenes grandes se achican solas antes de subir.
2. Escribe el **título**, revisa la **fecha** y, si quieres, un **resumen** corto.
3. Elige los archivos (o arrástralos al recuadro) y toca **«Publicar boletín»**. Espera a que la barra termine.
4. Si la casilla **«Avisar por correo a los suscriptores…»** está marcada, al publicar se envía un correo a quienes aceptaron recibir novedades. Verás cuántos se enviaron.
   - Gmail gratuito permite unos **100 correos al día** (incluye los de «olvidé mi contraseña»). Si hay más suscriptores, el envío se pausa solo: al día siguiente toca **«Continuar aviso»** en ese boletín, en **Publicados**. Nadie recibe el correo dos veces.
   - Si publicaste sin avisar, puedes hacerlo después con **«Avisar por correo»**.
   - Cada correo trae un enlace para darse de baja; quien lo use deja de recibir avisos, pero sigue pudiendo leer los boletines en la web.

## Editar o eliminar
- En **Publicados**, toca **Editar**: puedes cambiar el título, la fecha y el resumen; en un PDF puedes subir otro que reemplaza al anterior; en una galería puedes **quitar** imágenes o **agregar** más. Toca **«Guardar cambios»**.
- **Eliminar** borra el boletín y sus archivos (pide confirmación y no se puede deshacer).
- **«Ver como suscriptor»** abre la página de boletines tal como la ven los demás.

## Calendario de clases
1. Pestaña **Calendario**. Cada fila es **una clase**: fecha, hora de inicio y fin, nombre del taller o programa y un detalle (por ejemplo, «Módulo 2 · Activos no corrientes»).
2. **«Agregar clase»** crea una fila nueva que copia el taller y las horas de la anterior, para escribir menos. **«Quitar»** borra una fila.
3. **Aviso corto en la portada** (opcional): una frase como «$280 con pronto pago hasta el 14 de octubre» y hasta qué fecha mostrarla; después se oculta sola.
4. Toca **«Guardar calendario»**. En un minuto se ve en la web:
   - En **Webinars**, el calendario del mes actual marca los días con clase.
   - En la **portada**, la franja muestra la próxima clase («Inicia el jueves 15 de octubre · 19:15»). Cuando ya no quedan clases próximas, la franja desaparece sola.
- Las clases pasadas se pueden dejar (salen en gris); el calendario solo muestra el mes actual.
- La tarjeta grande del programa en Webinars (precios, módulos, PDF) no cambia desde aquí: para un programa nuevo, pídeselo al desarrollador.

## Suscriptores
- Pestaña **Suscriptores**: lista de todas las personas registradas, con buscador por nombre, correo o número, y si aceptaron recibir novedades.
- **«Descargar Excel (CSV)»** baja la lista completa. Se abre con doble clic en Excel o se importa en Google Sheets; la columna WhatsApp trae el enlace para escribirle a cada persona.
- Son datos personales: no los compartas fuera de Sinergia y borra las copias descargadas cuando ya no las necesites.

## Seguridad: la sesión se cierra sola
Para que nadie pueda mover nada si te olvidas de salir en una computadora ajena:
- La sesión del panel se cierra **al cerrar el navegador**, después de **20 minutos sin usar el panel** y, en todo caso, a las **4 horas**. Si pasa, solo vuelve a escribir tu correo y contraseña.
- Si crees que dejaste el panel abierto en otra computadora, entra desde donde estés y toca **«Salir en todas las computadoras»** (arriba, junto a «Salir»). Eso cierra todas las sesiones al instante.
- Si alguien más pudo ver tu contraseña, cámbiala con «Activar mi acceso u olvidé mi contraseña»: también cierra todas las sesiones.

## Buenas prácticas
- No compartas tu contraseña; cada persona usa su propio correo.
- En una computadora ajena, no aceptes que el navegador «guarde la contraseña».
- Al terminar, toca **Salir**.
- Si un cambio no aparece enseguida para los suscriptores, espera un minuto y recarga la página.
