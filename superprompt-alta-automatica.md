# Superprompt: alta automática en GameUP al primer inicio de sesión

> Pégalo completo en Claude Code (VS Code), con el repositorio GameUp-Proyecto-Integrador abierto y `main` actualizado (`git pull`). Base: `main` en `247c58d` o posterior.

---

## Contexto

Eres el asistente del proyecto GameUP (React Native + Expo / NestJS + Prisma / Supabase). Responde y escribe todo en español. Respeta la arquitectura que ya existe (módulos con `domain/`, `application/`, `infrastructure/`, `presentation/`, puertos con `Symbol` e inyección por token) y las decisiones de `GameUp-backend/docs/AVANCE.md`.

**El problema (8-nov-2026, pruebas en Expo Go contra Render):** cuatro cuentas creadas en la API de seguridad (directora, tallerista, acudiente y estudiante) inician sesión con la contraseña correcta, pero GameUP responde **403 «Tu cuenta no tiene acceso a GameUP»**. La causa: `ResolutorUsuarioService.resolver` (`src/modules/auth/application/resolutor-usuario.service.ts`) exige que ya exista una fila en `usuario` con ese `id_usuario_auth`, y esa fila solo la crea la directora con `POST /usuarios` desde Swagger. En la práctica la fundación no puede hacerlo así, y la primera directora ni siquiera puede darse de alta a sí misma.

**La decisión del equipo:** cualquier persona con cuenta válida en la API de seguridad y con un rol que tenga acceso (ADMIN→DIRECTORA, TALLERISTA, ACUDIENTE, ESTUDIANTE; ver `MapeadorRoles`) entra a GameUP **sin alta manual**: la primera vez que inicia sesión, el backend crea su cuenta.

**Por qué es seguro (comprobado por alex en Postman el 8-nov-2026):**
- `POST /api/auth/registro/administrador` de la API de seguridad **exige token de ADMIN**: sin token responde 401/403.
- `POST /api/auth/registro` («rol indicado», sin token) **no permite** crear un ADMIN.
- Los demás roles ven poco al entrar sin revisión: el estudiante solo lo suyo, el acudiente solo los niños vinculados en ASISCO UP (sin vínculo no ve nada) y la tallerista solo los estudiantes que la directora le asigne (al principio ninguno).

## Rama

Crea la rama `backend/alta-automatica` desde `main`. Un commit por fase, con mensajes claros en español. No hagas push ni PR: los hace alex.

## Antes de escribir código (fase 0)

1. Lee y resume en 10 líneas cómo funciona hoy:
   - `AuthService.iniciarSesion` (`src/modules/auth/application/auth.service.ts`),
   - `ResolutorUsuarioService.resolver`,
   - el `AuthGuard` (qué llama en **cada** petición; el alta automática debe ocurrir **solo en el login**, nunca en el guard),
   - `UsuarioService.crear` y `normalizarNuevoUsuario` (`src/modules/usuarios/`): qué crea además de la fila `usuario` (fila `estudiante`, nivel inicial, etc.),
   - cómo se usa ASISCO UP hoy (`ASISCO_API_URL`, `ConsultaVinculosAsiscoUpHttp`, el adaptador de consentimiento que ya compara `idEstudiante` con lo pedido).
2. Confirma si ASISCO UP tiene una forma de obtener el `idEstudiante` a partir del `idUsuarioAuth` (el `id_usuario` de seguridad). Busca en el código, en `docs/`, en Swagger de ASISCO UP (`https://proyecto-asiscoup-g1-jvaz.onrender.com/api-docs`) si tienes red. Lo que sabemos:
   - `GET /api/estudiantes/:id` y `GET /api/estudiantes/:id/consentimiento` aceptan como `:id` el `idEstudiante`, el `id_usuario` de seguridad **o** el documento → **hay riesgo de ambigüedad** (ya hubo colisión real: id 1).
   - Las respuestas de estudiante traen `idEstudiante` e `idUsuarioAuth`.
   - Si encuentras un endpoint exacto por `idUsuarioAuth` (query param o `/me` del estudiante), úsalo. Si no, usa `GET /api/estudiantes/{idUsuarioAuth}` con el token del propio estudiante y **acepta la respuesta solo si su `idUsuarioAuth` es igual al nuestro**; si no coincide o no existe, se trata como «no encontrado».
