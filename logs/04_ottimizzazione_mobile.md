# 04 — Ottimizzazione mobile

**Data:** 2026-06-09
**Richiesta:** Ottimizzare l'app per mobile (analisi prima del codice).

---

## Problemi risolti

### Critici

| Problema | Fix |
|---|---|
| Safe area iOS mancante (notch / Dynamic Island / home bar) | `viewport-fit=cover` in `index.html` + `padding-bottom: env(safe-area-inset-bottom)` sulla tab nav |
| `border-inline` visibile sul telefono | Spostato dentro `@media (min-width: 481px)` — appare solo su desktop come "cornice" |
| Tabella a 4 colonne in `MgrEmployeesPage` → overflow su mobile | Sostituita con card list (nome + email + livello + freccia) |
| Touch target insufficienti su tab bar (~33px) | `.tab-link` con `min-height: 52px`; `.btn` con `min-height: 48px`; `.btn-sm` con `min-height: 44px` |
| Label tab troppo lunghe ("Management", "Notifications") | Accorciate: Management → Manage, Notifications → Alerts, My Quests → Quests |

### Minori

| Problema | Fix |
|---|---|
| `overflow-x` non bloccato | `body { overflow-x: hidden }` |
| Desktop: area fuori dal frame bianca = invisibile | `body { background: #ebebf0 }` |
| Stili inline con colori hardcoded (`#888`, `#6c3fc5`, `#ddd`…) | Sostituiti con variabili CSS (`var(--text-muted)`, `var(--primary)`, `var(--border)`) |
| Input con stile nativo iOS | `-webkit-appearance: none; appearance: none` |
| `tap-highlight` blu su tap | `-webkit-tap-highlight-color: transparent` su button e tab-link |

---

## File modificati

| File | Modifica |
|---|---|
| `index.html` | `viewport-fit=cover` |
| `src/index.css` | Safe area, media query border, overflow-x, sfondo desktop, `.tab-nav` / `.tab-link`, `.card-row`, `.empty-state`, `.section`, `.btn-sm`, touch targets |
| `ManagerLayout.jsx` | Usa `.tab-nav` / `.tab-link` CSS; label accorciate |
| `EmployeeLayout.jsx` | Usa `.tab-nav` / `.tab-link` CSS; label accorciate |
| `MgrEmployeesPage.jsx` | Tabella → card list con `.card-row` |
| `MgrQuestsPage.jsx` | Colori hardcoded → variabili CSS; usa `.card-row` |
| `MgrManagementPage.jsx` | Colori hardcoded → variabili CSS; usa `.card-row` |
| `MgrNotificationsPage.jsx` | Colori hardcoded → variabili CSS |
| `EmpHelpPage.jsx` | Colori hardcoded → variabili CSS; usa `.empty-state`, `.section` |
| `MarketplacePage.jsx` | Colori hardcoded → variabili CSS |
