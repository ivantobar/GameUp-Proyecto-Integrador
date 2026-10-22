import { createContext, useContext, type ReactNode } from 'react';
import type { Repositories } from './repositories';

const RepositoryContext = createContext<Repositories | null>(null);

interface RepositoryProviderProps {
  repositories: Repositories;
  children: ReactNode;
}

/**
 * Inyecta los repositorios en la app. El layout raíz decide qué
 * implementación usar (hoy, la simulada).
 */
export function RepositoryProvider({
  repositories,
  children,
}: RepositoryProviderProps) {
  return (
    <RepositoryContext.Provider value={repositories}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoryContext);
  if (!repositories) {
    throw new Error('useRepositories debe usarse dentro de RepositoryProvider');
  }
  return repositories;
}
