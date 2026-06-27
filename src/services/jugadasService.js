import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const JUGADAS_REF = collection(db, 'jugadas');
const FORMACION_REF = doc(db, 'formacion', 'actual');
const FLECHAS_REF = collection(db, 'flechas');
const ANOTACIONES_REF = collection(db, 'anotaciones');

export function suscribirseAJugadas(onChange, onError) {
  const q = query(JUGADAS_REF, orderBy('creado'));
  return onSnapshot(
    q,
    (snap) => {
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => onError?.(err.message)
  );
}

export async function crearJugada(nombre, tablero) {
  await addDoc(JUGADAS_REF, { nombre, tablero, creado: serverTimestamp() });
}

export async function sobrescribirJugada(id, tablero) {
  await updateDoc(doc(db, 'jugadas', id), { tablero });
}

export async function eliminarJugada(id) {
  await deleteDoc(doc(db, 'jugadas', id));
}

export async function cargarJugada(tablero) {
  const { tipo = null, posiciones = {}, pelota = { x: 50, y: 50 }, rivales = {}, flechas = [], anotaciones = [] } = tablero;

  await setDoc(FORMACION_REF, { tipo, posiciones, pelota, rivales });

  const [flechasActuales, anotacionesActuales] = await Promise.all([getDocs(FLECHAS_REF), getDocs(ANOTACIONES_REF)]);
  const batch = writeBatch(db);
  flechasActuales.docs.forEach((d) => batch.delete(d.ref));
  anotacionesActuales.docs.forEach((d) => batch.delete(d.ref));
  flechas.forEach(({ x1, y1, x2, y2, tipo: tipoFlecha }) => {
    batch.set(doc(FLECHAS_REF), { x1, y1, x2, y2, tipo: tipoFlecha, creado: serverTimestamp() });
  });
  anotaciones.forEach(({ x, y, texto, color, escala }) => {
    const datos = { x, y, texto, creado: serverTimestamp() };
    if (color !== undefined) datos.color = color;
    if (escala !== undefined) datos.escala = escala;
    batch.set(doc(ANOTACIONES_REF), datos);
  });
  await batch.commit();
}
