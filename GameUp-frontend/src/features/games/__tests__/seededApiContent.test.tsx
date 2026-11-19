import type { ComponentType, ReactNode } from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import ClassifyScreen from '@/app/student/classify/index';
import FindMouthScreen from '@/app/student/find-mouth/index';
import MatchScreen from '@/app/student/match/index';
import MemoryScreen from '@/app/student/memory/index';
import SequenceScreen from '@/app/student/sequence/index';
import { Pictogram } from '@/components/gameup';
import {
  illustrationFor,
  provisionalEmoji,
  visibleText,
} from '@/components/gameup/illustrations';
import type { ActividadDetalleDto } from '@/data/http/dto/actividades';
import { toActivityContent } from '@/data/http/mappers/activityMapper';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { ActivityContent, PictureFace } from '@/data/types';
import { seededActivities } from '@/test-utils/seededContent';

jest.setTimeout(120000);

const hidden = { includeHiddenElements: true } as const;

/** Actividad sembrada → contenido de la app, con el mapper REAL de la API. */
function mapSeeded(index: number): ActivityContent {
  const seeded = seededActivities[index]!;
  return toActivityContent({
    id: String(100 + index),
    titulo: seeded.origen,
    tipoJuego: { id: '1', codigo: seeded.codigo, nombre: seeded.codigo },
    configuracion: seeded.configuracion,
  } as unknown as ActividadDetalleDto);
}

const allContent = seededActivities.map((_, index) => mapSeeded(index));

/** Todas las tarjetas de una actividad. */
function facesOf(content: ActivityContent): PictureFace[] {
  switch (content.gameId) {
    case 'match':
      return content.rounds.flatMap((r) => [r.prompt, ...r.options]);
    case 'classify':
      return content.sets.flatMap((s) => [...s.categories, ...s.items]);
    case 'sequence':
      return content.routines.flatMap((r) => r.steps);
    case 'memory':
      return content.boards.flatMap((b) => b.pairs);
    default:
      return [];
  }
}

describe('contenido sembrado por el backend (formato real de la API)', () => {
  it('el mapper real traduce las 75 actividades sembradas', () => {
    expect(allContent).toHaveLength(seededActivities.length);
    expect(seededActivities.length).toBeGreaterThanOrEqual(75);
  });

  // Tarjetas distintas (etiqueta + texto), para no repetir.
  const unique = new Map<string, PictureFace>();
  allContent.flatMap(facesOf).forEach((face) => {
    unique.set(`${face.label}|${face.text ?? ''}|${face.count ?? 1}`, face);
  });
  const faces = [...unique.values()];

  it('hay tarjetas que revisar', () => {
    expect(faces.length).toBeGreaterThan(100);
  });

  it.each(faces.map((face) => [`${face.label} ${face.text ?? ''}`, face]))(
    '«%s»: una sola imagen, sin emoji duplicado ni palabra de más',
    async (_name, face) => {
      await render(<Pictogram face={face as PictureFace} size="lg" />);
      const f = face as PictureFace;
      const drawing = illustrationFor(f);
      const emoji = provisionalEmoji(f);
      const text = visibleText(f);
      const count = Math.max(1, f.count ?? 1);

      if (drawing) {
        // Dibujo propio: nunca el emoji al lado.
        expect(
          screen.getAllByTestId(`illustration-${drawing}`, hidden),
        ).toHaveLength(count);
        expect(screen.queryByTestId('pictogram-emoji', hidden)).toBeNull();
        if (emoji) expect(screen.queryByText(emoji, hidden)).toBeNull();
      } else if (emoji) {
        // Sin dibujo: el emoji como imagen, nunca la palabra en su lugar.
        expect(screen.getAllByTestId('pictogram-emoji', hidden)).toHaveLength(
          count,
        );
        expect(screen.queryByTestId(/^illustration-/, hidden)).toBeNull();
        if (!text) expect(screen.queryByText(f.label, hidden)).toBeNull();
      } else if (text) {
        // Para leer: el texto, sin dibujo (no regala la respuesta).
        expect(screen.getByText(text, hidden)).toBeOnTheScreen();
        expect(screen.queryByTestId(/^illustration-/, hidden)).toBeNull();
      } else {
        expect(screen.getByText(f.label, hidden)).toBeOnTheScreen();
      }
    },
  );
});

/** Abre una pantalla de juego real con una actividad sembrada. */
async function openWithSeeded(
  route: string,
  Screen: ComponentType,
  content: ActivityContent,
) {
  const repositories = createMockRepositories({ delayMs: 0 });
  jest.spyOn(repositories.activities, 'getActivity').mockResolvedValue(content);
  await renderRouter(
    { [`${route.slice(1)}/index`]: Screen },
    {
      initialUrl: `${route}?actividadId=${content.activityId}`,
      wrapper: ({ children }: { children: ReactNode }) => (
        <RepositoryProvider repositories={repositories}>
          {children}
        </RepositoryProvider>
      ),
    },
  );
  await act(async () => {
    await jest.runAllTimersAsync();
  });
}

const firstOf = (gameId: ActivityContent['gameId']) => {
  const found = allContent.find((content) => content.gameId === gameId);
  if (!found) throw new Error(`No hay actividad sembrada de ${gameId}`);
  return found;
};

describe('cada juego abre con una actividad sembrada real', () => {
  it.each([
    ['/student/match', MatchScreen, 'match'],
    ['/student/classify', ClassifyScreen, 'classify'],
    ['/student/sequence', SequenceScreen, 'sequence'],
    ['/student/memory', MemoryScreen, 'memory'],
    ['/student/find-mouth', FindMouthScreen, 'findMouth'],
  ] as const)('%s', async (route, Screen, gameId) => {
    await openWithSeeded(route, Screen, firstOf(gameId));
    // La pantalla del juego está (título de la ronda) y no la de error.
    expect(screen.getByRole('header')).toBeOnTheScreen();
    expect(screen.queryByText('Vamos a intentarlo otra vez')).toBeNull();
    // Ningún emoji visible junto a un dibujo: si hay dibujos en pantalla,
    // ningún texto de la pantalla es solo un emoji que tenga dibujo.
    const visibleEmojis = screen
      .queryAllByTestId('pictogram-emoji', hidden)
      .map((node) => String(node.props.children));
    visibleEmojis.forEach((emoji) => {
      expect(illustrationFor({ id: 'x', label: '', text: emoji })).toBeNull();
    });
  });
});
