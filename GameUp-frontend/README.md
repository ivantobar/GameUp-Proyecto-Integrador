# GameUP — Frontend

App móvil de **GameUP**, el aula virtual inclusiva de la Fundación ASISCO-UP.

- **React Native + Expo** (SDK 57, TypeScript estricto).
  Se usa el SDK 57 porque el Expo Go de Play Store aún no soporta el 58.
  Antes de subir de SDK, confirma que Expo Go ya lo soporta.
- Navegación con **Expo Router** (rutas en `src/app/`).
- Se prueba en el celular con **Expo Go**.
- Se comunica con el backend **NestJS** (`GameUp-backend`) por su API REST.

> **Estado actual (Fase 5):** sistema de diseño, componentes base,
> personaje y bocas en SVG, pantallas del estudiante **Inicio**, **Juegos**,
> **Mi progreso**, el flujo completo de **Habla conmigo** (selección de
> vocal, **Mira**, **Dilo** y **Listo**) y **Busca la boca**; la pantalla
> del docente **Por escuchar** y la del acudiente **Practicar en casa**.
> Todo funciona con datos simulados en memoria. Al abrir la app en
> desarrollo aparece el **Modo desarrollo**: elige el rol. Aún no hay
> inicio de sesión ni API: los permisos de cada rol deberá verificarlos el
> backend.

---

## 1. Requisitos

| Herramienta | Versión                                                             | Comprobar con |
| ----------- | ------------------------------------------------------------------- | ------------- |
| Node.js     | **22.18+** o **24.11+** (la misma del backend)                      | `node -v`     |
| npm         | 10 o superior                                                       | `npm -v`      |
| Expo Go     | La última versión de Play Store / App Store (compatible con SDK 57) | En el celular |

Todos los comandos se ejecutan en una terminal **bash** (en Windows: Git Bash),
desde la carpeta `GameUp-frontend`.

## 2. Instalación

```bash
npm install            # instala dependencias (también después de cada git pull que cambie package.json)
cp .env.example .env   # solo la primera vez
```

Edita `.env` y pon la IP local de tu PC en `EXPO_PUBLIC_API_URL`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api/v1
```

- Busca la IP con `ipconfig` → «Dirección IPv4».
- El celular y el PC deben estar en la **misma red Wi-Fi**.
- `localhost` **no** sirve: en el celular, `localhost` es el propio celular.

> Las variables `EXPO_PUBLIC_*` quedan dentro de la app y cualquiera puede
> leerlas. **Nunca** pongas aquí claves secretas (`DATABASE_URL`,
> `SUPABASE_SECRET_KEY`, `service_role`); esas viven solo en el backend.

## 3. Ejecutar

```bash
npx expo start --clear   # la primera vez después de cambiar dependencias
npm start                # las demás veces
```

1. Escanea el código QR con **Expo Go** (Android) o con la cámara (iPhone).
2. Aparece **Modo desarrollo**:
   - **Catálogo de componentes**: cada componente en todos sus estados.
     Mantén presionado un botón para ver su estado presionado.
   - **Prueba de conexión**: con el backend encendido
     (`cd ../GameUp-backend && npm run start:dev`), toca «Probar conexión».
     Debe aparecer «Backend conectado».
   - **Ver la app como → Estudiante**: Inicio, Juegos, Mi progreso, Habla
     conmigo y Busca la boca.
   - **Ver la app como → Docente**: «Por escuchar». Lo que hizo el
     estudiante en esta sesión aparece aquí. «Lo logró» lo valida y sube
     el progreso; «Practicar más» pide una indicación que llega a la
     familia; también se puede grabar una nota de voz para la familia.
   - **Ver la app como → Acudiente**: «Practicar en casa», con el sonido de
     la semana, los pasos, la nota de la profe y «Lo practicamos hoy».
   - Los datos simulados viven en memoria: al recargar la app (o cerrar
     Expo Go) vuelven a los iniciales.
   - El parlante lee la instrucción con la voz del teléfono. En iPhone no
     suena si el teléfono está en modo silencio.
   - **Datos simulados → ¿El acudiente autorizó grabar la voz?**: con «Sí»,
     «Dilo» graba la voz; con «No», no graba y muestra «Ya lo dije».
   - En «Dilo», Expo Go pide permiso de **cámara** (solo espejo: no toma
     fotos ni graba video) y de **micrófono** (solo con autorización).
     La grabación queda en la caché del teléfono y se reinicia al cerrar la
     app: todavía no se envía a ningún servidor.

Si la prueba de conexión dice «No se pudo conectar»:

- Revisa que la IP del `.env` sea la actual del PC (puede cambiar).
- Abre `http://TU_IP:3000/api/v1/health` en el navegador del celular.
- Permite Node.js en el Firewall de Windows (redes privadas).
- Si cambiaste el `.env`, reinicia con `npx expo start --clear`.
- Si el QR no conecta (red de la universidad, por ejemplo), prueba
  `npx expo start --tunnel`. Ojo: el túnel solo sirve para cargar la app;
  el backend igual debe ser alcanzable por la IP.

