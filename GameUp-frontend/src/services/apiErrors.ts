/**
 * Errores tipados del cliente HTTP. Los repositorios los traducen a errores
 * del dominio (por ejemplo, `InvalidCredentialsError`) cuando hace falta, y
 * los hooks deciden qué mensaje amable mostrar. Nunca llevan el token.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    /** Código HTTP, o `null` si no hubo respuesta del servidor. */
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** No hubo respuesta: sin internet, IP equivocada o el servidor no contestó a tiempo. */
export class ConnectionError extends ApiError {
  constructor(
    message = 'El servidor no respondió. Revisa la IP, que el backend esté encendido y que estés en la misma red Wi-Fi.',
  ) {
    super(message, null);
    this.name = 'ConnectionError';
  }
}

/** 401: falta la sesión, venció o el backend no la reconoce. */
export class UnauthorizedError extends ApiError {
  constructor(message = 'La sesión no es válida o ya terminó') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/** 403: la cuenta no tiene permiso para esto. */
export class ForbiddenError extends ApiError {
  constructor(message = 'No tienes permiso para esto') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/** 404: no existe, o no le corresponde a quien lo pide (el backend no distingue). */
export class NotFoundError extends ApiError {
  constructor(message = 'No se encontró') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/** Cualquier otra respuesta de error (400, 409, 422, 5xx) o una respuesta ilegible. */
export class ServerError extends ApiError {
  constructor(message: string, status: number | null) {
    super(message, status);
    this.name = 'ServerError';
  }
}
