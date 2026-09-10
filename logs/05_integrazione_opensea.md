# 05 — Integrazione OpenSea (NFT + Wallet)

**Data:** 2026-06-09
**Richiesta:** Integrare smart contract / NFT tramite le API di OpenSea nel Marketplace, con possibilità di mostrare e (in futuro) scambiare NFT.

**Decisioni prese:** rete **testnet Sepolia**; **proxy serverless** per tenere la API key lato server; scenario **vetrina + trading** (questa è la *slice 1*: solo visualizzazione + connessione wallet; acquisto/scambio rinviati alla slice 2).

---

## Pacchetti installati

| Pacchetto | Motivo |
|---|---|
| `wagmi` | Connessione wallet (hooks React) |
| `viem` | Client Ethereum sottostante a wagmi |
| `@tanstack/react-query` | Cache/stato delle query (richiesto da wagmi + usato per le fetch NFT) |

> Slice 2 (trading) richiederà inoltre `opensea-js` + `ethers@6`.

---

## Architettura

- La **API key OpenSea non finisce mai nel bundle**: il browser parla solo con un proxy.
- **In locale:** un plugin del dev-server Vite intercetta `/api/opensea` e riusa lo stesso handler della funzione serverless.
- **In produzione:** il frontend resta su GitHub Pages; il proxy va deployato a parte (es. Vercel) e il frontend lo raggiunge via `VITE_OPENSEA_PROXY_URL`.
- Il proxy è **read-only**: una allowlist consente solo gli endpoint di lettura (nfts/collections/listings/offers).

```
browser ──(/api/opensea?path=…)──▶ proxy (con OPENSEA_API_KEY) ──▶ api.opensea.io
```

---

## File creati

| File | Ruolo |
|---|---|
| `api/_core.js` | Logica condivisa del proxy: allowlist endpoint + iniezione `OPENSEA_API_KEY` |
| `api/opensea.js` | Funzione serverless (formato Vercel) con CORS, usa `_core.js` |
| `src/lib/wagmi.js` | Config wallet: chain Sepolia + connettore `injected` (MetaMask) |
| `src/lib/opensea.js` | Client browser → chiama solo il proxy (`fetchCollectionNfts`) |
| `src/hooks/useCollectionNfts.js` | Hook react-query per gli NFT di un contratto |
| `src/components/web3/ConnectWalletButton.jsx` | Bottone Connetti / Disconnetti wallet |
| `.env.example` | Documentazione variabili d'ambiente |

## File modificati

| File | Modifica |
|---|---|
| `src/App.jsx` | App avvolta in `WagmiProvider` + `QueryClientProvider` |
| `src/pages/shared/MarketplacePage.jsx` | Aggiunta sezione "NFT · Sepolia" (loading/errore/config mancante) + bottone wallet; mantenuti i prodotti a crediti |
| `vite.config.js` | `loadEnv` + plugin dev `opensea-dev-proxy` (riusa `api/_core.js`) |
| `eslint.config.js` | Ambiente Node per `api/**/*.js` e `*.config.js` (fix `process is not defined`) |

---

## Variabili d'ambiente (`.env.local`, non committato)

| Variabile | Lato | Descrizione |
|---|---|---|
| `OPENSEA_API_KEY` | server | API key OpenSea (da `docs.opensea.io`). In locale letta dal dev-server, in prod impostata su Vercel |
| `VITE_OPENSEA_PROXY_URL` | client | URL del proxy serverless deployato; vuoto in locale (usa `/api/opensea`) |
| `VITE_DEMO_COLLECTION` | client | Indirizzo `0x…` del contratto su Sepolia da mostrare |

---

## Stato e verifica

- `npm run build` ok · `npm run lint` pulito
- Smoke test del proxy in dev: errori chiari (`OPENSEA_API_KEY non configurata`, endpoint non consentito)
- Il bottone **Connetti Wallet** funziona senza key; la griglia NFT richiede `OPENSEA_API_KEY` + `VITE_DEMO_COLLECTION`
- Nota: bundle salito a ~418 kB (gzip ~127 kB) per wagmi/viem

---

## TODO — Slice 2 (trading)

- Aggiungere `opensea-js` + `ethers@6`
- Estendere il proxy/letture per i **listing** (prezzo NFT)
- Implementare **acquisto** (`fulfillOrder`) e **listing/offerte** firmate dal wallet — placeholder già presente: bottone "Compra (presto)" in `MarketplacePage`
