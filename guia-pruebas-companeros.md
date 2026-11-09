# Guía de pruebas de GameUP para el equipo

**Fecha:** 8 de noviembre de 2026
**Qué vamos a probar:** la app GameUP en el celular (Expo Go) conectada al backend publicado en Render.

Gracias por ayudar a probar. No hace falta saber programar para la mayoría de las pruebas: basta con seguir los pasos, mirar si pasa lo que dice «Resultado esperado» y anotar lo que no pase así.

---

## 1. Antes de empezar

### 1.1 Tu cuenta de prueba

Alex te pasa por privado una cuenta de un rol. **No compartas la contraseña en el grupo ni la pongas en capturas.**

| Rol | Correo o usuario | Contraseña | ¿Quién la usa? |
|---|---|---|---|
| Directora | admin@gmail.com | gameup123 |
| Tallerista (docente) | juan@gmail.com | gameup123 |
| Acudiente | andres@gmail.com | gameup123 |
| Estudiante | sara@gmail.com | gameup123 |

Las cuentas son de prueba, con datos inventados. No uses nombres, fotos ni voces de niños reales.

### 1.2 Lo que necesitas

- Un celular con **Expo Go** actualizado (Play Store o App Store).
- Para abrir la app, una de estas dos opciones:
  - **Opción fácil:** alguien del equipo (alex u otro) abre la app desde su PC y tú escaneas el código QR. Tienes que estar en **la misma red Wi-Fi** que ese PC.
  - **Opción por tu cuenta (si sabes usar la terminal):** en tu PC, con el repositorio actualizado (`git pull` en `main`):
    ```bash
    cd GameUp-frontend
    npm install
    cp .env.example .env
    ```
    Abre `.env` y deja estas dos líneas así:
    ```bash
    EXPO_PUBLIC_API_URL=https://gameup-backend.onrender.com/api/v1
    EXPO_PUBLIC_DATA_SOURCE=api
    ```
    Luego `npx expo start --clear` y escanea el QR con Expo Go (Android) o con la cámara (iPhone).
    Si la red de la universidad no deja conectar el QR, prueba `npx expo start --tunnel`.

### 1.3 Despertar el servidor (importante)

El backend está en el plan gratuito de Render y **se duerme** cuando nadie lo usa. Antes de probar:

1. Abre en el navegador: https://gameup-backend.onrender.com/api/v1/health
2. La primera vez puede tardar **hasta un minuto**. Espera hasta que aparezca un texto con `"database": "conectada"` (o parecido).
3. Ya puedes abrir la app. Si la app tarda mucho o dice que no hay conexión, repite este paso.

### 1.4 Para el iPhone

- Si el celular está en **modo silencio**, no se escuchan las instrucciones habladas. Quítalo.

---

## 2. Qué se puede probar y qué no todavía

**Sí se puede probar (ya está en la versión principal, `main`):**

- Iniciar sesión con cuenta real y entrar a la pantalla de cada rol.
- Estudiante: Inicio, Juegos, Mi progreso, los seis juegos (Habla conmigo, Busca la boca, Emparejar, Clasificar, Secuenciar y Memoria), tareas asignadas y juego libre.
- Escalera de niveles por juego: cada uno de los cuatro juegos de «Pensar y recordar» tiene 5 niveles propios; el niño sube un nivel cuando la profe aprueba («Lo logró»).
- Tallerista: «Por escuchar» (revisar lo que hizo el estudiante, «Lo logró» o «Practicar más», nota para la familia) y cerrar sesión.
- Acudiente: «Practicar en casa» (sonido de la semana, nota de la profe, días practicados, «Lo practicamos hoy») y cerrar sesión.
- Directora: solo desde **Swagger** (la página web de la API), no desde la app.

**Todavía NO se puede probar (no está unido o no existe):**

- **Pantallas de la directora en la app.** En la app, la directora ve un aviso de «llega en una próxima versión». Están hechas en una rama aparte que aún no se ha unido.
- **Asignar actividades desde la app.** La tallerista todavía no tiene ese botón; las asignaciones se hacen por Swagger.
- **Que la app recuerde la sesión** al cerrarla del todo: hay que volver a iniciar sesión. Es normal por ahora.
- **Avisos o notificaciones dentro de la app.** El backend los tiene, la app aún no los muestra.
- **Nota de voz para la familia** (la tallerista grabando un audio): no existe aún en el backend.
- **Conexión con la API de ASISCO UP** (estudiantes, acudientes y consentimiento del otro grupo): decidimos no conectarla todavía. No la reportes como fallo.

Si encuentras algo de esta lista que no funciona, **no es un fallo nuevo**: ya lo sabemos.

---

## 3. Pruebas por rol

En cada prueba: haz los pasos, compara con «Resultado esperado» y marca ✅ si pasó o ❌ si no (y repórtalo, ver sección 5).

