# 15 — Notifiche di approvazione e sezione Messaggi

**Data:** 2026-06-14

Estensione del sistema di notifiche al lato manager e revisione della sezione Messaggi.

---

## 1. Notifica di richiesta approvazione al manager
Quando un dipendente clicca **"Richiedi approvazione"** su una sua Quest
(`EmpQuestsPage`), oltre a portarla in stato `da_approvare` viene creata una notifica
per il **manager che ha creato la Quest** (`userId: q.createdById`, tipo
`approval_request`, testo `"<titolo>" attende la tua approvazione`).

## 2. Badge notifiche sul profilo manager
`MgrProfilePage` aveva un badge fisso ("3"): ora è **data-driven** (`getUnreadCount`),
reattivo via `subscribe`, e legge livello/XP/crediti freschi dal DB con la soglia
incrementale `xpForNextLevel`. Stesso comportamento già presente sul profilo dipendente.

## 3. Link del messaggio per tipo
In `MessagingPage` la destinazione dipende dal tipo di notifica:
- `quest_proposal` → `/employee/quests`
- `approval_request` → `/manager/management/quests/approve`

## 4. Messaggi svuotati dopo la visita
Aprendo `/messaging` si prende uno **snapshot** dei messaggi (restano visibili durante la
visita), poi le notifiche dell'utente vengono **rimosse dal DB**
(`clearNotificationsForUser`). Tornando indietro la sezione è vuota e il contatore è
azzerato.

---

## Verifica
- `npm run lint` pulito, `npm run build` ok.
- Flusso provato dal vivo: "Richiedi approvazione" → badge sul profilo manager →
  apertura Messaggi → link all'approvazione → ritorno con sezione vuota.
