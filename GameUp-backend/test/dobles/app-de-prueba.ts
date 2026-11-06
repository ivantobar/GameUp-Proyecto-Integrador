import type { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { ALMACEN_ARCHIVOS } from '../../src/common/almacenamiento/almacen-archivos.js';
import {
  VERIFICADOR_TOKEN,
  type VerificadorToken,
} from '../../src/common/auth/verificador-token.js';
import {
  AUTENTICADOR_EXTERNO,
  type AutenticadorExterno,
} from '../../src/modules/auth/domain/autenticador-externo.js';
import {
  CUENTA_REPOSITORY,
  type CuentaRepository,
} from '../../src/modules/auth/domain/cuenta.repository.js';
import {
  ASIGNACION_ESCRITURA_REPOSITORY,
  ASIGNACION_LECTURA_REPOSITORY,
} from '../../src/modules/asignaciones/domain/asignacion.repository.js';
import { CATALOGO_REPOSITORY } from '../../src/modules/catalogo/domain/catalogo.js';
import {
  INTENTO_ESCRITURA_REPOSITORY,
  INTENTO_LECTURA_REPOSITORY,
} from '../../src/modules/intentos/domain/intento.repository.js';
import {
  ACTIVIDAD_REPOSITORY,
  CONTENIDO_REPOSITORY,
  MODULO_REPOSITORY,
} from '../../src/modules/modulos/domain/modulo.repository.js';
import {
  ACUDIENTE_ESTUDIANTE_REPOSITORY,
  ESTUDIANTE_LECTURA_REPOSITORY,
  NIVEL_ESTUDIANTE_REPOSITORY,
  TALLERISTA_ESTUDIANTE_REPOSITORY,
} from '../../src/modules/estudiantes/domain/estudiante.repository.js';
import {
  NIVEL_CONSULTA,
  USUARIO_ESCRITURA_REPOSITORY,
  USUARIO_LECTURA_REPOSITORY,
} from '../../src/modules/usuarios/domain/usuario.repository.js';
import {
  GRABACION_REPOSITORY,
  REVISION_LECTURA_REPOSITORY,
  VALIDACION_ESCRITURA_REPOSITORY,
} from '../../src/modules/validaciones/domain/validacion.repository.js';
import { NOTIFICACION_REPOSITORY } from '../../src/modules/notificaciones/domain/notificacion.repository.js';
import {
  OBSERVACION_ESCRITURA_REPOSITORY,
  OBSERVACION_LECTURA_REPOSITORY,
} from '../../src/modules/observaciones/domain/observacion.repository.js';
import { PRACTICA_CASA_REPOSITORY } from '../../src/modules/practica-casa/domain/practica-casa.repository.js';
import { NIVEL_JUEGO_REPOSITORY } from '../../src/modules/niveles-juego/domain/nivel-juego.repository.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { SupabaseService } from '../../src/supabase/supabase.service.js';
import {
  NotificacionesEnMemoria,
  ObservacionesEnMemoria,
  PracticasEnMemoria,
} from './acudiente-en-memoria.js';
import { AsignacionesEnMemoria } from './asignaciones-en-memoria.js';
import { AutenticadorFalso } from './autenticador-falso.js';
import { EstudiantesEnMemoria } from './estudiantes-en-memoria.js';
import { IntentosEnMemoria } from './intentos-en-memoria.js';
import { NivelesJuegoEnMemoria } from './niveles-juego-en-memoria.js';
import { ValidacionesEnMemoria } from './validaciones-en-memoria.js';
import {
  AlmacenEnMemoria,
  CatalogoEnMemoria,
  ModulosEnMemoria,
} from './modulos-en-memoria.js';
import { NivelesEnMemoria, UsuariosEnMemoria } from './usuarios-en-memoria.js';
import { VerificadorTokenFalso } from './verificador-token-falso.js';

export interface OpcionesAppDePrueba {
  verificador?: VerificadorToken;
  autenticador?: AutenticadorExterno;
  /** Usuarios en memoria: también responden como CuentaRepository. */
  usuarios?: UsuariosEnMemoria;
  /** Estudiantes y vínculos en memoria (por defecto, sobre `usuarios`). */
  estudiantes?: EstudiantesEnMemoria;
  /** Catálogo, Storage y módulos en memoria (fase 4). */
  catalogo?: CatalogoEnMemoria;
  almacen?: AlmacenEnMemoria;
  modulos?: ModulosEnMemoria;
  /** Asignaciones en memoria (fase 5). */
  asignaciones?: AsignacionesEnMemoria;
  /** Intentos en memoria (fase 6). */
  intentos?: IntentosEnMemoria;
  /** Validaciones y grabaciones en memoria (fase 7). */
  validaciones?: ValidacionesEnMemoria;
  /** Escalera de niveles por juego en memoria (fase 9). */
  nivelesJuego?: NivelesJuegoEnMemoria;
  /** Observaciones, notificaciones y práctica en casa en memoria (fase 8). */
  notificaciones?: NotificacionesEnMemoria;
  observaciones?: ObservacionesEnMemoria;
  practicas?: PracticasEnMemoria;
  /** Si se da, reemplaza solo el CuentaRepository que usa el guard. */
  cuentas?: CuentaRepository;
  /** Controladores extra solo para la prueba. */
  controllers?: Type[];
  /** Reemplazos adicionales de proveedores (puertos de cada módulo). */
  reemplazos?: Array<{ provide: unknown; useValue: unknown }>;
}

/**
 * Arma la app completa (AppModule + configureApp) sin base de datos, sin
 * Supabase y sin APIs externas: los puertos se reemplazan por dobles.
 */
export async function crearAppDePrueba(
  opciones: OpcionesAppDePrueba = {},
): Promise<INestApplication<App>> {
  const usuarios = opciones.usuarios ?? new UsuariosEnMemoria();
  const estudiantes =
    opciones.estudiantes ?? new EstudiantesEnMemoria(usuarios);
  const catalogo = opciones.catalogo ?? new CatalogoEnMemoria();
  const almacen = opciones.almacen ?? new AlmacenEnMemoria();
  const modulos =
    opciones.modulos ?? new ModulosEnMemoria(usuarios, estudiantes, catalogo);
  const asignaciones =
    opciones.asignaciones ??
    new AsignacionesEnMemoria(usuarios, estudiantes, modulos);
  const nivelesJuego =
    opciones.nivelesJuego ??
    new NivelesJuegoEnMemoria(
      modulos,
      usuarios,
      () => asignaciones.intentosFilas,
    );
  const intentos =
    opciones.intentos ??
    new IntentosEnMemoria(asignaciones, modulos, nivelesJuego);
  const validaciones =
    opciones.validaciones ??
    new ValidacionesEnMemoria(
      usuarios,
      estudiantes,
      modulos,
      asignaciones,
      nivelesJuego,
    );
  const notificaciones =
    opciones.notificaciones ?? new NotificacionesEnMemoria();
  const observaciones =
    opciones.observaciones ??
    new ObservacionesEnMemoria(usuarios, estudiantes, notificaciones);
  const practicas = opciones.practicas ?? new PracticasEnMemoria();
  let builder = Test.createTestingModule({
    imports: [AppModule],
    controllers: opciones.controllers ?? [],
  })
    .overrideProvider(PrismaService)
    .useValue({ checkConnection: async () => 'conectada' })
    .overrideProvider(SupabaseService)
    .useValue({ checkConnection: async () => 'no_configurado' })
    .overrideProvider(VERIFICADOR_TOKEN)
    .useValue(opciones.verificador ?? new VerificadorTokenFalso({}))
    .overrideProvider(AUTENTICADOR_EXTERNO)
    .useValue(opciones.autenticador ?? new AutenticadorFalso({}))
    .overrideProvider(CUENTA_REPOSITORY)
    .useValue(opciones.cuentas ?? usuarios)
    .overrideProvider(USUARIO_LECTURA_REPOSITORY)
    .useValue(usuarios)
    .overrideProvider(USUARIO_ESCRITURA_REPOSITORY)
    .useValue(usuarios)
    .overrideProvider(NIVEL_CONSULTA)
    .useValue(new NivelesEnMemoria())
    .overrideProvider(ESTUDIANTE_LECTURA_REPOSITORY)
    .useValue(estudiantes)
    .overrideProvider(NIVEL_ESTUDIANTE_REPOSITORY)
    .useValue(estudiantes)
    .overrideProvider(TALLERISTA_ESTUDIANTE_REPOSITORY)
    .useValue(estudiantes.talleristasRepo)
    .overrideProvider(ACUDIENTE_ESTUDIANTE_REPOSITORY)
    .useValue(estudiantes.acudientesRepo)
    .overrideProvider(CATALOGO_REPOSITORY)
    .useValue(catalogo)
    .overrideProvider(ALMACEN_ARCHIVOS)
    .useValue(almacen)
    .overrideProvider(MODULO_REPOSITORY)
    .useValue(modulos.moduloRepo)
    .overrideProvider(CONTENIDO_REPOSITORY)
    .useValue(modulos.contenidoRepo)
    .overrideProvider(ACTIVIDAD_REPOSITORY)
    .useValue(modulos.actividadRepo)
    .overrideProvider(ASIGNACION_LECTURA_REPOSITORY)
    .useValue(asignaciones)
    .overrideProvider(ASIGNACION_ESCRITURA_REPOSITORY)
    .useValue(asignaciones)
    .overrideProvider(INTENTO_LECTURA_REPOSITORY)
    .useValue(intentos)
    .overrideProvider(INTENTO_ESCRITURA_REPOSITORY)
    .useValue(intentos)
    .overrideProvider(REVISION_LECTURA_REPOSITORY)
    .useValue(validaciones)
    .overrideProvider(VALIDACION_ESCRITURA_REPOSITORY)
    .useValue(validaciones)
    .overrideProvider(GRABACION_REPOSITORY)
    .useValue(validaciones)
    .overrideProvider(NOTIFICACION_REPOSITORY)
    .useValue(notificaciones)
    .overrideProvider(OBSERVACION_LECTURA_REPOSITORY)
    .useValue(observaciones)
    .overrideProvider(OBSERVACION_ESCRITURA_REPOSITORY)
    .useValue(observaciones)
    .overrideProvider(PRACTICA_CASA_REPOSITORY)
    .useValue(practicas)
    .overrideProvider(NIVEL_JUEGO_REPOSITORY)
    .useValue(nivelesJuego);

  for (const { provide, useValue } of opciones.reemplazos ?? []) {
    builder = builder.overrideProvider(provide).useValue(useValue);
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>({
    logger: false,
  });
  configureApp(app);
  await app.init();
  return app;
}
