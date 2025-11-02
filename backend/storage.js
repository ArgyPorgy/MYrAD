const { query } = require('./db');

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
  const params = [
    tokenAddress.toLowerCase(),
    name,
    symbol,
    cid || null,
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

module.exports = { insertCoin, getAllCoins, getCoinByTokenAddress, getCoinsByCreator };
