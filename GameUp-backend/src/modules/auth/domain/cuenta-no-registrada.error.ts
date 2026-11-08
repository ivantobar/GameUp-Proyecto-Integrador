import { AccesoDenegadoError } from '../../../common/errors/dominio.errors.js';

/**
 * 403: la persona tiene una cuenta válida en la API de seguridad, con un rol
 * que da acceso, pero aún no hay fila en `usuario` con su id_usuario_auth.
 *
 * Es un AccesoDenegadoError (el guard responde 403 igual que siempre), pero
 * con tipo propio para que el login la distinga de los demás 403 (inactiva,
 * egresado, rol distinto) sin comparar textos y pueda darla de alta.
 */
export class CuentaNoRegistradaError extends AccesoDenegadoError {
  constructor() {
    super(
      'Tu cuenta aún no está registrada en GameUP. Pide a la directora de la fundación que te dé de alta.',
    );
  }
}
