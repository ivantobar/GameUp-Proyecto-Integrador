import { friendlyReason, MAX_REASON_LENGTH } from '../friendlyReason';

describe('friendlyReason', () => {
  it.each([
    'Tu cuenta de GameUP está desactivada. Habla con la directora de la fundación.',
    'Tu cuenta tiene varios roles en la fundación. Pide a la directora que te dé de alta en GameUP.',
    'Aún no te encontramos en ASISCO UP. Pide a la fundación que revise tu registro.',
    'Pide a la directora que revise tu cuenta.',
  ])('acepta los motivos del backend: %s', (texto) => {
    expect(friendlyReason(texto)).toBe(texto);
  });

  it('quita espacios de sobra', () => {
    expect(
      friendlyReason('  Pide   a la directora  que revise tu cuenta. '),
    ).toBe('Pide a la directora que revise tu cuenta.');
  });

  it.each([
    ['sin mensaje', undefined],
    ['no es texto', ['a', 'b']],
    ['vacío', '   '],
    ['muy corto', 'No'],
    ['muy largo', 'a'.repeat(MAX_REASON_LENGTH + 1)],
    ['código HTTP del cliente', 'El servidor respondió con el código 403'],
    ['id', 'La cuenta 12345 no existe'],
    ['traza', 'TypeError at foo (index.js:1:2)'],
    ['JSON', '{"error":"x"}'],
    ['nombre técnico', 'id_usuario_auth no coincide'],
    ['error interno', 'PrismaClientKnownRequestError'],
    ['URL', 'Ver https://ejemplo.com'],
  ])('descarta: %s', (_caso, valor) => {
    expect(friendlyReason(valor)).toBeNull();
  });
});
