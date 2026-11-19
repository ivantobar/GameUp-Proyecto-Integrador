import { createRepositories } from '../createRepositories';
import { createSessionExpiry } from '../sessionExpiry';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

describe('la sesión terminó: se avisa una sola vez', () => {
  it('varios avisos seguidos llevan a «Iniciar sesión» una vez', () => {
    const onExpired = jest.fn();
    const expiry = createSessionExpiry(onExpired);

    expiry.notify();
    expiry.notify();
    expiry.notify();

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('con una sesión nueva, el siguiente 401 vuelve a avisar', () => {
    const onExpired = jest.fn();
    const expiry = createSessionExpiry(onExpired);

    expiry.notify();
    expiry.reset();
    expiry.notify();

    expect(onExpired).toHaveBeenCalledTimes(2);
  });

  it('con la API: varias peticiones sin sesión a la vez, una sola redirección', async () => {
    const onSessionExpired = jest.fn();
    const repos = createRepositories({ dataSource: 'api', onSessionExpired });

    const results = await Promise.allSettled([
      repos.students.getCurrentStudent(),
      repos.practice.getVowelPractice('x'),
      repos.guardians.listStudents('x'),
    ]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
