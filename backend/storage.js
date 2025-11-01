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
    description || null,
    creatorAddress.toLowerCase(),
    marketplaceAddress.toLowerCase(),
    // Store as string to be safe with pg driver and BIGINT
    String(totalSupply)
  ];
  const res = await query(sql, params);
  return res.rows[0];
}

async function getAllCoins() {
  const res = await query('SELECT * FROM coins ORDER BY created_at DESC', []);
  return res.rows;
}

async function getCoinByTokenAddress(tokenAddress) {
  const res = await query('SELECT * FROM coins WHERE token_address = $1', [tokenAddress.toLowerCase()]);
  return res.rows[0];
}

async function getCoinsByCreator(creatorAddress) {
  const res = await query('SELECT * FROM coins WHERE LOWER(creator_address) = LOWER($1) ORDER BY created_at DESC', [creatorAddress]);
  return res.rows;
}

module.exports = { insertCoin, getAllCoins, getCoinByTokenAddress, getCoinsByCreator };
