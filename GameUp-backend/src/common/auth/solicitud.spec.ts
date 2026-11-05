import { extraerTokenBearer } from './solicitud.js';

describe('extraerTokenBearer', () => {
  it.each([
    ['Bearer abc.def.ghi', 'abc.def.ghi'],
    ['bearer abc', 'abc'],
    ['  Bearer   abc  ', 'abc'],
  ])('%j → %j', (cabecera, token) => {
    expect(extraerTokenBearer(cabecera)).toBe(token);
  });

  it.each([undefined, '', 'Bearer', 'Basic abc', 'abc', 'Bearer a b'])(
    'rechaza %j',
    (cabecera) => {
      expect(extraerTokenBearer(cabecera)).toBeNull();
    },
  );
});
