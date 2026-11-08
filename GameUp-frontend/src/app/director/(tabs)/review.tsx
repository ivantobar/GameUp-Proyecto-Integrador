import { ReviewQueueView } from '@/features/review/components/ReviewQueueView';

/** Directora · «Por validar»: los intentos pendientes de todos. */
export default function DirectorReviewScreen() {
  return <ReviewQueueView title="Por validar" showGestureNotice={false} />;
}
