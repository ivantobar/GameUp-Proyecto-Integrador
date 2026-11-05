import type { ApiClient } from '@/services/api';
import { ForbiddenError, UnauthorizedError } from '@/services/apiErrors';
import { AccountNotAllowedError, InvalidCredentialsError } from '../authErrors';
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
        throw error;
      }

      const session = toAuthSession(response.usuario);
      await tokens.set(requireText(response.token, 'token'));
      return session;
    },
  };
}
