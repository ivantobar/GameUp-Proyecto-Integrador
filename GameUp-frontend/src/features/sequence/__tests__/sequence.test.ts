import { sequenceRoutines } from '@/data/mock/gameContent';
import { prepareRoutines, sequenceQuestion } from '../useSequenceGame';

describe('Secuenciar', () => {
  it('los pasos nunca se muestran ya ordenados', () => {
    // Con esta función, la mezcla deja la lista igual: debe reordenarse.
    const [routine] = prepareRoutines(sequenceRoutines, () => 0.999);
    if (!routine) throw new Error('Falta la rutina');
    expect(routine.shuffled.map((s) => s.id)).not.toEqual(
      routine.steps.map((s) => s.id),
    );
    const ids = (steps: { id: string }[]) => steps.map((s) => s.id).sort();
    expect(ids(routine.shuffled)).toEqual(ids(routine.steps));
  });

  it('la pregunta dice qué paso falta', () => {
    expect(sequenceQuestion(0, 4)).toBe('¿Qué va primero?');
    expect(sequenceQuestion(1, 4)).toBe('¿Qué va después?');
    expect(sequenceQuestion(3, 4)).toBe('¿Qué va al final?');
  });
});
