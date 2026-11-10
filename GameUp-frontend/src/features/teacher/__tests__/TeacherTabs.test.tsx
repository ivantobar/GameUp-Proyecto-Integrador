import { Text } from 'react-native';
import { act, screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import TeacherTabsLayout from '@/app/teacher/(tabs)/_layout';
import TeacherLayout from '@/app/teacher/_layout';

// Cargar el router real la primera vez puede tardar más de 30 s.
jest.setTimeout(90000);

const stub = (label: string) =>
  function StubScreen() {
    return <Text>{label}</Text>;
  };

async function renderTeacher(initialUrl: string) {
  await renderRouter(
    {
      'teacher/_layout': TeacherLayout,
      'teacher/(tabs)/_layout': TeacherTabsLayout,
      'teacher/(tabs)/index': stub('pantalla Por revisar'),
      'teacher/(tabs)/students': stub('pantalla Mis estudiantes'),
      'teacher/student/[id]/index': stub('pantalla detalle'),
    },
    { initialUrl },
  );
  await act(async () => {
    await jest.runOnlyPendingTimersAsync();
  });
}

describe('pestañas del docente', () => {
  it('/teacher sigue abriendo «Por revisar»', async () => {
    await renderTeacher('/teacher');

    expect(screen.getByText('pantalla Por revisar')).toBeOnTheScreen();
    expect(
      screen.getByRole('tab', { name: 'Por revisar', selected: true }),
    ).toBeOnTheScreen();
  });

  it('la barra lleva a «Mis estudiantes»', async () => {
    const user = userEvent.setup();
    await renderTeacher('/teacher');

    await user.press(screen.getByRole('tab', { name: 'Mis estudiantes' }));

    expect(screen.getByText('pantalla Mis estudiantes')).toBeOnTheScreen();
  });
});
