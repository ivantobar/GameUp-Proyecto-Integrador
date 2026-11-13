/**
 * El intento de voz tiene audio y quien valida todavía no lo escuchó: el
 * backend exige escucharlo antes de decidir.
 */
export class ListenFirstError extends Error {
  constructor() {
    super('Antes de validar, escucha la grabación de este intento.');
    this.name = 'ListenFirstError';
  }
}

/**
 * `codigo` con el que el backend marca el 403 de `GET /intentos/:id/grabacion`
 * cuando el acudiente retiró la autorización en ASISCO UP
 * (`CODIGO_CONSENTIMIENTO_RETIRADO` en GameUp-backend, dominio.errors.ts).
 * Solo ese 403 significa «autorización retirada»; cualquier otro 403 (aunque
 * diga lo mismo) es un error normal.
 */
export const CODIGO_CONSENTIMIENTO_RETIRADO = 'CONSENTIMIENTO_RETIRADO';

/** 403 marcado por el backend: el acudiente ya no autoriza oír la voz. */
export class RecordingConsentWithdrawnError extends Error {
  constructor() {
    super('El acudiente retiró la autorización de grabar la voz');
    this.name = 'RecordingConsentWithdrawnError';
  }
}

/**
 * 503: el audio no se pudo traer ahora (ASISCO UP no confirmó la
 * autorización o Storage no respondió). Se puede reintentar.
 */
export class RecordingUnavailableError extends Error {
  constructor() {
    super('No se pudo traer el audio en este momento. Intenta de nuevo');
    this.name = 'RecordingUnavailableError';
  }
}
