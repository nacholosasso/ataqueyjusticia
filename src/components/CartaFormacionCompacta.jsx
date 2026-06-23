import { memo } from 'react';
import { calcularOVR, obtenerEstiloCarta, FOTO_FALLBACK } from '../utils/cartaEstilos';
import IndicadorForma from './IndicadorForma';

function StatCompacta({ valor, label, texto, acento }) {
  return (
    <div className="flex flex-col items-center justify-center leading-none">
      <span className={`font-display text-[11px] sm:text-sm lg:text-base ${texto}`}>{valor}</span>
      <span className={`text-[6px] sm:text-[7px] lg:text-[8px] font-bold tracking-wide ${acento}`}>{label}</span>
    </div>
  );
}

function CartaFormacionCompacta({ jugador, mostrarStats = false, onClick }) {
  const { nombre, dorsal = '-', posAbrev = '-', fotoURL = '', atributos = {}, mediaForzada, forma = 'normal' } = jugador;
  const ovr = calcularOVR(atributos, mediaForzada);
  const { fondo, borde, texto, acento, brillo } = obtenerEstiloCarta(ovr);
  const { rit = 0, tir = 0, pas = 0, reg = 0, def = 0, fis = 0 } = atributos;

  return (
    <div
      onClick={onClick}
      className={`group relative w-full overflow-hidden ${fondo} border-2 ${borde} ${brillo} rounded-xl flex flex-col items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 shadow-xl shadow-black/50 transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer`}
    >
      {/* Brillo al pasar el mouse */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg] pointer-events-none z-20" />

      {/* Encabezado: rating/posición a la izquierda, escudo/dorsal a la derecha */}
      <div className="flex items-start justify-between w-full leading-none">
        <div className="flex flex-col items-start">
          <span className={`font-display text-lg sm:text-xl lg:text-2xl ${texto}`}>{ovr}</span>
          <div className="flex items-center gap-1">
            <span className={`font-display text-[8px] sm:text-[9px] lg:text-[10px] tracking-widest ${acento}`}>{posAbrev}</span>
            <IndicadorForma forma={forma} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <img src="/escudo.jpg" alt="Escudo" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-white/30" />
          <span className={`text-[9px] sm:text-[10px] font-bold ${texto}`}>#{dorsal}</span>
        </div>
      </div>

      {/* Foto */}
      <div className={`w-[46%] aspect-square rounded-full border-2 ${borde} overflow-hidden bg-black/10 mt-1 mb-0.5`}>
        <img
          className="w-full h-full object-cover"
          src={fotoURL || FOTO_FALLBACK}
          alt={`Foto de ${nombre}`}
          onError={(e) => { e.target.src = FOTO_FALLBACK; }}
        />
      </div>

      {/* Nombre */}
      <span className={`w-full text-center font-display text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-wide ${texto} truncate leading-tight`}>
        {nombre}
      </span>

      {/* Panel de estadísticas (se muestra al tocar la carta) */}
      {mostrarStats && (
        <div
          className={`absolute inset-0 z-30 ${fondo} flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 ${borde} px-1 overflow-hidden`}
        >
          <span className={`font-display text-[8px] sm:text-[9px] uppercase tracking-wide ${texto} truncate w-full text-center leading-tight`}>
            {nombre}
          </span>
          <div className="grid grid-cols-3 gap-x-1 gap-y-0.5 w-full">
            <StatCompacta valor={rit} label="RIT" texto={texto} acento={acento} />
            <StatCompacta valor={tir} label="TIR" texto={texto} acento={acento} />
            <StatCompacta valor={pas} label="PAS" texto={texto} acento={acento} />
            <StatCompacta valor={reg} label="REG" texto={texto} acento={acento} />
            <StatCompacta valor={def} label="DEF" texto={texto} acento={acento} />
            <StatCompacta valor={fis} label="FIS" texto={texto} acento={acento} />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(CartaFormacionCompacta);
