/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import { obtenerPlantel } from '../services/sheetsService';

export const PlantelContext = createContext();

export function PlantelProvider({ children }) {
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const nombreEquipo = 'Ataque y Justicia';

  useEffect(() => {
    obtenerPlantel()
      .then(setJugadores)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <PlantelContext.Provider value={{ nombreEquipo, jugadores, cargando, error }}>
      {children}
    </PlantelContext.Provider>
  );
}
