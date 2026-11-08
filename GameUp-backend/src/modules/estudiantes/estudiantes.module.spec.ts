import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { SincronizacionVinculosService } from './application/sincronizacion-vinculos.service.js';
import type { CopiaVinculosRepository } from './domain/vinculos-externos.js';
import {
  crearConsultaEstudianteExterno,
  crearSincronizadorVinculos,
  vinculosEnAsisco,
} from './estudiantes.module.js';
import { ConsultaEstudianteAsiscoUpHttp } from './infrastructure/estudiante-asiscoup-http.js';
import { ConsultaVinculosAsiscoUpHttp } from './infrastructure/vinculos-asiscoup-http.js';

const config = (valores: Partial<EnvironmentVariables>) =>
  ({
    get: (clave: keyof EnvironmentVariables) => valores[clave],
  }) as unknown as ConfigService<EnvironmentVariables, true>;

const copia: CopiaVinculosRepository = {
  estudiantesPorExterno: () => Promise.resolve(new Map()),
  reemplazarDeAcudiente: () => Promise.resolve(),
};

describe('factories de EstudiantesModule (ASISCO UP)', () => {
  describe('SINCRONIZADOR_VINCULOS', () => {
    it('sin ASISCO_API_URL → null (el login no consulta nada)', () => {
      expect(
        crearSincronizadorVinculos(
          config({ ASISCO_API_TIMEOUT_MS: 5000 }),
          copia,
        ),
      ).toBeNull();
    });

    it('URL vacía → null', () => {
      expect(
        crearSincronizadorVinculos(
          config({ ASISCO_API_URL: '', ASISCO_API_TIMEOUT_MS: 5000 }),
          copia,
        ),
      ).toBeNull();
    });

    it('con ASISCO_API_URL → sincronizador con el adaptador HTTP y la copia', () => {
      const s = crearSincronizadorVinculos(
        config({
          ASISCO_API_URL: 'https://asiscoup.test/',
          ASISCO_API_TIMEOUT_MS: 1234,
        }),
        copia,
      );
      expect(s).toBeInstanceOf(SincronizacionVinculosService);
      const servicio = s as SincronizacionVinculosService;
      const consulta = servicio['consulta'] as ConsultaVinculosAsiscoUpHttp;
      expect(consulta).toBeInstanceOf(ConsultaVinculosAsiscoUpHttp);
      expect(consulta['baseUrl']).toBe('https://asiscoup.test');
      expect(consulta['timeoutMs']).toBe(1234);
      expect(servicio['copia']).toBe(copia);
    });
  });

  describe('CONSULTA_ESTUDIANTE_EXTERNO', () => {
    it('sin ASISCO_API_URL (o vacía) → null: el estudiante no se da de alta solo', () => {
      expect(crearConsultaEstudianteExterno(config({}))).toBeNull();
      expect(
        crearConsultaEstudianteExterno(config({ ASISCO_API_URL: '' })),
      ).toBeNull();
    });

    it('con ASISCO_API_URL → adaptador HTTP con su timeout', () => {
      const c = crearConsultaEstudianteExterno(
        config({
          ASISCO_API_URL: 'https://asiscoup.test/',
          ASISCO_API_TIMEOUT_MS: 4321,
        }),
      );
      expect(c).toBeInstanceOf(ConsultaEstudianteAsiscoUpHttp);
      const http = c as ConsultaEstudianteAsiscoUpHttp;
      expect(http['baseUrl']).toBe('https://asiscoup.test');
      expect(http['timeoutMs']).toBe(4321);
    });
  });

  describe('VINCULOS_EN_ASISCO', () => {
    it('sin URL → false (la directora vincula a mano, como antes)', () => {
      expect(vinculosEnAsisco(config({}))).toBe(false);
      expect(vinculosEnAsisco(config({ ASISCO_API_URL: '' }))).toBe(false);
    });

    it('con URL → true (los vínculos son de ASISCO UP)', () => {
      expect(
        vinculosEnAsisco(config({ ASISCO_API_URL: 'https://asiscoup.test' })),
      ).toBe(true);
    });
  });
});
