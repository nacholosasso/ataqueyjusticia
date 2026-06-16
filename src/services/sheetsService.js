const MENSAJES_ERROR_API = {
  400: 'La hoja de cálculo no se encontró. Verificá el SPREADSHEET_ID en el archivo .env.',
  403: 'Acceso denegado. Verificá que la API Key sea válida y que la hoja esté compartida públicamente.',
  404: 'No se encontró la pestaña "Plantel" en la hoja de cálculo.',
};

function normalizarForma(valor) {
  const texto = (valor ?? '').toString().trim().toLowerCase();
  if (texto.includes('alza') || texto.includes('sube') || texto === '+') return 'alza';
  if (texto.includes('baja') || texto.includes('cae') || texto === '-') return 'baja';
  return 'normal';
}

export async function obtenerPlantel() {
  const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  if (!SPREADSHEET_ID || !API_KEY) {
    throw new Error('Faltan variables de entorno. Creá un archivo .env con VITE_SPREADSHEET_ID y VITE_GOOGLE_API_KEY.');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Plantel?key=${API_KEY}`;
  const respuesta = await fetch(url);
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const mensajeAmigable =
      MENSAJES_ERROR_API[respuesta.status] ??
      `Error inesperado (${respuesta.status}). Revisá la consola para más detalles.`;
    console.error('Google Sheets error:', datos.error?.message || respuesta.statusText);
    throw new Error(mensajeAmigable);
  }

  const filas = datos.values?.slice(1) ?? [];
  return filas.map((fila, index) => ({
    id: fila[0] != null && fila[0] !== '' ? fila[0] : String(index),
    nombre: fila[1] || 'Sin Nombre',
    dorsal: fila[2] || '-',
    fotoURL: fila[3] || '',
    posAbrev: fila[4] || '-',
    atributos: {
      rit: parseInt(fila[5]) || 0,
      tir: parseInt(fila[6]) || 0,
      pas: parseInt(fila[7]) || 0,
      reg: parseInt(fila[8]) || 0,
      def: parseInt(fila[9]) || 0,
      fis: parseInt(fila[10]) || 0,
    },
    mediaForzada: fila[11] ? parseInt(fila[11]) || null : null,
    forma: normalizarForma(fila[12]),
  }));
}
