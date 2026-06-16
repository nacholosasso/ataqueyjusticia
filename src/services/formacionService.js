import { doc, onSnapshot, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from './firebaseConfig';

const FORMACION_REF = doc(db, 'formacion', 'actual');

export function suscribirseAFormacion(onChange, onError) {
  return onSnapshot(
    FORMACION_REF,
    (snap) => {
      const data = snap.exists() ? snap.data() : {};
      onChange({
        tipo: data.tipo ?? null,
        posiciones: data.posiciones ?? data.posicionesLibres ?? {},
        pelota: data.pelota ?? { x: 50, y: 50 },
        rivales: data.rivales ?? {},
        zTop: data.zTop ?? null,
      });
    },
    (err) => onError?.(err.message)
  );
}

export async function actualizarPosicion(jugadorId, coords) {
  await updateDoc(FORMACION_REF, { [`posiciones.${jugadorId}`]: coords, zTop: jugadorId });
}

export async function quitarPosicion(jugadorId) {
  await updateDoc(FORMACION_REF, { [`posiciones.${jugadorId}`]: deleteField() });
}

export async function actualizarPelota(coords) {
  await setDoc(FORMACION_REF, { pelota: coords, zTop: 'pelota' }, { merge: true });
}

export async function guardarFormacion(tipo, posiciones) {
  await setDoc(FORMACION_REF, { tipo, posiciones }, { merge: true });
}

export async function agregarRival(rivalId, rival) {
  await updateDoc(FORMACION_REF, { [`rivales.${rivalId}`]: rival });
}

export async function quitarRival(rivalId) {
  await updateDoc(FORMACION_REF, { [`rivales.${rivalId}`]: deleteField() });
}

export async function actualizarPosicionRival(rivalId, coords) {
  await updateDoc(FORMACION_REF, {
    [`rivales.${rivalId}.x`]: coords.x,
    [`rivales.${rivalId}.y`]: coords.y,
    zTop: rivalId,
  });
}

export async function vaciarCancha() {
  await setDoc(
    FORMACION_REF,
    { tipo: null, posiciones: {}, pelota: { x: 50, y: 50 }, rivales: {}, zTop: null },
    { merge: true }
  );
}
