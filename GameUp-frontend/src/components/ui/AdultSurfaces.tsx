import { createContext, useContext, type ReactNode } from 'react';

const AdultSurfacesContext = createContext(false);

/**
 * Envuelve las pantallas de los adultos (login, tallerista, directora y
 * acudiente): todo lo que se toca adentro usa el relieve discreto
 * (`depth.adult`) y no rebota. Las pantallas del niño no lo usan.
 */
export function AdultSurfaces({ children }: { children: ReactNode }) {
  return (
    <AdultSurfacesContext.Provider value>
      {children}
    </AdultSurfacesContext.Provider>
  );
}

/** ¿Está dentro de una pantalla de adultos? */
export function useAdultSurfaces(): boolean {
  return useContext(AdultSurfacesContext);
}
