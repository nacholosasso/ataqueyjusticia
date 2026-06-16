// Limita `valor` dejando un margen mínimo a cada lado, para que el centro de
// la carta nunca quede tan cerca del borde que la mitad de la carta se
// recorte por el `overflow-hidden` de la cancha.
function clampConMargen(valor, margen) {
  const min = Math.min(margen, 50);
  const max = Math.max(100 - margen, 50);
  return Math.min(max, Math.max(min, valor));
}

// Convierte el rect (viewport) de un elemento arrastrado a coordenadas %
// (0-100) relativas al rect de la cancha, usando el centro del elemento.
export function coordsDesdeRect(elRect, canchaRect) {
  const centroX = elRect.left + elRect.width / 2;
  const centroY = elRect.top + elRect.height / 2;
  const margenX = (elRect.width / 2 / canchaRect.width) * 100;
  const margenY = (elRect.height / 2 / canchaRect.height) * 100;
  return {
    x: clampConMargen(((centroX - canchaRect.left) / canchaRect.width) * 100, margenX),
    y: clampConMargen(((centroY - canchaRect.top) / canchaRect.height) * 100, margenY),
  };
}
