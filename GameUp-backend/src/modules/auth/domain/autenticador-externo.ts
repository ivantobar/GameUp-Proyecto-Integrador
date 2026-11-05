/**
 * Puerto AutenticadorExterno: inicia sesión en la API de seguridad. GameUP
 * nunca guarda contraseñas: solo reenvía las credenciales y recibe el token.
 */
export interface AutenticadorExterno {
  /**
   * Devuelve el token (JWT) de la API de seguridad.
   * Lanza `NoAutenticadoError` si las credenciales no coinciden y
   * `ServicioExternoNoDisponibleError` si la API no responde.
   */
  iniciarSesion(correo: string, contrasena: string): Promise<string>;
}

export const AUTENTICADOR_EXTERNO = Symbol('AUTENTICADOR_EXTERNO');
