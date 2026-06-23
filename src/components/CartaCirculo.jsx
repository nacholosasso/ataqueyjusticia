import { memo } from 'react';
import { calcularOVR, obtenerEstiloCarta, ESTILO_RIVAL, FOTO_FALLBACK } from '../utils/cartaEstilos';

function CartaCirculo({ jugador, onClick }) {
  const { nombre, fotoURL = '', atributos = {}, mediaForzada } = jugador;
  const ovr = calcularOVR(atributos, mediaForzada);
  const { fondo, borde, brillo } = obtenerEstiloCarta(ovr);

  return (
    <div className="relative w-full cursor-pointer" onClick={onClick}>
      <div
        className={`group w-full aspect-square rounded-full overflow-hidden border-2 ${borde} ${fondo} ${brillo} shadow-xl shadow-black/50 transition-transform duration-200 hover:-translate-y-0.5`}
      >
        <img
          className="w-full h-full object-cover"
          src={fotoURL || FOTO_FALLBACK}
          alt={`Foto de ${nombre}`}
          onError={(e) => { e.target.src = FOTO_FALLBACK; }}
        />
      </div>
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 w-[180%] text-center font-display text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-wide text-white truncate leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none">
        {nombre}
      </span>
    </div>
  );
}

function CartaRivalCirculo({ onClick }) {
  const { fondo, borde, acento } = ESTILO_RIVAL;

  return (
    <div
      onClick={onClick}
      className={`group relative w-full aspect-square rounded-full overflow-hidden border-2 ${borde} ${fondo} shadow-xl shadow-black/50 flex items-center justify-center transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer`}
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
