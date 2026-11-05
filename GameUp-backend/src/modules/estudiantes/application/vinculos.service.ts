import { Inject, Injectable } from '@nestjs/common';
import {
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import { aFechaSinHora, fechaEnBogota } from '../../../common/fechas/fechas.js';
import { RELOJ, type Reloj } from '../../../common/reloj/reloj.js';
import {
  USUARIO_LECTURA_REPOSITORY,
  type UsuarioLecturaRepository,
} from '../../usuarios/domain/usuario.repository.js';
import type {
  TalleristaAsignada,
  VinculoAcudiente,
} from '../domain/estudiante.entity.js';
import {
  ACUDIENTE_ESTUDIANTE_REPOSITORY,
  TALLERISTA_ESTUDIANTE_REPOSITORY,
  type AcudienteEstudianteRepository,
  type TalleristaEstudianteRepository,
} from '../domain/estudiante.repository.js';
import { AccesoEstudianteService } from './acceso-estudiante.service.js';

const NOMBRE_ROL: Record<'TALLERISTA' | 'ACUDIENTE', string> = {
  TALLERISTA: 'una tallerista',
  ACUDIENTE: 'un acudiente',
};

/**
 * Vínculos de un estudiante con su tallerista y sus acudientes. Solo la
 * directora (lo exige el controlador). La base también exige el rol correcto
 * en cada vínculo (triggers): aquí se valida antes, con mensajes claros.
 */
@Injectable()
export class VinculosService {
  constructor(
    @Inject(TALLERISTA_ESTUDIANTE_REPOSITORY)
    private readonly talleristas: TalleristaEstudianteRepository,
    @Inject(ACUDIENTE_ESTUDIANTE_REPOSITORY)
    private readonly acudientes: AcudienteEstudianteRepository,
    @Inject(USUARIO_LECTURA_REPOSITORY)
    private readonly usuarios: UsuarioLecturaRepository,
    @Inject(RELOJ) private readonly reloj: Reloj,
    private readonly acceso: AccesoEstudianteService,
  ) {}

  // ─── Talleristas ──────────────────────────────────────────────────────────

  async listarTalleristas(estudianteId: bigint): Promise<TalleristaAsignada[]> {
    await this.acceso.existente(estudianteId);
    return this.talleristas.listar(estudianteId);
  }

  /** Pone al estudiante a cargo de la tallerista desde hoy (hora de Bogotá). */
  async asignarTallerista(
    estudianteId: bigint,
    talleristaId: bigint,
  ): Promise<TalleristaAsignada> {
    await this.acceso.existente(estudianteId);
    await this.exigirCuenta(talleristaId, 'TALLERISTA');
    const actual = await this.talleristas.buscar(talleristaId, estudianteId);
    if (actual?.activo) {
      throw new ConflictoError(
        'La tallerista ya tiene a cargo a este estudiante.',
      );
    }
    const hoy = aFechaSinHora(fechaEnBogota(this.reloj.ahora()));
    return this.talleristas.activar(talleristaId, estudianteId, hoy);
  }

  /** Deja de estar a cargo (se conserva el historial). Pierde el acceso al instante. */
  async retirarTallerista(
    estudianteId: bigint,
    talleristaId: bigint,
  ): Promise<void> {
    await this.acceso.existente(estudianteId);
    if (!(await this.talleristas.desactivar(talleristaId, estudianteId))) {
      throw new RecursoNoEncontradoError(
        'La tallerista no tiene a cargo a este estudiante.',
      );
    }
  }

  // ─── Acudientes ───────────────────────────────────────────────────────────

  async listarAcudientes(estudianteId: bigint): Promise<VinculoAcudiente[]> {
    await this.acceso.existente(estudianteId);
    return this.acudientes.listar(estudianteId);
  }

  async vincularAcudiente(
    estudianteId: bigint,
    acudienteId: bigint,
    parentesco: string,
    esPrincipal: boolean,
  ): Promise<VinculoAcudiente> {
    await this.acceso.existente(estudianteId);
    await this.exigirCuenta(acudienteId, 'ACUDIENTE');
    const texto = limpiarParentesco(parentesco);

    if (await this.acudientes.buscar(acudienteId, estudianteId)) {
      throw new ConflictoError(
        'El acudiente ya está vinculado a este estudiante.',
      );
    }
    if (esPrincipal && (await this.tienePrincipal(estudianteId))) {
      throw new ConflictoError(
        'El estudiante ya tiene un acudiente principal. Para cambiarlo, marca al nuevo como principal con PATCH.',
      );
    }
    return this.acudientes.crear(acudienteId, estudianteId, texto, esPrincipal);
  }

  async actualizarAcudiente(
    estudianteId: bigint,
    acudienteId: bigint,
    cambios: { parentesco: string | null; esPrincipal: boolean | null },
  ): Promise<VinculoAcudiente> {
    await this.acceso.existente(estudianteId);
    if (!(await this.acudientes.buscar(acudienteId, estudianteId))) {
      throw new RecursoNoEncontradoError(
        'El acudiente no está vinculado a este estudiante.',
      );
    }
    if (cambios.parentesco === null && cambios.esPrincipal === null) {
      throw new ReglaNegocioError(
        'No hay cambios: envía parentesco o esPrincipal.',
      );
    }
    return this.acudientes.actualizar(acudienteId, estudianteId, {
      parentesco:
        cambios.parentesco === null
          ? null
          : limpiarParentesco(cambios.parentesco),
      esPrincipal: cambios.esPrincipal,
    });
  }

  async desvincularAcudiente(
    estudianteId: bigint,
    acudienteId: bigint,
  ): Promise<void> {
    await this.acceso.existente(estudianteId);
    if (!(await this.acudientes.eliminar(acudienteId, estudianteId))) {
      throw new RecursoNoEncontradoError(
        'El acudiente no está vinculado a este estudiante.',
      );
    }
  }

  // ─── Apoyo ────────────────────────────────────────────────────────────────

  /** La cuenta existe, tiene ese rol y está activa; si no, 422. */
  private async exigirCuenta(
    id: bigint,
    rol: 'TALLERISTA' | 'ACUDIENTE',
  ): Promise<void> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario || usuario.rol !== rol) {
      throw new ReglaNegocioError(
        `La cuenta indicada no es de ${NOMBRE_ROL[rol]} de GameUP.`,
      );
    }
    if (!usuario.activo) {
      throw new ReglaNegocioError('La cuenta indicada está desactivada.');
    }
  }

  private async tienePrincipal(estudianteId: bigint): Promise<boolean> {
    return (await this.acudientes.listar(estudianteId)).some(
      (v) => v.esPrincipal,
    );
  }
}

function limpiarParentesco(texto: string): string {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  if (!limpio) throw new ReglaNegocioError('El parentesco es obligatorio.');
  return limpio;
}