> **Orden recomendado para probar en equipo:** primero el **estudiante** juega, después la **tallerista** revisa, y al final el **acudiente** y la **directora** consultan. Así cada uno ve lo que hizo el anterior. Pónganse de acuerdo para que el estudiante, la tallerista y el acudiente sean del mismo «grupo» que alex armó (los tres vinculados al mismo niño de prueba).

### 3.1 Todos los roles: inicio de sesión

| # | Pasos | Resultado esperado | ✅/❌ |
|---|---|---|---|
| T1 | Abre la app y entra con tu cuenta. | Entras a la pantalla de tu rol: estudiante → Inicio; tallerista → «Por escuchar»; acudiente → «Practicar en casa»; directora → aviso «próxima versión». | |
| T2 | Cierra sesión (tallerista y acudiente tienen el botón). Intenta entrar con una contraseña equivocada. | Un mensaje claro de que los datos no son correctos. La app no se cierra ni se queda en blanco. | |
| T3 | Entra con la cuenta correcta otra vez. | Vuelves a tu pantalla sin problemas. | |

### 3.2 Estudiante

Recuerda: la app está hecha para niños con síndrome de Down. Fíjate también en si los botones son grandes, si se entiende sin leer mucho y si las instrucciones se escuchan.

| # | Pasos | Resultado esperado | ✅/❌ |
|---|---|---|---|
| E1 | Mira la pantalla de Inicio. | Ves un saludo, y si la profe te dejó una tarea, el aviso «Tu profe te dejó…». | |
| E2 | Toca el parlante de cualquier pantalla. | Se escucha la instrucción con la voz del teléfono. | |
| E3 | Abre la tarea desde el aviso de Inicio (o una tarjeta con la insignia «Tarea»). Complétala. | Al final hay celebración. El resultado le llega a la tallerista (lo comprueba ella en «Por escuchar»). | |
| E4 | **Equivócate a propósito** en un juego. | No hay sonido de error, ni vidas, ni tiempo límite. La app da una ayuda visual para volver a intentar. | |
| E5 | Ve a **Juegos** y abre **Emparejar**, **Clasificar**, **Secuenciar** y **Memoria** desde su tarjeta. | Cada uno abre en el nivel actual de su escalera (al principio, nivel 1). En Memoria el nivel 1 tiene pocas parejas. | |
| E6 | **Habla conmigo:** elige una vocal y sigue «Mira», «Dilo» y «Listo». | En «Dilo» la cámara funciona como espejo (no toma fotos). Si el acudiente autorizó la voz, se graba; si no, aparece «Ya lo dije» y no graba. Las dos cosas son correctas. | |
| E7 | **Busca la boca:** escucha el sonido y elige la boca. | Si aciertas, celebración. Si fallas, ayuda visual, sin sonido de error. | |
| E8 | Abre un juego **sin** tarea (juego libre) y termínalo. | La pantalla final dice «Sigue practicando cuando quieras». Esto no se envía a la profe. Es correcto. | |
| E9 | Ve a **Mi progreso**. | Ves tus temas y estrellas. Lo que aún no revisó la profe **no** suma al progreso oficial. | |
| E10 | (Después de que la tallerista apruebe, ver P3) Vuelve a **Juegos** y abre el mismo juego. | Ahora abre en el **nivel siguiente**. En **Mi progreso** se ve el avance. | |

### 3.3 Tallerista (docente)

| # | Pasos | Resultado esperado | ✅/❌ |
|---|---|---|---|
| P1 | Abre «Por escuchar» después de que el estudiante hizo su tarea (E3). | Aparece lo que hizo el estudiante. Solo ves a **tus** estudiantes asignados. | |
| P2 | Abre un intento de **Habla conmigo** que tenga audio. | Primero debes escuchar el audio; después se habilitan «Lo logró» y «Practicar más». Si no tiene audio, la app explica por qué y puedes decidir de una vez. | |
| P3 | Toca **«Lo logró»** en un intento de Emparejar, Clasificar, Secuenciar o Memoria. | El intento sale de la lista. El progreso del estudiante sube y su nivel en ese juego también (lo ve el estudiante en E10). | |
| P4 | Toca **«Practicar más»** en otro intento y escribe una indicación. Marca la opción de enviarla a la familia. | El intento sale de la lista. El acudiente ve la indicación (A3). El estudiante puede volver a hacer la actividad. | |
| P5 | Cierra sesión. | Vuelves a la pantalla de inicio de sesión. | |

### 3.4 Acudiente

| # | Pasos | Resultado esperado | ✅/❌ |
|---|---|---|---|
| A1 | Abre «Practicar en casa». | Ves solo al estudiante (o estudiantes) que tienes asociado. Si tienes varios, puedes elegir a quién ver. | |
| A2 | Mira el **sonido de la semana**. | Aparece la tarea de Habla conmigo pendiente. Si no hay, la app lo dice. | |
| A3 | Busca la **nota de la profe** y lo que dijo en las actividades revisadas. | Aparece la indicación que escribió la tallerista en P4. | |
| A4 | Toca **«Lo practicamos hoy»**. | El día queda marcado en los días practicados. | |
| A5 | Cierra sesión. | Vuelves a la pantalla de inicio de sesión. | |

