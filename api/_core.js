// Logica condivisa del proxy OpenSea.
// Usata sia dalla funzione serverless (api/opensea.js) sia dal dev-server Vite,
// così la API key vive solo lato server e non finisce mai nel bundle del browser.

const OPENSEA_BASE = 'https://api.opensea.io';

// Solo questi prefissi (read-only) possono passare dal proxy.
const ALLOWED = [
  /^\/api\/v2\/chain\/[^/]+\/contract\/[^/]+\/nfts/,
  /^\/api\/v2\/chain\/[^/]+\/contract\/[^/]+\/nfts\/[^/]+$/,
  /^\/api\/v2\/collections?\//,
  /^\/api\/v2\/listings\//,
  /^\/api\/v2\/offers\//,
];

/**
 * Inoltra una richiesta GET all'API di OpenSea iniettando la key.
 * @param {string} path  percorso OpenSea, es. "/api/v2/chain/sepolia/contract/0x.../nfts?limit=20"
 * @param {string} apiKey  OPENSEA_API_KEY (lato server)
 * @returns {Promise<{status:number, body:any}>}
 */
export async function proxyOpenSea(path, apiKey) {
  if (!apiKey) {
    return { status: 500, body: { error: 'OPENSEA_API_KEY non configurata sul server' } };
  }
  if (!path || !path.startsWith('/api/v2/')) {
    return { status: 400, body: { error: 'Parametro "path" mancante o non valido' } };
  }
  const cleanPath = path.split('?')[0];
  if (!ALLOWED.some((re) => re.test(cleanPath))) {
    return { status: 403, body: { error: `Endpoint non consentito dal proxy: ${cleanPath}` } };
  }

  try {
    const r = await fetch(OPENSEA_BASE + path, {
      headers: { 'x-api-key': apiKey, accept: 'application/json' },
    });
    const body = await r.json().catch(() => ({ error: 'Risposta OpenSea non in JSON' }));
    return { status: r.status, body };
  } catch (err) {
    return { status: 502, body: { error: `Errore nel contattare OpenSea: ${err.message}` } };
  }
}

// ─── Ollama (cloud) ─────────────────────────────────────────
// Ponte verso ollama.com: il browser parla con il nostro backend, il backend
// chiama Ollama con la key (che resta lato server, mai nel bundle del browser).
const OLLAMA_BASE = 'https://ollama.com';

/**
 * @param {{model:string, messages:Array<{role:string,content:string}>}} payload
 * @param {string} apiKey  OLLAMA_API_KEY (lato server)
 * @returns {Promise<{status:number, body:any}>}
 */
export async function proxyOllamaChat(payload, apiKey) {
  if (!apiKey) {
    return { status: 500, body: { error: 'OLLAMA_API_KEY non configurata sul server' } };
  }
  const model = payload?.model;
  const messages = payload?.messages;
  if (!model || !Array.isArray(messages)) {
    return { status: 400, body: { error: 'Parametri "model"/"messages" mancanti o non validi' } };
  }

  try {
    const r = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, stream: false }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      return { status: r.status, body: { error: (data && data.error) || `Ollama ${r.status}` } };
    }
    return { status: 200, body: { content: data?.message?.content ?? '' } };
  } catch (err) {
    return { status: 502, body: { error: `Errore nel contattare Ollama: ${err.message}` } };
  }
}
