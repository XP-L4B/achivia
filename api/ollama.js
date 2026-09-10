// Funzione serverless (formato Vercel) che fa da ponte verso Ollama cloud.
// Deploy: la cartella `api/` è riconosciuta da Vercel. Imposta la variabile
// d'ambiente OLLAMA_API_KEY nel progetto Vercel.
//
// Il frontend (anche su un'altra origine, es. GitHub Pages) la chiama così:
//   POST https://<tuo-deploy>.vercel.app/api/ollama
//   body: { "model": "...", "messages": [...] }

import { proxyOllamaChat } from './_core.js';

export default async function handler(req, res) {
  // CORS: consente la chiamata dal frontend su un'altra origine.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { status, body } = await proxyOllamaChat(req.body, process.env.OLLAMA_API_KEY);
  return res.status(status).json(body);
}
