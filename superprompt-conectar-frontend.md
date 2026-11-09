# SUPERPROMPT: conectar la app GameUP (Expo) al backend NestJS

> Copia todo lo que está debajo de la línea y pégalo en Claude Code, abierto en la raíz del repositorio `GameUp-Proyecto-Integrador`.

---

Vas a conectar la app móvil de GameUP (`GameUp-frontend/`, React Native + Expo SDK 58 + expo-router) al backend NestJS (`GameUp-backend/`). Trabaja en español, por fases, y **detente al final de cada fase** para mostrarme qué cambiaste, qué probaste y qué sigue. No pases a la fase siguiente sin mi confirmación.

## Contexto que debes respetar

- GameUP es un aula virtual para niños con síndrome de Down (Fundación ASISCO-UP). Los datos son de menores: Ley 1581 de 2012.
- Stack fijo: React Native + Expo Go, NestJS, Supabase (PostgreSQL). No cambies tecnologías ni agregues dependencias sin pedirme permiso primero, explicando por qué hacen falta.
- La app **no** habla con Supabase directamente. Todo pasa por la API NestJS. En la app no puede haber secretos: solo `EXPO_PUBLIC_API_URL`.
- Los permisos se verifican en el backend. La app nunca filtra datos de otros estudiantes "a mano" como si eso fuera seguridad.
- Regla 11: los juegos no tienen límite de tiempo, vidas ni sonidos de error. Si una llamada a la API falla durante un juego, el niño no debe ver un error técnico: se guarda o se reintenta en silencio y se muestra un mensaje amable solo al adulto cuando corresponda.
- Las estrellas por intento son **práctica**, no progreso oficial. El progreso oficial solo cuenta actividades validadas por la tallerista.
- No uses datos reales de menores en pruebas, mocks ni capturas.
- Backend desplegado: `https://gameup-backend.onrender.com` (prefijo `/api/v1`, Swagger en `/api-docs`, spec en `/api-docs.json`). En local: `http://<IP-del-PC>:3000/api/v1` (con Expo Go en el celular, `localhost` no sirve).

## Buenas prácticas y principios SOLID (obligatorio en todo el código que escribas)

Antes de escribir código, revisa los patrones que ya usa la app (`AGENTS.md`, `src/data/`, `src/features/`, `src/components/gameup/`) y síguelos. En concreto:

**SOLID aplicado a esta app**
- **S, responsabilidad única:** cada pieza hace una sola cosa. El cliente HTTP solo hace peticiones, los mapeadores solo traducen DTO ↔ tipos de la app, los repositorios solo orquestan llamadas, los hooks manejan estado de carga y error, y las pantallas solo muestran. Nada de `fetch` dentro de pantallas ni componentes.
- **O, abierto/cerrado:** agregar la fuente `api` no debe obligar a modificar pantallas ni hooks: se agrega una implementación nueva de las interfaces existentes.
- **L, sustitución de Liskov:** las implementaciones HTTP deben comportarse igual que las de `mock/` ante la misma interfaz (mismos tipos, mismos errores tipados como `InvalidCredentialsError`), para que se puedan intercambiar sin romper nada. Agrega pruebas que lo verifiquen.
- **I, segregación de interfaces:** respeta las interfaces pequeñas de `repositories.ts`. No crees un "ApiService" gigante con todos los métodos.
- **D, inversión de dependencias:** las pantallas y hooks dependen de las interfaces y reciben las implementaciones por `RepositoryProvider`. La elección `mock`/`api` se hace en un único punto de composición.

