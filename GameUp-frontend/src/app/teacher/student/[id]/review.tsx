import { useLocalSearchParams } from 'expo-router';
import { ReviewQueueView } from '@/features/review/components/ReviewQueueView';

/** Docente · «Por escuchar» de un estudiante: solo sus actividades. */
export default function TeacherStudentReviewScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  return (
    <ReviewQueueView title="Por escuchar" studentId={id} studentName={name} />
  );
}
