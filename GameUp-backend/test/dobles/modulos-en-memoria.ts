import { readFile } from 'node:fs/promises';
import type {
  AlmacenArchivos,
  Bucket,
  UrlFirmada,
} from '../../src/common/almacenamiento/almacen-archivos.js';
import { ServicioExternoNoDisponibleError } from '../../src/common/errors/dominio.errors.js';
import { saltar } from '../../src/common/paginacion/paginacion.js';
import type {
  CatalogoRepository,
  Categoria,
  Musica,
  Nivel,
  TipoJuego,
} from '../../src/modules/catalogo/domain/catalogo.js';
import { CODIGOS_JUEGO } from '../../src/modules/catalogo/domain/juegos/estrategia-juego.js';
import {
  Modulo,
  type Actividad,
  type Contenido,
  type ElementoActividad,
} from '../../src/modules/modulos/domain/modulo.entity.js';
import type {
  ActividadRepository,
  ContenidoRepository,
  ModuloRepository,
} from '../../src/modules/modulos/domain/modulo.repository.js';
import type { EstudiantesEnMemoria } from './estudiantes-en-memoria.js';
import type { UsuariosEnMemoria } from './usuarios-en-memoria.js';

export const AHORA_PRUEBA = new Date('2026-11-05T15:00:00Z');

// ─── Catálogo ───────────────────────────────────────────────────────────────

/** Mismo catálogo que cargan las migraciones (ids 1..n). */
export class CatalogoEnMemoria implements CatalogoRepository {
  readonly nivelesFijos: Nivel[] = [
    { id: 1n, nombre: 'BAJO', descripcion: 'Poco desarrollo', orden: 1 },
    { id: 2n, nombre: 'MEDIO', descripcion: 'Desarrollo notable', orden: 2 },
    { id: 3n, nombre: 'ALTO', descripcion: 'Autonomía considerable', orden: 3 },
  ];
  readonly categoriasFijas: Categoria[] = [
    {
      id: 1n,
      nombre: 'VOCALES',
      descripcion: 'Vocales con el Método Ventura',
      iconoUrl: null,
    },
    {
      id: 2n,
      nombre: 'PRAXIAS',
      descripcion: 'Praxias buco-linguo-faciales',
      iconoUrl: null,
    },
  ];
  readonly tipos: TipoJuego[] = CODIGOS_JUEGO.map((codigo, i) => ({
    id: BigInt(i + 1),
    codigo,
    nombre: codigo,
    descripcion: null,
  }));
  readonly canciones: Musica[] = [
    {
      id: 1n,
      titulo: 'Canon',
      autor: 'Pachelbel',
      tipo: 'CLASICA',
      urlAudio: 'https://musica.test/1.mp3',
      activa: true,
    },
    {
      id: 2n,
      titulo: 'Vieja',
      autor: null,
      tipo: 'INFANTIL',
      urlAudio: 'https://musica.test/2.mp3',
      activa: false,
    },
  ];

  async niveles() {
    return this.nivelesFijos;
  }
  async categorias() {
    return this.categoriasFijas;
  }
  async tiposJuego() {
    return this.tipos;
  }
  async musica(soloActiva: boolean) {
    return this.canciones.filter((m) => !soloActiva || m.activa);
  }
  async existeNivel(id: bigint) {
    return this.nivelesFijos.some((n) => n.id === id);
  }
  async existeCategoria(id: bigint) {
    return this.categoriasFijas.some((c) => c.id === id);
  }
  async existeMusicaActiva(id: bigint) {
    return this.canciones.some((m) => m.id === id && m.activa);
  }
  async tipoJuegoPorCodigo(codigo: string) {
    return this.tipos.find((t) => t.codigo === codigo) ?? null;
  }
}

// ─── Almacenamiento ─────────────────────────────────────────────────────────

/** Storage en memoria: guarda los bytes y firma URLs falsas. */
export class AlmacenEnMemoria implements AlmacenArchivos {
  readonly archivos = new Map<string, { bytes: Buffer; tipoMime: string }>();
  readonly eliminados: string[] = [];
  /** true: todas las operaciones responden 503 (Storage caído). */
  caido = false;

  private clave(bucket: Bucket, ruta: string) {
    return `${bucket}/${ruta}`;
  }

  private revisar() {
    if (this.caido)
      throw new ServicioExternoNoDisponibleError('Storage caído (prueba).');
  }

