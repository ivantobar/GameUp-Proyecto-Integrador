import {
  LevelChangeError,
  SOLO_DIRECTORA_SUBE,
  StudentAccessError,
} from '@/data/studentErrors';
import type { GameLevel } from '@/data/types';
import {
  allowedLevels,
  levelChangeErrorText,
  levelChangedText,
} from '../levelChoices';

const nivel = (level: number, completed = false): GameLevel => ({
  gameId: 'memory',
  level,
  completed,
  pendingReview: 0,
});

describe('niveles que se pueden elegir a mano', () => {
  it('la tallerista solo ve niveles menores al actual', () => {
    expect(allowedLevels(nivel(4), false)).toEqual([1, 2, 3]);
    expect(allowedLevels(nivel(1), false)).toEqual([]);
  });

  it('la directora ve todos menos el actual', () => {
    expect(allowedLevels(nivel(3), true)).toEqual([1, 2, 4, 5]);
  });

  it('un juego completado se puede volver a abrir en su nivel (no es subir)', () => {
    expect(allowedLevels(nivel(5, true), false)).toEqual([1, 2, 3, 4, 5]);
    expect(allowedLevels(nivel(5, true), true)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('textos', () => {
  it('aviso al volver: «Memoria quedó en el nivel 2.»', () => {
    expect(levelChangedText('memory', 2)).toBe('Memoria quedó en el nivel 2.');
  });

  it('si el backend explicó el porqué (403), se muestra su mensaje', () => {
    expect(
      levelChangeErrorText(
        new LevelChangeError('notAllowed', SOLO_DIRECTORA_SUBE),
      ),
    ).toBe(SOLO_DIRECTORA_SUBE);
  });

  it('sin explicación, un texto claro por problema; sin red, revisar la conexión', () => {
    expect(levelChangeErrorText(new LevelChangeError('changed'))).toMatch(
      /cambió mientras tanto/,
    );
    expect(levelChangeErrorText(new StudentAccessError())).toBe(
      'No puedes cambiar el nivel de este estudiante.',
    );
    expect(levelChangeErrorText(new Error('red'))).toMatch(
      /Revisa la conexión/,
    );
  });
});
