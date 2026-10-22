import { useCallback } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import { VOWELS, type StarCount, type Vowel } from '@/data/types';
import { countPracticed } from './practice';

export interface VowelSelectionData {
  vowels: { vowel: Vowel; stars: StarCount }[];
  practicedCount: number;
  total: number;
}

/** Fichas de vocales con sus estrellas de práctica (Habla conmigo). */
export function useVowelSelection() {
  const { students, practice } = useRepositories();

  const load = useCallback(async (): Promise<VowelSelectionData> => {
    const student = await students.getCurrentStudent();
    const items = await practice.getVowelPractice(student.id);
    // Siempre en orden A, E, I, O, U, aunque falte alguna en los datos.
    const vowels = VOWELS.map((vowel) => ({
      vowel,
      stars: items.find((item) => item.vowel === vowel)?.stars ?? 0,
    }));
    return {
      vowels,
      practicedCount: countPracticed(vowels),
      total: VOWELS.length,
    };
  }, [students, practice]);

  return useResource(load);
}
