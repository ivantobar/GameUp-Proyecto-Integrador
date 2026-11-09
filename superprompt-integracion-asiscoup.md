# SUPERPROMPT — Integración GameUP ↔ ASISCO UP · v3

> **Versión 3 (2026-11-08).** ASISCO UP ya une sus estudiantes y acudientes con la API de seguridad, publicó los términos `v1.1-2026` con permiso de voz (`autorizaGrabacionVoz`) y "Mis estudiantes vinculados" funciona. Esta versión agrega la **fase de vínculos de acudientes** y reemplaza a las anteriores.
>
> **Antes de pegarlo:** haz el **Paso previo en Supabase** de la sección 3. Si no, el acudiente de prueba pierde el acceso a su estudiante.
>
> Copia todo este archivo (incluido el Anexo con los parches) y pégalo en Claude Code, abierto en la carpeta raíz del repo `GameUp-Proyecto-Integrador`.

---

Eres Claude Code trabajando en el repo de **GameUP** (monorepo: `GameUp-backend/` con NestJS 12 + Prisma + vitest + oxlint; `GameUp-frontend/` con Expo). Responde siempre en español, con explicaciones cortas y claras. Antes de cambiar algo, lee el código real; no inventes archivos, endpoints, tablas, campos ni variables que no estén descritos aquí o en el repo.

## 1. Contexto (ya decidido: no lo vuelvas a discutir)

- La profesora pidió no duplicar responsabilidades:
  - **API de seguridad** → login, cuentas y JWT.
  - **ASISCO UP** (`https://proyecto-asiscoup-g1-jvaz.onrender.com`) → datos personales de estudiantes y acudientes, **vínculos familiares** y **consentimiento**.
  - **GameUP** → módulos, juegos, asignaciones, intentos, validaciones, progreso y práctica en casa.
- GameUP reenvía el login a la API de seguridad y no guarda documento, diagnóstico ni fecha de nacimiento. `estudiante` es el **perfil de aprendizaje**, enlazado por `id_estudiante_externo` = `idEstudiante` de ASISCO UP. `usuario.id_usuario_auth` = `id_usuario` de seguridad.
- `idEstudianteExterno` **NO** se expone en `/estudiantes` (`GameUp-backend/docs/AVANCE.md`, fase 3, punto 5).
- **Interruptor único:** todo lo de ASISCO UP se activa solo si existe `ASISCO_API_URL`. Sin ella, GameUP funciona exactamente como hoy.

### Consentimiento de voz
GameUP graba solo si `tieneConsentimientoVigente === true`, `autorizaGrabacionVoz === true` y `requiereAceptarTerminos !== true`, y el `idEstudiante` de la respuesta es el pedido. Cualquier duda → no graba (falla cerrado).

### Vínculos de acudientes (decisión de diseño)
- **La tabla `acudiente_estudiante` NO se borra.** La usan los permisos del acudiente (`alcance.ts` y los repositorios de estudiantes, asignaciones y módulos), la función SQL `fn_notificar_acudientes` (avisos de nivel, observaciones y módulos nuevos) y el trigger `fn_practica_casa_vinculo`. Borrarla rompería todo eso.
- Pasa a ser una **copia de solo lectura de ASISCO UP**: cuando un acudiente inicia sesión, GameUP llama `GET /api/acudientes/me/estudiantes` con **el token de ese acudiente** y deja su copia igual a lo que dice ASISCO UP.
- Con ASISCO UP conectado, `POST`/`PATCH`/`DELETE /estudiantes/{id}/acudientes` responden **409** ("Los acudientes se vinculan en ASISCO UP…"). `GET` sigue leyendo la copia.
- No hay migración. La app no se toca (no tiene pantallas que escriban vínculos).

### Respuestas reales de ASISCO UP (2026-11-08, datos de prueba)

`GET /api/estudiantes/12/consentimiento` (tras revocar la voz):
```json
{"idEstudiante":12,"id_usuario":13,"idUsuarioAuth":"13",
 "versionVigente":{"idVersionTerminos":2,"codigoVersion":"v1.1-2026","textoLegal":"…"},
 "tieneConsentimientoVigente":true,"autorizaGrabacionVoz":false,"requiereAceptarTerminos":false,
 "consentimientos":[{"idEstudiante":12,"idAcudiente":7,"idVersionTerminos":2,"aceptaTratamiento":true,"aceptaGrabacionVoz":false,"fechaOtorgamiento":"2026-11-08T04:59:50.932Z","codigoVersion":"v1.1-2026"}]}
```

`GET /api/acudientes/me/estudiantes` con el token del acudiente de prueba (usuario 15 de seguridad):
```json
{"acudiente":{"idAcudiente":7,"idUsuarioAuth":"15","id_usuario":15,"nombre":"Acudiente GameUP","esAnonimo":true,"…":"…"},
 "estudiantes":[{"idEstudiante":12,"idUsuarioAuth":"13","id_usuario":13,"nombre":"Estudiante GameUP","esPrincipal":true,
                 "parentesco":{"idParentesco":1,"nombre":"Madre"},"…":"…"}]}
```
Ojo: según ASISCO UP, en `/api/estudiantes/:id` el `:id` puede ser su `idEstudiante`, el `id_usuario` de seguridad o el documento. Por eso GameUP comprueba el `idEstudiante` de la respuesta.

**Datos de prueba que conectan los tres sistemas:**

| Quién | API de seguridad (`id_usuario`) | ASISCO UP | GameUP |
|---|---|---|---|
| Estudiante GameUP | 13 | `idEstudiante` 12 | `id_estudiante_externo` debe ser **12** (hoy 990001, inventado) |
| Acudiente GameUP | 15 | `idAcudiente` 7, vinculado al 12 como Madre (principal) | cuenta ACUDIENTE |
| Directora GameUp | 16 | — | cuenta DIRECTORA |

## 2. Qué hay que implementar

Cuatro **parches ya probados** sobre `origin/main` en `e0d160c` (tsc, oxlint, **586 pruebas** unitarias y **171 e2e** en verde, `npm run build` ok). Están completos en el **Anexo**.

1. **0001 – Swagger (solo textos).** Explica de quién es cada dato; sección "Perfil de aprendizaje del estudiante".
2. **0002 – Adaptador HTTP de consentimiento (primera versión).**
3. **0003 – Permiso de voz y conexión.** `consentimiento-asiscoup-http.ts` en su forma final; `consentimiento.module.ts` lo usa si hay `ASISCO_API_URL`; variables `ASISCO_API_URL` y `ASISCO_API_TIMEOUT_MS` en `env.validation.ts`, `.env.example` y `render.yaml`.
4. **0004 – Vínculos de acudientes.** Archivos nuevos en `src/modules/estudiantes/`:
   - `domain/vinculos-externos.ts`: puertos `ConsultaVinculos`, `CopiaVinculosRepository`, `SincronizadorVinculos` y tokens `SINCRONIZADOR_VINCULOS`, `VINCULOS_EN_ASISCO`.
   - `infrastructure/vinculos-asiscoup-http.ts` (+ spec): llama `/api/acudientes/me/estudiantes` con `Authorization: Bearer <token del acudiente>` y solo toma `idUsuarioAuth`, `idEstudiante`, `parentesco.nombre` y `esPrincipal`. Formato raro o error → `ServicioExternoNoDisponibleError`.
   - `infrastructure/prisma-copia-vinculos.repository.ts`: en una transacción borra los vínculos del acudiente que ya no están, quita la marca de principal a otros acudientes cuando hace falta (índice `uq_acudiente_principal`) y hace `upsert` del resto.
   - `application/sincronizacion-vinculos.service.ts` (+ spec): si ASISCO UP responde por otro `idUsuarioAuth`, no toca nada; ignora estudiantes que no estén en GameUP.
   - `estudiantes.module.ts`: el sincronizador solo existe si hay `ASISCO_API_URL` (si no, `null`); lo exporta.
   - `vinculos.service.ts`: con `VINCULOS_EN_ASISCO = true`, vincular, cambiar y quitar acudientes → `ConflictoError` (409).
   - `auth.service.ts` + `auth.module.ts`: al iniciar sesión un ACUDIENTE, llama al sincronizador; si falla, registra un aviso y el login sigue.

### Ajustes extra que debes hacer tú (no están en los parches)

5. Prueba del factory de `consentimiento.module.ts` y del de `SINCRONIZADOR_VINCULOS` en `estudiantes.module.ts`: sin URL → no disponible / `null`; con URL → adaptador HTTP. Mantén el comportamiento idéntico.
6. En `vinculos.controller.ts`, agrega a `POST`, `PATCH` y `DELETE` de acudientes un `@ApiConflictResponse` que diga que con ASISCO UP conectado se responde 409.
7. Documentación: en `GameUp-backend/docs/AVANCE.md` agrega una entrada "Integración ASISCO UP" (rama, commits, qué cambió, interruptor `ASISCO_API_URL`, que `acudiente_estudiante` ahora es copia y por qué no se borra). En `GameUp-backend/README.md`, en la tabla de variables (donde está `SEGURIDAD_API_URL`), agrega `ASISCO_API_URL` y `ASISCO_API_TIMEOUT_MS`.

## 3. Pasos

**Paso previo en Supabase (lo hace alex, NO Claude Code).** En el SQL Editor de Supabase:
```sql
-- 1) Mirar cómo están hoy los estudiantes de GameUP
select e.usuario_id, e.id_estudiante_externo, u.nombres, u.id_usuario_auth
  from estudiante e join usuario u on u.id = e.usuario_id;

-- 2) Poner al estudiante de prueba (usuario 13 de seguridad) con su id real de ASISCO UP (12)
update estudiante
   set id_estudiante_externo = 12
 where usuario_id = (select id from usuario where id_usuario_auth = 13);
```
Si el `update` dice que el 12 ya está usado por otro estudiante, **detente** y revisa qué fila lo tiene antes de seguir. Si hay otros estudiantes de GameUP con números inventados, déjalos como están: simplemente no tendrán vínculos ni voz hasta que se les ponga su id de ASISCO UP.

**Fase 0 – Preparación**
1. `git status`: si hay cambios sin commit, **DETENTE** y avísame; no hagas stash ni reset.
2. Pregúntame si ya hice el **Paso previo en Supabase**. Si la respuesta es no, sigue con el código pero **no hagas la prueba manual de la fase 3** hasta que te confirme.
3. `git fetch origin`. Si ya existe la rama `backend/integracion-asiscoup` (local o en origin), **DETENTE** y pregúntame. Si no, `git checkout -b backend/integracion-asiscoup origin/main`.

**Fase 1 – Aplicar los parches**
4. Copia cada bloque del Anexo **tal cual** a un archivo **fuera del repo** (carpeta temporal) con su nombre (`0001-…`, `0002-…`, `0003-…`, `0004-…`). Si tienes a mano `revisiones/integracion-asiscoup/`, puedes usar esos archivos; **no uses** su subcarpeta `obsoleto/`.
5. `git am <ruta>/0001*.patch <ruta>/0002*.patch <ruta>/0003*.patch <ruta>/0004*.patch`. En Windows, si falla por finales de línea: `git am --abort` y `git am --ignore-whitespace …`. Si un parche no aplica porque `main` cambió, `git am --abort` y **reimplementa a mano** siguiendo la sección 2 y el Anexo.

**Fase 2 – Ajustes extra (puntos 5, 6 y 7)**
6. Un commit aparte: «ASISCO UP: pruebas de módulos, Swagger 409 y documentación».

