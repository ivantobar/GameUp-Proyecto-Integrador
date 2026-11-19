import { render, screen } from '@testing-library/react-native';
import DevLayout from '@/app/dev/_layout';

jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual('react-native');
  return {
    Redirect: ({ href }: { href: string }) => (
      <MockText>{`redirige a ${href}`}</MockText>
    ),
    Stack: () => <MockText>rutas de desarrollo</MockText>,
  };
});
jest.mock('@/features/motion/useStackScreenOptions', () => ({
  useStackScreenOptions: () => ({}),
}));

const globals = globalThis as unknown as { __DEV__: boolean };

describe('rutas /dev', () => {
  const original = globals.__DEV__;

  afterEach(() => {
    globals.__DEV__ = original;
  });

  it('en una versión publicada llevan a «Iniciar sesión»', async () => {
    globals.__DEV__ = false;

    await render(<DevLayout />);

    expect(screen.getByText('redirige a /login')).toBeOnTheScreen();
    expect(screen.queryByText('rutas de desarrollo')).toBeNull();
  });

  it('en desarrollo se pueden abrir', async () => {
    globals.__DEV__ = true;

    await render(<DevLayout />);

    expect(screen.getByText('rutas de desarrollo')).toBeOnTheScreen();
  });
});