  /** Lee el archivo local (como hace el adaptador real con un stream). */
  async subir(
    bucket: Bucket,
    ruta: string,
    archivoLocal: string,
    tipoMime: string,
  ) {
    this.revisar();
    this.archivos.set(this.clave(bucket, ruta), {
      bytes: await readFile(archivoLocal),
      tipoMime,
    });
  }

  /** Deja un archivo en Storage directamente (preparar escenarios). */
  guardar(bucket: Bucket, ruta: string, bytes: Buffer, tipoMime: string): void {
    this.archivos.set(this.clave(bucket, ruta), { bytes, tipoMime });
  }

  async urlsFirmadas(bucket: Bucket, rutas: string[], segundos: number) {
    this.revisar();
    const expiraEn = new Date(AHORA_PRUEBA.getTime() + segundos * 1000);
    const resultado = new Map<string, UrlFirmada>();
    for (const ruta of rutas) {
      if (this.archivos.has(this.clave(bucket, ruta))) {
        resultado.set(ruta, {
          url: `https://almacen.test/${bucket}/${ruta}?firma=ok`,
          expiraEn,
        });
      }
    }
    return resultado;
  }

  async eliminar(bucket: Bucket, rutas: string[]) {
    this.revisar();
    for (const ruta of rutas) {
      this.archivos.delete(this.clave(bucket, ruta));
      this.eliminados.push(this.clave(bucket, ruta));
    }
  }

  /** Rutas guardadas en un bucket. */
  rutas(bucket: Bucket): string[] {
    return [...this.archivos.keys()]
      .filter((k) => k.startsWith(`${bucket}/`))
      .map((k) => k.slice(bucket.length + 1));
  }
}

// ─── Módulos, contenidos y actividades ──────────────────────────────────────

interface FilaModulo {
  id: bigint;
  categoriaId: bigint;
  nivelId: bigint;
  creadoPor: bigint;
  musicaId: bigint | null;
  nombre: string;
  descripcion: string | null;
  portadaContenidoId: bigint | null;
  publicado: boolean;
  orden: number;
}

export interface ModuloInicial {
  id: number;
  creadoPor: number;
  publicado?: boolean;
  nombre?: string;
  categoriaId?: number;
  nivelId?: number;
}

/**
 * Los tres puertos del agregado en memoria. Las asignaciones (fase 5) se
 * simulan con `asignar(moduloId, estudianteId)`; el alcance de cada persona
 * sale de EstudiantesEnMemoria.
 */
export class ModulosEnMemoria {
  readonly modulos: FilaModulo[] = [];
  readonly contenidos: Contenido[] = [];
  readonly actividades: Actividad[] = [];
  readonly elementosPorActividad = new Map<bigint, ElementoActividad[]>();
  readonly asignaciones: Array<{ moduloId: bigint; estudianteId: bigint }> = [];
  readonly actividadesConIntentos = new Set<bigint>();
  private siguiente = 100n;

  readonly moduloRepo: ModuloRepository;
  readonly contenidoRepo: ContenidoRepository;
  readonly actividadRepo: ActividadRepository;

  constructor(
    private readonly usuarios: UsuariosEnMemoria,
    private readonly estudiantes: EstudiantesEnMemoria,
    private readonly catalogo: CatalogoEnMemoria,
    iniciales: ModuloInicial[] = [],
  ) {
    for (const m of iniciales) {
      this.modulos.push({
        id: BigInt(m.id),
        categoriaId: BigInt(m.categoriaId ?? 1),
        nivelId: BigInt(m.nivelId ?? 1),
        creadoPor: BigInt(m.creadoPor),
        musicaId: null,
        nombre: m.nombre ?? `Módulo ${m.id}`,
        descripcion: null,
        portadaContenidoId: null,
        publicado: m.publicado ?? false,
        orden: 0,
      });
    }
    this.moduloRepo = this.crearModuloRepo();
    this.contenidoRepo = this.crearContenidoRepo();
    this.actividadRepo = this.crearActividadRepo();
  }

  private id(): bigint {
    return this.siguiente++;
  }

  asignar(moduloId: number, estudianteId: number): void {
    this.asignaciones.push({
      moduloId: BigInt(moduloId),
      estudianteId: BigInt(estudianteId),
    });
  }

