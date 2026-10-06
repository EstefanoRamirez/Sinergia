/*
  Catálogo de Colchones Medicol (datos tomados del catálogo oficial en PDF).
  Para cambiar un precio, un texto o una foto, edita solo este archivo:
  la tienda, las fichas, el carrito, el catálogo y los avisos de pedido se actualizan solos.

  Importante: entre las llaves { } usa el formato JSON (claves y textos entre comillas dobles,
  sin coma después del último elemento). El servidor lee este mismo archivo para calcular
  el total de cada pedido.

  "precio": número en dólares, o null si el precio se consulta por WhatsApp.
  "opciones": medidas o modelos que el cliente elige en la ficha del producto.
  "promo": "segundo-mitad" aplica el 2do producto a mitad de precio en el carrito.
  "imagenes": la primera es la foto de la tarjeta; "ficha.jpg" es la página del catálogo.
*/
window.MEDICOL = {
  "whatsapp": "593998804606",
  "whatsappVisible": "099 880 4606",
  "telefono": "+593997272879",
  "telefonoVisible": "099 727 2879",
  "email": "medicolscc@hotmail.com",
  "ciudad": "Quito, Ecuador",
  "web": "www.colchonesmedicol.com",
  "lema": "Donde la salud descansa mejor",

  "_comentario_turnstile": "Clave de sitio de Cloudflare Turnstile (anti-bots del checkout). Vacía = desactivado. Ver docs/DESPLIEGUE.md, paso 7.",
  "turnstileSiteKey": "",

  "categorias": {
    "mascotas": "Mascotas",
    "colchones": "Colchones hospitalarios",
    "cojines": "Cojines y accesorios",
    "promociones": "Promociones"
  },

  "productos": [
    {
      "id": "colchon-perro-pequeno",
      "nombre": "Colchón para perros pequeños",
      "categoria": "mascotas",
      "precio": 43,
      "destacado": true,
      "resumen": "Ofrece un descanso cómodo y seguro, ayudando a reducir el estrés y la ansiedad de tu mascota.",
      "opciones": { "titulo": "Medida", "valores": ["70 × 50 cm"] },
      "caracteristicas": [
        "Medidas: 70 × 50 cm.",
        "Tamaño pensado para perros pequeños.",
        "Descanso cómodo y seguro.",
        "Ayuda a reducir el estrés y la ansiedad de tu mascota.",
        "Funda afelpada, suave al tacto, que lo separa del piso frío."
      ],
      "imagenes": ["images/productos/colchon-perro-pequeno/principal.webp", "images/productos/colchon-perro-pequeno/ficha.webp"]
    },
    {
      "id": "colchon-perro-mediano",
      "nombre": "Colchón para perros medianos",
      "categoria": "mascotas",
      "precio": 55,
      "destacado": true,
      "resumen": "Ofrece un descanso cómodo y seguro, ayudando a reducir el estrés y la ansiedad de tu mascota.",
      "opciones": { "titulo": "Medida", "valores": ["100 × 70 cm"] },
      "caracteristicas": [
        "Medidas: 100 × 70 cm.",
        "Tamaño pensado para perros medianos.",
        "Descanso cómodo y seguro.",
        "Ayuda a reducir el estrés y la ansiedad de tu mascota.",
        "Funda afelpada, suave al tacto, que lo separa del piso frío."
      ],
      "imagenes": ["images/productos/colchon-perro-mediano/principal.webp", "images/productos/colchon-perro-mediano/ficha.webp"]
    },
    {
      "id": "colchon-perro-grande",
      "nombre": "Colchón para perros grandes",
      "categoria": "mascotas",
      "precio": 72,
      "destacado": true,
      "resumen": "Ofrece un descanso cómodo y seguro, ayudando a reducir el estrés y la ansiedad de tu mascota.",
      "opciones": { "titulo": "Medida", "valores": ["100 × 90 cm"] },
      "caracteristicas": [
        "Medidas: 100 × 90 cm.",
        "Tamaño pensado para perros grandes.",
        "Descanso cómodo y seguro.",
        "Ayuda a reducir el estrés y la ansiedad de tu mascota.",
        "Funda afelpada, suave al tacto, que lo separa del piso frío."
      ],
      "imagenes": ["images/productos/colchon-perro-grande/principal.webp", "images/productos/colchon-perro-grande/ficha.webp"]
    },
    {
      "id": "colchon-perro-extra-grande",
      "nombre": "Colchón para perros más grandes",
      "categoria": "mascotas",
      "precio": 109,
      "resumen": "Ofrece un descanso cómodo y seguro, ayudando a reducir el estrés y la ansiedad de tu mascota.",
      "opciones": { "titulo": "Medida", "valores": ["120 × 100 cm"] },
      "caracteristicas": [
        "Medidas: 120 × 100 cm.",
        "Tamaño pensado para los perros más grandes.",
        "Descanso cómodo y seguro.",
        "Ayuda a reducir el estrés y la ansiedad de tu mascota.",
        "Funda afelpada, suave al tacto, que lo separa del piso frío."
      ],
      "imagenes": ["images/productos/colchon-perro-extra-grande/principal.webp", "images/productos/colchon-perro-extra-grande/ficha.webp"]
    },
    {
      "id": "colchon-gato",
      "nombre": "Colchón para gatos",
      "categoria": "mascotas",
      "precio": 32,
      "destacado": true,
      "resumen": "Ofrece un descanso cómodo y seguro, ayudando a reducir el estrés y la ansiedad de tu mascota.",
      "opciones": { "titulo": "Medida", "valores": ["50 × 40 cm"] },
      "caracteristicas": [
        "Medidas: 50 × 40 cm.",
        "Tamaño ideal para gatos.",
        "Descanso cómodo y seguro.",
        "Ayuda a reducir el estrés y la ansiedad de tu mascota.",
        "Funda afelpada, suave al tacto."
      ],
      "imagenes": ["images/productos/colchon-gato/principal.webp", "images/productos/colchon-gato/ficha.webp"]
    },
    {
      "id": "colchon-mascota",
      "nombre": "Colchón para mascota talla M",
      "categoria": "mascotas",
      "precio": 39,
      "promo": "segundo-mitad",
      "etiqueta": "2do a mitad de precio",
      "destacado": true,
      "resumen": "Colchón acolchado para que tu perro descanse cómodo, en su propio espacio y lejos del piso frío.",
      "opciones": { "titulo": "Talla", "valores": ["M · 66 × 100 × 8 cm"] },
      "caracteristicas": [
        "Talla M: 66 × 100 cm y 8 cm de espesor.",
        "Tamaño ideal para perros medianos.",
        "Funda afelpada, suave al tacto.",
        "Lo separa del piso frío y duro.",
        "Promoción: el 2do colchón a mitad de precio."
      ],
      "imagenes": ["images/productos/colchon-mascota/principal.webp", "images/productos/colchon-mascota/ficha.webp"]
    },

    {
      "id": "colchon-hospitalario",
      "nombre": "Colchón hospitalario en esponja gris",
      "categoria": "colchones",
      "precio": 92,
      "resumen": "Colchón hospitalario en esponja gris con forro impermeable, de 200 × 90 cm.",
      "opciones": { "titulo": "Medida", "valores": ["200 × 90 cm"] },
      "caracteristicas": [
        "Brinda soporte ortopédico firme y confortable.",
        "Su forro impermeable permite una limpieza rápida.",
        "Ideal para el cuidado diario del paciente.",
        "Relleno de esponja gris.",
        "Medida 200 × 90 cm, para cama hospitalaria."
      ],
      "imagenes": ["images/productos/colchon-hospitalario/principal.webp", "images/productos/colchon-hospitalario/ficha.webp"]
    },
    {
      "id": "colchon-ortopedico-antiescaras",
      "nombre": "Colchón ortopédico antiescaras",
      "categoria": "colchones",
      "precio": 104,
      "resumen": "Distribuye uniformemente la presión corporal para prevenir escaras.",
      "opciones": { "titulo": "Medida", "valores": ["200 × 90 cm"] },
      "caracteristicas": [
        "Distribuye uniformemente la presión corporal para prevenir escaras.",
        "Ayuda a mejorar la circulación sanguínea y la oxigenación.",
        "Brinda mayor confort y seguridad al paciente encamado.",
        "Espuma perfilada tipo huevo.",
        "Medida 200 × 90 cm."
      ],
      "imagenes": ["images/productos/colchon-ortopedico-antiescaras/principal.webp", "images/productos/colchon-ortopedico-antiescaras/ficha.webp"]
    },
    {
      "id": "colchon-hospitalario-ortopedico",
      "nombre": "Colchón hospitalario ortopédico",
      "categoria": "colchones",
      "precio": 116,
      "resumen": "Estructura sólida en esponja ortopédica, con forro de vinil impermeable. 200 × 90 × 12 cm.",
      "opciones": { "titulo": "Medida", "valores": ["200 × 90 × 12 cm"] },
      "caracteristicas": [
        "Estructura sólida en esponja ortopédica que ofrece estabilidad, soporte y durabilidad.",
        "Forro de vinil impermeable sin costuras en los vértices.",
        "Evita filtraciones y facilita su limpieza.",
        "Medidas para cama hospitalaria.",
        "200 × 90 cm y 12 cm de espesor."
      ],
      "imagenes": ["images/productos/colchon-hospitalario-ortopedico/principal.webp", "images/productos/colchon-hospitalario-ortopedico/ficha.webp"]
    },
    {
      "id": "colchon-hospitalario-antiescaras",
      "nombre": "Colchón hospitalario antiescaras",
      "categoria": "colchones",
      "precio": 137,
      "resumen": "Esponja ortopédica de 24 kg de densidad y esponja perfilada gris de 20 kg. 200 × 90 cm.",
      "opciones": { "titulo": "Medida", "valores": ["200 × 90 cm"] },
      "caracteristicas": [
        "Esponja ortopédica con soporte base de 24 kg de densidad.",
        "Esponja perfilada gris de 20 kg de densidad.",
        "Brinda soporte ortopédico firme y confortable.",
        "Su forro impermeable permite una limpieza rápida.",
        "Ideal para el cuidado diario del paciente. Medidas para cama hospitalaria."
      ],
      "imagenes": ["images/productos/colchon-hospitalario-antiescaras/principal.webp", "images/productos/colchon-hospitalario-antiescaras/ficha.webp"]
    },
    {
      "id": "colchon-articulado",
      "nombre": "Colchón ortopédico antiescaras articulado",
      "categoria": "colchones",
      "precio": 147,
      "destacado": true,
      "resumen": "Diseñado para camas hospitalarias articuladas de 4 partes. 200 × 90 cm.",
      "opciones": { "titulo": "Medida", "valores": ["200 × 90 cm"] },
      "caracteristicas": [
        "Diseñado para camas hospitalarias articuladas de 4 partes.",
        "Se adapta a cada movimiento de la cama, garantizando comodidad continua.",
        "Higiene fácil gracias a su forro de vinil impermeable.",
        "Espuma perfilada antiescaras.",
        "Medida 200 × 90 cm."
      ],
      "imagenes": ["images/productos/colchon-articulado/principal.webp", "images/productos/colchon-articulado/ficha.webp"]
    },
    {
      "id": "colchon-memory-plus",
      "nombre": "Colchón hospitalario ortopédico Memory Plus",
      "categoria": "colchones",
      "precio": 216,
      "destacado": true,
      "resumen": "Esponja látex de 32 kg de densidad con capa de espuma Memory para una mejor adaptación al cuerpo.",
      "opciones": { "titulo": "Medida", "valores": ["200 × 90 × 12 cm"] },
      "caracteristicas": [
        "Estructura en esponja látex de 8 cm y 32 kg de densidad.",
        "Arriba, esponja Memory para una mejor adaptabilidad del cuerpo.",
        "Forro de vinil impermeable sin costuras en los vértices: evita el ingreso de líquidos.",
        "Evita filtraciones y la falta de higiene.",
        "Medidas para cama hospitalaria: 200 × 90 × 12 cm."
      ],
      "imagenes": ["images/productos/colchon-memory-plus/principal.webp", "images/productos/colchon-memory-plus/ficha.webp"]
    },

    {
      "id": "cojin-silla-ruedas",
      "nombre": "Cojín antiescaras para silla de ruedas",
      "categoria": "cojines",
      "precio": 17,
      "resumen": "Reduce la presión y mejora el confort al sentarse. Interior de espuma tipo huevo.",
      "opciones": { "titulo": "Medida", "valores": ["45 × 40 cm"] },
      "caracteristicas": [
        "Reduce la presión y mejora el confort al sentarse.",
        "Interior de espuma tipo “huevo” antiescaras.",
        "Práctico, funcional y con forro de vinil impermeable.",
        "Medida 45 × 40 cm.",
        "Incluido en la promoción de cojines geriátricos 3 × $79."
      ],
      "imagenes": ["images/productos/cojin-silla-ruedas/principal.webp", "images/productos/cojin-silla-ruedas/ficha.webp"]
    },
    {
      "id": "cojin-coxis",
      "nombre": "Cojín coxis antiescaras",
      "categoria": "cojines",
      "precio": 27,
      "resumen": "Alivia el dolor del coxis. Ideal para silla de ruedas, la oficina, la casa o el vehículo.",
      "opciones": { "titulo": "Medida", "valores": ["40 × 35 × 8 cm"] },
      "caracteristicas": [
        "Reduce la presión directa sobre el coxis.",
        "Previene escaras y úlceras por presión.",
        "Alivia el dolor lumbar y pélvico, y mejora la postura al estar sentado.",
        "Fácil de llevar a la oficina, casa o vehículo.",
        "Medidas: 40 × 35 × 8 cm (pueden variar según lo pida el cliente)."
      ],
      "imagenes": ["images/productos/cojin-coxis/principal.webp", "images/productos/cojin-coxis/ficha.webp"]
    },
    {
      "id": "cojin-asiento-respaldo",
      "nombre": "Cojín antiescaras asiento y respaldo",
      "categoria": "cojines",
      "precio": 29,
      "resumen": "Previene escaras y mejora la postura. Ideal para adultos mayores y usuarios de silla de ruedas.",
      "caracteristicas": [
        "Previene escaras y reduce la presión.",
        "Mejora la postura y aumenta la comodidad.",
        "Cubre asiento y respaldo.",
        "Interior de espuma tipo huevo.",
        "Ideal para adultos mayores, pacientes y usuarios de silla de ruedas."
      ],
      "imagenes": ["images/productos/cojin-asiento-respaldo/principal.webp", "images/productos/cojin-asiento-respaldo/ficha.webp"]
    },
    {
      "id": "cojin-bbl",
      "nombre": "Cojín BBL pos cirugía de glúteos",
      "categoria": "cojines",
      "precio": 29,
      "resumen": "Permite sentarse de forma segura en el postoperatorio de glúteos.",
      "caracteristicas": [
        "Evita la presión sobre los glúteos recién operados.",
        "Protege el injerto de grasa y la forma lograda.",
        "Reduce molestias y acelera la recuperación.",
        "Permite sentarse de forma segura en el postoperatorio.",
        "Útil en la oficina, el auto o la casa."
      ],
      "imagenes": ["images/productos/cojin-bbl/principal.webp", "images/productos/cojin-bbl/ficha.webp"]
    },
    {
      "id": "cojin-media-luna",
      "nombre": "Cojín de apoyo media luna",
      "categoria": "cojines",
      "precio": 33,
      "resumen": "Soporte ergonómico para piernas, rodillas, brazos o cuello.",
      "caracteristicas": [
        "Brinda soporte ergonómico para piernas, rodillas, brazos o cuello.",
        "Reduce la presión y el cansancio, mejorando la postura.",
        "Favorece el descanso durante el reposo y la recuperación.",
        "Ideal para rehabilitación, descanso y uso diario.",
        "Forro de vinil fácil de limpiar."
      ],
      "imagenes": ["images/productos/cojin-media-luna/principal.webp", "images/productos/cojin-media-luna/ficha.webp"]
    },
    {
      "id": "cojin-herradura",
      "nombre": "Cojín antiescaras forma de herradura",
      "categoria": "cojines",
      "precio": 34,
      "resumen": "Perfecto para personas que pasan muchas horas sentadas. Ideal para hemorroides y postparto.",
      "caracteristicas": [
        "Reduce la presión al sentarse y protege el coxis y el perineo.",
        "Ideal para hemorroides y postparto.",
        "Perfecto para personas que pasan muchas horas sentadas.",
        "Forro acolchado fácil de limpiar.",
        "Incluido en la promoción de cojines geriátricos 3 × $79."
      ],
      "imagenes": ["images/productos/cojin-herradura/principal.webp", "images/productos/cojin-herradura/ficha.webp"]
    },
    {
      "id": "cojin-elevador",
      "nombre": "Cojín elevador pie / mano",
      "categoria": "cojines",
      "precio": 35,
      "etiqueta": "El par",
      "resumen": "Eleva y posiciona el pie, talón, tobillo, mano o brazo. Precio por el par.",
      "opciones": { "titulo": "Modelo", "valores": ["Rectangular", "Circular"] },
      "caracteristicas": [
        "Eleva y posiciona el pie, talón, tobillo, mano o brazo.",
        "Ayuda a reducir el edema y aliviar el dolor.",
        "Mejora la circulación con una postura estable y cómoda.",
        "Ideal para cuidados prolongados y recuperación.",
        "Modelo rectangular o circular. Precio por el par."
      ],
      "imagenes": ["images/productos/cojin-elevador/principal.webp", "images/productos/cojin-elevador/modelo-circular.webp", "images/productos/cojin-elevador/ficha.webp"]
    },
    {
      "id": "cojin-cambio-panal",
      "nombre": "Cojín auxiliar para cambio de pañal adulto",
      "categoria": "cojines",
      "precio": 37,
      "resumen": "Facilita el cambio de pañal en pacientes encamados.",
      "caracteristicas": [
        "Facilita el cambio de pañal en pacientes encamados.",
        "Mejora la ergonomía y la seguridad del personal de enfermería.",
        "Ideal para geriátricos y cuidado en casa.",
        "Mantiene al paciente de lado durante el cambio.",
        "Incluido en la promoción de cojines geriátricos 3 × $79."
      ],
      "imagenes": ["images/productos/cojin-cambio-panal/principal.webp", "images/productos/cojin-cambio-panal/ficha.webp"]
    },
    {
      "id": "cojin-rodillo",
      "nombre": "Cojín rodillo",
      "categoria": "cojines",
      "precio": 37,
      "resumen": "Soporte y correcta alineación para cuello, espalda, rodillas o tobillos.",
      "opciones": { "titulo": "Medida", "valores": ["55 × 30 cm"] },
      "caracteristicas": [
        "Brinda soporte y correcta alineación para cuello, espalda, rodillas o tobillos.",
        "Ayuda a reducir la presión y el dolor.",
        "Mejora la postura y la comodidad al estar sentado o acostado.",
        "Ideal para reposo, rehabilitación y uso diario.",
        "Medida 55 × 30 cm."
      ],
      "imagenes": ["images/productos/cojin-rodillo/principal.webp", "images/productos/cojin-rodillo/ficha.webp"]
    },
    {
      "id": "lona-mover-pacientes",
      "nombre": "Lona para mover pacientes encamados",
      "categoria": "cojines",
      "precio": 39,
      "resumen": "Facilita giros, cambios de posición y traslados en cama.",
      "caracteristicas": [
        "Facilita giros, cambios de posición y traslados en cama.",
        "Reduce el esfuerzo del personal de cuidado.",
        "Disminuye el riesgo de caídas y lesiones.",
        "Asas reforzadas para un agarre seguro.",
        "Ideal para uso domiciliario y hospitalario."
      ],
      "imagenes": ["images/productos/lona-mover-pacientes/principal.webp", "images/productos/lona-mover-pacientes/ficha.webp"]
    },
    {
      "id": "cojin-antirreflujo",
      "nombre": "Cojín antirreflujo",
      "categoria": "cojines",
      "precio": 47,
      "resumen": "Disminuye el reflujo gástrico y la acidez, y favorece una postura correcta al descansar.",
      "opciones": { "titulo": "Medida", "valores": ["60 × 60 × 35 cm"] },
      "caracteristicas": [
        "Disminuye el reflujo gástrico y la acidez.",
        "Favorece una postura correcta al descansar.",
        "Ideal para bebés, adultos y personas en recuperación.",
        "Uso recomendado por especialistas para dormir más tranquilo.",
        "Cojín personalizado: 60 × 60 × 35 cm."
      ],
      "imagenes": ["images/productos/cojin-antirreflujo/principal.webp", "images/productos/cojin-antirreflujo/ficha.webp"]
    },
    {
      "id": "almohada-cuna",
      "nombre": "Almohada tipo cuña para atrancar pacientes encamados",
      "categoria": "cojines",
      "precio": 54,
      "etiqueta": "El par",
      "resumen": "Diseño en forma de cuña que permite posicionar al paciente de lado de forma segura. Precio por el par.",
      "opciones": { "titulo": "Medida", "valores": ["67 × 25 cm"] },
      "caracteristicas": [
        "Diseño en forma de cuña que permite posicionar al paciente de lado de forma segura.",
        "Proporciona soporte firme para evitar desplazamientos o malas posturas en cama.",
        "Ayuda a prevenir úlceras por presión al facilitar los cambios posturales.",
        "Medida 67 × 25 cm.",
        "Precio por el par."
      ],
      "imagenes": ["images/productos/almohada-cuna/principal.webp", "images/productos/almohada-cuna/ficha.webp"]
    },

    {
      "id": "combo-cojines-geriatricos",
      "nombre": "Promoción cojines geriátricos",
      "categoria": "promociones",
      "precio": 79,
      "etiqueta": "3 × $79",
      "destacado": true,
      "resumen": "Los tres cojines esenciales para el cuidado del adulto mayor, a precio especial. Por separado suman $88.",
      "caracteristicas": [
        "Cojín antiescaras en forma de herradura ($34).",
        "Cojín antiescaras para silla de ruedas ($17).",
        "Cojín auxiliar para cambio de pañal adulto ($37).",
        "Precio especial por los tres: $79 (ahorras $9).",
        "Ideal para el cuidado del adulto mayor en casa."
      ],
      "imagenes": ["images/productos/combo-cojines-geriatricos/principal.webp", "images/productos/cojin-herradura/principal.webp", "images/productos/cojin-silla-ruedas/principal.webp", "images/productos/cojin-cambio-panal/principal.webp"]
    }
  ]
};
