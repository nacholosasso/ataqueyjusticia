// Tipos de flecha para la pizarra táctica (claves = valor guardado en Firestore)
export const TIPOS_FLECHA = {
  carrera: { etiqueta: 'Carrera', color: '#22d3ee', dasharray: null },
  pase: { etiqueta: 'Pase', color: '#a78bfa', dasharray: '4,3' },
  conduccion: { etiqueta: 'Conducción', color: '#fbbf24', dasharray: null },
};

export const TIPO_FLECHA_DEFAULT = 'carrera';

export const ORDEN_TIPOS_FLECHA = ['carrera', 'pase', 'conduccion'];
