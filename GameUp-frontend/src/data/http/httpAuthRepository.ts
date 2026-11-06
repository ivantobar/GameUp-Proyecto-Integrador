import type { ApiClient } from '@/services/api';
import {
  ForbiddenError,
  ServerError,
  UnauthorizedError,
} from '@/services/apiErrors';
import {
  AccountNotAllowedError,
  InvalidCredentialsError,
  SignInUnavailableError,
} from '../authErrors';
import type { AuthRepository } from '../repositories';
import type { LoginDto, LoginRespuestaDto } from './dto/auth';
import { toAuthSession } from './mappers/sessionMapper';
import { requireText } from './mappers/responseShape';
import type { TokenStore } from './tokenStore';

/**
 * Inicio de sesión con `POST /auth/login` del backend GameUP (que a su vez
 * consulta la API de seguridad; la app nunca la llama directamente).
 */
export function createHttpAuthRepository(
  api: ApiClient,
  tokens: TokenStore,
): AuthRepository {
  return {
    async signOut() {
      // El token lo emite la API de seguridad: GameUP no puede revocarlo,
      // solo olvidarlo. Se avisa al backend si hay sesión, sin esperar a que
      // responda bien: en el teléfono la sesión se cierra igual.
      if (await tokens.get()) {
        await api.post('/auth/logout').catch(() => {});
      }
      await tokens.clear();
    },

    async signIn({ email, password }) {
      // Al entrar con otra cuenta, la sesión anterior se olvida primero.
      await tokens.clear();

      const body: LoginDto = { correo: email, contrasena: password };
      let response: LoginRespuestaDto;
      try {
        response = await api.post<LoginRespuestaDto>('/auth/login', body, {
          authenticated: false,
        });
      } catch (error: unknown) {
        // Mismos errores que la versión simulada (sustitución de Liskov).
        if (error instanceof UnauthorizedError)
          throw new InvalidCredentialsError();
        if (error instanceof ForbiddenError) throw new AccountNotAllowedError();
        // 503: el backend respondió, pero la API de seguridad no (por
        // ejemplo, se estaba despertando en Render). No es la red del teléfono.
        if (error instanceof ServerError && error.status === 503) {
          throw new SignInUnavailableError();
        }
        throw error;
      }

      const session = toAuthSession(response.usuario);
      await tokens.set(requireText(response.token, 'token'));
      return session;
    },
  };
}
