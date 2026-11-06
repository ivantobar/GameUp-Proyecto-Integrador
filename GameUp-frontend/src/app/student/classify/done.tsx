import { GameDoneScreen } from '@/features/games/components/GameDoneScreen';

/** Cierre de Clasificar. */
export default function ClassifyDone() {
  return (
    <GameDoneScreen
      message="Pusiste cada uno en su grupo"
      replayPath="/student/classify"
    />
  );
}
