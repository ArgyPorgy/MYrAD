import { query } from './db.js';

async function insertCoin({ tokenAddress, name, symbol, cid, description, creatorAddress, marketplaceAddress, totalSupply }) {
  const sql = `
    INSERT INTO coins (token_address, name, symbol, cid, description, creator_address, marketplace_address, total_supply)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (token_address) DO UPDATE SET
      name = EXCLUDED.name,
      symbol = EXCLUDED.symbol,
      cid = EXCLUDED.cid,
      description = EXCLUDED.description,
      creator_address = EXCLUDED.creator_address,
      marketplace_address = EXCLUDED.marketplace_address,
      total_supply = EXCLUDED.total_supply
    RETURNING *;
  `;
  
  // Normalize CID before storing (remove ipfs:// prefix and trim)
  const normalizedCid = cid ? (cid.toString().replace(/^ipfs:\/\//, '').trim() || null) : null;
  
  const params = [
    tokenAddress.toLowerCase(),
    name,
    symbol,
    normalizedCid,
    // Save description if provided - trim whitespace, only use null if undefined/null/empty after trim
    (description !== undefined && description !== null && typeof description === 'string' && description.trim()) 
      ? description.trim() 
      : null,
    creatorAddress.toLowerCase(),
    marketplaceAddress.toLowerCase(),
    // Store as string to be safe with pg driver and BIGINT
    String(totalSupply)
  ];
  const res = await query(sql, params);
  return res.rows[0];
}

async function getAllCoins() {
  try {
    if (!process.env.DATABASE_URL) {
      return [];
    }
    const res = await query('SELECT * FROM coins ORDER BY created_at DESC', []);
    return res.rows;
  } catch (err) {
    console.error('Error getting all coins:', err);
    return [];
  }
}

async function getCoinByTokenAddress(tokenAddress) {
  try {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    const res = await query('SELECT * FROM coins WHERE token_address = $1', [tokenAddress.toLowerCase()]);
    return res.rows[0];
  } catch (err) {
    console.error('Error getting coin by token address:', err);
    return null;
  }
}

async function getCoinsByCreator(creatorAddress) {
  const res = await query('SELECT * FROM coins WHERE LOWER(creator_address) = LOWER($1) ORDER BY created_at DESC', [creatorAddress]);
  return res.rows;
}

async function trackUserConnection(walletAddress) {
  try {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    const sql = `
      INSERT INTO users (wallet_address, first_connected_at, last_connected_at, connection_count)
      VALUES ($1, NOW(), NOW(), 1)
      ON CONFLICT (wallet_address) DO UPDATE SET
        last_connected_at = NOW(),
        connection_count = users.connection_count + 1
      RETURNING *;
    `;
    const params = [walletAddress.toLowerCase()];
    const res = await query(sql, params);
    return res.rows[0];
  } catch (err) {
    console.error('Error tracking user connection:', err);
    return null;
  }
}

async function getAllUsers() {
  try {
    if (!process.env.DATABASE_URL) {
      return [];
    }
    const res = await query('SELECT * FROM users ORDER BY first_connected_at DESC', []);
    return res.rows;
  } catch (err) {
    console.error('Error getting all users:', err);
    return [];
  }
}

export async function getTotalUsersCount() {
  const sql = `SELECT COUNT(*) AS count FROM users;`;
  const result = await query(sql, []);
  return Number(result.rows[0].count);
}


async function getUserByWalletAddress(walletAddress) {
  try {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    const res = await query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress.toLowerCase()]);
    return res.rows[0];
  } catch (err) {
    console.error('Error getting user by wallet address:', err);
    return null;
  }
}

export async function getTotalDatasetsCount() {
  const sql = `SELECT COUNT(*) AS count FROM coins;`;
  const result = await query(sql, []);
  return Number(result.rows[0].count);
}

export async function getAllTokenAddresses() {
  try {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    const sql = `SELECT token_address FROM coins ORDER BY created_at DESC`;
    const result = await query(sql, []);
    
    // Return as an array of strings
    return result.rows.map(row => row.token_address);
  } catch (err) {
    console.error("Error getting token addresses:", err);
    return [];
  }
}

