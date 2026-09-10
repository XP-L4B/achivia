// Funzione serverless (formato Vercel) che fa da proxy verso l'API di OpenSea.
// Deploy: questa cartella `api/` viene riconosciuta automaticamente da Vercel.
// Imposta la variabile d'ambiente OPENSEA_API_KEY nel progetto Vercel.
//
// Il frontend (anche se ospitato altrove, es. GitHub Pages) la chiama così:
//   GET https://<tuo-deploy>.vercel.app/api/opensea?path=/api/v2/chain/sepolia/contract/0x.../nfts

import { proxyOpenSea } from './_core.js';

export default async function handler(req, res) {
  // CORS: consente la chiamata dal frontend su un'altra origine (GitHub Pages).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Solo GET' });

  const path = Array.isArray(req.query.path) ? req.query.path[0] : req.query.path;
  const { status, body } = await proxyOpenSea(path, process.env.OPENSEA_API_KEY);
  return res.status(status).json(body);
}
