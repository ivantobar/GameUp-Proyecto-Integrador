import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';

/**
 * Punto de entrada de la interfaz. Por ahora muestra una sola pantalla.
 * Cuando se defina la navegación (login, roles, juegos), se conectará aquí.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
