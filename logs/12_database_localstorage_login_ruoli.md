# 12 — Database mock su localStorage e login con ruoli

**Data:** 2026-06-11

Migrazione da dati mock sparsi a un'unica fonte normalizzata su `localStorage`,
con login reale e viste filtrate per utente loggato. Svolta in 4 fasi committabili.

---

## 1. Database e autenticazione (fase 1)
- **`src/data/seed.json`** — seed normalizzato: 1 admin, 2 manager, 5 employee, 13 quest.
  Utenti con `role`, `managerId` (employee → manager), `department`, `level/xp/credits`.
  Quest con `status` unico (`in_corso`, `scaduta`, `da_approvare`, `approvata`,
  `rifiutata`, `template`), `assigneeType`/`assigneeId` (employee o department), `createdById`.
- **`src/data/db.js`** — data layer su localStorage: seed al primo avvio, `version`
  per invalidare, reset via `?reset` nell'URL o `resetDb()`. Espone query
  (`getUsers`, `getEmployeesOfManager`, `getQuestsForEmployee`, viste per manager…)
  e mutazioni (`addQuest`, `updateQuest`) che persistono.
- **`src/context/AuthContext.jsx`** — `login`/`logout`, sessione persistita
  (`achivia_session`). `App.jsx` avvolge il router in `AuthProvider`.
- **`src/components/RequireAuth.jsx`** — guard per ruolo: senza login → `/auth`,
  ruolo errato → propria area. Applicata alle aree admin/manager/employee.
- **Login reale** in `AuthChoicePage`: email+password sul seed, redirect per ruolo.
  Logout collegato in Menu e header Admin. Box "Account demo" con le credenziali.

## 2. Pagine Manager (fase 2)
Profilo, Employees (solo i propri `managerId`), dettaglio employee, e tutte le viste
quest (attive, in scadenza/scadute, approvazione, salvate, "My Quest") come **filtri sul
DB** per il manager loggato. Nuova Quest: assegnatario dal DB, "Salva"/"Usa come template"
creano quest reali. Approvazione: "Conferma" imposta `status: approvata` e persiste.

## 3. Pagine Employee (fase 3)
Profilo del dipendente loggato; "My Quests" mostra solo le sue quest con badge di stato e
"Segna completata" (→ `da_approvare`, persistito); Analytics con KPI derivati dalle sue
quest e da crediti/XP. Si chiude il ciclo: dipendente completa → manager approva.

## 4. Admin e pulizia (fase 4)
`AdminUsersPage`: lista reale di tutti gli utenti dal DB con badge ruolo e ricerca.
Rimossi i mock legacy `src/data/employees.js` e `src/data/quests.js` (non più usati).

---

## Account demo
- Admin: `admin@achivia.test` / `admin`
- Manager: `laura@achivia.test` / `manager` (Marketing), `paolo@achivia.test` / `manager` (Sviluppo)
- Dipendente: `alice@achivia.test` / `emp` (+ marco/sara/luca/giulia, password `emp`)

## Note / da fare
- La **registrazione** rimanda ancora ad aree protette senza creare sessione (rimbalza al login).
- Reset dati sporchi in localStorage: aprire una pagina con `?reset`.

## Verifica
- `npm run lint` pulito, `npm run build` ok.
- Verificato dal vivo: login per ruolo e guard; Manager (profilo, employees filtrati,
  conteggi quest, approvazione); Employee (profilo, sue quest); Admin (8 utenti dal DB).
