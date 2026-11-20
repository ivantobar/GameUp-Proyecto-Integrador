import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { VowelsDoneMeter } from '@/features/speak/components/VowelsDoneMeter';
import { colors } from '@/theme';
import { AA, contrastRatio } from '@/theme/contrast';
import { InitialsAvatar } from '../InitialsAvatar';
import { NumberedSteps } from '../NumberedSteps';

/**
 * Con letra grande (130 % a 200 %) el texto crece: un recuadro de alto o
 * ancho FIJO lo cortaría. Los recuadros con texto usan mínimos.
 */
type Style = Record<string, unknown>;
interface HostNode {
  props: { style?: unknown };
  parent: HostNode | null;
}
const flat = (node: HostNode): Style =>
  (StyleSheet.flatten(node.props.style as never) ?? {}) as Style;

/** El recuadro que envuelve a un texto (su padre directo con estilo). */
function boxOf(text: string): Style {
  let node = (
    screen.getByText(text, {
      includeHiddenElements: true,
    }) as unknown as HostNode
  ).parent;
  while (node && Object.keys(flat(node)).length === 0) node = node.parent;
  return node ? flat(node) : {};
}

function expectGrows(box: Style) {
  expect(box.height).toBeUndefined();
  expect(box.width).toBeUndefined();
  expect(box.minHeight).toEqual(expect.any(Number));
  expect(box.minWidth).toEqual(expect.any(Number));
}

describe('recuadros con texto: crecen con la letra grande', () => {
  it('iniciales', async () => {
    await render(<InitialsAvatar initials="mc" />);
    expectGrows(boxOf('MC'));
  });

  it('número de cada paso', async () => {
    await render(<NumberedSteps steps={['Mírense al espejo']} />);
    expectGrows(boxOf('1'));
  });

  it('vocales terminadas de Habla conmigo', async () => {
    await render(
      <VowelsDoneMeter
        vowels={[
          { vowel: 'a', stars: 3 },
          { vowel: 'e', stars: 0 },
        ]}
      />,
    );
    expectGrows(boxOf('A'));
    expectGrows(boxOf('E'));
  });

  it('el borde de la vocal pendiente se ve sobre blanco (gráficos ≥ 3:1)', () => {
    expect(
      contrastRatio(colors.texto.secundario, colors.superficie.blanca),
    ).toBeGreaterThanOrEqual(AA.graphic);
  });
});
