import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service.js';

/** Global: cualquier módulo puede inyectar SupabaseService sin importarlo. */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
