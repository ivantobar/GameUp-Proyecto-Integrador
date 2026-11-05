import { ApiProperty } from '@nestjs/swagger';
import {
  ROLES_GAMEUP,
  type RolGameUp,
} from '../../../../common/auth/usuario-autenticado.js';
import {
  ESTADOS_ESTUDIANTE,
  type EstadoEstudiante,
} from '../../domain/usuario.entity.js';

export class PerfilEstudianteDto {
  @ApiProperty({ example: '3021' })
  idEstudianteExterno: string;

  @ApiProperty({ example: '1' })
  nivelId: string;

  @ApiProperty({ enum: ESTADOS_ESTUDIANTE, example: 'ACTIVO' })
  estado: EstadoEstudiante;
}

/** Cuenta de GameUP tal como la ve la directora. */
export class UsuarioDto {
  @ApiProperty({ example: '12', description: 'Id interno de GameUP' })
  id: string;

  @ApiProperty({
    example: '845',
    description: 'id_usuario en la API de seguridad',
  })
  idUsuarioAuth: string;

  @ApiProperty({ enum: ROLES_GAMEUP, example: 'TALLERISTA' })
  rol: RolGameUp;

  @ApiProperty({ example: 'Ana María' })
  nombres: string;

  @ApiProperty({ example: 'Gómez Ruiz' })
  apellidos: string;

  @ApiProperty({
    example: 'tallerista@ejemplo.com',
    nullable: true,
    type: String,
  })
  correo: string | null;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({
    example: null,
    nullable: true,
    type: String,
    description: 'idAcudiente en la API del núcleo familiar (solo acudientes)',
  })
  idAcudienteExterno: string | null;

  @ApiProperty({
    type: PerfilEstudianteDto,
    nullable: true,
    description: 'Solo en cuentas de estudiante',
  })
  estudiante: PerfilEstudianteDto | null;

  @ApiProperty({ example: '2026-11-05T12:00:00.000Z' })
  creadoEn: string;

  @ApiProperty({
    example: '2026-11-06T08:15:00.000Z',
    nullable: true,
    type: String,
  })
  ultimoAcceso: string | null;

  @ApiProperty({
    example: '2026-11-06T08:15:00.000Z',
    nullable: true,
    type: String,
  })
  sincronizadoEn: string | null;
}

export class PaginaUsuariosDto {
  @ApiProperty({ type: [UsuarioDto] })
  items: UsuarioDto[];

  @ApiProperty({ example: 37 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
