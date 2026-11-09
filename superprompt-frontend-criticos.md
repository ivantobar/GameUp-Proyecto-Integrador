# SUPERPROMPT · GameUP frontend: corregir los 3 puntos críticos de la auditoría

> Copia todo este archivo y pégalo en Claude Code abierto en la raíz del repo `GameUp-Proyecto-Integrador`.

---

## Rol y contexto

Actúa como desarrollador senior de React Native + Expo en el proyecto **GameUP**. GameUP es una app móvil de aula virtual inclusiva para la Fundación ASISCO-UP, que acompaña a niños con síndrome de Down. El repo tiene dos carpetas:

- `GameUp-frontend/`: Expo SDK 58, Expo Router (rutas en `src/app/`), TypeScript y Jest.
- `GameUp-backend/`: NestJS + Prisma + Supabase. Ya está terminado. **No lo modifiques en esta tarea.**

Una auditoría del frontend (rama `main`, commit f1c6202) encontró **3 puntos críticos** que bloquean el MVP. Tu tarea es corregirlos, en ese orden y por fases. Antes de escribir código, lee `GameUp-frontend/AGENTS.md` y `GameUp-frontend/README.md` y respeta lo que dicen. Usa siempre la documentación de Expo v58, no tu memoria.

## Reglas obligatorias (no negociables)

1. **Rama:** crea `frontend/criticos-auditoria` desde `main` actualizado. Haz un commit por fase, con mensaje en español. No hagas push ni abras PR hasta que yo lo pida.
2. **Arquitectura existente:**
   - Las pantallas solo dependen de las interfaces de `src/data/repositories.ts`.
   - Cada interfaz nueva lleva su implementación en `src/data/http/` (DTO en `dto/`, mapeador en `mappers/`) **y** su versión simulada en `src/data/mock/createMockRepositories.ts` con datos de `fixtures.ts`.
   - El único punto que elige entre mock y API es `src/data/createRepositories.ts`.
   - Usa los componentes de `src/components/ui` y `src/components/gameup` y los tokens de `src/theme`. Ningún color, tamaño ni duración se escribe a mano.
   - Los hooks van en `src/features/<área>/` y las rutas en `src/app/`. Una pantalla solo compone.
3. **No inventes endpoints ni campos.** Antes de consumir un endpoint, lee su controlador y su DTO en `GameUp-backend/src/modules/**/presentation/` y copia los nombres exactos. Si algo no existe, detente y pregúntame.
4. **Accesibilidad:**
   - Todo elemento tocable lleva `accessibilityRole` y `accessibilityLabel`.
   - Los botones usan los tamaños del tema: mínimo `sizes.touchMin`, y `sizes.button` o `buttonLarge` para las acciones principales.
   - Textos breves. Siempre se muestran los estados de carga, error y vacío con `StateView`.
5. **Permisos:** la app no decide permisos. Ocultar opciones no basta: el backend los verifica. Si responde 403 o 404, muestra un mensaje claro, no «Revisa la conexión».
6. **Seguridad:** ningún secreto en el código ni en `EXPO_PUBLIC_*`. No escribas tokens, correos ni nombres de estudiantes en `console.*`.
7. **No agregues dependencias.** Si de verdad necesitas una, instálala con `npx expo install` y explícame por qué.
8. **Al terminar cada fase**, ejecuta en `GameUp-frontend/`: `npx tsc --noEmit`, `npx expo lint` y `npx jest`. Las tres deben pasar. **Nunca** desactives ni saltes una prueba. Agrega pruebas nuevas para lo que construyas (hooks, mapeadores y repositorio HTTP con `src/test-utils/fakeBackend.ts` o `fakeFetch.ts`), siguiendo el estilo de las que ya existen.
9. **Antes de cada fase**, muéstrame un plan corto: archivos que vas a crear o tocar y endpoints que vas a usar. Espera mi «ok» y después implementa. Al final de cada fase, dame un resumen y los resultados de las 3 comprobaciones.
10. Responde y comenta el código en español, como el resto del proyecto.

---

## Fase 1 · C3: la app no debe usar datos simulados por accidente

**Problema:** en `src/config/env.ts`, `parseDataSource` devuelve `'mock'` para cualquier valor distinto de `'api'`. Si una build olvida `EXPO_PUBLIC_DATA_SOURCE=api`, la app muestra datos falsos y acepta las cuentas de `src/data/mock/fixtures.ts`, cuya contraseña está en el código.

**Qué hacer:**
- Fuera de `__DEV__`, el origen de datos es **siempre** `'api'`, diga lo que diga la variable. El modo `mock` solo existe en desarrollo.
- Fuera de `__DEV__`, si `EXPO_PUBLIC_API_URL` está vacía o no empieza por `https://`, la app muestra una pantalla amable de configuración incorrecta (por ejemplo, «GameUP no está bien configurado. Avísale a la fundación.») y no deja iniciar sesión. En desarrollo se sigue aceptando `http://` con la IP local.
- Actualiza `.env.example`: deja como valor de ejemplo `https://gameup-backend.onrender.com/api/v1` y explica en un comentario cuándo usar la IP local.
- Pruebas: `parseDataSource` y la validación de la URL, en desarrollo y fuera de desarrollo. Mira cómo se simula `__DEV__` en las pruebas existentes; si no hay, haz que la función reciba `isDev` como parámetro.

---

## Fase 2 · C2: el docente (tallerista) asigna actividades y ve a sus estudiantes

**Problema:** `src/app/teacher/index.tsx` solo muestra «Por escuchar». La app no usa `POST /asignaciones` ni `GET /asignaciones`, que ya existen. Por eso el ciclo realización → validación → progreso no se puede empezar desde la app.

