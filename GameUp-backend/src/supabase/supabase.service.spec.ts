import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../config/env.validation.js';
import {
  BUCKET_REVISADO,
  DURACION_CACHE_ESTADO_MS,
  SupabaseService,
} from './supabase.service.js';

type RespuestaBucket = {
  data: { public: boolean } | null;
  error: { message: string } | null;
};

function crear(
  url: string | undefined,
  key: string | undefined,
): SupabaseService {
  const config = {
    get: (nombre: string) =>
      nombre === 'SUPABASE_URL'
        ? url
        : nombre === 'SUPABASE_SECRET_KEY'
          ? key
          : undefined,
  } as unknown as ConfigService<EnvironmentVariables, true>;
  const servicio = new SupabaseService(config);
  vi.spyOn(servicio['logger'], 'warn').mockImplementation(() => undefined);
  vi.spyOn(servicio['logger'], 'error').mockImplementation(() => undefined);
  return servicio;
}

/** Reemplaza storage.getBucket del cliente real por uno controlado. */
function conBucket(
  servicio: SupabaseService,
  responder: () => Promise<RespuestaBucket>,
) {
  const getBucket = vi.fn(responder);
  const cliente = servicio.getClient();
  vi.spyOn(cliente.storage, 'getBucket').mockImplementation(getBucket as never);
  return getBucket;
}

describe('SupabaseService.checkConnection', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sin URL o sin clave → no_configurado (sin llamar a nadie)', async () => {
    await expect(crear(undefined, undefined).checkConnection()).resolves.toBe(
      'no_configurado',
    );
    await expect(
      crear('https://ref.supabase.co', undefined).checkConnection(),
    ).resolves.toBe('no_configurado');
  });

  it('bucket de grabaciones privado → conectado; consulta ese bucket', async () => {
    const servicio = crear('https://ref.supabase.co', 'sb_secret_x');
    const getBucket = conBucket(servicio, async () => ({
      data: { public: false },
      error: null,
    }));
    await expect(servicio.checkConnection()).resolves.toBe('conectado');
    expect(getBucket).toHaveBeenCalledWith(BUCKET_REVISADO);
  });

  it('ya no usa la API de administración de usuarios', async () => {
    const servicio = crear('https://ref.supabase.co', 'sb_secret_x');
    conBucket(servicio, async () => ({ data: { public: false }, error: null }));
    const listUsers = vi.spyOn(servicio.getClient().auth.admin, 'listUsers');
    await servicio.checkConnection();
    expect(listUsers).not.toHaveBeenCalled();
  });

  it('bucket PÚBLICO → error (las voces solo salen con URL firmada)', async () => {
    const servicio = crear('https://ref.supabase.co', 'sb_secret_x');
    conBucket(servicio, async () => ({ data: { public: true }, error: null }));
    await expect(servicio.checkConnection()).resolves.toBe('error');
  });

  it('Storage responde con error o lanza → error', async () => {
    const conError = crear('https://ref.supabase.co', 'sb_secret_x');
    conBucket(conError, async () => ({
      data: null,
      error: { message: 'no autorizado' },
    }));
    await expect(conError.checkConnection()).resolves.toBe('error');

    const queLanza = crear('https://ref.supabase.co', 'sb_secret_x');
    conBucket(queLanza, async () => {
      throw new Error('red caída');
    });
    await expect(queLanza.checkConnection()).resolves.toBe('error');
  });

  it('recuerda el resultado 60 s y luego vuelve a consultar', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-12T12:00:00Z') });
    const servicio = crear('https://ref.supabase.co', 'sb_secret_x');
    const getBucket = conBucket(servicio, async () => ({
      data: { public: false },
      error: null,
    }));
    await servicio.checkConnection();
    vi.advanceTimersByTime(DURACION_CACHE_ESTADO_MS - 1);
    await servicio.checkConnection();
    expect(getBucket).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    await servicio.checkConnection();
    expect(getBucket).toHaveBeenCalledTimes(2);
  });
});
