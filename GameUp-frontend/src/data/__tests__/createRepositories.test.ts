import { parseDataSource } from '@/config/env';
import { createRepositories } from '../createRepositories';
import { NotConnectedYetError } from '../http/notConnectedRepositories';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

describe('EXPO_PUBLIC_DATA_SOURCE', () => {
  it.each([
    [undefined, 'mock'],
    ['', 'mock'],
    ['mock', 'mock'],
    ['otra-cosa', 'mock'],
    ['api', 'api'],
    [' API ', 'api'],
  ])('%p → %s', (value, expected) => {
    expect(parseDataSource(value)).toBe(expected);
  });
});

describe('punto de composición', () => {
  it('con mock, los datos simulados responden sin backend', async () => {
    const repos = createRepositories({
      dataSource: 'mock',
      onSessionExpired: jest.fn(),
    });
    const pending = repos.practice.getVowelPractice('x');
    await jest.runAllTimersAsync();
    await expect(pending).resolves.toHaveLength(5);
  });

  it('con api, lo que aún no está conectado lo dice en vez de inventar datos', async () => {
    const repos = createRepositories({
      dataSource: 'api',
      onSessionExpired: jest.fn(),
    });
    await expect(repos.guardians.getWeeklyPractice('x')).rejects.toBeInstanceOf(
      NotConnectedYetError,
    );
  });

  it('con api y sin sesión, pedir datos vuelve a «Iniciar sesión»', async () => {
    const onSessionExpired = jest.fn();
    const repos = createRepositories({ dataSource: 'api', onSessionExpired });

    await expect(repos.students.getCurrentStudent()).rejects.toThrow();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
