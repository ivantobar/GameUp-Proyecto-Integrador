# GameUP — Frontend

App móvil de **GameUP**, el aula virtual inclusiva de la Fundación ASISCO-UP.

- **React Native + Expo** (SDK 57, TypeScript).
  Se usa el SDK 57 porque el Expo Go de Play Store aún no soporta el 58.
  Antes de subir de SDK, confirma que Expo Go ya lo soporta.
- Se prueba en el celular con **Expo Go**.
- Se comunica con el backend **NestJS** (`GameUp-backend`) por su API REST.

> Estado actual: configuración inicial. Hay una sola pantalla con un botón
> **«Probar conexión»** que llama a `GET /api/v1/health` del backend.
> Aún no hay navegación, inicio de sesión ni juegos.

---

## 1. Requisitos

| Herramienta | Versión | Comprobar con |
|---|---|---|
| Node.js | **22.18+** o **24.11+** (la misma del backend) | `node -v` |
| npm | 10 o superior | `npm -v` |
| Expo Go | La última versión de Play Store / App Store (compatible con SDK 57) | En el celular |

Todos los comandos se ejecutan en una terminal **bash** (en Windows: Git Bash),
desde la carpeta `GameUp-frontend`.

## 2. Instalación (primera vez)

```bash
npm install            # instala dependencias
cp .env.example .env   # crea tu archivo de variables
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

1. En otra terminal, enciende el backend: `cd ../GameUp-backend && npm run start:dev`.
2. En esta carpeta:

   ```bash
   npm start
   ```

3. Escanea el código QR con **Expo Go** (Android) o con la cámara (iPhone).
4. Toca **«Probar conexión»**. Debe aparecer «Backend conectado» con el estado
   de la base de datos y de Supabase.

Si sale «No se pudo conectar»:

- Revisa que la IP del `.env` sea la actual del PC (puede cambiar).
- Abre `http://TU_IP:3000/api/v1/health` en el navegador del celular.
- Permite Node.js en el Firewall de Windows (redes privadas).
- Si cambiaste el `.env`, reinicia con `npx expo start --clear`.
- Si el QR no conecta (red de la universidad, por ejemplo), prueba
  `npx expo start --tunnel`. Ojo: el túnel solo sirve para cargar la app;
  el backend igual debe ser alcanzable por la IP.

## 4. Scripts

| Comando | Para qué |
|---|---|
| `npm start` | Inicia Expo (muestra el QR para Expo Go) |
| `npm run android` | Inicia Expo y abre un emulador Android, si hay uno |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run format` | Da formato al código con Prettier (misma configuración que el backend) |

Para agregar librerías usa **`npx expo install <paquete>`** (no `npm install`):
elige la versión compatible con el SDK de Expo. Expo Go solo trae ciertos
módulos nativos; antes de agregar uno, comprueba que funcione en Expo Go.

## 5. Estructura

```
GameUp-frontend/
├── App.tsx                 # Raíz de la interfaz (aquí irá la navegación)
├── index.ts                # Registro de la app (no se modifica)
├── app.json                # Configuración de Expo (nombre, ícono, etc.)
├── .env.example            # Plantilla de variables (copiar como .env)
├── assets/                 # Íconos y splash (provisionales de Expo)
└── src/
    ├── components/         # Componentes reutilizables (BigButton)
    ├── config/env.ts       # Lectura de variables de entorno
    ├── screens/            # Pantallas (HomeScreen, temporal)
    ├── services/           # Llamadas a la API (api.ts, health.service.ts)
    └── theme/theme.ts      # Colores, tamaños y espaciados comunes
```

Reglas:

- Toda llamada al backend pasa por `src/services/api.ts`.
- Colores y tamaños se toman de `src/theme/theme.ts`, no se escriben a mano.
- Botones grandes (mínimo 72 px de alto), textos cortos y `accessibilityLabel`
  en todo elemento tocable.
- Los permisos se verifican en el backend; ocultar un botón en la app no basta.
