import { useRef, useState } from 'react';
import { TIPOS_FLECHA, TIPO_FLECHA_DEFAULT, ORDEN_TIPOS_FLECHA } from '../utils/tipoFlecha';

const COLOR_BORRAR = '#dc2626';
const LARGO_MINIMO = 4; // % - distancia mínima para crear una flecha

function clamp(valor) {
  return Math.min(100, Math.max(0, valor));
}

function coordsDesdeEvento(svgEl, evento) {
  const rect = svgEl.getBoundingClientRect();
  return {
    x: clamp(((evento.clientX - rect.left) / rect.width) * 100),
    y: clamp(((evento.clientY - rect.top) / rect.height) * 100),
  };
}

// Trazo en zigzag entre dos puntos, usado para flechas de "conducción".
// Termina exactamente en (x2, y2) para que la punta de flecha se oriente bien.
function pathOndulado(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const largo = Math.hypot(dx, dy) || 1;
  const perpX = -dy / largo;
  const perpY = dx / largo;
  const amplitud = 1.5;
  const segmentos = Math.max(2, Math.round(largo / 6));

  let d = `M ${x1} ${y1}`;
  for (let i = 1; i <= segmentos; i++) {
    const signo = i % 2 === 1 ? 1 : -1;
    const tControl = (i - 0.5) / segmentos;
    const tFin = i / segmentos;
    const ctrlX = x1 + dx * tControl + perpX * amplitud * signo;
    const ctrlY = y1 + dy * tControl + perpY * amplitud * signo;
    const finX = x1 + dx * tFin;
    const finY = y1 + dy * tFin;
    d += ` Q ${ctrlX} ${ctrlY} ${finX} ${finY}`;
  }
  return d;
}

// Trazo visual de una flecha según su tipo: recta, punteada u ondulada.
function TrazoFlecha({ x1, y1, x2, y2, tipo, opacity }) {
  const { color, dasharray } = TIPOS_FLECHA[tipo] ?? TIPOS_FLECHA[TIPO_FLECHA_DEFAULT];
  const comun = {
    stroke: color,
    strokeWidth: 1,
    markerEnd: `url(#punta-flecha-${tipo})`,
    style: { pointerEvents: 'none' },
    opacity,
  };
  if (tipo === 'conduccion') {
    return <path d={pathOndulado(x1, y1, x2, y2)} fill="none" {...comun} />;
  }
  return <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dasharray ?? undefined} {...comun} />;
}

