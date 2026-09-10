# 10 — Personalizza personaggio, form Nuova Quest, Quest in scadenza

**Data:** 2026-06-10

---

## 1. Personalizza personaggio (`CustomizeCharacterPage.jsx`)
Dal profilo Manager il pulsante **"Personalizza"** ora è un link alla nuova pagina
`/manager/profile/customize`. La pagina permette di scegliere:
- **Sesso** (pillole: Maschile / Femminile / Altro)
- **Colore della pelle** (palette di pastiglie circolari selezionabili)
- **Set di vestiario** (select per slot): Copricapo, Top, Bottom, Scarpe, Arma (da impugnare)

Stato locale React funzionante; salvataggio ancora placeholder. Route aggiunta in
`router/index.jsx`.

## 2. Form Nuova Quest (`QuestNewPage.jsx`)
- **XP in palio** e **Crediti in palio** ora sulla stessa riga, affiancati.
- Area **Note** con **auto-resize**: un componente `AutoTextarea` adatta l'altezza al
  contenuto (niente maniglia di resize né scrollbar interna).
- **Fix globale checkbox/radio** (`src/index.css`): la regola generale sugli input le
  rendeva riquadri a tutta larghezza; ora tornano all'aspetto nativo con `accent-color`
  viola. Vale per tutte le pagine (es. Impostazioni).

## 3. Quest in scadenza e scadute (`QuestExpiringPage.jsx`)
Pagina implementata: mostra le quest in scadenza entro 48h e quelle già scadute.
Ogni card ha: **titolo**, **tipologia** (badge accanto al nome), **descrizione**,
**assegnatario**, **XP** e **crediti**. La pillola di stato mostra **direttamente la data
di scadenza** (arancione = in scadenza, rosso = scaduta).

**Filtri** funzionanti in cima alla lista:
- Stato a pillole: Tutte / Scadute / In scadenza
- Select con label sopra: **Tipologia Quest** e **Assegnatario** (opzioni derivate dai dati)

Dati estesi in `src/data/quests.js` (`EXPIRING_QUESTS` con type, description, deadline, status).

## 4. Bottone invio messaggio all'assegnatario
- Estratta l'icona aeroplanino nel componente condiviso `src/components/ui/SendIcon.jsx`.
- Riusato sia in `EmployeeDetailPage` (header) sia nelle card delle Quest in scadenza
  (bottone `icon-btn` accanto all'assegnatario). Rimosso l'SVG duplicato `MessageIcon`.
- Il click è UI-only (manca il backend di messaggistica).

---

## Verifica
- `npm run lint` pulito.
