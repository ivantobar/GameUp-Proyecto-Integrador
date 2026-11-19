import type { ReactNode } from 'react';
import { Redirect, type Href } from 'expo-router';
import type { AuthSession, UserRole } from '@/data/types';
import { roleHomes } from './roleHome';
import { useSession } from './SessionProvider';

/**
 * A dónde llevar a quien abre el espacio de `role`, o `null` si puede verlo:
 * - sin sesión → «Iniciar sesión»;
 * - con otro rol → el inicio de su propio rol.
 */
export function roleRedirect(
  session: AuthSession | null,
  role: UserRole,
): Href | null {
  if (!session) return '/login';
  if (session.role === role) return null;
  return roleHomes[session.role] ?? '/login';
}

interface RoleGateProps {
  role: UserRole;
  children: ReactNode;
}

/**
 * Guarda de cada espacio (estudiante, docente, acudiente, directora): un
 * enlace directo (por ejemplo, `gameup://director`) no muestra pantallas de
 * otro rol. No reemplaza los permisos: el backend los verifica en cada
 * petición.
 */
export function RoleGate({ role, children }: RoleGateProps) {
  const { session } = useSession();
  const target = roleRedirect(session, role);
  if (target) return <Redirect href={target} />;
  return children;
}
