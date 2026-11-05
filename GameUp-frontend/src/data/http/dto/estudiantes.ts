/**
 * DTO del módulo `estudiantes` del backend (`GameUp-backend/src/modules/
 * estudiantes/presentation/dto/estudiante.dto.ts`).
 */

/** `{ id, nombre }` de un nivel o de un módulo. */
export interface NivelDto {
  id: string;
  nombre: string;
}

/** Respuesta de `GET /estudiantes/me`. */
export interface EstudiantePropioDto {
  id: string;
  /** Primer nombre: así lo saluda la app. */
  displayName: string;
  personajeAvatar: string | null;
  nivel: NivelDto;
}