  /** Agrega un contenido ya subido (sin pasar por Storage). */
  agregarContenido(
    moduloId: number,
    tipo: Contenido['tipo'],
    titulo = 'Contenido',
  ): Contenido {
    const c: Contenido = {
      id: this.id(),
      moduloId: BigInt(moduloId),
      tipo,
      titulo,
      ruta: `modulo/${moduloId}/contenido/fijo-${this.siguiente}.bin`,
      orden: 0,
    };
    this.contenidos.push(c);
    return c;
  }

  agregarActividad(
    moduloId: number,
    codigo: Actividad['tipoJuego']['codigo'] = 'MEMORIA',
    activa = true,
  ): Actividad {
    const tipo = this.catalogo.tipos.find((t) => t.codigo === codigo)!;
    const a: Actividad = {
      id: this.id(),
      moduloId: BigInt(moduloId),
      tipoJuego: { id: tipo.id, codigo: tipo.codigo, nombre: tipo.nombre },
      titulo: 'Actividad',
      instruccionTexto: null,
      configuracion: codigo === 'HABLA_CONMIGO' ? { vocal: 'a' } : {},
      orden: 0,
      activa,
    };
    this.actividades.push(a);
    return a;
  }

  private aModulo(f: FilaModulo): Modulo {
    const persona = this.usuarios.todos().find((u) => u.id === f.creadoPor)!;
    return new Modulo({
      id: f.id,
      categoria: this.ref(this.catalogo.categoriasFijas, f.categoriaId),
      nivel: this.ref(this.catalogo.nivelesFijos, f.nivelId),
      creadoPor: {
        id: persona.id,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
      },
      musicaId: f.musicaId,
      nombre: f.nombre,
      descripcion: f.descripcion,
      portadaContenidoId: f.portadaContenidoId,
      publicado: f.publicado,
      orden: f.orden,
      creadoEn: AHORA_PRUEBA,
    });
  }

  private ref(lista: Array<{ id: bigint; nombre: string }>, id: bigint) {
    const item = lista.find((x) => x.id === id)!;
    return { id: item.id, nombre: item.nombre };
  }

  private fila(id: bigint): FilaModulo {
    const f = this.modulos.find((m) => m.id === id);
    if (!f) throw new Error('No existe el módulo');
    return f;
  }

  private crearModuloRepo(): ModuloRepository {
    return {
      buscarPorId: async (id) => {
        const f = this.modulos.find((m) => m.id === id);
        return f ? this.aModulo(f) : null;
      },
      listar: async (visibilidad, filtro, p) => {
        const items = this.modulos
          .filter(
            (m) =>
              visibilidad.tipo === 'todos' ||
              m.publicado ||
              m.creadoPor === visibilidad.talleristaId,
          )
          .filter(
            (m) =>
              filtro.categoriaId === null ||
              m.categoriaId === filtro.categoriaId,
          )
          .filter(
            (m) => filtro.nivelId === null || m.nivelId === filtro.nivelId,
          )
          .filter(
            (m) =>
              filtro.publicado === null || m.publicado === filtro.publicado,
          )
          .sort((a, b) => a.orden - b.orden || Number(a.id - b.id))
          .map((m) => this.aModulo(m));
        const inicio = saltar(p);
        return {
          items: items.slice(inicio, inicio + p.limit),
          total: items.length,
          ...p,
        };
      },
      crear: async (d, creadoPor) => {
        const f: FilaModulo = {
          id: this.id(),
          ...d,
          creadoPor,
          portadaContenidoId: null,
          publicado: false,
        };
        this.modulos.push(f);
        return this.aModulo(f);
      },
      actualizar: async (id, c) => {
        const f = this.fila(id);
        if (c.categoriaId !== null) f.categoriaId = c.categoriaId;
        if (c.nivelId !== null) f.nivelId = c.nivelId;
        if (c.nombre !== null) f.nombre = c.nombre;
        if (c.orden !== null) f.orden = c.orden;
        if (c.musicaId !== null)
          f.musicaId = c.musicaId === 'borrar' ? null : c.musicaId;
        if (c.descripcion !== null)
          f.descripcion = c.descripcion === 'borrar' ? null : c.descripcion;
        if (c.portadaContenidoId !== null) {
          f.portadaContenidoId =
            c.portadaContenidoId === 'borrar' ? null : c.portadaContenidoId;
        }
        return this.aModulo(f);
      },
      cambiarPublicado: async (id, publicado) => {
        const f = this.fila(id);
        f.publicado = publicado;
        return this.aModulo(f);
      },
      eliminar: async (id) => {
        this.modulos.splice(this.modulos.indexOf(this.fila(id)), 1);
        const contenidos = this.contenidos.filter((c) => c.moduloId === id);
        for (const c of contenidos)
          this.contenidos.splice(this.contenidos.indexOf(c), 1);
        const actividades = this.actividades.filter((a) => a.moduloId === id);
        for (const a of actividades)
          this.actividades.splice(this.actividades.indexOf(a), 1);
      },
      tieneAsignaciones: async (id) =>
        this.asignaciones.some((a) => a.moduloId === id),
      contarActividadesActivas: async (id) =>
        this.actividades.filter((a) => a.moduloId === id && a.activa).length,
      asignadoEnAlcance: async (alcance, moduloId) => {
        for (const a of this.asignaciones.filter(
          (x) => x.moduloId === moduloId,
        )) {
          if (await this.estudiantes.estaEnAlcance(alcance, a.estudianteId))
            return true;
        }
        return false;
      },
    };
  }

