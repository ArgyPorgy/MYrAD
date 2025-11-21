import fetch from "node-fetch";
import { getAllTokenAddresses } from "./storage.js";

async function getCount(url) {
  let count = 0;
  let next = null;

  do {
    const finalUrl = next || url;
    const res = await fetch(finalUrl);
    const data = await res.json();
    if (!data.items) break;

    count += data.items.length;

    if (data.next_page_params) {
      const params = new URLSearchParams(data.next_page_params).toString();
      next = url + "?" + params;
    } else {
      next = null;
    }
  } while (next);

  return count;
}

async function calculateForAddress(address) {
  const base = `https://base-sepolia.blockscout.com/api/v2/addresses/${address}`;

  const normal = await getCount(`${base}/transactions`);
  const internal = await getCount(`${base}/internal-transactions`);

  return normal + internal;
}

export async function getTotalTxForAllTokens() {
  const addresses = await getAllTokenAddresses();
  let grandTotal = 0;

  for (const addr of addresses) {
    const total = await calculateForAddress(addr);
    grandTotal += total;
  }

  return grandTotal;
}