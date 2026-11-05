import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/**
 * Traduce al español los mensajes por defecto de class-validator.
 *
 * class-validator no permite cambiar el idioma de sus mensajes, pero son
 * textos fijos en inglés: se reconocen con estas expresiones y se reescriben.
 * Los mensajes propios (ya en español, como el de @IsIdNumerico) no
 * coinciden con ninguna y pasan tal cual.
 */
const TRADUCCIONES: ReadonlyArray<[RegExp, string]> = [
  [/^property (\S+) should not exist$/, 'El campo $1 no está permitido.'],
  [/^(\S+) must be an email$/, '$1 debe ser un correo válido.'],
  [/^(\S+) must be a string$/, '$1 debe ser texto.'],
  [
    /^(\S+) must be longer than or equal to (\d+) characters?$/,
    '$1 debe tener al menos $2 caracteres.',
  ],
  [
    /^(\S+) must be shorter than or equal to (\d+) characters?$/,
    '$1 debe tener como máximo $2 caracteres.',
  ],
  [
    /^(\S+) must be one of the following values: (.*)$/,
    '$1 debe ser uno de: $2.',
  ],
  [/^(\S+) must be an integer number$/, '$1 debe ser un número entero.'],
  [
    /^(\S+) must be a number conforming to the specified constraints$/,
    '$1 debe ser un número.',
  ],
  [/^(\S+) must not be less than (\S+)$/, '$1 no puede ser menor que $2.'],
  [/^(\S+) must not be greater than (\S+)$/, '$1 no puede ser mayor que $2.'],
  [/^(\S+) must be a boolean value$/, '$1 debe ser true o false.'],
  [/^(\S+) should not be empty$/, '$1 no puede estar vacío.'],
  [/^(\S+) must be an object$/, '$1 debe ser un objeto.'],
  [/^(\S+) must be an array$/, '$1 debe ser una lista.'],
  [
    /^(\S+) must be a valid ISO 8601 date string$/,
    '$1 debe ser una fecha válida (AAAA-MM-DD).',
  ],
  [
    /^(\S+) must match .+ regular expression$/,
    '$1 no tiene el formato esperado.',
  ],
];

export function traducirMensaje(mensaje: string): string {
  for (const [patron, reemplazo] of TRADUCCIONES) {
    if (patron.test(mensaje)) return mensaje.replace(patron, reemplazo);
  }
  return mensaje;
}

/** Aplana los errores (incluidos los anidados, con su ruta: "items.0.nombre"). */
export function mensajesValidacion(
  errores: ValidationError[],
  prefijo = '',
): string[] {
  return errores.flatMap((error) => {
    const ruta = prefijo ? `${prefijo}.${error.property}` : error.property;
    const propios = Object.values(error.constraints ?? {}).map((m) =>
      // class-validator escribe el nombre corto del campo; se usa la ruta completa.
      traducirMensaje(prefijo ? m.replace(error.property, ruta) : m),
    );
    return [...propios, ...mensajesValidacion(error.children ?? [], ruta)];
  });
}

/** Para el ValidationPipe global: 400 con la lista de mensajes en español. */
export function errorDeValidacion(
  errores: ValidationError[],
): BadRequestException {
  return new BadRequestException([...new Set(mensajesValidacion(errores))]);
}
