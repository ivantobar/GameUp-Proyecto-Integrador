import 'dotenv/config';
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
try { await c.connect();
const r = await c.query("select table_schema, table_name from information_schema.tables where table_schema='public' order by 1,2");
console.log('tablas en public:', r.rows.length); for (const t of r.rows) console.log(' -', t.table_name);
} catch(e){ console.log('ERROR', e.code, e.message); } finally { await c.end().catch(()=>{}); }
