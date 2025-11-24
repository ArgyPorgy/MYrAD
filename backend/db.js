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
    // Create tables first
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
      
      CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        first_connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        connection_count INTEGER NOT NULL DEFAULT 1
      );
    `);

    // Create regular indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_coins_creator ON coins(LOWER(creator_address));
      CREATE INDEX IF NOT EXISTS idx_coins_symbol ON coins(symbol);
      CREATE INDEX IF NOT EXISTS idx_coins_created_at ON coins(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_users_first_connected ON users(first_connected_at DESC);
      CREATE INDEX IF NOT EXISTS idx_users_last_connected ON users(last_connected_at DESC);
    `);

    // Handle unique index on CID - clean duplicates first if they exist
    try {
      // Check if index already exists
      const indexCheck = await client.query(`
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_coins_cid_unique'
      `);
      
      if (indexCheck.rows.length === 0) {
        // Index doesn't exist, check for duplicates first
        const duplicates = await client.query(`
          SELECT cid, COUNT(*) as count
          FROM coins
          WHERE cid IS NOT NULL AND cid != ''
          GROUP BY cid
          HAVING COUNT(*) > 1
        `);
        
        if (duplicates.rows.length > 0) {
          console.log(`[db] Found ${duplicates.rows.length} duplicate CID(s), cleaning up...`);
          // Keep the first occurrence (oldest by created_at), remove duplicates
          for (const dup of duplicates.rows) {
            await client.query(`
              UPDATE coins
              SET cid = NULL
              WHERE cid = $1
              AND token_address NOT IN (
                SELECT token_address
                FROM coins
                WHERE cid = $1
                ORDER BY created_at ASC
                LIMIT 1
              )
            `, [dup.cid]);
          }
          console.log(`[db] Cleaned up duplicate CIDs`);
        }
        
        // Now create the unique index
        await client.query(`
          CREATE UNIQUE INDEX idx_coins_cid_unique ON coins(cid) WHERE cid IS NOT NULL
        `);
        console.log(`[db] Created unique index on CID`);
      }
    } catch (err) {
      // If index creation fails, log but don't crash
      console.error('[db] init error: could not create unique index "idx_coins_cid_unique"', err.message);
      // Try to drop and recreate if it's a constraint violation
      if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
        console.log('[db] Attempting to clean duplicates and recreate index...');
        try {
          // Drop index if exists
          await client.query(`DROP INDEX IF EXISTS idx_coins_cid_unique`);
          // Clean duplicates
          await client.query(`
            UPDATE coins c1
            SET cid = NULL
            WHERE cid IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM coins c2
              WHERE c2.cid = c1.cid
              AND c2.token_address != c1.token_address
              AND c2.created_at < c1.created_at
            )
          `);
          // Recreate index
          await client.query(`
            CREATE UNIQUE INDEX idx_coins_cid_unique ON coins(cid) WHERE cid IS NOT NULL
          `);
          console.log('[db] Successfully recreated unique index after cleanup');
        } catch (retryErr) {
          console.error('[db] Failed to recreate index:', retryErr.message);
        }
      }
    }
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
