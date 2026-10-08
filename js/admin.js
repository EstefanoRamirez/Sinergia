/* Panel de administración de boletines (/admin).
   Ingreso con la misma cuenta de la web; solo funciona para correos autorizados en ADMIN_EMAILS.
   Las imágenes se achican en el navegador antes de subirlas (máx. 2400 px) para que carguen rápido. */
(function () {
  "use strict";

  var zona = document.querySelector("[data-admin]");
  if (!zona) return;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var vistas = {};
  $$("[data-vista]", zona).forEach(function (v) { vistas[v.getAttribute("data-vista")] = v; });
  var ver = function (nombre) {
    Object.keys(vistas).forEach(function (k) { vistas[k].hidden = k !== nombre; });
    var campo = $("input:not([type=hidden]):not([type=radio])", vistas[nombre]);
    if (campo && nombre !== "panel") campo.focus();
  };
  var acceso = function (cuerpo) {
    return fetch("/api/acceso", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) })
      .then(function (r) { return r.json(); });
  };
  var hoy = function () { return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10); };
  var mb = function (n) { return (n / 1024 / 1024).toFixed(n > 1048576 ? 1 : 2) + " MB"; };
  var fechaBonita = function (iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return iso || "";
    return +m[3] + " de " + ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][+m[2] - 1] + " de " + m[1];
  };

  // ---------- Ingreso, activación y contraseña nueva ----------
  var token = "";
  $$("[data-ir]", zona).forEach(function (b) { b.addEventListener("click", function () { ver(b.getAttribute("data-ir")); }); });
  $$("[data-ver-clave]", zona).forEach(function (b) {
    b.addEventListener("click", function () {
      var i = b.parentElement.querySelector("input");
      var mostrar = i.type === "password";
      i.type = mostrar ? "text" : "password";
      b.setAttribute("aria-pressed", String(mostrar));
      b.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
    });
  });
  $$("[data-salir]", zona).forEach(function (b) {
    b.addEventListener("click", function () { acceso({ accion: "salir" }).finally(function () { ver("entrar"); }); });
  });

  var formAcceso = function (vista, armar, despues) {
    var f = $("form", vistas[vista]);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var est = $(".sg-estado", f), boton = $("button[type=submit]", f);
      var cuerpo = armar(f, est);
      if (!cuerpo) return;
      boton.disabled = true;
      est.textContent = "Un momento…";
      acceso(cuerpo).then(function (j) {
        boton.disabled = false;
        if (!j.ok) { est.textContent = j.error || "No se pudo completar. Intenta otra vez."; return; }
        est.textContent = "";
        f.reset();
        despues(j, est);
      }).catch(function () { boton.disabled = false; est.textContent = "No pudimos conectarnos. Intenta otra vez."; });
    });
  };
  formAcceso("entrar", function (f, est) {
    if (!f.elements.email.value.trim() || !f.elements.clave.value) { est.textContent = "Escribe tu correo y tu contraseña."; return null; }
    return { accion: "entrar", email: f.elements.email.value.trim().toLowerCase(), clave: f.elements.clave.value };
  }, function () { iniciar(); });
  formAcceso("recuperar", function (f, est) {
    if (!f.elements.email.checkValidity() || !f.elements.email.value) { est.textContent = "Escribe un correo válido."; return null; }
    return { accion: "recuperar", email: f.elements.email.value.trim().toLowerCase() };
  }, function (j, est) { est.textContent = "Listo. Si el correo está autorizado, te llegará un enlace en unos minutos. Revisa también el correo no deseado."; });
  formAcceso("nueva", function (f, est) {
    if (f.elements.clave.value.length < 8) { est.textContent = "La contraseña debe tener al menos 8 caracteres."; return null; }
    if (f.elements.clave.value !== f.elements.clave2.value) { est.textContent = "Las contraseñas no coinciden."; return null; }
    return { accion: "restablecer", token: token, clave: f.elements.clave.value };
  }, function () { token = ""; iniciar(); });

  // ---------- Panel ----------
  var form = $("[data-form-boletin]", zona);
  var entrada = $("#b-archivos", form);
  var previas = $("[data-previas]", form);
  var estado = $(".sg-estado", form);
  var progreso = $("[data-progreso]", form);
  var listaAdmin = $("[data-lista-admin]", zona);
  var boletines = [];
  var editando = null;   // boletín que se está editando
  var quitar = [];       // ids de imágenes que se quitarán al guardar
  var elegidos = [];     // archivos listos para subir: { archivo, ancho, alto, url }

  var tipoActual = function () {
    if (editando) return editando.tipo;
    var r = $("input[name=tipo]:checked", form);
    return r ? r.value : "pdf";
  };
  var ajustarEntrada = function () {
    var esPdf = tipoActual() === "pdf";
    entrada.accept = esPdf ? "application/pdf" : "image/jpeg,image/png,image/webp";
    entrada.multiple = !esPdf;
    $("[data-zona-texto]", form).textContent = esPdf
      ? (editando ? "Elige un PDF nuevo para reemplazar el actual (opcional)" : "Elige el PDF o arrástralo aquí")
      : (editando ? "Agrega más imágenes (opcional)" : "Elige las imágenes o arrástralas aquí");
    $("[data-zona-ayuda]", form).textContent = esPdf ? "Máximo 20 MB." : "JPG, PNG o WebP. Se optimizan solas antes de subir.";
  };
  $$("input[name=tipo]", form).forEach(function (r) { r.addEventListener("change", function () { limpiarElegidos(); ajustarEntrada(); }); });

  var limpiarElegidos = function () {
    elegidos.forEach(function (e) { if (e.url) URL.revokeObjectURL(e.url); });
    elegidos = [];
    previas.innerHTML = "";
    entrada.value = "";
  };

  // Achica una imagen grande (máx. 2400 px por lado) y la guarda como WebP o JPG
  var optimizar = function (archivo) {
    return new Promise(function (listo) {
      var img = new Image();
      var url = URL.createObjectURL(archivo);
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, max = 2400;
        var escala = Math.min(1, max / Math.max(w, h));
        if (escala === 1 && archivo.size <= 1.5 * 1024 * 1024) { listo({ archivo: archivo, ancho: w, alto: h, url: url }); return; }
        var c = document.createElement("canvas");
        c.width = Math.round(w * escala);
        c.height = Math.round(h * escala);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        var terminar = function (blob) {
          if (!blob || blob.size >= archivo.size) { listo({ archivo: archivo, ancho: w, alto: h, url: url }); return; }
          var ext = blob.type === "image/webp" ? ".webp" : ".jpg";
          var nuevo = new File([blob], archivo.name.replace(/\.[^.]+$/, "") + ext, { type: blob.type });
          URL.revokeObjectURL(url);
          listo({ archivo: nuevo, ancho: c.width, alto: c.height, url: URL.createObjectURL(nuevo) });
        };
        c.toBlob(function (b) {
          if (b && b.type === "image/webp") terminar(b);
          else c.toBlob(terminar, "image/jpeg", 0.86);
        }, "image/webp", 0.86);
      };
      img.onerror = function () { listo({ archivo: archivo, ancho: 0, alto: 0, url: url }); };
      img.src = url;
    });
  };

  var agregarArchivos = function (lista) {
    var archivos = Array.prototype.slice.call(lista || []);
    if (!archivos.length) return;
    var esPdf = tipoActual() === "pdf";
    if (esPdf) {
      var pdf = archivos.filter(function (a) { return a.type === "application/pdf" || /\.pdf$/i.test(a.name); })[0];
      if (!pdf) { estado.textContent = "Elige un archivo PDF."; return; }
      if (pdf.size > 20 * 1024 * 1024) { estado.textContent = "El PDF pesa más de 20 MB."; return; }
      limpiarElegidos();
      elegidos = [{ archivo: pdf }];
      pintarPrevias();
      return;
    }
    var imagenes = archivos.filter(function (a) { return /^image\/(jpeg|png|webp)$/.test(a.type); });
    if (imagenes.length < archivos.length) estado.textContent = "Algunos archivos no eran JPG, PNG o WebP y se omitieron.";
    estado.textContent = "Preparando imágenes…";
    Promise.all(imagenes.map(optimizar)).then(function (listos) {
      elegidos = elegidos.concat(listos);
      estado.textContent = "";
      pintarPrevias();
    });
  };
  entrada.addEventListener("change", function () { agregarArchivos(entrada.files); });
  var zonaSoltar = $(".sg-admin-zona", form);
  ["dragenter", "dragover"].forEach(function (ev) { zonaSoltar.addEventListener(ev, function (e) { e.preventDefault(); zonaSoltar.classList.add("is-encima"); }); });
  ["dragleave", "drop"].forEach(function (ev) { zonaSoltar.addEventListener(ev, function (e) { e.preventDefault(); zonaSoltar.classList.remove("is-encima"); }); });
  zonaSoltar.addEventListener("drop", function (e) { agregarArchivos(e.dataTransfer && e.dataTransfer.files); });

  var pintarPrevias = function () {
    previas.innerHTML = "";
    elegidos.forEach(function (e, i) {
      var li = document.createElement("li");
      if (e.url) {
        var im = document.createElement("img");
        im.src = e.url;
        im.alt = "";
        li.appendChild(im);
      } else {
        var icono = document.createElement("span");
        icono.className = "sg-admin-pdf";
        icono.textContent = "PDF";
        li.appendChild(icono);
      }
      var nombre = document.createElement("span");
      nombre.className = "sg-admin-nombre";
      nombre.textContent = e.archivo.name + " · " + mb(e.archivo.size);
      li.appendChild(nombre);
      var quitarBtn = document.createElement("button");
      quitarBtn.type = "button";
      quitarBtn.className = "sg-enlace";
      quitarBtn.textContent = "Quitar";
      quitarBtn.addEventListener("click", function () {
        if (e.url) URL.revokeObjectURL(e.url);
        elegidos.splice(i, 1);
        pintarPrevias();
      });
      li.appendChild(quitarBtn);
      previas.appendChild(li);
    });
  };

  var pintarActuales = function () {
    var caja = $("[data-archivos-actuales]", form);
    var ul = $("[data-lista-actuales]", form);
    ul.innerHTML = "";
    if (!editando) { caja.hidden = true; return; }
    caja.hidden = false;
    (editando.archivos || []).forEach(function (a) {
      var li = document.createElement("li");
      var quitado = quitar.indexOf(a.id) !== -1;
      if (quitado) li.className = "is-quitado";
      if (a.tipo !== "application/pdf") {
        var im = document.createElement("img");
        im.src = "/api/boletines?id=" + a.id;
        im.alt = "";
        im.loading = "lazy";
        li.appendChild(im);
      } else {
        var icono = document.createElement("span");
        icono.className = "sg-admin-pdf";
        icono.textContent = "PDF";
        li.appendChild(icono);
      }
      var nombre = document.createElement("span");
      nombre.className = "sg-admin-nombre";
      nombre.textContent = a.nombre + " · " + mb(a.tam || 0);
      li.appendChild(nombre);
      if (editando.tipo === "imagenes") {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "sg-enlace";
        b.textContent = quitado ? "Volver a poner" : "Quitar";
        b.addEventListener("click", function () {
          if (quitado) quitar = quitar.filter(function (x) { return x !== a.id; });
          else quitar.push(a.id);
          pintarActuales();
        });
        li.appendChild(b);
      }
      ul.appendChild(li);
    });
  };

  var reiniciarFormulario = function () {
    editando = null;
    quitar = [];
    form.reset();
    limpiarElegidos();
    form.elements.fecha.value = hoy();
    $("[data-form-titulo]", form).textContent = "Nuevo boletín";
    $("[data-boton-guardar]", form).firstChild.textContent = "Publicar boletín ";
    $("[data-cancelar]", form).hidden = true;
    $("[data-tipo-campo]", form).disabled = false;
    pintarActuales();
    ajustarEntrada();
  };
  $("[data-cancelar]", form).addEventListener("click", function () { reiniciarFormulario(); estado.textContent = ""; });

  var editar = function (b) {
    reiniciarFormulario();
    editando = b;
    form.elements.titulo.value = b.titulo || "";
    form.elements.fecha.value = b.fecha || hoy();
    form.elements.resumen.value = b.resumen || "";
    $$("input[name=tipo]", form).forEach(function (r) { r.checked = r.value === b.tipo; });
    $("[data-tipo-campo]", form).disabled = true;
    $("[data-form-titulo]", form).textContent = "Editar boletín";
    $("[data-boton-guardar]", form).firstChild.textContent = "Guardar cambios ";
    $("[data-cancelar]", form).hidden = false;
    pintarActuales();
    ajustarEntrada();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    form.elements.titulo.focus({ preventScroll: true });
  };

  var eliminar = function (b) {
    if (!window.confirm("¿Eliminar el boletín «" + b.titulo + "»? Esta acción no se puede deshacer.")) return;
    fetch("/api/admin/boletines?id=" + encodeURIComponent(b.id), { method: "DELETE", credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) { window.alert(j.error || "No se pudo eliminar."); return; }
        if (editando && editando.id === b.id) reiniciarFormulario();
        cargar();
      })
      .catch(function () { window.alert("No pudimos conectarnos. Intenta otra vez."); });
  };

  var pintarLista = function () {
    listaAdmin.innerHTML = "";
    if (!boletines.length) {
      listaAdmin.innerHTML = '<li class="sg-admin-vacio">Todavía no hay boletines publicados desde el panel.</li>';
      return;
    }
    boletines.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).forEach(function (b) {
      var li = document.createElement("li");
      var miniatura = document.createElement("span");
      miniatura.className = "sg-admin-mini";
      var primero = (b.archivos || [])[0];
      if (b.tipo === "imagenes" && primero) {
        var im = document.createElement("img");
        im.src = "/api/boletines?id=" + primero.id;
        im.alt = "";
        im.loading = "lazy";
        miniatura.appendChild(im);
      } else {
        miniatura.textContent = "PDF";
      }
      li.appendChild(miniatura);
      var info = document.createElement("span");
      info.className = "sg-admin-info";
      var t = document.createElement("strong");
      t.textContent = b.titulo;
      var d = document.createElement("small");
      d.textContent = fechaBonita(b.fecha) + " · " + (b.tipo === "imagenes" ? (b.archivos || []).length + " imágenes" : "PDF") + (b.editadoPor ? " · editado por " + b.editadoPor : "");
      info.appendChild(t);
      info.appendChild(d);
      li.appendChild(info);
      var acciones = document.createElement("span");
      acciones.className = "sg-admin-acciones";
      var be = document.createElement("button");
      be.type = "button";
      be.className = "sg-btn sg-btn--linea";
      be.textContent = "Editar";
      be.addEventListener("click", function () { editar(b); });
      var bd = document.createElement("button");
      bd.type = "button";
      bd.className = "sg-enlace sg-admin-borrar";
      bd.textContent = "Eliminar";
      bd.addEventListener("click", function () { eliminar(b); });
      acciones.appendChild(be);
      acciones.appendChild(bd);
      li.appendChild(acciones);
      listaAdmin.appendChild(li);
    });
  };

  var cargar = function () {
    return fetch("/api/admin/boletines", { credentials: "same-origin" })
      .then(function (r) { return r.json().then(function (j) { return { estado: r.status, j: j }; }); })
      .then(function (res) {
        if (res.estado === 401) { ver("entrar"); return; }
        if (res.estado === 403) { ver("sinpermiso"); return; }
        if (!res.j || !res.j.ok) { ver("entrar"); return; }
        boletines = res.j.boletines || [];
        $$("[data-admin-correo]", zona).forEach(function (el) { el.textContent = res.j.email || ""; });
        ver("panel");
        pintarLista();
      });
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var titulo = form.elements.titulo.value.trim();
    if (!titulo) { estado.textContent = "Escribe el título del boletín."; form.elements.titulo.focus(); return; }
    if (!form.elements.fecha.value) { estado.textContent = "Elige la fecha."; return; }
    if (!editando && !elegidos.length) { estado.textContent = tipoActual() === "pdf" ? "Elige el archivo PDF." : "Elige al menos una imagen."; return; }
    var datos = new FormData();
    if (editando) datos.append("id", editando.id);
    datos.append("titulo", titulo);
    datos.append("fecha", form.elements.fecha.value);
    datos.append("resumen", form.elements.resumen.value.trim());
    datos.append("tipo", tipoActual());
    datos.append("quitar", JSON.stringify(quitar));
    datos.append("medidas", JSON.stringify(elegidos.map(function (x) { return [x.ancho || 0, x.alto || 0]; })));
    elegidos.forEach(function (x) { datos.append("archivos", x.archivo, x.archivo.name); });

    var boton = $("[data-boton-guardar]", form);
    boton.disabled = true;
    estado.textContent = "Subiendo…";
    progreso.hidden = false;
    var barra = $("span", progreso);
    barra.style.width = "0%";
    var xhr = new XMLHttpRequest();
    xhr.open(editando ? "PUT" : "POST", "/api/admin/boletines");
    xhr.withCredentials = true;
    xhr.upload.addEventListener("progress", function (ev) {
      if (ev.lengthComputable) barra.style.width = Math.round(ev.loaded / ev.total * 100) + "%";
    });
    xhr.onload = function () {
      boton.disabled = false;
      progreso.hidden = true;
      var j = {};
      try { j = JSON.parse(xhr.responseText); } catch (err) {}
      if (xhr.status === 401) { ver("entrar"); return; }
      if (!j.ok) { estado.textContent = j.error || "No se pudo guardar. Intenta otra vez."; return; }
      var eraEdicion = !!editando;
      reiniciarFormulario();
      estado.textContent = eraEdicion ? "Cambios guardados." : "¡Boletín publicado! Ya lo ven los suscriptores.";
      cargar();
    };
    xhr.onerror = function () {
      boton.disabled = false;
      progreso.hidden = true;
      estado.textContent = "No pudimos conectarnos. Revisa tu internet e intenta otra vez.";
    };
    xhr.send(datos);
  });

  var iniciar = function () {
    reiniciarFormulario();
    if (!/^https?:$/.test(location.protocol)) { ver("entrar"); return; }
    cargar().catch(function () { ver("entrar"); });
  };

  // ¿Llegó desde el enlace del correo? (#clave=…)
  var m = location.hash.match(/^#clave=([a-f0-9]{64})$/);
  if (m) {
    token = m[1];
    try { history.replaceState(null, "", location.pathname); } catch (err) {}
    ver("nueva");
  } else {
    iniciar();
  }
})();
