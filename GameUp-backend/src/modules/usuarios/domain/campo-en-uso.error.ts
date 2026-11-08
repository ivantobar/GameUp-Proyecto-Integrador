import { ConflictoError } from '../../../common/errors/dominio.errors.js';
import type { CampoUnico } from './usuario.repository.js';

const MENSAJE_CAMPO_EN_USO: Record<CampoUnico, string> = {
  idUsuarioAuth: 'Ya existe una cuenta con ese id de la API de seguridad.',
  correo: 'Ya existe una cuenta con ese correo.',
  idAcudienteExterno:
    'Ya existe una cuenta con ese id de acudiente del núcleo familiar.',
  idEstudianteExterno:
    'Ya existe una cuenta con ese id de estudiante del núcleo familiar.',
};

/**
 * 409: al dar de alta una cuenta, otro usuario ya usa alguno de sus campos
 * únicos. Lleva TODOS los campos repetidos para que quien llame (por ejemplo,
 * el alta automática del login) decida sin comparar textos. El mensaje es el
 * del primero, como siempre en POST /usuarios.
 */
export class CampoEnUsoError extends ConflictoError {
  constructor(readonly campos: readonly [CampoUnico, ...CampoUnico[]]) {
    super(MENSAJE_CAMPO_EN_USO[campos[0]]);
  }

  incluye(campo: CampoUnico): boolean {
    return this.campos.includes(campo);
  }
}
