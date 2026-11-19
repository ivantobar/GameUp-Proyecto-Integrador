import { render, screen } from '@testing-library/react-native';
import { MiniPicture, Pictogram } from '@/components/gameup';
import {
  contentDrawings,
  illustrationFor,
  isEmojiOnly,
  visibleText,
} from '@/components/gameup/illustrations';

/**
 * El backend siembra el dibujo provisional en `texto` («🍎»), no en
 * `emoji`. Antes la tarjeta mostraba el dibujo propio Y el emoji al lado.
 * Un emoji nunca se muestra: solo sirve para elegir el dibujo.
 */
const hidden = { includeHiddenElements: true } as const;

describe('isEmojiOnly', () => {
  it.each(['🍎', '☀️', '✈️', '⛵', '🟡', '⭐', '⏰', '🍎🍎'])(
    '«%s» es solo emoji',
    (text) => {
      expect(isEmojiOnly(text)).toBe(true);
    },
  );

  it.each(['a', 'e', '3', 'sol', '🍎 manzana', ''])(
    '«%s» no es solo emoji (se escribe)',
    (text) => {
      expect(isEmojiOnly(text)).toBe(false);
    },
  );
});

describe('tarjeta de la API con el emoji en `texto`', () => {
  it('muestra el dibujo propio y nunca el emoji', async () => {
    await render(
      <Pictogram face={{ id: 'p', label: 'manzana', text: '🍎' }} />,
    );
    expect(
      screen.getByTestId('illustration-manzana', hidden),
    ).toBeOnTheScreen();
    expect(screen.queryByText('🍎', hidden)).toBeNull();
  });

  it('el emoji elige el dibujo aunque la palabra no esté en el diccionario', async () => {
    // «sol» con ☀️ sí; «darle sol» no está, pero el emoji ☀️ sí.
    await render(
      <Pictogram face={{ id: 'p', label: 'darle sol', text: '☀️' }} />,
    );
    expect(screen.getByTestId('illustration-sol', hidden)).toBeOnTheScreen();
    expect(screen.queryByText('☀️', hidden)).toBeNull();
  });

  it('un emoji sin dibujo propio muestra la palabra, no el emoji', async () => {
    await render(<Pictogram face={{ id: 'p', label: 'canoa', text: '🛶' }} />);
    expect(screen.getByText('canoa', hidden)).toBeOnTheScreen();
    expect(screen.queryByText('🛶', hidden)).toBeNull();
    expect(screen.queryByTestId(/^illustration-/, hidden)).toBeNull();
  });

  it('una cantidad repite el dibujo, sin el emoji', async () => {
    await render(
      <Pictogram
        face={{ id: 'p', label: 'tres estrellas', text: '⭐', count: 3 }}
      />,
    );
    expect(screen.getAllByTestId('illustration-estrella', hidden)).toHaveLength(
      3,
    );
    expect(screen.queryByText('⭐', hidden)).toBeNull();
  });

  it('las letras y los números de `texto` sí se escriben', async () => {
    await render(<Pictogram face={{ id: 'p', label: 'a', text: 'a' }} />);
    expect(screen.getByText('a', hidden)).toBeOnTheScreen();
    await render(<Pictogram face={{ id: 'q', label: 'tres', text: '3' }} />);
    expect(screen.getByText('3', hidden)).toBeOnTheScreen();
  });

  it('la miniatura (grupos y casillas) tampoco muestra el emoji', async () => {
    await render(<MiniPicture face={{ id: 'p', label: 'gato', text: '🐱' }} />);
    expect(screen.getByTestId('illustration-gato', hidden)).toBeOnTheScreen();
    expect(screen.queryByText('🐱', hidden)).toBeNull();

    await render(
      <MiniPicture face={{ id: 'q', label: 'canoa', text: '🛶' }} />,
    );
    expect(screen.getByText('canoa', hidden)).toBeOnTheScreen();
    expect(screen.queryByText('🛶', hidden)).toBeNull();
  });

  it('visibleText descarta solo los emojis', () => {
    expect(visibleText({ id: 'a', label: 'x', text: '🍎' })).toBeUndefined();
    expect(visibleText({ id: 'b', label: 'x', text: 'a' })).toBe('a');
  });
});

describe('los emojis más usados en el contenido sembrado tienen dibujo', () => {
  // Los que aparecen 3 veces o más en sembrar_escalera.sql y
  // sembrar_modulos.sql del backend.
  it.each([
    '🍎',
    '🐶',
    '🚗',
    '☀️',
    '🐱',
    '🐟',
    '✈️',
    '⛵',
    '🍓',
    '🍇',
    '🍌',
    '🚂',
    '🐰',
    '🍉',
    '⚽',
    '⭐',
    '🌙',
    '🌸',
    '🎈',
    '🐑',
    '🐙',
    '🐮',
    '🐻',
    '🦁',
    '🍐',
    '🚌',
    '🐷',
    '🐒',
    '🐘',
    '🐝',
    '🚲',
    '🥄',
    '🌊',
    '💧',
    '🔴',
  ])('%s', (emoji) => {
    const drawing = illustrationFor({ id: 'x', label: '', text: emoji });
    expect(drawing).not.toBeNull();
    expect(contentDrawings).toHaveProperty(drawing!);
  });
});
