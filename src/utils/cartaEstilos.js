// Cálculo de OVR y estilos de carta estilo FIFA según el rating

export const FOTO_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 112 112'%3E%3Crect width='112' height='112' fill='%2318181b'/%3E%3Ccircle cx='56' cy='40' r='22' fill='%2352525b'/%3E%3Cellipse cx='56' cy='95' rx='35' ry='24' fill='%2352525b'/%3E%3C/svg%3E";

export function calcularOVR(atributos = {}, mediaForzada = null) {
  if (mediaForzada) return mediaForzada;
  const valores = Object.values(atributos);
  if (valores.length === 0) return 0;
  const suma = valores.reduce((acc, val) => acc + (Number(val) || 0), 0);
  return Math.round(suma / valores.length);
}

const ESTILOS_CARTA = {
  especial: {
    nombre: 'Especial',
    fondo: 'bg-gradient-to-b from-fuchsia-500 via-purple-600 to-indigo-800',
    borde: 'border-fuchsia-300',
    texto: 'text-white',
    acento: 'text-fuchsia-200',
    brillo: 'shadow-[0_0_22px_rgba(217,70,239,0.55)] ring-2 ring-fuchsia-300/70',
  },
  oro: {
    nombre: 'Oro',
    fondo: 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600',
    borde: 'border-yellow-100',
    texto: 'text-zinc-900',
    acento: 'text-amber-900',
    brillo: '',
  },
  plata: {
    nombre: 'Plata',
    fondo: 'bg-gradient-to-b from-zinc-200 via-zinc-300 to-zinc-500',
    borde: 'border-zinc-100',
    texto: 'text-zinc-900',
    acento: 'text-zinc-700',
    brillo: '',
  },
  bronce: {
    nombre: 'Bronce',
    fondo: 'bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950',
    borde: 'border-amber-500',
    texto: 'text-amber-50',
    acento: 'text-amber-300',
    brillo: '',
  },
  rival: {
    nombre: 'Rival',
    fondo: 'bg-gradient-to-b from-zinc-500 via-zinc-600 to-zinc-800',
    borde: 'border-zinc-400',
    texto: 'text-zinc-100',
    acento: 'text-zinc-300',
    brillo: '',
  },
};

export const ESTILO_RIVAL = ESTILOS_CARTA.rival;

export function obtenerEstiloCarta(ovr) {
  if (ovr >= 90) return ESTILOS_CARTA.especial;
  if (ovr >= 75) return ESTILOS_CARTA.oro;
  if (ovr >= 65) return ESTILOS_CARTA.plata;
  return ESTILOS_CARTA.bronce;
}
