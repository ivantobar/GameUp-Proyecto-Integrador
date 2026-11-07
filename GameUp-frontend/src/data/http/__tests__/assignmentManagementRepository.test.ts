import { createApiClient } from '@/services/api';
import { ConnectionError } from '@/services/apiErrors';
import { createFakeBackend, FAKE_API_URL } from '@/test-utils/fakeBackend';
import {
  createFakeFetch,
  errorResponse,
  type FakeHandler,
} from '@/test-utils/fakeFetch';
import { MOCK_PASSWORD, mockStudent } from '../../mock/fixtures';
import { AssignmentError, StudentAccessError } from '../../studentErrors';
import { createHttpRepositories } from '../createHttpRepositories';
import { createHttpAssignmentManagementRepository } from '../httpAssignmentManagementRepository';
import { createMemoryTokenStore } from '../tokenStore';

/** Repositorios HTTP contra el backend falso, con sesión de `email`. */
async function signedIn(email: string) {
  const backend = createFakeBackend();
  const tokens = createMemoryTokenStore();
  const api = createApiClient({
    baseUrl: FAKE_API_URL,
    getToken: tokens.get,
    fetchFn: backend.fetchFn,
  });
  const repos = createHttpRepositories(api, tokens);
  await repos.auth.signIn({ email, password: MOCK_PASSWORD });
  return { repos, requests: backend.requests };
}

/** Repositorio con un `fetch` que responde siempre lo mismo. */
function respondingWith(handler: FakeHandler) {
  const fake = createFakeFetch(handler);
  const api = createApiClient({
    baseUrl: FAKE_API_URL,
    getToken: () => Promise.resolve('token-de-prueba'),
    fetchFn: fake.fetchFn,
  });
  return createHttpAssignmentManagementRepository(api);
}

const problemOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error instanceof AssignmentError ? error.problem : error;
  }
  return 'sin error';
};

describe('asignaciones con la API (tallerista)', () => {
  it('lista sus estudiantes y el progreso oficial de cada uno', async () => {
    const { repos } = await signedIn('docente@gameup.test');

    const students = await repos.directory.listStudents();
    expect(students.map((s) => s.id)).toEqual([
      mockStudent.id,
      'est-demo-002',
      'est-demo-003',
    ]);
    const progress = await repos.directory.getStudentProgress(mockStudent.id);
    expect(progress.modules.length).toBeGreaterThan(0);
  });

  it('solo ofrece módulos publicados (pide ?publicado=true)', async () => {
    const { repos, requests } = await signedIn('docente@gameup.test');

    const modules = await repos.assignmentManagement.listAssignableModules();

    expect(modules.map((m) => m.id)).not.toContain('draft-syllables');
    expect(requests.at(-1)?.url).toBe(
      `${FAKE_API_URL}/modulos?publicado=true&limit=50`,
    );
  });

  it('asigna con el cuerpo exacto de CrearAsignacionDto', async () => {
    const { repos, requests } = await signedIn('docente@gameup.test');

    const created = await repos.assignmentManagement.assign({
      moduleId: 'routines',
      studentId: 'est-demo-003',
      suggestedDate: '2099-01-15',
    });

    const post = requests.at(-1);
    expect(post?.method).toBe('POST');
    expect(post?.url).toBe(`${FAKE_API_URL}/asignaciones`);
    expect(post?.body).toEqual({
      moduloId: 'routines',
      estudianteId: 'est-demo-003',
      fechaSugerida: '2099-01-15',
    });
    expect(created).toMatchObject({
      moduleId: 'routines',
      state: 'assigned',
      progress: 0,
      suggestedDate: '2099-01-15',
    });
    const list =
      await repos.assignmentManagement.listForStudent('est-demo-003');
    expect(list.map((a) => a.moduleId)).toEqual(['routines']);
  });

  it('asignar dos veces el mismo módulo sin terminar → alreadyAssigned (409)', async () => {
    const { repos } = await signedIn('docente@gameup.test');

    expect(
      await problemOf(
        repos.assignmentManagement.assign({
          moduleId: 'letters',
          studentId: mockStudent.id,
        }),
      ),
    ).toBe('alreadyAssigned');
  });

  it('un módulo sin publicar o una fecha pasada → notAssignable (422)', async () => {
    const { repos } = await signedIn('docente@gameup.test');

    expect(
      await problemOf(
        repos.assignmentManagement.assign({
          moduleId: 'draft-syllables',
          studentId: 'est-demo-003',
        }),
      ),
    ).toBe('notAssignable');
    expect(
      await problemOf(
        repos.assignmentManagement.assign({
          moduleId: 'routines',
          studentId: 'est-demo-003',
          suggestedDate: '2020-01-01',
        }),
      ),
    ).toBe('notAssignable');
  });

  it('quita una asignación sin intentos (DELETE)', async () => {
    const { repos, requests } = await signedIn('docente@gameup.test');

    await repos.assignmentManagement.remove('asig-demo-004');

    expect(requests.at(-1)).toMatchObject({
      method: 'DELETE',
      url: `${FAKE_API_URL}/asignaciones/asig-demo-004`,
    });
    const list = await repos.assignmentManagement.listForStudent(
      mockStudent.id,
    );
    expect(list.map((a) => a.id)).not.toContain('asig-demo-004');
  });

  it('quitar una que ya empezó → hasAttempts (409 en DELETE)', async () => {
    const { repos } = await signedIn('docente@gameup.test');

    expect(
      await problemOf(repos.assignmentManagement.remove('asig-demo-001')),
    ).toBe('hasAttempts');
  });

  it('un estudiante ajeno → StudentAccessError (404)', async () => {
    const { repos } = await signedIn('docente@gameup.test');

    await expect(
      repos.directory.getStudent('est-ajeno'),
    ).rejects.toBeInstanceOf(StudentAccessError);
  });
});

describe('permisos: el backend decide', () => {
  it('el acudiente no puede asignar → notAllowed (403)', async () => {
    const { repos } = await signedIn('acudiente@gameup.test');

    expect(
      await problemOf(
        repos.assignmentManagement.assign({
          moduleId: 'letters',
          studentId: mockStudent.id,
        }),
      ),
    ).toBe('notAllowed');
    expect(
      await problemOf(repos.assignmentManagement.listAssignableModules()),
    ).toBe('notAllowed');
  });
});

describe('el 409 depende del endpoint', () => {
  const conflict = respondingWith(() => errorResponse(409, 'Conflicto'));

  it('POST /asignaciones 409 → alreadyAssigned', async () => {
    expect(
      await problemOf(conflict.assign({ moduleId: '3', studentId: '31' })),
    ).toBe('alreadyAssigned');
  });

  it('DELETE /asignaciones/:id 409 → hasAttempts', async () => {
    expect(await problemOf(conflict.remove('12'))).toBe('hasAttempts');
  });

  it.each([
    [400, 'invalid'],
    [403, 'notAllowed'],
    [404, 'notFound'],
    [422, 'notAssignable'],
  ])('POST %i → %s', async (status, problem) => {
    const repo = respondingWith(() => errorResponse(status, 'No'));
    expect(
      await problemOf(repo.assign({ moduleId: '3', studentId: '31' })),
    ).toBe(problem);
  });

  it('sin red sigue siendo un problema de conexión', async () => {
    const repo = respondingWith(() => {
      throw new TypeError('Network request failed');
    });
    expect(
      await problemOf(repo.assign({ moduleId: '3', studentId: '31' })),
    ).toBeInstanceOf(ConnectionError);
  });
});
