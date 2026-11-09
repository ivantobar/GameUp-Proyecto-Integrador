/**
 * DTO de las talleristas de un estudiante (`GameUp-backend/src/modules/
 * estudiantes/presentation/vinculos.controller.ts`) y de la lista de
 * usuarios (`GameUp-backend/src/modules/usuarios/presentation/dto/
 * usuario.dto.ts`). Solo los usa la directora.
 */

/** Una de `GET /estudiantes/:id/talleristas` y la respuesta del POST. */
export interface TalleristaAsignadaDto {
  talleristaId: string;
  /** Primer nombre y primer apellido («Ana Gómez»). */
  displayName: string;
  /** AAAA-MM-DD. */
  fechaInicio: string;
  /** `false`: ya no está a cargo (historial). */
  activo: boolean;
}

/** Cuerpo de `POST /estudiantes/:id/talleristas`. */
export interface AsignarTalleristaDto {
  /** `usuario.id` de la tallerista. */
  talleristaId: string;
}

/** Un usuario de `GET /usuarios` (solo los campos que usa la app). */
export interface UsuarioDto {
  id: string;
  rol: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  activo: boolean;
}

/** Respuesta de `GET /usuarios`. */
export interface PaginaUsuariosDto {
  items: UsuarioDto[];
  total: number;
  page: number;
  limit: number;
}
