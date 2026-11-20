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
 * `emoji`. Reglas:
 * - si hay dibujo propio para el emoji, se ve el dibujo y NO el emoji (antes
 *   salían los dos, uno al lado del otro);
 * - si no hay dibujo, se ve el emoji en grande, como imagen (los niños no
 *   leen); nunca se cambia por la palabra.
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

  it('un emoji sin dibujo propio (🛶) se muestra como imagen, no la palabra', async () => {
    await render(<Pictogram face={{ id: 'p', label: 'canoa', text: '🛶' }} />);
    expect(screen.getByTestId('pictogram-emoji', hidden)).toHaveTextContent(
      '🛶',
    );
    expect(screen.queryByText('canoa', hidden)).toBeNull();
    expect(screen.queryByTestId(/^illustration-/, hidden)).toBeNull();
  });

  it('nunca busca un dibujo por la palabra si el emoji no tiene dibujo', async () => {
    // «barco» tiene dibujo, pero el emoji es 🛶: se ve 🛶, no el velero.
    await render(<Pictogram face={{ id: 'p', label: 'barco', text: '🛶' }} />);
    expect(screen.getByText('🛶', hidden)).toBeOnTheScreen();
    expect(screen.queryByTestId('illustration-barco', hidden)).toBeNull();
  });

  it('una cantidad sin dibujo repite el emoji', async () => {
    await render(
      <Pictogram
        face={{ id: 'p', label: 'dos canoas', text: '🛶', count: 2 }}
      />,
    );
    expect(screen.getAllByTestId('pictogram-emoji', hidden)).toHaveLength(2);
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

  it('la miniatura (grupos y casillas): dibujo sin emoji; sin dibujo, el emoji', async () => {
    await render(<MiniPicture face={{ id: 'p', label: 'gato', text: '🐱' }} />);
    expect(screen.getByTestId('illustration-gato', hidden)).toBeOnTheScreen();
    expect(screen.queryByText('🐱', hidden)).toBeNull();

    await render(
      <MiniPicture face={{ id: 'q', label: 'canoa', text: '🛶' }} />,
    );
    expect(screen.getByTestId('mini-picture-emoji', hidden)).toHaveTextContent(
      '🛶',
    );
    expect(screen.queryByText('canoa', hidden)).toBeNull();
  });

  it('una tarjeta para leer («Manzana») muestra solo la palabra, sin dibujo', async () => {
    // Si llevara el dibujo, en «¿Qué palabra es?» regalaría la respuesta.
    await render(
      <Pictogram face={{ id: 'p', label: 'manzana', text: 'Manzana' }} />,
    );
    expect(screen.getByText('Manzana', hidden)).toBeOnTheScreen();
    expect(screen.queryByTestId(/^illustration-/, hidden)).toBeNull();
    expect(
      illustrationFor({ id: 'p', label: 'manzana', text: 'Manzana' }),
    ).toBeNull();
  });

  it('solo sin imagen, dibujo ni emoji se muestra la palabra', async () => {
    await render(<Pictogram face={{ id: 'p', label: 'trompo' }} />);
    expect(screen.getByText('trompo', hidden)).toBeOnTheScreen();
    expect(screen.queryByTestId('pictogram-emoji', hidden)).toBeNull();
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
