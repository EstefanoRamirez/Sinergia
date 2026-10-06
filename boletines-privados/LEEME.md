# Boletines (solo suscriptores)

Esta carpeta no es pública: solo se puede leer a través de `/api/boletines` con una sesión de suscriptor.

Para publicar un boletín:
1. Guarda el PDF aquí con un nombre sin espacios ni tildes, por ejemplo `boletin-2026-10.pdf`.
2. Agrégalo a `lista.json` (el más nuevo primero):

```json
[
  { "archivo": "boletin-2026-10.pdf", "titulo": "Novedades tributarias de octubre", "fecha": "Octubre 2026", "resumen": "Cambios en retenciones y fechas de declaración." }
]
```
3. `git add -A`, `git commit -m "Boletín de octubre"` y `git push`.
