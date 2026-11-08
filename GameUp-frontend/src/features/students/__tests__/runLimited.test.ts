import { runLimited } from '../runLimited';

describe('runLimited', () => {
  it('nunca corre más de `limit` tareas a la vez y respeta el orden', async () => {
    let running = 0;
    let peak = 0;
    const items = Array.from({ length: 12 }, (_, i) => i);

    const pending = runLimited(items, 5, async (item) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 10 * (item % 3)));
      running -= 1;
      return item * 2;
    });
    await jest.runAllTimersAsync();
    const results = await pending;

    expect(peak).toBe(5);
    expect(results).toEqual(items.map((i) => ({ ok: true, value: i * 2 })));
  });

  it('una falla no detiene a las demás', async () => {
    const results = await runLimited([1, 2, 3], 2, async (item) => {
      if (item === 2) throw new Error('falló');
      return item;
    });

    expect(results[0]).toEqual({ ok: true, value: 1 });
    expect(results[1]?.ok).toBe(false);
    expect(results[2]).toEqual({ ok: true, value: 3 });
  });

  it('sin elementos, no hace nada', async () => {
    await expect(runLimited([], 5, async () => 1)).resolves.toEqual([]);
  });
});
