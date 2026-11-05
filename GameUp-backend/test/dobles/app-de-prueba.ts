import type { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
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
  NIVEL_CONSULTA,
  USUARIO_ESCRITURA_REPOSITORY,
  USUARIO_LECTURA_REPOSITORY,
} from '../../src/modules/usuarios/domain/usuario.repository.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { SupabaseService } from '../../src/supabase/supabase.service.js';
import { AutenticadorFalso } from './autenticador-falso.js';
import { NivelesEnMemoria, UsuariosEnMemoria } from './usuarios-en-memoria.js';
import { VerificadorTokenFalso } from './verificador-token-falso.js';

export interface OpcionesAppDePrueba {
  verificador?: VerificadorToken;
  autenticador?: AutenticadorExterno;
  /** Usuarios en memoria: también responden como CuentaRepository. */
  usuarios?: UsuariosEnMemoria;
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
    .useValue(new NivelesEnMemoria());

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
