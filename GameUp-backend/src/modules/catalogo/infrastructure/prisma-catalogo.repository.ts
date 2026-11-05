import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  CatalogoRepository,
  Categoria,
  Musica,
  Nivel,
  TipoJuego,
} from '../domain/catalogo.js';
import {
  esCodigoJuego,
  type CodigoJuego,
} from '../domain/juegos/estrategia-juego.js';

function aTipoJuego(f: {
  id: bigint;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}): TipoJuego | null {
  // Un código que el backend no conoce se omite en lugar de romper la lista.
  return esCodigoJuego(f.codigo) ? { ...f, codigo: f.codigo } : null;
}

@Injectable()
export class PrismaCatalogoRepository implements CatalogoRepository {
  constructor(private readonly prisma: PrismaService) {}

  niveles(): Promise<Nivel[]> {
    return this.prisma.nivel.findMany({
      select: { id: true, nombre: true, descripcion: true, orden: true },
      orderBy: { orden: 'asc' },
    });
  }

  async categorias(): Promise<Categoria[]> {
    const filas = await this.prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
    });
    return filas.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      descripcion: f.descripcion,
      iconoUrl: f.icono_url,
    }));
  }

  async tiposJuego(): Promise<TipoJuego[]> {
    const filas = await this.prisma.tipo_juego.findMany({
      orderBy: { id: 'asc' },
    });
    return filas.map(aTipoJuego).filter((t): t is TipoJuego => t !== null);
  }

  async musica(soloActiva: boolean): Promise<Musica[]> {
    const filas = await this.prisma.musica.findMany({
      where: soloActiva ? { activa: true } : {},
      orderBy: { titulo: 'asc' },
    });
    return filas.map((f) => ({
      id: f.id,
      titulo: f.titulo,
      autor: f.autor,
      // musica_tipo_check garantiza CLASICA o INFANTIL.
      tipo: f.tipo as Musica['tipo'],
      urlAudio: f.url_audio,
      activa: f.activa,
    }));
  }

  async existeNivel(id: bigint): Promise<boolean> {
    return (await this.prisma.nivel.count({ where: { id } })) > 0;
  }

  async existeCategoria(id: bigint): Promise<boolean> {
    return (await this.prisma.categoria.count({ where: { id } })) > 0;
  }

  async existeMusicaActiva(id: bigint): Promise<boolean> {
    return (
      (await this.prisma.musica.count({ where: { id, activa: true } })) > 0
    );
  }

  async tipoJuegoPorCodigo(codigo: CodigoJuego): Promise<TipoJuego | null> {
    const fila = await this.prisma.tipo_juego.findUnique({ where: { codigo } });
    return fila ? aTipoJuego(fila) : null;
  }
}
