import { useContext } from 'react';
import { TacticaContext } from '../context/TacticaContext';

export function useTactica() {
  return useContext(TacticaContext);
}
