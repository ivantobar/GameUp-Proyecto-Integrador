import { GameDoneScreen } from '@/features/games/components/GameDoneScreen';

/** Cierre de Memoria. */
export default function MemoryDone() {
  return (
    <GameDoneScreen
      message="Encontraste todas las parejas"
      replayHref="/student/memory"
    />
  );
}
