import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  _db = drizzle(_pool, { schema });
}

export function getPool(): pg.Pool {
  if (!_pool) {
    initializeDatabase();
  }
  return _pool!;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    initializeDatabase();
  }
  return _db!;
}

// Legacy exports for backward compatibility (lazy initialized with proper binding)
export const pool = new Proxy({} as pg.Pool, {
  get(_, prop) {
    const target = getPool();
    const value = (target as any)[prop];
    // Bind functions to the real pool instance to preserve 'this' context
    return typeof value === 'function' ? value.bind(target) : value;
  }
});

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_, prop) {
    const target = getDb();
    const value = (target as any)[prop];
    // Bind functions to the real db instance to preserve 'this' context
    return typeof value === 'function' ? value.bind(target) : value;
  }
});
