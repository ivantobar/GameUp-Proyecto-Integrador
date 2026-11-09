import { createApiClient } from '@/services/api';
import { ConnectionError } from '@/services/apiErrors';
import { createFakeBackend, FAKE_API_URL } from '@/test-utils/fakeBackend';
import {
  createFakeFetch,
  errorResponse,
  jsonResponse,
  type FakeHandler,
} from '@/test-utils/fakeFetch';
import { MOCK_PASSWORD, mockStudent, mockTeacher } from '../../mock/fixtures';
import { StudentAccessError, TeacherLinkError } from '../../studentErrors';
import { createHttpRepositories } from '../createHttpRepositories';
import { createHttpTeacherLinkRepository } from '../httpTeacherLinkRepository';
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
  const switchTo = (other: string) =>
    repos.auth.signIn({ email: other, password: MOCK_PASSWORD });
  return { repos, requests: backend.requests, switchTo };
}

/** Repositorio con un `fetch` que responde lo que diga `handler`. */
function respondingWith(handler: FakeHandler) {
  const fake = createFakeFetch(handler);
  const api = createApiClient({
    baseUrl: FAKE_API_URL,
    getToken: () => Promise.resolve('token-de-prueba'),
    fetchFn: fake.fetchFn,
  });
  return {
    repo: createHttpTeacherLinkRepository(api),
    requests: fake.requests,
  };
}

const problemOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error instanceof TeacherLinkError ? error.problem : error;
  }
  return 'sin error';
};

describe('talleristas a cargo con la API (directora)', () => {
  it('lista las de un estudiante, con el historial', async () => {
    const { repos, requests } = await signedIn('directora@gameup.test');

    const teachers =
      await repos.teacherLinks.listStudentTeachers('est-demo-004');

    expect(requests.at(-1)).toMatchObject({
      method: 'GET',
      url: `${FAKE_API_URL}/estudiantes/est-demo-004/talleristas`,
    });
    expect(teachers).toEqual([
      {
        teacherId: 'doc-demo-003',
        displayName: 'Carlos Pérez',
        since: '2026-03-10',
        active: false,
      },
    ]);
  });

  it('las talleristas activas salen de /usuarios (sin las inactivas)', async () => {
    const { repos, requests } = await signedIn('directora@gameup.test');

    const teachers = await repos.teacherLinks.listActiveTeachers();

    expect(requests.at(-1)?.url).toBe(
      `${FAKE_API_URL}/usuarios?rol=TALLERISTA&activo=true&page=1&limit=50`,
    );
    expect(teachers).toEqual([
      { id: mockTeacher.id, displayName: 'Profe Laura' },
      { id: 'doc-demo-002', displayName: 'Ana Gómez' },
      { id: 'doc-demo-003', displayName: 'Carlos Pérez' },
    ]);
  });

  it('pide todas las páginas y arma «nombre + primer apellido»', async () => {
    const usuario = (id: string) => ({
      id,
      rol: 'TALLERISTA',
      nombres: 'Ana María',
      apellidos: 'Gómez Ruiz',
      correo: null,
      activo: true,
    });
    const { repo, requests } = respondingWith(({ url }) => {
      const page = Number(new URL(url).searchParams.get('page'));
      return jsonResponse(200, {
        items:
          page === 1
            ? Array.from({ length: 50 }, (_, i) => usuario(String(i + 1)))
            : [usuario('51')],
        total: 51,
        page,
        limit: 50,
      });
    });

    const teachers = await repo.listActiveTeachers();

    expect(
      requests.map((r) => new URL(r.url).searchParams.get('page')),
    ).toEqual(['1', '2']);
    expect(teachers).toHaveLength(51);
    expect(teachers[0]).toEqual({ id: '1', displayName: 'Ana Gómez' });
  });

  it('asigna con el cuerpo exacto de AsignarTalleristaDto', async () => {
    const { repos, requests } = await signedIn('directora@gameup.test');

    const created = await repos.teacherLinks.assignTeacher(
      'est-demo-004',
      'doc-demo-002',
    );

    const post = requests.at(-1);
    expect(post?.method).toBe('POST');
    expect(post?.url).toBe(
      `${FAKE_API_URL}/estudiantes/est-demo-004/talleristas`,
    );
    expect(post?.body).toEqual({ talleristaId: 'doc-demo-002' });
    expect(created).toMatchObject({
      teacherId: 'doc-demo-002',
      displayName: 'Ana Gómez',
      active: true,
    });
  });

  it('quita con DELETE: queda en el historial y la tallerista deja de verlo', async () => {
    const { repos, requests, switchTo } = await signedIn(
      'directora@gameup.test',
    );

    const result = await repos.teacherLinks.removeTeacher(
      'est-demo-002',
      mockTeacher.id,
    );

    expect(result).toBe('removed');
    expect(requests.at(-1)).toMatchObject({
      method: 'DELETE',
      url: `${FAKE_API_URL}/estudiantes/est-demo-002/talleristas/${mockTeacher.id}`,
    });
    const list = await repos.teacherLinks.listStudentTeachers('est-demo-002');
    expect(list).toEqual([
      expect.objectContaining({ teacherId: mockTeacher.id, active: false }),
    ]);

    await switchTo('docente@gameup.test');
    await expect(
      repos.directory.getStudent('est-demo-002'),
    ).rejects.toBeInstanceOf(StudentAccessError);
  });

  it('DELETE 404 → «ya no estaba a cargo» (no es un error)', async () => {
    const { repos } = await signedIn('directora@gameup.test');

    // Carlos ya no tiene a Lucía: el backend responde 404.
    await expect(
      repos.teacherLinks.removeTeacher('est-demo-004', 'doc-demo-003'),
    ).resolves.toBe('notInCharge');

    const { repo } = respondingWith(() => errorResponse(404, 'No existe'));
    await expect(repo.removeTeacher('31', '12')).resolves.toBe('notInCharge');
  });
});

