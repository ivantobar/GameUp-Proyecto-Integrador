import { Global, Module } from '@nestjs/common';
import { RELOJ, RelojSistema } from './reloj.js';

/** Global: cualquier servicio puede pedir @Inject(RELOJ). */
@Global()
@Module({
  providers: [{ provide: RELOJ, useClass: RelojSistema }],
  exports: [RELOJ],
})
export class RelojModule {}
