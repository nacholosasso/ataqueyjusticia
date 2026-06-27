import { useEffect, useRef, useState } from 'react';
import { TIPOS_FLECHA, TIPO_FLECHA_DEFAULT, ORDEN_TIPOS_FLECHA } from '../utils/tipoFlecha';

const COLOR_BORRAR = '#dc2626';
const LARGO_MINIMO = 4; // % - distancia mínima para crear una flecha
const UMBRAL_CLIC_TEXTO = 1.5; // % - por debajo de esto, un gesto sobre un texto se trata como clic (editar) y no como arrastre (mover)
const MAX_LARGO_TEXTO = 60; // mismo límite que valida firestore.rules para `anotaciones.texto`
const ESCALA_MIN = 0.6;
const ESCALA_MAX = 2.5;
const COLORES_TEXTO = ['#ffffff', '#22d3ee', '#a78bfa', '#fbbf24', '#4ade80']; // misma whitelist que firestore.rules para `anotaciones.color`

function clamp(valor) {
  return Math.min(100, Math.max(0, valor));
}

function clampEscala(valor) {
  return Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, valor));
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

// Botón de borrar (círculo rojo con X), reutilizado por flechas y anotaciones.
function BotonBorrar({ x, y, onPointerDown }) {
  return (
    <g style={{ cursor: 'pointer' }} onPointerDown={onPointerDown}>
      <circle cx={x} cy={y} r={2} fill={COLOR_BORRAR} stroke="#fff" strokeWidth={0.3} />
      <line x1={x - 0.8} y1={y - 0.8} x2={x + 0.8} y2={y + 0.8} stroke="#fff" strokeWidth={0.4} strokeLinecap="round" />
      <line x1={x - 0.8} y1={y + 0.8} x2={x + 0.8} y2={y - 0.8} stroke="#fff" strokeWidth={0.4} strokeLinecap="round" />
    </g>
  );
}

// Handle de redimensionar (círculo celeste con grip diagonal), para agrandar
// o achicar una anotación de texto arrastrándolo.
function BotonRedimensionar({ x, y, onPointerDown }) {
  return (
    <g style={{ cursor: 'nwse-resize' }} onPointerDown={onPointerDown}>
      <circle cx={x} cy={y} r={2} fill="#09090b" stroke="#22d3ee" strokeWidth={0.4} />
      <line x1={x - 0.9} y1={y + 0.2} x2={x + 0.2} y2={y - 0.9} stroke="#22d3ee" strokeWidth={0.4} strokeLinecap="round" />
      <line x1={x - 0.2} y1={y + 0.9} x2={x + 0.9} y2={y - 0.2} stroke="#22d3ee" strokeWidth={0.4} strokeLinecap="round" />
    </g>
  );
}

