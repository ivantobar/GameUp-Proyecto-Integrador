import { LOGIN_TIMEOUT_MS } from '@/config/http';
import type { ApiClient } from '@/services/api';
import {
  ConnectionError,
  ForbiddenError,
  ServerError,
  UnauthorizedError,
} from '@/services/apiErrors';
import {
  AccountNotAllowedError,
  InvalidCredentialsError,
  SignInUnavailableError,
  TooManyAttemptsError,
} from '../authErrors';
import type { AuthRepository } from '../repositories';
import type { LoginDto, LoginRespuestaDto } from './dto/auth';
import { friendlyReason } from './mappers/friendlyReason';
import { toAuthSession } from './mappers/sessionMapper';
import { requireText } from './mappers/responseShape';
import type { TokenStore } from './tokenStore';

/**
 * ¿El backend se estaba despertando? Sin respuesta (o se agotó la espera), o
 * 503: el backend respondió, pero la API de seguridad no.
 */
function isWakingUp(error: unknown): boolean {
  if (error instanceof ConnectionError) return true;
  return error instanceof ServerError && error.status === 503;
}

/**
 * Inicio de sesión con `POST /auth/login` del backend GameUP (que a su vez
 * consulta la API de seguridad; la app nunca la llama directamente).
 */
export function createHttpAuthRepository(
  api: ApiClient,
  tokens: TokenStore,
): AuthRepository {
  return {
    async warmUp() {
      // GET /health es público. Solo despierta a Render: la respuesta no
      // importa y un fallo no se muestra.
      await api
        .get('/health', { authenticated: false, timeoutMs: LOGIN_TIMEOUT_MS })
        .catch(() => {});
    },

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
      const login = () =>
        api.post<LoginRespuestaDto>('/auth/login', body, {
          authenticated: false,
          timeoutMs: LOGIN_TIMEOUT_MS,
        });
      let response: LoginRespuestaDto;
      try {
        // Si el backend (o la API de seguridad) se estaba despertando, se
        // intenta una vez más. Repetir el inicio de sesión no tiene riesgo.
        response = await login().catch((error: unknown) => {
          if (isWakingUp(error)) return login();
          throw error;
        });
      } catch (error: unknown) {
        // Mismos errores que la versión simulada (sustitución de Liskov).
        if (error instanceof UnauthorizedError)
          throw new InvalidCredentialsError();
        // 403: el backend dice el motivo (inactiva, rol distinto, no está
        // en ASISCO UP...). Solo se pasa si es texto claro para la persona.
        if (error instanceof ForbiddenError) {
          throw new AccountNotAllowedError(friendlyReason(error.message));
        }
        // 503: el backend respondió, pero la API de seguridad no (por
        // ejemplo, se estaba despertando en Render). No es la red del teléfono.
        if (error instanceof ServerError && error.status === 503) {
          throw new SignInUnavailableError();
        }
        // 429: el backend frena los intentos seguidos (10 por minuto con el
        // mismo correo, 100 desde la misma red). No es falta de internet.
        if (error instanceof ServerError && error.status === 429) {
          throw new TooManyAttemptsError();
        }
        throw error;
      }

      const session = toAuthSession(response.usuario);
      await tokens.set(requireText(response.token, 'token'));
      return session;
    },
  };
}
