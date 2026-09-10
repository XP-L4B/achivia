// Modalità "cloud": webapp in locale ↔ backend proxy ↔ Ollama cloud.
// Il browser parla con il nostro backend (`/api/ollama`), che fa da ponte verso
// Ollama cloud tenendo la API key lato server. Risposta non in streaming:
// emettiamo il testo in un unico "chunk".
//
// env:
//   VITE_OLLAMA_MODEL  modello cloud (default qwen3-coder-next:cloud)
//   VITE_API_BASE      base del backend; vuoto = stessa origine ("/api/ollama").

export const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen3-coder-next:cloud';
const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function* streamChat({ model, messages, signal }) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/ollama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages }),
      signal,
    });
  } catch {
    throw new Error('Impossibile contattare il backend dell’assistente (/api/ollama).');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error((data && data.error) || `Errore ${res.status}`);
  }
  if (data.error) throw new Error(data.error);
  yield data.content || '';
}
