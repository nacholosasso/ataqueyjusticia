import { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';

const NOMBRE_KEY = 'ayj_chat_nombre';

function formatearHora(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { mensajes, cargando, error, enviar } = useChat();
  const [nombre, setNombre] = useState(() => localStorage.getItem(NOMBRE_KEY) || '');
  const [nombreTemp, setNombreTemp] = useState('');
  const [texto, setTexto] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  function guardarNombre(e) {
    e.preventDefault();
    const limpio = nombreTemp.trim().slice(0, 20);
    if (!limpio) return;
    localStorage.setItem(NOMBRE_KEY, limpio);
    setNombre(limpio);
  }

  function handleEnviar(e) {
    e.preventDefault();
    const limpio = texto.trim().slice(0, 300);
    if (!limpio) return;
    enviar(nombre, limpio);
    setTexto('');
  }

  return (
    <div className="w-full flex flex-col">
      <p className="text-center text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mb-1">
        Chat
      </p>

      <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
        <div ref={scrollRef} className="overflow-y-auto p-3 space-y-2 h-48">
          {cargando ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
            </div>
          ) : mensajes.length === 0 ? (
            <p className="text-center text-zinc-600 text-xs py-2">Todavía no hay mensajes.</p>
          ) : (
            mensajes.map((m) => (
              <div key={m.id} className="text-sm leading-snug">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white">{m.nombre}</span>
                  <span className="text-zinc-600 text-[10px]">{formatearHora(m.creado)}</span>
                </div>
                <p className="text-zinc-300 break-words">{m.texto}</p>
              </div>
            ))
          )}
        </div>

        {error && (
          <p className="text-red-400 text-[10px] px-3 py-1 border-t border-zinc-800">{error}</p>
        )}

        {nombre ? (
          <form onSubmit={handleEnviar} className="flex border-t border-zinc-800">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribí un mensaje..."
              maxLength={300}
              className="flex-1 min-w-0 bg-transparent text-white text-sm px-3 py-2 outline-none placeholder:text-zinc-600"
            />
            <button type="submit" className="px-3 text-zinc-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-wider">
              Enviar
            </button>
          </form>
        ) : (
          <form onSubmit={guardarNombre} className="flex border-t border-zinc-800">
            <input
              value={nombreTemp}
              onChange={(e) => setNombreTemp(e.target.value)}
              placeholder="Tu nombre..."
              maxLength={20}
              className="flex-1 min-w-0 bg-transparent text-white text-sm px-3 py-2 outline-none placeholder:text-zinc-600"
            />
            <button type="submit" className="px-3 text-zinc-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-wider">
              Listo
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
