import { Redirect } from 'expo-router';

/**
 * Ruta inicial: la app empieza en «Iniciar sesión». En desarrollo, desde
 * ahí se puede ir al «Modo desarrollo» para revisar cada rol.
 */
export default function Index() {
  return <Redirect href="/login" />;
}
