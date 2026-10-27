import { GameDoneScreen } from '@/features/games/components/GameDoneScreen';

/** Cierre de Secuenciar. */
export default function SequenceDone() {
  return (
    <GameDoneScreen
      message="Ordenaste los pasos de cada rutina"
      replayHref="/student/sequence"
    />
  );
}
