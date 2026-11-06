import type { ReactNode } from 'react';
import { router } from 'expo-router';
import {
  HeaderBackButton,
  Screen,
  ScreenHeader,
  StateView,
} from '@/components/ui';
import type { Resource } from '@/data/useResource';

interface GameContentGateProps<T> {
  resource: Resource<T>;
  reload: () => void;
  /** El juego, cuando su contenido está listo. */
  children: (content: T) => ReactNode;
}

/**
 * Espera el contenido de un juego antes de mostrarlo: «Preparando el
 * juego…» mientras carga y, si falla, «Vamos a intentarlo otra vez» con un
 * botón para reintentar (nunca un error técnico).
 */
export function GameContentGate<T>({
  resource,
  reload,
  children,
}: GameContentGateProps<T>) {
  if (resource.status === 'ready') return <>{children(resource.data)}</>;
  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
        />
      }
    >
      {resource.status === 'loading' ? (
        <StateView kind="loading" title="Preparando el juego…" />
      ) : (
        <StateView
          kind="error"
          title="Vamos a intentarlo otra vez"
          action={{ label: 'Intentar de nuevo', onPress: reload }}
        />
      )}
    </Screen>
  );
}
