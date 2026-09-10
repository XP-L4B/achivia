# 13 — Registrazione, organizzazioni e personalizzazione personaggio

**Data:** 2026-06-12

Completamento del flusso di accesso (registrazione reale che crea l'admin),
scoping multi-organizzazione e personalizzazione del personaggio collegata al profilo.

---

## 1. Registrazione in-place su `/auth`
"Registrati" non cambia più pagina: passa a una **modalità registrazione** sulla
stessa schermata. Nasconde "Accedi" e gli account demo, mostra il campo **conferma
password** e il bottone **Procedi**, che porta a `/auth/register/org-choice` solo se
l'email non esiste già e le due password coincidono.

## 2. La registrazione crea davvero l'admin
Le credenziali inserite vengono tenute in `sessionStorage` (bozza). Al termine del
percorso org ("Conferma dati", sia **Azienda** che **Privato** — ora veri `<button>`)
viene creato l'utente **admin** nel DB con quelle credenziali e un nuovo `orgId`, poi
si torna al login per accedere.

## 3. Scoping per organizzazione (multi-tenant)
Ogni utente ha un `orgId` (nel seed tutti in `org-achivia`). `AdminUsersPage` mostra
solo gli utenti della **propria** organizzazione (`getUsersByOrg`): un admin non vede
gli altri admin né utenti di altre org. Un admin appena registrato vede solo sé stesso.
`DB_VERSION` alzato a 2 per ri-seedare i dati vecchi.

## 4. "Ripristina dati di test"
Pulsante in **Menu** (manager/dipendente) e **Impostazioni Admin** che ripristina il
seed (`resetDb` + reload), in alternativa al parametro `?reset` nell'URL.

## 5. Profilo employee = profilo manager
`EmpProfilePage` replica il layout del manager (header centrato con icona messaggi,
avatar, "Personalizza", riga XP/crediti, marketplace). "Personalizza" porta a
`/employee/profile/customize`, che riusa lo stesso `CustomizeCharacterPage` del manager.

## 6. Personalizzazione personaggio
- Layout `CustomizeCharacterPage`: **avatar a sinistra**, **Sesso** e **Colore della
  pelle** accanto, **Set di vestiario** sotto.
- Ogni **tonalità** è collegata a un avatar (`avatar`, `avatar_middle`, `avatar_black`);
  l'avatar mostrato cambia al variare del colore (`src/data/avatars.js`, `avatarForSkin`).
- **"Salva personaggio"** salva `skin`/`sesso` sull'utente (`updateUser`, persistito) e
  **torna al profilo**, che mostra l'avatar corrispondente al colore scelto.

---

## Verifica
- `npm run lint` pulito, `npm run build` ok.
- Verificato dal vivo (sessioni precedenti): login per ruolo, registrazione → admin,
  scoping org, profili e personalizzazione.
