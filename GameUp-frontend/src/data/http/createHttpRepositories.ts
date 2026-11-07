import type { ApiClient } from '@/services/api';
import type { Repositories } from '../repositories';
import { createHttpAssignmentManagementRepository } from './httpAssignmentManagementRepository';
import { createHttpAuthRepository } from './httpAuthRepository';
import { createHttpGuardianRepository } from './httpGuardianRepository';
import { createHttpLevelRepository } from './httpLevelRepository';
import { createHttpReviewRepository } from './httpReviewRepository';
import { createHttpStaffRepository } from './httpStaffRepository';
import {
  createHttpActivityRepository,
  createHttpAssignmentRepository,
  createHttpConsentRepository,
  createHttpPracticeRepository,
  createHttpProgressRepository,
} from './httpStudentFlowRepositories';
import { createHttpStudentDirectoryRepository } from './httpStudentDirectoryRepository';
import { createHttpStudentRepository } from './httpStudentRepository';
import {
  createHttpRecordingRepository,
  createHttpResultRepository,
} from './httpSubmissionRepositories';
import type { TokenStore } from './tokenStore';

/** Repositorios que hablan con la API NestJS. Cumplen las mismas interfaces que los simulados. */
export function createHttpRepositories(
  api: ApiClient,
  tokens: TokenStore,
): Repositories {
  return {
    auth: createHttpAuthRepository(api, tokens),
    students: createHttpStudentRepository(api),
    staff: createHttpStaffRepository(api),
    practice: createHttpPracticeRepository(api),
    assignments: createHttpAssignmentRepository(api),
    activities: createHttpActivityRepository(api),
    progress: createHttpProgressRepository(api),
    levels: createHttpLevelRepository(api),
    consent: createHttpConsentRepository(api),
    recordings: createHttpRecordingRepository(api),
    results: createHttpResultRepository(api),
    reviews: createHttpReviewRepository(api),
    guardians: createHttpGuardianRepository(api),
    directory: createHttpStudentDirectoryRepository(api),
    assignmentManagement: createHttpAssignmentManagementRepository(api),
  };
}
