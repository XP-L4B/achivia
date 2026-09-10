# 08 — Tab Teams, ritocchi Employees e fix accessibilità form

**Data:** 2026-06-10
**Richiesta:** Completare la tab Teams del dettaglio dipendente, sistemare la lista
Employees e correggere un avviso di accessibilità sui campi form.

---

## Modifiche

### 1. Dettaglio dipendente — tab Teams
`src/pages/manager/EmployeeDetailPage.jsx`
- Implementata la tab **Teams**: elenca i team di appartenenza del dipendente.
- Ogni team è una card con **nome** e **ruolo** (badge, es. Membro / Referente / Team Lead).
- Dati mock distinti per dipendente; messaggio "Nessun team di appartenenza" se vuoto.
- Resta solo **Analytics** come segnaposto.

### 2. Lista Employees — ritocchi
`src/pages/manager/MgrEmployeesPage.jsx`
- Rimossa la descrizione "Dipendenti del team.".
- Placeholder ricerca aggiornato in "Cerca per nome, team o livello raggiunto…".
- Reintrodotto il **livello** in ogni card, come badge col **colore primario** del sito
  (`badge-primary`).
- Input ricerca con `id` / `name` / `aria-label` (vedi punto 3).

### 3. Fix accessibilità campi form
Avviso del browser: *"A form field element should have an id or name attribute"*.
Aggiunto l'attributo `name` (e dove utile `aria-label`, `autoComplete`, `label htmlFor`)
a **tutti** i campi form del progetto:

| File | Campi |
|---|---|
| `pages/auth/AuthChoicePage.jsx` | email, password, conferma (+ autoComplete) |
| `pages/auth/ResetPasswordPage.jsx` | nuova password, conferma |
| `pages/auth/OrgFormPrivatePage.jsx` | nome org, codice |
| `pages/auth/OrgFormCompanyPage.jsx` | nome, indirizzo, P.IVA, codice |
| `pages/auth/RegFormJoinPage.jsx` | codice organizzazione |
| `pages/admin/BuyCreditsPage.jsx` | numero crediti |
| `pages/shared/SettingsPage.jsx` | checkbox notifiche / dark mode (+ `label htmlFor`) |
| `pages/manager/QuestNewPage.jsx` | nome, descrizione, scadenza, tipologia, XP, crediti, note, checkbox, assegnatario |
| `pages/manager/ProjectNewPage.jsx` | nome, descrizione, date, ricerca dipendente |
| `pages/manager/MgrEmployeesPage.jsx` | ricerca |

---

## Verifica

- `npm run lint` pulito.
- L'avviso sui campi form non compare più su nessuna pagina.

---

## Stato dettaglio dipendente

Tab implementate: **Overview** (info personali + KPI quest), **Quests** (in corso/scadute),
**Teams** (team di appartenenza). **Analytics** ancora segnaposto. Tutti dati mock.
