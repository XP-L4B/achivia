# riccardo è stato qui

Webapp di gamification aziendale: un Manager assegna Quest ai Dipendenti, che
completandole guadagnano punti esperienza (XP), salgono di livello e ottengono
crediti da spendere in un Marketplace interno.

Documentazione funzionale in `Specs/`:

| File | Contenuto |
|---|---|
| `achivia_spec.xml` | Analisi funzionale completa (XP-L4B v1.0) |
| `achivia_navigation.xml` | Grafo di navigazione: schermate, bottoni, transizioni |
| `achivia_gap.xml` | Cosa manca alla consegna e decisioni prese |

## Avvio in locale

```bash
npm install
npm run dev
```

Account di prova (definiti in `src/data/seed.json`):

| Ruolo | Email | Password |
|---|---|---|
| Admin | `admin@achivia.test` | `admin` |
| Manager | `laura@achivia.test` | `manager` |
| Dipendente | `alice@achivia.test` | `emp` |

I dati vivono in `localStorage`, non su un server: sono quindi separati per
browser e per utente. Per ripartire dai dati iniziali aggiungi `?reset=all`
all'indirizzo, oppure usa "Ripristina dati di test" dal Menu.

## Struttura

```
src/
  router.jsx      rotte dell'app, allineate a Specs/achivia_navigation.xml
  pages/          schermate divise per area: auth, admin, manager, employee, shared
  components/     layout per ruolo, navbar, pillole XP/crediti/livello
  data/db.js      archivio su localStorage con seed, notifiche e sottoscrizioni
  lib/            integrazioni opzionali: OpenSea, Ollama, wallet
api/              funzioni serverless che tengono le API key lato server
```

## Pubblicazione

Ogni push su `main` compila con Vite e pubblica `dist/` su GitHub Pages
(`.github/workflows/deploy.yml`). Il sito è servito sotto `/achivia/`, valore
impostato in `vite.config.js`: cambiando il nome del repository va aggiornato
anche lì, altrimenti gli asset vengono cercati a un percorso inesistente.

## Integrazioni opzionali

Nessuna è necessaria per usare l'app. Si attivano con variabili d'ambiente:

| Variabile | Effetto |
|---|---|
| `VITE_DEMO_COLLECTION` | Mostra nel Marketplace gli NFT di un contratto su Sepolia |
| `VITE_OLLAMA_URL` | Assistente AI servito da un Ollama locale |
| `OPENSEA_API_KEY`, `OLLAMA_API_KEY` | Chiavi lato server per i proxy in `api/` |
