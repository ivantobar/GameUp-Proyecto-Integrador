import { router } from 'expo-router';
import { HeaderCloseButton, ScreenHeader } from '@/components/ui';
import { NarrationButton, StepIndicator } from '@/components/gameup';

export const PRACTICE_STEPS = ['Mira', 'Dilo', 'Listo'] as const;

/** Sale de la práctica y vuelve a la lista de sonidos. */
export function exitPractice() {
  router.dismissTo('/student/speak');
}

interface PracticeHeaderProps {
  step: number;
  narration: string;
}

/** Encabezado de Mira y Dilo: ✕, pasos y parlante. */
export function PracticeHeader({ step, narration }: PracticeHeaderProps) {
  return (
    <ScreenHeader
      left={
        <HeaderCloseButton
          accessibilityLabel="Salir de la práctica"
          onPress={exitPractice}
        />
      }
      center={<StepIndicator steps={PRACTICE_STEPS} current={step} />}
      right={<NarrationButton text={narration} />}
    />
  );
}
