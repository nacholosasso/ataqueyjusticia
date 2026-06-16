/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import {
  suscribirseAJugadas,
  crearJugada,
  sobrescribirJugada,
  cargarJugada,
  eliminarJugada,
} from '../services/jugadasService';

export const JugadasContext = createContext();

export function JugadasProvider({ children }) {
  const [jugadas, setJugadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = suscribirseAJugadas(
      (lista) => {
        setJugadas(lista);
        setCargando(false);
      },
      (mensaje) => {
        setError(mensaje);
        setCargando(false);
      }
    );
    return unsubscribe;
  }, []);

  async function guardar(nombre, tablero) {
    const nombreLimpio = nombre.trim();
    try {
      const existente = jugadas.find((j) => j.nombre === nombreLimpio);
      if (existente) {
        await sobrescribirJugada(existente.id, tablero);
      } else {
        await crearJugada(nombreLimpio, tablero);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function cargar(tablero) {
    try {
      await cargarJugada(tablero);
    } catch (err) {
      setError(err.message);
    }
  }

  async function actualizar(id, tablero) {
    try {
      await sobrescribirJugada(id, tablero);
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminar(id) {
    try {
      await eliminarJugada(id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <JugadasContext.Provider value={{ jugadas, cargando, error, guardar, cargar, actualizar, eliminar }}>
      {children}
    </JugadasContext.Provider>
  );
}
