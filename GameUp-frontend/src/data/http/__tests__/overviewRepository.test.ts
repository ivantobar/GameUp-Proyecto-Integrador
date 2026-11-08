import { createApiClient } from '@/services/api';
import { createFakeBackend, FAKE_API_URL } from '@/test-utils/fakeBackend';
import {
  createFakeFetch,
  jsonResponse,
  type FakeHandler,
} from '@/test-utils/fakeFetch';
import { MOCK_PASSWORD } from '../../mock/fixtures';
import { createHttpRepositories } from '../createHttpRepositories';
import { createHttpOverviewRepository } from '../httpOverviewRepository';
import { createMemoryTokenStore } from '../tokenStore';

function overviewWith(handler: FakeHandler) {
  const fake = createFakeFetch(handler);
  const api = createApiClient({
    baseUrl: FAKE_API_URL,
    getToken: () => Promise.resolve('token-de-prueba'),
    fetchFn: fake.fetchFn,
  });
  return { overview: createHttpOverviewRepository(api), fake };
}

describe('Resumen con la API', () => {
  it('lee el total de cada lista pidiendo una sola fila', async () => {
    const { overview, fake } = overviewWith(() =>
      jsonResponse(200, { items: [], total: 7, page: 1, limit: 1 }),
    );

    await expect(overview.countStudents()).resolves.toBe(7);
    await expect(overview.countPendingReviews()).resolves.toBe(7);
    await expect(overview.countAssignments('assigned')).resolves.toBe(7);
    await expect(overview.countAssignments('inProgress')).resolves.toBe(7);
    await expect(overview.countAssignments('completed')).resolves.toBe(7);

    expect(fake.requests.map((r) => r.url.replace(FAKE_API_URL, ''))).toEqual([
      '/estudiantes?limit=1',
      '/revisiones/pendientes?limit=1',
      '/asignaciones?estado=ASIGNADO&limit=1',
      '/asignaciones?estado=EN_CURSO&limit=1',
      '/asignaciones?estado=COMPLETADO&limit=1',
    ]);
  });

  it('un total que no es un número es un error claro', async () => {
    const { overview } = overviewWith(() => jsonResponse(200, { items: [] }));

    await expect(overview.countStudents()).rejects.toThrow('total');
  });

  it('con la sesión de la directora, cuenta lo de toda la fundación', async () => {
    const tokens = createMemoryTokenStore();
    const repos = createHttpRepositories(
      createApiClient({
        baseUrl: FAKE_API_URL,
        getToken: tokens.get,
        fetchFn: createFakeBackend().fetchFn,
      }),
      tokens,
    );
    await repos.auth.signIn({
      email: 'directora@gameup.test',
      password: MOCK_PASSWORD,
    });

    await expect(repos.overview.countStudents()).resolves.toBe(4);
    await expect(repos.overview.countAssignments('completed')).resolves.toBe(1);
    await expect(repos.overview.countAssignments('inProgress')).resolves.toBe(
      4,
    );
  });
});
