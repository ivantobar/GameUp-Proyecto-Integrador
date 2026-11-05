import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { BaseCrudRepository, Row } from './base-crud.repository.js';

/**
 * Capa de negocio común: valida el cuerpo y traduce "no encontrado" a 404.
 * OJO: no hay autenticación ni permisos por rol (solo para pruebas).
 */
export abstract class BaseCrudService {
  protected constructor(protected readonly repo: BaseCrudRepository) {}

  private body(data: unknown, requireFields: boolean): Row {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new BadRequestException('El cuerpo debe ser un objeto JSON');
    }
    const row = { ...(data as Row) };
    delete row.id;
    if (requireFields && Object.keys(row).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }
    return row;
  }

  private notFound(id: string): NotFoundException {
    return new NotFoundException(`No existe ${this.repo.table} con id ${id}`);
  }

  findAll(limit?: number, offset?: number) {
    const l = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const o = Math.max(Number(offset) || 0, 0);
    return this.repo.findAll(l, o);
  }

  async findOne(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw this.notFound(id);
    return row;
  }

  create(data: unknown) {
    return this.repo.create(this.body(data, false));
  }

  async update(id: string, data: unknown) {
    const row = await this.repo.update(id, this.body(data, true));
    if (!row) throw this.notFound(id);
    return row;
  }

  async remove(id: string) {
    const row = await this.repo.remove(id);
    if (!row) throw this.notFound(id);
    return row;
  }
}
