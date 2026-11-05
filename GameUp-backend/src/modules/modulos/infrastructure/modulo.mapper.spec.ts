import { ModuloMapper } from './modulo.mapper.js';

const creadoEn = new Date('2026-11-05T15:00:00Z');

describe('ModuloMapper', () => {
  it('módulo: fila → entidad → DTO (ids como texto, portada por id)', () => {
    const modulo = ModuloMapper.aModulo(
      {
        id: 3n,
        nombre: 'Vocal A',
        descripcion: null,
        portada_url: 'modulo/3/contenido/x.png',
        publicado: true,
        orden: 0,
        creado_en: creadoEn,
        musica_id: null,
        categoria: { id: 1n, nombre: 'VOCALES' },
        nivel: { id: 1n, nombre: 'BAJO' },
        usuario: { id: 2n, nombres: 'Ana María', apellidos: 'Gómez Ruiz' },
      },
      14n,
    );
    const dto = ModuloMapper.aModuloDto(modulo);
    expect(dto).toEqual({
      id: '3',
      nombre: 'Vocal A',
      descripcion: null,
      categoria: { id: '1', nombre: 'VOCALES' },
      nivel: { id: '1', nombre: 'BAJO' },
      creadoPor: { id: '2', displayName: 'Ana Gómez' },
      musicaId: null,
      portadaContenidoId: '14',
      publicado: true,
      orden: 0,
      creadoEn: '2026-11-05T15:00:00.000Z',
    });
    expect(JSON.stringify(dto)).not.toContain('modulo/3/contenido');
  });

  it('contenido: el DTO nunca trae la ruta de Storage', () => {
    const contenido = ModuloMapper.aContenido({
      id: 14n,
      modulo_id: 3n,
      tipo: 'VIDEO',
      titulo: 'Mira',
      url_recurso: 'modulo/3/contenido/secreto.mp4',
      orden: 2,
    });
    expect(contenido.ruta).toBe('modulo/3/contenido/secreto.mp4');
    const dto = ModuloMapper.aContenidoDto(contenido);
    expect(dto).toEqual({
      id: '14',
      moduloId: '3',
      tipo: 'VIDEO',
      titulo: 'Mira',
      orden: 2,
    });
    expect(JSON.stringify(dto)).not.toContain('secreto');
  });

  it('tipos fuera del catálogo son un error de datos', () => {
    expect(() =>
      ModuloMapper.aContenido({
        id: 1n,
        modulo_id: 1n,
        tipo: 'PDF',
        titulo: 't',
        url_recurso: 'r',
        orden: 0,
      }),
    ).toThrow();
    expect(() =>
      ModuloMapper.aActividad({
        id: 1n,
        modulo_id: 1n,
        titulo: 't',
        instruccion_texto: null,
        configuracion: {},
        orden: 0,
        activa: true,
        tipo_juego: { id: 1n, codigo: 'ROMPECABEZAS', nombre: 'x' },
      }),
    ).toThrow();
  });

  it('actividad, elemento y URLs → DTO', () => {
    const actividad = ModuloMapper.aActividad({
      id: 8n,
      modulo_id: 3n,
      titulo: 'Di la a',
      instruccion_texto: null,
      configuracion: { vocal: 'a' },
      orden: 0,
      activa: true,
      tipo_juego: { id: 5n, codigo: 'HABLA_CONMIGO', nombre: 'Habla conmigo' },
    });
    expect(ModuloMapper.aActividadDto(actividad)).toMatchObject({
      id: '8',
      tipoJuego: { id: '5', codigo: 'HABLA_CONMIGO' },
      configuracion: { vocal: 'a' },
    });
    expect(
      ModuloMapper.aElementoDto({
        contenidoId: 14n,
        rolEnJuego: null,
        orden: 0,
        palabra: 'avión',
        imagenContenidoId: 14n,
        kinemaContenidoId: null,
        audioContenidoId: 16n,
      }),
    ).toEqual({
      contenidoId: '14',
      rolEnJuego: null,
      orden: 0,
      palabra: 'avión',
      imagenContenidoId: '14',
      kinemaContenidoId: null,
      audioContenidoId: '16',
    });
    expect(
      ModuloMapper.aContenidoUrlDto({
        contenidoId: 14n,
        url: { url: 'https://firmada', expiraEn: creadoEn },
      }),
    ).toEqual({
      contenidoId: '14',
      url: 'https://firmada',
      expiraEn: '2026-11-05T15:00:00.000Z',
    });
  });
});
