/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import {
  suscribirseAFlechas,
  agregarFlecha,
  moverFlecha,
  eliminarFlecha,
  limpiarFlechas,
} from '../services/tacticaService';

export const TacticaContext = createContext();

export function TacticaProvider({ children }) {
  const [flechas, setFlechas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = suscribirseAFlechas(
      (lista) => {
        setFlechas(lista);
        setCargando(false);
      },
      (mensaje) => {
        setError(mensaje);
        setCargando(false);
      }
    );
    return unsubscribe;
  }, []);

  async function agregar(coords) {
    try {
      await agregarFlecha(coords);
    } catch (err) {
      setError(err.message);
    }
  }

  async function mover(id, coords) {
    setFlechas((prev) => prev.map((f) => (f.id === id ? { ...f, ...coords } : f)));
    try {
      await moverFlecha(id, coords);
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminar(id) {
    try {
      await eliminarFlecha(id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function limpiar() {
    try {
      await limpiarFlechas(flechas.map((f) => f.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <TacticaContext.Provider value={{ flechas, cargando, error, agregar, mover, eliminar, limpiar }}>
      {children}
    </TacticaContext.Provider>
  );
}
