# 07 — Dettaglio dipendente e ritocchi UI

**Data:** 2026-06-10
**Richiesta:** Una serie di modifiche su Gestione Utenti, navbar Manager, lista dipendenti
e soprattutto la pagina di dettaglio del singolo dipendente.

---

## Premessa sul flusso di lavoro

D'ora in poi si lavora con il **dev server di Vite** (`npm run dev`, su
`http://localhost:5173/webapp/`): le modifiche si vedono in locale all'istante
(hot reload), senza bisogno di fare push per ogni cambiamento. Il push su GitHub
Pages serve solo per pubblicare la versione online.

---

## Modifiche

### 1. Gestione Utenti — sezione grant separata
`src/pages/admin/AdminUsersPage.jsx`
- Estratto "assegnazione grant (organigramma)" dalla descrizione e spostato in una
  sezione dedicata **"Assegnazione livelli di grant"** (segnaposto).
- Le due sezioni usano lo stesso componente `PageShell`, quindi hanno stile identico.

### 2. Navbar Manager — etichetta tab
`src/components/layouts/ManagerLayout.jsx`
- Ripristinata l'etichetta **"Management"** (era stata accorciata in "Manage" per il mobile).

### 3. Lista dipendenti — rimozione livello
`src/pages/manager/MgrEmployeesPage.jsx`
- Rimosso il badge "Liv. X" da ogni dipendente.
- Tolto il campo `level` dai dati mock.
- Placeholder ricerca aggiornato in "Cerca per nome o team…".

### 4. Dettaglio dipendente — tab Overview
`src/pages/manager/EmployeeDetailPage.jsx`
- Le tab (Overview / Quests / Teams / Analytics) ora sono **cliccabili** (stato React).
- **Overview** mostra:
  - **Informazioni personali**: email, dipartimento, livello attuale, punti esperienza,
    crediti disponibili.
  - **KPI Quest**: totali assegnate, completate, pending, percentuale di completamento
    (calcolata), scadute.
- Dati mock distinti per i 3 dipendenti; fallback "Dipendente non trovato".

### 5. Dettaglio dipendente — tab Quests
`src/pages/manager/EmployeeDetailPage.jsx`
- La tab **Quests** elenca le quest **in corso** o **scadute**: card con titolo,
  badge di stato (viola "In corso" / rosso "Scaduta"), scadenza, XP e crediti.

### 6. Dettaglio dipendente — pulizia header
`src/pages/manager/EmployeeDetailPage.jsx`
- Rimossa la descrizione ridondante ("KPI, quest assegnate, team e analytics…"):
  il contenuto è già tutto sotto. Resta solo il nome del dipendente come titolo.

### 7. Pulsante "Invia messaggio" → icon button
`src/components/ui/PageShell.jsx`, `src/index.css`, `src/pages/manager/EmployeeDetailPage.jsx`
- Il pulsante è stato spostato **in alto a destra**, sulla stessa riga del nome.
- È un **bottone circolare** con icona **aeroplanino di carta** (send), in SVG (no emoji).
- `PageShell` ha una nuova prop opzionale **`action`** (nodo renderizzato a destra del
  titolo) — riutilizzabile in altre pagine.
- Nuova classe CSS `.icon-btn`: cerchio con icona dimensionata **in percentuale** rispetto
  al bottone (così cambiando la dimensione del bottone l'icona si adatta da sola).
- Il `viewBox` dell'icona è stato ritagliato (`2 2 20 20`) per togliere il margine interno
  del disegno, così l'aeroplanino riempie davvero il cerchio.

---

## File nuovi

| File | Ruolo |
|---|---|
| `logs/07_dettaglio_dipendente_e_ritocchi.md` | Questo log |

## Classi CSS aggiunte (`src/index.css`)

| Classe | Uso |
|---|---|
| `.icon-btn` | Bottone circolare con icona proporzionale |
| `.tab-pills` / `.tab-pill` | Tab a "pillola" cliccabili (dettaglio dipendente) |
| `.info-list` / `.info-row` | Lista label/valore (informazioni personali) |

---

## Nota sui dati

Tutti i contenuti del dettaglio dipendente (informazioni personali, KPI, quest) sono
**dati mock** definiti in `EmployeeDetailPage.jsx`. Le tab **Teams** e **Analytics** sono
ancora segnaposto ("da implementare").
