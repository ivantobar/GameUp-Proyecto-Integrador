import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ROLES_GAMEUP,
  type RolGameUp,
} from '../../../../common/auth/usuario-autenticado.js';
import { IsIdNumerico } from '../../../../common/ids/ids.js';

/**
 * Alta de una cuenta en GameUP. La persona ya debe existir en la API central
 * (idUsuarioAuth); GameUP toma de ahí nombres, apellidos, correo y roles
 * (GET /api/usuarios/{id}) y solo guarda una copia mínima. nombres,
 * apellidos y correo se aceptan por compatibilidad, pero se ignoran.
 */
export class CrearUsuarioDto {
  @ApiProperty({
    example: '845',
    description:
      '`id_usuario` de la API central. La persona ya debe existir allí.',
  })
  @IsIdNumerico()
  idUsuarioAuth: string;

  @ApiProperty({
    enum: ROLES_GAMEUP,
    example: 'TALLERISTA',
    description:
      'Rol en GameUP. Debe estar entre los roles centrales de la persona (ADMIN equivale a DIRECTORA).',
  })
  @IsIn(ROLES_GAMEUP)
  rol: RolGameUp;

  @ApiPropertyOptional({
    example: 'Ana María',
    maxLength: 100,
    deprecated: true,
    description:
      'Se ignora: los nombres se toman de GET /api/usuarios/{idUsuarioAuth} de la API central.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombres?: string;

  @ApiPropertyOptional({
    example: 'Gómez Ruiz',
    maxLength: 100,
    deprecated: true,
    description: 'Se ignora: los apellidos se toman de la API central.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  apellidos?: string;

  @ApiPropertyOptional({
    example: 'tallerista@ejemplo.com',
    deprecated: true,
    description: 'Se ignora: el correo se toma de la API central.',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  correo?: string;

  @ApiPropertyOptional({
    example: '77',
    description:
      'idAcudiente en la API del núcleo familiar. Solo para rol ACUDIENTE.',
  })
  @IsOptional()
  @IsIdNumerico()
  idAcudienteExterno?: string;

  @ApiPropertyOptional({
    example: '3021',
    description:
      '`idEstudiante` local de ASISCO UP (Método Consuelo). Opcional: GameUP lo toma ' +
      'de GET /api/estudiantes/por-usuario/{idUsuarioAuth}; si se manda y no coincide, 422. ' +
      'Solo para rol ESTUDIANTE.',
  })
  @IsOptional()
  @IsIdNumerico()
  idEstudianteExterno?: string;

  @ApiPropertyOptional({
    example: '1',
    description:
      'Nivel inicial del estudiante. Si falta, el de menor orden (BAJO).',
  })
  @IsOptional()
  @IsIdNumerico()
  nivelId?: string;
}
