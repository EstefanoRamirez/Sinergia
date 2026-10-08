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
    use Digest::MD5 qw(md5_hex);
    sub version { open my $h, "<:raw", $_[0] or die "No se pudo leer $_[0]"; local $/; my $c = <$h>; close $h; substr(md5_hex($c), 0, 10) }
    my $datosNegocio = leer("plantillas/partes/datos-negocio.json");
    $datosNegocio =~ s/\s*\n\s*/ /g;
    $datosNegocio = qq(<script type="application/ld+json">$datosNegocio</script>);
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
    my $jsExtra = $pg eq "inicio" ? qq{  <script src="js/portada.js" defer></script>\n}
      : $pg eq "admin" ? qq{  <script src="js/admin.js" defer></script>\n} : "";

    # Dirección canónica (sin .html); el inicio es "/"
    my $ruta = $pg eq "inicio" ? "/" : "/" . ($file =~ s/\.html$//r);

    $head =~ s/__TITLE__/$t/g; $head =~ s/__DESC__/$d/g; $head =~ s/__PAGE__/$pg/g; $head =~ s/__RUTA__/$ruta/g;
    $head =~ s/__CSS_EXTRA__\n/$precarga/;
    my $claseBody = ($pg eq "404" || $pg eq "gracias" || $pg eq "admin") ? q{ class="sg-sin-portada"} : "";
    $head =~ s/__BODY_CLASS__/$claseBody/;
    $footer =~ s/__JS_EXTRA__\n/$jsExtra/;
    $head =~ s/<!DOCTYPE html>\n/<!DOCTYPE html>\n<!--\n  PÁGINA: $nota\n  Archivo generado: $file (no editar aquí; editar plantillas\/paginas\/$file y ejecutar: bash plantillas\/armar-paginas.sh)\n  Lo propio de esta página está entre "INICIO DEL CONTENIDO" y "FIN DEL CONTENIDO".\n-->\n/;

    my $html = $head . $header .
      "\n    <!-- ================= INICIO DEL CONTENIDO: $nombre ================= -->\n\n" .
      $body .
      "\n    <!-- ================= FIN DEL CONTENIDO: $nombre ================= -->\n\n" .
      $footer;

    # Enlaces internos con direcciones limpias: "nosotros.html" → "/nosotros", "index.html" → "/"
    $html =~ s{href="(?![a-z]+:|/|#)([a-z0-9-]+)\.html((?:[?#][^"]*)?)"}{"href=\"" . ($1 eq "index" ? "/" : "/$1") . $2 . "\""}ge;

    # Marca la página actual en el menú
    $html =~ s{(<a class="sg-nav-link" href="\Q$ruta\E")}{$1 aria-current="page"}g;
    $html =~ s{(<a href="\Q$ruta\E")(>[^<]+</a>\n\s*(?:<a|</div>|</nav>))}{$1 aria-current="page"$2}g;

    # Versión de CSS y JS (cambia sola cuando cambia el archivo): permite guardarlos un año en caché
    $html =~ s{((?:href|src)="/?)((?:css|js)/[\w./-]+\.(?:css|js))"}{$1 . $2 . "?v=" . version($2) . "\""}ge;

    # Datos estructurados para Google: la empresa (todas las páginas) y las migas de pan
    my $ld = $datosNegocio;
    if ($pg ne "inicio" && $pg ne "404" && $pg ne "gracias" && $pg ne "admin") {
      my @migas = ([ "Inicio", "/" ]);
      if ($body =~ m{<ol class="sg-migas"[^>]*>(.*?)</ol>}s) {
        my $ol = $1;
        while ($ol =~ m{<li>(?:<a href="([^"]+)">)?([^<]+)(?:</a>)?</li>}g) {
          my ($h, $n) = ($1, $2);
          next if $n eq "Inicio";
          $h = $h ? ($h =~ s/\.html$//r) : $ruta;
          $h = "/$h" unless $h =~ m{^/};
          push @migas, [ $n, $h ];
        }
      }
      my $i = 0;
      my $items = join ",", map { $i++; qq({"\@type":"ListItem","position":$i,"name":") . $_->[0] . qq(","item":"https://www.sinergia.ec) . $_->[1] . qq("}) } @migas;
      $ld .= qq(\n  <script type="application/ld+json">{"\@context":"https://schema.org","\@type":"BreadcrumbList","itemListElement":[$items]}</script>);
    }
    $html =~ s{(\n</head>)}{\n  $ld$1};

    # Páginas que no deben aparecer en Google
    if ($pg eq "gracias" || $pg eq "admin") {
      $html =~ s{(<head>\n)}{$1  <meta name="robots" content="noindex">\n};
    }

    # La página 404 se muestra en cualquier dirección que no exista (incluso /a/b/c).
    # Sus enlaces a otras páginas empiezan con "/", y js/tema.js, cargado desde la raíz,
    # fija la base "/" para que también carguen sus estilos y fotos.
    if ($pg eq "404") {
      $html =~ s{<html lang="es">}{<html lang="es" data-pagina="404">};
      $html =~ s{(<head>\n)}{$1  <meta name="robots" content="noindex">\n};
      $html =~ s{  <link rel="canonical"[^\n]*\n}{};
      $html =~ s{(  <script src="js/tema\.js((?:\?v=[^"]*)?)"></script>\n)}{  <script src="/js/tema.js$2"></script>\n$1};
    }

    print $html;
  ' "$f" "$n" > "$n"
  echo "  armada: $n"
done
echo "Listo. Revisa la web y luego: git add -A && git commit -m \"...\" && git push"
