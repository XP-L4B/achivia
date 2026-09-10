// Modalità "locale": webapp hostata su GitHub Pages ↔ Ollama (LLM locale).
// Il browser chiama DIRETTAMENTE l'API nativa di Ollama sul PC dell'utente, in
// streaming. I prompt non passano da nessun server esterno (GitHub Pages serve
// solo i file statici). Richiede che:
//   - Ollama sia in esecuzione e accetti l'origine del sito (env OLLAMA_ORIGINS);
//   - il modello (VITE_OLLAMA_MODEL) sia già scaricato in locale.
//
// env:
//   VITE_OLLAMA_MODEL  modello locale (default llama3.2)
//   VITE_OLLAMA_URL    base di Ollama (default http://localhost:11434)

export const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2';
const OLLAMA_URL = (import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434').replace(/\/+$/, '');

// API nativa /api/chat in streaming (NDJSON): una riga JSON per chunk.
export async function* streamChat({ model, messages, signal }) {
  let res;
  try {
    res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
      signal,
    });
  } catch {
    throw new Error(
      `Impossibile contattare Ollama in locale (${OLLAMA_URL}). Verifica che sia in esecuzione e che OLLAMA_ORIGINS consenta questa pagina.`,
    );
  }

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new Error((data && data.error) || `Errore ${res.status}`);
  }

  // Ollama risponde con righe JSON: { message: { content }, done }.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      let obj;
      try { obj = JSON.parse(line); } catch { continue; }
      if (obj.error) throw new Error(obj.error);
      const piece = obj.message?.content;
      if (piece) yield piece;
    }
  }
}
