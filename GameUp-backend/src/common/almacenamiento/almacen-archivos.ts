/**
 * Puerto AlmacenArchivos: archivos en buckets PRIVADOS (Supabase Storage).
 * La app nunca recibe rutas ni la clave de Storage: solo URLs firmadas de
 * corta duración que entrega el backend.
 *
 * Los adaptadores lanzan ServicioExternoNoDisponibleError (503) si Storage no
 * está configurado o falla. Nunca registran rutas en los logs (en el bucket
 * de grabaciones identifican a un estudiante).
 */
export type Bucket = 'contenidos' | 'grabaciones';

export interface UrlFirmada {
  url: string;
  expiraEn: Date;
}

export interface AlmacenArchivos {
  /**
   * Sube un archivo que está en el disco del servidor (`archivoLocal`), sin
   * cargarlo completo en memoria.
   */
  subir(
    bucket: Bucket,
    ruta: string,
    archivoLocal: string,
    tipoMime: string,
  ): Promise<void>;
  /** Mapa ruta → URL firmada (una sola llamada a Storage). Las rutas que no existan no aparecen. */
  urlsFirmadas(
    bucket: Bucket,
    rutas: string[],
    segundos: number,
  ): Promise<Map<string, UrlFirmada>>;
  eliminar(bucket: Bucket, rutas: string[]): Promise<void>;
}

export const ALMACEN_ARCHIVOS = Symbol('ALMACEN_ARCHIVOS');

/**
 * Archivo recibido en multipart/form-data. Vive en un archivo temporal del
 * servidor (`path`) que se borra siempre al terminar la petición
 * (@SubidaDeArchivo); nunca se carga completo en memoria.
 */
export interface ArchivoSubido {
  /** Ruta del archivo temporal. */
  path: string;
  /** Primeros bytes del archivo, para reconocer su formato real. */
  cabecera: Buffer;
  /** Tipo que declara el cliente: no es confiable por sí solo. */
  mimetype: string;
  size: number;
  originalname: string;
}
