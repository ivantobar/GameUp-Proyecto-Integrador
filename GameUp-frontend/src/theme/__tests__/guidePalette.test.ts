import { hintPillStyles } from '@/components/gameup';
import { mouthOptionStates } from '@/components/gameup/MouthOption';
import { pictureCardStates } from '@/components/gameup/PictureCard';
import { soundTileLevels } from '@/components/gameup/SoundTile';
import { textTones } from '@/components/ui/AppText';
import { badgeTones } from '@/components/ui/Badge';
import { buttonDisabled, buttonVariants } from '@/components/ui/Button';
import { cardTones } from '@/components/ui/Card';
import { iconButtonVariants } from '@/components/ui/IconButton';
import { noticeTones } from '@/components/ui/Notice';
import { screenTones } from '@/components/ui/Screen';
import { memoryCardStyles } from '@/features/memory/components/MemoryCard';
import { colors } from '@/theme';

/**
 * La app se mantiene dentro de la guía de ASISCO UP: botones, encabezados,
 * barra inferior, textos, fondos de pantalla y estados (elegido, pista,
 * acierto) usan solo colores [guía] o [derivado GameUP]. Los colores de
 * identidad de cada juego van solo detrás de su dibujo, y los de `juego.*`
 * solo dentro de los dibujos.
 */

/** Colores permitidos fuera de los dibujos. */
const allowed = new Set<string>([
  ...Object.values(colors.marca),
  ...Object.values(colors.verde),
  ...Object.values(colors.naranja),
  ...Object.values(colors.texto),
  ...Object.values(colors.superficie),
  ...Object.values(colors.cafe),
  ...Object.values(colors.borde),
  ...Object.values(colors.estrella),
  colors.transparente,
]);

/** Todos los valores de color (texto) dentro de un mapa de estilos. */
function colorValues(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.startsWith('#') ||
      value.startsWith('rgba') ||
      value === 'transparent'
      ? [value]
      : [];
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(colorValues);
  }
  return [];
}

describe('paleta de la guía de ASISCO UP', () => {
  it.each([
    ['Button', buttonVariants],
    ['Button deshabilitado', buttonDisabled],
    ['IconButton', iconButtonVariants],
    ['Card / PressableCard', cardTones],
    ['Screen (fondos de pantalla)', screenTones],
    ['Badge', badgeTones],
    ['Notice', noticeTones],
    ['AppText', textTones],
    ['PictureCard (elegido, pista, acierto)', pictureCardStates],
    ['MouthOption', mouthOptionStates],
    ['MemoryCard', memoryCardStyles],
    ['SoundTile', soundTileLevels],
    ['HintPill', hintPillStyles],
  ])('%s usa solo colores de la guía o derivados', (_name, styles) => {
    const outside = colorValues(styles).filter((value) => !allowed.has(value));
    expect(outside).toEqual([]);
  });

  it('ya no hay fondo crema, relieves de color ni acentos por juego', () => {
    expect(colors).not.toHaveProperty('fondo');
    expect(colors).not.toHaveProperty('relieve');
    Object.keys(colors.identidad).forEach((key) => {
      expect(key).toMatch(/Fondo$/);
    });
  });
});

/**
 * Módulos de Node, con los tipos mínimos que usa esta prueba (el proyecto
 * no incluye los tipos de Node y no se agregan dependencias por esto).
 */
interface DirEntry {
  name: string;
  isDirectory(): boolean;
}
const fs = jest.requireActual('fs') as {
  readdirSync(dir: string, options: { withFileTypes: true }): DirEntry[];
  readFileSync(file: string, encoding: 'utf8'): string;
};
const path = jest.requireActual('path') as {
  join(...parts: string[]): string;
  relative(from: string, to: string): string;
  sep: string;
};
const nodeProcess = jest.requireActual('process') as { cwd(): string };

/** Archivos .ts/.tsx de `src` (sin pruebas). */
function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

// Jest corre desde la carpeta del proyecto (GameUp-frontend).
const srcDir = path.join(nodeProcess.cwd(), 'src');
const relative = (file: string) =>
  path.relative(srcDir, file).split(path.sep).join('/');

describe('dónde se usan los colores fuera de la guía (código fuente)', () => {
  const files = sourceFiles(srcDir);

  it('el color de identidad solo se lee en gameThemes (fondo detrás del dibujo)', () => {
    const users = files
      .filter((file) =>
        fs.readFileSync(file, 'utf8').includes('colors.identidad'),
      )
      .map(relative)
      // El catálogo de desarrollo y las pruebas no son pantallas de la app.
      .filter((file) => !file.startsWith('features/dev/'));
    expect(users).toEqual(['components/gameup/gameThemes.ts']);
  });

  it('los colores de juego.* solo se usan dentro de los dibujos', () => {
    const users = files
      .filter((file) => fs.readFileSync(file, 'utf8').includes('colors.juego'))
      .map(relative)
      .filter((file) => !file.startsWith('features/dev/'))
      .sort();
    expect(users).toEqual(
      [
        'components/gameup/GameIcon.tsx',
        'components/gameup/gameThemes.ts',
        'components/gameup/illustrations/palette.ts',
      ].sort(),
    );
  });
});
