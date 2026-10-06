/*
  POST /api/pedido — avisos de pedido (Cloudflare Pages Functions).

  Cuando un cliente confirma su compra en checkout.html, la página envía aquí el pedido.
  Esta función:
    1. Vuelve a calcular precios y totales con el catálogo real (js/productos.js),
       para no confiar en lo que manda el navegador.
    2. Envía un correo al negocio con qué despachar y dónde (Resend).
    3. Envía un WhatsApp de aviso al dueño con enlaces para escribirle al cliente (CallMeBot).
    4. Si el cliente dejó su correo, le envía una confirmación.

  Variables de entorno (Cloudflare → Pages → proyecto → Settings → Variables and Secrets):
    RESEND_API_KEY          Clave de Resend (secreta).
    EMAIL_FROM              Remitente, p. ej. "Colchones Medicol <pedidos@colchonesmedicol.com>".
    EMAIL_TO                Correos que reciben los pedidos, separados por coma.
    WHATSAPP_AVISOS         Números que reciben el aviso por WhatsApp con su clave de CallMeBot,
                            con el formato "593998804606:1234567" y separados por coma (secreta).
    CONFIRMAR_CLIENTE       Pon "no" para no enviar la confirmación por correo al cliente.
    PLANILLA_URL            Dirección de la aplicación web de Google Apps Script que anota
                            cada pedido en la hoja de cálculo (ver docs/planilla-pedidos.gs).
    PLANILLA_CLAVE          La misma clave escrita en ese script (secreta).
    TURNSTILE_SECRET        Clave secreta de Cloudflare Turnstile (anti-bots). Si falta, no se verifica.
*/

const PAGOS = {
  transferencia: "Transferencia bancaria",
  efectivo: "Efectivo contra entrega",
  tarjeta: "Tarjeta (link de pago)"
};

const MAX_BODY = 20000;

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ ok: false, error: "Pedido demasiado grande" }, 413);

  let input;
  try {
    input = JSON.parse(raw);
  } catch (e) {
    return json({ ok: false, error: "Formato inválido" }, 400);
  }

  // Campo trampa: las personas no lo ven; si viene lleno, es un bot.
  if (text(input.web, 200)) return json({ ok: true });

  // Nadie llena el checkout en menos de 3 segundos: si pasa, es un envío automático.
  if (!(Number(input.t) >= 3000)) return json({ ok: true });

  // Solo se aceptan pedidos enviados desde la propia web
  const origen = request.headers.get("Origin");
  if (origen && new URL(origen).host !== new URL(request.url).host) {
    return json({ ok: false, error: "Origen no permitido" }, 403);
  }

  // Verificación anti-bots de Cloudflare (Turnstile), si está configurada
  if (env.TURNSTILE_SECRET) {
    const humano = await verificarTurnstile(env.TURNSTILE_SECRET, text(input.turnstile, 2048), request.headers.get("CF-Connecting-IP"));
    if (!humano) return json({ ok: false, error: "No se pudo verificar que eres una persona" }, 403);
  }

  let catalogo;
  try {
    catalogo = await cargarCatalogo(request, env);
  } catch (e) {
    return json({ ok: false, error: "No se pudo leer el catálogo" }, 500);
  }

  const pedido = armarPedido(input, catalogo);
  if (pedido.error) return json({ ok: false, error: pedido.error }, 400);

  const tareas = [];
  const resultado = { ok: true, id: pedido.id, correo: "no configurado", whatsapp: "no configurado" };

  if (env.RESEND_API_KEY && env.EMAIL_FROM && env.EMAIL_TO) {
    tareas.push(
      enviarCorreo(env, {
        to: lista(env.EMAIL_TO),
        subject: `Nuevo pedido ${pedido.id} · ${dinero(pedido.total)} · ${pedido.cliente.nombre}`,
        html: correoNegocioHtml(pedido),
        text: correoNegocioTexto(pedido),
        reply_to: pedido.cliente.email || undefined
      }).then((ok) => { resultado.correo = ok ? "enviado" : "error"; })
    );

    if (pedido.cliente.email && String(env.CONFIRMAR_CLIENTE || "").toLowerCase() !== "no") {
      tareas.push(
        enviarCorreo(env, {
          to: [pedido.cliente.email],
          subject: `¡Recibimos su pedido ${pedido.id}! · Colchones Medicol`,
          html: correoClienteHtml(pedido),
          text: correoClienteTexto(pedido),
          reply_to: lista(env.EMAIL_TO)[0]
        })
      );
    }
  }

  const avisos = lista(env.WHATSAPP_AVISOS);
  if (avisos.length) {
    const mensaje = avisoWhatsapp(pedido);
    tareas.push(
      Promise.all(avisos.map((a) => {
        const [telefono, clave] = a.split(":").map((s) => s.trim());
        return enviarWhatsapp(telefono, clave, mensaje);
      })).then((r) => { resultado.whatsapp = r.every(Boolean) ? "enviado" : "error"; })
    );
  }

  if (env.PLANILLA_URL && env.PLANILLA_CLAVE) {
    resultado.planilla = "error";
    tareas.push(
      anotarEnPlanilla(env, pedido).then((ok) => { resultado.planilla = ok ? "anotado" : "error"; })
    );
  }

  await Promise.allSettled(tareas);
  return json(resultado);
}

