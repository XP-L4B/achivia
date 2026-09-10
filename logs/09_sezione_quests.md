# 09 — Sezione Quests (hub Manager)

**Data:** 2026-06-10
**Richiesta:** Ristrutturare la pagina Quests del Manager: sezioni collassabili,
contenuti reali per ogni sezione, contatori, e una resa grafica coerente.

---

## Panoramica

L'hub Quests (`/manager/management/quests`) è passato da semplice elenco di link a
una pagina con **sezioni collassabili** (accordion) che mostrano le quest in linea,
più alcune voci che restano link verso pagine dedicate.

Struttura finale delle sezioni:

| Sezione | Tipo | Contenuto |
|---|---|---|
| My Quest | collassabile | Quest del manager con stato Approvato/Rifiutato |
| Nuova Quest | link | Crea una nuova Quest |
| Quest in scadenza e scadute | link | Pagina dedicata |
| Quest attive | link | Pagina dedicata (a sua volta con 2 accordion) |
| Approvazione Quest | collassabile | Quest create per altri, da revisionare |
| Quest salvate | collassabile | Quest create ma non ancora assegnate |

---

## Dettaglio modifiche

### My Quest (in `MgrQuestsPage.jsx`)
- Rimossa la frase "Le mie Quest assegnate: 3 attive" e poi anche il conteggio testuale.
- Sezione **collassabile**: cliccando si espandono verso il basso le quest attive.
- Ogni quest mostra: titolo, **stato** (badge verde "Approvato" / rosso "Rifiutato"),
  **XP** in pillola viola e **crediti** in pillola gialla tenue.

### Pillole XP / crediti (`src/index.css`)
- Gli XP sono mostrati in una **pillola viola** (`--primary-light` / `--primary`),
  i crediti in una **pillola gialla non accesa** (`#fdf3c7` / `#a07b1e`).
- Forma comune condivisa tra `.xp-circle` e `.credits-pill`.

### Quest in scadenza e scadute
- Rinominata da "Quest in scadenza" a "Quest in scadenza e scadute".

### Pagina Quest Attive (`QuestActivePage.jsx`)
- Mostra le quest in corso in **due sezioni collassabili**:
  - **Create da me**
  - **Assegnate ad altri** (con nome assegnatario)
- Badge "In corso" grigio chiaro; pillole XP/crediti.

### Approvazione Quest
- Resa **collassabile in linea** nell'hub (non più pagina dedicata).
- Mostra le quest create dal manager per altri dipendenti che necessitano revisione,
  con pillola **arancione "Necessita revisione"** (`.badge-warning`) e assegnatario.

### Quest salvate
- Resa **collassabile in linea**: quest create ma non ancora assegnate,
  con badge grigio "Non assegnata".

### Contatori per sezione
- Ogni sezione mostra un **numero grigio** (quante quest contiene) prima della freccia.
- I numeri derivano dalla **lunghezza reale** degli array.

### Dati condivisi (`src/data/quests.js`) — nuovo file
- Tutti i dati mock delle quest centralizzati: `MY_ACTIVE_QUESTS`,
  `ACTIVE_CREATED_BY_ME`, `ACTIVE_ASSIGNED_TO_OTHERS`, `TO_REVIEW`,
  `EXPIRING_QUESTS`, `SAVED_QUESTS`.
- Importati sia dall'hub sia da `QuestActivePage`, così i contatori restano coerenti.

### Pulizia
- Rimosse le **descrizioni brevi** sotto al nome di ogni sezione.
- Estratti i componenti `CollapsibleRow`, `ToReviewCard`, `SavedCard`, `QuestRewards`
  per ridurre la duplicazione.
- Rimosse le pagine/route ora gestite in linea: `QuestApprovePage` e `QuestSavedPage`
  (con relative route in `router/index.jsx`); la notifica "Richiesta approvazione"
  in `MgrNotificationsPage` punta ora all'hub Quests.

---

## Nota dati

Tutti i contenuti sono **mock** in `src/data/quests.js`. I contatori delle sezioni-link
"in scadenza" e "salvate" derivano da array mock condivisi; quando le rispettive
pagine mostreranno dati reali, basterà aggiornare il modulo dati.

## Verifica

- `npm run lint` e `npm run build` puliti.
