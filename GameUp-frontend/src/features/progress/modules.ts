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
