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
 * Alta de una cuenta en GameUP. La persona ya debe existir en la API de
 * seguridad (idUsuarioAuth); GameUP solo guarda una copia mínima. Al iniciar
 * sesión, nombres, apellidos y correo se refrescan desde esa API.
 */
export class CrearUsuarioDto {
  @ApiProperty({
    example: '845',
    description: 'id_usuario en la API de seguridad',
  })
  @IsIdNumerico()
  idUsuarioAuth: string;

  @ApiProperty({ enum: ROLES_GAMEUP, example: 'TALLERISTA' })
  @IsIn(ROLES_GAMEUP)
  rol: RolGameUp;

  @ApiProperty({ example: 'Ana María', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ example: 'Gómez Ruiz', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  apellidos: string;

  @ApiPropertyOptional({ example: 'tallerista@ejemplo.com' })
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
      'idEstudiante en la API del núcleo familiar. Obligatorio para rol ESTUDIANTE.',
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
