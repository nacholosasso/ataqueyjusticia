/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import {
  suscribirseAFormacion,
  actualizarPosicion,
  quitarPosicion,
  guardarFormacion,
  actualizarPelota,
  agregarRival as agregarRivalDoc,
  quitarRival as quitarRivalDoc,
  actualizarPosicionRival,
  vaciarCancha as vaciarCanchaDoc,
} from '../services/formacionService';
import { FORMACIONES } from '../utils/formaciones';

export const FormacionContext = createContext();

export function FormacionProvider({ children }) {
  const [posiciones, setPosiciones] = useState({});
  const [tipo, setTipo] = useState(null);
  const [pelota, setPelota] = useState({ x: 50, y: 50 });
  const [rivales, setRivales] = useState({});
  const [zTop, setZTop] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = suscribirseAFormacion(
      (estado) => {
        setPosiciones(estado.posiciones);
        setTipo(estado.tipo);
        setPelota(estado.pelota);
        setRivales(estado.rivales);
        setZTop(estado.zTop);
        setCargando(false);
      },
      (mensaje) => {
        setError(mensaje);
        setCargando(false);
      }
    );
    return unsubscribe;
  }, []);

  async function moverJugador(jugadorId, coords) {
    setPosiciones((prev) => ({ ...prev, [jugadorId]: coords }));
    setZTop(jugadorId);
    try {
      await actualizarPosicion(jugadorId, coords);
    } catch (err) {
      setError(err.message);
    }
  }

  async function moverPelota(coords) {
    setPelota(coords);
    setZTop('pelota');
    try {
      await actualizarPelota(coords);
    } catch (err) {
      setError(err.message);
    }
  }

  async function quitarJugador(jugadorId) {
    setPosiciones((prev) => {
      const resto = { ...prev };
      delete resto[jugadorId];
      return resto;
    });
    try {
      await quitarPosicion(jugadorId);
    } catch (err) {
      setError(err.message);
    }
  }

  // Al soltar un jugador sobre otro que ya está en la cancha, intercambia sus
  // lugares: el jugador soltado queda exactamente en la posición del otro
  // (alineado con la formación), y el desplazado toma la posición anterior
  // del que se soltó, o pasa a la banca si este venía de ahí.
  async function intercambiarJugadores(idArrastrado, idDestino) {
    const posDestino = posiciones[idDestino];
    if (!posDestino) return;
    const posOrigen = posiciones[idArrastrado];

    const nuevasPosiciones = { ...posiciones, [idArrastrado]: { ...posDestino } };
    if (posOrigen) {
      nuevasPosiciones[idDestino] = { ...posOrigen };
    } else {
      delete nuevasPosiciones[idDestino];
    }

    setPosiciones(nuevasPosiciones);
    setZTop(idArrastrado);
    try {
      await actualizarPosicion(idArrastrado, nuevasPosiciones[idArrastrado]);
      if (posOrigen) {
        await actualizarPosicion(idDestino, nuevasPosiciones[idDestino]);
      } else {
        await quitarPosicion(idDestino);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // Reacomoda a los jugadores que están en la cancha (ordenados por su y
  // actual) y, si faltan para completar el preset, a los de la banca (en su
  // orden del plantel) en las coordenadas del preset `nuevoTipo`.
  async function aplicarFormacion(nuevoTipo, jugadores) {
    const preset = FORMACIONES[nuevoTipo];
    if (!preset) return;

    const enCancha = Object.entries(posiciones)
      .sort(([, a], [, b]) => a.y - b.y)
      .map(([id]) => id);
    const enBanca = jugadores.map((j) => j.id).filter((id) => !posiciones[id]);
    const orden = [...enCancha, ...enBanca];

    const nuevasPosiciones = { ...posiciones };
    orden.forEach((id, i) => {
      if (i < preset.length) nuevasPosiciones[id] = { ...preset[i] };
    });

    setPosiciones(nuevasPosiciones);
    setTipo(nuevoTipo);
    try {
      await guardarFormacion(nuevoTipo, nuevasPosiciones);
    } catch (err) {
      setError(err.message);
    }
  }

  async function agregarRival() {
    const rivalId = crypto.randomUUID();
    const indice = Object.keys(rivales).length;
    const numero = indice + 1;
    const columna = indice % 4;
    const fila = Math.floor(indice / 4);
    const rival = {
      x: 20 + columna * 20 + (Math.random() * 6 - 3),
      y: 12 + fila * 16,
      numero,
    };
    setRivales((prev) => ({ ...prev, [rivalId]: rival }));
    try {
      await agregarRivalDoc(rivalId, rival);
    } catch (err) {
      setError(err.message);
    }
  }

  async function moverRival(rivalId, coords) {
    setRivales((prev) => ({ ...prev, [rivalId]: { ...prev[rivalId], ...coords } }));
    setZTop(rivalId);
    try {
      await actualizarPosicionRival(rivalId, coords);
    } catch (err) {
      setError(err.message);
    }
  }

  async function quitarRival(rivalId) {
    setRivales((prev) => {
      const resto = { ...prev };
      delete resto[rivalId];
      return resto;
    });
    try {
      await quitarRivalDoc(rivalId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function vaciarCancha() {
    setPosiciones({});
    setRivales({});
    setPelota({ x: 50, y: 50 });
    setTipo(null);
    setZTop(null);
    try {
      await vaciarCanchaDoc();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <FormacionContext.Provider
      value={{
        posiciones,
        tipo,
        pelota,
        rivales,
        zTop,
        cargando,
        error,
        moverJugador,
        quitarJugador,
        intercambiarJugadores,
        aplicarFormacion,
        moverPelota,
        agregarRival,
        moverRival,
        quitarRival,
        vaciarCancha,
      }}
    >
      {children}
    </FormacionContext.Provider>
  );
}
