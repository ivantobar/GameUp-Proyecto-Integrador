import { countPracticed, practiceLevel } from '../practice';

describe('nivel de práctica', () => {
  it('0 estrellas: sin practicar; 1 o 2: en curso; 3: practicada', () => {
    expect(practiceLevel(0)).toBe('notPracticed');
    expect(practiceLevel(1)).toBe('inProgress');
    expect(practiceLevel(2)).toBe('inProgress');
    expect(practiceLevel(3)).toBe('practiced');
  });

  it('cuenta solo las vocales con 3 estrellas («Llevas 3 de 5»)', () => {
    expect(
      countPracticed([
        { vowel: 'a', stars: 3 },
        { vowel: 'e', stars: 3 },
        { vowel: 'i', stars: 3 },
        { vowel: 'o', stars: 1 },
        { vowel: 'u', stars: 0 },
      ]),
    ).toBe(3);
  });
});