**Fase 3 – Verificación (todo debe pasar; muéstrame el resumen)**
7. En `GameUp-backend/`: `npm ci` si falta `node_modules`; luego `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run test:e2e` y `npm run build`. Si algo falla, corrige solo lo necesario y explícame qué era. No desactives ni saltes pruebas.
8. Prueba manual local (solo después del Paso previo en Supabase). En tu `.env` local, que no se sube: `ASISCO_API_URL=https://proyecto-asiscoup-g1-jvaz.onrender.com` y `CONSENTIMIENTO_SIMULADO=false`. Luego `npm run start:dev`.
   - **Vínculos:** `POST /api/v1/auth/login` con la cuenta del acudiente de prueba (te doy la contraseña yo; no la escribas en archivos). Después, con ese token, `GET /api/v1/estudiantes` → debe aparecer "Estudiante GameUP". Revisa en el log que no salga "No se pudieron actualizar los vínculos".
   - **Directora:** con su token, `POST /api/v1/estudiantes/{id}/acudientes` → debe responder **409**. `GET /api/v1/estudiantes/{id}/acudientes` → debe listar al acudiente como "Madre", principal.
   - **Voz:** `GET /api/v1/estudiantes/{id}/consentimiento-voz` → `concedido` debe coincidir con `autorizaGrabacionVoz` de ASISCO UP (hoy `false` porque se revocó en la prueba; si alex lo vuelve a poner en `true` en ASISCO UP, debe salir `true`).
   - Nunca hagas POST/PATCH/DELETE a ASISCO UP tú mismo.

**Fase 4 – Subir y PR**
9. `git push -u origin backend/integracion-asiscoup`.
10. PR a `main`: «Integración ASISCO UP: Swagger, consentimiento de voz y vínculos de acudientes». En la descripción: qué cambia, que no hay migración ni cambios en la app, el interruptor `ASISCO_API_URL`, la tabla de datos de prueba, el resultado de las verificaciones y los pendientes de la sección 5. **Avísame en el PR que `render.yaml` trae `ASISCO_API_URL` con valor**: al unirlo, Render queda conectado a ASISCO UP. Si no puedes crear el PR desde aquí, dame el enlace.

## 4. Reglas

- **Base de datos:** no crees ni apliques migraciones, no ejecutes `db:deploy`, no ejecutes SQL contra Supabase. El único cambio de datos es el **Paso previo**, y lo hace alex. Nunca edites migraciones ya aplicadas.
- **No borres** `acudiente_estudiante` ni cambies `fn_notificar_acudientes` ni `fn_practica_casa_vinculo`.
- **App móvil:** no toques `GameUp-frontend/`.
- **ASISCO UP:** solo `GET`. Nada de `POST /api/consentimientos`, `POST /api/vinculos` ni `POST /api/estudiantes/sincronizar-auth`.
- **Secretos y datos:** no pongas tokens, contraseñas, `DATABASE_URL` ni datos de menores en código, commits, logs o el PR. No subas `.env`. Los logs de los adaptadores solo registran códigos de estado.
- `CONSENTIMIENTO_SIMULADO=true` solo en desarrollo; no cambies la regla que lo prohíbe en producción.
- Mantén **fallar cerrado** en el consentimiento y **no tocar la copia** de vínculos cuando ASISCO UP falla o responde por otra persona.
- No agregues dependencias ni cambies la estructura de carpetas.

## 5. Pendientes (no los implementes; déjalos en el PR y en AVANCE.md)

1. **Render:** tras unir el PR, revisar que `ASISCO_API_URL` esté puesta. Para "apagar" la integración basta con quitarla.
2. **Cambiar el `idEstudianteExterno` desde la app:** hoy solo se pone al crear el usuario. Falta un endpoint para la directora que lo cambie validando contra ASISCO UP.
3. **Validar el `idEstudianteExterno` al crear el estudiante** (`POST /usuarios`) con `GET /api/estudiantes/:id` de ASISCO UP, comprobando que el `idEstudiante` de la respuesta sea el mismo.
4. **Los vínculos se refrescan solo cuando el acudiente inicia sesión.** Si ASISCO UP quita un vínculo, GameUP lo nota en el siguiente login de ese acudiente.
5. **Pantalla para aceptar los términos en GameUP (decisión pendiente).** ASISCO UP ofrece el texto legal (`GET /api/catalogos/versiones-terminos`) y `POST /api/consentimientos`.
6. **Avisar a ASISCO UP:**
   - (a) `/api/estudiantes/:id` con tres tipos de id puede confundir niños (ya hay choques reales: su estudiante 12 frente al usuario 12 de seguridad).
   - (b) "Mis estudiantes vinculados" con una cuenta ADMIN creó un acudiente (idAcudiente 11, "Directora GameUp"): debería aceptar solo cuentas ACUDIENTE y no crear registros al consultar.
   - (c) El usuario 12 "Tallerista GameUP" tiene rol ESTUDIANTE en seguridad y quedó como estudiante en ASISCO UP.
   - (d) Varios endpoints con datos de menores responden sin token, y `POST /api/consentimientos` debería exigir el token del acudiente.

## 6. Al terminar, entrégame

- `git log --oneline origin/main..HEAD`.
- Resultado de tsc, lint, test, test:e2e (números) y build.
- Resultado de cada prueba manual (o por qué se saltó).
- Enlace del PR.

---

## Anexo — Parches completos (cópialos tal cual, sin las líneas de ~~~~)

### 0001-Swagger-aclarar-qu-datos-son-de-ASISCO-UP-y-de-la-AP.patch

~~~~diff
From b5f687f006588df1bd8096cc559bb0fa80703e92 Mon Sep 17 00:00:00 2001
From: Claude <noreply@anthropic.com>
Date: Sat, 7 Nov 2026 02:43:15 +0000
Subject: [PATCH 1/3] =?UTF-8?q?Swagger:=20aclarar=20qu=C3=A9=20datos=20son?=
 =?UTF-8?q?=20de=20ASISCO=20UP=20y=20de=20la=20API=20de=20seguridad?=
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

Responde a la revisión de endpoints duplicados: la sección de estudiantes
describe el perfil de aprendizaje de GameUP, el login se documenta como
reenvío a la API de seguridad y los nombres como copia de solo lectura.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011mzVHxrx3GtptLue2XF1vS
---
 GameUp-backend/src/docs/swagger.ts            | 16 ++++++++++++---
 .../presentation/dto/estudiante.dto.ts        | 20 +++++++++++++++----
 2 files changed, 29 insertions(+), 7 deletions(-)

