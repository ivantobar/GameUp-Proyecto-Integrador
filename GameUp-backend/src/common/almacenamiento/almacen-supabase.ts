import { createReadStream } from 'node:fs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { ServicioExternoNoDisponibleError } from '../errors/dominio.errors.js';
import { RELOJ, type Reloj } from '../reloj/reloj.js';
import type {
  AlmacenArchivos,
  Bucket,
  UrlFirmada,
} from './almacen-archivos.js';

const NO_CONFIGURADO =
  'El almacenamiento de archivos no está disponible: falta configurar Supabase (SUPABASE_URL y SUPABASE_SECRET_KEY).';
const FALLA =
  'El almacenamiento de archivos no respondió. Intenta de nuevo en unos minutos.';

/**
 * Adaptador de AlmacenArchivos sobre Supabase Storage (clave secreta, solo
 * backend). Los buckets `contenidos` y `grabaciones` son privados.
 */
@Injectable()
export class AlmacenSupabase implements AlmacenArchivos {
  private readonly logger = new Logger(AlmacenSupabase.name);

  constructor(
    private readonly supabase: SupabaseService,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  private storage(bucket: Bucket) {
    if (!this.supabase.isConfigured()) {
      throw new ServicioExternoNoDisponibleError(NO_CONFIGURADO);
    }
    return this.supabase.getClient().storage.from(bucket);
  }

  async subir(
    bucket: Bucket,
    ruta: string,
    archivoLocal: string,
    tipoMime: string,
  ): Promise<void> {
    // Se envía como stream: el archivo no se carga completo en memoria
    // (storage-js agrega duplex: 'half', que exige fetch con streams).
    const { error } = await this.storage(bucket).upload(
      ruta,
      createReadStream(archivoLocal),
      { contentType: tipoMime, upsert: false, duplex: 'half' },
    );
    if (error) this.fallo('subir', error);
  }

  async urlsFirmadas(
    bucket: Bucket,
    rutas: string[],
    segundos: number,
  ): Promise<Map<string, UrlFirmada>> {
    const resultado = new Map<string, UrlFirmada>();
    if (rutas.length === 0) return resultado;
    const { data, error } = await this.storage(bucket).createSignedUrls(
      rutas,
      segundos,
    );
    if (error) this.fallo('firmar', error);
    const expiraEn = new Date(this.reloj.ahora().getTime() + segundos * 1000);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl && !item.error) {
        resultado.set(item.path, { url: item.signedUrl, expiraEn });
      }
    }
    return resultado;
  }

  async eliminar(bucket: Bucket, rutas: string[]): Promise<void> {
    if (rutas.length === 0) return;
    const { error } = await this.storage(bucket).remove(rutas);
    if (error) this.fallo('eliminar', error);
  }

  private fallo(operacion: string, error: { message: string }): never {
    // Sin rutas en el log: solo la operación y el mensaje de Storage.
    this.logger.error(`Storage falló al ${operacion}: ${error.message}`);
    throw new ServicioExternoNoDisponibleError(FALLA);
  }
}
