export type Settled<R> = { ok: true; value: R } | { ok: false; error: unknown };

/**
 * Cola con a lo sumo `limit` tareas corriendo a la vez. Se comparte entre
 * llamadas: aunque lleguen varios lotes seguidos (buscar, «Ver más»), el
 * límite se respeta en total.
 */
export function createLimiter(limit: number) {
  let running = 0;
  const waiting: (() => void)[] = [];

  const next = () => {
    if (running >= limit) return;
    const start = waiting.shift();
    if (start) start();
  };

  return function run<R>(task: () => Promise<R>): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      waiting.push(() => {
        running += 1;
        task()
          .then(resolve, reject)
          .finally(() => {
            running -= 1;
            next();
          });
      });
      next();
    });
  };
}

/**
 * Ejecuta `task` para cada elemento, con a lo sumo `limit` a la vez, y
 * devuelve los resultados en el mismo orden. Una falla no detiene a las
 * demás: queda como `{ ok: false }` en su lugar.
 */
export function runLimited<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<Settled<R>[]> {
  const run = createLimiter(Math.max(1, limit));
  return Promise.all(
    items.map((item) =>
      run(() => task(item)).then(
        (value): Settled<R> => ({ ok: true, value }),
        (error: unknown): Settled<R> => ({ ok: false, error }),
      ),
    ),
  );
}
