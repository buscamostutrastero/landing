/** Reference envelopes in metres, not universal sizes or facility measurements. */
export const objectDimensions = Object.freeze({
  bicycle: Object.freeze({ width: 0.62, depth: 1.8, height: 1.1 }),
  dresser: Object.freeze({ width: 0.8, depth: 0.48, height: 0.78 }),
  sofa: Object.freeze({ width: 1.9, depth: 0.95, height: 0.83 }),
});

const boxes = Object.freeze({
  id: 'boxes',
  label: 'Estantería, cajas y maleta',
  description: 'Ejemplo de organización con una estantería, cajas y una maleta. Los objetos conservan su escala.',
  dimensions: ['Estantería: 78 × 33 × 165 cm (ancho × fondo × alto).', 'Cajas y maleta de referencia, con la misma escala en todos los ejemplos.'],
});
const bikeDresser = Object.freeze({
  id: 'bike-dresser',
  label: 'Bicicleta, cómoda y cajas',
  description: 'Ejemplo de organización con una bicicleta adulta sobre sus ruedas, una cómoda y dos cajas. Los objetos conservan su escala.',
  dimensions: ['Bicicleta: 180 × 62 × 110 cm (largo × manillar × alto).', 'Cómoda: 80 × 48 × 78 cm (ancho × fondo × alto).', 'Cada bicicleta o mueble puede medir distinto. Mide los tuyos antes de elegir.'],
});
const bikeSofa = Object.freeze({
  id: 'bike-sofa',
  label: 'Bicicleta y sofá de dos plazas',
  description: 'Ejemplo de organización con una bicicleta adulta sobre sus ruedas y un sofá de dos plazas apoyado en sus patas. Los objetos conservan su escala.',
  dimensions: ['Bicicleta: 180 × 62 × 110 cm (largo × manillar × alto).', 'Sofá de dos plazas: 190 × 95 × 83 cm (ancho × fondo × alto).', 'Cada bicicleta o mueble puede medir distinto. Mide los tuyos antes de elegir.'],
});

/** @param {string} size */
export function storageExampleForSize(size) {
  if (size === '3') return bikeDresser;
  if (size === '3,5') return bikeSofa;
  return boxes;
}
