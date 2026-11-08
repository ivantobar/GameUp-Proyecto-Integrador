import { Text } from 'react-native';
import { act, screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import DirectorTabsLayout from '@/app/director/(tabs)/_layout';
import DirectorLayout from '@/app/director/_layout';

// Cargar el router real la primera vez puede tardar más de 30 s.
jest.setTimeout(90000);

const stub = (label: string) =>
  function StubScreen() {
    return <Text>{label}</Text>;
  };

async function renderDirector() {
  await renderRouter(
    {
      'director/_layout': DirectorLayout,
      'director/(tabs)/_layout': DirectorTabsLayout,
      'director/(tabs)/index': stub('pantalla Estudiantes'),
      'director/(tabs)/review': stub('pantalla Por validar'),
      'director/(tabs)/summary': stub('pantalla Resumen'),
    },
    { initialUrl: '/director' },
  );
  await act(async () => {
    await jest.runOnlyPendingTimersAsync();
  });
}

describe('pestañas de la directora', () => {
  it('/director abre «Estudiantes» y la barra lleva a las otras dos', async () => {
    const user = userEvent.setup();
    await renderDirector();

    expect(screen.getByText('pantalla Estudiantes')).toBeOnTheScreen();

    await user.press(screen.getByRole('tab', { name: 'Por validar' }));
    expect(screen.getByText('pantalla Por validar')).toBeOnTheScreen();

    await user.press(screen.getByRole('tab', { name: 'Resumen' }));
    expect(screen.getByText('pantalla Resumen')).toBeOnTheScreen();
  });
});