diff --git a/GameUp-backend/src/docs/swagger.ts b/GameUp-backend/src/docs/swagger.ts
index 6daf22e..a493bee 100644
--- a/GameUp-backend/src/docs/swagger.ts
+++ b/GameUp-backend/src/docs/swagger.ts
@@ -27,7 +27,12 @@ export function setupSwagger(app: INestApplication, publicUrl?: string): void {
     .setTitle('GameUP API')
     .setDescription(
       'API del aula virtual inclusiva GameUP (Fundación ASISCO-UP). ' +
-        'Todas las rutas de la API están bajo /api/v1.',
+        'Todas las rutas de la API están bajo /api/v1.\n\n' +
+        'Integración: la identidad y el JWT son de la API de seguridad; ' +
+        'los datos personales de estudiantes y acudientes, los vínculos ' +
+        'familiares y el consentimiento informado son de ASISCO UP. GameUP ' +
+        'guarda solo el perfil de aprendizaje y lo relaciona con ASISCO UP ' +
+        'mediante idEstudianteExterno.',
     )
     .setVersion('1.0.0')
     // "/" = el mismo servidor desde donde se abre /api-docs (local o Render),
@@ -50,11 +55,16 @@ export function setupSwagger(app: INestApplication, publicUrl?: string): void {
       BEARER_AUTH,
     )
     .addTag('health', 'Estado del backend y de sus conexiones')
-    .addTag('auth', 'Inicio y cierre de sesión con la API de seguridad')
+    .addTag(
+      'auth',
+      'Inicio y cierre de sesión: reenvía a la API de seguridad y usa su JWT (GameUP no emite tokens)',
+    )
     .addTag('usuarios', 'Cuentas de GameUP (solo la directora)')
     .addTag(
       'estudiantes',
-      'Estudiantes, sus vínculos, nivel y consentimiento de voz',
+      'Perfil de aprendizaje del estudiante en GameUP (nivel, avatar, ' +
+        'talleristas, acudientes y verificación del consentimiento de voz). ' +
+        'Los datos personales los administra ASISCO UP.',
     )
     .addTag(
       'catalogo',
diff --git a/GameUp-backend/src/modules/estudiantes/presentation/dto/estudiante.dto.ts b/GameUp-backend/src/modules/estudiantes/presentation/dto/estudiante.dto.ts
index e602707..1ca4c26 100644
--- a/GameUp-backend/src/modules/estudiantes/presentation/dto/estudiante.dto.ts
+++ b/GameUp-backend/src/modules/estudiantes/presentation/dto/estudiante.dto.ts
@@ -20,9 +20,15 @@ export class PersonaDto {
   displayName: string;
 }
 
-/** Estudiante en listados (StudentSummary en la app). */
+/**
+ * Estudiante en listados (StudentSummary en la app).
+ *
+ * Es el perfil de aprendizaje en GameUP: los datos personales (documento,
+ * fecha de nacimiento, diagnóstico) son de ASISCO UP y no se guardan aquí.
+ * El idEstudiante de ASISCO UP solo lo ve la directora, en /usuarios.
+ */
 export class EstudianteResumenDto {
-  @ApiProperty({ example: '31' })
+  @ApiProperty({ example: '31', description: 'Id interno de GameUP' })
   id: string;
 
   @ApiProperty({
@@ -43,10 +49,16 @@ export class EstudianteResumenDto {
 
 /** Ficha del estudiante (directora, tallerista a cargo, acudiente). */
 export class EstudianteDetalleDto extends EstudianteResumenDto {
-  @ApiProperty({ example: 'Martín José' })
+  @ApiProperty({
+    example: 'Martín José',
+    description: 'Copia de solo lectura; GameUP no la edita',
+  })
   nombres: string;
 
-  @ApiProperty({ example: 'Cruz Pérez' })
+  @ApiProperty({
+    example: 'Cruz Pérez',
+    description: 'Copia de solo lectura; GameUP no la edita',
+  })
   apellidos: string;
 
   @ApiProperty({ example: '2026-02-03', format: 'date' })
-- 
2.43.0

~~~~

### 0002-Consentimiento-adaptador-HTTP-de-ASISCO-UP-sin-conec.patch

~~~~diff
From b1f5a82c994f3ccb4b5b60cb57dc33cd68938435 Mon Sep 17 00:00:00 2001
From: Claude <noreply@anthropic.com>
Date: Sat, 7 Nov 2026 03:03:19 +0000
Subject: [PATCH 2/3] =?UTF-8?q?Consentimiento:=20adaptador=20HTTP=20de=20A?=
 =?UTF-8?q?SISCO=20UP=20(sin=20conectar=20todav=C3=ADa)?=
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

Lee GET /api/estudiantes/{id}/consentimiento con la forma real de la
respuesta. No se conecta a la verificación de voz: el texto legal
v1.0-2026 cubre el tratamiento de datos, no la grabación de voz.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011mzVHxrx3GtptLue2XF1vS
---
 .../consentimiento-asiscoup-http.spec.ts      | 104 ++++++++++++++++
 .../consentimiento-asiscoup-http.ts           | 111 ++++++++++++++++++
 2 files changed, 215 insertions(+)
 create mode 100644 GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.spec.ts
 create mode 100644 GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.ts

diff --git a/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.spec.ts b/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.spec.ts
new file mode 100644
index 0000000..d1fddf1
--- /dev/null
+++ b/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.spec.ts
@@ -0,0 +1,104 @@
+import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
+import { ConsultaConsentimientoAsiscoUpHttp } from './consentimiento-asiscoup-http.js';
+
+const json = (cuerpo: unknown, status = 200) =>
+  new Response(JSON.stringify(cuerpo), {
+    status,
+    headers: { 'Content-Type': 'application/json' },
+  });
+
+/** Forma real de ASISCO UP (2026-11-07), con datos de prueba. */
+const vigente = (extra: Record<string, unknown> = {}) => ({
+  idEstudiante: 1,
+  versionVigente: { idVersionTerminos: 1, codigoVersion: 'v1.0-2026' },
+  tieneConsentimientoVigente: true,
+  requiereAceptarTerminos: false,
+  consentimientos: [
+    {
+      idEstudiante: 1,
+      idAcudiente: 1,
+      idVersionTerminos: 1,
+      aceptaTratamiento: true,
+      fechaOtorgamiento: '2026-11-07T02:53:39.356Z',
+      codigoVersion: 'v1.0-2026',
+    },
+  ],
+  ...extra,
+});
+
+describe('ConsultaConsentimientoAsiscoUpHttp', () => {
+  let fetchFalso: ReturnType<typeof vi.fn>;
+  const crear = () => {
+    const c = new ConsultaConsentimientoAsiscoUpHttp(
+      'https://asiscoup.test/',
+      5000,
+    );
+    vi.spyOn(c['logger'], 'warn').mockImplementation(() => undefined);
+    return c;
+  };
+
+  beforeEach(() => {
+    fetchFalso = vi.fn(async () => json(vigente()));
+    vi.stubGlobal('fetch', fetchFalso);
+  });
+  afterEach(() => vi.unstubAllGlobals());
+
+  it('consulta la ruta del estudiante externo', async () => {
+    await crear().vigente(990001n);
+    const [url] = fetchFalso.mock.calls[0] as [string];
+    expect(url).toBe(
+      'https://asiscoup.test/api/estudiantes/990001/consentimiento',
+    );
+  });
+
+  it('vigente y al día → acepta, con la versión', async () => {
+    await expect(crear().vigente(1n)).resolves.toEqual({
+      aceptaTratamiento: true,
+      codigoVersion: 'v1.0-2026',
+    });
+  });
+
+  it('términos nuevos sin aceptar → no acepta', async () => {
+    fetchFalso.mockResolvedValue(
+      json(vigente({ requiereAceptarTerminos: true })),
+    );
+    await expect(crear().vigente(1n)).resolves.toEqual({
+      aceptaTratamiento: false,
+      codigoVersion: 'v1.0-2026',
+    });
+  });
+
+  it('sin consentimiento vigente → no acepta', async () => {
+    fetchFalso.mockResolvedValue(
+      json(vigente({ tieneConsentimientoVigente: false, consentimientos: [] })),
+    );
+    await expect(crear().vigente(1n)).resolves.toMatchObject({
+      aceptaTratamiento: false,
+    });
+  });
+
+  it('404 (estudiante desconocido) → null', async () => {
+    fetchFalso.mockResolvedValue(
+      json({ error: 'Estudiante con id 1 no fue encontrado' }, 404),
+    );
+    await expect(crear().vigente(1n)).resolves.toBeNull();
+  });
+
+  it.each([
+    ['500', () => json({ error: 'x' }, 500)],
+    ['formato inesperado', () => json({ algo: 1 })],
+    ['vigente sin versión', () => json(vigente({ versionVigente: null }))],
+  ])('%s → servicio no disponible (falla cerrado)', async (_n, resp) => {
+    fetchFalso.mockResolvedValue(resp());
+    await expect(crear().vigente(1n)).rejects.toBeInstanceOf(
+      ServicioExternoNoDisponibleError,
+    );
+  });
+
+  it('sin respuesta → servicio no disponible', async () => {
+    fetchFalso.mockRejectedValue(new Error('timeout'));
+    await expect(crear().vigente(1n)).rejects.toBeInstanceOf(
+      ServicioExternoNoDisponibleError,
+    );
+  });
+});
diff --git a/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.ts b/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.ts
new file mode 100644
index 0000000..571cc44
--- /dev/null
+++ b/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.ts
@@ -0,0 +1,111 @@
+import { Logger } from '@nestjs/common';
+import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
+import type {
+  ConsentimientoVigente,
+  ConsultaConsentimiento,
+} from '../domain/consulta-consentimiento.js';
+
+/**
+ * Lee el consentimiento informado de ASISCO UP:
+ *   GET <base>/api/estudiantes/{idEstudiante}/consentimiento
+ *
+ * Respuesta real observada el 2026-11-07:
+ *   { idEstudiante, versionVigente: { idVersionTerminos, codigoVersion },
+ *     tieneConsentimientoVigente, requiereAceptarTerminos, consentimientos[] }
+ *   404 { error } si el estudiante no existe.
+ *
+ * OJO: es el consentimiento de TRATAMIENTO DE DATOS. El texto legal v1.0-2026
+ * no menciona la grabación de voz, así que este adaptador todavía NO se
+ * conecta a la verificación de voz (ConsentimientoModule sigue usando
+ * ConsultaConsentimientoNoDisponible). Falta decidir dónde vive la
+ * autorización específica de voz.
+ *
+ * Nunca registra datos del estudiante: solo el código de estado.
+ */
+export class ConsultaConsentimientoAsiscoUpHttp implements ConsultaConsentimiento {
+  private readonly logger = new Logger(ConsultaConsentimientoAsiscoUpHttp.name);
+  private readonly baseUrl: string;
+
+  constructor(
+    baseUrl: string,
+    private readonly timeoutMs: number,
+  ) {
+    this.baseUrl = baseUrl.replace(/\/+$/, '');
+  }
+
+  async vigente(
+    idEstudianteExterno: bigint,
+  ): Promise<ConsentimientoVigente | null> {
+    const url = `${this.baseUrl}/api/estudiantes/${idEstudianteExterno.toString()}/consentimiento`;
+
+    let respuesta: Response;
+    try {
+      respuesta = await fetch(url, {
+        headers: { Accept: 'application/json' },
+        signal: AbortSignal.timeout(this.timeoutMs),
+      });
+    } catch {
+      this.logger.warn('ASISCO UP no respondió a /consentimiento');
+      throw new ServicioExternoNoDisponibleError(
+        'No se puede consultar el consentimiento: ASISCO UP no responde.',
+      );
+    }
+
+    // Estudiante desconocido en ASISCO UP: no hay consentimiento.
+    if (respuesta.status === 404) return null;
+    if (!respuesta.ok) {
+      this.logger.warn(
+        `ASISCO UP respondió ${respuesta.status} a /consentimiento`,
+      );
+      throw new ServicioExternoNoDisponibleError(
+        'No se puede consultar el consentimiento en ASISCO UP.',
+      );
+    }
+
+    let cuerpo: unknown;
+    try {
+      cuerpo = await respuesta.json();
+    } catch {
+      cuerpo = null;
+    }
+    return interpretarRespuesta(cuerpo, this.logger);
+  }
+}
+
+function interpretarRespuesta(
+  cuerpo: unknown,
+  logger: Logger,
+): ConsentimientoVigente | null {
+  if (typeof cuerpo !== 'object' || cuerpo === null) {
+    return formatoInesperado(logger);
+  }
+  const c = cuerpo as {
+    tieneConsentimientoVigente?: unknown;
+    requiereAceptarTerminos?: unknown;
+    versionVigente?: { codigoVersion?: unknown } | null;
+  };
+  if (typeof c.tieneConsentimientoVigente !== 'boolean') {
+    return formatoInesperado(logger);
+  }
+  const codigo = c.versionVigente?.codigoVersion;
+  if (!c.tieneConsentimientoVigente) {
+    return typeof codigo === 'string'
+      ? { aceptaTratamiento: false, codigoVersion: codigo }
+      : null;
+  }
+  if (typeof codigo !== 'string' || codigo.trim() === '') {
+    return formatoInesperado(logger);
+  }
+  // Si hay términos nuevos sin aceptar, el consentimiento no está al día.
+  return {
+    aceptaTratamiento: c.requiereAceptarTerminos !== true,
+    codigoVersion: codigo,
+  };
+}
+
+function formatoInesperado(logger: Logger): never {
+  logger.warn('La respuesta de /consentimiento tiene un formato inesperado');
+  throw new ServicioExternoNoDisponibleError(
+    'ASISCO UP respondió el consentimiento con un formato inesperado.',
+  );
+}
-- 
2.43.0

~~~~

### 0003-Consentimiento-de-voz-autorizaGrabacionVoz.patch

~~~~diff
From d505cbc952ffede4649b5473522b69a160229fc2 Mon Sep 17 00:00:00 2001
From: Claude <noreply@anthropic.com>
Date: Sun, 8 Nov 2026 02:53:09 +0000
Subject: [PATCH] Consentimiento de voz: leer autorizaGrabacionVoz de ASISCO UP
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

ASISCO UP publicó los términos v1.1-2026 con el permiso de voz separado
(autorizaGrabacionVoz). GameUP solo graba si hay consentimiento vigente,
al día y con autorizaGrabacionVoz: true; si falta el campo, no graba.
Si ASISCO UP responde por otro idEstudiante, falla cerrado (su ruta acepta
varios tipos de id). Variables nuevas: ASISCO_API_URL y
ASISCO_API_TIMEOUT_MS; sin ASISCO_API_URL se sigue fallando cerrado.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011mzVHwcy8YzTAgvT4WmR2o
---
 GameUp-backend/.env.example                   | 11 +++-
 GameUp-backend/src/config/env.validation.ts   | 16 ++++++
 .../consentimiento/consentimiento.module.ts   | 14 ++++-
 .../domain/consulta-consentimiento.ts         | 13 +++--
 .../consentimiento-asiscoup-http.spec.ts      | 55 +++++++++++++------
 .../consentimiento-asiscoup-http.ts           | 45 +++++++++++----
 .../consultas-consentimiento.ts               |  7 +--
 render.yaml                                   |  5 ++
 8 files changed, 123 insertions(+), 43 deletions(-)

diff --git a/GameUp-backend/.env.example b/GameUp-backend/.env.example
index f79d4aa..0677b31 100644
--- a/GameUp-backend/.env.example
+++ b/GameUp-backend/.env.example
@@ -36,9 +36,14 @@ DATABASE_URL="postgresql://postgres:TU_CLAVE@localhost:5432/gameup?schema=public
 # Segundos que se recuerda un token ya verificado (0 a 300; nunca más que su exp).
 # AUTH_CACHE_TTL_SEG=300
 
-# ---------- Consentimiento de voz (API del núcleo familiar) ----------
-# Aún no existe el endpoint para leer el consentimiento: sin él, GameUP
-# responde "no concedido" y no guarda audio (falla cerrado).
+# ---------- Consentimiento de voz (API de ASISCO UP / núcleo familiar) ----------
+# URL base de ASISCO UP, sin /api al final. GameUP lee
+# <URL>/api/estudiantes/{idEstudianteExterno}/consentimiento.
+# Si falta, GameUP responde "no concedido" y no guarda audio (falla cerrado).
+# ASISCO_API_URL=https://proyecto-asiscoup-g1-jvaz.onrender.com
+# ASISCO_API_TIMEOUT_MS=5000
+# Solo se graba si ASISCO UP responde autorizaGrabacionVoz: true
+# (términos v1.1-2026 o posteriores, aceptados por el acudiente).
 # SOLO DESARROLLO: true hace que todos los estudiantes figuren con
 # consentimiento, para probar Habla conmigo. Prohibido en producción
 # (la app no arranca si NODE_ENV=production y esto es true).
diff --git a/GameUp-backend/src/config/env.validation.ts b/GameUp-backend/src/config/env.validation.ts
index da2ec1a..fe931d3 100644
--- a/GameUp-backend/src/config/env.validation.ts
+++ b/GameUp-backend/src/config/env.validation.ts
@@ -104,6 +104,22 @@ export class EnvironmentVariables {
   @Max(300)
   AUTH_CACHE_TTL_SEG: number = 300;
 
+  /**
+   * URL base de la API de ASISCO UP (núcleo familiar), sin /api al final.
+   * Ej.: https://proyecto-asiscoup-g1-jvaz.onrender.com
+   * Se usa para leer el consentimiento informado del estudiante.
+   */
+  @IsOptional()
+  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
+  ASISCO_API_URL?: string;
+
+  /** Tiempo máximo de espera de cada llamada a ASISCO UP. */
+  @IsInt()
+  @Min(500)
+  @Max(30000)
+  ASISCO_API_TIMEOUT_MS: number = 5000;
+
+
   /**
    * SOLO DESARROLLO: si es "true", todos los estudiantes figuran con
    * consentimiento de voz aceptado (para probar Habla conmigo mientras no
diff --git a/GameUp-backend/src/modules/consentimiento/consentimiento.module.ts b/GameUp-backend/src/modules/consentimiento/consentimiento.module.ts
index 59a7ce8..92351e7 100644
--- a/GameUp-backend/src/modules/consentimiento/consentimiento.module.ts
+++ b/GameUp-backend/src/modules/consentimiento/consentimiento.module.ts
@@ -7,6 +7,7 @@ import {
   CONSULTA_CONSENTIMIENTO,
   type ConsultaConsentimiento,
 } from './domain/consulta-consentimiento.js';
+import { ConsultaConsentimientoAsiscoUpHttp } from './infrastructure/consentimiento-asiscoup-http.js';
 import {
   ConsultaConsentimientoNoDisponible,
   ConsultaConsentimientoSimulada,
@@ -14,8 +15,10 @@ import {
 import { ConsentimientoController } from './presentation/consentimiento.controller.js';
 
 /**
- * Consentimiento de grabación de voz. Exporta ConsentimientoService para las
- * grabaciones de Habla conmigo (fase 6).
+ * Consentimiento de grabación de voz: se lee de ASISCO UP (ASISCO_API_URL,
+ * campo autorizaGrabacionVoz). Sin ASISCO_API_URL no se graba (falla
+ * cerrado). Exporta ConsentimientoService para las grabaciones de Habla
+ * conmigo (fase 6).
  */
 @Module({
   imports: [EstudiantesModule],
@@ -34,7 +37,12 @@ import { ConsentimientoController } from './presentation/consentimiento.controll
           );
           return new ConsultaConsentimientoSimulada();
         }
-        return new ConsultaConsentimientoNoDisponible();
+        const url = config.get('ASISCO_API_URL', { infer: true });
+        if (!url) return new ConsultaConsentimientoNoDisponible();
+        return new ConsultaConsentimientoAsiscoUpHttp(
+          url,
+          config.get('ASISCO_API_TIMEOUT_MS', { infer: true }),
+        );
       },
     },
   ],
diff --git a/GameUp-backend/src/modules/consentimiento/domain/consulta-consentimiento.ts b/GameUp-backend/src/modules/consentimiento/domain/consulta-consentimiento.ts
index 7a15492..9731ae5 100644
--- a/GameUp-backend/src/modules/consentimiento/domain/consulta-consentimiento.ts
+++ b/GameUp-backend/src/modules/consentimiento/domain/consulta-consentimiento.ts
@@ -1,12 +1,15 @@
 /**
- * Puerto ConsultaConsentimiento: el consentimiento vive en la API del núcleo
- * familiar (aceptaTratamiento, codigoVersion; el textoLegal incluye la
- * grabación de voz). GameUP no guarda una copia: lo consulta cada vez.
+ * Puerto ConsultaConsentimiento: el consentimiento vive en ASISCO UP (API del
+ * núcleo familiar). GameUP no guarda una copia: lo consulta cada vez con
+ * GET /api/estudiantes/{id}/consentimiento.
  *
- * Aún no existe un endpoint para leerlo (pendiente del otro grupo). Cuando
- * exista, se agrega un adaptador HTTP sin tocar los servicios.
+ * Desde los términos v1.1-2026, ASISCO UP separa el permiso de voz
+ * (autorizaGrabacionVoz). `aceptaTratamiento` significa aquí "se puede grabar
+ * la voz": el adaptador HTTP solo lo pone en true si hay consentimiento
+ * vigente, al día y con autorizaGrabacionVoz.
  */
 export interface ConsentimientoVigente {
+  /** true solo si el acudiente autorizó grabar la voz (ver arriba). */
   aceptaTratamiento: boolean;
   /** Versión de los términos aceptados (se guarda en cada grabación). */
   codigoVersion: string;
diff --git a/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.spec.ts b/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.spec.ts
index d1fddf1..81dc246 100644
--- a/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.spec.ts
+++ b/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.spec.ts
@@ -7,22 +7,18 @@ const json = (cuerpo: unknown, status = 200) =>
     headers: { 'Content-Type': 'application/json' },
   });
 
-/** Forma real de ASISCO UP (2026-11-07), con datos de prueba. */
+/** Forma de ASISCO UP con la v1.1-2026 (2026-11-08), con datos de prueba. */
 const vigente = (extra: Record<string, unknown> = {}) => ({
   idEstudiante: 1,
-  versionVigente: { idVersionTerminos: 1, codigoVersion: 'v1.0-2026' },
+  versionVigente: {
+    idVersionTerminos: 2,
+    codigoVersion: 'v1.1-2026',
+    textoLegal: 'Términos y autorización — versión v1.1-2026...',
+  },
   tieneConsentimientoVigente: true,
+  autorizaGrabacionVoz: true,
   requiereAceptarTerminos: false,
-  consentimientos: [
-    {
-      idEstudiante: 1,
-      idAcudiente: 1,
-      idVersionTerminos: 1,
-      aceptaTratamiento: true,
-      fechaOtorgamiento: '2026-11-07T02:53:39.356Z',
-      codigoVersion: 'v1.0-2026',
-    },
-  ],
+  consentimientos: [],
   ...extra,
 });
 
@@ -44,6 +40,7 @@ describe('ConsultaConsentimientoAsiscoUpHttp', () => {
   afterEach(() => vi.unstubAllGlobals());
 
   it('consulta la ruta del estudiante externo', async () => {
+    fetchFalso.mockResolvedValue(json(vigente({ idEstudiante: 990001 })));
     await crear().vigente(990001n);
     const [url] = fetchFalso.mock.calls[0] as [string];
     expect(url).toBe(
@@ -51,10 +48,28 @@ describe('ConsultaConsentimientoAsiscoUpHttp', () => {
     );
   });
 
-  it('vigente y al día → acepta, con la versión', async () => {
+  it('vigente y autoriza la voz → acepta, con la versión', async () => {
     await expect(crear().vigente(1n)).resolves.toEqual({
       aceptaTratamiento: true,
-      codigoVersion: 'v1.0-2026',
+      codigoVersion: 'v1.1-2026',
+    });
+  });
+
+  it('acepta los datos pero no la voz → no acepta', async () => {
+    fetchFalso.mockResolvedValue(
+      json(vigente({ autorizaGrabacionVoz: false })),
+    );
+    await expect(crear().vigente(1n)).resolves.toEqual({
+      aceptaTratamiento: false,
+      codigoVersion: 'v1.1-2026',
+    });
+  });
+
+  it('sin autorizaGrabacionVoz (API vieja) → no acepta', async () => {
+    const { autorizaGrabacionVoz: _omitido, ...sinCampo } = vigente();
+    fetchFalso.mockResolvedValue(json(sinCampo));
+    await expect(crear().vigente(1n)).resolves.toMatchObject({
+      aceptaTratamiento: false,
     });
   });
 
@@ -62,15 +77,19 @@ describe('ConsultaConsentimientoAsiscoUpHttp', () => {
     fetchFalso.mockResolvedValue(
       json(vigente({ requiereAceptarTerminos: true })),
     );
-    await expect(crear().vigente(1n)).resolves.toEqual({
+    await expect(crear().vigente(1n)).resolves.toMatchObject({
       aceptaTratamiento: false,
-      codigoVersion: 'v1.0-2026',
     });
   });
 
   it('sin consentimiento vigente → no acepta', async () => {
     fetchFalso.mockResolvedValue(
-      json(vigente({ tieneConsentimientoVigente: false, consentimientos: [] })),
+      json(
+        vigente({
+          tieneConsentimientoVigente: false,
+          autorizaGrabacionVoz: false,
+        }),
+      ),
     );
     await expect(crear().vigente(1n)).resolves.toMatchObject({
       aceptaTratamiento: false,
@@ -88,6 +107,8 @@ describe('ConsultaConsentimientoAsiscoUpHttp', () => {
     ['500', () => json({ error: 'x' }, 500)],
     ['formato inesperado', () => json({ algo: 1 })],
     ['vigente sin versión', () => json(vigente({ versionVigente: null }))],
+    ['responde por otro estudiante', () => json(vigente({ idEstudiante: 2 }))],
+    ['sin idEstudiante', () => json(vigente({ idEstudiante: undefined }))],
   ])('%s → servicio no disponible (falla cerrado)', async (_n, resp) => {
     fetchFalso.mockResolvedValue(resp());
     await expect(crear().vigente(1n)).rejects.toBeInstanceOf(
diff --git a/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.ts b/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.ts
index 571cc44..0409646 100644
--- a/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.ts
+++ b/GameUp-backend/src/modules/consentimiento/infrastructure/consentimiento-asiscoup-http.ts
@@ -9,16 +9,17 @@ import type {
  * Lee el consentimiento informado de ASISCO UP:
  *   GET <base>/api/estudiantes/{idEstudiante}/consentimiento
  *
- * Respuesta real observada el 2026-11-07:
- *   { idEstudiante, versionVigente: { idVersionTerminos, codigoVersion },
- *     tieneConsentimientoVigente, requiereAceptarTerminos, consentimientos[] }
+ * Respuesta de ASISCO UP con la versión v1.1-2026 (datos + voz), 2026-11-08:
+ *   { idEstudiante, versionVigente: { idVersionTerminos, codigoVersion, textoLegal },
+ *     tieneConsentimientoVigente, autorizaGrabacionVoz,
+ *     requiereAceptarTerminos, consentimientos[] }
  *   404 { error } si el estudiante no existe.
  *
- * OJO: es el consentimiento de TRATAMIENTO DE DATOS. El texto legal v1.0-2026
- * no menciona la grabación de voz, así que este adaptador todavía NO se
- * conecta a la verificación de voz (ConsentimientoModule sigue usando
- * ConsultaConsentimientoNoDisponible). Falta decidir dónde vive la
- * autorización específica de voz.
+ * Regla para grabar la voz (todas a la vez): tieneConsentimientoVigente,
+ * autorizaGrabacionVoz === true y requiereAceptarTerminos !== true. Si el
+ * acudiente aceptó los datos pero no la voz, el niño usa GameUP normalmente
+ * y solo no se guarda audio. Si falta autorizaGrabacionVoz (versión vieja de
+ * la API), se toma como "no autoriza".
  *
  * Nunca registra datos del estudiante: solo el código de estado.
  */
@@ -68,25 +69,37 @@ export class ConsultaConsentimientoAsiscoUpHttp implements ConsultaConsentimient
     } catch {
       cuerpo = null;
     }
-    return interpretarRespuesta(cuerpo, this.logger);
+    return interpretarRespuesta(cuerpo, idEstudianteExterno, this.logger);
   }
 }
 
 function interpretarRespuesta(
   cuerpo: unknown,
+  idPedido: bigint,
   logger: Logger,
 ): ConsentimientoVigente | null {
   if (typeof cuerpo !== 'object' || cuerpo === null) {
     return formatoInesperado(logger);
   }
   const c = cuerpo as {
+    idEstudiante?: unknown;
     tieneConsentimientoVigente?: unknown;
+    autorizaGrabacionVoz?: unknown;
     requiereAceptarTerminos?: unknown;
     versionVigente?: { codigoVersion?: unknown } | null;
   };
   if (typeof c.tieneConsentimientoVigente !== 'boolean') {
     return formatoInesperado(logger);
   }
+  // ASISCO UP acepta en la ruta varios tipos de id (el suyo, el de la API de
+  // seguridad o el documento). Si responde por otro estudiante, no se usa:
+  // podría ser el permiso de otro niño.
+  if (!mismoEstudiante(c.idEstudiante, idPedido)) {
+    logger.warn('ASISCO UP respondió el consentimiento de otro estudiante');
+    throw new ServicioExternoNoDisponibleError(
+      'ASISCO UP respondió el consentimiento de otro estudiante.',
+    );
+  }
   const codigo = c.versionVigente?.codigoVersion;
   if (!c.tieneConsentimientoVigente) {
     return typeof codigo === 'string'
@@ -96,13 +109,23 @@ function interpretarRespuesta(
   if (typeof codigo !== 'string' || codigo.trim() === '') {
     return formatoInesperado(logger);
   }
-  // Si hay términos nuevos sin aceptar, el consentimiento no está al día.
   return {
-    aceptaTratamiento: c.requiereAceptarTerminos !== true,
+    aceptaTratamiento:
+      c.autorizaGrabacionVoz === true && c.requiereAceptarTerminos !== true,
     codigoVersion: codigo,
   };
 }
 
+function mismoEstudiante(valor: unknown, idPedido: bigint): boolean {
+  if (typeof valor === 'number' && Number.isSafeInteger(valor)) {
+    return BigInt(valor) === idPedido;
+  }
+  if (typeof valor === 'string' && /^\d{1,19}$/.test(valor)) {
+    return BigInt(valor) === idPedido;
+  }
+  return false;
+}
+
 function formatoInesperado(logger: Logger): never {
   logger.warn('La respuesta de /consentimiento tiene un formato inesperado');
   throw new ServicioExternoNoDisponibleError(
diff --git a/GameUp-backend/src/modules/consentimiento/infrastructure/consultas-consentimiento.ts b/GameUp-backend/src/modules/consentimiento/infrastructure/consultas-consentimiento.ts
index 3bc0e5f..ecadc9d 100644
--- a/GameUp-backend/src/modules/consentimiento/infrastructure/consultas-consentimiento.ts
+++ b/GameUp-backend/src/modules/consentimiento/infrastructure/consultas-consentimiento.ts
@@ -5,15 +5,14 @@ import type {
 } from '../domain/consulta-consentimiento.js';
 
 /**
- * Adaptador mientras no exista el endpoint de lectura en la API del núcleo
- * familiar: siempre "no se puede verificar". Con la regla de fallar cerrado,
- * ninguna grabación se guarda.
+ * Adaptador cuando falta ASISCO_API_URL: siempre "no se puede verificar".
+ * Con la regla de fallar cerrado, ninguna grabación se guarda.
  */
 export class ConsultaConsentimientoNoDisponible implements ConsultaConsentimiento {
   vigente(): Promise<ConsentimientoVigente | null> {
     return Promise.reject(
       new ServicioExternoNoDisponibleError(
-        'No se puede consultar el consentimiento: la API del núcleo familiar aún no está conectada.',
+        'No se puede consultar el consentimiento: falta configurar ASISCO_API_URL.',
       ),
     );
   }
diff --git a/render.yaml b/render.yaml
index 6972c41..46a3861 100644
--- a/render.yaml
+++ b/render.yaml
@@ -39,6 +39,11 @@ services:
         value: "5000"
       - key: AUTH_CACHE_TTL_SEG
         value: "300"
+      # ASISCO UP: consentimiento informado (lectura).
+      - key: ASISCO_API_URL
+        value: "https://proyecto-asiscoup-g1-jvaz.onrender.com"
+      - key: ASISCO_API_TIMEOUT_MS
+        value: "5000"
       # Nunca true en producción (la app no arrancaría).
       - key: CONSENTIMIENTO_SIMULADO
         value: "false"
-- 
2.43.0

~~~~

### 0004-Vinculos-de-acudientes-copiarlos-de-ASISCO-UP.patch

~~~~diff
From 5cc64d59a163df5d42819402ce66fa0d0d0eadb9 Mon Sep 17 00:00:00 2001
From: Claude <noreply@anthropic.com>
Date: Sun, 8 Nov 2026 05:09:06 +0000
Subject: [PATCH] =?UTF-8?q?V=C3=ADnculos=20de=20acudientes:=20copiarlos=20?=
 =?UTF-8?q?de=20ASISCO=20UP=20al=20iniciar=20sesi=C3=B3n?=
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

Con ASISCO_API_URL, cuando un acudiente inicia sesión GameUP consulta
GET /api/acudientes/me/estudiantes con su token y deja la copia local
(acudiente_estudiante) igual a lo que dice ASISCO UP. La tabla se conserva
porque la usan los permisos, fn_notificar_acudientes y la regla de
práctica en casa. Solo se aplica si ASISCO UP responde por el mismo
usuario de seguridad; si no responde, se conserva la copia y el login
sigue. Con ASISCO UP conectado, la directora ya no vincula acudientes a
mano (409). Sin ASISCO_API_URL todo sigue como antes.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011mzVHwcy8YzTAgvT4WmR2o
---
 .../auth/application/auth.service.spec.ts     |  65 ++++++++++
 .../modules/auth/application/auth.service.ts  |  22 +++-
 .../src/modules/auth/auth.module.ts           |   3 +-
 .../sincronizacion-vinculos.service.spec.ts   |  87 +++++++++++++
 .../sincronizacion-vinculos.service.ts        |  55 +++++++++
 .../application/vinculos.service.spec.ts      |  32 +++++
 .../application/vinculos.service.ts           |  19 ++-
 .../estudiantes/domain/vinculos-externos.ts   |  57 +++++++++
 .../modules/estudiantes/estudiantes.module.ts |  50 +++++++-
 .../prisma-copia-vinculos.repository.ts       |  64 ++++++++++
 .../vinculos-asiscoup-http.spec.ts            | 106 ++++++++++++++++
 .../infrastructure/vinculos-asiscoup-http.ts  | 114 ++++++++++++++++++
 12 files changed, 669 insertions(+), 5 deletions(-)
 create mode 100644 GameUp-backend/src/modules/estudiantes/application/sincronizacion-vinculos.service.spec.ts
 create mode 100644 GameUp-backend/src/modules/estudiantes/application/sincronizacion-vinculos.service.ts
 create mode 100644 GameUp-backend/src/modules/estudiantes/domain/vinculos-externos.ts
 create mode 100644 GameUp-backend/src/modules/estudiantes/infrastructure/prisma-copia-vinculos.repository.ts
 create mode 100644 GameUp-backend/src/modules/estudiantes/infrastructure/vinculos-asiscoup-http.spec.ts
 create mode 100644 GameUp-backend/src/modules/estudiantes/infrastructure/vinculos-asiscoup-http.ts

diff --git a/GameUp-backend/src/modules/auth/application/auth.service.spec.ts b/GameUp-backend/src/modules/auth/application/auth.service.spec.ts
index 6318f46..02bb850 100644
--- a/GameUp-backend/src/modules/auth/application/auth.service.spec.ts
+++ b/GameUp-backend/src/modules/auth/application/auth.service.spec.ts
@@ -117,4 +117,69 @@ describe('AuthService', () => {
     servicio.cerrarSesion(TOKEN_TALLERISTA);
     expect(verificador.olvidados).toEqual([TOKEN_TALLERISTA]);
   });
+
+  describe('acudiente con ASISCO UP conectado', () => {
+    const TOKEN_ACUDIENTE = jwt(1_800_000_000) + 'a';
+    let llamadas: Array<[{ id: bigint; idUsuarioAuth: bigint }, string]>;
+    let fallar: boolean;
+    const sincronizador = {
+      sincronizarAcudiente(
+        acudiente: { id: bigint; idUsuarioAuth: bigint },
+        token: string,
+      ): Promise<void> {
+        llamadas.push([acudiente, token]);
+        return fallar
+          ? Promise.reject(new Error('dormido'))
+          : Promise.resolve();
+      },
+    };
+    const crear = () => {
+      const verif = new VerificadorTokenFalso({
+        [TOKEN_TALLERISTA]: identidad(200, ['TALLERISTA']),
+        [TOKEN_ACUDIENTE]: identidad(300, ['ACUDIENTE']),
+      });
+      const resolutor = new ResolutorUsuarioService(usuarios);
+      const s = new AuthService(
+        new AutenticadorFalso({
+          'ana@ejemplo.com': { contrasena: 'clave', token: TOKEN_TALLERISTA },
+          'acu@ejemplo.com': { contrasena: 'clave', token: TOKEN_ACUDIENTE },
+        }),
+        verif,
+        verif,
+        resolutor,
+        usuarios,
+        usuarios,
+        new RelojFijo(AHORA),
+        sincronizador,
+      );
+      vi.spyOn(s['logger'], 'warn').mockImplementation(() => undefined);
+      return s;
+    };
+    beforeEach(() => {
+      llamadas = [];
+      fallar = false;
+    });
+
+    it('al entrar refresca sus vínculos con su propio token', async () => {
+      await crear().iniciarSesion('acu@ejemplo.com', 'clave');
+      expect(llamadas).toEqual([
+        [
+          expect.objectContaining({ id: 3n, idUsuarioAuth: 300n }),
+          TOKEN_ACUDIENTE,
+        ],
+      ]);
+    });
+
+    it('si ASISCO UP falla, igual entra', async () => {
+      fallar = true;
+      await expect(
+        crear().iniciarSesion('acu@ejemplo.com', 'clave'),
+      ).resolves.toMatchObject({ usuario: { id: 3n } });
+    });
+
+    it('otros roles no consultan ASISCO UP', async () => {
+      await crear().iniciarSesion('ana@ejemplo.com', 'clave');
+      expect(llamadas).toEqual([]);
+    });
+  });
 });
diff --git a/GameUp-backend/src/modules/auth/application/auth.service.ts b/GameUp-backend/src/modules/auth/application/auth.service.ts
index 329e29c..f16f747 100644
--- a/GameUp-backend/src/modules/auth/application/auth.service.ts
+++ b/GameUp-backend/src/modules/auth/application/auth.service.ts
@@ -1,4 +1,4 @@
-import { Inject, Injectable, Logger } from '@nestjs/common';
+import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
 import {
   RESOLUTOR_USUARIO,
   type ResolutorUsuario,
@@ -16,6 +16,10 @@ import {
   NoAutenticadoError,
 } from '../../../common/errors/dominio.errors.js';
 import { RELOJ, type Reloj } from '../../../common/reloj/reloj.js';
+import {
+  SINCRONIZADOR_VINCULOS,
+  type SincronizadorVinculos,
+} from '../../estudiantes/domain/vinculos-externos.js';
 import { copiaDesdeIdentidad } from '../../usuarios/domain/copia-externa.js';
 import type { Usuario } from '../../usuarios/domain/usuario.entity.js';
 import {
@@ -42,6 +46,8 @@ export interface SesionIniciada {
  *  - iniciarSesion: credenciales → API de seguridad → token → perfil →
  *    cuenta de GameUP (403 si no hay o el rol no coincide) → sincroniza la
  *    copia mínima (nombres, apellidos, correo, ultimo_acceso, sincronizado_en).
+ *    Si es ACUDIENTE y ASISCO UP está conectado, refresca también la copia
+ *    de sus vínculos con estudiantes (sin bloquear el login si falla).
  *  - sesionActual: la cuenta de quien hace la petición.
  *  - cerrarSesion: olvida el token de la caché.
  */
@@ -60,6 +66,9 @@ export class AuthService {
     @Inject(USUARIO_ESCRITURA_REPOSITORY)
     private readonly escritura: UsuarioEscrituraRepository,
     @Inject(RELOJ) private readonly reloj: Reloj,
+    @Optional()
+    @Inject(SINCRONIZADOR_VINCULOS)
+    private readonly vinculos: SincronizadorVinculos | null = null,
   ) {}
 
   async iniciarSesion(
@@ -84,6 +93,17 @@ export class AuthService {
       );
     }
 
+    if (autenticado.rol === 'ACUDIENTE' && this.vinculos) {
+      try {
+        await this.vinculos.sincronizarAcudiente(autenticado, token);
+      } catch {
+        // Se conserva la copia anterior: ASISCO UP puede estar dormido.
+        this.logger.warn(
+          `No se pudieron actualizar los vínculos desde ASISCO UP (usuario ${autenticado.id})`,
+        );
+      }
+    }
+
     const usuario = await this.lectura.buscarPorId(autenticado.id);
     if (!usuario) {
       throw new AccesoDenegadoError(
diff --git a/GameUp-backend/src/modules/auth/auth.module.ts b/GameUp-backend/src/modules/auth/auth.module.ts
index c86d1af..92767b4 100644
--- a/GameUp-backend/src/modules/auth/auth.module.ts
+++ b/GameUp-backend/src/modules/auth/auth.module.ts
@@ -8,6 +8,7 @@ import {
   INVALIDADOR_TOKEN,
   VERIFICADOR_TOKEN,
 } from '../../common/auth/verificador-token.js';
+import { EstudiantesModule } from '../estudiantes/estudiantes.module.js';
 import { UsuariosModule } from '../usuarios/usuarios.module.js';
 import { AuthService } from './application/auth.service.js';
 import { ResolutorUsuarioService } from './application/resolutor-usuario.service.js';
@@ -24,7 +25,7 @@ import { AuthController } from './presentation/auth.controller.js';
  * y las rutas /auth/login (pública), /auth/me y /auth/logout.
  */
 @Module({
-  imports: [UsuariosModule],
+  imports: [UsuariosModule, EstudiantesModule],
   controllers: [AuthController],
   providers: [
     AuthService,
diff --git a/GameUp-backend/src/modules/estudiantes/application/sincronizacion-vinculos.service.spec.ts b/GameUp-backend/src/modules/estudiantes/application/sincronizacion-vinculos.service.spec.ts
new file mode 100644
index 0000000..54518b0
--- /dev/null
+++ b/GameUp-backend/src/modules/estudiantes/application/sincronizacion-vinculos.service.spec.ts
@@ -0,0 +1,87 @@
+import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
+import type {
+  ConsultaVinculos,
+  CopiaVinculosRepository,
+  VinculoLocal,
+  VinculosDeAcudiente,
+} from '../domain/vinculos-externos.js';
+import { SincronizacionVinculosService } from './sincronizacion-vinculos.service.js';
+
+class CopiaFalsa implements CopiaVinculosRepository {
+  reemplazos: Array<{ acudienteId: bigint; vinculos: VinculoLocal[] }> = [];
+  /** idEstudianteExterno → estudiante de GameUP */
+  constructor(private readonly locales: Map<bigint, bigint>) {}
+  estudiantesPorExterno(externos: bigint[]) {
+    return Promise.resolve(
+      new Map(
+        externos
+          .filter((e) => this.locales.has(e))
+          .map((e) => [e, this.locales.get(e)!] as const),
+      ),
+    );
+  }
+  reemplazarDeAcudiente(acudienteId: bigint, vinculos: VinculoLocal[]) {
+    this.reemplazos.push({ acudienteId, vinculos });
+    return Promise.resolve();
+  }
+}
+
+describe('SincronizacionVinculosService', () => {
+  const ACUDIENTE = { id: 4n, idUsuarioAuth: 15n };
+  let copia: CopiaFalsa;
+  let respuesta: VinculosDeAcudiente | Error;
+  const consulta: ConsultaVinculos = {
+    deAcudiente: () =>
+      respuesta instanceof Error
+        ? Promise.reject(respuesta)
+        : Promise.resolve(respuesta),
+  };
+  const crear = () => {
+    const s = new SincronizacionVinculosService(consulta, copia);
+    vi.spyOn(s['logger'], 'warn').mockImplementation(() => undefined);
+    return s;
+  };
+
+  beforeEach(() => {
+    copia = new CopiaFalsa(new Map([[12n, 5n]]));
+    respuesta = {
+      idUsuarioAuth: 15n,
+      estudiantes: [
+        { idEstudianteExterno: 12n, parentesco: 'Madre', esPrincipal: true },
+        { idEstudianteExterno: 99n, parentesco: 'Tía', esPrincipal: false },
+      ],
+    };
+  });
+
+  it('guarda los vínculos de estudiantes habilitados en GameUP e ignora los demás', async () => {
+    await crear().sincronizarAcudiente(ACUDIENTE, 'tok');
+    expect(copia.reemplazos).toEqual([
+      {
+        acudienteId: 4n,
+        vinculos: [
+          { estudianteId: 5n, parentesco: 'Madre', esPrincipal: true },
+        ],
+      },
+    ]);
+  });
+
+  it('lista vacía en ASISCO UP → deja al acudiente sin vínculos', async () => {
+    respuesta = { idUsuarioAuth: 15n, estudiantes: [] };
+    await crear().sincronizarAcudiente(ACUDIENTE, 'tok');
+    expect(copia.reemplazos).toEqual([{ acudienteId: 4n, vinculos: [] }]);
+  });
+
+  it('ASISCO UP responde por otro usuario → no toca nada', async () => {
+    respuesta = { idUsuarioAuth: 16n, estudiantes: [] };
+    await crear().sincronizarAcudiente(ACUDIENTE, 'tok');
+    expect(copia.reemplazos).toEqual([]);
+  });
+
+  it('ASISCO UP no responde → lanza y no toca nada', async () => {
+    respuesta = new ServicioExternoNoDisponibleError('x');
+    await expect(
+      crear().sincronizarAcudiente(ACUDIENTE, 'tok'),
+    ).rejects.toBeInstanceOf(ServicioExternoNoDisponibleError);
+    expect(copia.reemplazos).toEqual([]);
+  });
+});
diff --git a/GameUp-backend/src/modules/estudiantes/application/sincronizacion-vinculos.service.ts b/GameUp-backend/src/modules/estudiantes/application/sincronizacion-vinculos.service.ts
new file mode 100644
index 0000000..14a687c
--- /dev/null
+++ b/GameUp-backend/src/modules/estudiantes/application/sincronizacion-vinculos.service.ts
@@ -0,0 +1,55 @@
+import { Logger } from '@nestjs/common';
+import type {
+  ConsultaVinculos,
+  CopiaVinculosRepository,
+  SincronizadorVinculos,
+  VinculoLocal,
+} from '../domain/vinculos-externos.js';
+
+/**
+ * Refresca la copia local de vínculos de UN acudiente con lo que dice
+ * ASISCO UP. Reglas:
+ *   - Solo si ASISCO UP reconoce al mismo usuario de seguridad que inició
+ *     sesión (idUsuarioAuth); si no, no toca nada.
+ *   - Los estudiantes de ASISCO UP que no están habilitados en GameUP se
+ *     ignoran.
+ *   - Si ASISCO UP no responde, se lanza el error y la copia queda como
+ *     estaba (quien llama decide; el login no se bloquea).
+ */
+/** Se construye en EstudiantesModule solo si hay ASISCO_API_URL. */
+export class SincronizacionVinculosService implements SincronizadorVinculos {
+  private readonly logger = new Logger(SincronizacionVinculosService.name);
+
+  constructor(
+    private readonly consulta: ConsultaVinculos,
+    private readonly copia: CopiaVinculosRepository,
+  ) {}
+
+  async sincronizarAcudiente(
+    acudiente: { id: bigint; idUsuarioAuth: bigint },
+    token: string,
+  ): Promise<void> {
+    const externo = await this.consulta.deAcudiente(token);
+    if (externo.idUsuarioAuth !== acudiente.idUsuarioAuth) {
+      this.logger.warn(
+        `ASISCO UP devolvió otro acudiente; no se cambian los vínculos (usuario ${acudiente.id})`,
+      );
+      return;
+    }
+    const locales = await this.copia.estudiantesPorExterno(
+      externo.estudiantes.map((e) => e.idEstudianteExterno),
+    );
+    const vinculos: VinculoLocal[] = [];
+    for (const e of externo.estudiantes) {
+      const estudianteId = locales.get(e.idEstudianteExterno);
+      if (estudianteId === undefined) continue;
+      if (vinculos.some((v) => v.estudianteId === estudianteId)) continue;
+      vinculos.push({
+        estudianteId,
+        parentesco: e.parentesco,
+        esPrincipal: e.esPrincipal,
+      });
+    }
+    await this.copia.reemplazarDeAcudiente(acudiente.id, vinculos);
+  }
+}
diff --git a/GameUp-backend/src/modules/estudiantes/application/vinculos.service.spec.ts b/GameUp-backend/src/modules/estudiantes/application/vinculos.service.spec.ts
index de3b24e..dc11655 100644
--- a/GameUp-backend/src/modules/estudiantes/application/vinculos.service.spec.ts
+++ b/GameUp-backend/src/modules/estudiantes/application/vinculos.service.spec.ts
@@ -161,4 +161,36 @@ describe('VinculosService', () => {
       );
     });
   });
+
+  describe('con ASISCO UP conectado', () => {
+    beforeEach(() => {
+      servicio = new VinculosService(
+        escenario.estudiantes.talleristasRepo,
+        escenario.estudiantes.acudientesRepo,
+        escenario.usuarios,
+        new RelojFijo(AHORA),
+        new AccesoEstudianteService(escenario.estudiantes),
+        true,
+      );
+    });
+
+    it('vincular, cambiar o quitar acudientes → 409 (se hace en ASISCO UP)', async () => {
+      await expect(
+        servicio.vincularAcudiente(12n, 4n, 'Madre', false),
+      ).rejects.toBeInstanceOf(ConflictoError);
+      await expect(
+        servicio.actualizarAcudiente(10n, 4n, {
+          parentesco: 'Tía',
+          esPrincipal: null,
+        }),
+      ).rejects.toBeInstanceOf(ConflictoError);
+      await expect(
+        servicio.desvincularAcudiente(10n, 4n),
+      ).rejects.toBeInstanceOf(ConflictoError);
+    });
+
+    it('listar sigue funcionando (lee la copia)', async () => {
+      await expect(servicio.listarAcudientes(10n)).resolves.not.toHaveLength(0);
+    });
+  });
 });
diff --git a/GameUp-backend/src/modules/estudiantes/application/vinculos.service.ts b/GameUp-backend/src/modules/estudiantes/application/vinculos.service.ts
index 845902d..b3c81b6 100644
--- a/GameUp-backend/src/modules/estudiantes/application/vinculos.service.ts
+++ b/GameUp-backend/src/modules/estudiantes/application/vinculos.service.ts
@@ -1,4 +1,4 @@
-import { Inject, Injectable } from '@nestjs/common';
+import { Inject, Injectable, Optional } from '@nestjs/common';
 import {
   ConflictoError,
   RecursoNoEncontradoError,
@@ -20,6 +20,7 @@ import {
   type AcudienteEstudianteRepository,
   type TalleristaEstudianteRepository,
 } from '../domain/estudiante.repository.js';
+import { VINCULOS_EN_ASISCO } from '../domain/vinculos-externos.js';
 import { AccesoEstudianteService } from './acceso-estudiante.service.js';
 
 const NOMBRE_ROL: Record<'TALLERISTA' | 'ACUDIENTE', string> = {
@@ -43,6 +44,10 @@ export class VinculosService {
     private readonly usuarios: UsuarioLecturaRepository,
     @Inject(RELOJ) private readonly reloj: Reloj,
     private readonly acceso: AccesoEstudianteService,
+    /** true con ASISCO_API_URL: los vínculos de acudientes son de ASISCO UP. */
+    @Optional()
+    @Inject(VINCULOS_EN_ASISCO)
+    private readonly vinculosEnAsisco: boolean = false,
   ) {}
 
   // ─── Talleristas ──────────────────────────────────────────────────────────
@@ -95,6 +100,7 @@ export class VinculosService {
     parentesco: string,
     esPrincipal: boolean,
   ): Promise<VinculoAcudiente> {
+    this.exigirVinculosLocales();
     await this.acceso.existente(estudianteId);
     await this.exigirCuenta(acudienteId, 'ACUDIENTE');
     const texto = limpiarParentesco(parentesco);
@@ -117,6 +123,7 @@ export class VinculosService {
     acudienteId: bigint,
     cambios: { parentesco: string | null; esPrincipal: boolean | null },
   ): Promise<VinculoAcudiente> {
+    this.exigirVinculosLocales();
     await this.acceso.existente(estudianteId);
     if (!(await this.acudientes.buscar(acudienteId, estudianteId))) {
       throw new RecursoNoEncontradoError(
@@ -141,6 +148,7 @@ export class VinculosService {
     estudianteId: bigint,
     acudienteId: bigint,
   ): Promise<void> {
+    this.exigirVinculosLocales();
     await this.acceso.existente(estudianteId);
     if (!(await this.acudientes.eliminar(acudienteId, estudianteId))) {
       throw new RecursoNoEncontradoError(
@@ -151,6 +159,15 @@ export class VinculosService {
 
   // ─── Apoyo ────────────────────────────────────────────────────────────────
 
+  /** Con ASISCO UP conectado, la copia solo se cambia desde allá (409). */
+  private exigirVinculosLocales(): void {
+    if (this.vinculosEnAsisco) {
+      throw new ConflictoError(
+        'Los acudientes se vinculan en ASISCO UP. GameUP los actualiza cuando el acudiente inicia sesión.',
+      );
+    }
+  }
+
   /** La cuenta existe, tiene ese rol y está activa; si no, 422. */
   private async exigirCuenta(
     id: bigint,
diff --git a/GameUp-backend/src/modules/estudiantes/domain/vinculos-externos.ts b/GameUp-backend/src/modules/estudiantes/domain/vinculos-externos.ts
new file mode 100644
index 0000000..f1d9717
--- /dev/null
+++ b/GameUp-backend/src/modules/estudiantes/domain/vinculos-externos.ts
@@ -0,0 +1,57 @@
+/**
+ * Vínculos acudiente ⇄ estudiante de ASISCO UP (fuente oficial).
+ *
+ * GameUP conserva la tabla acudiente_estudiante como COPIA: la usan los
+ * permisos del acudiente, los avisos (fn_notificar_acudientes) y la regla de
+ * práctica en casa. Cuando ASISCO_API_URL está configurada, esa copia se
+ * refresca desde ASISCO UP cada vez que el acudiente inicia sesión, y la
+ * directora ya no la edita a mano.
+ */
+export interface VinculoExterno {
+  /** idEstudiante en ASISCO UP (= estudiante.id_estudiante_externo). */
+  idEstudianteExterno: bigint;
+  parentesco: string;
+  esPrincipal: boolean;
+}
+
+export interface VinculosDeAcudiente {
+  /** id_usuario de la API de seguridad que ASISCO UP asoció al acudiente. */
+  idUsuarioAuth: bigint;
+  estudiantes: VinculoExterno[];
+}
+
+/** Puerto de lectura: GET /api/acudientes/me/estudiantes con el token del acudiente. */
+export interface ConsultaVinculos {
+  /** Lanza ServicioExternoNoDisponibleError si no se puede consultar. */
+  deAcudiente(token: string): Promise<VinculosDeAcudiente>;
+}
+
+/** Vínculo ya traducido a ids de GameUP, listo para guardar en la copia. */
+export interface VinculoLocal {
+  estudianteId: bigint;
+  parentesco: string;
+  esPrincipal: boolean;
+}
+
+export interface CopiaVinculosRepository {
+  /** Mapa idEstudianteExterno → estudiante.usuario_id (solo los que existen en GameUP). */
+  estudiantesPorExterno(externos: bigint[]): Promise<Map<bigint, bigint>>;
+  /** Deja la copia del acudiente exactamente igual a `vinculos` (en una transacción). */
+  reemplazarDeAcudiente(
+    acudienteId: bigint,
+    vinculos: VinculoLocal[],
+  ): Promise<void>;
+}
+
+/** Lo que usa el login para refrescar la copia (no depende de HTTP). */
+export interface SincronizadorVinculos {
+  sincronizarAcudiente(
+    acudiente: { id: bigint; idUsuarioAuth: bigint },
+    token: string,
+  ): Promise<void>;
+}
+
+export const COPIA_VINCULOS_REPOSITORY = Symbol('COPIA_VINCULOS_REPOSITORY');
+export const SINCRONIZADOR_VINCULOS = Symbol('SINCRONIZADOR_VINCULOS');
+/** true cuando ASISCO_API_URL está configurada: los vínculos son de ASISCO UP. */
+export const VINCULOS_EN_ASISCO = Symbol('VINCULOS_EN_ASISCO');
diff --git a/GameUp-backend/src/modules/estudiantes/estudiantes.module.ts b/GameUp-backend/src/modules/estudiantes/estudiantes.module.ts
index 4f90b00..51c182f 100644
--- a/GameUp-backend/src/modules/estudiantes/estudiantes.module.ts
+++ b/GameUp-backend/src/modules/estudiantes/estudiantes.module.ts
@@ -1,7 +1,10 @@
 import { Module } from '@nestjs/common';
+import { ConfigService } from '@nestjs/config';
+import type { EnvironmentVariables } from '../../config/env.validation.js';
 import { UsuariosModule } from '../usuarios/usuarios.module.js';
 import { AccesoEstudianteService } from './application/acceso-estudiante.service.js';
 import { EstudianteService } from './application/estudiante.service.js';
+import { SincronizacionVinculosService } from './application/sincronizacion-vinculos.service.js';
 import { VinculosService } from './application/vinculos.service.js';
 import {
   ACUDIENTE_ESTUDIANTE_REPOSITORY,
@@ -9,17 +12,28 @@ import {
   NIVEL_ESTUDIANTE_REPOSITORY,
   TALLERISTA_ESTUDIANTE_REPOSITORY,
 } from './domain/estudiante.repository.js';
+import {
+  COPIA_VINCULOS_REPOSITORY,
+  SINCRONIZADOR_VINCULOS,
+  VINCULOS_EN_ASISCO,
+  type CopiaVinculosRepository,
+  type SincronizadorVinculos,
+} from './domain/vinculos-externos.js';
+import { PrismaCopiaVinculosRepository } from './infrastructure/prisma-copia-vinculos.repository.js';
 import {
   PrismaAcudienteEstudianteRepository,
   PrismaEstudianteRepository,
   PrismaTalleristaEstudianteRepository,
 } from './infrastructure/prisma-estudiante.repository.js';
+import { ConsultaVinculosAsiscoUpHttp } from './infrastructure/vinculos-asiscoup-http.js';
 import { EstudianteController } from './presentation/estudiante.controller.js';
 import { VinculosController } from './presentation/vinculos.controller.js';
 
 /**
  * Estudiantes y sus vínculos. Exporta AccesoEstudianteService (regla de
- * relación) y el puerto de lectura para los módulos de las fases siguientes.
+ * relación), el puerto de lectura para los módulos de las fases siguientes y
+ * el sincronizador de vínculos con ASISCO UP (lo usa el login del acudiente;
+ * es null si falta ASISCO_API_URL).
  */
 @Module({
   imports: [UsuariosModule],
@@ -45,7 +59,39 @@ import { VinculosController } from './presentation/vinculos.controller.js';
       provide: ACUDIENTE_ESTUDIANTE_REPOSITORY,
       useClass: PrismaAcudienteEstudianteRepository,
     },
+    {
+      provide: COPIA_VINCULOS_REPOSITORY,
+      useClass: PrismaCopiaVinculosRepository,
+    },
+    {
+      provide: VINCULOS_EN_ASISCO,
+      inject: [ConfigService],
+      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
+        Boolean(config.get('ASISCO_API_URL', { infer: true })),
+    },
+    {
+      provide: SINCRONIZADOR_VINCULOS,
+      inject: [ConfigService, COPIA_VINCULOS_REPOSITORY],
+      useFactory: (
+        config: ConfigService<EnvironmentVariables, true>,
+        copia: CopiaVinculosRepository,
+      ): SincronizadorVinculos | null => {
+        const url = config.get('ASISCO_API_URL', { infer: true });
+        if (!url) return null;
+        return new SincronizacionVinculosService(
+          new ConsultaVinculosAsiscoUpHttp(
+            url,
+            config.get('ASISCO_API_TIMEOUT_MS', { infer: true }),
+          ),
+          copia,
+        );
+      },
+    },
+  ],
+  exports: [
+    AccesoEstudianteService,
+    ESTUDIANTE_LECTURA_REPOSITORY,
+    SINCRONIZADOR_VINCULOS,
   ],
-  exports: [AccesoEstudianteService, ESTUDIANTE_LECTURA_REPOSITORY],
 })
 export class EstudiantesModule {}
diff --git a/GameUp-backend/src/modules/estudiantes/infrastructure/prisma-copia-vinculos.repository.ts b/GameUp-backend/src/modules/estudiantes/infrastructure/prisma-copia-vinculos.repository.ts
new file mode 100644
index 0000000..74084ff
--- /dev/null
+++ b/GameUp-backend/src/modules/estudiantes/infrastructure/prisma-copia-vinculos.repository.ts
@@ -0,0 +1,64 @@
+import { Injectable } from '@nestjs/common';
+import { PrismaService } from '../../../prisma/prisma.service.js';
+import type {
+  CopiaVinculosRepository,
+  VinculoLocal,
+} from '../domain/vinculos-externos.js';
+
+@Injectable()
+export class PrismaCopiaVinculosRepository implements CopiaVinculosRepository {
+  constructor(private readonly prisma: PrismaService) {}
+
+  async estudiantesPorExterno(
+    externos: bigint[],
+  ): Promise<Map<bigint, bigint>> {
+    if (externos.length === 0) return new Map();
+    const filas = await this.prisma.estudiante.findMany({
+      where: { id_estudiante_externo: { in: externos } },
+      select: { usuario_id: true, id_estudiante_externo: true },
+    });
+    return new Map(filas.map((f) => [f.id_estudiante_externo, f.usuario_id]));
+  }
+
+  async reemplazarDeAcudiente(
+    acudienteId: bigint,
+    vinculos: VinculoLocal[],
+  ): Promise<void> {
+    await this.prisma.$transaction(async (tx) => {
+      await tx.acudiente_estudiante.deleteMany({
+        where: {
+          acudiente_id: acudienteId,
+          estudiante_id: { notIn: vinculos.map((v) => v.estudianteId) },
+        },
+      });
+      for (const v of vinculos) {
+        if (v.esPrincipal) {
+          // uq_acudiente_principal: un solo principal por estudiante.
+          await tx.acudiente_estudiante.updateMany({
+            where: {
+              estudiante_id: v.estudianteId,
+              es_principal: true,
+              NOT: { acudiente_id: acudienteId },
+            },
+            data: { es_principal: false },
+          });
+        }
+        await tx.acudiente_estudiante.upsert({
+          where: {
+            acudiente_id_estudiante_id: {
+              acudiente_id: acudienteId,
+              estudiante_id: v.estudianteId,
+            },
+          },
+          create: {
+            acudiente_id: acudienteId,
+            estudiante_id: v.estudianteId,
+            parentesco: v.parentesco,
+            es_principal: v.esPrincipal,
+          },
+          update: { parentesco: v.parentesco, es_principal: v.esPrincipal },
+        });
+      }
+    });
+  }
+}
diff --git a/GameUp-backend/src/modules/estudiantes/infrastructure/vinculos-asiscoup-http.spec.ts b/GameUp-backend/src/modules/estudiantes/infrastructure/vinculos-asiscoup-http.spec.ts
new file mode 100644
index 0000000..e397bd5
--- /dev/null
+++ b/GameUp-backend/src/modules/estudiantes/infrastructure/vinculos-asiscoup-http.spec.ts
@@ -0,0 +1,106 @@
+import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
+import { ConsultaVinculosAsiscoUpHttp } from './vinculos-asiscoup-http.js';
+
+const json = (cuerpo: unknown, status = 200) =>
+  new Response(JSON.stringify(cuerpo), {
+    status,
+    headers: { 'Content-Type': 'application/json' },
+  });
+
+/** Forma real de ASISCO UP (2026-11-08), con datos de prueba. */
+const respuesta = (estudiantes: unknown[] = [estudiante()]) => ({
+  acudiente: { idAcudiente: 7, idUsuarioAuth: '15', id_usuario: 15 },
+  estudiantes,
+});
+const estudiante = (extra: Record<string, unknown> = {}) => ({
+  idEstudiante: 12,
+  idUsuarioAuth: '13',
+  nombre: 'Estudiante GameUP',
+  esPrincipal: true,
+  parentesco: { idParentesco: 1, nombre: 'Madre' },
+  ...extra,
+});
+
+describe('ConsultaVinculosAsiscoUpHttp', () => {
+  let fetchFalso: ReturnType<typeof vi.fn>;
+  const crear = () => {
+    const c = new ConsultaVinculosAsiscoUpHttp('https://asiscoup.test/', 5000);
+    vi.spyOn(c['logger'], 'warn').mockImplementation(() => undefined);
+    return c;
+  };
+
+  beforeEach(() => {
+    fetchFalso = vi.fn(async () => json(respuesta()));
+    vi.stubGlobal('fetch', fetchFalso);
+  });
+  afterEach(() => vi.unstubAllGlobals());
+
+  it('reenvía el token del acudiente a /acudientes/me/estudiantes', async () => {
+    await crear().deAcudiente('tok');
+    const [url, init] = fetchFalso.mock.calls[0] as [string, RequestInit];
+    expect(url).toBe('https://asiscoup.test/api/acudientes/me/estudiantes');
+    expect((init.headers as Record<string, string>).Authorization).toBe(
+      'Bearer tok',
+    );
+  });
+
+  it('devuelve solo ids, parentesco y principal', async () => {
+    await expect(crear().deAcudiente('tok')).resolves.toEqual({
+      idUsuarioAuth: 15n,
+      estudiantes: [
+        { idEstudianteExterno: 12n, parentesco: 'Madre', esPrincipal: true },
+      ],
+    });
+  });
+
+  it('sin parentesco ni principal → "Acudiente", no principal', async () => {
+    fetchFalso.mockResolvedValue(
+      json(
+        respuesta([estudiante({ parentesco: null, esPrincipal: undefined })]),
+      ),
+    );
+    const r = await crear().deAcudiente('tok');
+    expect(r.estudiantes[0]).toMatchObject({
+      parentesco: 'Acudiente',
+      esPrincipal: false,
+    });
+  });
+
+  it('lista vacía es válida', async () => {
+    fetchFalso.mockResolvedValue(json(respuesta([])));
+    await expect(crear().deAcudiente('tok')).resolves.toEqual({
+      idUsuarioAuth: 15n,
+      estudiantes: [],
+    });
+  });
+
+  it.each([
+    ['401', () => json({ error: 'x' }, 401)],
+    ['500', () => json({ error: 'x' }, 500)],
+    ['sin acudiente', () => json({ estudiantes: [] })],
+    [
+      'acudiente sin idUsuarioAuth',
+      () =>
+        json({
+          acudiente: { idAcudiente: 7, idUsuarioAuth: null },
+          estudiantes: [],
+        }),
+    ],
+    [
+      'estudiante sin id',
+      () => json(respuesta([estudiante({ idEstudiante: null })])),
+    ],
+  ])('%s → servicio no disponible', async (_n, resp) => {
+    fetchFalso.mockResolvedValue(resp());
+    await expect(crear().deAcudiente('tok')).rejects.toBeInstanceOf(
+      ServicioExternoNoDisponibleError,
+    );
+  });
+
+  it('sin respuesta → servicio no disponible', async () => {
+    fetchFalso.mockRejectedValue(new Error('timeout'));
+    await expect(crear().deAcudiente('tok')).rejects.toBeInstanceOf(
+      ServicioExternoNoDisponibleError,
+    );
+  });
+});
diff --git a/GameUp-backend/src/modules/estudiantes/infrastructure/vinculos-asiscoup-http.ts b/GameUp-backend/src/modules/estudiantes/infrastructure/vinculos-asiscoup-http.ts
new file mode 100644
index 0000000..af54f13
--- /dev/null
+++ b/GameUp-backend/src/modules/estudiantes/infrastructure/vinculos-asiscoup-http.ts
@@ -0,0 +1,114 @@
+import { Logger } from '@nestjs/common';
+import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
+import type {
+  ConsultaVinculos,
+  VinculoExterno,
+  VinculosDeAcudiente,
+} from '../domain/vinculos-externos.js';
+
+/**
+ * Lee los estudiantes vinculados al acudiente que inició sesión:
+ *   GET <base>/api/acudientes/me/estudiantes   (Authorization: Bearer <JWT de seguridad>)
+ *
+ * Respuesta real observada el 2026-11-08 (datos de prueba):
+ *   { acudiente: { idAcudiente, idUsuarioAuth: "15", id_usuario: 15, ... },
+ *     estudiantes: [ { idEstudiante: 12, esPrincipal: true,
+ *                      parentesco: { idParentesco: 1, nombre: "Madre" }, ... } ] }
+ *
+ * Solo toma ids, parentesco y principal: el resto (nombre, documento,
+ * diagnóstico, fecha de nacimiento) se ignora y nunca se registra en logs.
+ */
+export class ConsultaVinculosAsiscoUpHttp implements ConsultaVinculos {
+  private readonly logger = new Logger(ConsultaVinculosAsiscoUpHttp.name);
+  private readonly baseUrl: string;
+
+  constructor(
+    baseUrl: string,
+    private readonly timeoutMs: number,
+  ) {
+    this.baseUrl = baseUrl.replace(/\/+$/, '');
+  }
+
+  async deAcudiente(token: string): Promise<VinculosDeAcudiente> {
+    let respuesta: Response;
+    try {
+      respuesta = await fetch(`${this.baseUrl}/api/acudientes/me/estudiantes`, {
+        headers: {
+          Accept: 'application/json',
+          Authorization: `Bearer ${token}`,
+        },
+        signal: AbortSignal.timeout(this.timeoutMs),
+      });
+    } catch {
+      this.logger.warn('ASISCO UP no respondió a /acudientes/me/estudiantes');
+      throw new ServicioExternoNoDisponibleError(
+        'No se pueden consultar los vínculos: ASISCO UP no responde.',
+      );
+    }
+    if (!respuesta.ok) {
+      this.logger.warn(
+        `ASISCO UP respondió ${respuesta.status} a /acudientes/me/estudiantes`,
+      );
+      throw new ServicioExternoNoDisponibleError(
+        'No se pueden consultar los vínculos en ASISCO UP.',
+      );
+    }
+    let cuerpo: unknown;
+    try {
+      cuerpo = await respuesta.json();
+    } catch {
+      cuerpo = null;
+    }
+    return interpretar(cuerpo, this.logger);
+  }
+}
+
+type Objeto = Record<string, unknown>;
+const esObjeto = (v: unknown): v is Objeto =>
+  typeof v === 'object' && v !== null && !Array.isArray(v);
+
+function id(valor: unknown): bigint | null {
+  if (typeof valor === 'number' && Number.isSafeInteger(valor) && valor > 0) {
+    return BigInt(valor);
+  }
+  if (typeof valor === 'string' && /^[1-9]\d{0,18}$/.test(valor)) {
+    return BigInt(valor);
+  }
+  return null;
+}
+
+function interpretar(cuerpo: unknown, logger: Logger): VinculosDeAcudiente {
+  if (!esObjeto(cuerpo) || !esObjeto(cuerpo.acudiente)) {
+    return formatoInesperado(logger);
+  }
+  const idUsuarioAuth =
+    id(cuerpo.acudiente.idUsuarioAuth) ?? id(cuerpo.acudiente.id_usuario);
+  if (idUsuarioAuth === null || !Array.isArray(cuerpo.estudiantes)) {
+    return formatoInesperado(logger);
+  }
+  const estudiantes: VinculoExterno[] = [];
+  for (const e of cuerpo.estudiantes) {
+    if (!esObjeto(e)) return formatoInesperado(logger);
+    const idEstudiante = id(e.idEstudiante);
+    if (idEstudiante === null) return formatoInesperado(logger);
+    const nombre = esObjeto(e.parentesco) ? e.parentesco.nombre : e.parentesco;
+    estudiantes.push({
+      idEstudianteExterno: idEstudiante,
+      parentesco:
+        typeof nombre === 'string' && nombre.trim() !== ''
+          ? nombre.trim()
+          : 'Acudiente',
+      esPrincipal: e.esPrincipal === true,
+    });
+  }
+  return { idUsuarioAuth, estudiantes };
+}
+
+function formatoInesperado(logger: Logger): never {
+  logger.warn(
+    'La respuesta de /acudientes/me/estudiantes tiene un formato inesperado',
+  );
+  throw new ServicioExternoNoDisponibleError(
+    'ASISCO UP respondió los vínculos con un formato inesperado.',
+  );
+}
-- 
2.43.0

~~~~
