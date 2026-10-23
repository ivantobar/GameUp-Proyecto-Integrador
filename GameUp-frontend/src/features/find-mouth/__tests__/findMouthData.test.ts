import { createMockRepositories } from '@/data/mock/createMockRepositories';

async function run<T>(promise: Promise<T>): Promise<T> {
  await jest.runAllTimersAsync();
  return promise;
}

describe('resultado de Busca la boca (repositorio simulado)', () => {
  it('queda pendiente de validación y la tarea deja de estar pendiente', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    const before = await run(
      repositories.assignments.listPendingForStudent('est-demo-001'),
    );
    expect(before.some((a) => a.gameId === 'findMouth')).toBe(true);

    const result = await run(
      repositories.results.submitFindMouthResult({
        studentId: 'est-demo-001',
        firstTryCorrect: 4,
        total: 5,
      }),
    );
    expect(result.status).toBe('pending_validation');

    const after = await run(
      repositories.assignments.listPendingForStudent('est-demo-001'),
    );
    expect(after.some((a) => a.gameId === 'findMouth')).toBe(false);
  });
});
