> ⚠️ **`render.yaml` trae `ASISCO_API_URL` con valor** (`https://proyecto-asiscoup-g1-jvaz.onrender.com`). Al unir este PR, Render queda conectado a ASISCO UP: se empieza a leer el permiso de voz y la copia de vínculos de acudientes se refresca en cada login de acudiente. Para apagar la integración basta con quitar la variable en Render.

## Qué cambia

Reparto acordado con la profesora (no duplicar responsabilidades):
- **API de seguridad:** login, cuentas y JWT.
- **ASISCO UP:** datos personales de estudiantes y acudientes, vínculos familiares y consentimiento.
- **GameUP:** módulos, juegos, asignaciones, intentos, validaciones, progreso y práctica en casa.

Commits:
1. **Swagger (solo textos):** explica de quién es cada dato. La sección de estudiantes pasa a ser «Perfil de aprendizaje del estudiante».
2. **Adaptador HTTP de consentimiento** (primera versión).
3. **Permiso de voz:** se lee `GET /api/estudiantes/{id}/consentimiento` de ASISCO UP. Se graba solo si `tieneConsentimientoVigente`, `autorizaGrabacionVoz === true`, `requiereAceptarTerminos !== true` y el `idEstudiante` de la respuesta es el pedido. Ante cualquier duda no se graba (falla cerrado). Variables nuevas: `ASISCO_API_URL` y `ASISCO_API_TIMEOUT_MS`.
4. **Vínculos de acudientes:** cuando un ACUDIENTE inicia sesión, GameUP llama `GET /api/acudientes/me/estudiantes` con el token de ese acudiente y deja `acudiente_estudiante` igual a lo que dice ASISCO UP.
   - Si ASISCO UP responde por otro usuario o falla, la copia no se toca y el login sigue.
   - Con ASISCO UP conectado, `POST`/`PATCH`/`DELETE /estudiantes/{id}/acudientes` responden **409**.
   - La tabla **no se borra**: la usan los permisos del acudiente, `fn_notificar_acudientes` y `fn_practica_casa_vinculo`.
5. **Pruebas de los factories** de los módulos (sin URL → no disponible / `null`; con URL → adaptador HTTP), **409 en Swagger** y documentación (`docs/AVANCE.md` sección 7 y la tabla de variables del `README`).

**No hay migración ni cambios en la app** (`GameUp-frontend/` no se toca). ASISCO UP solo se consulta con `GET`.

## Interruptor `ASISCO_API_URL`

Todo lo de ASISCO UP se activa solo si existe `ASISCO_API_URL`. Sin ella, GameUP funciona exactamente como antes: no se graba voz y la directora vincula acudientes a mano.

## Datos de prueba que conectan los tres sistemas

| Quién | API de seguridad (`id_usuario`) | ASISCO UP | GameUP |
|---|---|---|---|
| Estudiante GameUP | 13 | `idEstudiante` 12 | `id_estudiante_externo` = 12 (ajustado en Supabase) |
| Acudiente GameUP | 15 | `idAcudiente` 7, vinculado al 12 como Madre (principal) | cuenta ACUDIENTE |
| Directora GameUp | 16 | — | cuenta DIRECTORA |

## Verificaciones

| Verificación | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ sin errores |
| `npm run lint` (oxlint) | ✅ sin errores |
| `npm run test` | ✅ 595 pruebas (49 archivos) |
| `npm run test:e2e` | ✅ 171 pruebas (12 archivos) |
| `npm run build` | ✅ |

Prueba manual local, contra ASISCO UP real y con `CONSENTIMIENTO_SIMULADO=false`:
- ✅ **Directora, `POST /estudiantes/{id}/acudientes`:** responde 409 («Los acudientes se vinculan en ASISCO UP…»).
- ✅ **Directora, `GET /estudiantes/{id}/acudientes`:** lista a «Acudiente GameUP» como Madre, principal.
- ✅ **Voz, `GET /estudiantes/{id}/consentimiento-voz`:** `concedido: true`, igual que el `autorizaGrabacionVoz: true` que ASISCO UP devuelve hoy.
- ⏭️ **Login del acudiente (sincronización de vínculos):** no se probó a mano porque no se usó la cuenta del acudiente. La lista de acudientes de arriba es la copia que ya existía. El flujo está cubierto por las pruebas unitarias.

## Pendientes (no incluidos en este PR)

1. **Render:** tras unir, revisar que `ASISCO_API_URL` esté puesta. Para apagar la integración basta con quitarla.
2. **Cambiar el `idEstudianteExterno` desde la app:** hoy solo se pone al crear el usuario. Falta un endpoint para la directora que lo cambie validando contra ASISCO UP.
3. **Validar el `idEstudianteExterno` al crear el estudiante** (`POST /usuarios`) con `GET /api/estudiantes/:id` de ASISCO UP, comprobando que el `idEstudiante` de la respuesta sea el mismo.
4. **Los vínculos se refrescan solo cuando el acudiente inicia sesión.** Si ASISCO UP quita un vínculo, GameUP lo nota en el siguiente login de ese acudiente.
5. **Pantalla para aceptar los términos en GameUP (decisión pendiente).** ASISCO UP ofrece el texto legal (`GET /api/catalogos/versiones-terminos`) y `POST /api/consentimientos`.
6. **Avisar a ASISCO UP:**
   - (a) `/api/estudiantes/:id` acepta tres tipos de id y puede confundir niños (ya hay choques reales: su estudiante 12 frente al usuario 12 de seguridad).
   - (b) «Mis estudiantes vinculados» con una cuenta ADMIN creó un acudiente: debería aceptar solo cuentas ACUDIENTE y no crear registros al consultar.
   - (c) Una cuenta de tallerista tiene rol ESTUDIANTE en seguridad y quedó como estudiante en ASISCO UP.
   - (d) Varios endpoints con datos de menores responden sin token, y `POST /api/consentimientos` debería exigir el token del acudiente.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