## 4. Scripts

| Comando             | Para qué                                                     |
| ------------------- | ------------------------------------------------------------ |
| `npm start`         | Inicia Expo (muestra el QR para Expo Go)                     |
| `npm run android`   | Inicia Expo y abre un emulador Android, si hay uno           |
| `npm run typecheck` | Revisa los tipos de TypeScript (`tsc --noEmit`)              |
| `npm run lint`      | Revisa el código con ESLint (`expo lint`)                    |
| `npm test`          | Ejecuta las pruebas (Jest + Testing Library)                 |
| `npm run format`    | Da formato con Prettier (misma configuración que el backend) |

Antes de dar por terminada una tarea: `npm run typecheck`, `npm run lint` y `npm test`.

Para agregar librerías usa **`npx expo install <paquete>`** (no `npm install <paquete>`):
elige la versión compatible con el SDK de Expo. Expo Go solo trae ciertos
módulos nativos; antes de agregar uno, comprueba que funcione en Expo Go.

## 5. Estructura

```
GameUp-frontend/
├── app.json                # Configuración de Expo (scheme, plugins, rutas tipadas)
├── jest.setup.ts           # Configuración común de las pruebas
├── .env.example            # Plantilla de variables (copiar como .env)
├── assets/                 # Íconos y splash (provisionales de Expo)
└── src/
    ├── app/                # RUTAS (Expo Router). Cada archivo es una pantalla
    │   ├── _layout.tsx     #   carga Nunito y define el stack y sus transiciones
    │   ├── index.tsx       #   ruta inicial (en desarrollo lleva a /dev)
    │   ├── dev/            #   selector de rol, catálogo y prueba de conexión
    │   ├── student/        #   (tabs)/ Inicio, Juegos, Progreso · speak/ · find-mouth/
    │   ├── teacher/        #   «Por escuchar» (docente)
    │   └── guardian/       #   «Practicar en casa» (acudiente)
    ├── theme/              # Tokens: colores, tipografía, espacios, movimiento
    ├── components/ui/      # Componentes base reutilizables
    ├── components/gameup/  # Personaje, bocas, fichas de sonido, tarjetas de juego
    ├── features/           # Lógica por funcionalidad (hooks), fuera de las rutas
    ├── data/               # Tipos, interfaces de repositorio y datos simulados
    ├── config/env.ts       # Lectura de variables de entorno
    └── services/           # Llamadas a la API (api.ts, health.service.ts)
```

## 6. Reglas de la interfaz

Vienen de la guía «Estilos para el frontend» de la fundación:

- **Ningún color, tamaño ni duración se escribe a mano.** Todo sale de
  `src/theme`. Los componentes aceptan `ThemeColor`, así que un color
  inventado no compila.
- Botón principal en **verde oscuro**. El naranja es acento y lleva siempre
  texto oscuro, **nunca blanco**. Única excepción aprobada: sobre una tarjeta
  verde oscuro, la acción principal es naranja.
- Botones de **56 px** de alto como mínimo (64 px para la acción principal del
  niño). Áreas táctiles de **44 px** o más.
- Texto de **15 px** como mínimo. La «Etiqueta» de la guía (13 px) se usa
  en 15 px por decisión del equipo.
- Superficies planas con esquinas redondeadas, sin degradados ni sombras.
- Las acciones van en la parte inferior; nada flota sobre el contenido.
- El estado nunca se comunica solo con color: también con texto o forma.
- Todo elemento tocable lleva `accessibilityRole`, `accessibilityLabel` y
  `accessibilityState`.
- Los permisos se verifican en el backend; ocultar un botón en la app no basta.

Las pruebas de `src/theme/__tests__` comprueban automáticamente el contraste
AA de los colores y los tamaños mínimos.

## 7. Datos simulados y API

Las pantallas no llaman a `fetch` ni conocen los datos simulados: usan
hooks (`useStudentHome`, `useGameList`…) que dependen de las interfaces de
`src/data/repositories.ts`. La implementación se elige en un solo lugar,
`src/app/_layout.tsx`:

```ts
const repositories = createMockRepositories(); // hoy: datos ficticios
```

Cuando el backend NestJS tenga los endpoints, se crea una implementación
que use `src/services/api.ts` y se cambia esa línea. Los datos ficticios
(`src/data/mock/fixtures.ts`) no corresponden a ningún niño real.

## 8. Agregar un juego

Los juegos se registran en `src/features/games/catalog.ts`. Agregar uno es
agregar una entrada (título, ícono, sección, tono y ruta); la pantalla
Juegos no cambia. Mientras `href` sea `null`, el juego lleva a la pantalla
«Estamos preparando…».
