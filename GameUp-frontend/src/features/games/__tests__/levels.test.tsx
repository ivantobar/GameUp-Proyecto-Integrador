import type { ReactNode } from 'react';
import {
  act,
  render,
  renderHook,
  screen,
  userEvent,
} from '@testing-library/react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { GameCard } from '@/components/gameup';
import { toGameLevel, toLevelUp } from '@/data/http/mappers/levelMapper';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { ladderContent } from '@/data/mock/ladderContent';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { GameLevel, ReviewItem } from '@/data/types';
import { StudentLevels } from '@/features/levels/components/StudentLevels';
import { memoryColumns } from '@/features/memory/components/MemoryCard';
import { ReviewCard } from '@/features/review/components/ReviewCard';
import { validatedText } from '@/features/review/useReviewQueue';
import { SequenceSlots } from '@/features/sequence/components/SequenceSlots';
import {
  CELEBRATION_MS,
  LevelUpCelebration,
} from '../components/LevelUpCelebration';
import { ladderHref } from '../catalog';
import {
  createSeenLevelStore,
  levelUpsSince,
  toSeenLevels,
} from '../levelCelebration';
import { useGameFinish } from '../useGameFinish';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const level = (
  gameId: GameLevel['gameId'],
  n: number,
  completed = false,
): GameLevel => ({ gameId, level: n, completed, pendingReview: 0 });

/** ¿Hay algún número visible? (la tarjeta del niño no muestra números). */
const visibleDigits = () => screen.queryAllByText(/\d/);

describe('escalera: cuándo celebrar', () => {
  const now = [level('memory', 2), level('match', 1)];

  it('la primera vez no celebra (solo guarda lo visto)', () => {
    expect(levelUpsSince(null, now)).toEqual([]);
  });

  it('celebra lo que subió desde la última vez, una vez', () => {
    const seen = toSeenLevels([level('memory', 1), level('match', 1)]);
    expect(levelUpsSince(seen, now)).toEqual([
      { gameId: 'memory', previousLevel: 1, level: 2, completed: false },
    ]);
    expect(levelUpsSince(toSeenLevels(now), now)).toEqual([]);
  });

  it('completar el nivel 5 también se celebra', () => {
    const seen = toSeenLevels([level('memory', 5)]);
    expect(levelUpsSince(seen, [level('memory', 5, true)])).toEqual([
      { gameId: 'memory', previousLevel: 5, level: 5, completed: true },
    ]);
  });

  it('un ajuste a la baja no se celebra', () => {
    const seen = toSeenLevels([level('memory', 4)]);
    expect(levelUpsSince(seen, [level('memory', 2)])).toEqual([]);
  });

  it('lo visto se guarda en el teléfono; si falla, en memoria (nunca un error)', async () => {
    const store = createSeenLevelStore();
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('x'));
    jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('x'));
    await store.set('10', { memory: { level: 3, completed: false } });
    await expect(store.get('10')).resolves.toEqual({
      memory: { level: 3, completed: false },
    });

    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValueOnce(
        JSON.stringify({ match: { level: 2, completed: false } }),
      );
    await expect(store.get('10')).resolves.toEqual({
      match: { level: 2, completed: false },
    });
    expect(SecureStore.getItemAsync).toHaveBeenLastCalledWith(
      'gameup.niveles-vistos.10',
    );
  });
});

describe('tarjeta del juego: el nivel con estrellas', () => {
  it('una estrella por nivel, sin números ni «te falta»', async () => {
    await render(
      <GameCard
        title="Memoria"
        subtitle="Voltea dos cartas"
        icon="memory"
        tone="surface"
        level={3}
        onPress={() => {}}
      />,
    );
    const stars = screen.getByTestId('level-stars', {
      includeHiddenElements: true,
    });
    expect(stars.children).toHaveLength(3);
    expect(visibleDigits()).toEqual([]);
    expect(screen.queryByText(/falta/i)).toBeNull();
    // El lector de pantalla sí dice cuántas son.
    expect(
      screen.getByRole('button', {
        name: 'Memoria. Voltea dos cartas. 3 estrellas',
      }),
    ).toBeOnTheScreen();
  });

  it('sin nivel (juegos de habla), no hay estrellas', async () => {
    await render(
      <GameCard
        title="Habla conmigo"
        subtitle="Mira, oye y dilo"
        icon="mic"
        tone="brand"
        onPress={() => {}}
      />,
    );
    expect(
      screen.queryByTestId('level-stars', { includeHiddenElements: true }),
    ).toBeNull();
  });
});

