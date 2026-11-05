import { Global, Module } from '@nestjs/common';
import { ALMACEN_ARCHIVOS } from './almacen-archivos.js';
import { AlmacenSupabase } from './almacen-supabase.js';

/** Global: cualquier servicio puede pedir @Inject(ALMACEN_ARCHIVOS). */
@Global()
@Module({
  providers: [{ provide: ALMACEN_ARCHIVOS, useClass: AlmacenSupabase }],
  exports: [ALMACEN_ARCHIVOS],
})
export class AlmacenamientoModule {}
