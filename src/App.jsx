import { useState } from 'react';
import Navbar from './components/Navbar';
import Plantel from './pages/Plantel';

const SECCIONES = {
  'inicio': <Plantel />,
};

function App() {
  const [activeSection, setActiveSection] = useState('inicio');

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">

      {/* HEADER */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-zinc-950" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 130% at 50% -10%, rgba(255,255,255,0.07) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 py-3 sm:py-4 px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <img
              src="/escudo.jpg"
              alt="Escudo Ataque y Justicia"
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain rounded-full border border-white/10 shadow-lg select-none flex-shrink-0"
            />
            <h1 className="font-display text-lg sm:text-2xl lg:text-3xl tracking-wide text-white uppercase leading-none">
              Ataque y Justicia
            </h1>
          </div>
        </div>
      </header>

      {/* NAVEGACIÓN */}
      <Navbar activeSection={activeSection} onChangeSection={setActiveSection} />

      {/* CONTENIDO */}
      <main className="flex-1">
        {SECCIONES[activeSection]}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-zinc-600 text-xs font-semibold uppercase tracking-[0.3em]">
          Ataque y Justicia
        </p>
      </footer>

    </div>
  );
}

export default App;
