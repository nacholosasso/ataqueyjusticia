import { useDroppable } from '@dnd-kit/core';
import { JugadorArrastrable } from './Formacion';
import { zIndexFicha } from '../utils/zIndexFicha';

function JugadorEnCancha({ jugador, x, y, circulo, zIndex }) {
  const { setNodeRef, isOver } = useDroppable({ id: jugador.id });

  return (
    <div
      ref={setNodeRef}
      className={`absolute ${zIndex} ${circulo ? 'w-[10%]' : 'w-[18%]'} ${isOver ? 'ring-2 ring-cyan-400 rounded-xl' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <JugadorArrastrable jugador={jugador} compacta circulo={circulo} />
    </div>
  );
}

export default function JugadoresCancha({ posiciones, buscarJugador, circulo = false, arrastrandoId, fichaAlFrente }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'cancha' });

  return (
    <div ref={setNodeRef} className={`absolute inset-0 ${isOver ? 'bg-white/5' : ''}`}>
      {Object.entries(posiciones).map(([jugadorId, { x, y }]) => {
        const jugador = buscarJugador(jugadorId);
        if (!jugador) return null;
        return (
          <JugadorEnCancha
            key={jugadorId}
            jugador={jugador}
            x={x}
            y={y}
            circulo={circulo}
            zIndex={zIndexFicha(jugadorId, arrastrandoId, fichaAlFrente, 'z-30', 'z-40')}
          />
        );
      })}
    </div>
  );
}
