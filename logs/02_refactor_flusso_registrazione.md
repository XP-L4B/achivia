# 02 — Refactor flusso registrazione

**Data:** 2026-06-09
**Richiesta:** La prima pagina di auth deve mostrare solo 3 campi (email, password, conferma password). Solo dopo si sceglie tra "Crea organizzazione" e "Accedi a organizzazione esistente".

---

## Modifiche ai file

### `src/pages/auth/AuthChoicePage.jsx`
- Rimossi i link diretti a "Crea organizzazione" / "Accedi a organizzazione esistente"
- Rimosso il bottone Login (spostato come link secondario "Hai già un account? Accedi")
- Rimasto solo il form con i 3 campi: **indirizzo email**, **password**, **conferma password**
- Il bottone "Avanti" naviga verso `/auth/register/org-choice`

### `src/pages/auth/RegFormNewPage.jsx`
- Riproposto come pagina di scelta organizzazione (era un form duplicato di AuthChoicePage)
- Mostra due opzioni: **"Crea organizzazione"** → `/auth/register/org-type` | **"Accedi a organizzazione esistente"** → `/auth/register/join`

### `src/pages/auth/RegFormJoinPage.jsx`
- Rimossi i campi email, password e conferma password (già acquisiti al passo 1)
- Rimasto solo il campo **Codice Organizzazione**

### `src/router/index.jsx`
- Rinominata la route `auth/register/new` → `auth/register/org-choice` per rispecchiare il nuovo ruolo della pagina

---

## Nuovo flusso di registrazione

```
/auth  →  email + password + conferma
           ↓ Avanti
/auth/register/org-choice  →  Crea organizzazione | Accedi a org esistente
           ↓                            ↓
/auth/register/org-type        /auth/register/join
(Azienda / Privato)            (solo codice org)
```