/* ---------- Registro en la hoja de cálculo (Google Sheets) ---------- */

async function anotarEnPlanilla(env, p) {
  const e = p.entrega;
  const fila = {
    clave: env.PLANILLA_CLAVE,
    fecha: p.fecha,
    pedido: p.id,
    cliente: p.cliente.nombre,
    telefono: p.cliente.telefono,
    whatsapp: `https://wa.me/${telefonoInternacional(p.cliente.telefono, "")}`,
    correo: p.cliente.email,
    cedula: p.cliente.cedula,
    productos: p.items.map(lineaProducto).join("\n"),
    total: Number(p.total.toFixed(2)),
    descuento: Number(p.descuento.toFixed(2)),
    pago: p.pago,
    entrega: e.tipo === "domicilio" ? "Envío a domicilio" : "Retiro en tienda",
    ciudad: e.ciudad || "",
    sector: e.sector || "",
    direccion: e.direccion || "",
    referencia: e.referencia || "",
    notas: p.notas
  };
  try {
    const res = await fetch(env.PLANILLA_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(fila),
      redirect: "follow"
    });
    if (!res.ok) return false;
    const r = await res.json().catch(() => ({}));
    return r.ok === true;
  } catch (err) {
    return false;
  }
}

/* ---------- Catálogo y cálculo del pedido ---------- */

async function cargarCatalogo(request, env) {
  const url = new URL("/js/productos.js", request.url);
  const res = env.ASSETS ? await env.ASSETS.fetch(url) : await fetch(url);
  const src = await res.text();
  const inicio = src.indexOf("{", src.indexOf("window.MEDICOL"));
  const fin = src.lastIndexOf("}");
  return JSON.parse(src.slice(inicio, fin + 1));
}

