import {
  ACUDIENTE_4,
  ACUDIENTE_5,
  ESTUDIANTE_10,
  escenarioEstudiantes,
} from '../../../../test/dobles/escenario-estudiantes.js';
import { RecursoNoEncontradoError } from '../../../common/errors/dominio.errors.js';
import { RelojFijo } from '../../../common/reloj/reloj.js';
import { AccesoEstudianteService } from '../../estudiantes/application/acceso-estudiante.service.js';
import type { ConsultaConsentimiento } from '../domain/consulta-consentimiento.js';
import {
  ConsultaConsentimientoNoDisponible,
  ConsultaConsentimientoSimulada,
} from '../infrastructure/consultas-consentimiento.js';
import { ConsentimientoService } from './consentimiento.service.js';

const AHORA = new Date('2026-11-05T15:00:00Z');

function crear(consulta: ConsultaConsentimiento) {
  const { estudiantes } = escenarioEstudiantes();
  const servicio = new ConsentimientoService(
    consulta,
    new RelojFijo(AHORA),
    new AccesoEstudianteService(estudiantes),
  );
  vi.spyOn(servicio['logger'], 'warn').mockImplementation(() => undefined);
  return servicio;
}

describe('ConsentimientoService (fallar cerrado)', () => {
  it('API del núcleo familiar no disponible → no concedido (NO_VERIFICABLE)', async () => {
    const servicio = crear(new ConsultaConsentimientoNoDisponible());
    await expect(servicio.consultarVoz(ESTUDIANTE_10, 10n)).resolves.toEqual({
      concedido: false,
      motivo: 'NO_VERIFICABLE',
      codigoVersion: null,
      verificadoEn: AHORA,
    });
  });

  it('consentimiento aceptado → concedido, con su versión de términos', async () => {
    const servicio = crear(new ConsultaConsentimientoSimulada());
    await expect(
      servicio.consultarVoz(ACUDIENTE_4, 10n),
    ).resolves.toMatchObject({
      concedido: true,
      motivo: 'ACEPTADO',
      codigoVersion: 'SIMULADO-DEV',
    });
  });

  it.each([
    ['sin consentimiento', null],
    ['no aceptado', { aceptaTratamiento: false, codigoVersion: 'v2' }],
  ])('%s → no concedido (NO_ACEPTADO)', async (_caso, respuesta) => {
    const servicio = crear({ vigente: async () => respuesta });
    await expect(
      servicio.consultarVoz(ESTUDIANTE_10, 10n),
    ).resolves.toMatchObject({
      concedido: false,
      motivo: 'NO_ACEPTADO',
    });
  });

  it('pregunta por el id_usuario central del estudiante y su id de ASISCO UP', async () => {
    const vigente = vi.fn(async () => null);
    await crear({ vigente }).consultarVoz(ESTUDIANTE_10, 10n, 'jwt');
    // Estudiante 10: id_usuario_auth 1000, idEstudianteExterno 10000, con el
    // token de quien consulta.
    expect(vigente).toHaveBeenCalledWith(
      { idUsuarioAuth: 1000n, idEstudianteExterno: 10000n },
      'jwt',
    );
  });

  it('estudiante ajeno → 404 sin consultar la API', async () => {
    const vigente = vi.fn(async () => null);
    await expect(
      crear({ vigente }).consultarVoz(ACUDIENTE_5, 10n),
    ).rejects.toThrow(RecursoNoEncontradoError);
    expect(vigente).not.toHaveBeenCalled();
  });

  it('un error inesperado no se disfraza de "no verificable"', async () => {
    const servicio = crear({
      vigente: async () => {
        throw new Error('error de programación');
      },
    });
    await expect(servicio.consultarVoz(ESTUDIANTE_10, 10n)).rejects.toThrow(
      'error de programación',
    );
  });
});
