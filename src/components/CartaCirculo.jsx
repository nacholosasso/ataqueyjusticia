import { memo } from 'react';
import { calcularOVR, obtenerEstiloCarta, ESTILO_RIVAL, FOTO_FALLBACK } from '../utils/cartaEstilos';

function CartaCirculo({ jugador }) {
  const { nombre, fotoURL = '', atributos = {}, mediaForzada } = jugador;
  const ovr = calcularOVR(atributos, mediaForzada);
  const { fondo, borde, brillo } = obtenerEstiloCarta(ovr);

  return (
    <div
      className={`group relative w-full aspect-square rounded-full overflow-hidden border-2 ${borde} ${fondo} ${brillo} shadow-xl shadow-black/50 transition-transform duration-200 hover:-translate-y-0.5`}
    >
      <img
        className="w-full h-full object-cover"
        src={fotoURL || FOTO_FALLBACK}
        alt={`Foto de ${nombre}`}
        onError={(e) => { e.target.src = FOTO_FALLBACK; }}
      />
    </div>
  );
}

function CartaRivalCirculo() {
  const { fondo, borde, acento } = ESTILO_RIVAL;

  return (
    <div
      className={`group relative w-full aspect-square rounded-full overflow-hidden border-2 ${borde} ${fondo} shadow-xl shadow-black/50 flex items-center justify-center transition-transform duration-200 hover:-translate-y-0.5`}
    >
      <svg viewBox="0 0 24 24" className={`w-3/5 h-3/5 ${acento}`} fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7v1H4z" />
      </svg>
    </div>
  );
}

const CartaCirculoMemo = memo(CartaCirculo);
const CartaRivalCirculoMemo = memo(CartaRivalCirculo);

export { CartaCirculoMemo as CartaCirculo, CartaRivalCirculoMemo as CartaRivalCirculo };
