import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import CartaRival from './CartaRival';
import { CartaRivalCirculo } from './CartaCirculo';
import { zIndexFicha } from '../utils/zIndexFicha';

function RivalArrastrable({ rivalId, numero, onQuitar, circulo }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: rivalId });

  const style = {
    transform: CSS.Translate.toString(transform),
    touchAction: 'none',
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="relative">
      {circulo ? <CartaRivalCirculo numero={numero} /> : <CartaRival numero={numero} />}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onQuitar(rivalId)}
        className="absolute -top-1.5 -right-1.5 z-30 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-900 border border-zinc-500 text-zinc-300 text-[10px] sm:text-xs leading-none flex items-center justify-center hover:bg-red-900 hover:text-red-300"
        aria-label="Quitar rival"
      >
        ×
      </button>
    </div>
  );
}

export default function RivalesCancha({ rivales, onQuitar, circulo = false, arrastrandoId, fichaAlFrente }) {
  return (
    <>
      {Object.entries(rivales).map(([rivalId, { x, y, numero }]) => (
        <div
          key={rivalId}
          className={`absolute ${zIndexFicha(rivalId, arrastrandoId, fichaAlFrente, 'z-10', 'z-20')} ${circulo ? 'w-[10%]' : 'w-[18%]'}`}
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <RivalArrastrable rivalId={rivalId} numero={numero} onQuitar={onQuitar} circulo={circulo} />
        </div>
      ))}
    </>
  );
}
