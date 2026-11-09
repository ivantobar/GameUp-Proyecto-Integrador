import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { createMockRepositories } from '@/data/mock/createMockRepositories';
import type { Repositories } from '@/data/repositories';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import { useGameList } from '@/features/games/useGameList';
import { useVowelSelection } from '@/features/speak/useVowelSelection';
import { useProgressOverview } from '@/features/progress/useProgressOverview';
import { useStudentHome } from '../useStudentHome';

function wrapperWith(repositories: Repositories) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RepositoryProvider repositories={repositories}>
        {children}
      </RepositoryProvider>
    );
  };
}

const wrapper = wrapperWith(createMockRepositories({ delayMs: 0 }));

/**
 * Los hooks solo dependen de las interfaces de repositorio: aquí se les
 * inyectan los datos simulados y se comprueba lo que muestran los mockups.
 */
describe('datos del estudiante con los repositorios simulados', () => {
  it('Inicio: saludo, tareas, «Sigue donde ibas» y accesos', async () => {
    const { result } = await renderHook(() => useStudentHome(), { wrapper });
    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;

    const data = result.current.resource.data;
    expect(data.student.displayName).toBe('Martín');
    expect(data.pendingCount).toBe(2);
    expect(data.resume).toEqual({ gameId: 'speak', vowel: 'o' });
    expect(data.newAssignment?.game.title).toBe('Busca la boca');
    expect(data.gamesCount).toBe(6);
    expect(data.modulesCount).toBe(4);
  });

  it('Juegos: las tareas van aparte (por módulo) y los juegos sin «Tarea»', async () => {
    const { result } = await renderHook(() => useGameList(), { wrapper });
    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;

    const { sections } = result.current.resource.data;
    const [thinking, sounds] = sections;
    expect(thinking?.id).toBe('thinking');
    expect(sounds?.items.map((i) => [i.game.id, i.badge])).toEqual([
      ['speak', 'Nuevo'],
      ['findMouth', 'Nuevo'],
    ]);
    expect(thinking?.items).toHaveLength(4);
    // Escalera: los juegos de pensar traen su nivel; los de habla, no.
    expect(sounds?.items.map((i) => i.level)).toEqual([null, null]);
    expect(thinking?.items.map((i) => i.level?.level)).toEqual([1, 1, 1, 1]);
  });

  it('Selección: vocales en orden y «3 de 5» practicadas', async () => {
    const { result } = await renderHook(() => useVowelSelection(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;

    const data = result.current.resource.data;
    expect(data.vowels.map((v) => v.vowel)).toEqual(['a', 'e', 'i', 'o', 'u']);
    expect(data.practicedCount).toBe(3);
    expect(data.total).toBe(5);
  });

  it('Mi progreso: porcentaje por tema con solo lo validado', async () => {
    const { result } = await renderHook(() => useProgressOverview(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;

    const data = result.current.resource.data;
    expect(data.modules.map((m) => [m.module.title, m.percent])).toEqual([
      ['Colores', 80],
      ['Números', 55],
      ['Letras', 10],
      ['Cuentos', 0],
    ]);
    // Lo pendiente de validación se informa aparte y no suma.
    expect(data.pendingValidation).toBe(1);
  });

  // Módulos dinámicos (decisión de la fase 2a): se muestran los que llegan,
  // no una lista fija. Antes, un tema sin datos aparecía en 0 %.
  it('Mi progreso: solo muestra los temas que llegan, con su nombre', async () => {
    const repositories = createMockRepositories({ delayMs: 0 });
    repositories.progress.getOfficialProgress = () =>
      Promise.resolve({
        modules: [
          { moduleId: 'colors', title: 'Colores', validated: 3, total: 4 },
          { moduleId: '7', title: 'vocales de prueba', validated: 0, total: 7 },
        ],
        pendingValidation: 0,
      });
    const { result } = await renderHook(() => useProgressOverview(), {
      wrapper: wrapperWith(repositories),
    });
    await waitFor(() => expect(result.current.resource.status).toBe('ready'));
    if (result.current.resource.status !== 'ready') return;

    const modules = result.current.resource.data.modules;
    expect(modules.map((m) => [m.module.title, m.percent])).toEqual([
      ['Colores', 75],
      ['vocales de prueba', 0],
    ]);
    // Un tema que no está en el catálogo usa sus dos primeras letras.
    expect(modules[0]?.module.symbol).toEqual({
      kind: 'icon',
      icon: 'palette',
    });
    expect(modules[1]?.module.symbol).toEqual({ kind: 'text', text: 'Vo' });
  });

  it('si los datos no llegan, queda en error y se puede reintentar', async () => {
    const failing = createMockRepositories({ delayMs: 0 });
    failing.students.getCurrentStudent = () =>
      Promise.reject(new Error('sin conexión'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = await renderHook(() => useStudentHome(), {
      wrapper: wrapperWith(failing),
    });
    await waitFor(() => expect(result.current.resource.status).toBe('error'));
    warn.mockRestore();
  });
});
