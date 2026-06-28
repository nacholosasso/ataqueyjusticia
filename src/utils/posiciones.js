// Limita `valor` dejando un margen mínimo a cada lado, para que el centro de
// la carta nunca quede tan cerca del borde que la mitad de la carta se
// recorte por el `overflow-hidden` de la cancha.
function clampConMargen(valor, margen) {
  const min = Math.min(margen, 50);
  const max = Math.max(100 - margen, 50);
  return Math.min(max, Math.max(min, valor));
}

// Las posiciones se guardan siempre en el sistema "vertical" (x = lateral,
// y = eje arco propio→rival), sin importar cómo se esté mostrando la cancha
// en pantalla. Estas dos funciones convierten entre ese espacio "modelo" y
// el espacio "pantalla" (lo que realmente se ve, rotado 90° en vista
// horizontal), para que lo que se guarda en Firestore sea independiente de
// la orientación elegida en cada dispositivo. Son inversas entre sí.
export function modeloAPantalla({ x, y }, orientacion) {
  return orientacion === 'horizontal' ? { x: 100 - y, y: x } : { x, y };
}

export function pantallaAModelo({ x, y }, orientacion) {
  return orientacion === 'horizontal' ? { x: y, y: 100 - x } : { x, y };
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

// Distancia (en puntos porcentuales) dentro de la cual una coordenada se
// ajusta a la de otro jugador ya ubicado, para que queden alineados. Se
// mantiene chico para no "tragarse" correcciones finas de posición.
const UMBRAL_ALINEACION = 1;

function valorAlineado(valor, valores) {
  let mejor = valor;
  let mejorDist = UMBRAL_ALINEACION;
  for (const v of valores) {
    const dist = Math.abs(v - valor);
    if (dist <= mejorDist) {
      mejor = v;
      mejorDist = dist;
    }
  }
  return mejor;
}

// Ajusta `coords` para alinear al jugador con otros ya ubicados en la
// cancha: si su x o y (de forma independiente) queda a `UMBRAL_ALINEACION`
// puntos o menos de la de otro, la iguala a esa para que queden en la misma
// línea (vertical u horizontal).
export function alinearConOtros(coords, posicionesOtros) {
  const otros = Object.values(posicionesOtros);
  return {
    x: valorAlineado(coords.x, otros.map((p) => p.x)),
    y: valorAlineado(coords.y, otros.map((p) => p.y)),
  };
}
