/**
 * El correo o la contraseña no coinciden. Se distingue de un error de
 * conexión para mostrar el mensaje correcto en «Iniciar sesión».
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('El correo o la contraseña no coinciden');
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Las credenciales son correctas, pero la cuenta no puede usar GameUP: está
 * inactiva, su rol no tiene acceso o no coincide, ASISCO UP no la encuentra...
 *
 * `reason` es el motivo que dio el backend, ya revisado para mostrarlo tal
 * cual (texto claro, sin códigos ni ids). Si es `null`, la pantalla usa su
 * texto general.
 */
export class AccountNotAllowedError extends Error {
  constructor(readonly reason: string | null = null) {
    super('La cuenta no tiene acceso a GameUP');
    this.name = 'AccountNotAllowedError';
  }
}

/**
 * El backend de GameUP respondió, pero el servicio que verifica las cuentas
 * (la API de seguridad) no está disponible. No es un problema de la
 * conexión del teléfono: hay que intentarlo en un momento.
 */
export class SignInUnavailableError extends Error {
  constructor() {
    super('El inicio de sesión no está disponible en este momento');
    this.name = 'SignInUnavailableError';
  }
}
