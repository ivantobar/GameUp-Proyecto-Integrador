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