**Buenas prácticas de React Native / Expo**
- TypeScript estricto: sin `any` ni `@ts-ignore`. Tipa los DTO del backend por separado de los tipos de la app.
- Componentes funcionales y hooks. Lógica reutilizable en hooks personalizados (reutiliza `useResource` y `useRefreshOnFocus` si sirven), no copiada entre pantallas.
- Maneja los tres estados en cada pantalla que carga datos: cargando, error (mensaje amable con opción de reintentar, pensado para el adulto) y vacío.
- Evita renders innecesarios: listas con `FlatList` y `keyExtractor`, `useCallback`/`useMemo` solo donde haya un beneficio real. Cancela o ignora las respuestas de peticiones cuando la pantalla se desmonta.
- Accesibilidad: conserva botones grandes, `accessibilityLabel` y `accessibilityRole` en todo lo que se toca, textos breves y las instrucciones de audio. No quites nada de esto al conectar.
- Sin valores fijos repartidos: URLs, tiempos de espera y textos de error en constantes o en `config/`.
- Sin `console.log` con datos personales ni tokens. Respeta ESLint y el formato existente del proyecto.
- Código simple y legible: nombres claros en español, como el resto del proyecto, y sin abstracciones que el MVP no necesite. No sobre-diseñes.

Al cerrar cada fase, dime en una o dos líneas cómo cumpliste estos principios en lo que cambiaste.

## Fase 0: diagnóstico (sin cambiar código)

