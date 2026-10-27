import { act, renderHook } from '@testing-library/react-native';
import { matchRounds } from '@/data/mock/gameContent';
import { prepareMatchRounds, useMatchGame } from '../useMatchGame';

describe('Emparejar', () => {
  it('mezcla las opciones sin perder ninguna', () => {
    const [round] = prepareMatchRounds(matchRounds, () => 0);
    const [original] = matchRounds;
    if (!round || !original) throw new Error('Falta la ronda');
    expect(round.options.map((o) => o.id).sort()).toEqual(
      original.options.map((o) => o.id).sort(),
    );
  });

  it('equivocarse muestra la pista; acertar habilita «Siguiente»', async () => {
    const onFinish = jest.fn();
    const { result } = await renderHook(() => useMatchGame(onFinish));
    const round = result.current.round;
    if (!round) throw new Error('Falta la ronda');
    const wrong = round.options.find((o) => o.id !== round.answerId);
    if (!wrong) throw new Error('Falta un distractor');

    await act(async () => result.current.choose(wrong.id));
    expect(result.current.phase).toBe('hinted');

    await act(async () => result.current.choose(round.answerId));
    expect(result.current.phase).toBe('solved');

    await act(async () => result.current.next());
    expect(result.current.index).toBe(1);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('al terminar la última ronda llama a onFinish', async () => {
    const onFinish = jest.fn();
    const { result } = await renderHook(() => useMatchGame(onFinish));
    for (let i = 0; i < result.current.total; i += 1) {
      const answer = result.current.round?.answerId ?? '';
      await act(async () => result.current.choose(answer));
      await act(async () => result.current.next());
    }
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
