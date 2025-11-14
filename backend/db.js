import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL not set. PostgreSQL features will be disabled.');
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

async function initSchema() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS coins (
        token_address TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        cid TEXT,
        description TEXT,
        creator_address TEXT NOT NULL,
        marketplace_address TEXT NOT NULL,
        total_supply BIGINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_coins_creator ON coins(LOWER(creator_address));
      CREATE INDEX IF NOT EXISTS idx_coins_symbol ON coins(symbol);
      CREATE INDEX IF NOT EXISTS idx_coins_created_at ON coins(created_at DESC);
      
      CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        first_connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        connection_count INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_users_first_connected ON users(first_connected_at DESC);
      CREATE INDEX IF NOT EXISTS idx_users_last_connected ON users(last_connected_at DESC);
    `);
  } finally {
    client.release();
  }
}

async function query(text, params) {
  if (!pool) {
    throw new Error('DATABASE_URL not configured');
  }
  return pool.query(text, params);
}

export { pool, initSchema, query };
