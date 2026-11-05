import type { IconName } from '@/components/ui';
import type { ModuleId } from '@/data/types';

export type ModuleBadgeTone = 'neutral' | 'soft' | 'warm';

/** Lo que va dentro del recuadro del tema: un ícono o un texto corto. */
export type ModuleSymbol =
  { kind: 'icon'; icon: IconName } | { kind: 'text'; text: string };

export interface ModuleDefinition {
  id: ModuleId;
  title: string;
  symbol: ModuleSymbol;
  tone: ModuleBadgeTone;
}

/**
 * Temas de «Mi progreso», en el orden en que se muestran. Agregar un tema es
 * agregar una entrada aquí.
 *
 * Los recuadros usan solo colores de la guía. La imagen de referencia tiene
 * un fondo lila (Cuentos) y puntos rojo y azul (Colores) que la guía no
 * define; se reemplazaron por el gris de marca y un ícono de paleta.
 */
export const moduleCatalog: readonly ModuleDefinition[] = [
  {
    id: 'colors',
    title: 'Colores',
    symbol: { kind: 'icon', icon: 'palette' },
    tone: 'neutral',
  },
  {
    id: 'numbers',
    title: 'Números',
    symbol: { kind: 'text', text: '123' },
    tone: 'soft',
  },
  {
    id: 'letters',
    title: 'Letras',
    symbol: { kind: 'text', text: 'Aa' },
    tone: 'warm',
  },
  {
    id: 'stories',
    title: 'Cuentos',
    symbol: { kind: 'icon', icon: 'book' },
    tone: 'neutral',
  },
];

/**
 * Cómo se ve un tema de «Mi progreso». Los temas son dinámicos (los crea la
 * fundación): si el id está en el catálogo, se usan su ícono y su tono; si
 * no, sus dos primeras letras en un recuadro neutro. El nombre siempre es
 * el que llega con los datos.
 */
export function moduleDefinitionFor(progress: {
  moduleId: ModuleId;
  title: string;
}): ModuleDefinition {
  const known = moduleCatalog.find((module) => module.id === progress.moduleId);
  if (known) return { ...known, title: progress.title || known.title };
  const letters = progress.title.trim().slice(0, 2);
  return {
    id: progress.moduleId,
    title: progress.title,
    symbol: {
      kind: 'text',
      text: letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase(),
    },
    tone: 'neutral',
  };
}
