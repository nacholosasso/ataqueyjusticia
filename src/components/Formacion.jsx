import { useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toPng } from 'html-to-image';
import { usePlantel } from '../hooks/usePlantel';
import { useFormacion } from '../hooks/useFormacion';
import { useTactica } from '../hooks/useTactica';
import { useJugadas } from '../hooks/useJugadas';
import { ROL_ESTILOS } from '../utils/posicionColores';
import { TIPOS_FORMACION } from '../utils/formaciones';
import { TIPOS_FLECHA, TIPO_FLECHA_DEFAULT, ORDEN_TIPOS_FLECHA } from '../utils/tipoFlecha';
import { coordsDesdeRect } from '../utils/posiciones';
import CartaFormacion from './CartaFormacion';
import CartaFormacionCompacta from './CartaFormacionCompacta';
import { CartaCirculo, CartaRivalCirculo } from './CartaCirculo';
import CartaRival from './CartaRival';
import PizarraTactica from './PizarraTactica';
import JugadoresCancha from './JugadoresCancha';
import RivalesCancha from './RivalesCancha';
import PelotaCancha from './PelotaCancha';
import Chat from './Chat';

const MAX_RIVALES = 8;

export function JugadorArrastrable({ jugador, compacta = false, circulo = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: jugador.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    touchAction: 'none',
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {circulo ? (
        <CartaCirculo jugador={jugador} />
      ) : compacta ? (
        <CartaFormacionCompacta jugador={jugador} />
      ) : (
        <CartaFormacion jugador={jugador} />
      )}
    </div>
  );
}

// Mini muestra del trazo de un tipo de flecha (línea/ondulada + color),
// para que cada botón también sirva de referencia visual.
function MuestraFlecha({ tipo }) {
  const { color, dasharray } = TIPOS_FLECHA[tipo];
  return (
    <svg viewBox="0 0 24 10" className="w-6 h-2.5 flex-shrink-0" aria-hidden="true">
      {tipo === 'conduccion' ? (
        <path d="M1,5 Q4,1 7,5 T13,5 T19,5 T24,5" stroke={color} strokeWidth={1.5} fill="none" />
      ) : (
        <line x1="1" y1="5" x2="23" y2="5" stroke={color} strokeWidth={1.5} strokeDasharray={dasharray ?? undefined} />
      )}
    </svg>
  );
}

