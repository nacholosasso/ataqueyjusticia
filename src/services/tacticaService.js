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
  await addDoc(FLECHAS_REF, { ...coords, creado: serverTimestamp() });
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
