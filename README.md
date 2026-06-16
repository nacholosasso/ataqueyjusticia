# Ataque y Justicia ⚽

Aplicación web para el equipo de fútbol **Ataque y Justicia**. Permite ver el plantel en cartas estilo FIFA y armar la táctica en una pizarra interactiva compartida en tiempo real.

## Funcionalidades

- **Plantel**: cartas de jugador estilo FIFA con rating OVR, atributos (ritmo, tiro, pase, regate, defensa, físico) y tendencia de forma
- **Pizarra táctica**: cancha de fútbol 8 con drag-and-drop para ubicar jugadores, presets de formación, pelota arrastrable y flechas tácticas dibujables
- **Tiempo real**: la pizarra y el chat están sincronizados entre todos los dispositivos vía Firebase
- **Chat en vivo**: mensajes en tiempo real dentro de la app

## Stack

- React 18 + Vite
- Tailwind CSS (tema oscuro, fuente Bebas Neue)
- @dnd-kit para drag-and-drop
- Firebase Firestore (estado compartido en tiempo real)
- Google Sheets API (fuente de datos del plantel, solo lectura)
- Firebase Hosting

## Configuración

Copiar `.env.example` a `.env` y completar las variables:

```
VITE_SPREADSHEET_ID=...
VITE_GOOGLE_API_KEY=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Desarrollo

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
firebase deploy
```
