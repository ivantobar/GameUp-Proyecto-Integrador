import type { ReactNode } from 'react';
import { act, screen, within } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import MatchScreen from '@/app/student/match/index';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { MatchRound } from '@/data/types';

// Cargar el router real la primera vez puede tardar más de 30 s.
jest.setTimeout(90000);

const hidden = { includeHiddenElements: true } as const;

/**
 * «¿Qué palabra es?»: arriba una IMAGEN y abajo PALABRAS. El juego se rompe
 * si la tarjeta de arriba se vuelve palabra (el niño no lee) o si las
 * palabras de abajo traen dibujo (emparejaría dibujo con dibujo sin leer).
 */
async function playRound(round: MatchRound) {
  const repositories = createMockRepositories({ delayMs: 0 });
  jest.spyOn(repositories.activities, 'getActivity').mockResolvedValue({
    activityId: '30',
    gameId: 'match',
    title: 'Emparejar',
    rounds: [round],
  });
  await renderRouter(
    { 'student/match/index': MatchScreen },
    {
      initialUrl: '/student/match?actividadId=30',
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

/**
 * Las opciones de abajo muestran su palabra y ninguna imagen. Cada opción
 * se anuncia con su etiqueta y muestra su texto: [etiqueta, texto].
 */
function expectWordOptions(options: readonly [string, string][]) {
  for (const [label, word] of options) {
    const option = within(screen.getByRole('button', { name: label }));
    expect(option.getByText(word, hidden)).toBeOnTheScreen();
    expect(option.queryByTestId(/^illustration-/, hidden)).toBeNull();
    expect(option.queryByTestId('pictogram-emoji', hidden)).toBeNull();
  }
}

describe('Emparejar «¿Qué palabra es?»: imagen arriba, palabras abajo', () => {
  it('con un emoji sin dibujo propio (🛶), arriba se ve el emoji, no la palabra', async () => {
    await playRound({
      id: 'r0',
      question: '¿Qué palabra es?',
      prompt: { id: 'r0-e', label: 'canoa', text: '🛶' },
      options: [
        { id: 'r0-o0', label: 'canoa', text: 'canoa' },
        { id: 'r0-o1', label: 'barco', text: 'barco' },
      ],
      answerId: 'r0-o0',
    });

    expect(screen.getByText('¿Qué palabra es?')).toBeOnTheScreen();
    const prompt = within(screen.getByLabelText('Tarjeta: canoa'));
    expect(prompt.getByTestId('pictogram-emoji', hidden)).toHaveTextContent(
      '🛶',
    );
    expect(prompt.queryByText('canoa', hidden)).toBeNull();

    expectWordOptions([
      ['canoa', 'canoa'],
      ['barco', 'barco'],
    ]);
  });

  it('con un emoji que tiene dibujo (🍎), arriba se ve solo el dibujo', async () => {
    await playRound({
      id: 'r0',
      question: '¿Qué palabra es?',
      prompt: { id: 'r0-e', label: 'manzana', text: '🍎' },
      options: [
        { id: 'r0-o0', label: 'manzana', text: 'Manzana' },
        { id: 'r0-o1', label: 'perro', text: 'Perro' },
        { id: 'r0-o2', label: 'sol', text: 'Sol' },
      ],
      answerId: 'r0-o0',
    });

    const prompt = within(screen.getByLabelText('Tarjeta: manzana'));
    expect(
      prompt.getByTestId('illustration-manzana', hidden),
    ).toBeOnTheScreen();
    // Sin el emoji duplicado al lado y sin la palabra.
    expect(prompt.queryByText('🍎', hidden)).toBeNull();
    expect(prompt.queryByText('manzana', hidden)).toBeNull();

    // Abajo, palabras solas: un dibujo de manzana regalaría la respuesta.
    expectWordOptions([
      ['manzana', 'Manzana'],
      ['perro', 'Perro'],
      ['sol', 'Sol'],
    ]);
  });
});
