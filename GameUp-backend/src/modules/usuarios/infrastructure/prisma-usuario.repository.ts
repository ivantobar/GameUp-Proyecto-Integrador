import { Injectable } from '@nestjs/common';
import {
  saltar,
  type Pagina,
  type Paginacion,
} from '../../../common/paginacion/paginacion.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { CopiaExterna } from '../domain/copia-externa.js';
import type { DatosNuevoUsuario } from '../domain/nuevo-usuario.js';
import type { Usuario } from '../domain/usuario.entity.js';
import type {
  CampoUnico,
  FiltroUsuarios,
  NivelConsulta,
  ResultadoCambioActivo,
  UsuarioEscrituraRepository,
  UsuarioLecturaRepository,
} from '../domain/usuario.repository.js';
import { SELECCION_USUARIO, UsuarioMapper } from './usuario.mapper.js';

@Injectable()
export class PrismaUsuarioRepository
  implements UsuarioLecturaRepository, UsuarioEscrituraRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: bigint): Promise<Usuario | null> {
    const fila = await this.prisma.usuario.findUnique({
      where: { id },
      select: SELECCION_USUARIO,
    });
    return fila ? UsuarioMapper.aEntidad(fila) : null;
  }

  async listar(
    filtro: FiltroUsuarios,
    paginacion: Paginacion,
  ): Promise<Pagina<Usuario>> {
    const where: Prisma.usuarioWhereInput = {};
    if (filtro.rol !== null) where.rol = { nombre: filtro.rol };
    if (filtro.activo !== null) where.activo = filtro.activo;

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        select: SELECCION_USUARIO,
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }, { id: 'asc' }],
        skip: saltar(paginacion),
        take: paginacion.limit,
      }),
      this.prisma.usuario.count({ where }),
    ]);
    return { items: filas.map(UsuarioMapper.aEntidad), total, ...paginacion };
  }

  async camposEnUso(datos: DatosNuevoUsuario): Promise<CampoUnico[]> {
    const condiciones: Prisma.usuarioWhereInput[] = [
      { id_usuario_auth: datos.idUsuarioAuth },
    ];
    if (datos.correo) {
      condiciones.push({
        correo: { equals: datos.correo, mode: 'insensitive' },
      });
    }
    if (datos.idAcudienteExterno !== null) {
      condiciones.push({ id_acudiente_externo: datos.idAcudienteExterno });
    }
    if (datos.idEstudianteExterno !== null) {
      condiciones.push({
        estudiante: { id_estudiante_externo: datos.idEstudianteExterno },
      });
    }

    const filas = await this.prisma.usuario.findMany({
      where: { OR: condiciones },
      select: {
        id_usuario_auth: true,
        correo: true,
        id_acudiente_externo: true,
        estudiante: { select: { id_estudiante_externo: true } },
      },
      take: 10,
    });

    const enUso = new Set<CampoUnico>();
    for (const f of filas) {
      if (f.id_usuario_auth === datos.idUsuarioAuth) enUso.add('idUsuarioAuth');
      if (datos.correo && f.correo?.toLowerCase() === datos.correo)
        enUso.add('correo');
      if (
        datos.idAcudienteExterno !== null &&
        f.id_acudiente_externo === datos.idAcudienteExterno
      ) {
        enUso.add('idAcudienteExterno');
      }
      if (
        datos.idEstudianteExterno !== null &&
        f.estudiante?.id_estudiante_externo === datos.idEstudianteExterno
      ) {
        enUso.add('idEstudianteExterno');
      }
    }
    return [...enUso];
  }

  async crear(
    datos: DatosNuevoUsuario & { nivelId: bigint | null },
  ): Promise<Usuario> {
    // Escritura anidada: Prisma crea usuario y estudiante en una transacción.
    // El trigger trg_rol_estudiante confirma que el rol sea ESTUDIANTE.
    const fila = await this.prisma.usuario.create({
      data: {
        rol: { connect: { nombre: datos.rol } },
        id_usuario_auth: datos.idUsuarioAuth,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        correo: datos.correo,
        id_acudiente_externo: datos.idAcudienteExterno,
        ...(datos.rol === 'ESTUDIANTE' &&
        datos.idEstudianteExterno !== null &&
        datos.nivelId !== null
          ? {
              estudiante: {
                create: {
                  id_estudiante_externo: datos.idEstudianteExterno,
                  nivel: { connect: { id: datos.nivelId } },
                },
              },
            }
          : {}),
      },
      select: SELECCION_USUARIO,
    });
    return UsuarioMapper.aEntidad(fila);
  }

  async cambiarActivo(
    id: bigint,
    activo: boolean,
  ): Promise<ResultadoCambioActivo> {
    const cambiado = await this.prisma.$transaction(async (tx) => {
      if (!activo) {
        // Bloquea las filas de las directoras activas hasta el commit. Si dos
        // directoras se desactivan entre sí a la vez, la segunda espera, vuelve
        // a leer (READ COMMITTED) y ve que ya solo queda una.
        const activas = await tx.$queryRaw<Array<{ id: bigint }>>`
          select u.id
            from public.usuario u
            join public.rol r on r.id = u.rol_id
           where r.nombre = 'DIRECTORA' and u.activo
             for update of u`;
        const esDirectoraActiva = activas.some((d) => d.id === id);
        if (esDirectoraActiva && activas.length <= 1) {
          return 'ultima_directora' as const;
        }
      }
      const { count } = await tx.usuario.updateMany({
        where: { id },
        data: { activo },
      });
      return count === 0 ? ('no_existe' as const) : ('ok' as const);
    });

    if (cambiado !== 'ok') return { tipo: cambiado };
    const usuario = await this.buscarPorId(id);
    return usuario ? { tipo: 'ok', usuario } : { tipo: 'no_existe' };
  }

  async sincronizarCopia(
    id: bigint,
    copia: CopiaExterna,
    ahora: Date,
  ): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: { ...copia, ultimo_acceso: ahora, sincronizado_en: ahora },
    });
  }
}

@Injectable()
export class PrismaNivelConsulta implements NivelConsulta {
  constructor(private readonly prisma: PrismaService) {}

  async existe(id: bigint): Promise<boolean> {
    return (await this.prisma.nivel.count({ where: { id } })) > 0;
  }

  async inicial(): Promise<bigint | null> {
    const nivel = await this.prisma.nivel.findFirst({
      orderBy: { orden: 'asc' },
      select: { id: true },
    });
    return nivel?.id ?? null;
  }
}
