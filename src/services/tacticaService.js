import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const FLECHAS_REF = collection(db, 'flechas');
const ANOTACIONES_REF = collection(db, 'anotaciones');

export function suscribirseAFlechas(onChange, onError) {
  const q = query(FLECHAS_REF, orderBy('creado'));
  return onSnapshot(
    q,
    (snap) => {
      const flechas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(flechas);
    },
    (err) => onError?.(err.message)
  );
}

export async function agregarFlecha(coords) {
  return addDoc(FLECHAS_REF, { ...coords, creado: serverTimestamp() });
}

export async function moverFlecha(id, coords) {
  await updateDoc(doc(db, 'flechas', id), coords);
}

export async function eliminarFlecha(id) {
  await deleteDoc(doc(db, 'flechas', id));
}

export async function limpiarFlechas(ids) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, 'flechas', id)));
  await batch.commit();
}

export function suscribirseAAnotaciones(onChange, onError) {
  const q = query(ANOTACIONES_REF, orderBy('creado'));
  return onSnapshot(
    q,
    (snap) => {
      const anotaciones = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(anotaciones);
    },
    (err) => onError?.(err.message)
  );
}

export async function agregarAnotacion(anotacion) {
  return addDoc(ANOTACIONES_REF, { ...anotacion, creado: serverTimestamp() });
}

export async function moverAnotacion(id, coords) {
  await updateDoc(doc(db, 'anotaciones', id), coords);
}

export async function redimensionarAnotacion(id, escala) {
  await updateDoc(doc(db, 'anotaciones', id), { escala });
}

export async function editarAnotacion(id, cambios) {
  await updateDoc(doc(db, 'anotaciones', id), cambios);
}

export async function eliminarAnotacion(id) {
  await deleteDoc(doc(db, 'anotaciones', id));
}

export async function limpiarAnotaciones(ids) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, 'anotaciones', id)));
  await batch.commit();
}
