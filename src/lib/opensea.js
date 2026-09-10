// Client lato browser: parla SOLO con il nostro proxy, mai direttamente con OpenSea
// (così la API key resta sul server). In produzione punta al deploy serverless via
// VITE_OPENSEA_PROXY_URL; in locale usa il dev-server Vite (/api/opensea).
const PROXY_URL = import.meta.env.VITE_OPENSEA_PROXY_URL || '/api/opensea';

// Catena testnet usata per le query OpenSea.
export const CHAIN = 'sepolia';

async function proxy(path) {
  const res = await fetch(`${PROXY_URL}?path=${encodeURIComponent(path)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `OpenSea HTTP ${res.status}`);
  return data;
}

/** NFT di una collezione/contratto su Sepolia. Ritorna { nfts: [...], next } */
export function fetchCollectionNfts(contract, limit = 20) {
  return proxy(`/api/v2/chain/${CHAIN}/contract/${contract}/nfts?limit=${limit}`);
}
