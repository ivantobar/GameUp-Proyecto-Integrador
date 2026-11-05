import { plainToInstance, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  MinLength,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { IsIdNumerico } from '../ids/ids.js';
import {
  fechaEnBogota,
  aFechaSinHora,
  fechaSinHoraATexto,
} from '../fechas/fechas.js';
import {
  errorDeValidacion,
  mensajesValidacion,
  traducirMensaje,
} from './mensajes-validacion.js';

class Hijo {
  @IsString()
  nombre: string;
}

class Dto {
  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(2)
  @MaxLength(5)
  texto: string;

  @IsIn(['A', 'B'])
  rol: string;

  @IsInt()
  @Max(50)
  limit: number;

  @IsBoolean()
  activo: boolean;

  @IsIdNumerico()
  id: string;

  @ValidateNested()
  @Type(() => Hijo)
  hijo: Hijo;
}

describe('mensajes de validación en español', () => {
  it('traduce los mensajes por defecto de class-validator', () => {
    const errores = validateSync(
      plainToInstance(Dto, {
        correo: 'x',
        texto: 'abcdefg',
        rol: 'C',
        limit: 51,
        activo: 'si',
        id: 'abc',
        hijo: { nombre: 3 },
      }),
    );
    expect(mensajesValidacion(errores)).toEqual([
      'correo debe ser un correo válido.',
      'texto debe tener como máximo 5 caracteres.',
      'rol debe ser uno de: A, B.',
      'limit no puede ser mayor que 50.',
      'activo debe ser true o false.',
      'id debe ser un id numérico en texto (ej.: "42")', // mensaje propio: pasa tal cual
      'hijo.nombre debe ser texto.',
    ]);
  });

  it.each([
    ['property extra should not exist', 'El campo extra no está permitido.'],
    [
      'texto must be longer than or equal to 2 characters',
      'texto debe tener al menos 2 caracteres.',
    ],
    ['page must not be less than 1', 'page no puede ser menor que 1.'],
    ['page must be an integer number', 'page debe ser un número entero.'],
    ['un mensaje propio en español', 'un mensaje propio en español'],
  ])('%j', (original, traducido) => {
    expect(traducirMensaje(original)).toBe(traducido);
  });

  it('errorDeValidacion → 400 sin mensajes repetidos', () => {
    const error = errorDeValidacion([
      {
        property: 'a',
        constraints: { x: 'a must be a string', y: 'a must be a string' },
        children: [],
      },
    ]);
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toMatchObject({
      message: ['a debe ser texto.'],
    });
  });
});

describe('fechas de la fundación (America/Bogota)', () => {
  it('«hoy» es la fecha de Bogotá, no la del servidor en UTC', () => {
    // 03:00 UTC del 6 de noviembre = 10:00 p. m. del 5 en Bogotá (UTC-5).
    expect(fechaEnBogota(new Date('2026-11-06T03:00:00Z'))).toBe('2026-11-05');
    expect(fechaEnBogota(new Date('2026-11-06T05:00:00Z'))).toBe('2026-11-06');
  });

  it('columna date ⇄ texto', () => {
    const d = aFechaSinHora('2026-11-05');
    expect(d.toISOString()).toBe('2026-11-05T00:00:00.000Z');
    expect(fechaSinHoraATexto(d)).toBe('2026-11-05');
    expect(() => aFechaSinHora('5/11/2026')).toThrow(TypeError);
  });
});