function Banca({ jugadores }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'banca' });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-zinc-800 p-3 transition-colors flex flex-wrap sm:flex-col gap-3 justify-center sm:justify-start ${isOver ? 'bg-white/5' : ''}`}
    >
      {jugadores.length === 0 ? (
        <p className="text-center text-zinc-600 text-xs py-2 w-full">No hay más jugadores en la banca.</p>
      ) : (
        jugadores.map((jugador) => (
          <div key={jugador.id} className="w-24 sm:w-28 lg:w-32 flex-shrink-0">
            <JugadorArrastrable jugador={jugador} />
          </div>
        ))
      )}
    </div>
  );
}

export default function Formacion() {
  const { jugadores, cargando: cargandoPlantel, error: errorPlantel } = usePlantel();
  const {
    posiciones,
    tipo,
    pelota,
    rivales,
    cargando: cargandoFormacion,
    error,
    moverJugador,
    quitarJugador,
    intercambiarJugadores,
    aplicarFormacion,
    moverPelota,
    agregarRival,
    moverRival,
    quitarRival,
    vaciarCancha,
    zTop,
  } = useFormacion();
  const { flechas, agregar: agregarFlecha, mover: moverFlecha, eliminar: eliminarFlecha, limpiar: limpiarFlechas } = useTactica();
  const { jugadas, cargando: cargandoJugadas, error: errorJugadas, guardar: guardarJugada, cargar: cargarJugada, actualizar: actualizarJugada, eliminar: eliminarJugada } = useJugadas();
  const [jugadorActivo, setJugadorActivo] = useState(null);
  const [pelotaActiva, setPelotaActiva] = useState(false);
  const [rivalActivo, setRivalActivo] = useState(null);
  const [arrastrandoId, setArrastrandoId] = useState(null);
  const [modoDibujo, setModoDibujo] = useState(false);
  const [modoCirculo, setModoCirculo] = useState(true);
  const [tipoFlecha, setTipoFlecha] = useState(TIPO_FLECHA_DEFAULT);
  const [bancaAbierta, setBancaAbierta] = useState(true);
  const [mostrarGuardarJugada, setMostrarGuardarJugada] = useState(false);
  const [nombreJugada, setNombreJugada] = useState('');
  const [jugadaSeleccionada, setJugadaSeleccionada] = useState('');
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState(null);
  const canchaRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  if (cargandoPlantel || cargandoFormacion) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const buscarJugador = (id) => jugadores.find((j) => j.id === id) ?? null;
  const jugadoresBanca = jugadores.filter((j) => !posiciones[j.id]);

  function tableroActual() {
    return {
      tipo,
      posiciones,
      pelota,
      rivales,
      flechas: flechas.map(({ x1, y1, x2, y2, tipo: tipoFlechaGuardada }) => ({ x1, y1, x2, y2, tipo: tipoFlechaGuardada })),
    };
  }

  function handleGuardarJugada() {
    const nombre = nombreJugada.trim();
    if (!nombre) return;
    guardarJugada(nombre, tableroActual());
    setNombreJugada('');
    setMostrarGuardarJugada(false);
  }

  function handleSeleccionarJugada(id) {
    setJugadaSeleccionada(id);
    const jugada = jugadas.find((j) => j.id === id);
    if (jugada) cargarJugada(jugada.tablero);
  }

  function handleActualizarJugada() {
    const jugada = jugadas.find((j) => j.id === jugadaSeleccionada);
    if (!jugada) return;
    actualizarJugada(jugada.id, tableroActual());
  }

  function handleBorrarJugada() {
    const jugada = jugadas.find((j) => j.id === jugadaSeleccionada);
    if (!jugada) return;
    if (!window.confirm(`¿Borrar la pizarra "${jugada.nombre}"? Esta acción no se puede deshacer.`)) return;
    eliminarJugada(jugada.id);
    setJugadaSeleccionada('');
  }

  function handleVaciarCancha() {
    vaciarCancha();
    if (flechas.length > 0) limpiarFlechas();
  }

  async function handleExportarImagen() {
    if (!canchaRef.current || exportando) return;
    setExportando(true);
    setErrorExportar(null);
    try {
      const dataUrl = await toPng(canchaRef.current, { pixelRatio: 2, cacheBust: true });

      if (navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const archivo = new File([blob], 'pizarra.png', { type: 'image/png' });
        if (navigator.canShare({ files: [archivo] })) {
          await navigator.share({ files: [archivo], title: 'Pizarra' });
          return;
        }
      }

      const link = document.createElement('a');
      link.download = 'pizarra.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      if (err.name !== 'AbortError') setErrorExportar('No se pudo generar la imagen de la cancha.');
    } finally {
      setExportando(false);
    }
  }

  function handleDragStart(event) {
    const id = String(event.active.id);
    setArrastrandoId(id);
    if (id === 'pelota') {
      setPelotaActiva(true);
      return;
    }
    if (rivales[id]) {
      setRivalActivo(rivales[id]);
      return;
    }
    setJugadorActivo(buscarJugador(id));
  }

  function handleDragEnd(event) {
    setJugadorActivo(null);
    setPelotaActiva(false);
    setRivalActivo(null);
    setArrastrandoId(null);
    const { active, over } = event;
    if (!over) return;

    if (active.id === 'pelota') {
      if (over.id === 'cancha') {
        const coords = coordsDesdeRect(active.rect.current.translated, canchaRef.current.getBoundingClientRect());
        moverPelota(coords);
      }
      return;
    }

    const id = String(active.id);

    if (rivales[id]) {
      if (over.id === 'cancha') {
        const coords = coordsDesdeRect(active.rect.current.translated, canchaRef.current.getBoundingClientRect());
        moverRival(id, coords);
      }
      return;
    }

    if (over.id === 'banca') {
      if (posiciones[id]) quitarJugador(id);
      return;
    }
    if (over.id === 'cancha') {
      const coords = coordsDesdeRect(active.rect.current.translated, canchaRef.current.getBoundingClientRect());
      moverJugador(id, coords);
      return;
    }
    // Soltado sobre otro jugador ya ubicado: se intercambian de lugar.
    if (over.id !== id && posiciones[String(over.id)]) {
      intercambiarJugadores(id, String(over.id));
    }
  }

  return (
    <div className="w-full max-w-md sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-7xl 2xl:max-w-screen-2xl mx-auto">
      <p className="text-center text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mb-3">
        Formación{tipo ? ` · ${tipo}` : ''}
      </p>

      <div className="flex justify-center flex-wrap gap-2 mb-3">
        {TIPOS_FORMACION.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => aplicarFormacion(t, jugadores)}
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors ${
              t === tipo
                ? 'bg-white text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex justify-center flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setModoDibujo((v) => !v)}
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors ${
            modoDibujo
              ? 'bg-cyan-400 text-zinc-900'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
        >
          Dibujar flechas
        </button>
        {modoDibujo &&
          ORDEN_TIPOS_FLECHA.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setTipoFlecha(tipo)}
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5 ${
                tipo === tipoFlecha
                  ? 'bg-white text-zinc-900'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
              style={tipo === tipoFlecha ? { boxShadow: `inset 0 0 0 2px ${TIPOS_FLECHA[tipo].color}` } : undefined}
            >
              <MuestraFlecha tipo={tipo} />
              {TIPOS_FLECHA[tipo].etiqueta}
            </button>
          ))}
        <button
          type="button"
          onClick={() => setModoCirculo((v) => !v)}
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors ${
            modoCirculo
              ? 'bg-cyan-400 text-zinc-900'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
        >
          {modoCirculo ? 'Vista tarjeta' : 'Vista círculo'}
        </button>
        <button
          type="button"
          onClick={agregarRival}
          disabled={Object.keys(rivales).length >= MAX_RIVALES}
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors ${
            Object.keys(rivales).length >= MAX_RIVALES
              ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
        >
          + Rival
        </button>
        {flechas.length > 0 && (
          <button
            type="button"
            onClick={limpiarFlechas}
            className="px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors bg-zinc-800 text-zinc-400 hover:bg-red-900 hover:text-red-300"
          >
            Limpiar todo
          </button>
        )}
        <button
          type="button"
          onClick={handleVaciarCancha}
          className="px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors bg-zinc-800 text-zinc-400 hover:bg-red-900 hover:text-red-300"
        >
          Vaciar cancha
        </button>
        <button
          type="button"
          onClick={handleExportarImagen}
          disabled={exportando}
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors ${
            exportando
              ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
        >
          {exportando ? 'Generando...' : 'Descargar imagen'}
        </button>
        <button
          type="button"
          onClick={() => setBancaAbierta((v) => !v)}
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors ${
            bancaAbierta
              ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              : 'bg-white text-zinc-900'
          }`}
        >
          {bancaAbierta ? 'Ocultar banca' : 'Mostrar banca'}
        </button>
      </div>

      {/* Leyenda de flechas: tipos y orden de los movimientos (siempre visible) */}
      <div className="flex justify-center flex-wrap items-center gap-x-4 gap-y-1.5 mb-6">
        {ORDEN_TIPOS_FLECHA.map((tipo) => (
          <div key={tipo} className="flex items-center gap-1.5">
            <MuestraFlecha tipo={tipo} />
            <span className="text-zinc-500 text-xs">{TIPOS_FLECHA[tipo].etiqueta}</span>
          </div>
        ))}
        <span className="text-zinc-500 text-xs">①②③ → orden de los movimientos de la jugada</span>
      </div>

      <div className="flex justify-center flex-wrap items-center gap-2 mb-6">
        <span className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mr-1">
          Pizarras
        </span>

        {mostrarGuardarJugada ? (
          <>
            <input
              type="text"
              value={nombreJugada}
              onChange={(e) => setNombreJugada(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGuardarJugada();
                if (e.key === 'Escape') {
                  setNombreJugada('');
                  setMostrarGuardarJugada(false);
                }
              }}
              placeholder="Nombre de la pizarra"
              autoFocus
              className="px-3 py-1 rounded-full text-xs bg-zinc-800 text-zinc-200 placeholder-zinc-500 outline-none focus:ring-2 focus:ring-cyan-400/60 w-40"
            />
            <button
              type="button"
              onClick={handleGuardarJugada}
              disabled={!nombreJugada.trim()}
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors ${
                nombreJugada.trim()
                  ? 'bg-cyan-400 text-zinc-900 hover:bg-cyan-300'
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
              }`}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setNombreJugada('');
                setMostrarGuardarJugada(false);
              }}
              className="px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setMostrarGuardarJugada(true)}
            className="px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          >
            Guardar pizarra
          </button>
        )}

        <select
          value={jugadaSeleccionada}
          onChange={(e) => handleSeleccionarJugada(e.target.value)}
          disabled={cargandoJugadas || jugadas.length === 0}
          className="px-3 py-1 rounded-full text-xs bg-zinc-800 text-zinc-300 outline-none disabled:text-zinc-600 disabled:cursor-not-allowed"
        >
          <option value="">{jugadas.length === 0 ? 'No hay pizarras guardadas' : 'Elegí una pizarra'}</option>
          {jugadas.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleActualizarJugada}
          disabled={!jugadaSeleccionada}
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors ${
            jugadaSeleccionada
              ? 'bg-zinc-800 text-zinc-400 hover:bg-cyan-900 hover:text-cyan-300'
              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
          }`}
        >
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={handleBorrarJugada}
          disabled={!jugadaSeleccionada}
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors ${
            jugadaSeleccionada
              ? 'bg-zinc-800 text-zinc-400 hover:bg-red-900 hover:text-red-300'
              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
          }`}
        >
          Borrar
        </button>
      </div>

      {(error || errorPlantel || errorJugadas || errorExportar) && (
        <div className="mb-4 bg-red-950/40 border border-red-900 rounded-xl p-3 text-center">
          <p className="text-red-300 text-xs font-medium">{error || errorPlantel || errorJugadas || errorExportar}</p>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-center gap-4">

          {/* Cancha (proporción fútbol 8: más corta y ancha que una de 11).
              Ancho fluido (flex-1) con un tope que crece si la banca está
              oculta, para aprovechar el espacio horizontal liberado. */}
          <div
            ref={canchaRef}
            className={`relative rounded-2xl overflow-hidden border border-zinc-700/40 w-full sm:flex-1 aspect-[3/4] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] ${
              bancaAbierta
                ? 'sm:max-w-[440px] md:max-w-[520px] lg:max-w-[640px] xl:max-w-[760px] 2xl:max-w-[880px]'
                : 'sm:max-w-[480px] md:max-w-[600px] lg:max-w-[720px] xl:max-w-[860px] 2xl:max-w-[1000px]'
            }`}
            style={{
              background: 'linear-gradient(180deg, #06321a 0%, #0d5c2e 55%, #1f9b4d 100%)',
            }}
          >
            {/* Franjas de pasto cortado */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.05) 12.5%, rgba(0,0,0,0.08) 12.5%, rgba(0,0,0,0.08) 25%)',
              }}
            />

            {/* Líneas de cancha (fútbol 8) */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 sm:inset-5 border-2 border-white/15 rounded-sm">

                {/* Arcos de esquina */}
                <div className="absolute -top-px -left-px w-3 h-3 sm:w-4 sm:h-4 border-r-2 border-b-2 border-white/15 rounded-br-full" />
                <div className="absolute -top-px -right-px w-3 h-3 sm:w-4 sm:h-4 border-l-2 border-b-2 border-white/15 rounded-bl-full" />
                <div className="absolute -bottom-px -left-px w-3 h-3 sm:w-4 sm:h-4 border-r-2 border-t-2 border-white/15 rounded-tr-full" />
                <div className="absolute -bottom-px -right-px w-3 h-3 sm:w-4 sm:h-4 border-l-2 border-t-2 border-white/15 rounded-tl-full" />

                {/* Línea de medio campo */}
                <div className="absolute left-0 right-0 top-1/2 h-px bg-white/15" />

                {/* Círculo central */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[36%] aspect-square border-2 border-white/15 rounded-full" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/25 rounded-full" />

                {/* Área y arco superior (rival) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[62%] h-[15%] border-2 border-t-0 border-white/15" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[28%] h-[6%] border-2 border-t-0 border-white/15" />
                <div className="absolute left-1/2 top-[12%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/25 rounded-full" />
                <div
                  className="absolute left-1/2 top-[12%] -translate-x-1/2 -translate-y-1/2 w-[24%] aspect-square border-2 border-white/15 rounded-full"
                  style={{ clipPath: 'inset(50% 0 0 0)' }}
                />

                {/* Área y arco inferior (propia, donde se ubica el arquero) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[62%] h-[15%] border-2 border-b-0 border-white/15" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[28%] h-[6%] border-2 border-b-0 border-white/15" />
                <div className="absolute left-1/2 bottom-[12%] -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white/25 rounded-full" />
                <div
                  className="absolute left-1/2 bottom-[12%] -translate-x-1/2 translate-y-1/2 w-[24%] aspect-square border-2 border-white/15 rounded-full"
                  style={{ clipPath: 'inset(0 0 50% 0)' }}
                />
              </div>
            </div>

            {/* Jugadores en sus posiciones libres */}
            <JugadoresCancha
              posiciones={posiciones}
              buscarJugador={buscarJugador}
              circulo={modoCirculo}
              arrastrandoId={arrastrandoId}
              fichaAlFrente={zTop}
            />

            {/* Pelota */}
            <PelotaCancha pelota={pelota} arrastrandoId={arrastrandoId} fichaAlFrente={zTop} />

            {/* Jugadores rivales */}
            <RivalesCancha
              rivales={rivales}
              onQuitar={quitarRival}
              circulo={modoCirculo}
              arrastrandoId={arrastrandoId}
              fichaAlFrente={zTop}
            />

            {/* Pizarra táctica: flechas (lectura siempre, edición en modo dibujo) */}
            <PizarraTactica
              flechas={flechas}
              modoDibujo={modoDibujo}
              tipoSeleccionado={tipoFlecha}
              onAgregar={agregarFlecha}
              onMover={moverFlecha}
              onEliminar={eliminarFlecha}
            />
          </div>

          {/* Banca */}
          {bancaAbierta && (
            <div className="w-full sm:w-36 lg:w-40 xl:w-44 sm:flex-shrink-0">
              <p className="text-center sm:text-left text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-8 sm:mt-0 mb-1">
                Banca
              </p>
              <Banca jugadores={jugadoresBanca} />
            </div>
          )}

        </div>

        <DragOverlay>
          {jugadorActivo ? (
            <div className={modoCirculo ? 'w-12 sm:w-14 lg:w-16' : 'w-20 sm:w-24 lg:w-28'}>
              {modoCirculo ? (
                <CartaCirculo jugador={jugadorActivo} />
              ) : posiciones[jugadorActivo.id] ? (
                <CartaFormacionCompacta jugador={jugadorActivo} />
              ) : (
                <CartaFormacion jugador={jugadorActivo} />
              )}
            </div>
          ) : rivalActivo ? (
            <div className={modoCirculo ? 'w-12 sm:w-14 lg:w-16' : 'w-20 sm:w-24 lg:w-28'}>
              {modoCirculo ? <CartaRivalCirculo numero={rivalActivo.numero} /> : <CartaRival numero={rivalActivo.numero} />}
            </div>
          ) : pelotaActiva ? (
            <div
              className="w-6 h-6 rounded-full bg-white shadow-lg shadow-black/50 border border-zinc-400"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 30% 30%, rgba(0,0,0,0.15), transparent 40%), repeating-conic-gradient(#0b0b0b 0deg 30deg, transparent 30deg 60deg)',
                backgroundSize: '100% 100%, 60% 60%',
                backgroundPosition: 'center, center',
                backgroundRepeat: 'no-repeat, no-repeat',
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Chat: siempre debajo de la cancha */}
      <div className="mt-4 max-w-2xl mx-auto">
        <Chat />
      </div>

      {/* Leyenda */}
      <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {Object.entries(ROL_ESTILOS).map(([rol, { bg }]) => {
          const etiquetas = { ARQ: 'Arquero', DEF: 'Defensa', MED: 'Mediocampista', DEL: 'Delantero' };
          return (
            <div key={rol} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${bg}`} />
              <span className="text-zinc-500 text-xs">{etiquetas[rol]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
