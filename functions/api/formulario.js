/*
  POST /api/formulario — inscripciones, registros (ventana "Inscríbete") y mensajes de contacto.

  Qué hace con cada envío:
    1. Revisa los datos (y descarta robots con un campo trampa y un límite de envíos por IP).
    2. Si es un registro o una inscripción, guarda a la persona como suscriptora (KV) para que
       pueda entrar a la zona de boletines con su correo.
    3. Envía un correo a Sinergia con los datos y un botón para escribirle al cliente por WhatsApp.
    4. Anota una fila en la hoja de cálculo de Google (base de datos de inscritos).
    5. Avisa al dueño por WhatsApp (CallMeBot) con el enlace para responderle al cliente.
    6. Si está configurado WhatsApp Cloud API, le escribe automáticamente al cliente.
  Si no hay ningún canal configurado, responde ok:false y la página abre WhatsApp como respaldo.
*/
import {
  json, leerJson, texto, correoValido, telefonoInternacional, esc, fechaEcuador, lista, permitir,
  enviarCorreo, anotarPlanilla, avisarDueno, escribirCliente, marcoCorreo, botonCorreo, WHATSAPP_SINERGIA,
  textoConsentimiento, VERSION_POLITICA, mismoOrigen, verificarHumano, MENSAJE_ROBOT
} from "../../lib/servidor.js";
import { guardarSuscriptor } from "../../lib/suscriptores.js";

const TIPOS = { registro: "Registro / suscripción", inscripcion: "Inscripción a webinar", contacto: "Mensaje de contacto" };

