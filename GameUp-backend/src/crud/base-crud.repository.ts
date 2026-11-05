import { PrismaService } from '../prisma/prisma.service.js';

export type Row = Record<string, unknown>;

/** Valida nombres de columna para poder ponerlos en el SQL sin riesgo. */
const COLUMN = /^[a-z_][a-z0-9_]*$/i;

function q(identifier: string): string {
  if (!COLUMN.test(identifier)) {
    throw new Error(`Nombre de columna no válido: ${identifier}`);
  }
  return `"${identifier}"`;
}

/** Postgres devuelve bigint para algunos ids; JSON no los admite. */
function serialize(rows: Row[]): Row[] {
  return JSON.parse(
    JSON.stringify(rows, (_k, v: unknown) =>
      typeof v === 'bigint' ? v.toString() : v,
    ),
  ) as Row[];
}

/**
 * Capa de acceso a datos común: SQL con Prisma ($queryRawUnsafe) y valores
 * siempre como parámetros ($1, $2...). Cada tabla la extiende con su nombre.
 * Se asume que la clave primaria se llama `id`.
 */
export abstract class BaseCrudRepository {
  protected constructor(
    protected readonly prisma: PrismaService,
    readonly table: string,
  ) {}

  async findAll(limit: number, offset: number): Promise<Row[]> {
    const rows = await this.prisma.$queryRawUnsafe<Row[]>(
      `SELECT * FROM public.${q(this.table)} LIMIT $1 OFFSET $2`,
      limit,
      offset,
    );
    return serialize(rows);
  }

  async findById(id: string): Promise<Row | null> {
    const rows = await this.prisma.$queryRawUnsafe<Row[]>(
      `SELECT * FROM public.${q(this.table)} WHERE "id"::text = $1 LIMIT 1`,
      id,
    );
    return serialize(rows)[0] ?? null;
  }

  async create(data: Row): Promise<Row> {
    const cols = Object.keys(data);
    const sql =
      cols.length === 0
        ? `INSERT INTO public.${q(this.table)} DEFAULT VALUES RETURNING *`
        : `INSERT INTO public.${q(this.table)} (${cols.map(q).join(', ')}) VALUES (${cols
            .map((_, i) => `$${i + 1}`)
            .join(', ')}) RETURNING *`;
    const rows = await this.prisma.$queryRawUnsafe<Row[]>(
      sql,
      ...Object.values(data),
    );
    return serialize(rows)[0] as Row;
  }

  async update(id: string, data: Row): Promise<Row | null> {
    const cols = Object.keys(data);
    const set = cols.map((c, i) => `${q(c)} = $${i + 1}`).join(', ');
    const rows = await this.prisma.$queryRawUnsafe<Row[]>(
      `UPDATE public.${q(this.table)} SET ${set} WHERE "id"::text = $${cols.length + 1} RETURNING *`,
      ...Object.values(data),
      id,
    );
    return serialize(rows)[0] ?? null;
  }

  async remove(id: string): Promise<Row | null> {
    const rows = await this.prisma.$queryRawUnsafe<Row[]>(
      `DELETE FROM public.${q(this.table)} WHERE "id"::text = $1 RETURNING *`,
      id,
    );
    return serialize(rows)[0] ?? null;
  }
}