export async function getCoinByCid(cid) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('[DUPLICATE CHECK] ❌ DATABASE_URL not configured - DUPLICATE CHECK DISABLED!');
      throw new Error('DATABASE_URL not configured - cannot check for duplicates');
    }
    
    // Normalize CID - remove ipfs:// prefix and trim whitespace
    const normalizedCid = (cid || '').toString().replace(/^ipfs:\/\//, '').trim();
    
    if (!normalizedCid) {
      console.error('[DUPLICATE CHECK] ❌ Empty CID after normalization');
      throw new Error('Empty CID - cannot check for duplicates');
    }
    
    console.log(`[DUPLICATE CHECK] 🔍 Checking for CID: "${normalizedCid}" (length: ${normalizedCid.length})`);
    
    // First, let's see what CIDs exist in the database (for debugging)
    const allCidsQuery = 'SELECT cid, token_address, name, symbol FROM coins WHERE cid IS NOT NULL LIMIT 10';
    const allCidsRes = await query(allCidsQuery, []);
    console.log(`[DUPLICATE CHECK] 📊 Found ${allCidsRes.rows.length} coins with CIDs in database`);
    if (allCidsRes.rows.length > 0) {
      console.log(`[DUPLICATE CHECK] Sample CIDs in DB:`, allCidsRes.rows.map(r => ({
        cid: r.cid,
        cidLength: r.cid?.length,
        name: r.name,
        symbol: r.symbol
      })));
    }
    
    // Simple, direct query - check for exact match first
    const sql = 'SELECT * FROM coins WHERE cid = $1 LIMIT 1';
    console.log(`[DUPLICATE CHECK] 🔍 Executing query: ${sql} with param: "${normalizedCid}"`);
    const res = await query(sql, [normalizedCid]);
    
    console.log(`[DUPLICATE CHECK] Query returned ${res.rows?.length || 0} rows`);
    
    if (res.rows && res.rows.length > 0) {
      const found = res.rows[0];
      console.log(`[DUPLICATE CHECK] ❌ FOUND DUPLICATE!`, {
        checkingCid: normalizedCid,
        checkingCidLength: normalizedCid.length,
        existingToken: found.token_address,
        existingName: found.name,
        existingSymbol: found.symbol,
        storedCid: found.cid,
        storedCidLength: found.cid?.length,
        cidsMatch: found.cid === normalizedCid
      });
      return found;
    }
    
    // Also check with TRIM in case there are whitespace issues in stored CIDs
    const sqlTrimmed = 'SELECT * FROM coins WHERE TRIM(COALESCE(cid, \'\')) = $1 LIMIT 1';
    console.log(`[DUPLICATE CHECK] 🔍 Executing trimmed query: ${sqlTrimmed} with param: "${normalizedCid}"`);
    const resTrimmed = await query(sqlTrimmed, [normalizedCid]);
    
    console.log(`[DUPLICATE CHECK] Trimmed query returned ${resTrimmed.rows?.length || 0} rows`);
    
    if (resTrimmed.rows && resTrimmed.rows.length > 0) {
      const found = resTrimmed.rows[0];
      console.log(`[DUPLICATE CHECK] ❌ FOUND DUPLICATE (with TRIM)!`, {
        checkingCid: normalizedCid,
        existingToken: found.token_address,
        existingName: found.name,
        existingSymbol: found.symbol
      });
      return found;
    }
    
    console.log(`[DUPLICATE CHECK] ✅ No duplicate found for CID: "${normalizedCid}"`);
    return null;
  } catch (err) {
    // If there's an error checking, we should BLOCK creation to be safe
    console.error('[DUPLICATE CHECK] ❌ ERROR checking for duplicate CID:', err);
    console.error('[DUPLICATE CHECK] Error details:', {
      message: err.message,
      stack: err.stack,
      cid: cid
    });
    throw new Error(`Failed to check for duplicate CID: ${err.message}`);
  }
}

export { 
  insertCoin, 
  getAllCoins, 
  getCoinByTokenAddress, 
  getCoinsByCreator, 
  trackUserConnection, 
  getAllUsers, 
  getUserByWalletAddress
};




