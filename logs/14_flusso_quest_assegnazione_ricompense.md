# 14 — Flusso Quest: assegnazione, accettazione, approvazione e ricompense

**Data:** 2026-06-14

Ciclo di vita completo di una Quest tra manager e dipendente: creazione/assegnazione,
notifiche, accettazione/rifiuto, approvazione con accredito di XP e crediti, più il
riordino delle sezioni Quest del manager e diversi ritocchi UI.

---

## 1. Creazione e assegnazione
- "Salva" crea sempre una Quest **attiva** (`in_corso`), assegnata o meno. Senza
  destinatario diventa una **Side Quest**.
- "Usa come template" crea un modello (`template`) → sezione **Quest salvate**.
- L'assegnatario può essere un **dipendente**, un **dipartimento** o un **altro manager**
  della stessa organizzazione (`getOtherManagers`).
- Le Quest assegnate a un dipendente nascono con `accepted: false`.

## 2. Notifiche al dipendente
- Alla creazione assegnata a un employee parte una notifica "Ti è stata proposta una
  quest" (`addNotification`), con badge non letti sul profilo (`getUnreadCount`).
- La sezione **Messaggi** elenca le notifiche, linka a `/employee/quests` e azzera il
  contatore all'apertura (`markNotificationsRead`).

## 3. Accettazione / rifiuto (lato dipendente)
- Card con titolo, descrizione, crediti/XP, scadenza e pillola di stato in alto a destra:
  **Da accettare** (arancione) → **In corso** (verde, su "Accetta") → **In approvazione**
  (arancione, su "Richiedi approvazione") → **Approvato** (verde).
- "Accetta" salva `accepted: true` + `acceptedAt`.
- "Rifiuta" apre un pop-up "Motivo del rifiuto" con pillole **Annulla** / **Conferma
  rifiuto**; salva `rejected`, `rejectionReason`, `rejectedAt`.

## 4. Sezioni Quest del manager
Pagina `MgrQuestsPage` resa uniforme (tutte `card-row` con conteggio):
**My Quest** (quest assegnate al manager da altri manager), Nuova Quest, In scadenza,
**Quest attive**, Approvazione, **Quest rifiutate**, **Quest salvate**.
- **Quest attive**: titolo, tipologia, descrizione, assegnatario, crediti/XP, date di
  creazione e scadenza; pillola di stato **Da accettare** → **In corso**; il "?" accanto
  all'assegnatario diventa `(accettata il …)` all'accettazione.
- Su **rifiuto** la Quest esce da "Quest attive" e passa a **Quest rifiutate**, con
  `(Rifiutato il …)` e il **Motivo del rifiuto**.

## 5. Approvazione con ricompense
- `approveQuest` accredita XP e crediti all'assegnatario (una sola volta).
- **Level up incrementale**: soglia `xpForNextLevel(level) = level * 500`; l'eccedenza è
  riportata sul livello successivo (gestiti più salti). Profilo allineato alla stessa
  soglia e letto fresco dal DB.

## 6. Sync reattivo tra schede/viste
`db.js` espone `subscribe`/`emit`: `save()` notifica gli iscritti e un listener su
`storage`/`visibilitychange` riallinea lo snapshot. Tutte le pagine Quest (manager e
dipendente) e il profilo si aggiornano senza ricaricare.

## 7. Default utenti e reset
- Tutti gli utenti partono da **livello 1, 0 XP, 0 crediti** (anche i nuovi via `addUser`).
- 3 account demo con valori iniziali: Admin (500 crediti), Manager Laura (lvl 3, 300 XP,
  200 cr), Dipendente Alice (lvl 5, 1240 XP, 320 cr).
- Quest del seed svuotate. `?reset` svuota **solo le quest**; `?reset=all` fa il **reset
  completo** dal seed.

## 8. Ritocchi UI
- Pillole **XP/crediti** con interno trasparente e dimensione allineata ai badge.
- Bottoni dipendente resi pillole, centrati ("Richiedi approvazione" / "Richiedi aiuto").

---

## Verifica
- `npm run lint` pulito, `npm run build` ok.
- Flusso provato dal vivo sul dev server (sessioni di lavoro): creazione →
  notifica → accetta/rifiuta → approvazione → accredito XP/crediti e level up.