function armarPedido(input, catalogo) {
  const porId = new Map(catalogo.productos.map((p) => [p.id, p]));
  const itemsIn = Array.isArray(input.items) ? input.items.slice(0, 30) : [];

  const items = [];
  for (const it of itemsIn) {
    const p = porId.get(String(it && it.id));
    const cantidad = Math.floor(Number(it && it.cantidad));
    if (!p || p.precio == null || !(cantidad >= 1 && cantidad <= 99)) continue;
    const valores = p.opciones ? p.opciones.valores : [];
    const opcion = valores.includes(it.opcion) ? it.opcion : (valores[0] || "");
    items.push({
      nombre: p.nombre,
      opcion,
      opcionTitulo: p.opciones ? p.opciones.titulo : "",
      cantidad,
      precio: p.precio,
      subtotal: p.precio * cantidad,
      id: p.id,
      promo: p.promo
    });
  }
  if (!items.length) return { error: "El pedido no tiene productos válidos" };

  const unidades = {};
  items.forEach((i) => { unidades[i.id] = (unidades[i.id] || 0) + i.cantidad; });
  let descuento = 0;
  Object.keys(unidades).forEach((id) => {
    const p = porId.get(id);
    if (p.promo === "segundo-mitad") descuento += Math.floor(unidades[id] / 2) * p.precio * 0.5;
  });
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);

  const c = input.cliente || {};
  const cliente = {
    nombre: text(c.nombre, 120),
    telefono: text(c.telefono, 20),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(c.email, 120)) ? text(c.email, 120) : "",
    cedula: text(c.cedula, 13)
  };
  if (!cliente.nombre || !/^[0-9+ ]{7,20}$/.test(cliente.telefono)) {
    return { error: "Faltan el nombre o un teléfono válido" };
  }

  const e = input.entrega || {};
  const domicilio = e.tipo === "domicilio";
  const entrega = domicilio
    ? {
        tipo: "domicilio",
        ciudad: text(e.ciudad, 80),
        sector: text(e.sector, 120),
        direccion: text(e.direccion, 200),
        referencia: text(e.referencia, 200)
      }
    : { tipo: "retiro" };
  if (domicilio && (!entrega.ciudad || !entrega.direccion || !entrega.referencia)) {
    return { error: "Falta la dirección o la referencia" };
  }

  const id = /^MED-\d{6}-[A-Z0-9]{4}$/.test(input.id) ? input.id : nuevoId();

  return {
    id,
    fecha: fechaEcuador(),
    items,
    subtotal,
    descuento,
    total: subtotal - descuento,
    cliente,
    entrega,
    pago: PAGOS[input.pago] || PAGOS.transferencia,
    pagoClave: PAGOS[input.pago] ? input.pago : "transferencia",
    notas: text(input.notas, 500)
  };
}

/* ---------- Mensajes ---------- */

function saludo(nombre) {
  const h = horaEcuador();
  const s = h >= 5 && h < 12 ? "¡Buenos días" : (h >= 12 && h < 19 ? "¡Buenas tardes" : "¡Buenas noches");
  return `${s}, ${nombre}!`;
}

function primerNombre(p) {
  return p.cliente.nombre.split(/\s+/)[0];
}

// Mensaje que el negocio le envía al cliente para confirmar el pedido
function mensajeConfirmacion(p) {
  const pasos = p.entrega.tipo === "domicilio"
    ? "Ya lo estamos preparando y le avisaremos cuando esté en camino a su dirección."
    : "Le avisaremos cuando esté listo para retirarlo en nuestra tienda.";
  const pago = {
    transferencia: "En breve le enviamos los datos de la cuenta para realizar la transferencia.",
    efectivo: "El pago se realiza en efectivo al momento de la entrega.",
    tarjeta: "En breve le enviamos el link de pago seguro con tarjeta."
  }[p.pagoClave];
  return [
    saludo(primerNombre(p)),
    `Le saluda Colchones Medicol. Recibimos su pedido *${p.id}* por un total de *${dinero(p.total)}*.`,
    pasos,
    pago,
    "¡Muchas gracias por su compra!"
  ].join("\n\n");
}

// Mensaje para avisar al cliente que el pedido va en camino (o está listo)
function mensajeEnCamino(p) {
  const cuerpo = p.entrega.tipo === "domicilio"
    ? `Le saluda Colchones Medicol. ¡Su pedido *${p.id}* ya está en camino! En breve llegará a su dirección.`
    : `Le saluda Colchones Medicol. ¡Su pedido *${p.id}* ya está listo! Puede retirarlo en nuestra tienda cuando guste.`;
  return [saludo(primerNombre(p)), cuerpo, "¡Muchas gracias por su compra!"].join("\n\n");
}

function lineaProducto(i) {
  return `${i.cantidad} × ${i.nombre}${i.opcion ? ` (${i.opcion})` : ""} — ${dinero(i.subtotal)}`;
}

function lineasEntrega(p) {
  const e = p.entrega;
  if (e.tipo !== "domicilio") return ["Retiro en tienda"];
  return [
    "Envío a domicilio",
    `${e.ciudad}${e.sector ? ` · ${e.sector}` : ""}`,
    e.direccion,
    `Referencia: ${e.referencia}`
  ];
}

