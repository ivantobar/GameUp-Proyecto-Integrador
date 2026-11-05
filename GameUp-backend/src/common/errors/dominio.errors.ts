/**
 * Errores de dominio. Los lanzan los servicios (que no conocen HTTP) y el
 * filtro global (`FiltroErroresGlobal`) los traduce al código HTTP que toca.
 *
 * El mensaje se muestra tal cual a la app: escríbelo en español claro y
 * NUNCA incluyas ids internos, nombres ni datos de otros estudiantes.
 */
export abstract class ErrorDominio extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** 404. También se usa cuando el recurso existe pero no le corresponde a quien lo pide. */
export class RecursoNoEncontradoError extends ErrorDominio {
  constructor(message = 'El recurso no existe.') {
    super(message);
  }
}

/** 403: el rol o la cuenta no permiten la operación. */
export class AccesoDenegadoError extends ErrorDominio {
  constructor(message = 'No tienes permiso para hacer esto.') {
    super(message);
  }
}

/** 422: los datos tienen la forma correcta, pero rompen una regla de negocio. */
export class ReglaNegocioError extends ErrorDominio {
  constructor(message: string) {
    super(message);
  }
}

/** 409: choca con el estado actual (ya existe, ya se validó...). */
export class ConflictoError extends ErrorDominio {
  constructor(message: string) {
    super(message);
  }
}

/** 401: falta el token, es inválido o venció. */
export class NoAutenticadoError extends ErrorDominio {
  constructor(message = 'Debes iniciar sesión.') {
    super(message);
  }
}

/** 503: una API externa (seguridad, núcleo familiar, Storage) no está disponible o no está configurada. */
export class ServicioExternoNoDisponibleError extends ErrorDominio {
  constructor(message: string) {
    super(message);
  }
}
