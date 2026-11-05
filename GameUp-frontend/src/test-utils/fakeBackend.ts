import { MOCK_PASSWORD, mockAccounts, mockStudent } from '@/data/mock/fixtures';
import { createFakeFetch, errorResponse, jsonResponse } from './fakeFetch';

export const FAKE_API_URL = 'http://api.prueba/api/v1';

/**
 * Backend GameUP falso, con las mismas cuentas ficticias que los datos
 * simulados. Sirve para comprobar que la versión HTTP y la simulada se
 * comportan igual ante la misma interfaz. Solo responde las rutas que la
 * app ya usa.
 */
export function createFakeBackend() {
  const tokenOf = (email: string) => `token-de-prueba:${email}`;

  return createFakeFetch(({ url, method, headers, body }) => {
    const path = url.replace(FAKE_API_URL, '');
    const auth = headers.Authorization ?? '';
    const email = auth.startsWith('Bearer token-de-prueba:')
      ? auth.slice('Bearer token-de-prueba:'.length)
      : null;
    const session = email ? mockAccounts[email] : undefined;

    if (method === 'POST' && path === '/auth/login') {
      const { correo, contrasena } = body as {
        correo: string;
        contrasena: string;
      };
      const account = mockAccounts[correo];
      if (!account || contrasena !== MOCK_PASSWORD) {
        return errorResponse(401, 'Correo o contraseña incorrectos');
      }
      return jsonResponse(200, {
        token: tokenOf(correo),
        expiraEn: null,
        usuario: account,
      });
    }

    if (!session) return errorResponse(401, 'Sesión no válida');

    if (method === 'GET' && path === '/auth/me') {
      return jsonResponse(200, session);
    }
    if (method === 'GET' && path === '/estudiantes/me') {
      if (session.role !== 'student') return errorResponse(403, 'Sin permiso');
      return jsonResponse(200, {
        id: session.userId,
        displayName: mockStudent.displayName,
        personajeAvatar: null,
        nivel: { id: '1', nombre: 'BAJO' },
      });
    }
    return errorResponse(404, 'Ruta no encontrada');
  });
}