function avisoWhatsapp(p) {
  const partes = [
    "*¡Nuevo pedido en la web!*",
    `*Pedido:* ${p.id}\n*Total verificado:* ${dinero(p.total)} (envío por confirmar)\n_Si el WhatsApp del cliente muestra otro total, vale este._`,
    "*QUÉ DESPACHAR*\n" + p.items.map((i) => "• " + lineaProducto(i)).join("\n"),
    `*CLIENTE*\n${p.cliente.nombre}\n${p.cliente.telefono}`,
    "*DÓNDE*\n" + lineasEntrega(p).join("\n"),
    `*PAGO*\n${p.pago}`
  ];
  if (p.notas) partes.push(`*NOTAS*\n${p.notas}`);
  partes.push(`Confirmar el pedido al cliente:\n${enlaceCliente(p, mensajeConfirmacion(p))}`);
  partes.push(`Avisar que va en camino:\n${enlaceCliente(p, mensajeEnCamino(p))}`);
  return partes.join("\n\n");
}

/* ---------- Correos ---------- */

const C = { navy: "#1A2530", gold: "#C5A059", text: "#333B45", muted: "#6B727C", line: "#E3E6EA", grey: "#F4F5F7", green: "#15803D" };

function boton(href, label, color) {
  return `<a href="${esc(href)}" style="display:inline-block;margin:6px 6px 0 0;padding:13px 20px;background:${color};color:#fff;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.04em;text-transform:uppercase">${label}</a>`;
}

function bloque(titulo, contenido) {
  return `<tr><td style="padding:22px 28px 0">
    <div style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.gold};margin-bottom:10px">${titulo}</div>
    ${contenido}
  </td></tr>`;
}

