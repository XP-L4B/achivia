# 11 — Profilo Manager, avatar, dettaglio/lista employee, template quest

**Data:** 2026-06-11

---

## 1. Profilo Manager (`MgrProfilePage.jsx`)
- **Avatar pixel art**: sostituita l'emoji 👤 con uno sprite LPC trasparente
  (`src/assets/avatar.png`, frame riga 3 / colonna 1 estratto dallo spritesheet),
  mostrato a pixel netti (`image-rendering: pixelated`) senza riquadro di sfondo.
- **Icona messaggi stile Twitter** con contatore al posto del badge testuale "DM 3"
  (link a `/messaging`, posizionata in alto a destra).
- **Header centrato**: nome, tema di appartenenza e avatar centrati orizzontalmente.
- **Riga XP**: a sinistra "Livello · crediti", a destra "XP attuali / necessari" sopra la barra.
- Rimosse le 3 stat-card (Livello/XP/Crediti) e le badge ANALYTICS/QUESTS/BADGES.

## 2. Pulizia asset
Rimossi gli asset inutilizzati `hero.png`, `react.svg`, `vite.svg` da `src/assets/`.

## 3. Dettaglio employee (`EmployeeDetailPage.jsx`)
- **Pillole sotto il nome**: Livello (viola), XP (verde chiaro), Crediti (giallo chiaro);
  rimosse le info-row corrispondenti dalla tab Overview.
- **Stat-card Quest su due righe**: 2 sopra (Totali assegnate, Completamento) e 3 sotto
  più piccole (Completate, In corso, Scadute).
- **Valori coerenti e derivati**:
  - "In corso" e "Scadute" contano dalla `questList` (stessa fonte della tab Quests).
  - "Totali assegnate" = Completate + In corso + Scadute.
  - "Completamento" = Completate / Totali assegnate.
- **Card quest**: data di scadenza a destra sulla stessa riga delle pillole XP/crediti.
- **Bottone messaggio** senza cerchio: nuova classe `.icon-btn-plain` (solo icona, 24px),
  applicata anche in `QuestExpiringPage`. Rimossa la `.icon-btn` circolare non più usata.

## 4. Lista employee (`MgrEmployeesPage.jsx`)
- **Ricerca dal vivo**: filtra le card-row mentre si digita (nome, email, dipartimento,
  livello), con stato vuoto quando non ci sono risultati.
- **Dipartimento** mostrato accanto all'email ("email - dipartimento").

## 5. Dati employee condivisi (`src/data/employees.js`)
Nuovo modulo come fonte unica: `EMPLOYEES` (dati completi), `DEPARTMENTS` (dipartimenti
distinti), `getEmployeeById(id)`. Lista e dettaglio employee leggono da qui (niente dati
duplicati).

## 6. Form Nuova Quest → "Usa come template" (`QuestNewPage.jsx`)
- Select **"Assegna a"** popolata dai dati reali: optgroup **Dipendenti** e **Dipartimenti**.
- Il bottone **"Usa come template"** appare **solo se non è stato scelto un assegnatario**.
- Al click la quest (nome, XP, crediti) viene aggiunta **in cima** a `SAVED_QUESTS`
  (`addSavedQuest` in `src/data/quests.js`) e l'utente è reindirizzato alla pagina Quests
  con la sezione **"Quest salvate" aperta in automatico** (via `location.state`).

---

## Verifica
- `npm run lint` pulito.
- `npm run build` ok.