export async function onRequestPost({ request, env }) {
  if (!mismoOrigen(request)) return json({ ok: false, error: "Origen no permitido" }, 403);
  const d = await leerJson(request);
  if (!d) return json({ ok: false, error: "Datos inválidos" }, 400);

  // Campo trampa: las personas no lo ven; si viene lleno es un robot. Se responde "ok" sin hacer nada.
  if (texto(d.sitio_web, 200)) return json({ ok: true });

  const tipo = TIPOS[d.tipo] ? d.tipo : "contacto";
  const p = {
    tipo,
    nombre: texto(d.nombre, 60),
    apellido: texto(d.apellido, 60),
    email: texto(d.email, 120).toLowerCase(),
    whatsapp: telefonoInternacional(d.whatsapp),
    empresa: texto(d.empresa, 100),
    interes: texto(d.interes, 120),
    mensaje: texto(d.mensaje, 1500),
    novedades: d.novedades === true,
    pagina: texto(d.pagina, 80),
    fecha: fechaEcuador()
  };

  if (!p.nombre || !p.apellido) return json({ ok: false, error: "Escribe tu nombre y apellido." }, 400);
  if (!correoValido(p.email)) return json({ ok: false, error: "Revisa tu correo electrónico." }, 400);
  if (!p.whatsapp) return json({ ok: false, error: "Revisa tu número de WhatsApp." }, 400);
  if (d.acepto !== true) return json({ ok: false, error: "Debes aceptar la política de privacidad." }, 400);
  if (tipo === "contacto" && !p.mensaje) return json({ ok: false, error: "Escribe tu mensaje." }, 400);

  if (!(await verificarHumano(env, request, d.turnstile))) return json({ ok: false, error: MENSAJE_ROBOT }, 400);

  const ip = request.headers.get("CF-Connecting-IP") || "0";
  if (!(await permitir(env, "form:" + ip, 6, 600))) {
    return json({ ok: false, error: "Recibimos varios envíos seguidos. Intenta en unos minutos." }, 429);
  }

  // Suscriptor (acceso a boletines)
  let suscrito = false;
  if (env.SUSCRIPTORES && (tipo !== "contacto" || p.novedades)) {
    const previo = JSON.parse((await env.SUSCRIPTORES.get("sub:" + p.email)) || "null");
    await guardarSuscriptor(env.SUSCRIPTORES, p.email, {
      nombre: p.nombre, apellido: p.apellido, whatsapp: p.whatsapp,
      novedades: p.novedades || (previo && previo.novedades) || false,
      alta: (previo && previo.alta) || p.fecha, actualizado: p.fecha,
      consentimiento: { fecha: p.fecha, version: VERSION_POLITICA }
    });
    suscrito = true;
  }

  const nombreCompleto = `${p.nombre} ${p.apellido}`;
  const primer = p.nombre.split(" ")[0];
  const saludoCliente = tipo === "contacto"
    ? `¡Hola, ${primer}! Te saluda Sinergia Capacitación Empresarial. Recibimos tu mensaje desde nuestra web y te ayudamos con gusto.`
    : `¡Hola, ${primer}! Te saluda Sinergia Capacitación Empresarial. Recibimos tu inscripción${p.interes ? ` (${p.interes})` : ""}. Te compartimos los detalles:`;
  const waCliente = `https://wa.me/${p.whatsapp}?text=${encodeURIComponent(saludoCliente)}`;

  const filas = [
    ["Tipo", TIPOS[tipo]],
    ["Nombre", nombreCompleto],
    ["Correo", p.email],
    ["WhatsApp", "+" + p.whatsapp],
    p.empresa && ["Empresa", p.empresa],
    p.interes && ["Le interesa", p.interes],
    ["Novedades", p.novedades ? "Sí acepta recibir novedades" : "No"],
    ["Consentimiento", textoConsentimiento(p.fecha)],
    p.mensaje && ["Mensaje", p.mensaje],
    ["Fecha", p.fecha]
  ].filter(Boolean);

  const html = marcoCorreo(`${TIPOS[tipo]}: ${nombreCompleto}`,
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;margin-bottom:20px">` +
    filas.map(([k, v]) => `<tr><td style="padding:8px 0;color:#7a7173;width:120px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;white-space:pre-wrap">${esc(v)}</td></tr>`).join("") +
    `</table>` + botonCorreo(waCliente, "Escribirle por WhatsApp", "#1f9d55") + botonCorreo(`mailto:${p.email}`, "Responder por correo", "#141112"));
  const textoPlano = filas.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nEscribirle por WhatsApp: ${waCliente}`;

  const aviso = `Sinergia web · ${TIPOS[tipo]}\n${nombreCompleto} · +${p.whatsapp}\n${p.interes || ""}${p.mensaje ? "\n" + p.mensaje.slice(0, 300) : ""}\n\nResponder: ${waCliente}`;

  const [correo, planilla, dueno, cliente] = await Promise.all([
    enviarCorreo(env, { to: lista(env.EMAIL_TO), subject: `${TIPOS[tipo]} · ${nombreCompleto}`, html, text: textoPlano, reply_to: p.email }),
    anotarPlanilla(env, {
      fecha: p.fecha, tipo: TIPOS[tipo], nombre: p.nombre, apellido: p.apellido, correo: p.email,
      whatsapp: "+" + p.whatsapp, enlace: waCliente, empresa: p.empresa, interes: p.interes,
      novedades: p.novedades ? "Sí" : "No", mensaje: p.mensaje, pagina: p.pagina,
      consentimiento: textoConsentimiento(p.fecha)
    }),
    avisarDueno(env, aviso),
    escribirCliente(env, p.whatsapp, primer)
  ]);

  const recibido = correo || planilla || dueno;
  const resumen = `¡Hola, Sinergia! Soy ${nombreCompleto}. Acabo de ${tipo === "contacto" ? "escribirles" : "inscribirme"} desde su web${p.interes ? ` (${p.interes})` : ""}.`;
  return json({
    ok: recibido,
    suscrito,
    mensajeAutomatico: cliente,
    whatsapp: `https://wa.me/${WHATSAPP_SINERGIA}?text=${encodeURIComponent(resumen)}`,
    error: recibido ? undefined : "Sin canales configurados"
  }, recibido ? 200 : 503);
}
