// Script de un solo uso: crea (o sobrescribe) en Firestore "jugadas
// guardadas" de ejemplo —pelota parada, contraataque, presión alta y salida
// con pase por abajo— para que el DT tenga jugadas principales ya armadas en
// el selector "Jugadas".
//
// Uso: node scripts/seed-jugadas-ejemplo.mjs
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

function leerEnv() {
  const contenido = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
  const env = {};
  for (const linea of contenido.split('\n')) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const i = limpia.indexOf('=');
    if (i === -1) continue;
    env[limpia.slice(0, i).trim()] = limpia.slice(i + 1).trim();
  }
  return env;
}

async function obtenerPlantel(env) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.VITE_SPREADSHEET_ID}/values/Plantel?key=${env.VITE_GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const datos = await res.json();
  if (!res.ok) throw new Error(`Error de Sheets API: ${datos.error?.message || res.statusText}`);
  const filas = datos.values?.slice(1) ?? [];
  return filas.map((fila, index) => ({
    id: fila[0] != null && fila[0] !== '' ? fila[0] : String(index),
    nombre: fila[1] || 'Sin Nombre',
    posAbrev: fila[4] || '-',
  }));
}

function asignarPosiciones(jugadores, coords) {
  const porRol = { ARQ: [], DEF: [], MED: [], DEL: [] };
  for (const j of jugadores) {
    if (porRol[j.posAbrev]) porRol[j.posAbrev].push(j);
  }

  const posiciones = {};
  for (const [rol, lista] of Object.entries(coords)) {
    porRol[rol].slice(0, lista.length).forEach((jugador, i) => {
      posiciones[jugador.id] = lista[i];
    });
  }
  return posiciones;
}

function rival(x, y, numero) {
  return [randomUUID(), { x, y, numero }];
}

async function main() {
  const env = leerEnv();
  const jugadores = await obtenerPlantel(env);

  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  const db = getFirestore(app);

  const jugadas = [
    {
      nombre: 'Córner ofensivo',
      tablero: {
        tipo: '3-3-1',
        posiciones: asignarPosiciones(jugadores, {
          ARQ: [{ x: 50, y: 92 }],
          DEF: [{ x: 25, y: 55 }, { x: 50, y: 50 }, { x: 75, y: 55 }],
          MED: [{ x: 35, y: 12 }, { x: 50, y: 8 }, { x: 65, y: 15 }],
          DEL: [{ x: 30, y: 6 }],
        }),
        pelota: { x: 98, y: 2 },
        rivales: Object.fromEntries([
          rival(50, 3, 1),
          rival(35, 8, 2),
          rival(50, 6, 3),
          rival(65, 8, 4),
          rival(30, 16, 5),
          rival(50, 14, 6),
          rival(70, 16, 7),
          rival(50, 32, 8),
        ]),
        flechas: [
          { x1: 98, y1: 2, x2: 50, y2: 8, tipo: 'pase' },
          { x1: 35, y1: 30, x2: 35, y2: 12, tipo: 'carrera' },
          { x1: 65, y1: 30, x2: 65, y2: 15, tipo: 'carrera' },
          { x1: 30, y1: 25, x2: 30, y2: 6, tipo: 'carrera' },
        ],
      },
    },
    {
      nombre: 'Contraataque rápido',
      tablero: {
        tipo: '3-3-1',
        posiciones: asignarPosiciones(jugadores, {
          ARQ: [{ x: 50, y: 90 }],
          DEF: [{ x: 25, y: 75 }, { x: 50, y: 70 }, { x: 75, y: 75 }],
          MED: [{ x: 30, y: 55 }, { x: 50, y: 58 }, { x: 70, y: 50 }],
          DEL: [{ x: 60, y: 35 }],
        }),
        pelota: { x: 50, y: 60 },
        rivales: Object.fromEntries([
          rival(50, 5, 1),
          rival(30, 20, 2),
          rival(50, 18, 3),
          rival(70, 22, 4),
          rival(35, 38, 5),
          rival(65, 36, 6),
          rival(50, 46, 7),
          rival(18, 55, 8),
        ]),
        flechas: [
          { x1: 50, y1: 60, x2: 60, y2: 50, tipo: 'conduccion' },
          { x1: 60, y1: 50, x2: 60, y2: 35, tipo: 'pase' },
          { x1: 60, y1: 35, x2: 55, y2: 10, tipo: 'carrera' },
          { x1: 30, y1: 55, x2: 35, y2: 30, tipo: 'carrera' },
        ],
      },
    },
    {
      nombre: 'Presión alta',
      tablero: {
        tipo: '3-3-1',
        posiciones: asignarPosiciones(jugadores, {
          ARQ: [{ x: 50, y: 80 }],
          DEF: [{ x: 25, y: 55 }, { x: 50, y: 58 }, { x: 75, y: 55 }],
          MED: [{ x: 30, y: 35 }, { x: 50, y: 30 }, { x: 70, y: 35 }],
          DEL: [{ x: 50, y: 15 }],
        }),
        pelota: { x: 50, y: 20 },
        rivales: Object.fromEntries([
          rival(50, 4, 1),
          rival(30, 12, 2),
          rival(50, 10, 3),
          rival(70, 12, 4),
          rival(25, 26, 5),
          rival(50, 26, 6),
          rival(75, 26, 7),
          rival(50, 40, 8),
        ]),
        flechas: [
          { x1: 50, y1: 15, x2: 50, y2: 25, tipo: 'carrera' },
          { x1: 30, y1: 35, x2: 35, y2: 22, tipo: 'carrera' },
          { x1: 70, y1: 35, x2: 65, y2: 22, tipo: 'carrera' },
          { x1: 25, y1: 55, x2: 25, y2: 45, tipo: 'carrera' },
        ],
      },
    },
    {
      nombre: 'Saque de arco - pase por abajo',
      tablero: {
        tipo: '3-3-1',
        posiciones: asignarPosiciones(jugadores, {
          ARQ: [{ x: 50, y: 92 }],
          DEF: [{ x: 25, y: 80 }, { x: 50, y: 75 }, { x: 75, y: 80 }],
          MED: [{ x: 30, y: 55 }, { x: 50, y: 58 }, { x: 70, y: 55 }],
          DEL: [{ x: 50, y: 20 }],
        }),
        pelota: { x: 50, y: 92 },
        rivales: Object.fromEntries([
          rival(50, 5, 1),
          rival(30, 20, 2),
          rival(50, 18, 3),
          rival(70, 20, 4),
          rival(25, 50, 5),
          rival(50, 48, 6),
          rival(75, 50, 7),
          rival(50, 68, 8),
        ]),
        flechas: [
          { x1: 50, y1: 92, x2: 25, y2: 80, tipo: 'pase' },
          { x1: 25, y1: 80, x2: 30, y2: 55, tipo: 'pase' },
          { x1: 30, y1: 55, x2: 50, y2: 58, tipo: 'pase' },
          { x1: 50, y1: 58, x2: 50, y2: 20, tipo: 'pase' },
        ],
      },
    },
  ];

  const existentes = await getDocs(collection(db, 'jugadas'));
  const porNombre = new Map(existentes.docs.map((d) => [d.data().nombre, d.id]));

  for (const { nombre, tablero } of jugadas) {
    const idExistente = porNombre.get(nombre);
    if (idExistente) {
      await updateDoc(doc(db, 'jugadas', idExistente), { tablero });
      console.log(`Actualizada: ${nombre}`);
    } else {
      await addDoc(collection(db, 'jugadas'), { nombre, tablero, creado: serverTimestamp() });
      console.log(`Creada: ${nombre}`);
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
