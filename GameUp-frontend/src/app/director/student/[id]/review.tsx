import { useLocalSearchParams } from 'expo-router';
import { ReviewQueueView } from '@/features/review/components/ReviewQueueView';

/** Directora · «Por validar» de un estudiante: solo sus actividades. */
export default function DirectorStudentReviewScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  return (
    <ReviewQueueView title="Por validar" studentId={id} studentName={name} />
  );
}
