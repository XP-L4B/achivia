# 16 — Chatbot: Ollama in locale collegato alla webapp su GitHub Pages

**Data:** 2026-06-19

Il chatbot può funzionare in due modalità, scelte tramite variabili d'ambiente
(`VITE_*`, lette a **build-time** da Vite). Obiettivo di questa sessione: far parlare
il sito hostato su **GitHub Pages** direttamente con **Ollama in locale**, senza che i
prompt passino da alcun server esterno (Pages serve solo i file statici).

---

## 1. Le due modalità

| Modalità | Percorso dati | Quando |
|---|---|---|
| **cloud** | browser → backend `/api/ollama` → Ollama cloud (key lato server) | comportamento storico, webapp in locale |
| **locale** | browser → `http://localhost:11434/api/chat` (Ollama sul PC) | webapp su GitHub Pages, privacy totale |

Il selettore decide a build-time: **se `VITE_OLLAMA_URL` è valorizzato → modalità
locale, altrimenti cloud.**

## 2. File coinvolti
- `src/lib/ollama.js` — **selettore**: importa entrambe le implementazioni e riesporta
  `streamChat`/`DEFAULT_MODEL`. Le pagine non sanno quale backend è attivo.
- `src/lib/ollama-cloud.js` — modalità cloud (proxy `/api/ollama`, risposta unica).
- `src/lib/ollama-local.js` — modalità locale (API nativa `/api/chat`, **streaming** NDJSON;
  legge `message.content`, ignora `message.thinking`).
- `src/pages/shared/ChatbotPage.jsx` — invariato (importa solo da `ollama.js`).

## 3. Variabili d'ambiente
| Variabile | Effetto |
|---|---|
| `VITE_OLLAMA_URL` | Se presente attiva la **modalità locale** (es. `http://localhost:11434`). |
| `VITE_OLLAMA_MODEL` | Modello da usare (locale: deve essere già scaricato, es. `llama3.1:8b`). |
| `VITE_API_BASE` | Base del backend proxy, usata **solo** in modalità cloud. |

- In **locale** la scelta sta in `.env.local` (gitignored, non committato).
- Su **Pages** la scelta sta in `.github/workflows/deploy.yml` (step `npm run build`).

## 4. Configurazione applicata per Pages → Ollama locale
1. `deploy.yml`: il build esporta `VITE_OLLAMA_URL=http://localhost:11434` e
   `VITE_OLLAMA_MODEL=llama3.1:8b` (rimosso `VITE_API_BASE`).
2. Lato Ollama, autorizzata l'origine del sito (CORS):
   ```bash
   launchctl setenv OLLAMA_ORIGINS "https://francesco0123.github.io"
   ```
   poi **riavviare Ollama** (legge la variabile solo all'avvio).
3. Modello locale disponibile: `ollama pull llama3.1:8b`.

### Ostacoli del browser (HTTPS → http://localhost)
- **Mixed content**: `localhost`/`127.0.0.1` è esente → di norma passa.
- **CORS**: risolto da `OLLAMA_ORIGINS`.
- **Private Network Access** (Chrome/Brave): può pretendere l'header
  `Access-Control-Allow-Private-Network: true` che Ollama non invia. Nel test su Brave
  **non** ha bloccato. Se in futuro bloccasse, il fallback è un **reverse-proxy Caddy in
  locale** (HTTPS + header PNA davanti a Ollama, sempre sul PC dell'utente) e
  `VITE_OLLAMA_URL=https://localhost:8443`.

### Conseguenza importante
Con questo setup il sito su Pages usa **solo** Ollama locale: funziona unicamente se
chi apre il sito ha Ollama in esecuzione sul proprio PC. Per chiunque altro (o con
Ollama spento) il chatbot va in errore. È una scelta "locale-only" voluta.

---

## 5. ⭐ Come tornare ad usare Ollama CLOUD

### 5a. In locale (dev / preview)
La modalità locale è attiva solo perché `.env.local` contiene `VITE_OLLAMA_URL`.
Per tornare al cloud in locale: **commentare o rimuovere** in `.env.local` le righe
```
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.1:8b
```
e assicurarsi che `.env` abbia `VITE_OLLAMA_MODEL=qwen3-coder-next:cloud` (default cloud).
**Riavviare** `npm run dev` (Vite legge gli env solo all'avvio). Senza `VITE_OLLAMA_URL`
il selettore torna automaticamente alla modalità cloud.

### 5b. Su GitHub Pages
Ripristinare lo step di build in `.github/workflows/deploy.yml`:
```yaml
      - run: npm run build
        env:
          VITE_OLLAMA_MODEL: qwen3-coder-next:cloud
          # URL del backend (es. deploy Vercel con /api/ollama). Variabile di repo.
          # La API key NON sta qui: vive solo sul backend (env OLLAMA_API_KEY).
          VITE_API_BASE: ${{ vars.API_BASE }}
```
cioè: **togliere `VITE_OLLAMA_URL`** (questo, da solo, riporta in modalità cloud) e
**rimettere `VITE_API_BASE`** che punta al backend (variabile di repo `API_BASE`).
Poi commit + push: il workflow ribuilda il sito in modalità cloud.

> Regola mnemonica: **`VITE_OLLAMA_URL` presente = locale; assente = cloud.** È l'unico
> interruttore. `VITE_API_BASE` serve solo quando si è in cloud.

### 5c. (Opzionale) Rimuovere l'autorizzazione CORS
Se non serve più il collegamento da Pages:
```bash
launchctl unsetenv OLLAMA_ORIGINS
```
e riavviare Ollama. (Nota: `launchctl setenv` può non sopravvivere al riavvio del Mac;
per renderlo permanente servirebbe un LaunchAgent.)

---

## 6. Verifica
- `npm run lint` pulito sui tre file `ollama*.js`.
- Test su `https://francesco0123.github.io/webapp/` → pagina **Assistente AI**:
  connessione diretta **browser → `127.0.0.1:11434`** (verificata via `lsof`), risposta
  in streaming dal modello `llama3.1:8b`. `OLLAMA_ORIGINS` correttamente letto da Ollama.
