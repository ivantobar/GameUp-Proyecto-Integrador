import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRepositories } from '@/data/RepositoryProvider';
import { useResource } from '@/data/useResource';
import type { StudentSummary } from '@/data/types';
import { overallPercent } from './assignmentText';
import { createLimiter } from './runLimited';

/** Pedidos de progreso a la vez: no satura la red ni el backend. */
export const PROGRESS_CONCURRENCY = 5;
/** Filas que se muestran de una vez («Ver más» agrega otras tantas). */
export const ROSTER_PAGE_SIZE = 20;

export interface RosterRow {
  student: StudentSummary;
  /**
   * Progreso oficial de 0 a 100 (solo lo validado); `null` si no se pudo
   * cargar («Progreso no disponible»); `undefined` mientras se pide.
   */
  percent: number | null | undefined;
  /**
   * `true` si se sabe que no tiene ninguna tallerista activa (etiqueta «Sin
   * tallerista»). Mientras se pide, si falla o si no se pidió: `false`.
   */
  withoutTeacher: boolean;
}

interface RosterOptions {
  /**
   * Pide también quién tiene a cargo a cada fila visible (solo la
   * directora: el backend no deja al docente).
   */
  withTeacherStatus?: boolean;
}

/** Sin mayúsculas ni tildes: «maria» encuentra a «María». */
export function normalizeName(text: string): string {
  const lower = text.trim().toLowerCase();
  return typeof lower.normalize === 'function'
    ? lower.normalize('NFD').replace(/[̀-ͯ]/g, '')
    : lower;
}

/**
 * Estudiantes que puede ver el adulto con sesión, con búsqueda por nombre
 * (en el teléfono: el backend no la ofrece) y su progreso oficial.
 *
 * La lista completa es barata; el progreso, no: se pide solo para las filas
 * visibles, de a `ROSTER_PAGE_SIZE`, con a lo sumo `PROGRESS_CONCURRENCY`
 * pedidos a la vez en total. Si falla el de un estudiante, solo esa fila
 * queda sin progreso. Con `withTeacherStatus`, cada fila visible pide
 * también sus talleristas (en la misma cola) para la etiqueta «Sin
 * tallerista».
 */
export function useStudentRoster({
  withTeacherStatus = false,
}: RosterOptions = {}) {
  const { directory, teacherLinks } = useRepositories();
  const load = useCallback(() => directory.listStudents(), [directory]);
  const { resource, reload, refresh: refreshList } = useResource(load);

  const [query, setQueryValue] = useState('');
  const [limit, setLimit] = useState(ROSTER_PAGE_SIZE);
  const [progress, setProgress] = useState<Record<string, number | null>>({});
  /** ¿Tiene alguna tallerista activa? Solo se guarda si se pudo saber. */
  const [hasTeacher, setHasTeacher] = useState<Record<string, boolean>>({});
  /** Sube con cada «refresh»: las filas visibles vuelven a pedir su progreso. */
  const [version, setVersion] = useState(0);
  /** Versión ya pedida (o en curso) de cada estudiante. */
  const requested = useRef(new Map<string, number>());
  const limiter = useMemo(() => createLimiter(PROGRESS_CONCURRENCY), []);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const students = useMemo(
    () => (resource.status === 'ready' ? resource.data : []),
    [resource],
  );
  const matches = useMemo(() => {
    const wanted = normalizeName(query);
    if (!wanted) return students;
    return students.filter((s) =>
      normalizeName(s.displayName).includes(wanted),
    );
  }, [students, query]);
  const visible = useMemo(() => matches.slice(0, limit), [matches, limit]);

  useEffect(() => {
    visible
      .filter((s) => requested.current.get(s.id) !== version)
      .forEach((student) => {
        requested.current.set(student.id, version);
        limiter(() => directory.getStudentProgress(student.id)).then(
          (value) => {
            if (mounted.current) {
              setProgress((prev) => ({
                ...prev,
                [student.id]: overallPercent(value),
              }));
            }
          },
          () => {
            if (mounted.current) {
              setProgress((prev) => ({ ...prev, [student.id]: null }));
            }
          },
        );
        if (!withTeacherStatus) return;
        limiter(() => teacherLinks.listStudentTeachers(student.id)).then(
          (teachers) => {
            if (mounted.current) {
              setHasTeacher((prev) => ({
                ...prev,
                [student.id]: teachers.some((t) => t.active),
              }));
            }
          },
          // Si falla, simplemente no se muestra la etiqueta.
          () => {},
        );
      });
  }, [visible, version, directory, teacherLinks, limiter, withTeacherStatus]);

  const setQuery = useCallback((text: string) => {
    setQueryValue(text);
    setLimit(ROSTER_PAGE_SIZE);
  }, []);

  const showMore = useCallback(
    () => setLimit((value) => value + ROSTER_PAGE_SIZE),
    [],
  );

  /** Vuelve a pedir la lista y el progreso visible, sin ocultar lo que se ve. */
  const refresh = useCallback(() => {
    refreshList();
    setVersion((value) => value + 1);
  }, [refreshList]);

  const rows: RosterRow[] = visible.map((student) => ({
    student,
    percent: progress[student.id],
    withoutTeacher: hasTeacher[student.id] === false,
  }));

  return {
    resource,
    reload,
    refresh,
    query,
    setQuery,
    rows,
    /** Cuántos coinciden con la búsqueda (o todos, sin búsqueda). */
    matchCount: matches.length,
    hasMore: matches.length > visible.length,
    showMore,
  };
}
