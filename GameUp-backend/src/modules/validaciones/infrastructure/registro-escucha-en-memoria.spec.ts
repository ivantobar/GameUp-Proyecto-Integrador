import { RelojFijo } from '../../../common/reloj/reloj.js';
import {
  MAXIMO_MARCAS_ESCUCHA,
  RegistroEscuchaEnMemoria,
} from './registro-escucha-en-memoria.js';

describe('RegistroEscuchaEnMemoria', () => {
  let reloj: RelojFijo;
  let registro: RegistroEscuchaEnMemoria;

  beforeEach(() => {
    reloj = new RelojFijo(new Date('2026-11-05T15:00:00Z'));
    registro = new RegistroEscuchaEnMemoria(reloj);
  });

  it('recuerda quién pidió qué audio', async () => {
    await registro.marcar(2n, 41n);
    expect(await registro.escucho(2n, 41n)).toBe(true);
    expect(await registro.escucho(3n, 41n)).toBe(false);
    expect(await registro.escucho(2n, 42n)).toBe(false);
  });

  it('vence a las 12 horas; volver a pedirlo la renueva', async () => {
    await registro.marcar(2n, 41n);
    reloj.avanzar(11 * 60 * 60 * 1000);
    await registro.marcar(2n, 41n);
    reloj.avanzar(11 * 60 * 60 * 1000);
    expect(await registro.escucho(2n, 41n)).toBe(true);
    reloj.avanzar(60 * 60 * 1000 + 1);
    expect(await registro.escucho(2n, 41n)).toBe(false);
  });

  it('olvidar borra las marcas del intento de todos los validadores', async () => {
    await registro.marcar(1n, 41n);
    await registro.marcar(2n, 41n);
    await registro.marcar(2n, 141n);
    await registro.olvidar(41n);
    expect(await registro.escucho(1n, 41n)).toBe(false);
    expect(await registro.escucho(2n, 41n)).toBe(false);
    expect(await registro.escucho(2n, 141n)).toBe(true);
  });

  it('con el tope lleno descarta la más antigua', async () => {
    for (let i = 1; i <= MAXIMO_MARCAS_ESCUCHA + 1; i++) {
      await registro.marcar(2n, BigInt(i));
    }
    expect(await registro.escucho(2n, 1n)).toBe(false);
    expect(await registro.escucho(2n, 2n)).toBe(true);
    expect(await registro.escucho(2n, BigInt(MAXIMO_MARCAS_ESCUCHA + 1))).toBe(
      true,
    );
  });
});
