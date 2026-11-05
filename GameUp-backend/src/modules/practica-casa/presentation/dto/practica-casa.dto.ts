import { ApiProperty } from '@nestjs/swagger';
import { EstudianteAsignadoDto } from '../../../asignaciones/presentation/dto/asignacion.dto.js';

export class DiaPracticaDto {
  @ApiProperty({ example: '2026-11-05', format: 'date' }) fecha: string;
  @ApiProperty({ example: true }) practicado: boolean;
}

/** «Practicar en casa» (WeeklyPractice en la app). */
export class PracticaSemanalDto {
  @ApiProperty({ type: EstudianteAsignadoDto })
  estudiante: EstudianteAsignadoDto;
  @ApiProperty({
    example: '2026-11-05',
    format: 'date',
    description: 'Hoy en hora de Bogotá',
  })
  hoy: string;
  @ApiProperty({
    type: [DiaPracticaDto],
    description:
      'Lunes a domingo de esta semana. Cuenta la práctica de cualquier acudiente del estudiante.',
  })
  dias: DiaPracticaDto[];
  @ApiProperty({ example: true }) practicadoHoy: boolean;
}
