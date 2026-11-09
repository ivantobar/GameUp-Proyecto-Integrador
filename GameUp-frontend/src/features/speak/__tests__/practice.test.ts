import {
  countPracticed,
  practiceLevel,
  speakSelectionNarration,
  vowelsDoneAccessibilityLabel,
  vowelsDoneLabel,
} from '../practice';

describe('nivel de práctica', () => {
  it('0 estrellas: sin practicar; 1 o 2: en curso; 3: practicada', () => {
    expect(practiceLevel(0)).toBe('notPracticed');
    expect(practiceLevel(1)).toBe('inProgress');
    expect(practiceLevel(2)).toBe('inProgress');
    expect(practiceLevel(3)).toBe('practiced');
  });

  it('cuenta solo las vocales con 3 estrellas («Vocales terminadas: 3 de 5»)', () => {
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

describe('medidor «Vocales terminadas»', () => {
  const two = [
    { vowel: 'a', stars: 3 },
    { vowel: 'e', stars: 3 },
    { vowel: 'i', stars: 2 },
    { vowel: 'o', stars: 1 },
    { vowel: 'u', stars: 0 },
  ] as const;

  it('texto visible: vocales terminadas sobre el total, sin mezclar estrellas', () => {
    expect(vowelsDoneLabel(2, 5)).toBe('Vocales terminadas: 2 de 5');
  });

  it('el lector de pantalla oye un solo texto con las letras terminadas', () => {
    expect(vowelsDoneAccessibilityLabel(two)).toBe(
      'Vocales terminadas: 2 de 5: A y E',
    );
    expect(
      vowelsDoneAccessibilityLabel([
        { vowel: 'a', stars: 3 },
        { vowel: 'e', stars: 3 },
        { vowel: 'i', stars: 3 },
        { vowel: 'o', stars: 0 },
        { vowel: 'u', stars: 0 },
      ]),
    ).toBe('Vocales terminadas: 3 de 5: A, E e I');
    expect(
      vowelsDoneAccessibilityLabel(two.map((v) => ({ ...v, stars: 0 }))),
    ).toBe('Vocales terminadas: 0 de 5');
  });

  it('la narración dice que cada vocal se termina con 3 estrellas', () => {
    expect(speakSelectionNarration(0, 5)).toBe(
      'Toca un sonido para practicar. Cada vocal se termina con 3 estrellas. Todavía no terminas ninguna.',
    );
    expect(speakSelectionNarration(2, 5)).toBe(
      'Toca un sonido para practicar. Cada vocal se termina con 3 estrellas. Ya terminaste 2 de 5.',
    );
    expect(speakSelectionNarration(5, 5)).toBe(
      'Toca un sonido para practicar. Cada vocal se termina con 3 estrellas. ¡Terminaste las 5 vocales!',
    );
  });
});
