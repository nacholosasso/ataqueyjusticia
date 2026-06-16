import { useContext } from 'react';
import { JugadasContext } from '../context/JugadasContext';

export function useJugadas() {
  return useContext(JugadasContext);
}