describe('celebración al subir de nivel', () => {
  it('es breve y visual: se cierra sola, sin cuenta regresiva', async () => {
    const onClose = jest.fn();
    await render(
      <LevelUpCelebration
        levelUp={{
          gameId: 'memory',
          previousLevel: 1,
          level: 2,
          completed: false,
        }}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('¡Subiste de nivel en Memoria!')).toBeOnTheScreen();
    expect(visibleDigits()).toEqual([]);

    await act(async () => {
      jest.advanceTimersByTime(CELEBRATION_MS - 1);
    });
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra con un toque; al completar el 5 dice «¡Completaste…!»', async () => {
    const onClose = jest.fn();
    await render(
      <LevelUpCelebration
        levelUp={{
          gameId: 'match',
          previousLevel: 5,
          level: 5,
          completed: true,
        }}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('¡Completaste Emparejar!')).toBeOnTheScreen();
    await userEvent.press(screen.getByRole('button', { name: '¡Sí!' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('sin subida no muestra nada', async () => {
    await render(<LevelUpCelebration levelUp={null} onClose={() => {}} />);
    expect(screen.queryByText(/Subiste/)).toBeNull();
  });
});

describe('abrir el nivel actual', () => {
  it('la tarjeta lleva al juego en su escalera', () => {
    expect(ladderHref('memory')).toEqual({
      pathname: '/student/memory',
      params: { escalera: '1' },
    });
  });

  it('al terminar, «Jugar otra vez» vuelve al nivel actual (no a la misma actividad)', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const { result } = await renderHook(
      () => useGameFinish('memory', 'escalera-memory-1', true),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <RepositoryProvider repositories={repositories}>
            {children}
          </RepositoryProvider>
        ),
      },
    );
    await act(async () => {
      const done = result.current.finish({
        kind: 'memory',
        pairs: 2,
        mismatches: 0,
      });
      await jest.runAllTimersAsync();
      await done;
    });
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/student/memory/done',
      params: { envio: 'review', escalera: '1' },
    });
  });
});

describe('tableros de cada nivel', () => {
  it.each([
    [1, 2, 2, 2, 4, 2],
    [2, 3, 3, 2, 6, 3],
    [3, 4, 4, 2, 8, 4],
    [4, 5, 3, 3, 6, 5],
    [5, 6, 4, 3, 9, 6],
  ])(
    'nivel %s: %s parejas, %s opciones, %s grupos con %s elementos, %s pasos',
    (n, parejas, opciones, grupos, elementos, pasos) => {
      const memory = ladderContent('memory', n);
      const match = ladderContent('match', n);
      const classify = ladderContent('classify', n);
      const sequence = ladderContent('sequence', n);
      if (
        memory.gameId !== 'memory' ||
        match.gameId !== 'match' ||
        classify.gameId !== 'classify' ||
        sequence.gameId !== 'sequence'
      )
        throw new Error('contenido de otro juego');
      expect(memory.boards[0]?.pairs).toHaveLength(parejas);
      expect(match.rounds[0]?.options).toHaveLength(opciones);
      expect(classify.sets[0]?.categories).toHaveLength(grupos);
      expect(classify.sets[0]?.items).toHaveLength(elementos);
      expect(sequence.routines[0]?.steps).toHaveLength(pasos);
    },
  );

  it('Memoria: 3 columnas desde 8 cartas (12 cartas = 4 filas)', () => {
    expect(memoryColumns(4)).toBe(2);
    expect(memoryColumns(6)).toBe(2);
    expect(memoryColumns(8)).toBe(3);
    expect(memoryColumns(12)).toBe(3);
  });

  it('Secuenciar: con 6 pasos, las casillas van en dos filas de 3', async () => {
    await render(<SequenceSlots total={6} placed={[]} />);
    const pasos = screen.getByLabelText(/^Pasos\./);
    expect(pasos.children).toHaveLength(2);
    expect(screen.getByText('6')).toBeOnTheScreen();
  });
});

