import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import type { BaseCrudService } from './base-crud.service.js';

/**
 * Capa de presentación común. Cada tabla la extiende con @Controller('<tabla>'):
 *   GET    /api/v1/<tabla>?limit=50&offset=0
 *   GET    /api/v1/<tabla>/:id
 *   POST   /api/v1/<tabla>
 *   PATCH  /api/v1/<tabla>/:id
 *   DELETE /api/v1/<tabla>/:id
 * SOLO PRUEBAS: sin autenticación ni permisos por rol.
 */
export abstract class BaseCrudController {
  protected constructor(protected readonly service: BaseCrudService) {}

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  findAll(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.findAll(Number(limit), Number(offset));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  // Sin DTO todavía: Swagger muestra un objeto libre con las columnas de la tabla.
  @ApiBody({ schema: { type: 'object' } })
  create(@Body() body: unknown) {
    return this.service.create(body);
  }

  @Patch(':id')
  @ApiBody({ schema: { type: 'object' } })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
