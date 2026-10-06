# Publicar la web de Sinergia

Es el mismo proceso que usaste con Medicol, pero más corto: esta web no tiene carrito, pedidos ni claves secretas.

## 1. Revisar en tu computadora
1. En la terminal de VS Code, dentro de la carpeta del proyecto: `bash plantillas/armar-paginas.sh`
2. Abre `index.html` en el navegador (o, mejor, ejecuta `npx serve .` y entra a la dirección que aparece).

✅ Ves la portada; al mover el mouse aparece la foto a color.

## 2. Crear el proyecto en Cloudflare Pages
1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Elige el repositorio **EstefanoRamirez/Sinergia** y la rama que quieras publicar.
3. Build settings: **Framework preset: None**, **Build command: (vacío)**, **Build output directory: `/`**.
4. **Save and Deploy**.

✅ Te da una dirección `https://<proyecto>.pages.dev` con la web funcionando.

## 3. Conectar el dominio sinergia.ec
1. En el proyecto de Pages → **Custom domains** → **Set up a custom domain** → escribe `www.sinergia.ec`. Repite con `sinergia.ec`.
2. Sigue las instrucciones de Cloudflare: si el dominio ya usa Cloudflare, se configura solo; si no, te pedirá agregar un registro DNS (CNAME) donde compraste el dominio.

⚠️ **Los correos `@sinergia.ec` deben seguir funcionando.** No borres los registros **MX** ni **TXT** del dominio: solo agrega o cambia los registros de la web (CNAME de `www` y el del dominio principal).

⚠️ Si la dirección principal no es `www.sinergia.ec`, cámbiala en `plantillas/partes/cabeza.html` (enlaces `canonical`, `og:url` y `og:image`) y vuelve a armar las páginas.

## 4. Aparecer en Google
1. Entra a [Google Search Console](https://search.google.com/search-console) y agrega `sinergia.ec`.
2. En **Sitemaps** envía `https://www.sinergia.ec/sitemap.xml`.

## 5. Al terminar
- Cuando la web nueva esté publicada, en Wix puedes despublicar los sitios viejos para que Google no muestre páginas duplicadas.
