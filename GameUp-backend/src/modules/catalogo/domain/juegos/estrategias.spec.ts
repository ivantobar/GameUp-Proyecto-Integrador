import { ReglaNegocioError } from '../../../../common/errors/dominio.errors.js';
import { RegistroJuegosService } from '../../application/registro-juegos.service.js';
import { CODIGOS_JUEGO } from './estrategia-juego.js';
import { estrategiasDelMvp } from './estrategias.js';

describe('estrategias por tipo de juego', () => {
  const registro = new RegistroJuegosService(estrategiasDelMvp());

  it('hay una estrategia para cada juego del MVP', () => {
    for (const codigo of CODIGOS_JUEGO) {
      expect(registro.estrategia(codigo).codigo).toBe(codigo);
    }
  });

  it('un código desconocido → 422', () => {
    expect(() => registro.estrategia('AJEDREZ')).toThrow(
      'El tipo de juego AJEDREZ no está disponible.',
    );
  });

  describe('HABLA_CONMIGO', () => {
    const habla = registro.estrategia('HABLA_CONMIGO');

    it.each(['a', 'e', 'i', 'o', 'u'])('acepta la vocal %s', (vocal) => {
      expect(habla.validarConfiguracion({ vocal })).toEqual({ vocal });
    });

    it.each([{}, { vocal: 'b' }, { vocal: 'A' }, { vocal: 1 }])(
      'rechaza %j',
      (config) => {
        expect(() => habla.validarConfiguracion(config)).toThrow(
          ReglaNegocioError,
        );
      },
    );

    it('rechaza claves de más', () => {
      expect(() =>
        habla.validarConfiguracion({ vocal: 'a', puntaje: 3 }),
      ).toThrow('La configuración de HABLA_CONMIGO no admite: puntaje.');
    });
  });

  it.each([
    'EMPAREJAR',
    'CLASIFICAR',
    'SECUENCIAR',
    'MEMORIA',
    'BUSCA_LA_BOCA',
  ])('%s: por ahora solo acepta {}', (codigo) => {
    const estrategia = registro.estrategia(codigo);
    expect(estrategia.validarConfiguracion({})).toEqual({});
    expect(() => estrategia.validarConfiguracion({ rondas: [] })).toThrow(
      ReglaNegocioError,
    );
  });
});
