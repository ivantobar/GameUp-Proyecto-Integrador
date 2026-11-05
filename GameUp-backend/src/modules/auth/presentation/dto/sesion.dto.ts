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

/** Sesión tal como la usa la app (AuthSession en GameUp-frontend). */
export class SesionUsuarioDto {
  @ApiProperty({ example: '12', description: 'Id interno de GameUP' })
  userId: string;

  @ApiProperty({ enum: ROLES_APP, example: 'teacher' })
  role: RolApp;

  @ApiProperty({
    example: 'Ana Gómez',
    description:
      'Estudiante: primer nombre («Martín»). Adultos: nombre y apellido.',
  })
  displayName: string;
}

export class LoginRespuestaDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.firma',
    description:
      'JWT de la API de seguridad. Se envía en Authorization: Bearer <token>.',
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
