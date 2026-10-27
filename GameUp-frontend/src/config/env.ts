/**
 * Configuración leída de las variables de entorno (.env).
 *
 * Expo solo incluye en la app las variables que empiezan por EXPO_PUBLIC_
 * y deben leerse escribiendo el nombre completo (process.env.EXPO_PUBLIC_...).
 * Si se cambia el .env, hay que reiniciar con: npx expo start --clear
 */
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  console.warn(
    '[GameUP] Falta EXPO_PUBLIC_API_URL. Copia .env.example como .env y reinicia Expo.',
  );
}

export const env = {
  /** URL base de la API, sin "/" final. Ej.: http://192.168.1.20:3000/api/v1 */
  apiUrl: (apiUrl ?? '').replace(/\/+$/, ''),
};
