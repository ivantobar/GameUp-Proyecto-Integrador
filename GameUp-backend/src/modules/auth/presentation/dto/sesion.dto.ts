import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type { RolApp } from '../../domain/mapeador-roles.js';

const ROLES_APP: RolApp[] = ['student', 'teacher', 'guardian', 'director'];

/** Lo que escribe la persona en «Iniciar sesión». */
export class LoginDto {
  @ApiProperty({ example: 'tallerista@ejemplo.com' })
  @IsEmail()
  @MaxLength(254)
  correo: string;

  @ApiProperty({ example: 'clave-de-ejemplo', format: 'password' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  contrasena: string;
}

/**
 * Identidad de la persona según la API central (GET /api/auth/perfil).
 * Solo lo necesario: nunca documento, teléfono, dirección ni fecha de nacimiento.
 */
export class IdentidadCentralDto {
  @ApiProperty({
    example: '47',
    description:
      '`id_usuario` en la API central (en GameUP se guarda como `idUsuarioAuth`).',
  })
  idUsuario: string;

  @ApiProperty({ example: 'Ana María', nullable: true, type: String })
  nombres: string | null;

  @ApiProperty({ example: 'Gómez Ruiz', nullable: true, type: String })
  apellidos: string | null;

  @ApiProperty({
    example: 'tallerista@ejemplo.com',
    nullable: true,
    type: String,
  })
  correo: string | null;

  @ApiProperty({
    example: ['TALLERISTA'],
    type: [String],
    description:
      'Roles centrales (`nombre_rol`) tal como los da la API central. ADMIN equivale a DIRECTORA en GameUP.',
  })
  roles: string[];
}

/** Sesión tal como la usa la app (AuthSession en GameUp-frontend). */
export class SesionUsuarioDto {
  @ApiProperty({
    example: '12',
    description:
      'Id interno de GameUP (`usuario.id`). No es el `id_usuario` de la API central.',
  })
  userId: string;

  @ApiProperty({
    enum: ROLES_APP,
    example: 'teacher',
    description: 'Rol dentro de GameUP (no el rol central).',
  })
  role: RolApp;

  @ApiProperty({
    example: 'Ana Gómez',
    description:
      'Estudiante: primer nombre («Martín»). Adultos: nombre y apellido.',
  })
  displayName: string;

  @ApiProperty({
    type: IdentidadCentralDto,
    description:
      'La identidad y los roles vienen de GET /api/auth/perfil de la API central; ' +
      '`role` es el rol dentro de GameUP.',
  })
  identidadCentral: IdentidadCentralDto;
}

export class LoginRespuestaDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.firma',
    description:
      'JWT de la API central (POST /api/auth/login). GameUP no firma tokens: ' +
      'se envía tal cual en Authorization: Bearer <token>.',
  })
  token: string;

  @ApiProperty({
    example: '2026-11-06T20:00:00.000Z',
    nullable: true,
    type: String,
    description: 'Vencimiento del token (exp), si el token lo trae.',
  })
  expiraEn: string | null;

  @ApiProperty({ type: SesionUsuarioDto })
  usuario: SesionUsuarioDto;
}
