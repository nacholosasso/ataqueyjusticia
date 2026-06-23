import { memo } from 'react';
import { ESTILO_RIVAL } from '../utils/cartaEstilos';

function CartaRival({ numero, onClick }) {
  const { fondo, borde, texto, acento } = ESTILO_RIVAL;

  return (
    <div onClick={onClick} className={`group relative w-full overflow-hidden ${fondo} border-2 ${borde} rounded-xl flex flex-col items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 shadow-xl shadow-black/50 transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer`}>
      {/* Brillo al pasar el mouse */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg] pointer-events-none z-20" />

      {/* Encabezado: número e indicador "RIV" */}
      <div className="flex flex-col items-start w-full leading-none">
        <span className={`font-display text-lg sm:text-xl lg:text-2xl ${texto}`}>{numero}</span>
        <span className={`font-display text-[8px] sm:text-[9px] lg:text-[10px] tracking-widest ${acento}`}>RIV</span>
      </div>

      {/* Silueta genérica */}
      <div className={`w-[46%] aspect-square rounded-full border-2 ${borde} overflow-hidden bg-black/20 mt-1 mb-0.5 flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className={`w-3/4 h-3/4 ${acento}`} fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7v1H4z" />
        </svg>
      </div>

      {/* Etiqueta */}
      <span className={`w-full text-center font-display text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-wide ${texto} truncate leading-tight`}>
        Rival
      </span>
    </div>
  );
}

export default memo(CartaRival);