  private crearContenidoRepo(): ContenidoRepository {
    return {
      listar: async (moduloId) =>
        this.contenidos
          .filter((c) => c.moduloId === moduloId)
          .sort((a, b) => a.orden - b.orden || Number(a.id - b.id)),
      buscarPorId: async (id) =>
        this.contenidos.find((c) => c.id === id) ?? null,
      crear: async (d) => {
        const c: Contenido = { id: this.id(), ...d };
        this.contenidos.push(c);
        return c;
      },
      actualizar: async (id, cambios) => {
        const c = this.contenidos.find((x) => x.id === id)!;
        const nuevo = {
          ...c,
          titulo: cambios.titulo ?? c.titulo,
          orden: cambios.orden ?? c.orden,
        };
        this.contenidos.splice(this.contenidos.indexOf(c), 1, nuevo);
        return nuevo;
      },
      eliminar: async (id) => {
        const i = this.contenidos.findIndex((c) => c.id === id);
        this.contenidos.splice(i, 1);
      },
      estaEnUso: async (contenido) => {
        const enActividades = [...this.elementosPorActividad.values()]
          .flat()
          .some((e) =>
            [
              e.contenidoId,
              e.imagenContenidoId,
              e.kinemaContenidoId,
              e.audioContenidoId,
            ].includes(contenido.id),
          );
        const esPortada = this.modulos.some(
          (m) => m.portadaContenidoId === contenido.id,
        );
        return enActividades || esPortada;
      },
    };
  }

  private crearActividadRepo(): ActividadRepository {
    const buscar = (id: bigint) =>
      this.actividades.find((a) => a.id === id) ?? null;
    return {
      listar: async (moduloId, soloActivas) =>
        this.actividades
          .filter((a) => a.moduloId === moduloId && (!soloActivas || a.activa))
          .sort((a, b) => a.orden - b.orden || Number(a.id - b.id)),
      buscarPorId: async (id) => buscar(id),
      elementos: async (id) => this.elementosPorActividad.get(id) ?? [],
      crear: async (moduloId, d) => {
        const tipo = this.catalogo.tipos.find((t) => t.id === d.tipoJuegoId)!;
        const a: Actividad = {
          id: this.id(),
          moduloId,
          tipoJuego: { id: tipo.id, codigo: tipo.codigo, nombre: tipo.nombre },
          titulo: d.titulo,
          instruccionTexto: d.instruccionTexto,
          configuracion: d.configuracion,
          orden: d.orden,
          activa: d.activa,
        };
        this.actividades.push(a);
        return a;
      },
      actualizar: async (id, c) => {
        const a = buscar(id)!;
        const nueva: Actividad = {
          ...a,
          titulo: c.titulo ?? a.titulo,
          configuracion: c.configuracion ?? a.configuracion,
          orden: c.orden ?? a.orden,
          activa: c.activa ?? a.activa,
          instruccionTexto:
            c.instruccionTexto === null
              ? a.instruccionTexto
              : c.instruccionTexto === 'borrar'
                ? null
                : c.instruccionTexto,
        };
        this.actividades.splice(this.actividades.indexOf(a), 1, nueva);
        return nueva;
      },
      eliminar: async (id) => {
        this.actividades.splice(this.actividades.indexOf(buscar(id)!), 1);
        this.elementosPorActividad.delete(id);
      },
      tieneIntentos: async (id) => this.actividadesConIntentos.has(id),
      reemplazarElementos: async (id, elementos) => {
        this.elementosPorActividad.set(id, [...elementos]);
        return elementos;
      },
    };
  }
}
