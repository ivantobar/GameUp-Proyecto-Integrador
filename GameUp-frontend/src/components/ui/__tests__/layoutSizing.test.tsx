import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { NarrationButton } from '@/components/gameup';
import { colors, depth, sizes } from '@/theme';
import { Button } from '../Button';
import { PressableCard } from '../Card';
import { FilterChip } from '../FilterChip';
import { IconButton } from '../IconButton';
import { PressableSurface } from '../PressableSurface';
import { HeaderBackButton, ScreenHeader } from '../ScreenHeader';

/**
 * Regresión del error de la Fase 1: dentro del encabezado o del pie (zonas
 * sin alto fijo), una vista con `flexGrow` crece hasta llenar la pantalla
 * (así lo calcula Yoga en Android) y el contenido desaparece. Jest no
 * calcula el layout, así que estas pruebas revisan los estilos que lo
 * provocan.
 */

type Style = Record<string, unknown>;
interface HostNode {
  props: { style?: unknown };
  children: (HostNode | string)[];
}

const host = (node: unknown) => node as HostNode;
const flat = (node: HostNode): Style =>
  (StyleSheet.flatten(node.props.style as never) ?? {}) as Style;

/** La vista y todas las que tiene dentro. */
function descendants(node: HostNode): HostNode[] {
  const kids = node.children.filter(
    (child): child is HostNode => typeof child !== 'string',
  );
  return [node, ...kids.flatMap(descendants)];
}

/** ¿La vista crece? (`flex` o `flexGrow` positivos). */
const grows = (style: Style) =>
  Number(style.flex ?? 0) > 0 || Number(style.flexGrow ?? 0) > 0;

const noneGrows = (node: HostNode) =>
  descendants(node).every((child) => !grows(flat(child)));

describe('IconButton tiene siempre su tamaño (no se estira)', () => {
  it.each(['sm', 'md', 'lg'] as const)(
    'tamaño %s: mide su diámetro más el relieve, y nada dentro crece',
    async (size) => {
      await render(
        <IconButton
          icon="speaker"
          accessibilityLabel="Oír"
          size={size}
          onPress={jest.fn()}
        />,
      );
      const diameter = sizes.iconButton[size];
      const button = host(screen.getByRole('button', { name: 'Oír' }));

      expect(flat(button)).toMatchObject({
        width: diameter,
        height: diameter + depth.sm,
      });
      // La cara (el círculo) también tiene ancho y alto fijos.
      expect(
        descendants(button).some((node) => {
          const style = flat(node);
          return style.width === diameter && style.height === diameter;
        }),
      ).toBe(true);
      expect(noneGrows(button)).toBe(true);
    },
  );

  it('deshabilitado conserva el mismo tamaño', async () => {
    await render(
      <IconButton
        icon="logout"
        accessibilityLabel="Cerrar sesión"
        disabled
        onPress={jest.fn()}
      />,
    );
    const button = host(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(flat(button)).toMatchObject({
      width: sizes.iconButton.md,
      height: sizes.iconButton.md + depth.sm,
    });
  });
});

describe('el encabezado mide lo que su contenido', () => {
  it('ni la fila ni sus lados usan flex; solo el centro crece, a lo ancho', async () => {
    await render(
      <ScreenHeader
        left={<HeaderBackButton onPress={jest.fn()} />}
        title="Juegos"
        right={
          <View style={styles.pair}>
            <IconButton
              icon="logout"
              variant="soft"
              accessibilityLabel="Cerrar sesión"
              onPress={jest.fn()}
            />
            <NarrationButton text="Hola" />
          </View>
        }
      />,
    );
    const row = host(screen.getByTestId('screen-header'));
    expect(flat(row).flexDirection).toBe('row');
    expect(grows(flat(row))).toBe(false);
    for (const side of ['screen-header-left', 'screen-header-right']) {
      expect(grows(flat(host(screen.getByTestId(side))))).toBe(false);
    }
    // El centro es flexible, pero dentro de una fila: crece a lo ancho.
    expect(flat(host(screen.getByTestId('screen-header-center'))).flex).toBe(1);

    // Ningún botón del encabezado (volver, parlante, salir) crece.
    for (const name of ['Volver', 'Oír la instrucción', 'Cerrar sesión']) {
      expect(noneGrows(host(screen.getByRole('button', { name })))).toBe(true);
    }
  });
});

describe('ninguna superficie crece si no se le pide (`fill`)', () => {
  it('Button, Button grande deshabilitado y FilterChip', async () => {
    await render(
      <>
        <Button label="Uno" onPress={jest.fn()} />
        <Button label="Dos" size="large" disabled onPress={jest.fn()} />
        <FilterChip label="Tres" selected onPress={jest.fn()} />
      </>,
    );
    for (const name of ['Uno', 'Dos', 'Tres']) {
      expect(noneGrows(host(screen.getByRole('button', { name })))).toBe(true);
    }
  });

  it('PressableSurface: sin fill no crece; con fill, sí', async () => {
    const palette = {
      background: colors.superficie.blanca,
      pressedBackground: colors.superficie.blanca,
      border: colors.borde.suave,
      pressedBorder: colors.borde.suave,
      edge: colors.relieve.superficie,
    } as const;
    await render(
      <>
        <PressableSurface
          colors={palette}
          accessibilityLabel="Sin fill"
          radius={8}
          borderWidth={1}
          onPress={jest.fn()}
        >
          <Text>a</Text>
        </PressableSurface>
        <PressableSurface
          colors={palette}
          accessibilityLabel="Con fill"
          radius={8}
          borderWidth={1}
          fill
          onPress={jest.fn()}
        >
          <Text>b</Text>
        </PressableSurface>
      </>,
    );
    expect(
      noneGrows(host(screen.getByRole('button', { name: 'Sin fill' }))),
    ).toBe(true);
    expect(
      noneGrows(host(screen.getByRole('button', { name: 'Con fill' }))),
    ).toBe(false);
  });

  it('el relieve reserva su espacio también deshabilitado (sin saltos)', async () => {
    await render(
      <>
        <Button label="Activo" size="large" onPress={jest.fn()} />
        <Button label="Inactivo" size="large" disabled onPress={jest.fn()} />
      </>,
    );
    const paddings = ['Activo', 'Inactivo'].map((name) =>
      descendants(host(screen.getByRole('button', { name })))
        .map((node) => flat(node).paddingBottom)
        .find((value) => value !== undefined),
    );
    expect(paddings).toEqual([depth.md, depth.md]);
  });

  it('PressableCard sigue llenando su espacio (tarjetas en fila)', async () => {
    await render(
      <PressableCard accessibilityLabel="Tarjeta" onPress={jest.fn()}>
        <Text>c</Text>
      </PressableCard>,
    );
    expect(
      noneGrows(host(screen.getByRole('button', { name: 'Tarjeta' }))),
    ).toBe(false);
  });
});

const styles = StyleSheet.create({
  pair: {
    flexDirection: 'row',
  },
});
