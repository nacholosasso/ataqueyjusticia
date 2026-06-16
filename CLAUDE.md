# CLAUDE.md

Este archivo da guía a Claude Code (claude.ai/code) para trabajar en este repositorio.

## Resumen del proyecto

Aplicación web del equipo de fútbol "Ataque y Justicia": muestra el plantel ("Plantel") como cartas de jugador estilo FIFA, y una pizarra táctica compartida donde se puede ubicar al plantel en una cancha de fútbol 8, moverlos por drag-and-drop, dibujar flechas, y charlar por un chat en vivo. Los textos de la interfaz están en español (Argentina).

Stack: React 18 + Vite, Tailwind CSS, `@dnd-kit` para drag-and-drop, Firebase Firestore para estado compartido en tiempo real, y la API de Google Sheets como fuente de solo lectura del plantel. Se hostea en Firebase Hosting.

## Comandos

- `npm run dev` — levanta el servidor de desarrollo de Vite
- `npm run build` — build de producción a `dist/`
- `npm run preview` — previsualiza el build de producción localmente
- `npm run lint` — ESLint sobre `src` (`.js`/`.jsx`, cero warnings permitidos)

No hay suite de tests configurada.

### Pruebas funcionales

NO hagas pruebas con browser automation (Playwright, Chrome/CDP, chromium-cli, screenshots automáticos, etc.). Las pruebas funcionales las hace el usuario a mano. Si hace falta verificar un cambio de UI, basate en lectura de código, lint y build, y pedile al usuario que lo pruebe él.

### Configuración de entorno

Copiar `.env.example` a `.env` y completar:
- `VITE_SPREADSHEET_ID` / `VITE_GOOGLE_API_KEY` — acceso a la API de Google Sheets para el plantel (la hoja debe tener una pestaña "Plantel", ser de lectura pública, y la API key debe estar restringida por referrer HTTP)
- `VITE_FIREBASE_*` — configuración del proyecto de Firebase (Firestore)

### Deploy

`firebase deploy` despliega `dist/` (correr `npm run build` antes) según `firebase.json`, y `firestore.rules` para las reglas de seguridad. El proyecto de Firebase está configurado en `.firebaserc` (proyecto: `ataqueyjusticia`).

## Arquitectura

### Manejo de estado: pares service + Context

Cada dominio tiene un **service** (I/O contra Firestore/Sheets) + un **Context provider** (suscribe/mantiene el estado) + un **hook** (consume el context). Los cuatro providers están anidados en [main.jsx](src/main.jsx), envolviendo a `<App />`:

| Dominio | Service | Context | Hook | Backend |
|---|---|---|---|---|
| Plantel | [sheetsService.js](src/services/sheetsService.js) | [PlantelContext](src/context/PlantelContext.jsx) | `usePlantel` | Google Sheets (solo lectura, se obtiene una vez) |
| Formación (posiciones en cancha + pelota) | [formacionService.js](src/services/formacionService.js) | [FormacionContext](src/context/FormacionContext.jsx) | `useFormacion` | Documento Firestore `formacion/actual` (tiempo real) |
| Flechas de pizarra táctica | [tacticaService.js](src/services/tacticaService.js) | [TacticaContext](src/context/TacticaContext.jsx) | `useTactica` | Colección Firestore `flechas` (tiempo real) |
| Chat | [chatService.js](src/services/chatService.js) | [ChatContext](src/context/ChatContext.jsx) | `useChat` | Colección Firestore `chat` (tiempo real, últimos 100) |

Patrón para los tres contexts basados en Firestore: se actualiza el estado local de forma optimista y luego se escribe en Firestore; `onSnapshot` mantiene el estado sincronizado entre clientes, y si una escritura falla, el error queda en `error` dentro del estado del context.

### Forma de los datos del plantel

`obtenerPlantel()` en [sheetsService.js](src/services/sheetsService.js) mapea columnas fijas de la planilla (id, nombre, dorsal, fotoURL, posAbrev, 6 columnas de atributos rit/tir/pas/reg/def/fis, mediaForzada opcional, y "forma"/tendencia) a objetos de jugador. El rating de la carta (OVR) y el estilo según tier (bronce/plata/oro/especial) se calculan en [cartaEstilos.js](src/utils/cartaEstilos.js) a partir de estos atributos.

### Formación / drag-and-drop (componente central: Formacion.jsx)

[Formacion.jsx](src/components/Formacion.jsx) es el orquestador: conecta `usePlantel`, `useFormacion` y `useTactica` dentro de un único `DndContext` de `@dnd-kit`.

- Elementos arrastrables: jugadores (`JugadorArrastrable`, exportado desde Formacion.jsx y reusado por [JugadoresCancha.jsx](src/components/JugadoresCancha.jsx)) y la pelota ([PelotaCancha.jsx](src/components/PelotaCancha.jsx)), identificados por su drag id (`jugador.id` o `'pelota'`).
- Zonas droppable: `'cancha'` (la cancha) y `'banca'` (jugadores que no están ubicados).
- Al soltar, los rects en píxeles se convierten a coordenadas porcentuales relativas a la cancha mediante `coordsDesdeRect` en [posiciones.js](src/utils/posiciones.js).
- Los presets de formación (`FORMACIONES`, `TIPOS_FORMACION`) en [formaciones.js](src/utils/formaciones.js) definen layouts de fútbol 8 (8 posiciones, orden ARQ→DEL); `aplicarFormacion` en FormacionContext reasigna a los jugadores en cancha (ordenados por su `y` actual) más los de la banca a las posiciones del preset.
- [PizarraTactica.jsx](src/components/PizarraTactica.jsx) renderiza/edita las flechas como overlay SVG (viewBox 0-100, coordenadas porcentuales), editable solo en "modo dibujo".

### Modelo de seguridad de Firestore

[firestore.rules](firestore.rules) es default-deny; solo las colecciones `formacion`, `chat` y `flechas` son accesibles, cada una con validación a nivel de campo (p. ej. los mensajes de chat deben respetar `{nombre, texto, creado}` con límites de tamaño; el chat es solo create, sin update/delete). Si se cambia la forma de los datos que escribe algún service, hay que actualizar la regla correspondiente.

### Estilos

Tailwind, tema oscuro (base zinc-950), fuente "Bebas Neue" para encabezados/ratings (`font-display`). Los colores por rol de jugador (ARQ/DEF/MED/DEL) están centralizados en [posicionColores.js](src/utils/posicionColores.js).

### Agregar una nueva sección/página

`App.jsx` renderiza secciones mediante un mapa `SECCIONES` indexado por id, que se cambia desde [Navbar.jsx](src/components/Navbar.jsx); actualmente solo está habilitada `'inicio'` (→ página `Plantel`).

## Cómo trabajar

- Cambios que toquen FormacionContext, los services o las reglas de Firestore:
  usá modo plan, mostrame el enfoque y esperá mi OK antes de codear.
- Features grandes: trabajá por fases y frená para que revise cada una.
- Si la forma de los datos en Firestore es ambigua, preguntá antes de escribir.
- Mantené el estilo visual actual (cartas FIFA, tema oscuro).