### 3.5 Directora (por Swagger, en el navegador del PC)

La app todavía no tiene pantallas de directora, así que esta parte se prueba en la página de la API:

1. Abre https://gameup-backend.onrender.com/api-docs
2. Busca `POST /api/v1/auth/login`, toca **Try it out**, escribe tu usuario y contraseña y toca **Execute**.
3. Copia el valor de `token` de la respuesta (sin las comillas).
4. Arriba, toca **Authorize**, pega el token y confirma.
5. Ahora puedes usar los demás endpoints.

| # | Pasos (en Swagger) | Resultado esperado | ✅/❌ |
|---|---|---|---|
| D1 | `GET /usuarios` | Lista de usuarios de GameUP. | |
| D2 | `GET /estudiantes` y luego `GET /estudiantes/{id}` | Ves los estudiantes y el detalle de uno. | |
| D3 | `GET /estudiantes/{id}/progreso` | El progreso oficial: solo cuenta lo que la tallerista aprobó. | |
| D4 | `GET /estudiantes/{id}/niveles-juego` | El nivel de cada juego. Después de P3, el juego aprobado sube uno. | |
| D5 | `GET /modulos` y `GET /modulos/{id}/actividades` | Los módulos y sus actividades. | |
| D6 | `POST /asignaciones` (asignar una actividad a un estudiante) | Respuesta correcta (201). El estudiante la ve como tarea en su Inicio (E1). | |
| D7 | Cierra la autorización y entra con la cuenta de **acudiente** o **estudiante**. Intenta `GET /usuarios`. | Error **403** (no tiene permiso). Esto es lo correcto: prueba que el backend protege los datos. | |

La tallerista también puede probar D6 en Swagger con su propia cuenta (también puede asignar). Y puede probar que **no** ve estudiantes que no tiene asignados.

---

## 4. Pruebas de seguridad y privacidad (para cualquiera)

| # | Qué revisar | Resultado esperado | ✅/❌ |
|---|---|---|---|
| S1 | En «Dilo», ¿la app guarda fotos o videos de la cámara? | No. La cámara es solo un espejo. | |
| S2 | Un acudiente intenta ver a un estudiante que no es suyo (en Swagger, `GET /estudiantes/{otro id}`). | Error 403 o 404. | |
| S3 | ¿Aparecen contraseñas, claves o datos sensibles en alguna pantalla de la app? | No. | |

---

## 5. Cómo reportar un fallo

Escríbelo en el grupo o en el documento que alex indique, con este formato:

```
Prueba: (por ejemplo E5)
Rol: (estudiante / tallerista / acudiente / directora)
Celular: (marca, modelo, Android o iPhone)
Qué hice: (los pasos, en orden)
Qué esperaba: (lo que dice la guía)
Qué pasó: (lo que viste, con el mensaje exacto si hubo)
Hora aproximada: (para buscarlo en los registros del servidor)
Captura o video: (sí / no)
```

**Antes de reportar, revisa:**

- ¿Despertaste el servidor (paso 1.3)? Muchos «no hay conexión» son eso.
- ¿Es algo de la lista «Todavía NO se puede probar» (sección 2)? Entonces ya lo sabemos.
- ¿Te pasa otra vez si lo repites? Dilo en el reporte («pasa siempre» o «pasó una vez»).

**En las capturas:** tapa la contraseña y no muestres datos de niños reales.

**Ideas y comentarios** (no son fallos, pero sirven mucho): si algo es difícil de entender para un niño, un botón queda pequeño o una instrucción es confusa, anótalo también con la etiqueta «Sugerencia».

---

## 6. Nota para alex (preparar las cuentas)

Para que las pruebas encadenadas funcionen (estudiante → tallerista → acudiente):

1. Crear las cuentas en la API de seguridad y darlas de alta en GameUP con la directora (`POST /usuarios`).
2. Vincular el estudiante con la tallerista (`POST /estudiantes/{id}/talleristas`) y con el acudiente (`POST /estudiantes/{id}/acudientes`).
3. Asignar al menos una actividad de cada tipo de juego al estudiante (`POST /asignaciones`), incluida una de Habla conmigo para que el acudiente vea «el sonido de la semana».
4. Confirmar que la escalera de niveles quedó sembrada en Supabase (script `prisma/scripts/sembrar_escalera.sql`); si no, las pruebas E5 y E10 no van a funcionar.
5. Si son varios grupos de testers a la vez, armar un trío estudiante/tallerista/acudiente por grupo para que no se mezclen los resultados.
