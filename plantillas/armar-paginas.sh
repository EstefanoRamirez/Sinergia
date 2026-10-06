#!/usr/bin/env bash
# ============================================================================
#  Arma las páginas .html de la web a partir de las plantillas.
#
#  Cuándo usarlo: después de cambiar el menú, el encabezado, el pie de página
#  o el contenido de una página dentro de la carpeta plantillas/.
#
#  Cómo usarlo (terminal de VS Code, dentro de la carpeta del proyecto):
#      bash plantillas/armar-paginas.sh
#
#  Qué hace: une
#      plantillas/partes/cabeza.html      (<head>: título, estilos)
#      plantillas/partes/encabezado.html  (íconos, barra superior y menú)
#      plantillas/paginas/<página>.html   (contenido propio de cada página)
#      plantillas/partes/pie.html         (pie de página y scripts)
#  y escribe el resultado en la raíz del proyecto (index.html, servicios.html, ...).
#
#  La primera línea de cada archivo de plantillas/paginas/ tiene 4 datos
#  separados por "|":  título de la pestaña | descripción para Google | clave | nota
#
#  No edites los .html de la raíz directamente: se sobrescriben al armar.
# ============================================================================
set -e
cd "$(dirname "$0")/.."

for f in plantillas/paginas/*.html; do
  n=$(basename "$f")
  perl -CSD -e '
    use utf8;
    my ($page, $file) = @ARGV;
    sub leer { local $/; open my $h, "<:encoding(UTF-8)", $_[0] or die "No se pudo leer $_[0]"; my $t = <$h>; close $h; $t }
    my $head   = leer("plantillas/partes/cabeza.html");
    my $header = leer("plantillas/partes/encabezado.html");
    my $footer = leer("plantillas/partes/pie.html");
    my $body   = leer($page);

    $body =~ s/\A([^\n]*)\n//; my $meta = $1;
    my ($t, $d, $pg, $nota) = $meta =~ /^(.*)\|([^|]*)\|([^|]*)\|([^|]*)$/
      or die "La primera línea de $page debe tener 4 datos separados por |";
    my ($nombre) = $nota =~ /^([^—]+?)\s*—/;

    # Portada: precarga la foto principal y carga el efecto de la máscara
    my $precarga = $pg eq "inicio"
      ? qq{  <link rel="preload" as="image" href="images/portada/ejecutivo-1200.webp" imagesrcset="images/portada/ejecutivo-1200.webp 1200w, images/portada/ejecutivo.webp 2400w" imagesizes="100vw" fetchpriority="high">\n} : "";
    my $jsExtra = $pg eq "inicio" ? qq{  <script src="js/portada.js" defer></script>\n} : "";

    # Dirección canónica (sin .html); el inicio es "/"
    my $ruta = $pg eq "inicio" ? "/" : "/" . ($file =~ s/\.html$//r);

    $head =~ s/__TITLE__/$t/g; $head =~ s/__DESC__/$d/g; $head =~ s/__PAGE__/$pg/g; $head =~ s/__RUTA__/$ruta/g;
    $head =~ s/__CSS_EXTRA__\n/$precarga/;
    $footer =~ s/__JS_EXTRA__\n/$jsExtra/;
    $head =~ s/<!DOCTYPE html>\n/<!DOCTYPE html>\n<!--\n  PÁGINA: $nota\n  Archivo generado: $file (no editar aquí; editar plantillas\/paginas\/$file y ejecutar: bash plantillas\/armar-paginas.sh)\n  Lo propio de esta página está entre "INICIO DEL CONTENIDO" y "FIN DEL CONTENIDO".\n-->\n/;

    my $html = $head . $header .
      "\n    <!-- ================= INICIO DEL CONTENIDO: $nombre ================= -->\n\n" .
      $body .
      "\n    <!-- ================= FIN DEL CONTENIDO: $nombre ================= -->\n\n" .
      $footer;

    # Marca la página actual en el menú
    $html =~ s{(<a class="sg-nav-link" href="\Q$file\E")}{$1 aria-current="page"}g;

    # La página 404 se muestra en cualquier dirección que no exista (incluso /a/b/c).
    # Sus enlaces quedan relativos (así también se ve bien abriéndola en la computadora),
    # y js/tema.js, cargado desde la raíz, fija la base "/" cuando la web está publicada.
    if ($pg eq "404") {
      $html =~ s{<html lang="es">}{<html lang="es" data-pagina="404">};
      $html =~ s{(<head>\n)}{$1  <meta name="robots" content="noindex">\n};
      $html =~ s{  <link rel="canonical"[^\n]*\n}{};
      $html =~ s{(  <script src="js/tema\.js"></script>\n)}{  <script src="/js/tema.js"></script>\n$1};
    }

    print $html;
  ' "$f" "$n" > "$n"
  echo "  armada: $n"
done
echo "Listo. Revisa la web y luego: git add -A && git commit -m \"...\" && git push"
