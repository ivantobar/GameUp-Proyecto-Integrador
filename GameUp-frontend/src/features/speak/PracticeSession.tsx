import { createContext, useContext, useState, type ReactNode } from 'react';
import type { PracticeOutcome } from './completePractice';

interface PracticeSessionValue {
  /** Resultado del último ciclo, para mostrarlo en «Listo». */
  outcome: PracticeOutcome | null;
  setOutcome: (outcome: PracticeOutcome | null) => void;
}

const PracticeSessionContext = createContext<PracticeSessionValue | null>(null);

/**
 * Comparte el resultado entre Dilo y Listo sin ponerlo en la URL (la ruta
 * del archivo de voz no debe viajar como parámetro).
 */
export function PracticeSessionProvider({ children }: { children: ReactNode }) {
  const [outcome, setOutcome] = useState<PracticeOutcome | null>(null);
  return (
    <PracticeSessionContext.Provider value={{ outcome, setOutcome }}>
      {children}
    </PracticeSessionContext.Provider>
  );
}

export function usePracticeSession(): PracticeSessionValue {
  const value = useContext(PracticeSessionContext);
  if (!value) {
    throw new Error(
      'usePracticeSession debe usarse dentro de PracticeSessionProvider',
    );
  }
  return value;
}
