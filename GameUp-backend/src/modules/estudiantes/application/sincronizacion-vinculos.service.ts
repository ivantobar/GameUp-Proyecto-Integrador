import { Logger } from '@nestjs/common';
import type {
  ConsultaVinculos,
  CopiaVinculosRepository,
  SincronizadorVinculos,
  VinculoLocal,
} from '../domain/vinculos-externos.js';

/**
 * Refresca la copia local de vínculos de UN acudiente con lo que dice
 * ASISCO UP. Reglas:
 *   - Solo si ASISCO UP reconoce al mismo usuario de seguridad que inició
 *     sesión (idUsuarioAuth); si no, no toca nada.
 *   - Los estudiantes de ASISCO UP que no están habilitados en GameUP se
 *     ignoran.
 *   - Si ASISCO UP no responde, se lanza el error y la copia queda como
 *     estaba (quien llama decide; el login no se bloquea).
 */
/** Se construye en EstudiantesModule solo si hay ASISCO_API_URL. */
export class SincronizacionVinculosService implements SincronizadorVinculos {
  private readonly logger = new Logger(SincronizacionVinculosService.name);

  constructor(
    private readonly consulta: ConsultaVinculos,
    private readonly copia: CopiaVinculosRepository,
  ) {}

  async sincronizarAcudiente(
    acudiente: { id: bigint; idUsuarioAuth: bigint },
    token: string,
  ): Promise<void> {
    const externo = await this.consulta.deAcudiente(token);
    if (externo.idUsuarioAuth !== acudiente.idUsuarioAuth) {
      this.logger.warn(
        `ASISCO UP devolvió otro acudiente; no se cambian los vínculos (usuario ${acudiente.id})`,
      );
      return;
    }
    const locales = await this.copia.estudiantesPorExterno(
      externo.estudiantes.map((e) => e.idEstudianteExterno),
    );
    const vinculos: VinculoLocal[] = [];
    for (const e of externo.estudiantes) {
      const estudianteId = locales.get(e.idEstudianteExterno);
      if (estudianteId === undefined) continue;
      if (vinculos.some((v) => v.estudianteId === estudianteId)) continue;
      vinculos.push({
        estudianteId,
        parentesco: e.parentesco,
        esPrincipal: e.esPrincipal,
      });
    }
    await this.copia.reemplazarDeAcudiente(acudiente.id, vinculos);
  }
}
