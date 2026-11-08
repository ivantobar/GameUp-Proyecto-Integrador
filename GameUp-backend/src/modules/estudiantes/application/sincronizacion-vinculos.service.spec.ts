import { ServicioExternoNoDisponibleError } from '../../../common/errors/dominio.errors.js';
import type {
  ConsultaVinculos,
  CopiaVinculosRepository,
  VinculoLocal,
  VinculosDeAcudiente,
} from '../domain/vinculos-externos.js';
import { SincronizacionVinculosService } from './sincronizacion-vinculos.service.js';

class CopiaFalsa implements CopiaVinculosRepository {
  reemplazos: Array<{ acudienteId: bigint; vinculos: VinculoLocal[] }> = [];
  /** idEstudianteExterno → estudiante de GameUP */
  constructor(private readonly locales: Map<bigint, bigint>) {}
  estudiantesPorExterno(externos: bigint[]) {
    return Promise.resolve(
      new Map(
        externos
          .filter((e) => this.locales.has(e))
          .map((e) => [e, this.locales.get(e)!] as const),
      ),
    );
  }
  reemplazarDeAcudiente(acudienteId: bigint, vinculos: VinculoLocal[]) {
    this.reemplazos.push({ acudienteId, vinculos });
    return Promise.resolve();
  }
}

describe('SincronizacionVinculosService', () => {
  const ACUDIENTE = { id: 4n, idUsuarioAuth: 15n };
  let copia: CopiaFalsa;
  let respuesta: VinculosDeAcudiente | Error;
  const consulta: ConsultaVinculos = {
    deAcudiente: () =>
      respuesta instanceof Error
        ? Promise.reject(respuesta)
        : Promise.resolve(respuesta),
  };
  const crear = () => {
    const s = new SincronizacionVinculosService(consulta, copia);
    vi.spyOn(s['logger'], 'warn').mockImplementation(() => undefined);
    return s;
  };

  beforeEach(() => {
    copia = new CopiaFalsa(new Map([[12n, 5n]]));
    respuesta = {
      idUsuarioAuth: 15n,
      estudiantes: [
        { idEstudianteExterno: 12n, parentesco: 'Madre', esPrincipal: true },
        { idEstudianteExterno: 99n, parentesco: 'Tía', esPrincipal: false },
      ],
    };
  });

  it('guarda los vínculos de estudiantes habilitados en GameUP e ignora los demás', async () => {
    await crear().sincronizarAcudiente(ACUDIENTE, 'tok');
    expect(copia.reemplazos).toEqual([
      {
        acudienteId: 4n,
        vinculos: [
          { estudianteId: 5n, parentesco: 'Madre', esPrincipal: true },
        ],
      },
    ]);
  });

  it('lista vacía en ASISCO UP → deja al acudiente sin vínculos', async () => {
    respuesta = { idUsuarioAuth: 15n, estudiantes: [] };
    await crear().sincronizarAcudiente(ACUDIENTE, 'tok');
    expect(copia.reemplazos).toEqual([{ acudienteId: 4n, vinculos: [] }]);
  });

  it('ASISCO UP responde por otro usuario → no toca nada', async () => {
    respuesta = { idUsuarioAuth: 16n, estudiantes: [] };
    await crear().sincronizarAcudiente(ACUDIENTE, 'tok');
    expect(copia.reemplazos).toEqual([]);
  });

  it('ASISCO UP no responde → lanza y no toca nada', async () => {
    respuesta = new ServicioExternoNoDisponibleError('x');
    await expect(
      crear().sincronizarAcudiente(ACUDIENTE, 'tok'),
    ).rejects.toBeInstanceOf(ServicioExternoNoDisponibleError);
    expect(copia.reemplazos).toEqual([]);
  });
});
