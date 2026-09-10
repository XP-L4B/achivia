# 06 — Rimozione emoji

**Data:** 2026-06-09
**Richiesta:** Eliminare tutte le emoji dal progetto.

---

## Criterio

- Rimosse tutte le **emoji pittografiche** (🏢🔑☕👕🎒💎⏰✅✉👤 e i checkmark ✔️/✅/🔧/❌ nei log).
- **Mantenute** le frecce tipografiche `→` (es. negli spec XML e nelle descrizioni): non sono emoji ma punteggiatura con significato di flusso.
- **Mantenuta su richiesta** l'icona avatar `👤` in `MgrProfilePage.jsx` e `EmpProfilePage.jsx`.
- Dove l'emoji faceva da icona con un significato, sostituita con testo breve; dove era decorativa, rimossa.

---

## File modificati

| File | Emoji | Soluzione |
|---|---|---|
| `src/pages/auth/RegFormNewPage.jsx` | 🏢 🔑 | Rimosse dai bottoni "Crea organizzazione" / "Accedi a organizzazione esistente" |
| `src/pages/shared/MarketplacePage.jsx` | ☕ 👕 🎒 💎 | Tolto il campo `img` dei prodotti mock e l'icona accanto ai crediti |
| `src/pages/manager/MgrNotificationsPage.jsx` | ⏰ ✅ | Rimosso il campo `icon` dalle notifiche mock |
| `src/pages/manager/EmployeeDetailPage.jsx` | ✉ | Bottone → "Invia messaggio" |
| `src/pages/manager/MgrProfilePage.jsx` | ✉ | Badge messaggi → "DM 3" (avatar `👤` mantenuto su richiesta) |
| `src/pages/employee/EmpProfilePage.jsx` | ✉ | Badge messaggi → "DM 1" (avatar `👤` mantenuto su richiesta) |
| `logs/05_integrazione_opensea.md` | ✔️ | Rimosse dalle righe di verifica |
| `logs/Web3Parte1.md` | ✅ 🔧 ❌ | Rimosse dai titoli di sezione |

---

## Verifica

- Scansione Unicode dell'intero progetto (esclusi `node_modules`, `.git`, `dist`): rimangono solo le icone avatar `👤` mantenute volutamente.
- `npm run build` ok · `npm run lint` pulito.
