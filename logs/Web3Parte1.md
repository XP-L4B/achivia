# Web3 — Parte 1: Connessione Wallet e impalcatura NFT

**Data:** 2026-06-09
**Obiettivo iniziale:** integrare gli smart contract / NFT tramite le API di OpenSea nel
Marketplace di Achivia, partendo dalla testnet **Sepolia** per sicurezza.

Questo documento spiega in modo discorsivo **cosa è stato fatto**, cosa funziona davvero
oggi e cosa è rimasto in sospeso.

---

## In una frase

Abbiamo aggiunto alla webapp la possibilità per un utente di **collegare il proprio wallet**
(es. MetaMask) e abbiamo preparato tutta l'impalcatura per **mostrare NFT** nel Marketplace.
La connessione wallet funziona; la vetrina NFT è costruita ma non ancora operativa.

---

## Cosa funziona davvero

### Connessione del wallet
Nel Marketplace è comparso il bottone **"Connetti Wallet"**.
- L'utente clicca, MetaMask si apre, l'utente approva.
- La webapp legge e mostra l'**indirizzo** del wallet (es. `0x1234…abcd`) e offre "Disconnetti".
- È **solo lettura dell'identità**: nessuna transazione, nessun movimento di fondi.
  La webapp non può firmare nulla da sola — qualunque azione futura richiederà sempre
  la conferma esplicita dell'utente dentro MetaMask.

Questa parte non richiede alcuna chiave API: è già provabile in locale.

---

## Cosa è stato costruito ma non è ancora operativo

### Vetrina NFT (lettura da OpenSea)
È stata realizzata tutta la "tubatura" per mostrare NFT reali:
- un **proxy serverless** che tiene la chiave API di OpenSea al sicuro lato server
  (la chiave non finisce mai nel codice scaricato dal browser);
- lo stesso proxy funziona anche in locale durante lo sviluppo;
- il Marketplace ha una sezione "NFT" pronta a riempirsi di immagini e nomi.

La chiave API fornita è stata **verificata ed è valida**.

### Perché non mostra ancora NFT
Durante i test è emerso un ostacolo esterno: **le API di OpenSea non supportano più le testnet**
(né Sepolia né altre). Funzionano solo le reti "reali" (mainnet). Per questo la vetrina,
pensata per Sepolia, al momento non riceve dati.

---

## Cosa NON è ancora stato fatto

- **Comprare / scambiare NFT**: previsto come "Parte 2". Per ora nel Marketplace c'è solo
  un bottone segnaposto disabilitato ("Compra (presto)").

---

## Decisione lasciata in sospeso

Per far funzionare davvero la vetrina NFT bisognerà scegliere tra:
1. **Vetrina su mainnet (solo visualizzazione)** — guardare gli NFT è gratis e sicuro;
   il rischio economico riguarderebbe solo l'eventuale acquisto, non ancora implementato.
2. **Restare su testnet cambiando fonte dati** — usare un altro fornitore che indicizza
   Sepolia (es. Alchemy o Reservoir) al posto di OpenSea.
3. **Pausa** — riprendere più avanti.

Al momento la scelta è: **pausa** (opzione 3).

---

## Stato tecnico in breve

- Codice già pubblicato su GitHub (`main`): il sito si compila e funziona; la sezione NFT
  mostra solo un avviso finché non viene configurata.
- La chiave API è salvata solo in locale (`.env.local`, non caricata su GitHub).
- Dettagli tecnici completi (file, pacchetti, variabili) in `logs/05_integrazione_opensea.md`.