export default function PizarraTactica({ flechas, modoDibujo, tipoSeleccionado, onAgregar, onMover, onEliminar }) {
  const svgRef = useRef(null);
  const [nueva, setNueva] = useState(null);
  const [arrastre, setArrastre] = useState(null);
  const [overrides, setOverrides] = useState({});

  function handlePointerDownFondo(e) {
    if (!modoDibujo || e.target !== svgRef.current) return;
    const { x, y } = coordsDesdeEvento(svgRef.current, e);
    setNueva({ x1: x, y1: y, x2: x, y2: y });
    svgRef.current.setPointerCapture(e.pointerId);
  }

  function iniciarArrastreExtremo(e, flechaId, extremo) {
    if (!modoDibujo) return;
    setArrastre({ id: flechaId, modo: extremo });
    svgRef.current.setPointerCapture(e.pointerId);
  }

  function iniciarArrastreCuerpo(e, flecha) {
    if (!modoDibujo) return;
    const { x, y } = coordsDesdeEvento(svgRef.current, e);
    setArrastre({
      id: flecha.id,
      modo: 'cuerpo',
      inicioX: x,
      inicioY: y,
      orig: { x1: flecha.x1, y1: flecha.y1, x2: flecha.x2, y2: flecha.y2 },
    });
    svgRef.current.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (nueva) {
      const { x, y } = coordsDesdeEvento(svgRef.current, e);
      setNueva((prev) => ({ ...prev, x2: x, y2: y }));
      return;
    }
    if (arrastre) {
      const { x, y } = coordsDesdeEvento(svgRef.current, e);
      let coords;
      if (arrastre.modo === 'extremo1') {
        const f = flechas.find((fl) => fl.id === arrastre.id);
        coords = { x1: x, y1: y, x2: f.x2, y2: f.y2 };
      } else if (arrastre.modo === 'extremo2') {
        const f = flechas.find((fl) => fl.id === arrastre.id);
        coords = { x1: f.x1, y1: f.y1, x2: x, y2: y };
      } else {
        const dx = x - arrastre.inicioX;
        const dy = y - arrastre.inicioY;
        coords = {
          x1: clamp(arrastre.orig.x1 + dx),
          y1: clamp(arrastre.orig.y1 + dy),
          x2: clamp(arrastre.orig.x2 + dx),
          y2: clamp(arrastre.orig.y2 + dy),
        };
      }
      setOverrides((prev) => ({ ...prev, [arrastre.id]: coords }));
    }
  }

  function handlePointerUp() {
    if (nueva) {
      const largo = Math.hypot(nueva.x2 - nueva.x1, nueva.y2 - nueva.y1);
      if (largo >= LARGO_MINIMO) {
        onAgregar({ x1: nueva.x1, y1: nueva.y1, x2: nueva.x2, y2: nueva.y2, tipo: tipoSeleccionado });
      }
      setNueva(null);
      return;
    }
    if (arrastre) {
      const coords = overrides[arrastre.id];
      if (coords) onMover(arrastre.id, coords);
      setArrastre(null);
      setOverrides((prev) => {
        const resto = { ...prev };
        delete resto[arrastre.id];
        return resto;
      });
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`absolute inset-0 w-full h-full z-20 touch-none ${modoDibujo ? 'cursor-crosshair' : ''}`}
      style={{ pointerEvents: modoDibujo ? 'auto' : 'none' }}
      onPointerDown={handlePointerDownFondo}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <defs>
        {ORDEN_TIPOS_FLECHA.map((tipo) => (
          <marker key={tipo} id={`punta-flecha-${tipo}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill={TIPOS_FLECHA[tipo].color} />
          </marker>
        ))}
      </defs>

      {flechas.map((f, index) => {
        const { x1, y1, x2, y2 } = overrides[f.id] ?? f;
        const tipo = f.tipo ?? TIPO_FLECHA_DEFAULT;
        const color = TIPOS_FLECHA[tipo].color;

        // Botón de borrar: pegado al extremo inicial, desplazado hacia un
        // costado de la flecha para no tapar la línea ni la punta.
        const largo = Math.hypot(x2 - x1, y2 - y1) || 1;
        const perpX = -(y2 - y1) / largo;
        const perpY = (x2 - x1) / largo;
        const borrarX = clamp(x1 + perpX * 3.5);
        const borrarY = clamp(y1 + perpY * 3.5);

        const numX = (x1 + x2) / 2;
        const numY = (y1 + y2) / 2;

        return (
          <g key={f.id} className="group">
            <TrazoFlecha x1={x1} y1={y1} x2={x2} y2={y2} tipo={tipo} />

            <circle cx={numX} cy={numY} r={2.2} fill="#09090b" stroke={color} strokeWidth={0.4} style={{ pointerEvents: 'none' }} />
            <text x={numX} y={numY} fill="#fff" fontSize="2.6" textAnchor="middle" dominantBaseline="central" className="font-display" style={{ pointerEvents: 'none' }}>
              {index + 1}
            </text>

            {modoDibujo && (
              <>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="transparent" strokeWidth={5}
                  style={{ cursor: 'move' }}
                  onPointerDown={(e) => iniciarArrastreCuerpo(e, f)}
                />
                <circle
                  cx={x1} cy={y1} r={1.8} fill="#fff" stroke={color} strokeWidth={0.5}
                  style={{ cursor: 'grab' }}
                  onPointerDown={(e) => iniciarArrastreExtremo(e, f.id, 'extremo1')}
                />
                <circle
                  cx={x2} cy={y2} r={1.8} fill="#fff" stroke={color} strokeWidth={0.5}
                  style={{ cursor: 'grab' }}
                  onPointerDown={(e) => iniciarArrastreExtremo(e, f.id, 'extremo2')}
                />
                <g
                  className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150"
                  style={{ cursor: 'pointer' }}
                  onPointerDown={(e) => { e.stopPropagation(); onEliminar(f.id); }}
                >
                  <circle cx={borrarX} cy={borrarY} r={1.2} fill={COLOR_BORRAR} stroke="#fff" strokeWidth={0.25} />
                  <line x1={borrarX - 0.5} y1={borrarY - 0.5} x2={borrarX + 0.5} y2={borrarY + 0.5} stroke="#fff" strokeWidth={0.3} />
                  <line x1={borrarX - 0.5} y1={borrarY + 0.5} x2={borrarX + 0.5} y2={borrarY - 0.5} stroke="#fff" strokeWidth={0.3} />
                </g>
              </>
            )}
          </g>
        );
      })}

      {nueva && (
        <TrazoFlecha x1={nueva.x1} y1={nueva.y1} x2={nueva.x2} y2={nueva.y2} tipo={tipoSeleccionado ?? TIPO_FLECHA_DEFAULT} opacity={0.6} />
      )}
    </svg>
  );
}
