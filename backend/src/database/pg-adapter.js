/**
 * ============================================================
 * PostgreSQL Drop-in Adapter for Supabase JS SDK
 * ============================================================
 * Emula a interface fluente do @supabase/supabase-js usando
 * pg diretamente. Permite trocar o banco sem mudar rotas.
 *
 * Suporta:
 *   .from(table).select(cols, opts)
 *   .insert(data) .update(data) .upsert(data, opts)
 *   .delete()
 *   .eq(col, val) .neq(col, val) .is(col, val) .in(col, vals)
 *   .ilike(col, pat) .gte(col, val) .lte(col, val)
 *   .or(filter) .order(col, opts) .limit(n) .range(from, to)
 *   .single() .maybeSingle()
 *   { count: 'exact', head: true }
 * ============================================================
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── POOL DE CONEXÕES (LAZY INIT) ────────────────────────────────────────
let poolInstance = null;

function getPool() {
  if (!poolInstance) {
    if (!process.env.DATABASE_URL) {
      console.error('CRITICAL: process.env.DATABASE_URL is undefined when creating pg Pool!');
    }
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    poolInstance.on('error', (err) => {
      console.error('❌ [pg-pool] Unexpected error:', err.message);
    });
  }
  return poolInstance;
}

// ─── QUERY BUILDER ───────────────────────────────────────────
class QueryBuilder {
  constructor(tableName) {
    this._table = tableName;
    this._select = '*';
    this._conditions = [];
    this._params = [];
    this._orderBy = null;
    this._limitVal = null;
    this._offsetVal = null;
    this._isSingle = false;
    this._isMaybeSingle = false;
    this._isHead = false;
    this._isCount = false;
    this._insertData = null;
    this._updateData = null;
    this._upsertData = null;
    this._upsertConflict = null;
    this._deleteFlag = false;
    this._returning = [];
  }

  // ─── SELECT ──────────────────────────────────────────────
  select(cols = '*', opts = {}) {
    // Simplifica colunas relacionadas (ex: lead_statuses!status_id(id, name))
    this._select = this._simplifySelect(cols);
    if (opts.count === 'exact') this._isCount = true;
    if (opts.head === true) this._isHead = true;
    return this;
  }

  _simplifySelect(cols) {
    if (!cols || cols === '*') return '*';
    // Separar colunas respeitando parênteses aninhados (joins do Supabase)
    const parts = [];
    let depth = 0, current = '';
    for (const ch of cols) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { parts.push(current.trim()); current = ''; }
      else current += ch;
    }
    if (current.trim()) parts.push(current.trim());

    const simple = [];
    for (const part of parts) {
      const p = part.trim();
      // Ignorar joins: contém ( ) ou !
      if (p.includes('(') || p.includes('!')) continue;
      // Manter * explícito
      if (p === '*') { simple.push('*'); continue; }
      // Limpar aliases como "col as alias"
      const col = p.split(/\s+as\s+/i)[0].trim();
      if (col) simple.push(col);
    }
    // Se ficou vazio (só tinha joins), usar * para buscar todas as colunas da tabela
    return simple.length > 0 ? simple.join(', ') : '*';
  }

  // ─── INSERT / UPDATE / UPSERT / DELETE ───────────────────
  insert(data) {
    this._insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this._updateData = data;
    return this;
  }

  upsert(data, opts = {}) {
    this._upsertData = Array.isArray(data) ? data : [data];
    this._upsertConflict = opts.onConflict || null;
    return this;
  }

  delete() {
    this._deleteFlag = true;
    return this;
  }

  // ─── RETORNO ─────────────────────────────────────────────
  returning() {
    // Chainable no-op (sempre retornamos tudo via RETURNING *)
    return this;
  }

  // ─── FILTROS ─────────────────────────────────────────────
  _addCond(sql, val) {
    if (val !== undefined) this._params.push(val);
    this._conditions.push(sql);
    return this;
  }

  eq(col, val) {
    if (val === null) return this.is(col, null);
    const idx = this._params.length + 1;
    return this._addCond(`"${col}" = $${idx}`, val);
  }

  neq(col, val) {
    const idx = this._params.length + 1;
    return this._addCond(`"${col}" != $${idx}`, val);
  }

  is(col, val) {
    if (val === null) {
      this._conditions.push(`"${col}" IS NULL`);
    } else {
      const idx = this._params.length + 1;
      this._params.push(val);
      this._conditions.push(`"${col}" IS $${idx}`);
    }
    return this;
  }

  not(col, op, val) {
    if (op === 'is') {
      if (val === null || val === 'null') {
        this._conditions.push(`"${col}" IS NOT NULL`);
      } else if (val === true || val === 'true') {
        this._conditions.push(`"${col}" IS NOT TRUE`);
      } else if (val === false || val === 'false') {
        this._conditions.push(`"${col}" IS NOT FALSE`);
      }
    } else if (op === 'eq') {
      const idx = this._params.length + 1;
      this._params.push(val);
      this._conditions.push(`"${col}" != $${idx}`);
    } else if (op === 'in') {
      const items = String(val).replace(/[()]/g, '').split(',').map(s => s.trim());
      const phs = items.map(v => { this._params.push(v); return `$${this._params.length}`; });
      this._conditions.push(`"${col}" NOT IN (${phs.join(', ')})`);
    } else {
      const idx = this._params.length + 1;
      this._params.push(val);
      this._conditions.push(`NOT ("${col}" ${op} $${idx})`);
    }
    return this;
  }

  in(col, vals) {
    if (!vals || vals.length === 0) {
      this._conditions.push('FALSE');
      return this;
    }
    const placeholders = vals.map((v, i) => {
      this._params.push(v);
      return `$${this._params.length}`;
    });
    this._conditions.push(`"${col}" IN (${placeholders.join(', ')})`);
    return this;
  }

  ilike(col, pattern) {
    const idx = this._params.length + 1;
    this._params.push(pattern);
    this._conditions.push(`"${col}" ILIKE $${idx}`);
    return this;
  }

  like(col, pattern) {
    return this.ilike(col, pattern);
  }

  gte(col, val) {
    const idx = this._params.length + 1;
    this._params.push(val);
    this._conditions.push(`"${col}" >= $${idx}`);
    return this;
  }

  lte(col, val) {
    const idx = this._params.length + 1;
    this._params.push(val);
    this._conditions.push(`"${col}" <= $${idx}`);
    return this;
  }

  gt(col, val) {
    const idx = this._params.length + 1;
    this._params.push(val);
    this._conditions.push(`"${col}" > $${idx}`);
    return this;
  }

  lt(col, val) {
    const idx = this._params.length + 1;
    this._params.push(val);
    this._conditions.push(`"${col}" < $${idx}`);
    return this;
  }

  // Suporte robusto a .or('col.eq.val,col2.is.null')
  // Suporta valores com pontos (UUIDs, IPs, padrões ILIKE com %)
  or(filterStr) {
    // Operadores conhecidos — extraímos col + op primeiro, o resto é o valor
    const OPS = ['ilike', 'like', 'neq', 'gte', 'lte', 'gt', 'lt', 'eq', 'is', 'in'];

    // Separar partes cuidadosamente: vírgula só separa filtros se não estiver dentro de ()
    const parts = [];
    let depth = 0, current = '';
    for (const ch of filterStr) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { parts.push(current.trim()); current = ''; }
      else current += ch;
    }
    if (current.trim()) parts.push(current.trim());

    const clauses = parts.map(part => {
      // Tentar identificar col.OP.valor
      let matchedOp = null;
      let col = null;
      let val = null;

      for (const op of OPS) {
        const pattern = `.${op}.`;
        const idx = part.indexOf(pattern);
        if (idx !== -1) {
          col = part.substring(0, idx);
          val = part.substring(idx + pattern.length);
          matchedOp = op;
          break;
        }
      }

      if (!col || !matchedOp) return 'TRUE';

      if (matchedOp === 'eq') {
        const typed = val === 'true' ? true : val === 'false' ? false : val === 'null' ? null : val;
        if (typed === null) return `"${col}" IS NULL`;
        this._params.push(typed);
        return `"${col}" = $${this._params.length}`;
      }
      if (matchedOp === 'neq') {
        this._params.push(val);
        return `"${col}" != $${this._params.length}`;
      }
      if (matchedOp === 'is') {
        if (val === 'null') return `"${col}" IS NULL`;
        if (val === 'true') return `"${col}" IS TRUE`;
        if (val === 'false') return `"${col}" IS FALSE`;
        return `"${col}" IS NULL`;
      }
      if (matchedOp === 'ilike' || matchedOp === 'like') {
        this._params.push(val);
        return `"${col}" ILIKE $${this._params.length}`;
      }
      if (matchedOp === 'gte') {
        this._params.push(val);
        return `"${col}" >= $${this._params.length}`;
      }
      if (matchedOp === 'lte') {
        this._params.push(val);
        return `"${col}" <= $${this._params.length}`;
      }
      if (matchedOp === 'gt') {
        this._params.push(val);
        return `"${col}" > $${this._params.length}`;
      }
      if (matchedOp === 'lt') {
        this._params.push(val);
        return `"${col}" < $${this._params.length}`;
      }
      if (matchedOp === 'in') {
        // val = (a,b,c)
        const items = val.replace(/[()]/g, '').split(',').map(s => s.trim());
        const phs = items.map(v => { this._params.push(v); return `$${this._params.length}`; });
        return `"${col}" IN (${phs.join(', ')})`;
      }
      return 'TRUE';
    });

    this._conditions.push(`(${clauses.join(' OR ')})`);
    return this;
  }

  // ─── ORDENAÇÃO / PAGINAÇÃO ───────────────────────────────
  order(col, opts = {}) {
    const dir = opts.ascending === false ? 'DESC' : 'ASC';
    const nulls = opts.nullsFirst ? 'NULLS FIRST' : '';
    this._orderBy = `ORDER BY "${col}" ${dir} ${nulls}`.trim();
    return this;
  }

  limit(n) {
    this._limitVal = n;
    return this;
  }

  range(from, to) {
    this._offsetVal = from;
    this._limitVal = to - from + 1;
    return this;
  }

  // ─── SINGLE / MAYBE SINGLE ───────────────────────────────
  single() {
    this._isSingle = true;
    return this;
  }

  maybeSingle() {
    this._isMaybeSingle = true;
    return this;
  }

  // ─── EXECUTAR ────────────────────────────────────────────
  then(resolve, reject) {
    return this._execute().then(resolve, reject);
  }

  async _execute() {
    try {
      // ── INSERT ──
      if (this._insertData) {
        const results = [];
        for (const row of this._insertData) {
          const cols = Object.keys(row);
          const vals = Object.values(row).map(v =>
            typeof v === 'object' && v !== null && !(v instanceof Date) && !Array.isArray(v)
              ? JSON.stringify(v) : v
          );
          const placeholders = vals.map((_, i) => `$${i + 1}`);
          const sql = `INSERT INTO "${this._table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
          const res = await getPool().query(sql, vals);
          results.push(res.rows[0]);
        }
        const data = results.length === 1 ? results[0] : results;
        if (this._isSingle || this._isMaybeSingle) return { data: results[0] || null, error: null };
        return { data, error: null };
      }

      // ── UPDATE ──
      if (this._updateData) {
        const setCols = Object.keys(this._updateData);
        const setVals = Object.values(this._updateData).map(v =>
          typeof v === 'object' && v !== null && !(v instanceof Date) && !Array.isArray(v)
            ? JSON.stringify(v) : v
        );
        const sets = setCols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
        let allParams = [...setVals];
        const where = this._buildWhere(allParams.length);
        allParams = [...allParams, ...this._params];
        const sql = `UPDATE "${this._table}" SET ${sets}${where} RETURNING *`;
        const res = await getPool().query(sql, allParams);
        if (this._isSingle || this._isMaybeSingle) {
          return { data: res.rows[0] || null, error: null };
        }
        return { data: res.rows, error: null };
      }

      // ── UPSERT ──
      if (this._upsertData) {
        const results = [];
        for (const row of this._upsertData) {
          const cols = Object.keys(row);
          const vals = Object.values(row).map(v =>
            typeof v === 'object' && v !== null && !(v instanceof Date) && !Array.isArray(v)
              ? JSON.stringify(v) : v
          );
          const placeholders = vals.map((_, i) => `$${i + 1}`);
          let conflictClause = '';
          if (this._upsertConflict) {
            const conflictCols = this._upsertConflict.split(',').map(c => `"${c.trim()}"`).join(', ');
            const updateCols = cols.filter(c => !this._upsertConflict.includes(c));
            if (updateCols.length > 0) {
              const updates = updateCols.map((c, i) => `"${c}" = EXCLUDED."${c}"`).join(', ');
              conflictClause = ` ON CONFLICT (${conflictCols}) DO UPDATE SET ${updates}`;
            } else {
              conflictClause = ` ON CONFLICT (${conflictCols}) DO NOTHING`;
            }
          } else {
            conflictClause = ` ON CONFLICT DO NOTHING`;
          }
          const sql = `INSERT INTO "${this._table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})${conflictClause} RETURNING *`;
          const res = await getPool().query(sql, vals);
          if (res.rows[0]) results.push(res.rows[0]);
        }
        if (this._isSingle || this._isMaybeSingle) return { data: results[0] || null, error: null };
        return { data: results, error: null };
      }

      // ── DELETE ──
      if (this._deleteFlag) {
        const where = this._buildWhere(0);
        const sql = `DELETE FROM "${this._table}"${where} RETURNING *`;
        const res = await getPool().query(sql, this._params);
        return { data: res.rows, error: null, count: res.rowCount };
      }

      // ── SELECT ──
      if (this._isCount && this._isHead) {
        const where = this._buildWhere(0);
        const sql = `SELECT COUNT(*) FROM "${this._table}"${where}`;
        const res = await getPool().query(sql, this._params);
        return { count: parseInt(res.rows[0].count), data: null, error: null };
      }

      const where = this._buildWhere(0);
      const order = this._orderBy ? ` ${this._orderBy}` : '';
      const limit = this._limitVal !== null ? ` LIMIT ${this._limitVal}` : '';
      const offset = this._offsetVal !== null ? ` OFFSET ${this._offsetVal}` : '';

      const selectCols = this._select || '*';
      const sql = `SELECT ${selectCols} FROM "${this._table}"${where}${order}${limit}${offset}`;
      const res = await getPool().query(sql, this._params);

      if (this._isSingle) {
        if (res.rows.length === 0) return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        return { data: res.rows[0], error: null };
      }
      if (this._isMaybeSingle) {
        return { data: res.rows[0] || null, error: null };
      }

      const result = { data: res.rows, error: null };

      // Calcular o count ignorando LIMIT / OFFSET como o Supabase SDK faz
      if (this._isCount) {
        const countSql = `SELECT COUNT(*) FROM "${this._table}"${where}`;
        const countRes = await getPool().query(countSql, this._params);
        result.count = parseInt(countRes.rows[0].count, 10);
      }
      
      return result;

    } catch (e) {
      // Log mais completo com o SQL que causou o erro
      const where = this._conditions.length > 0 ? ' WHERE ' + this._conditions.join(' AND ') : '';
      const debugSql = `${this._deleteFlag ? 'DELETE' : 'SELECT'} FROM "${this._table}"${where}`;
      console.error(`❌ [pg-adapter] ${this._table}: ${e.message}`);
      console.error(`   SQL debug: ${debugSql.slice(0, 200)}`);
      console.error(`   Params: ${JSON.stringify(this._params).slice(0, 100)}`);
      return { data: null, error: { message: e.message, code: e.code }, count: 0 };
    }
  }

  _buildWhere(paramOffset) {
    if (this._conditions.length === 0) return '';
    // Re-numerar parâmetros com offset
    if (paramOffset > 0) {
      const reNumbered = this._conditions.map(cond => {
        return cond.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + paramOffset}`);
      });
      return ' WHERE ' + reNumbered.join(' AND ');
    }
    return ' WHERE ' + this._conditions.join(' AND ');
  }
}

// ─── CLIENTE SUPABASE EMULADO ────────────────────────────────
export { getPool };
export const supabase = {
  from: (tableName) => new QueryBuilder(tableName),
  auth: {
    // No-op: auth é feito via JWT próprio no backend
    getUser: async () => ({ data: { user: null }, error: null }),
  },
  // Acesso ao pool direto se necessário
  get _pool() { return getPool(); },
};

export default supabase;