function tablaProductos(p, notaEnvio = "El costo de envío se confirma con el cliente.") {
  const filas = p.items.map((i) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:15px;color:${C.navy}"><strong>${i.cantidad} ×</strong> ${esc(i.nombre)}${i.opcion ? `<br><span style="color:${C.muted};font-size:13px">${esc(i.opcionTitulo || "Opción")}: ${esc(i.opcion)}</span>` : ""}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:15px;color:${C.navy};text-align:right;white-space:nowrap">${dinero(i.subtotal)}</td>
    </tr>`).join("");
  const desc = p.descuento ? `<tr><td style="padding:6px 0;color:${C.green}">Promo 2do a mitad de precio</td><td style="padding:6px 0;color:${C.green};text-align:right">−${dinero(p.descuento)}</td></tr>` : "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-family:Arial,sans-serif">${filas}
    <tr><td style="padding:10px 0 4px;color:${C.muted}">Subtotal</td><td style="padding:10px 0 4px;text-align:right;color:${C.muted}">${dinero(p.subtotal)}</td></tr>
    ${desc}
    <tr><td style="padding:8px 0;font-size:18px;font-weight:700;color:${C.navy}">Total</td><td style="padding:8px 0;font-size:18px;font-weight:700;color:${C.navy};text-align:right">${dinero(p.total)}</td></tr>
    <tr><td colspan="2" style="font-size:13px;color:${C.muted}">${notaEnvio}</td></tr>
  </table>`;
}

function marco(contenido, preheader) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:${C.grey};font-family:Arial,Helvetica,sans-serif;color:${C.text}">
  <div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.grey};padding:24px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff">
      <tr><td style="background:${C.navy};padding:22px 28px;text-align:center">
        <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;letter-spacing:.08em;color:#fff">MEDICOL</div>
        <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${C.gold};margin-top:4px">Compromiso con tu salud y confort</div>
      </td></tr>
      ${contenido}
      <tr><td style="padding:28px;font-size:12px;color:${C.muted};text-align:center">Colchones Medicol · Quito, Ecuador</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function correoNegocioHtml(p) {
  const e = p.entrega;
  const donde = e.tipo === "domicilio"
    ? `<div style="padding:16px 18px;background:${C.grey};border-left:4px solid ${C.gold};font-size:15px;line-height:1.6;color:${C.navy}">
        <strong>Envío a domicilio</strong><br>
        ${esc(e.ciudad)}${e.sector ? ` · ${esc(e.sector)}` : ""}<br>
        ${esc(e.direccion)}<br>
        <strong>Referencia:</strong> ${esc(e.referencia)}
      </div>`
    : `<div style="padding:16px 18px;background:${C.grey};border-left:4px solid ${C.gold};font-size:15px;color:${C.navy}"><strong>Retiro en tienda</strong></div>`;

  const cliente = `<div style="font-size:15px;line-height:1.7;color:${C.navy}">
      <strong>${esc(p.cliente.nombre)}</strong><br>
      Teléfono: <a href="tel:${esc(telefonoInternacional(p.cliente.telefono, "+"))}" style="color:${C.navy}">${esc(p.cliente.telefono)}</a><br>
      ${p.cliente.email ? `Correo: <a href="mailto:${esc(p.cliente.email)}" style="color:${C.navy}">${esc(p.cliente.email)}</a><br>` : ""}
      ${p.cliente.cedula ? `Cédula/RUC: ${esc(p.cliente.cedula)}<br>` : ""}
    </div>`;

  const acciones = boton(enlaceCliente(p, mensajeConfirmacion(p)), "Confirmar por WhatsApp", C.green) +
    boton(enlaceCliente(p, mensajeEnCamino(p)), e.tipo === "domicilio" ? "Avisar: va en camino" : "Avisar: listo para retirar", C.navy) +
    boton(`tel:${telefonoInternacional(p.cliente.telefono, "+")}`, "Llamar al cliente", C.muted);

  return marco(`
    <tr><td style="padding:28px 28px 0">
      <div style="font-size:24px;font-weight:700;color:${C.navy}">¡Nuevo pedido desde la web!</div>
      <div style="font-size:14px;color:${C.muted};margin-top:6px">Pedido <strong style="color:${C.navy}">${p.id}</strong> · ${esc(p.fecha)}</div>
      <div style="margin-top:14px;padding:10px 14px;background:#FFF8E6;border-left:4px solid ${C.gold};font-size:13px;line-height:1.5;color:${C.navy}">El total de este correo lo calcula el sistema con los precios de la web. <strong>Si el WhatsApp del cliente muestra otro total, vale el de este correo.</strong></div>
    </td></tr>
    ${bloque("Qué despachar", tablaProductos(p))}
    ${bloque("Dónde entregar", donde)}
    ${bloque("Cliente", cliente)}
    ${bloque("Forma de pago", `<div style="font-size:15px;color:${C.navy}">${esc(p.pago)}</div>`)}
    ${p.notas ? bloque("Notas del cliente", `<div style="font-size:15px;color:${C.navy}">${esc(p.notas)}</div>`) : ""}
    ${bloque("Acciones rápidas", acciones)}
  `, `${p.id} · ${dinero(p.total)} · ${p.cliente.nombre}`);
}

function correoNegocioTexto(p) {
  return [
    "¡Nuevo pedido desde la web!",
    "Total verificado por el sistema: si el WhatsApp del cliente muestra otro total, vale el de este correo.",
    `Pedido: ${p.id} · ${p.fecha}`,
    "QUÉ DESPACHAR\n" + p.items.map((i) => "- " + lineaProducto(i)).join("\n") +
      (p.descuento ? `\nPromo 2do a mitad de precio: -${dinero(p.descuento)}` : "") +
      `\nTotal: ${dinero(p.total)} (envío por confirmar)`,
    "DÓNDE ENTREGAR\n" + lineasEntrega(p).join("\n"),
    `CLIENTE\n${p.cliente.nombre}\n${p.cliente.telefono}${p.cliente.email ? "\n" + p.cliente.email : ""}${p.cliente.cedula ? "\nCédula/RUC: " + p.cliente.cedula : ""}`,
    `FORMA DE PAGO\n${p.pago}`,
    p.notas ? `NOTAS\n${p.notas}` : "",
    `Confirmar por WhatsApp: ${enlaceCliente(p, mensajeConfirmacion(p))}`
  ].filter(Boolean).join("\n\n");
}