export default function PizarraTactica({
  flechas,
  anotaciones,
  herramienta,
  onAgregar,
  onMover,
  onEliminar,
  onAgregarTexto,
  onMoverTexto,
  onRedimensionarTexto,
  onEditarTexto,
  onEliminarTexto,
}) {
  // La herramienta "mover" es modo lectura para creación: no crea flechas ni
  // anotaciones nuevas al tocar la cancha vacía. Mover/editar lo que ya existe
  // (flechas, anotaciones, su tamaño) funciona siempre, sin importar la herramienta.
  const puedeCrear = herramienta !== 'mover';
  const svgRef = useRef(null);
  const [nueva, setNueva] = useState(null);
  const [arrastre, setArrastre] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [seleccionada, setSeleccionada] = useState(null); // { tipo: 'flecha' | 'texto', id }
  // Edición inline de anotaciones: id null = creando una nueva en (x, y); id existente = editando esa anotación.
  const [editor, setEditor] = useState(null); // { id: string | null, x, y, valor, original }
  // Posición tocada con la herramienta "texto", a la espera del pointerup para
  // recién ahí abrir el editor: si el foco (y el teclado en celulares) se
  // dispara desde el pointerdown, el navegador no lo considera un gesto de
  // usuario "completo" y el teclado virtual no aparece.
  const [pendienteTexto, setPendienteTexto] = useState(null);

  function confirmarEditor() {
    setEditor((actual) => {
      if (!actual) return null;
      const limpio = actual.valor.trim().slice(0, MAX_LARGO_TEXTO);
      if (limpio === '') {
        if (actual.id) onEliminarTexto(actual.id);
      } else if (actual.id === null) {
        onAgregarTexto({ x: actual.x, y: actual.y, texto: limpio, color: actual.color });
      } else if (limpio !== actual.original || actual.color !== actual.colorOriginal) {
        onEditarTexto(actual.id, { texto: limpio, color: actual.color });
      }
      return null;
    });
  }

  // Si el elemento seleccionado se borra desde otro lado (p. ej. "Vaciar
  // cancha"), soltamos la selección para no dejar un id colgado.
  useEffect(() => {
    if (!seleccionada) return;
    const existe =
      seleccionada.tipo === 'flecha'
        ? flechas.some((f) => f.id === seleccionada.id)
        : anotaciones.some((a) => a.id === seleccionada.id);
    if (!existe) setSeleccionada(null);
  }, [flechas, anotaciones, seleccionada]);

  // Tecla Supr/Backspace borra la flecha o anotación seleccionada, salvo que
  // el foco esté en un campo de texto (chat, nombre de pizarra, etc.).
  useEffect(() => {
    function onKeyDown(e) {
      if (!seleccionada) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      e.preventDefault();
      if (seleccionada.tipo === 'flecha') onEliminar(seleccionada.id);
      else onEliminarTexto(seleccionada.id);
      setSeleccionada(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [seleccionada, onEliminar, onEliminarTexto]);

  function handlePointerDownFondo(e) {
    if (e.target !== svgRef.current) return;
    setSeleccionada(null);
    if (!puedeCrear) return;
    const { x, y } = coordsDesdeEvento(svgRef.current, e);

    if (herramienta === 'texto') {
      setPendienteTexto({ x, y });
      return;
    }

    setNueva({ x1: x, y1: y, x2: x, y2: y });
    svgRef.current.setPointerCapture(e.pointerId);
  }

  function iniciarArrastreExtremo(e, flechaId, extremo) {
    setArrastre({ id: flechaId, modo: extremo });
    svgRef.current.setPointerCapture(e.pointerId);
  }

  function iniciarArrastreCuerpo(e, flecha) {
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

  function iniciarInteraccionTexto(e, anotacion) {
    setSeleccionada({ tipo: 'texto', id: anotacion.id });
    const { x, y } = coordsDesdeEvento(svgRef.current, e);
    setArrastre({
      id: anotacion.id,
      modo: 'texto',
      inicioX: x,
      inicioY: y,
      orig: { x: anotacion.x, y: anotacion.y },
      textoActual: anotacion.texto,
      colorActual: anotacion.color ?? COLORES_TEXTO[0],
    });
    svgRef.current.setPointerCapture(e.pointerId);
  }

  // Redimensionar una anotación: la escala crece o se achica según qué tan
  // lejos del centro del cuadro de texto se arrastra el handle, en proporción
  // a la distancia inicial al tocarlo (arrastrar hacia afuera agranda, hacia
  // el centro achica).
  function iniciarRedimensionTexto(e, anotacion) {
    const { x, y } = coordsDesdeEvento(svgRef.current, e);
    const distInicial = Math.hypot(x - anotacion.x, y - anotacion.y) || 1;
    setArrastre({
      id: anotacion.id,
      modo: 'resize-texto',
      centro: { x: anotacion.x, y: anotacion.y },
      distInicial,
      escalaOrig: anotacion.escala ?? 1,
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
      } else if (arrastre.modo === 'texto') {
        const dx = x - arrastre.inicioX;
        const dy = y - arrastre.inicioY;
        coords = { x: clamp(arrastre.orig.x + dx), y: clamp(arrastre.orig.y + dy) };
      } else if (arrastre.modo === 'resize-texto') {
        const distActual = Math.hypot(x - arrastre.centro.x, y - arrastre.centro.y);
        coords = { escala: clampEscala(arrastre.escalaOrig * (distActual / arrastre.distInicial)) };
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
      setOverrides((prev) => ({ ...prev, [arrastre.id]: { ...prev[arrastre.id], ...coords } }));
    }
  }

  function handlePointerUp() {
    if (pendienteTexto) {
      setEditor({
        id: null,
        x: pendienteTexto.x,
        y: pendienteTexto.y,
        valor: '',
        original: '',
        color: COLORES_TEXTO[0],
        colorOriginal: COLORES_TEXTO[0],
      });
      setPendienteTexto(null);
      return;
    }
    if (nueva) {
      const largo = Math.hypot(nueva.x2 - nueva.x1, nueva.y2 - nueva.y1);
      if (largo >= LARGO_MINIMO) {
        onAgregar({ x1: nueva.x1, y1: nueva.y1, x2: nueva.x2, y2: nueva.y2, tipo: herramienta });
      }
      setNueva(null);
      return;
    }
    if (arrastre) {
      if (arrastre.modo === 'texto') {
        const coords = overrides[arrastre.id] ?? arrastre.orig;
        const distancia = Math.hypot(coords.x - arrastre.orig.x, coords.y - arrastre.orig.y);
        if (distancia > UMBRAL_CLIC_TEXTO) {
          onMoverTexto(arrastre.id, coords);
        } else {
          setEditor({
            id: arrastre.id,
            x: arrastre.orig.x,
            y: arrastre.orig.y,
            valor: arrastre.textoActual ?? '',
            original: arrastre.textoActual ?? '',
            color: arrastre.colorActual ?? COLORES_TEXTO[0],
            colorOriginal: arrastre.colorActual ?? COLORES_TEXTO[0],
          });
        }
      } else if (arrastre.modo === 'resize-texto') {
        const escala = overrides[arrastre.id]?.escala;
        if (escala != null) onRedimensionarTexto(arrastre.id, escala);
      } else {
        const coords = overrides[arrastre.id];
        if (coords) onMover(arrastre.id, coords);
      }
      setArrastre(null);
      setOverrides((prev) => {
        const resto = { ...prev };
        delete resto[arrastre.id];
        return resto;
      });
    }
  }

  return (
    <>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={`absolute inset-0 w-full h-full z-0 touch-none ${puedeCrear ? 'cursor-crosshair' : ''}`}
        style={{ pointerEvents: 'auto' }}
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
          const estaSeleccionada = seleccionada?.tipo === 'flecha' && seleccionada.id === f.id;

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
            <g key={f.id}>
              {estaSeleccionada && (
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#22d3ee" strokeWidth={2.4} strokeLinecap="round" opacity={0.45}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              <TrazoFlecha x1={x1} y1={y1} x2={x2} y2={y2} tipo={tipo} />

              <circle cx={numX} cy={numY} r={2.2} fill="#09090b" stroke={color} strokeWidth={0.4} style={{ pointerEvents: 'none' }} />
              <text x={numX} y={numY} fill="#fff" fontSize="2.6" textAnchor="middle" dominantBaseline="central" className="font-display" style={{ pointerEvents: 'none' }}>
                {index + 1}
              </text>

              {/* Área de clic: siempre selecciona y permite mover, sin importar la herramienta activa. */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="transparent" strokeWidth={5}
                style={{ cursor: 'move' }}
                onPointerDown={(e) => {
                  setSeleccionada({ tipo: 'flecha', id: f.id });
                  iniciarArrastreCuerpo(e, f);
                }}
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

              {estaSeleccionada && (
                <BotonBorrar
                  x={borrarX}
                  y={borrarY}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onEliminar(f.id);
                    setSeleccionada(null);
                  }}
                />
              )}
            </g>
          );
        })}

        {anotaciones.map((a) => {
          if (editor?.id === a.id) return null;
          const datos = overrides[a.id] ?? {};
          const x = datos.x ?? a.x;
          const y = datos.y ?? a.y;
          const escala = clampEscala(datos.escala ?? a.escala ?? 1);
          const estaSeleccionada = seleccionada?.tipo === 'texto' && seleccionada.id === a.id;
          const ancho = Math.max(8, a.texto.length * 1.7 + 4) * escala;
          const alto = 4.6 * escala;
          const borrarX = clamp(x + ancho / 2 + 1.5);
          const borrarY = clamp(y - alto / 2 - 1);
          const redimensionarX = clamp(x + ancho / 2 + 1.5);
          const redimensionarY = clamp(y + alto / 2 + 1);

          return (
            <g key={a.id}>
              {estaSeleccionada && (
                <rect
                  x={x - ancho / 2 - 0.7} y={y - alto / 2 - 0.7} width={ancho + 1.4} height={alto + 1.4} rx={alto / 2 + 0.7}
                  fill="none" stroke="#22d3ee" strokeWidth={0.5} opacity={0.6}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              <rect
                x={x - ancho / 2} y={y - alto / 2} width={ancho} height={alto} rx={alto / 2}
                fill="#09090b" stroke="#e4e4e7" strokeWidth={0.4}
                style={{ pointerEvents: 'none' }}
              />
              <text x={x} y={y} fill={a.color ?? '#fff'} fontSize={2.6 * escala} textAnchor="middle" dominantBaseline="central" className="font-display" style={{ pointerEvents: 'none' }}>
                {a.texto}
              </text>

              <rect
                x={x - ancho / 2} y={y - alto / 2} width={ancho} height={alto} rx={alto / 2}
                fill="transparent"
                style={{ cursor: 'move' }}
                onPointerDown={(e) => iniciarInteraccionTexto(e, a)}
              />

              {estaSeleccionada && (
                <>
                  <BotonBorrar
                    x={borrarX}
                    y={borrarY}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onEliminarTexto(a.id);
                      setSeleccionada(null);
                    }}
                  />
                  <BotonRedimensionar
                    x={redimensionarX}
                    y={redimensionarY}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      iniciarRedimensionTexto(e, a);
                    }}
                  />
                </>
              )}
            </g>
          );
        })}

        {nueva && (
          <TrazoFlecha x1={nueva.x1} y1={nueva.y1} x2={nueva.x2} y2={nueva.y2} tipo={herramienta ?? TIPO_FLECHA_DEFAULT} opacity={0.6} />
        )}
      </svg>

      {editor && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5"
          style={{ left: `${editor.x}%`, top: `${editor.y}%` }}
        >
          <input
            key={editor.id ?? 'nueva'}
            autoFocus
            value={editor.valor}
            maxLength={MAX_LARGO_TEXTO}
            placeholder="Anotación..."
            onChange={(e) => setEditor((actual) => ({ ...actual, valor: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmarEditor();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setEditor(null);
              }
            }}
            onBlur={confirmarEditor}
            className="px-2 py-0.5 rounded-full text-xs text-center bg-zinc-950 border border-zinc-300 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
            style={{ width: `${Math.max(8, editor.valor.length + 2)}ch`, color: editor.color }}
          />
          <div className="flex gap-1 px-1.5 py-1 rounded-full bg-zinc-950 border border-zinc-700">
            {COLORES_TEXTO.map((c) => (
              <button
                key={c}
                type="button"
                // evita que el botón le robe el foco al input: si lo perdiera, el onBlur
                // dispararía confirmarEditor() y cerraría el editor antes de registrar el clic
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => setEditor((actual) => (actual ? { ...actual, color: c } : actual))}
                className={`w-3.5 h-3.5 rounded-full border-2 ${editor.color === c ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
