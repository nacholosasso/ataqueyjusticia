const SECCIONES = [
  { id: 'inicio', label: 'Inicio', disponible: true },
];

export default function Navbar({ activeSection, onChangeSection }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto scrollbar-none">
          {SECCIONES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onChangeSection(id)}
              aria-current={activeSection === id ? 'page' : undefined}
              className={`
                flex-shrink-0 px-4 py-4 text-sm font-semibold uppercase tracking-wider
                border-b-2 transition-colors duration-200 cursor-pointer
                ${activeSection === id
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
