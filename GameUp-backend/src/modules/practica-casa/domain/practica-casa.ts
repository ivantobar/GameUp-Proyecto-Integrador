import {
  aFechaSinHora,
  fechaSinHoraATexto,
} from '../../../common/fechas/fechas.js';
import type { PersonaResumen } from '../../estudiantes/domain/estudiante.entity.js';

const MS_DIA = 24 * 60 * 60 * 1000;

/**
 * Los 7 días (lunes a domingo) de la semana que contiene `hoy`
 * ("2026-11-05", ya en hora de Bogotá). Función pura.
 */
export function semanaDe(hoy: string): string[] {
  const dia = aFechaSinHora(hoy);
  // getUTCDay: 0 = domingo … 6 = sábado. Lunes = 0 días atrás.
  const desdeLunes = (dia.getUTCDay() + 6) % 7;
  const lunes = dia.getTime() - desdeLunes * MS_DIA;
  return Array.from({ length: 7 }, (_, i) =>
    fechaSinHoraATexto(new Date(lunes + i * MS_DIA)),
  );
}

/** «Practicar en casa» de un estudiante en la semana actual. */
export interface PracticaSemanal {
  estudiante: PersonaResumen;
  /** "2026-11-05" en hora de Bogotá. */
  hoy: string;
  /** Lunes a domingo, con si se practicó (cualquier acudiente del estudiante). */
  dias: Array<{ fecha: string; practicado: boolean }>;
  practicadoHoy: boolean;
}

export function armarSemana(
  estudiante: PersonaResumen,
  hoy: string,
  practicados: readonly string[],
): PracticaSemanal {
  const marcados = new Set(practicados);
  return {
    estudiante,
    hoy,
    dias: semanaDe(hoy).map((fecha) => ({
      fecha,
      practicado: marcados.has(fecha),
    })),
    practicadoHoy: marcados.has(hoy),
  };
}
