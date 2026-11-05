import type { ApiClient } from '@/services/api';
import type { Repositories } from '../repositories';
import { createHttpAuthRepository } from './httpAuthRepository';
import { createHttpStaffRepository } from './httpStaffRepository';
import { createHttpStudentRepository } from './httpStudentRepository';
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
  };
}
