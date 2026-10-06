/*
  Registro de pedidos de Colchones Medicol en Google Sheets.

  Cómo se usa (explicado paso a paso en docs/DESPLIEGUE.md, sección 6):
    1. Crea una hoja de cálculo de Google llamada "Pedidos Medicol".
    2. Extensiones → Apps Script → borra lo que haya y pega TODO este archivo.
    3. Cambia la CLAVE de abajo por una tuya (letras y números, sin espacios).
    4. Ejecuta la función "configurar" una vez (prepara columnas, colores y menú de estados).
    5. Implementar → Nueva implementación → Aplicación web
       (Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario).
    6. Copia la URL de la aplicación web y ponla en Cloudflare como PLANILLA_URL,
       y la CLAVE como PLANILLA_CLAVE.
*/

const CLAVE = "cambia-esta-clave-123";

const HOJA = "Pedidos";

const COLUMNAS = [
  ["Fecha", "fecha", 130],
  ["Pedido", "pedido", 140],
  ["Estado", null, 110],
  ["Cliente", "cliente", 170],
  ["Teléfono", "telefono", 115],
  ["WhatsApp", null, 95],
  ["Productos", "productos", 330],
  ["Total", "total", 80],
  ["Pago", "pago", 160],
  ["Entrega", "entrega", 140],
  ["Ciudad", "ciudad", 90],
  ["Sector", "sector", 130],
  ["Dirección", "direccion", 220],
  ["Referencia", "referencia", 240],
  ["Notas", "notas", 200],
  ["Correo", "correo", 180],
  ["Cédula/RUC", "cedula", 110],
  ["Descuento", "descuento", 90]
];

const ESTADOS = [
  ["Nuevo", "#FFF4CC"],
  ["Confirmado", "#DCEBFF"],
  ["En camino", "#E8DDFF"],
  ["Entregado", "#D7F5DD"],
  ["Cancelado", "#F5D5D5"]
];

// Recibe cada pedido desde la web
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.clave !== CLAVE) return responder({ ok: false, error: "clave" });
    if (!/^MED-[0-9A-Z-]{6,20}$/.test(String(d.pedido))) return responder({ ok: false, error: "pedido" });

    const hoja = obtenerHoja();

    // Evita anotar dos veces el mismo pedido
    const repetido = hoja.getRange("B:B").createTextFinder(String(d.pedido)).matchEntireCell(true).findNext();
    if (repetido) return responder({ ok: true, repetido: true });

    const NUMEROS = ["total", "descuento"];
    const fila = COLUMNAS.map(function (c) {
      if (c[0] === "Estado") return "Nuevo";
      if (c[0] === "WhatsApp") return "Escribir";
      if (NUMEROS.indexOf(c[1]) !== -1) return Number(d[c[1]]) || 0;
      return comoTexto(d[c[1]]);
    });

    // El pedido más nuevo queda arriba, debajo de los títulos
    hoja.insertRowAfter(1);
    // Todas las columnas de texto se marcan como "texto sin formato": lo que escriba
    // el cliente nunca se interpreta como fórmula.
    COLUMNAS.forEach(function (c, i) {
      if (NUMEROS.indexOf(c[1]) === -1) hoja.getRange(2, i + 1).setNumberFormat("@");
    });
    hoja.getRange(2, 1, 1, fila.length).setValues([fila]);
    hoja.getRange(2, 1, 1, fila.length).setVerticalAlignment("top").setWrap(true)
      .setFontWeight("normal").setFontColor("#1A2530").setBackground(null).setHorizontalAlignment("left");
    const colWa = COLUMNAS.findIndex(function (c) { return c[0] === "WhatsApp"; }) + 1;
    if (/^https:\/\/wa\.me\/[0-9]{8,15}$/.test(String(d.whatsapp || ""))) {
      hoja.getRange(2, colWa).setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText("Escribir").setLinkUrl(String(d.whatsapp)).build()
      );
    }
    hoja.getRange(2, COLUMNAS.findIndex(function (c) { return c[0] === "Total"; }) + 1).setNumberFormat("$#,##0.00");
    aplicarFormatoEstados(hoja);

    return responder({ ok: true });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Ejecutar UNA vez a mano: deja la hoja lista y bonita
function configurar() {
  const hoja = obtenerHoja();
  const titulos = hoja.getRange(1, 1, 1, COLUMNAS.length);
  titulos.setValues([COLUMNAS.map(function (c) { return c[0]; })])
    .setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#1A2530")
    .setVerticalAlignment("middle").setHorizontalAlignment("center");
  hoja.setRowHeight(1, 34);
  hoja.setFrozenRows(1);
  COLUMNAS.forEach(function (c, i) { hoja.setColumnWidth(i + 1, c[2]); });

  aplicarFormatoEstados(hoja);
  SpreadsheetApp.getActiveSpreadsheet().toast("La hoja de pedidos quedó lista.", "Medicol", 5);
}

// Prueba sin la web: ejecútala para ver cómo queda un pedido de ejemplo
function probar() {
  const ejemplo = {
    clave: CLAVE,
    fecha: Utilities.formatDate(new Date(), "America/Guayaquil", "dd/MM/yyyy HH:mm"),
    pedido: "MED-PRUEBA-" + Math.floor(Math.random() * 9000 + 1000),
    cliente: "Cliente de prueba",
    telefono: "0990000000",
    whatsapp: "https://wa.me/593990000000",
    productos: "2 × Colchón para mascota (M · 66 × 100 × 8 cm) — $78.00",
    total: 58.5,
    descuento: 19.5,
    pago: "Efectivo contra entrega",
    entrega: "Envío a domicilio",
    ciudad: "Quito",
    sector: "La Carolina",
    direccion: "Av. Amazonas N24 y Colón",
    referencia: "Frente al parque",
    notas: "Pedido de prueba: se puede borrar"
  };
  doPost({ postData: { contents: JSON.stringify(ejemplo) } });
}

// Convierte cualquier dato en texto seguro para la hoja.
// Si empieza con = + - @ (o un tabulador), Google Sheets lo tomaría como fórmula:
// se le antepone un apóstrofo para que quede como texto normal.
function comoTexto(v) {
  if (v === undefined || v === null) return "";
  var t = String(v).slice(0, 1000);
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
  return t;
}

function obtenerHoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  return libro.getSheetByName(HOJA) || libro.insertSheet(HOJA, 0);
}

function aplicarFormatoEstados(hoja) {
  const colEstado = COLUMNAS.findIndex(function (c) { return c[0] === "Estado"; }) + 1;
  const rango = hoja.getRange(2, colEstado, hoja.getMaxRows() - 1, 1);
  const regla = SpreadsheetApp.newDataValidation()
    .requireValueInList(ESTADOS.map(function (s) { return s[0]; }), true)
    .setAllowInvalid(false).build();
  rango.setDataValidation(regla);
  hoja.setConditionalFormatRules(ESTADOS.map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(s[0]).setBackground(s[1]).setRanges([rango]).build();
  }));
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
