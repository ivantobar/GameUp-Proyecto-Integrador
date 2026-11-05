import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Documentación interactiva de la API con Swagger (OpenAPI 3).
 *
 * Es la versión NestJS de la guía "Configurar Swagger en el backend Node.js":
 * en lugar de swagger-jsdoc + comentarios YAML, @nestjs/swagger lee los
 * decoradores de los controladores (@ApiTags, @ApiOkResponse...) y de los DTO
 * (@ApiProperty), así que la documentación no se desincroniza del código.
 *
 *   Página interactiva:   /api-docs
 *   Especificación JSON:  /api-docs.json
 *
 * Para documentar un módulo nuevo basta con poner en su controlador:
 *   @ApiTags('actividades')            agrupa los endpoints en una sección
 *   @ApiBearerAuth(BEARER_AUTH)        si el endpoint pide token
 *   @ApiOkResponse({ type: MiDto })    para mostrar la respuesta esperada
 */
export const SWAGGER_PATH = 'api-docs';

/** Nombre del esquema de seguridad JWT (botón "Authorize"). */
export const BEARER_AUTH = 'bearerAuth';

export function setupSwagger(app: INestApplication, publicUrl?: string): void {
  const builder = new DocumentBuilder()
    .setTitle('GameUP API')
    .setDescription(
      'API del aula virtual inclusiva GameUP (Fundación ASISCO-UP). ' +
        'Todas las rutas de la API están bajo /api/v1.',
    )
    .setVersion('1.0.0')
    // "/" = el mismo servidor desde donde se abre /api-docs (local o Render),
    // así "Try it out" siempre apunta al backend correcto y no hay error de CORS.
    .addServer('/', 'Servidor actual');

  // Igual que PUBLIC_URL en la guía: deja elegir el servidor de producción.
  if (publicUrl) {
    builder.addServer(publicUrl.replace(/\/$/, ''), 'Producción');
  }

  builder
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Pega el token sin la palabra "Bearer".',
      },
      BEARER_AUTH,
    )
    .addTag('health', 'Estado del backend y de sus conexiones')
    .addTag('auth', 'Inicio y cierre de sesión con la API de seguridad')
    .addTag('usuarios', 'Cuentas de GameUP (solo la directora)')
    .addTag(
      'estudiantes',
      'Estudiantes, sus vínculos, nivel y consentimiento de voz',
    )
    .addTag(
      'catalogo',
      'Niveles, categorías, tipos de juego y música (lectura)',
    )
    .addTag('modulos', 'Módulos, contenidos (archivos) y actividades');

  const document = SwaggerModule.createDocument(app, builder.build());

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: `${SWAGGER_PATH}.json`,
    customSiteTitle: 'Docs API GameUP',
    // Conserva el token al recargar la página.
    swaggerOptions: { persistAuthorization: true },
  });
}
