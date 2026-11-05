/**
 * Traduce los errores de PostgreSQL (vía Prisma 7 + @prisma/adapter-pg) a una
 * respuesta HTTP genérica.
 *
 * Cómo llegan: Prisma lanza `PrismaClientKnownRequestError` con un código
 * propio (P2002, P2003, P2010, P2039...) y, cuando el error viene del
 * adaptador, el SQLSTATE real en `meta.driverAdapterError.cause.originalCode`.
 *
 * Los mensajes de los triggers incluyen ids internos, así que NUNCA se
 * reenvían: se responde siempre con un texto fijo.
 */

export interface ErrorTraducido {
  status: number;
  message: string;
  /** Código que se registra en el log (sin datos personales). */
  codigo: string;
}

interface ErrorPrismaConocido {
  name: string;
  code: string;
  meta?: Record<string, unknown>;
}

/** Reconoce el error por su forma, sin depender de `instanceof`. */
export function esErrorPrismaConocido(
  err: unknown,
): err is ErrorPrismaConocido {
  return (
    err instanceof Error &&
    err.name === 'PrismaClientKnownRequestError' &&
    typeof (err as { code?: unknown }).code === 'string'
  );
}

/** SQLSTATE de PostgreSQL, si el error lo trae. */
export function sqlStateDe(err: ErrorPrismaConocido): string | undefined {
  const adapter = err.meta?.['driverAdapterError'];
  if (typeof adapter !== 'object' || adapter === null) return undefined;
  const cause = (adapter as { cause?: unknown }).cause;
  if (typeof cause !== 'object' || cause === null) return undefined;
  const { originalCode, code } = cause as {
    originalCode?: unknown;
    code?: unknown;
  };
  if (typeof originalCode === 'string') return originalCode;
  if (typeof code === 'string') return code;
  return undefined;
}

/** Códigos propios de Prisma que equivalen a un SQLSTATE. */
const SQLSTATE_POR_CODIGO_PRISMA: Record<string, string> = {
  P2002: '23505',
  P2003: '23503',
  P2011: '23502',
};

const POR_SQLSTATE: Record<string, Omit<ErrorTraducido, 'codigo'>> = {
  // Violación de único (incluye el índice parcial uq_asignacion_activa).
  '23505': { status: 409, message: 'Ya existe un registro con esos datos.' },
  // Clave foránea: el registro referido no existe o aún está en uso.
  '23503': {
    status: 422,
    message:
      'La operación hace referencia a un registro que no existe o que está en uso.',
  },
  '23001': {
    status: 422,
    message: 'El registro está en uso y no se puede eliminar.',
  },
  '23502': { status: 422, message: 'Falta un dato obligatorio.' },
  // CHECK o trigger de regla de negocio (raise ... errcode 23514).
  '23514': {
    status: 422,
    message: 'La operación no cumple una regla de negocio.',
  },
  // Trigger de vínculo: el usuario no tiene a cargo al estudiante.
  '42501': {
    status: 403,
    message: 'No tienes permiso para hacer esto con este estudiante.',
  },
  '22P02': { status: 400, message: 'Un dato tiene un formato inválido.' },
};

export function traducirErrorBaseDatos(err: unknown): ErrorTraducido | null {
  if (!esErrorPrismaConocido(err)) return null;

  // P2025: el registro que se quería leer o modificar no existe.
  if (err.code === 'P2025') {
    return { status: 404, message: 'El recurso no existe.', codigo: 'P2025' };
  }

  const sqlState = sqlStateDe(err) ?? SQLSTATE_POR_CODIGO_PRISMA[err.code];
  const traducido = sqlState ? POR_SQLSTATE[sqlState] : undefined;
  if (!traducido) return null;
  return { ...traducido, codigo: `${err.code}/${sqlState}` };
}
