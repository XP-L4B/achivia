# 03 — Refactor CSS base

**Data:** 2026-06-09
**Richiesta:** Migliorare la leggibilità del CSS delle pagine con una base semplice, senza effetti complessi.

---

## Problemi risolti

- `h1` a 56px e `#root` a 1126px centrato erano residui del template Vite, incompatibili con un layout mobile
- Gli stili erano tutti inline sparsi nei singoli componenti, non riutilizzabili
- Nessuna variabile CSS condivisa → colori e spaziature hardcoded ovunque

---

## File modificati

### `src/index.css` — riscritto completamente
Nuovo sistema di design con:
- **Variabili CSS** (`--primary`, `--text`, `--bg`, `--border`, `--radius`, `--space-*`, ecc.)
- **Reset** (`box-sizing: border-box`, margin/padding a 0)
- **Base tipografica** pulita: h1 (1.75rem), h2 (1.25rem), h3, h4, p
- **Form elements** globali: input, select, textarea con focus violet
- **Classi utility** riutilizzabili:
  - Layout: `.page`, `.page-center`, `.card`, `.divider`
  - Bottoni: `.btn`, `.btn-primary`, `.btn-outline`, `.btn-danger`, `.btn-ghost`
  - Form: `.form`, `.label`, `.hint`
  - Badge/tag: `.badge`, `.badge-primary`, `.badge-success`, `.badge-danger`, `.badge-neutral`
  - Tabella: `.table`
  - Statistiche: `.stats-grid`, `.stat-card`, `.stat-value`, `.stat-label`
  - Menu list: `.menu-list`, `.menu-item`, `.menu-link`
  - XP bar: `.xp-bar`, `.xp-fill`

### `src/App.css` — svuotato
Rimosso tutto il codice del template Vite (stili hero, counter, ticks, spacer, ecc.).

### Componenti aggiornati per usare le classi CSS
Rimossi gli stili inline ridondanti e sostituiti con classi utility:

| File | Cosa è cambiato |
|---|---|
| `AuthChoicePage.jsx` | `.page-center`, `.form`, `.btn`, `.btn-primary` |
| `RegFormNewPage.jsx` | `.page-center`, `.form`, `.btn-primary`, `.btn-outline` |
| `RegFormJoinPage.jsx` | `.page-center`, `.form`, `.btn-primary` |
| `SplashPage.jsx` | `.page-center` |
| `ManagerLayout.jsx` | Variabili CSS per colori e spaziature |
| `EmployeeLayout.jsx` | Variabili CSS per colori e spaziature |
| `AdminLayout.jsx` | Variabili CSS per colori e spaziature |
| `PageShell.jsx` | Variabili CSS per spaziature |
| `MgrProfilePage.jsx` | `.page`, `.stats-grid`, `.stat-card`, `.xp-bar`, `.badge`, `.btn-outline` |
| `EmpProfilePage.jsx` | `.page`, `.stats-grid`, `.stat-card`, `.xp-bar`, `.btn-outline` |
| `EmpQuestsPage.jsx` | `.card`, `.badge-neutral` |
| `EmpAnalyticsPage.jsx` | `.stats-grid`, `.stat-card`, `.btn-primary` |
| `MenuPage.jsx` | `.menu-list`, `.menu-item`, `.menu-link` |
| `SettingsPage.jsx` | `.badge-neutral`, variabili CSS |
