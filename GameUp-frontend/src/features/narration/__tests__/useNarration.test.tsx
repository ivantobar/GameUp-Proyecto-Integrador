import { act, renderHook } from '@testing-library/react-native';
import type { Narrator } from '../narrator';
import { useNarration } from '../useNarration';

function fakeNarrator(): Narrator & { speak: jest.Mock; stop: jest.Mock } {
  return { speak: jest.fn(), stop: jest.fn() };
}

describe('useNarration', () => {
  it('lee el texto pedido', async () => {
    const narrator = fakeNarrator();
    const { result } = await renderHook(() => useNarration(narrator));
    await act(async () => {
      result.current.narrate('Toca un sonido para practicar');
    });
    expect(narrator.speak).toHaveBeenCalledWith(
      'Toca un sonido para practicar',
    );
  });

  it('se calla al salir de la pantalla', async () => {
    const narrator = fakeNarrator();
    const { unmount } = await renderHook(() => useNarration(narrator));
    await unmount();
    expect(narrator.stop).toHaveBeenCalled();
  });
});
