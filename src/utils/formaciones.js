// Presets de formación para fútbol 8 (1 arquero + 7 jugadores de campo).
// Cada preset es un arreglo de 8 coordenadas {x,y} (% 0-100), ordenadas de
// adelante (DEL) hacia atrás (ARQ). Al aplicar un preset, los jugadores que
// estén en la cancha (ordenados por su y actual) y luego los de la banca se
// asignan en ese mismo orden a estas coordenadas.
export const FORMACIONES = {
  '3-3-1': [
    { x: 50, y: 15 },
    { x: 25, y: 40 }, { x: 50, y: 40 }, { x: 75, y: 40 },
    { x: 25, y: 65 }, { x: 50, y: 65 }, { x: 75, y: 65 },
    { x: 50, y: 88 },
  ],
  '2-3-2': [
    { x: 25, y: 15 }, { x: 75, y: 15 },
    { x: 25, y: 40 }, { x: 50, y: 40 }, { x: 75, y: 40 },
    { x: 25, y: 65 }, { x: 75, y: 65 },
    { x: 50, y: 88 },
  ],
  '3-2-2': [
    { x: 25, y: 15 }, { x: 75, y: 15 },
    { x: 25, y: 40 }, { x: 75, y: 40 },
    { x: 25, y: 65 }, { x: 50, y: 65 }, { x: 75, y: 65 },
    { x: 50, y: 88 },
  ],
  '2-2-3': [
    { x: 25, y: 15 }, { x: 50, y: 15 }, { x: 75, y: 15 },
    { x: 25, y: 40 }, { x: 75, y: 40 },
    { x: 25, y: 65 }, { x: 75, y: 65 },
    { x: 50, y: 88 },
  ],
  '2-4-1': [
    { x: 50, y: 15 },
    { x: 12, y: 40 }, { x: 37, y: 40 }, { x: 63, y: 40 }, { x: 88, y: 40 },
    { x: 25, y: 65 }, { x: 75, y: 65 },
    { x: 50, y: 88 },
  ],
};

export const TIPOS_FORMACION = Object.keys(FORMACIONES);