describe('la profe ve la subida de nivel', () => {
  const item: ReviewItem = {
    id: 'r1',
    kind: 'game',
    student: { id: '10', displayName: 'Martín C.', initials: 'MC' },
    submittedAt: '2026-11-06T15:00:00.000Z',
    status: 'pending_validation',
    game: {
      gameId: 'memory',
      title: 'Memoria · nivel 2',
      score: { kind: 'memory', pairs: 3, mismatches: 0 },
      level: 2,
    },
  };

  it('aviso al validar: subió, completó o solo validado', () => {
    expect(
      validatedText(item, {
        gameId: 'memory',
        previousLevel: 2,
        level: 3,
        completed: false,
      }),
    ).toBe('¡Martín C. subió al nivel 3 de Memoria!');
    expect(
      validatedText(item, {
        gameId: 'memory',
        previousLevel: 5,
        level: 5,
        completed: true,
      }),
    ).toBe('¡Martín C. completó los 5 niveles de Memoria!');
    expect(validatedText(item, null)).toBe(
      'Validado: la actividad de Martín C. ya cuenta en su progreso.',
    );
  });
});

describe('mapeo de los niveles de la API', () => {
  it('nivel y subida', () => {
    expect(
      toGameLevel({
        juego: 'SECUENCIAR',
        nombre: 'Secuenciar',
        nivelActual: 4,
        nivelMaximo: 5,
        completado: false,
        pendientesValidacion: 2,
        actualizadoEn: '2026-11-06T15:00:00.000Z',
      }),
    ).toEqual({
      gameId: 'sequence',
      level: 4,
      completed: false,
      pendingReview: 2,
    });
    expect(
      toLevelUp({
        intentoId: '41',
        juego: 'MEMORIA',
        nivelAnterior: 1,
        nivelNuevo: 2,
        completado: false,
      }),
    ).toEqual({
      gameId: 'memory',
      previousLevel: 1,
      level: 2,
      completed: false,
    });
    expect(toLevelUp(null)).toBeNull();
  });

  it('un nivel fuera de 1-5 o un juego sin escalera es una respuesta inesperada', () => {
    const base = {
      nombre: 'x',
      nivelMaximo: 5,
      completado: false,
      pendientesValidacion: 0,
      actualizadoEn: '',
    };
    expect(() =>
      toGameLevel({ ...base, juego: 'MEMORIA', nivelActual: 6 }),
    ).toThrow();
    expect(() =>
      toGameLevel({
        ...base,
        juego: 'HABLA_CONMIGO' as 'MEMORIA',
        nivelActual: 1,
      }),
    ).toThrow();
  });
});

describe('lo que ven la profe y el acudiente', () => {
  it('el nivel de cada juego del estudiante, con estrellas y «Nivel N»', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    jest
      .spyOn(repositories.levels, 'getStudentLevels')
      .mockResolvedValue([
        level('match', 1),
        level('classify', 2),
        level('sequence', 1),
        level('memory', 5, true),
      ]);
    await render(
      <RepositoryProvider repositories={repositories}>
        <StudentLevels studentId="10" title="Juegos de Martín" />
      </RepositoryProvider>,
    );
    await act(async () => {
      await jest.runAllTimersAsync();
    });
    expect(screen.getByText('Juegos de Martín')).toBeOnTheScreen();
    expect(screen.getByLabelText('Clasificar: Nivel 2')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Memoria: Nivel 5 · ¡completado!'),
    ).toBeOnTheScreen();
  });

  it('en la revisión: el nivel del intento y cuántas veces lo jugó', async () => {
    await render(
      <ReviewCard
        item={{
          id: 'r1',
          kind: 'game',
          student: { id: '10', displayName: 'Martín C.', initials: 'MC' },
          submittedAt: '2026-11-06T15:00:00.000Z',
          status: 'pending_validation',
          game: {
            gameId: 'memory',
            title: 'Memoria · nivel 2',
            score: { kind: 'memory', pairs: 3, mismatches: 0 },
            level: 2,
            pendingSameActivity: 3,
          },
        }}
        expanded
        onExpand={() => {}}
        busy={false}
        onValidate={() => {}}
        onRequestMore={() => Promise.resolve(true)}
        onSaveVoiceNote={() => Promise.resolve(true)}
      />,
    );
    expect(
      screen.getByText(
        'Escalera: nivel 2. Jugó 3 veces este nivel; aprobar una lo sube.',
      ),
    ).toBeOnTheScreen();
  });
});
