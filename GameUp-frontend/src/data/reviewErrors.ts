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
