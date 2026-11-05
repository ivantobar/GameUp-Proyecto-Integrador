/**
 * DTO de las actividades del backend (`GameUp-backend/src/modules/modulos/
 * presentation/dto/modulo.dto.ts`).
 */
import type { CodigoJuego } from './juegos';

/** Un elemento de `GET /modulos/:id/contenidos/urls` (URLs firmadas, 60 min). */
export interface ContenidoUrlDto {
  contenidoId: string;
  url: string;
  expiraEn: string;
}

/** Respuesta de `GET /actividades/:id`. */
export interface ActividadDetalleDto {
  id: string;
  moduloId: string;
  tipoJuego: { id: string; codigo: CodigoJuego; nombre: string };
  titulo: string;
  instruccionTexto: string | null;
  /**
   * Depende del juego. HABLA_CONMIGO: `{ vocal }`.
   * BUSCA_LA_BOCA: `{ vocales: [...] }`.
   */
  configuracion: Record<string, unknown>;
  orden: number;
  activa: boolean;
}
