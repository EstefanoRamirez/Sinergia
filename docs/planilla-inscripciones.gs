/*
  Base de datos de inscripciones y mensajes de la web de Sinergia en Google Sheets.

  Cómo se usa (paso a paso en docs/DESPLIEGUE.md, paso 5):
    1. Crea una hoja de cálculo de Google llamada "Inscripciones Sinergia".
    2. Extensiones → Apps Script → borra lo que haya y pega TODO este archivo.
    3. Cambia la CLAVE de abajo por una tuya (letras y números, sin espacios).
    4. Ejecuta la función "configurar" una vez (prepara columnas, colores, la lista de estados
       y la pestaña "Clics WhatsApp").
    5. Implementar → Nueva implementación → Aplicación web
       (Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario).
    6. Copia la URL de la aplicación web y ponla en Cloudflare como PLANILLA_URL,
       y la CLAVE como PLANILLA_CLAVE.
*/

const CLAVE = "cambia-esta-clave-123";

const HOJA = "Inscripciones";

// [Título, dato que llega de la web, ancho]
const COLUMNAS = [
  ["Fecha", "fecha", 130],
  ["Tipo", "tipo", 170],
  ["Estado", null, 120],
  ["Nombre", "nombre", 140],
  ["Apellido", "apellido", 140],
  ["WhatsApp", "whatsapp", 130],
  ["Escribirle", null, 95],
  ["Correo", "correo", 200],
  ["Le interesa", "interes", 230],
  ["Empresa", "empresa", 170],
  ["Novedades", "novedades", 95],
  ["Mensaje", "mensaje", 320],
  ["Página", "pagina", 120],
  ["Consentimiento", "consentimiento", 260]
];

// Segunda pestaña: cada clic en un botón de WhatsApp de la web (para medir conversiones)
const HOJA_CLICS = "Clics WhatsApp";
const COLUMNAS_CLICS = [["Fecha", 130], ["Página", 160], ["Botón", 260]];

const ESTADOS = [
  ["Nuevo", "#FFF4CC"],
  ["Contactado", "#DCEBFF"],
  ["Inscrito", "#D7F5DD"],
  ["Pagado", "#C9F0E1"],
  ["No interesado", "#F5D5D5"]
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.clave !== CLAVE) return responder({ ok: false, error: "clave" });

    if (d.accion === "clic") {
      const clics = obtenerHoja(HOJA_CLICS);
      clics.appendRow([d.fecha, d.pagina, d.boton].map(limpiar));
      return responder({ ok: true });
    }

    const hoja = obtenerHoja();
    const fila = COLUMNAS.map(([titulo, campo]) => {
      if (titulo === "Estado") return "Nuevo";
      if (titulo === "Escribirle") return d.enlace ? '=HYPERLINK("' + String(d.enlace).replace(/"/g, "") + '","WhatsApp")' : "";
      return limpiar(campo ? d[campo] : "");
    });
    hoja.insertRowAfter(1);
    hoja.getRange(2, 1, 1, fila.length).setValues([fila]);
    pintarEstado(hoja.getRange(2, columna("Estado")));
    return responder({ ok: true });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function configurar() {
  const clics = obtenerHoja(HOJA_CLICS);
  clics.getRange(1, 1, 1, COLUMNAS_CLICS.length).setValues([COLUMNAS_CLICS.map((c) => c[0])])
    .setFontWeight("bold").setBackground("#141112").setFontColor("#FFFFFF");
  clics.setFrozenRows(1);
  COLUMNAS_CLICS.forEach(([, ancho], i) => clics.setColumnWidth(i + 1, ancho));

  const hoja = obtenerHoja();
  hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS.map((c) => c[0])])
    .setFontWeight("bold").setBackground("#BB0F17").setFontColor("#FFFFFF");
  hoja.setFrozenRows(1);
  COLUMNAS.forEach(([, , ancho], i) => hoja.setColumnWidth(i + 1, ancho));
  const regla = SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS.map((e) => e[0]), true).build();
  hoja.getRange(2, columna("Estado"), hoja.getMaxRows() - 1).setDataValidation(regla);
  Logger.log("Listo. Ahora publica: Implementar → Nueva implementación → Aplicación web.");
}

function onEdit(e) {
  if (e.range.getSheet().getName() === HOJA && e.range.getColumn() === columna("Estado") && e.range.getRow() > 1) {
    pintarEstado(e.range);
  }
}

function pintarEstado(celda) {
  const color = (ESTADOS.find((s) => s[0] === celda.getValue()) || [null, "#FFFFFF"])[1];
  celda.getSheet().getRange(celda.getRow(), 1, 1, COLUMNAS.length).setBackground(color);
}

function obtenerHoja(nombre) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const n = nombre || HOJA;
  return libro.getSheetByName(n) || libro.insertSheet(n);
}

// Texto seguro para una celda: evita que algo escrito en la web se interprete como fórmula
function limpiar(valor) {
  const v = String(valor == null ? "" : valor);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function columna(titulo) {
  return COLUMNAS.findIndex((c) => c[0] === titulo) + 1;
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
