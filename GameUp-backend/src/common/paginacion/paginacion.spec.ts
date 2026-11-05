import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { mapearPagina, PaginacionQueryDto, saltar } from './paginacion.js';

describe('paginación', () => {
  it('usa page=1 y limit=20 por defecto', async () => {
    const dto = plainToInstance(PaginacionQueryDto, {});
    expect(dto).toMatchObject({ page: 1, limit: 20 });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('convierte el texto de la query en números', () => {
    expect(
      plainToInstance(PaginacionQueryDto, { page: '3', limit: '10' }),
    ).toMatchObject({
      page: 3,
      limit: 10,
    });
  });

  it('no permite más de 50 por página', async () => {
    const errores = await validate(
      plainToInstance(PaginacionQueryDto, { limit: '51' }),
    );
    expect(errores[0]?.property).toBe('limit');
  });

  it('saltar y mapearPagina', () => {
    expect(saltar({ page: 3, limit: 20 })).toBe(40);
    expect(
      mapearPagina({ items: [1n, 2n], total: 2, page: 1, limit: 20 }, String),
    ).toEqual({
      items: ['1', '2'],
      total: 2,
      page: 1,
      limit: 20,
    });
  });
});
