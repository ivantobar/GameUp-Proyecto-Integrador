/**
 * Ejecuta `task` para cada elemento, con a lo sumo `limit` a la vez, y
 * devuelve los resultados en el mismo orden. Una falla no detiene a las
 * demás: queda como `{ ok: false }` en su lugar.
 */
export async function runLimited<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<({ ok: true; value: R } | { ok: false; error: unknown })[]> {
  const results: ({ ok: true; value: R } | { ok: false; error: unknown })[] =
    new Array(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      try {
        results[index] = { ok: true, value: await task(items[index] as T) };
      } catch (error) {
        results[index] = { ok: false, error };
      }
    }
  };

  const workers = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workers }, worker));
  return results;
}
