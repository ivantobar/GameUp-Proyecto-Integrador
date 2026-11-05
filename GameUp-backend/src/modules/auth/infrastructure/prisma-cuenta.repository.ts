import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { Cuenta } from '../domain/cuenta.entity.js';
import type { CuentaRepository } from '../domain/cuenta.repository.js';
import { CuentaMapper } from './cuenta.mapper.js';

@Injectable()
export class PrismaCuentaRepository implements CuentaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorIdUsuarioAuth(idUsuarioAuth: bigint): Promise<Cuenta | null> {
    const fila = await this.prisma.usuario.findUnique({
      where: { id_usuario_auth: idUsuarioAuth },
      select: {
        id: true,
        id_usuario_auth: true,
        activo: true,
        rol: { select: { nombre: true } },
        estudiante: { select: { estado: true } },
      },
    });
    return fila ? CuentaMapper.aEntidad(fila) : null;
  }
}
