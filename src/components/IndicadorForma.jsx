const COLORES_FORMA = {
  alza: 'text-emerald-400',
  normal: 'text-amber-400',
  baja: 'text-red-400',
};

export default function IndicadorForma({ forma = 'normal' }) {
  const color = COLORES_FORMA[forma] ?? COLORES_FORMA.normal;

  return (
    <svg viewBox="0 0 12 12" className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${color}`} fill="currentColor" aria-hidden="true">
      {forma === 'alza' && <path d="M6 1 L11 9 H1 Z" />}
      {forma === 'baja' && <path d="M6 11 L1 3 H11 Z" />}
      {forma !== 'alza' && forma !== 'baja' && <rect x="1" y="5" width="10" height="2" rx="1" />}
    </svg>
  );
}
