// Clase z-index para una ficha (jugador, rival o pelota) de la cancha: la
// que se está arrastrando va siempre al frente, y la última tocada queda
// por encima del resto de su mismo grupo (`top`) para poder volver a
// agarrarla si quedó tapada. `base`/`top` permiten que un grupo (p. ej. el
// plantel propio) quede siempre por encima de otro (los rivales) cuando se
// superponen.
export function zIndexFicha(id, arrastrandoId, fichaAlFrente, base = 'z-10', top = 'z-30') {
  if (id === arrastrandoId) return 'z-50';
  if (id === fichaAlFrente) return top;
  return base;
}