describe('errores de las talleristas', () => {
  it('POST 409 → alreadyInCharge (ya lo tiene a cargo)', async () => {
    const { repos } = await signedIn('directora@gameup.test');

    expect(
      await problemOf(
        repos.teacherLinks.assignTeacher(mockStudent.id, mockTeacher.id),
      ),
    ).toBe('alreadyInCharge');

    const { repo } = respondingWith(() => errorResponse(409, 'Conflicto'));
    expect(await problemOf(repo.assignTeacher('31', '12'))).toBe(
      'alreadyInCharge',
    );
  });

  it('POST 422 → notActiveTeacher (cuenta inactiva o que no es tallerista)', async () => {
    const { repos } = await signedIn('directora@gameup.test');

    // Rosa tiene la cuenta inactiva.
    expect(
      await problemOf(
        repos.teacherLinks.assignTeacher('est-demo-004', 'doc-demo-009'),
      ),
    ).toBe('notActiveTeacher');

    const { repo } = respondingWith(() => errorResponse(422, 'No'));
    expect(await problemOf(repo.assignTeacher('31', '12'))).toBe(
      'notActiveTeacher',
    );
  });

  it('el docente (403) → StudentAccessError en las cuatro operaciones', async () => {
    const { repos } = await signedIn('docente@gameup.test');
    const links = repos.teacherLinks;

    for (const call of [
      () => links.listStudentTeachers(mockStudent.id),
      () => links.listActiveTeachers(),
      () => links.assignTeacher(mockStudent.id, 'doc-demo-002'),
      () => links.removeTeacher(mockStudent.id, mockTeacher.id),
    ]) {
      await expect(call()).rejects.toBeInstanceOf(StudentAccessError);
    }
  });

  it('un estudiante que no existe (404 en GET o POST) → StudentAccessError', async () => {
    const { repos } = await signedIn('directora@gameup.test');

    await expect(
      repos.teacherLinks.listStudentTeachers('est-ajeno'),
    ).rejects.toBeInstanceOf(StudentAccessError);
    await expect(
      repos.teacherLinks.assignTeacher('est-ajeno', 'doc-demo-002'),
    ).rejects.toBeInstanceOf(StudentAccessError);
  });

  it('sin red sigue siendo un problema de conexión', async () => {
    const { repo } = respondingWith(() => {
      throw new TypeError('Network request failed');
    });

    expect(await problemOf(repo.assignTeacher('31', '12'))).toBeInstanceOf(
      ConnectionError,
    );
    await expect(repo.removeTeacher('31', '12')).rejects.toBeInstanceOf(
      ConnectionError,
    );
  });
});
