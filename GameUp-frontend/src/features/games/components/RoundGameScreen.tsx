import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  HeaderBackButton,
  ProgressDots,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { NarrationButton } from '@/components/gameup';
import type { TurnPhase } from '../turnGame';
import { typography } from '@/theme';

/** Mensajes de apoyo comunes. Nunca dicen «mal», «error» ni «incorrecto». */
export const supportMessages = {
  hinted: '¡Casi! Prueba con la que tiene la manito',
  solved: '¡Muy bien!',
} as const;

/** Mensaje de apoyo según la fase del turno (`null`: ninguno). */
export function phaseMessage(phase: TurnPhase): string | null {
  return phase === 'asking' ? null : supportMessages[phase];
}

interface RoundGameScreenProps {
  /** Pregunta de la ronda, corta: «¿Qué palabra es?». */
  question: string;
  /** Lo que lee el parlante del encabezado. */
  narration: string;
  /** Ronda actual (desde 0) y total, para los puntos de avance. */
  index: number;
  total: number;
  /** La ronda está completa: se habilita «Siguiente». */
  solved: boolean;
  isLast: boolean;
  onNext: () => void;
  /** Qué falta para poder seguir (lo oye el lector de pantalla). */
  pendingHint: string;
  /** Mensaje de apoyo bajo la pregunta (pista o felicitación). */
  message: string | null;
  children: ReactNode;
}

/**
 * Marco común de Emparejar, Clasificar, Secuenciar y Memoria, con el mismo
 * flujo que «Busca la boca»: volver, puntos de avance y parlante arriba;
 * pregunta; juego; y «Siguiente» abajo, que se habilita al completar la
 * ronda. Sin tiempo límite, vidas ni puntaje.
 */
export function RoundGameScreen({
  question,
  narration,
  index,
  total,
  solved,
  isLast,
  onNext,
  pendingHint,
  message,
  children,
}: RoundGameScreenProps) {
  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          center={<ProgressDots total={total} current={index} />}
          right={<NarrationButton text={narration} />}
        />
      }
      footer={
        <Button
          label={isLast ? 'Terminar' : 'Siguiente'}
          size="large"
          disabled={!solved}
          accessibilityHint={solved ? undefined : pendingHint}
          onPress={onNext}
        />
      }
    >
      <View style={styles.top}>
        <AppText
          variant="title"
          accessibilityRole="header"
          style={styles.center}
        >
          {question}
        </AppText>
        {/* Espacio fijo: el juego no salta cuando aparece el mensaje. */}
        <View style={styles.message} accessibilityLiveRegion="polite">
          {message ? (
            <AppText variant="bodyStrong" tone="marca" style={styles.center}>
              {message}
            </AppText>
          ) : null}
        </View>
      </View>
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
  message: {
    minHeight: typography.bodyStrong.lineHeight,
    justifyContent: 'center',
  },
});
