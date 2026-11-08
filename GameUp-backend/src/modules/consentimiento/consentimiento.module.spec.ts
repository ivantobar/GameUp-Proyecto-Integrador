import type { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { crearConsultaConsentimiento } from './consentimiento.module.js';
import { ConsultaConsentimientoAsiscoUpHttp } from './infrastructure/consentimiento-asiscoup-http.js';
import {
  ConsultaConsentimientoNoDisponible,
  ConsultaConsentimientoSimulada,
} from './infrastructure/consultas-consentimiento.js';

const config = (valores: Partial<EnvironmentVariables>) =>
  ({
    get: (clave: keyof EnvironmentVariables) => valores[clave],
  }) as unknown as ConfigService<EnvironmentVariables, true>;

describe('crearConsultaConsentimiento (factory de ConsentimientoModule)', () => {
  it('sin ASISCO_API_URL → no disponible (falla cerrado)', () => {
    const c = crearConsultaConsentimiento(
      config({ CONSENTIMIENTO_SIMULADO: false, ASISCO_API_TIMEOUT_MS: 5000 }),
    );
    expect(c).toBeInstanceOf(ConsultaConsentimientoNoDisponible);
  });

  it('URL vacía → no disponible', () => {
    const c = crearConsultaConsentimiento(
      config({ ASISCO_API_URL: '', ASISCO_API_TIMEOUT_MS: 5000 }),
    );
    expect(c).toBeInstanceOf(ConsultaConsentimientoNoDisponible);
  });

  it('con ASISCO_API_URL → adaptador HTTP con la URL y el tiempo de espera', () => {
    const c = crearConsultaConsentimiento(
      config({
        CONSENTIMIENTO_SIMULADO: false,
        ASISCO_API_URL: 'https://asiscoup.test/',
        ASISCO_API_TIMEOUT_MS: 1234,
      }),
    );
    expect(c).toBeInstanceOf(ConsultaConsentimientoAsiscoUpHttp);
    const http = c as ConsultaConsentimientoAsiscoUpHttp;
    expect(http['baseUrl']).toBe('https://asiscoup.test');
    expect(http['timeoutMs']).toBe(1234);
  });

  it('CONSENTIMIENTO_SIMULADO=true gana aunque haya URL (solo desarrollo)', () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const c = crearConsultaConsentimiento(
      config({
        CONSENTIMIENTO_SIMULADO: true,
        ASISCO_API_URL: 'https://asiscoup.test',
        ASISCO_API_TIMEOUT_MS: 5000,
      }),
    );
    expect(c).toBeInstanceOf(ConsultaConsentimientoSimulada);
    vi.restoreAllMocks();
  });
});
