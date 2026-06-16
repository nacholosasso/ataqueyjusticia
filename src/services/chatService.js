import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

const CHAT_REF = collection(db, 'chat');
const LIMITE_MENSAJES = 100;

export function suscribirseAChat(onChange, onError) {
  const q = query(CHAT_REF, orderBy('creado', 'desc'), limit(LIMITE_MENSAJES));
  return onSnapshot(
    q,
    (snap) => {
      const mensajes = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .reverse();
      onChange(mensajes);
    },
    (err) => onError?.(err.message)
  );
}

export async function enviarMensaje(nombre, texto) {
  await addDoc(CHAT_REF, { nombre, texto, creado: serverTimestamp() });
}
