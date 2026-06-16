import { useContext } from 'react';
import { FormacionContext } from '../context/FormacionContext';

export function useFormacion() {
  return useContext(FormacionContext);
}
