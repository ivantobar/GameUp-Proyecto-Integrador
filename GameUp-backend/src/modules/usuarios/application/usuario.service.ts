import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../../common/auth/usuario-autenticado.js';
import {
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../../common/errors/dominio.errors.js';
import type {
  Pagina,
  Paginacion,
} from '../../../common/paginacion/paginacion.js';
import {
  normalizarNuevoUsuario,
  type DatosNuevoUsuario,
} from '../domain/nuevo-usuario.js';
import type { Usuario } from '../domain/usuario.entity.js';
import {
  NIVEL_CONSULTA,
  USUARIO_ESCRITURA_REPOSITORY,
  USUARIO_LECTURA_REPOSITORY,
  type CampoUnico,
  type FiltroUsuarios,
  type NivelConsulta,
  type UsuarioEscrituraRepository,
  type UsuarioLecturaRepository,
} from '../domain/usuario.repository.js';

const MENSAJE_CAMPO_EN_USO: Record<CampoUnico, string> = {
  idUsuarioAuth: 'Ya existe una cuenta con ese id de la API de seguridad.',
  correo: 'Ya existe una cuenta con ese correo.',
  idAcudienteExterno:
    'Ya existe una cuenta con ese id de acudiente del núcleo familiar.',
  idEstudianteExterno:
    'Ya existe una cuenta con ese id de estudiante del núcleo familiar.',
};

/**
 * Casos de uso de la directora sobre las cuentas de GameUP. El rol
 * (solo DIRECTORA) lo exige el controlador con @Roles; aquí van las reglas.
 */
@Injectable()
export class UsuarioService {
  constructor(
    @Inject(USUARIO_LECTURA_REPOSITORY)
    private readonly lectura: UsuarioLecturaRepository,
    @Inject(USUARIO_ESCRITURA_REPOSITORY)
    private readonly escritura: UsuarioEscrituraRepository,
    @Inject(NIVEL_CONSULTA) private readonly niveles: NivelConsulta,
  ) {}

  /** Alta de la copia mínima de una persona que ya existe en la API de seguridad. */
  async crear(entrada: DatosNuevoUsuario): Promise<Usuario> {
    const datos = normalizarNuevoUsuario(entrada);

    // Regla 7: se valida antes de escribir; los índices únicos son el respaldo.
    const enUso = await this.lectura.camposEnUso(datos);
    const primero = enUso[0];
    if (primero) throw new ConflictoError(MENSAJE_CAMPO_EN_USO[primero]);

    let nivelId = datos.nivelId;
    if (datos.rol === 'ESTUDIANTE') {
      if (nivelId === null) {
        nivelId = await this.niveles.inicial();
        if (nivelId === null) {
          throw new ReglaNegocioError('No hay niveles configurados en GameUP.');
        }
      } else if (!(await this.niveles.existe(nivelId))) {
        throw new ReglaNegocioError('El nivel indicado no existe.');
      }
    }

    return this.escritura.crear({ ...datos, nivelId });
  }

  listar(
    filtro: FiltroUsuarios,
    paginacion: Paginacion,
  ): Promise<Pagina<Usuario>> {
    return this.lectura.listar(filtro, paginacion);
  }

  async obtener(id: bigint): Promise<Usuario> {
    const usuario = await this.lectura.buscarPorId(id);
    if (!usuario) throw new RecursoNoEncontradoError('La cuenta no existe.');
    return usuario;
  }

  /**
   * Activar o desactivar una cuenta. Una cuenta inactiva recibe 403 al entrar.
   * Para que GameUP nunca se quede sin administración: nadie se desactiva a
   * sí mismo y no se puede desactivar a la última directora activa.
   */
  async cambiarEstado(
    actual: UsuarioAutenticado,
    id: bigint,
    activo: boolean,
  ): Promise<Usuario> {
    if (id === actual.id && !activo) {
      throw new ReglaNegocioError('No puedes desactivar tu propia cuenta.');
    }
    const resultado = await this.escritura.cambiarActivo(id, activo);
    switch (resultado.tipo) {
      case 'ok':
        return resultado.usuario;
      case 'no_existe':
        throw new RecursoNoEncontradoError('La cuenta no existe.');
      case 'ultima_directora':
        throw new ReglaNegocioError(
          'No puedes desactivar a la última directora activa.',
        );
    }
  }
}
