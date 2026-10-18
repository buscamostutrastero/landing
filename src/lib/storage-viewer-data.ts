import { storageSizes } from './storage-content';

/**
 * Proporciones gráficas del visor 3D, en metros. Ancho × fondo coincide con la
 * superficie comercial, pero no son medidas del local: no mostrarlas como cotas.
 */
export const viewerHeight = 2.2;

const proportions: Record<string, { width: number; depth: number }> = {
  '1': { width: 1, depth: 1 },
  '1,5': { width: 1, depth: 1.5 },
  '2': { width: 1.25, depth: 1.6 },
  '2,5': { width: 1.25, depth: 2 },
  '3': { width: 1.5, depth: 2 },
  '3,5': { width: 1.75, depth: 2 },
};

export const viewerUnits = storageSizes.map(({ size, image }) => {
  const shape = proportions[size];
  if (!shape) throw new Error(`Falta la proporción del visor para ${size} m².`);
  return { size, image, ...shape };
});

export type ViewerUnit = (typeof viewerUnits)[number];