function correoClienteHtml(p) {
  const pasos = p.entrega.tipo === "domicilio"
    ? "Ya lo estamos preparando. Le escribiremos por WhatsApp para confirmar el pago y avisarle cuando esté en camino."
    : "Le escribiremos por WhatsApp para confirmar el pago y avisarle cuando esté listo para retirar en nuestra tienda.";
  return marco(`
    <tr><td style="padding:28px 28px 0">
      <div style="font-size:24px;font-weight:700;color:${C.navy}">${esc(saludo(primerNombre(p)))}</div>
      <p style="font-size:15px;line-height:1.7;margin:12px 0 0">Gracias por comprar en Colchones Medicol. Recibimos su pedido <strong>${p.id}</strong>.</p>
      <p style="font-size:15px;line-height:1.7;margin:12px 0 0">${pasos}</p>
    </td></tr>
    ${bloque("Su pedido", tablaProductos(p, "El costo de envío se lo confirmamos por WhatsApp."))}
    ${bloque("Entrega", `<div style="font-size:15px;line-height:1.6;color:${C.navy}">${lineasEntrega(p).map(esc).join("<br>")}</div>`)}
    ${bloque("Forma de pago", `<div style="font-size:15px;color:${C.navy}">${esc(p.pago)}</div>`)}
    <tr><td style="padding:22px 28px 0;font-size:15px;line-height:1.7">¿Tiene alguna pregunta? Responda a este correo o escríbanos por WhatsApp.<br><strong>¡Muchas gracias por su confianza!</strong></td></tr>
  `, `Recibimos su pedido ${p.id}`);
}

function correoClienteTexto(p) {
  return [
    saludo(primerNombre(p)),
    `Gracias por comprar en Colchones Medicol. Recibimos su pedido ${p.id}.`,
    "SU PEDIDO\n" + p.items.map((i) => "- " + lineaProducto(i)).join("\n") + `\nTotal: ${dinero(p.total)} (envío por confirmar)`,
    "ENTREGA\n" + lineasEntrega(p).join("\n"),
    `FORMA DE PAGO\n${p.pago}`,
    "Le escribiremos por WhatsApp para confirmar el pago y la entrega.",
    "¡Muchas gracias por su confianza!"
  ].join("\n\n");
}

/* ---------- Envíos ---------- */

async function enviarCorreo(env, { to, subject, html, text, reply_to }) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html, text, reply_to })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function enviarWhatsapp(telefono, clave, mensaje) {
  if (!telefono || !clave) return false;
  const url = "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(telefonoInternacional(telefono, "+")) +
    "&text=" + encodeURIComponent(mensaje) + "&apikey=" + encodeURIComponent(clave);
  try {
    const res = await fetch(url);
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function verificarTurnstile(secreto, token, ip) {
  if (!token) return false;
  const datos = new FormData();
  datos.append("secret", secreto);
  datos.append("response", token);
  if (ip) datos.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: datos });
    const r = await res.json();
    return r.success === true;
  } catch (e) {
    return false;
  }
}

/* ---------- Utilidades ---------- */

function enlaceCliente(p, mensaje) {
  return `https://wa.me/${telefonoInternacional(p.cliente.telefono, "")}?text=${encodeURIComponent(mensaje)}`;
}

// 0991234567 → 593991234567 (Ecuador)
function telefonoInternacional(tel, prefijo) {
  let d = String(tel).replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 10) d = "593" + d.slice(1);
  return prefijo + d;
}

function horaEcuador() {
  return (new Date().getUTCHours() + 19) % 24; // Ecuador: UTC−5, sin horario de verano
}

function fechaEcuador() {
  const d = new Date(Date.now() - 5 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function nuevoId() {
  const d = new Date(Date.now() - 5 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `MED-${String(d.getUTCFullYear()).slice(2)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-` +
    Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0");
}

function dinero(n) {
  return "$" + Number(n).toFixed(2);
}

function text(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

function lista(v) {
  return String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
