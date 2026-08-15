# Guiones de video — Landing TABAR

Un guión por rol, pensado para generar el video con una herramienta externa de IA (avatar + voz tipo Synthesia/HeyGen, o narración con ElevenLabs sobre grabación de pantalla). Ninguno de estos videos existe todavía — esto es el insumo de texto para producirlos.

## Tono

Directo, cercano, en segunda persona ("vos"). Nada de jerga técnica de blockchain salvo cuando aporta confianza (ej. "queda certificado", "trazabilidad"). El objetivo de cada video es que la persona entienda en menos de 90 segundos qué gana entrando a la plataforma, y termine con ganas de registrarse.

## Specs sugeridas para la producción

- **Duración:** 60–90 segundos por video (150–220 palabras de locución aprox.)
- **Formato:** horizontal 16:9 para la landing (1920×1080), considerar también un recorte 9:16 si se reutiliza en redes
- **Estructura fija:** Gancho (problema real) → Qué resuelve TABAR → Cómo se usa en 3 pasos → Cierre con CTA
- **Voz:** cercana, ritmo conversacional, no corporativa/robótica
- **Música:** de fondo, baja, sin voz

## Cómo se cargan en la app

Cuando tengas el archivo (subido a YouTube/Vimeo, aunque sea como "no listado"), pasame la URL y la cargo en `src/data/roleVideos.js` — el componente `VideoEmbed` ya está listo para recibirla y hasta entonces muestra un placeholder "Video próximamente".

## Archivos

| Rol | Archivo | CTA final |
|---|---|---|
| Productor | [productor.md](./productor.md) | Registrate como Productor |
| Acopiador / Industria | [acopiador.md](./acopiador.md) | Registrate como Acopiador |
| Estado Nacional | [estado.md](./estado.md) | Sumá tu Fondo Especial del Tabaco |
| Dealer | [dealer.md](./dealer.md) | Registrate como Dealer |
| Fideicomiso / Admin | [fideicomiso.md](./fideicomiso.md) | Conocé la gobernanza del protocolo |