3. Muéstrame el plan y **espera mi confirmación** antes de seguir.

## Fase 1: backend, alta automática en el login

**Reglas:**

1. Solo se crea la cuenta cuando **no existe** fila en `usuario` con ese `id_usuario_auth`. Si existe pero está inactiva, o es un estudiante EGRESADO/RETIRADO, o el rol no coincide → **todo sigue igual que hoy** (403 con su mensaje). Nunca reactivar ni cambiar el rol automáticamente.
2. El rol sale de `MapeadorRoles.aRolesGameUp(identidad.roles)`:
   - ninguno → 403 como hoy;
   - **exactamente uno** → se crea con ese rol;
   - **varios** → no se crea; 403 «Tu cuenta tiene varios roles en la fundación. Pide a la directora que te dé de alta en GameUP.» (la directora puede seguir usando `POST /usuarios`).
3. Datos de la copia mínima: `nombres`, `apellidos` y `correo` de la identidad (`IdentidadExterna`). Si falta nombre o apellido, usa «Sin nombre» / «Sin apellido» (los corrige la próxima sincronización de la copia). Nunca guardes contraseñas ni tokens.
4. **ESTUDIANTE:** necesita `idEstudianteExterno`. Búscalo en ASISCO UP con un **puerto nuevo** (por ejemplo `ConsultaEstudianteExterno.porIdUsuarioAuth(idUsuarioAuth, token)`) y su adaptador HTTP en el estilo de `vinculos-asiscoup-http.ts`: timeout `ASISCO_API_TIMEOUT_MS`, solo leer ids, **no registrar en logs nombres, documentos ni diagnósticos**.
   - Si `ASISCO_API_URL` está vacía (integración apagada), o ASISCO UP no responde, o no encuentra al estudiante, o el `idUsuarioAuth` no coincide → **no se crea**; 403 con «Aún no te encontramos en ASISCO UP. Pide a la fundación que revise tu registro.» (si ASISCO UP no respondió, mejor 503 «Espera un momento e inténtalo otra vez»).
   - Si ese `idEstudianteExterno` ya está usado por otra cuenta → no se crea; 403 «Pide a la directora que revise tu cuenta.» y log solo con ids.
   - Nivel inicial: el mismo que pone hoy `UsuarioService.crear` (`niveles.inicial()`).
5. **ACUDIENTE:** se crea sin `idAcudienteExterno` (opcional). Después de crearlo, el flujo actual de `iniciarSesion` copia sus vínculos de ASISCO UP como siempre.
6. **TALLERISTA y DIRECTORA:** se crean sin más datos. La tallerista no ve estudiantes hasta que la directora se los asigne.
7. **Reutiliza la lógica de alta** (`normalizarNuevoUsuario` + `UsuarioService.crear` o el mismo repositorio de escritura), para que el alta automática y `POST /usuarios` creen exactamente lo mismo (fila `estudiante`, nivel, etc.). No dupliques reglas.
8. **Carreras:** si dos inicios de sesión simultáneos intentan crear la misma cuenta, el índice único de `id_usuario_auth` hace fallar a uno: atrapa ese conflicto y vuelve a resolver (debe entrar normalmente).
9. **Interruptor:** variable nueva `ALTA_AUTOMATICA_ROLES` (lista separada por comas de roles de GameUP; por defecto `ESTUDIANTE,ACUDIENTE,TALLERISTA,DIRECTORA`; vacía = apagado, vuelve al comportamiento de hoy). Valídala en `src/config/env.validation.ts` (solo valores válidos de `RolGameUp`), añádela a `.env.example` con comentario y a `render.yaml`.
10. **Registro:** al crear una cuenta automáticamente, log `info` con id interno, `id_usuario_auth` y rol (nada más). Si existe tabla o servicio de notificaciones para la directora, avísale «Nueva cuenta en GameUP: <rol>» (sin datos personales); si no existe algo listo, no lo inventes y déjalo anotado en AVANCE.md.
11. `POST /usuarios` sigue funcionando igual (la directora puede dar de alta a mano casos especiales). Actualiza su descripción en Swagger para decir que ya no es obligatorio.

