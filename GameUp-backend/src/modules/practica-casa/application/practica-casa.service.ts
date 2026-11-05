import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  AccesoDenegadoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { fechaEnBogota } from '../../../common/fechas/fechas.js';
import { RELOJ, type Reloj } from '../../../common/reloj/reloj.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import type { Estudiante } from '../../estudiantes/domain/estudiante.entity.js';
import {
  armarSemana,
  semanaDe,
  type PracticaSemanal,
} from '../domain/practica-casa.js';
import {
  PRACTICA_CASA_REPOSITORY,
  type PracticaCasaRepository,
} from '../domain/practica-casa.repository.js';

/**
 * «Practicar en casa». Solo el acudiente la marca, con sus propios
 * estudiantes. La leen el acudiente, la tallerista a cargo y la directora
 * (queda en el seguimiento). Estudiante ajeno → 404. «Hoy» es la fecha en
 * Bogotá, no la del servidor.
 */
@Injectable()
export class PracticaCasaService {
  constructor(
    @Inject(PRACTICA_CASA_REPOSITORY)
    private readonly practicas: PracticaCasaRepository,
    @Inject(RELOJ) private readonly reloj: Reloj,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  async semana(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
  ): Promise<PracticaSemanal> {
    // Respaldo del @Roles() del controlador: el estudiante no la consulta.
    if (actual.rol === 'ESTUDIANTE') {
      throw new AccesoDenegadoError(
        'La práctica en casa la consultan el acudiente y el equipo.',
      );
    }
    const estudiante = await this.acceso.obtenerVisible(actual, estudianteId);
    return this.armar(estudiante);
  }

  /** «Lo practicamos hoy». Idempotente. Solo estudiantes ACTIVO. */
  async marcarHoy(
    actual: UsuarioAutenticado,
    estudianteId: bigint,
  ): Promise<PracticaSemanal> {
    // Respaldo del @Roles('ACUDIENTE') del controlador.
    if (actual.rol !== 'ACUDIENTE') {
      throw new AccesoDenegadoError(
        'Solo el acudiente registra la práctica en casa.',
      );
    }
    const estudiante = await this.acceso.obtenerVisible(actual, estudianteId);
    if (!estudiante.estaActivo()) {
      throw new ReglaNegocioError(
        'Solo se registra la práctica de estudiantes activos.',
      );
    }
    await this.practicas.registrar(estudianteId, actual.id, this.hoy());
    return this.armar(estudiante);
  }

  private async armar(estudiante: Estudiante): Promise<PracticaSemanal> {
    const hoy = this.hoy();
    const dias = semanaDe(hoy);
    const practicados = await this.practicas.diasPracticados(
      estudiante.id,
      dias[0] ?? hoy,
      dias[6] ?? hoy,
    );
    return armarSemana(estudiante, hoy, practicados);
  }

  private hoy(): string {
    return fechaEnBogota(this.reloj.ahora());
  }
}
