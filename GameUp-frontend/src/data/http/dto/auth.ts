/**
 * DTO del módulo `auth` del backend (`GameUp-backend/src/modules/auth/
 * presentation/dto/sesion.dto.ts`). Son la forma exacta del JSON: se
 * traducen a los tipos de la app en `../mappers/`.
 */

/** Cuerpo de `POST /auth/login`. */
export interface LoginDto {
  correo: string;
  contrasena: string;
}

/** `GET /auth/me` y `usuario` del login. `role` ya viene con los códigos de la app. */
export interface SesionUsuarioDto {
  userId: string;
  role: string;
  displayName: string;
}

/** Respuesta de `POST /auth/login`. */
export interface LoginRespuestaDto {
  /** JWT de la API de seguridad. Solo lo guarda el almacén del token. */
  token: string;
  expiraEn: string | null;
  usuario: SesionUsuarioDto;
}
