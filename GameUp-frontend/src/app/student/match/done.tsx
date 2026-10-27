import { GameDoneScreen } from '@/features/games/components/GameDoneScreen';

/** Cierre de Emparejar. */
export default function MatchDone() {
  return (
    <GameDoneScreen
      message="Encontraste todas las parejas"
      replayHref="/student/match"
    />
  );
}
