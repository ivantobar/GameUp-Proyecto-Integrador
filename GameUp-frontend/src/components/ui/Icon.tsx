import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { sizes, type IconSize, type ThemeColor } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Íconos de la app (Ionicons, incluido en Expo Go). Las pantallas usan el
 * nombre de GameUP (`speaker`, `ear`…), no el de la librería. Así, cambiar un
 * ícono o la librería completa se hace solo aquí.
 */
export const iconGlyphs = {
  back: 'chevron-back',
  forward: 'chevron-forward',
  close: 'close',
  speaker: 'volume-high-outline',
  replay: 'refresh',
  play: 'play',
  mic: 'mic-outline',
  ear: 'ear-outline',
  hand: 'hand-left-outline',
  game: 'game-controller-outline',
  star: 'star',
  starOutline: 'star-outline',
  home: 'home-outline',
  check: 'checkmark',
  video: 'videocam-outline',
  note: 'chatbox-ellipses-outline',
  time: 'time-outline',
  match: 'git-compare-outline',
  classify: 'grid-outline',
  sequence: 'git-network-outline',
  memory: 'copy-outline',
  info: 'information-circle-outline',
  offline: 'cloud-offline-outline',
  empty: 'albums-outline',
  construction: 'construct-outline',
  student: 'happy-outline',
  teacher: 'school-outline',
  guardian: 'people-outline',
  palette: 'color-palette-outline',
  connection: 'wifi-outline',
  book: 'book-outline',
  stop: 'stop',
  pause: 'pause',
} as const satisfies Record<string, IoniconName>;

export type IconName = keyof typeof iconGlyphs;

interface IconProps {
  name: IconName;
  color: ThemeColor;
  size?: IconSize;
}

/**
 * Ícono decorativo. Lo que significa siempre lo dice el texto o el
 * `accessibilityLabel` del elemento que lo contiene.
 */
export function Icon({ name, color, size = 'md' }: IconProps) {
  return (
    <Ionicons
      name={iconGlyphs[name]}
      size={sizes.icon[size]}
      color={color}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