1. Revisa la rama actual y confirma que `main` ya tiene el backend con las fases 1 a 8 y el frontend con Expo SDK 58 sin marcadores de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`). Si no es así, avísame y no sigas.
2. En `GameUp-frontend/` ejecuta `npx tsc --noEmit` y `npm test`. En `GameUp-backend/` ejecuta las pruebas unitarias. Anota el resultado tal cual.
3. Lee y resume:
   - `GameUp-frontend/AGENTS.md` y `README.md`;
   - `GameUp-frontend/src/data/repositories.ts` (las interfaces), `src/data/types.ts`, `src/data/RepositoryProvider.tsx`, `src/data/mock/`, `src/data/authErrors.ts`;
   - `GameUp-frontend/src/config/env.ts` y `src/services/api.ts`;
   - `GameUp-backend/docs/AVANCE.md`, sobre todo las decisiones y la lista **"Frontend: cambios de contrato"**;
   - el spec de Swagger (`/api-docs.json` local o de Render) o los controladores de `GameUp-backend/src/modules/*`.
4. Entrégame una **tabla de mapeo**: cada método de cada repositorio de la app → endpoint del backend (método, ruta, DTO de entrada, respuesta) → diferencias de tipos o nombres que hay que traducir. Marca los métodos que **no tienen** endpoint equivalente y propón qué hacer con cada uno (no inventes endpoints: si falta algo, lo decido yo).

## Arquitectura de la conexión (aplica en todas las fases)

- Implementa repositorios HTTP en `GameUp-frontend/src/data/http/` que cumplan **las mismas interfaces** de `repositories.ts`. Las pantallas y hooks no deben cambiar salvo que el contrato lo exija (y en ese caso, avísame).
- Un solo cliente HTTP (reutiliza o amplía `src/services/api.ts`): base URL desde `env.apiUrl`, `Authorization: Bearer <token>`, tiempo de espera, y errores tipados (credenciales inválidas, sesión vencida 401, sin permiso 403, no encontrado 404, sin conexión). En 401, cerrar sesión y volver al login.
- Mapeadores explícitos (`src/data/http/mappers/`) entre los DTO del backend y los tipos de la app, con pruebas unitarias. Traduce ahí los códigos de juego y de estado del backend a lo que muestra la app.
- Un interruptor para elegir mocks o HTTP, por ejemplo `EXPO_PUBLIC_DATA_SOURCE=mock|api` leído en `env.ts`, para poder seguir mostrando los juegos sin backend. Por defecto `mock` hasta que yo diga otra cosa. Actualiza `.env.example` (sin valores secretos).
- Token: guárdalo con `expo-secure-store` (no AsyncStorage). Si no está instalado, pídeme permiso antes de agregarlo (`npx expo install expo-secure-store`). No guardes la contraseña. No escribas el token en logs.
- Pruebas con Jest: simula `fetch` y verifica cada repositorio HTTP (ruta llamada, cabeceras, mapeo, manejo de errores). No hagas pruebas que dependan de Render o de la API externa.

## Fase 1: inicio de sesión

- Implementa `AuthRepository.signIn` contra `POST /api/v1/auth/login` del backend (no llames directamente a la API de seguridad del otro grupo).
- Con la respuesta, determina el rol (ESTUDIANTE, TALLERISTA, ACUDIENTE, DIRECTORA) y redirige a la pantalla correcta (`student/`, `teacher/`, `guardian/`).
- Implementa `StudentRepository.getCurrentStudent` y `StaffRepository` con la ruta del backend que devuelva el usuario actual (búscala en Swagger; si no existe, avísame).
- **Prueba real:** te voy a dar una cuenta de prueba (no la escribas en ningún archivo ni commit; pídemela en el chat). Haz el login contra el backend local y muéstrame la respuesta real de `/api/auth/perfil` que el backend recibe de la API de seguridad (registrada en el log del backend, **ocultando el token y datos personales**). Con ella revisamos `perfil.mapper.ts` del backend, que hoy es provisional. Si el mapper necesita cambios, muéstramelos como un cambio separado del backend, con su prueba unitaria.

## Fase 2: flujo del estudiante

- `AssignmentRepository.listPendingForStudent` → actividades pendientes del estudiante.
- Envío de intentos de los juegos (Emparejar, Clasificar, Secuenciar, Memoria, Busca la boca): **incluye `actividadId`** cuando el juego viene de una actividad asignada, como pide AVANCE.md. Si el juego se abrió libre, sigue el contrato del backend para práctica.
- `PracticeRepository` (estrellas de práctica por vocal y punto de retorno) y `ProgressRepository.getOfficialProgress` (solo validadas). Muestra los módulos de forma dinámica según lo que devuelve el backend, no una lista fija.
- **Habla conmigo / grabaciones:** `ConsentRepository.hasVoiceRecordingConsent` debe consultar el backend. Mientras el endpoint de consentimiento del núcleo familiar no exista, el backend responde sin consentimiento y **la app no graba**: el juego sigue funcionando (Mira → Dilo → Listo con cámara-espejo, sin guardar imágenes) y solo se omite el envío de audio. No uses `CONSENTIMIENTO_SIMULADO` fuera de desarrollo local.
- Verifica en el celular con Expo Go que los cuatro juegos y los dos de habla se pueden jugar de principio a fin con `EXPO_PUBLIC_DATA_SOURCE=api` y también con `mock`.

## Fase 3: tallerista

- `ReviewRepository`: lista de pendientes de **sus** estudiantes, validar ("Lo logró"), pedir más práctica con retroalimentación obligatoria, y nota de voz para la familia.
- Agrega la revisión de los juegos sin voz (AVANCE.md).
- Para un intento de voz, la app debe **pedir y reproducir el audio** (URL firmada del backend) antes de habilitar el botón de validar, porque el backend lo exige.

## Fase 4: acudiente

- `GuardianRepository.getWeeklyPractice` se arma con tres rutas existentes (decisión 5 de la fase 8 en AVANCE.md):
  - días y `practicedToday`: `GET /estudiantes/:id/practica-semanal`;
  - `teacherNote`: `GET /estudiantes/:id/observaciones?limit=1`;
  - `vowel`: la vocal de la actividad pendiente de Habla conmigo, de `GET /estudiantes/:id/actividades`.
- `markPracticedToday` con la ruta de práctica en casa.
- Muestra la retroalimentación de las actividades aprobadas.
- Si el acudiente tiene varios estudiantes, permite elegir cuál ver.

## Cierre de cada fase

1. `npx tsc --noEmit` y `npm test` en verde en el frontend (y en el backend si lo tocaste). Pega el resultado.
2. Lista de archivos creados o cambiados, con una línea sobre cada uno.
3. Qué probaste de verdad (en el celular, contra local o contra Render) y qué **no** pudiste probar. No digas que algo funciona si no lo ejecutaste.
4. Un commit por fase, en una rama nueva `frontend/conexion-api` (no en `main`), con mensaje claro en español. No hagas push sin preguntarme.
5. Si encuentras una contradicción entre la app, el backend y AVANCE.md, para y explícame las opciones antes de decidir.

Empieza por la Fase 0.
