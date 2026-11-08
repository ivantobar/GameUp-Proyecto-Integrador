import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { crearRolesAltaAutomatica } from './auth.module.js';

const config = (valores: Partial<EnvironmentVariables>) =>
  ({
    get: (clave: keyof EnvironmentVariables) => valores[clave],
  }) as unknown as ConfigService<EnvironmentVariables, true>;

describe('factory ROLES_ALTA_AUTOMATICA', () => {
  it('sin la variable → los cuatro roles', () => {
    expect(crearRolesAltaAutomatica(config({}))).toEqual([
      'ESTUDIANTE',
      'ACUDIENTE',
      'TALLERISTA',
      'DIRECTORA',
    ]);
  });

  it('lista con espacios y repetidos → roles sin repetir', () => {
    expect(
      crearRolesAltaAutomatica(
        config({ ALTA_AUTOMATICA_ROLES: ' ACUDIENTE , ESTUDIANTE,ACUDIENTE' }),
      ),
    ).toEqual(['ACUDIENTE', 'ESTUDIANTE']);
  });

  it('vacía → [] (alta automática apagada)', () => {
    expect(
      crearRolesAltaAutomatica(config({ ALTA_AUTOMATICA_ROLES: '' })),
    ).toEqual([]);
  });
});
