import { useCallback, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useRepositories } from '@/data/RepositoryProvider';
import {
  deleteRecordingsErrorText,
  recordingsDeletedText,
} from './recordingsText';

export interface RecordingsMessage {
  tone: 'done' | 'problem';
  text: string;
}

/**
 * «Borrar grabaciones» de un estudiante (solo la directora): pedir
 * confirmación, borrar y decir cuántas se borraron. El resultado se
 * anuncia al lector de pantalla.
 */
export function useDeleteRecordings(studentId: string) {
  const { reviews } = useRepositories();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<RecordingsMessage | null>(null);

  const ask = useCallback(() => {
    setMessage(null);
    setConfirming(true);
  }, []);

  const cancel = useCallback(() => setConfirming(false), []);

  const confirm = useCallback(async () => {
    setBusy(true);
    try {
      const count = await reviews.deleteStudentRecordings(studentId);
      const text = recordingsDeletedText(count);
      setMessage({ tone: 'done', text });
      AccessibilityInfo.announceForAccessibility(text);
    } catch (problem) {
      const text = deleteRecordingsErrorText(problem);
      setMessage({ tone: 'problem', text });
      AccessibilityInfo.announceForAccessibility(text);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }, [reviews, studentId]);

  return { confirming, busy, message, ask, cancel, confirm };
}
