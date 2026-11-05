import { ReadStream } from 'node:fs';
import {
  ARCHIVOS,
  archivoTemporal,
  borrarTemporales,
} from '../../../test/dobles/escenario-modulos.js';
import { ServicioExternoNoDisponibleError } from '../errors/dominio.errors.js';
import { RelojFijo } from '../reloj/reloj.js';
import type { SupabaseService } from '../../supabase/supabase.service.js';
import { AlmacenSupabase } from './almacen-supabase.js';
import { confirmarTipo, tiposCompatibles } from './tipos-archivo.js';

describe('tipos de archivo por su firma', () => {
  it.each([
    ['png', ['image/png']],
    ['jpeg', ['image/jpeg']],
    ['webp', ['image/webp']],
    ['mp4', ['video/mp4', 'audio/mp4']],
    ['m4a', ['audio/mp4']],
    ['mp3', ['audio/mpeg']],
    ['falso', []],
  ] as const)('%s', (nombre, tipos) => {
    expect(tiposCompatibles(ARCHIVOS[nombre])).toEqual(tipos);
  });

  it('confirma el tipo declarado solo si los bytes coinciden', () => {
    expect(confirmarTipo(ARCHIVOS.mp4, 'video/mp4')).toBe('video/mp4');
    expect(confirmarTipo(ARCHIVOS.png, 'video/mp4')).toBeNull();
    expect(confirmarTipo(ARCHIVOS.falso, 'video/mp4')).toBeNull();
    expect(confirmarTipo(Buffer.alloc(0), 'image/png')).toBeNull();
  });
});

describe('AlmacenSupabase', () => {
  const AHORA = new Date('2026-11-05T15:00:00Z');

  function crear(storage: Record<string, unknown> | null) {
    const supabase = {
      isConfigured: () => storage !== null,
      getClient: () => ({ storage: { from: () => storage } }),
    } as unknown as SupabaseService;
    const almacen = new AlmacenSupabase(supabase, new RelojFijo(AHORA));
    vi.spyOn(almacen['logger'], 'error').mockImplementation(() => undefined);
    return almacen;
  }

  it('sin Supabase configurado → 503 con mensaje claro', async () => {
    await expect(
      crear(null).subir('contenidos', 'a', '/tmp/no-importa', 'image/png'),
    ).rejects.toThrow(/falta configurar Supabase/);
  });

  it('sube desde disco como stream, sin sobrescribir y con el tipo real', async () => {
    const temporal = await archivoTemporal(ARCHIVOS.png, 'image/png');
    const upload = vi.fn(async () => ({ data: { path: 'a' }, error: null }));
    await crear({ upload }).subir(
      'contenidos',
      'a',
      temporal.path,
      'image/png',
    );
    expect(upload).toHaveBeenCalledWith('a', expect.any(ReadStream), {
      contentType: 'image/png',
      upsert: false,
      duplex: 'half',
    });
    const [, stream] = upload.mock.calls[0] as unknown as [string, ReadStream];
    stream.destroy();
    await borrarTemporales();
  });

  it('firma varias rutas en una sola llamada y omite las que fallan', async () => {
    const createSignedUrls = vi.fn(async () => ({
      data: [
        { path: 'a', signedUrl: 'https://firmada/a', error: null },
        { path: 'b', signedUrl: null, error: 'Object not found' },
      ],
      error: null,
    }));
    const urls = await crear({ createSignedUrls }).urlsFirmadas(
      'contenidos',
      ['a', 'b'],
      600,
    );
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect([...urls.keys()]).toEqual(['a']);
    expect(urls.get('a')).toEqual({
      url: 'https://firmada/a',
      expiraEn: new Date(AHORA.getTime() + 600_000),
    });
  });

  it('un error de Storage → 503 (sin la ruta en el mensaje)', async () => {
    const remove = vi.fn(async () => ({
      data: null,
      error: { message: 'boom' },
    }));
    const promesa = crear({ remove }).eliminar('grabaciones', [
      'estudiante/10/intento/5.m4a',
    ]);
    await expect(promesa).rejects.toThrow(ServicioExternoNoDisponibleError);
    await expect(
      crear({ remove }).eliminar('grabaciones', [
        'estudiante/10/intento/5.m4a',
      ]),
    ).rejects.not.toThrow(/estudiante/);
  });

  it('listas vacías no llaman a Storage', async () => {
    const almacen = crear({});
    await expect(almacen.urlsFirmadas('contenidos', [], 60)).resolves.toEqual(
      new Map(),
    );
    await expect(almacen.eliminar('contenidos', [])).resolves.toBeUndefined();
  });
});
