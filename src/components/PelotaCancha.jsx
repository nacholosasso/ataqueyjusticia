import { useDraggable } from '@dnd-kit/core';
import { zIndexFicha } from '../utils/zIndexFicha';
import { modeloAPantalla } from '../utils/posiciones';

export default function PelotaCancha({ pelota, arrastrandoId, fichaAlFrente, orientacion }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: 'pelota' });
  const { x, y } = modeloAPantalla(pelota, orientacion);

  const style = {
    left: `${x}%`,
    top: `${y}%`,
    transform: transform
      ? `translate3d(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px), 0)`
      : 'translate(-50%, -50%)',
    touchAction: 'none',
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      className={`absolute ${zIndexFicha('pelota', arrastrandoId, fichaAlFrente, 'z-25', 'z-40')} w-[6%] aspect-square rounded-full bg-white shadow-lg shadow-black/50 border border-zinc-400`}
      style={{
        ...style,
        backgroundImage:
          'radial-gradient(circle at 30% 30%, rgba(0,0,0,0.15), transparent 40%), repeating-conic-gradient(#0b0b0b 0deg 30deg, transparent 30deg 60deg)',
        backgroundSize: '100% 100%, 60% 60%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      }}
      {...listeners}
      {...attributes}
    />
  );
}
