import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { aBigInt, esIdValido, idATexto, IsIdNumerico } from '../ids/ids.js';
import { ParseBigIntPipe } from './parse-bigint.pipe.js';

describe('ParseBigIntPipe', () => {
  const pipe = new ParseBigIntPipe();
  const meta = { type: 'param', data: 'id' } as const;

  it('convierte un id válido en bigint', () => {
    expect(pipe.transform('42', meta)).toBe(42n);
    expect(pipe.transform('9223372036854775807', meta)).toBe(
      9223372036854775807n,
    );
  });

  it.each([
    '0',
    '-1',
    '01',
    '1.5',
    'abc',
    '',
    ' 1',
    '9223372036854775808',
    '1e3',
  ])('rechaza %j con 400', (valor) => {
    expect(() => pipe.transform(valor, meta)).toThrow(BadRequestException);
  });

  it('rechaza valores que no son texto', () => {
    expect(() => pipe.transform(42, meta)).toThrow(BadRequestException);
    expect(() => pipe.transform(undefined, meta)).toThrow(BadRequestException);
  });

  it('nombra el parámetro en el mensaje', () => {
    expect(() =>
      pipe.transform('x', { type: 'param', data: 'estudianteId' }),
    ).toThrow(/estudianteId/);
  });
});

describe('ids', () => {
  it('esIdValido, aBigInt e idATexto', () => {
    expect(esIdValido('7')).toBe(true);
    expect(esIdValido(7)).toBe(false);
    expect(aBigInt('7')).toBe(7n);
    expect(() => aBigInt('x')).toThrow(TypeError);
    expect(idATexto(7n)).toBe('7');
  });

  it('@IsIdNumerico valida los DTO de entrada', async () => {
    class Dto {
      @IsIdNumerico()
      estudianteId: string;
    }
    const valido = Object.assign(new Dto(), { estudianteId: '12' });
    const invalido = Object.assign(new Dto(), { estudianteId: '12a' });
    expect(await validate(valido)).toHaveLength(0);
    const errores = await validate(invalido);
    expect(errores[0]?.constraints?.['matches']).toMatch(
      /estudianteId debe ser un id numérico/,
    );
  });
});
