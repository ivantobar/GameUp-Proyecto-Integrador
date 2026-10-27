import type { Vowel } from '@/data/types';

/**
 * «Así lo practican» (mockup 9). Pasos para la familia; el sonido de la
 * semana se inserta en el segundo. Son indicaciones generales: el gesto lo
 * muestra el video de la profe, no se describe aquí.
 */
export function homeSteps(vowel: Vowel): readonly string[] {
  return [
    'Siéntense frente a frente, a la altura de sus ojos.',
    `Haz el gesto y di «${vowel}» despacio, dos veces.`,
    'Espera. Celebra cada intento, aunque no salga igual.',
    'Con 5 minutos al día es suficiente.',
  ];
}
