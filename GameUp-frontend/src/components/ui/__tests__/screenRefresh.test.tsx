import { render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { colors } from '@/theme';
import { Screen } from '../Screen';
import { HeaderBackButton, ScreenHeader } from '../ScreenHeader';
import type { ScreenRefresh } from '../types';

function refreshOf(overrides: Partial<ScreenRefresh> = {}): ScreenRefresh {
  return {
    onRefresh: jest.fn(),
    refreshing: false,
    pulling: false,
    failed: false,
    ...overrides,
  };
}

/** El `RefreshControl` que la pantalla le pasa a su ScrollView. */
const refreshControl = () =>
  (
    screen.getByTestId('screen-scroll').props as {
      refreshControl?: {
        props: {
          colors: string[];
          refreshing: boolean;
          onRefresh: () => void;
        };
      };
    }
  ).refreshControl;

describe('Screen: deslizar hacia abajo para recargar', () => {
  it('con `refresh`, el ScrollView tiene RefreshControl con el verde de la guía', async () => {
    const refresh = refreshOf({ pulling: true });
    await render(
      <Screen refresh={refresh}>
        <Text>Contenido</Text>
      </Screen>,
    );
    const control = refreshControl();
    expect(control?.props.colors).toEqual([colors.verde.oscuro]);
    expect(control?.props.refreshing).toBe(true);
    control?.props.onRefresh();
    expect(refresh.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('sin `refresh` (juegos, formularios), no se puede deslizar para recargar', async () => {
    await render(
      <Screen>
        <Text>Contenido</Text>
      </Screen>,
    );
    expect(refreshControl()).toBeUndefined();
  });

  it('si la recarga falla: aviso suave con reintentar, y el contenido sigue', async () => {
    const user = userEvent.setup();
    const refresh = refreshOf({ failed: true });
    await render(
      <Screen refresh={refresh}>
        <Text>Martín C.</Text>
      </Screen>,
    );
    expect(screen.getByText('No pudimos actualizar')).toBeOnTheScreen();
    expect(screen.getByText('Martín C.')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(refresh.onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('ScreenHeader: botón «Actualizar» (adultos)', () => {
  it('tiene etiqueta para TalkBack y recarga al tocarlo', async () => {
    const user = userEvent.setup();
    const refresh = refreshOf();
    await render(<ScreenHeader title="Por escuchar" refresh={refresh} />);
    await user.press(screen.getByRole('button', { name: 'Actualizar' }));
    expect(refresh.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('mientras recarga queda deshabilitado: un toque no manda otra petición', async () => {
    const user = userEvent.setup();
    const refresh = refreshOf({ refreshing: true });
    await render(<ScreenHeader title="Por escuchar" refresh={refresh} />);
    const button = screen.getByRole('button', { name: 'Actualizando' });
    expect(button).toBeDisabled();
    await user.press(button);
    expect(refresh.onRefresh).not.toHaveBeenCalled();
  });

  it('sin «Volver», va a la izquierda (la derecha queda para «Cerrar sesión»)', async () => {
    await render(
      <ScreenHeader
        title="Resumen"
        refresh={refreshOf()}
        right={<Text>Salir</Text>}
      />,
    );
    expect(screen.getByTestId('screen-header-left')).toContainElement(
      screen.getByTestId('header-refresh'),
    );
  });

  it('con «Volver», va a la derecha', async () => {
    await render(
      <ScreenHeader
        left={<HeaderBackButton onPress={jest.fn()} />}
        title="Estudiante"
        refresh={refreshOf()}
      />,
    );
    expect(screen.getByTestId('screen-header-right')).toContainElement(
      screen.getByTestId('header-refresh'),
    );
  });

  it('sin `refresh` (pantallas del niño), no hay botón', async () => {
    await render(<ScreenHeader title="Juegos" />);
    expect(screen.queryByTestId('header-refresh')).toBeNull();
  });
});