**Endpoints existentes** (verifícalos en el código antes de usarlos):
- `GET /estudiantes`: estudiantes que puede ver el usuario. Roles: DIRECTORA, TALLERISTA y ACUDIENTE; el tallerista ve solo los suyos. Revisa `ListarEstudiantesQueryDto` para la paginación.
- `GET /estudiantes/:id`: detalle.
- `GET /estudiantes/:id/progreso`: progreso oficial, que solo cuenta lo validado.
- `GET /estudiantes/:id/actividades`: actividades del estudiante.
- `GET /modulos`: roles DIRECTORA y TALLERISTA. Revisa `ListarModulosQueryDto`: solo se pueden asignar módulos publicados; confirma cómo se filtran.
- `POST /asignaciones`: cuerpo `{ moduloId, estudianteId, fechaSugerida? }` (`CrearAsignacionDto`; fecha `AAAA-MM-DD`, no antes de hoy en hora de Bogotá). Roles: DIRECTORA y TALLERISTA.
- `GET /asignaciones?estudianteId=&estado=`: asignaciones con su avance (`AsignacionDto`).
- `DELETE /asignaciones/:id`: quitar una asignación. Roles: DIRECTORA y TALLERISTA.

**Qué construir:**
1. **Navegación del docente** con pestañas, siguiendo el patrón de `src/app/student/(tabs)/`: «Por escuchar» (la pantalla actual, sin perder nada de lo que hace hoy) y «Mis estudiantes». Mantén `SignOutButton`.
2. **«Mis estudiantes»:** lista con iniciales, nombre y una barra de progreso oficial. Incluye estados de carga, error y vacío («Todavía no tienes estudiantes asignados»).
3. **Detalle del estudiante** (`/teacher/student/[id]`):
   - Progreso oficial por módulo (reutiliza `ModuleProgressCard` si encaja).
   - Sus niveles por juego (`StudentLevels`).
   - Sus asignaciones con su estado.
   - Botón grande «Asignar actividad».
4. **Asignar** (`/teacher/student/[id]/assign`): el docente elige un módulo publicado y, si quiere, una fecha sugerida, y confirma.
   - Si un módulo ya está asignado y sin terminar, muéstralo como «Ya asignado».
   - Al terminar, vuelve al detalle con un aviso «Actividad asignada» (`Notice` con `accessibilityLiveRegion="polite"`).
   - Maneja 400 (fecha inválida o módulo no publicado), 403, 404 y 409 si existe, con mensajes claros.
5. **Quitar asignación** con una confirmación antes de borrar, porque no se puede deshacer.
6. **Repositorios:** agrega a `repositories.ts` una interfaz `AssignmentManagementRepository` (o un nombre coherente con las demás) con versión HTTP y versión mock. Los tipos de la app van en `src/data/types.ts`, en inglés como los existentes. Los DTO van con los nombres del backend.
7. **Pruebas:** mapeadores, repositorio HTTP contra `fakeBackend` (incluido el error 403), el hook de la lista y la pantalla de asignar (que envía bien el cuerpo).

---

## Fase 3 · C1: espacio de la directora

**Problema:** en `src/features/auth/roleHome.ts`, `director: null`. Al entrar, la directora solo ve «Tu espacio llega en una próxima versión». En `src/app/dev/index.tsx` tampoco aparece.

**Alcance MVP** (no hay mockup; usa el mismo estilo de las pantallas del docente):
- `roleHomes.director` debe llevar a `/director`.
- Pestañas:
  1. **«Estudiantes»:** todos los estudiantes (`GET /estudiantes`; la directora ve todos), con búsqueda por nombre si el DTO de consulta la admite (verifícalo) y su progreso oficial. Al tocar uno, abre el mismo detalle de la fase 2: **reutiliza las pantallas y hooks**, no los copies. La directora también puede asignar y quitar asignaciones.
  2. **«Por validar»:** la cola de revisión (`GET /revisiones/pendientes`, que permite DIRECTORA). Reutiliza `useReviewQueue` y `ReviewCard`; ajusta solo lo necesario para que no dependa de que la sesión sea de un docente.
  3. **«Resumen»:** cifras generales que se puedan calcular con endpoints existentes, como número de estudiantes, actividades pendientes de validar y asignaciones en curso. Si un dato exige un endpoint nuevo, **no lo inventes**: déjalo fuera y avísame.
- Agrega «Directora» al selector de `src/app/dev/index.tsx` y una cuenta mock de directora que funcione con los datos simulados.
- La gestión de usuarios, módulos y contenidos queda **fuera** de esta fase.
- **Pruebas:** que el login de la directora lleve a `/director`, que la cola funcione con la sesión de directora y que la pestaña «Resumen» muestre los estados de carga, error y listo.

---

## Entrega final

Cuando termine la fase 3:
1. Ejecuta otra vez `tsc`, `lint` y `jest`, y pega los resultados (número de suites y de pruebas).
2. Actualiza `GameUp-frontend/README.md`: rutas nuevas, roles con pantalla y cómo probar cada flujo con datos simulados y con la API.
3. Dame una lista de **pruebas manuales en Expo Go** contra el backend, con las cuentas de prueba:
   - El tallerista asigna un módulo a un estudiante.
   - El estudiante lo ve en «Inicio» y lo juega.
   - El tallerista lo valida en «Por escuchar».
   - El progreso oficial sube, en el detalle y en la vista del acudiente.
   - Se repite el mismo flujo con la directora.
4. Lista lo que quedó pendiente o lo que necesitarías del backend.
