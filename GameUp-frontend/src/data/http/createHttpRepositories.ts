import type { ApiClient } from '@/services/api';
import type { Repositories } from '../repositories';
import { createHttpAuthRepository } from './httpAuthRepository';
import { createHttpReviewRepository } from './httpReviewRepository';
import { createHttpStaffRepository } from './httpStaffRepository';
import {
  createHttpActivityRepository,
  createHttpAssignmentRepository,
  createHttpConsentRepository,
  createHttpPracticeRepository,
  createHttpProgressRepository,
} from './httpStudentFlowRepositories';
import { createHttpStudentRepository } from './httpStudentRepository';
import {
  createHttpRecordingRepository,
  createHttpResultRepository,
} from './httpSubmissionRepositories';
import { notConnectedRepositories } from './notConnectedRepositories';
import type { TokenStore } from './tokenStore';

/** Repositorios que hablan con la API NestJS. Cumplen las mismas interfaces que los simulados. */
export function createHttpRepositories(
  api: ApiClient,
  tokens: TokenStore,
): Repositories {
  return {
    ...notConnectedRepositories,
    auth: createHttpAuthRepository(api, tokens),
    students: createHttpStudentRepository(api),
    staff: createHttpStaffRepository(api),
    practice: createHttpPracticeRepository(api),
    assignments: createHttpAssignmentRepository(api),
    activities: createHttpActivityRepository(api),
    progress: createHttpProgressRepository(api),
    consent: createHttpConsentRepository(api),
    recordings: createHttpRecordingRepository(api),
    results: createHttpResultRepository(api),
    reviews: createHttpReviewRepository(api),
  };
}
