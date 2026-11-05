import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsIdNumerico } from '../../../../common/ids/ids.js';
import { PaginacionQueryDto } from '../../../../common/paginacion/paginacion.js';
import {
  ESTADOS_ESTUDIANTE,
  type EstadoEstudiante,
} from '../../../usuarios/domain/usuario.entity.js';

/** GET /estudiantes?estado=ACTIVO&nivelId=1&page=1&limit=20 */
export class ListarEstudiantesQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ enum: ESTADOS_ESTUDIANTE, example: 'ACTIVO' })
  @IsOptional()
  @IsIn(ESTADOS_ESTUDIANTE)
  estado?: EstadoEstudiante;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsIdNumerico()
  nivelId?: string;
}

export class CambiarNivelDto {
  @ApiProperty({ example: '2' })
  @IsIdNumerico()
  nivelId: string;

  @ApiPropertyOptional({
    example: 'Reconoce las cinco vocales',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}

export class AsignarTalleristaDto {
  @ApiProperty({ example: '12', description: 'usuario.id de la tallerista' })
  @IsIdNumerico()
  talleristaId: string;
}

export class VincularAcudienteDto {
  @ApiProperty({ example: '20', description: 'usuario.id del acudiente' })
  @IsIdNumerico()
  acudienteId: string;

  @ApiProperty({ example: 'Madre', maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  parentesco: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}

export class ActualizarAcudienteDto {
  @ApiPropertyOptional({ example: 'Abuela', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  parentesco?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'true lo vuelve el acudiente principal (quita la marca al anterior)',
  })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}