**Dónde:** la decisión vive en la capa de aplicación de `auth` (un caso de uso o servicio nuevo, p. ej. `AltaAutomaticaService`, llamado desde `AuthService.iniciarSesion` cuando el resolutor dice «no registrada»). Para distinguir «no registrada» de los demás 403, no compares textos: usa un error o resultado específico.

**Pruebas (Vitest), como mínimo:**
- unitarias del servicio nuevo: cada rol se crea; varios roles → 403; cuenta inactiva → 403 sin crear; rol que no coincide → 403 sin crear; estudiante encontrado en ASISCO UP; estudiante no encontrado / `idUsuarioAuth` distinto / ASISCO UP caído / `ASISCO_API_URL` vacía → no se crea; `idEstudianteExterno` ya usado → no se crea; carrera (conflicto de índice) → entra; interruptor vacío → comportamiento de hoy; rol fuera de `ALTA_AUTOMATICA_ROLES` → 403.
- del adaptador HTTP nuevo (con `fetch` simulado): respuesta válida, `idUsuarioAuth` distinto, 404, 500, timeout, formato inesperado.
- `env.validation`: valores válidos, inválidos y vacío.
- e2e en `test/auth.e2e-spec.ts` (con los dobles de `test/dobles`): primer login crea la cuenta y devuelve el token; segundo login no crea otra; el `AuthGuard` **no** crea cuentas (una petición con token de alguien sin cuenta sigue dando 403).

Corre `npm run lint`, `npm run build`, `npm test` y `npm run test:e2e` (o los scripts equivalentes de `package.json`) y muéstrame el resumen.

## Fase 2: frontend, mostrar el motivo real del 403

Hoy `httpAuthRepository.ts` convierte cualquier 403 en `AccountNotAllowedError` y la pantalla de login (`src/app/login.tsx`) siempre dice «Tu cuenta no tiene acceso a GameUP. Habla con la fundación.», aunque el backend mande un motivo concreto (inactiva, rol distinto, no encontrado en ASISCO UP…).

- Haz que `AccountNotAllowedError` lleve el `message` que mandó el backend (si viene y es texto razonable, máximo ~200 caracteres) y que la pantalla lo muestre; si no viene, deja el texto actual.
- No muestres nunca datos técnicos (códigos, ids, trazas).
- Pruebas (Jest) de `httpAuthRepository` y `LoginScreen` para los dos casos.
- `npx tsc --noEmit`, `npm run lint` y `npm test` en verde.

## Fase 3: documentación

- `GameUp-backend/docs/AVANCE.md`: nueva decisión «Alta automática al primer login» con las reglas de arriba y el porqué (registro de ADMIN protegido en seguridad, comprobado el 8-nov-2026), y la variable `ALTA_AUTOMATICA_ROLES`.
- READMEs del backend y del frontend donde hablen de dar de alta cuentas.
- Swagger: descripción de `POST /api/v1/auth/login` (nuevos 403/503) y de `POST /usuarios`.
- Deja anotado como **pendiente** (no lo hagas): pantalla de la directora para ver cuentas nuevas y desactivarlas desde la app.

## Al terminar

Dame:
1. Lista de commits.
2. Resultado de lint, build y pruebas (backend y frontend).
3. Qué debe hacer alex para probarlo:
   - push de la rama y PR a `main`,
   - en Render: `ALTA_AUTOMATICA_ROLES` (o dejar el valor por defecto) y confirmar `ASISCO_API_URL`,
   - prueba en Expo Go: entrar con una cuenta de seguridad que no esté en GameUP para cada rol y comprobar que entra a su pantalla; para el estudiante, que exista en ASISCO UP con su `idUsuarioAuth`.
4. Cualquier duda o riesgo que hayas encontrado (por ejemplo, si ASISCO UP no permite buscar al estudiante sin ambigüedad).

**Reglas generales:** no cambies tecnologías; no inventes endpoints de ASISCO UP sin comprobarlos (si no puedes comprobar uno, dilo); no toques migraciones ya aplicadas (si necesitas cambiar la base, crea una migración nueva y avísame antes); no pongas secretos ni datos reales de menores en código, pruebas ni logs.
