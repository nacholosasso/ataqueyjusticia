import { useContext } from 'react';
import { PlantelContext } from '../context/PlantelContext';

export function usePlantel() {
  return useContext(PlantelContext);
}
