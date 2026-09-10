# 01 — Setup Iniziale

**Data:** 2026-06-09
**Richiesta:** Leggere gli XML di specifica in `Specs/` e creare lo scheletro della webapp.

---

## Pacchetti installati

| Pacchetto | Versione | Motivo |
|---|---|---|
| `react-router-dom` | ^7.x | Gestione routing SPA con nested routes |

---

## Struttura cartelle creata in `src/`

```
src/
├── components/
│   ├── layouts/
│   │   ├── AdminLayout.jsx
│   │   ├── ManagerLayout.jsx
│   │   └── EmployeeLayout.jsx
│   └── ui/
│       └── PageShell.jsx
├── pages/
│   ├── auth/
│   │   ├── SplashPage.jsx
│   │   ├── AuthChoicePage.jsx
│   │   ├── AccountLockedPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   ├── RegFormNewPage.jsx
│   │   ├── OrgTypeChoicePage.jsx
│   │   ├── OrgFormCompanyPage.jsx
│   │   ├── OrgFormPrivatePage.jsx
│   │   └── RegFormJoinPage.jsx
│   ├── admin/
│   │   ├── AdminHomePage.jsx
│   │   ├── AdminUsersPage.jsx
│   │   ├── AdminSettingsPage.jsx
│   │   └── BuyCreditsPage.jsx
│   ├── manager/
│   │   ├── MgrProfilePage.jsx
│   │   ├── MgrManagementPage.jsx
│   │   ├── MgrEmployeesPage.jsx
│   │   ├── EmployeeDetailPage.jsx
│   │   ├── MgrQuestsPage.jsx
│   │   ├── QuestNewPage.jsx
│   │   ├── QuestExpiringPage.jsx
│   │   ├── QuestActivePage.jsx
│   │   ├── QuestApprovePage.jsx
│   │   ├── QuestSavedPage.jsx
│   │   ├── MgrHelpRequestsPage.jsx
│   │   ├── MgrProjectsPage.jsx
│   │   ├── ProjectNewPage.jsx
│   │   └── MgrNotificationsPage.jsx
│   ├── employee/
│   │   ├── EmpProfilePage.jsx
│   │   ├── EmpQuestsPage.jsx
│   │   ├── EmpAnalyticsPage.jsx
│   │   └── EmpHelpPage.jsx
│   └── shared/
│       ├── DataPage.jsx
│       ├── MenuPage.jsx
│       ├── SettingsPage.jsx
│       ├── MarketplacePage.jsx
│       ├── MessagingPage.jsx
│       ├── StaticHelpPage.jsx
│       ├── StaticFaqPage.jsx
│       ├── StaticAboutPage.jsx
│       ├── StaticTermsPage.jsx
│       ├── StaticPrivacyPage.jsx
│       └── StaticCreditsInfoPage.jsx
└── router/
    └── index.jsx
```

---

## File modificati

| File | Modifica |
|---|---|
| `src/App.jsx` | Sostituito il contenuto di default Vite con `<RouterProvider router={router} />` |

---

## Componenti principali aggiunti

### `PageShell.jsx`
Componente riutilizzabile che mostra titolo e descrizione. Usato come placeholder per tutte le pagine ancora da implementare.

### Layout con tab bar (`ManagerLayout`, `EmployeeLayout`)
Wrappano le pagine dei rispettivi ruoli con una barra di navigazione fissa in basso (sticky bottom), con 5 tab ciascuna. Il tab attivo viene evidenziato in viola (`#6c3fc5`) tramite `NavLink` di React Router.

### `AdminLayout`
Header fisso in alto con link di navigazione alle sezioni Admin.

### `router/index.jsx`
Router React Router v6 con `createBrowserRouter`. Organizzato in tre sezioni di nested routes:
- `/admin/*` → AdminLayout
- `/manager/*` → ManagerLayout
- `/employee/*` → EmployeeLayout
- Route standalone per pagine condivise (`/marketplace`, `/settings`, `/messaging`, ecc.)

---

## Pagine con contenuto di base (non solo placeholder)

| Pagina | Contenuto |
|---|---|
| `SplashPage` | Logo + tagline, redirect automatico a `/auth` dopo 1.5s |
| `AuthChoicePage` | Form email/password + link a registrazione/join |
| `MgrProfilePage` / `EmpProfilePage` | Avatar placeholder, barra XP, statistiche (livello, XP, crediti), link marketplace |
| `MgrQuestsPage` | Hub con link alle 5 sottosezioni Quest |
| `MgrManagementPage` | Hub con link alle 4 sezioni Management |
| `MgrEmployeesPage` | Tabella con 3 dipendenti mock + campo ricerca |
| `EmpQuestsPage` | 2 Quest mock con pulsanti Accetta / Rifiuta / Richiedi aiuto / Segna completata |
| `EmpAnalyticsPage` | Griglia di 6 KPI mock |
| `MarketplacePage` | Griglia 3 prodotti mock con pulsante Acquista |
| `QuestNewPage` | Form completo (nome, descrizione, scadenza, tipologia, XP, crediti, assegnazione) |
| `MgrNotificationsPage` | 2 notifiche mock con link alle pagine relative |
| `AdminHomePage` | 3 card link alle sezioni admin |
