/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import { suscribirseAChat, enviarMensaje } from '../services/chatService';

export const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = suscribirseAChat(
      (lista) => {
        setMensajes(lista);
        setCargando(false);
      },
      (mensaje) => {
        setError(mensaje);
        setCargando(false);
      }
    );
    return unsubscribe;
  }, []);

  async function enviar(nombre, texto) {
    try {
      await enviarMensaje(nombre, texto);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ChatContext.Provider value={{ mensajes, cargando, error, enviar }}>
      {children}
    </ChatContext.Provider>
  );
}
