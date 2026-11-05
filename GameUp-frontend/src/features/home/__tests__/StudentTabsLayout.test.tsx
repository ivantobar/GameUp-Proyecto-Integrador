import { Text } from 'react-native';
import { act, screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import StudentTabsLayout from '@/app/student/(tabs)/_layout';

/**
 * SDK 58: si el layout no declara sus pantallas, Expo Router no dibuja nada
 * (pantalla en blanco al entrar como estudiante). Se prueba con el router
 * real y pantallas de relleno.
 */
const stub = (label: string) =>
  function StubScreen() {
    return <Text>{label}</Text>;
  };

async function renderStudentTabs(initialUrl = '/') {
  await renderRouter(
    {
      _layout: StudentTabsLayout,
      index: stub('pantalla Inicio'),
      games: stub('pantalla Juegos'),
      progress: stub('pantalla Progreso'),
    },
    { initialUrl },
  );
  await act(async () => {
    await jest.runOnlyPendingTimersAsync();
  });
}

describe('pestañas del estudiante', () => {
  it('muestra Inicio al entrar', async () => {
    await renderStudentTabs();

    expect(screen.getByText('pantalla Inicio')).toBeOnTheScreen();
  });

  it('la barra inferior lleva a Juegos y a Progreso', async () => {
    const user = userEvent.setup();
    await renderStudentTabs();

    await user.press(screen.getByRole('tab', { name: 'Juegos' }));
    expect(screen.getByText('pantalla Juegos')).toBeOnTheScreen();

    await user.press(screen.getByRole('tab', { name: 'Progreso' }));
    expect(screen.getByText('pantalla Progreso')).toBeOnTheScreen();
  });
});
