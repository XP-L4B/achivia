# Changelog

## Versione da scrivania

### Disposizione
- Su schermi da 1024px in su l'app esce dalla colonna da 480px e prende tutta la finestra, con i contenuti raccolti in una colonna centrale larga al massimo 1180px.
- La barra di navigazione in basso diventa una colonna fissa a sinistra, con l'insegna in cima e il nome di ogni sezione scritto accanto all'icona: col mouse le icone sole erano un indovinello e il fondo dello schermo e' lontano.
- Profilo: la scheda del personaggio e i sei riquadri stanno affiancati invece che incolonnati, e la scheda resta in vista mentre si scorre.
- Elenchi di membri, quest e richieste su due colonne; scorciatoie da tre a sei per riga; schede del marketplace da due a quattro.
- Accesso e registrazione restano stretti: un modulo largo un metro non si compila volentieri.

### Rifiniture
- Velo scuro sopra lo sfondo, che su una finestra larga viene ingrandito parecchio, per tenere leggibili pannelli e testi.
- Passaggio del mouse e contorno di messa a fuoco su riquadri, righe e voci di navigazione: cose che sul telefono non esistono.
- Titoli e pannelli con piu' aria e caratteri leggermente piu' grandi, per la distanza da cui si guarda uno schermo da scrivania.

### Come e' fatto
- Tutte le regole nuove stanno in `src/styles/desktop.css`, dentro una sola media query: sotto i 1024px non se ne applica nemmeno una.
- Lo stile del guscio (layout, elenchi, griglie) e' uscito dagli attributi `style` dei componenti ed e' diventato classi, perche' uno stile inline vince su qualunque foglio: finche' restava li' la versione da scrivania non poteva ridisporre niente. I valori su telefono sono identici a prima, verificato confrontando il CSS compilato: fuori dalla media query nessuna regola e' cambiata.

## Profilo riempito e icone navbar pixel

### Profilo
- Contenuti distribuiti verticalmente e ingranditi (avatar, nome, crediti, livello, barra XP) per riempire la pagina.
- Pulsante pixel "Marketplace" sotto gli XP.

### Icone navbar (PixelLab)
- Icone pixel-art per tutte le voci: profilo, analytics/data, menu, alerts (campanella), management (organigramma con figure bianche).
- Voce navbar capace di mostrare un'immagine al posto dell'icona SVG; box icona a 40px.

## Pixel-art: login, icone Management e rifiniture

### Autenticazione
- Splash e schermata di login in tema pixel: titolo, tagline "enhance & engage", input, toggle "Non hai un account?/Registrati" e bottoni.

### Management
- Icone pixel uniformi (Employees, Quests, Help Requests) normalizzate a ~70px su canvas 72 e box icona ingrandito a 72px; emblema Employees dall'immagine 1024 e arciere con sfondo rimosso.
- Sorgenti immagine a piena risoluzione esclusi dal repo (.gitignore).

### Altre rifiniture
- Dettaglio dipendente, Data manager e pagine varie: font pixel su input/filtri, tab-pills, info-row, card-row, menu, alerts.
- Customize personaggio: form vestiario e pulsante "Salva" in stile pixel.
- Admin: navbar ridotta al solo Logout.

## Tema pixel-art esteso a tutta l'app

### Tema globale
- Sfondo pixel e rimappatura delle variabili semantiche (`--text*`, `--bg*`, `--border*`) dentro `.pixel-bg`: testi, form e popup diventano leggibili sul tema scuro per employee, manager e admin.
- Top-bar admin in stile pixel.

### Componenti adattati
- Card quest e card "richieste di aiuto" (componente `HelpRequestCard` condiviso), badge, pillole, empty-state, stat-card, pulsanti d'azione e righe lista (`card-row`).
- Analytics: stat-card e pulsante "Confronta con il team" in stile pixel.

### Management
- Le quattro voci diventano una griglia 2×2 di quadrati con icona e nome.
- Icone pixel-art generate con PixelLab: pergamena per Quests (`quest_icon.png`) e gruppo dipendenti per Employees (`employees_icon.png`), normalizzate a 64×64.

## Restyle pixel-art: profilo, navbar e pillole

### Profilo (employee + manager)
- Schermata profilo condivisa `ProfileScreen` in stile pixel-art (font Press Start 2P).
- Layout: nome centrato con icona messaggi (tray) a destra, nome team sotto, avatar senza riquadro con icona di modifica (matita) sovrapposta, crediti, livello + barra avanzamento e XP attuali/prossimo livello.
- Badge rosso tondo con il numero di messaggi non letti.

### Avatar
- Aggiunte le versioni femminili per le tre tonalità di pelle (chiara, media, scura); l'avatar segue ora pelle + sesso.

### Navbar
- Navbar a quadrati (icona + descrizione) per employee e manager, fissa e in sovrapposizione, tramite il componente condiviso `TabBar`.

### Sfondo e card
- Sfondo pixel-art esteso a tutte le pagine employee; card, titoli, badge e pillole adattati al tema scuro.

### Pillole riutilizzabili
- Componenti `XpPill`, `CreditsPill`, `LevelPill` (file `Pills.jsx`): markup centralizzato, ognuna con la propria classe CSS, sostituiti tutti gli usi inline. La pillola crediti mostra il simbolo `$` al posto della parola "crediti".

## Bacheca Team, aiuto tra dipendenti e progetti

### Bacheca Team (dipendente)
- La sezione "Bacheca Team" in `/employee/help` è divisa in **Richieste di aiuto** e **Quest disponibili**.
- "Quest disponibili" mostra le Side Quest attive senza destinatario create dal manager del dipendente, con pillola "Prendi in carico" (verde, trasparente).
- "Prendi in carico" assegna la quest al dipendente con lo stesso effetto dell'accettazione di una quest proposta dal manager.

### Richiedi aiuto (dipendente)
- Da `/employee/quests`, il pulsante "Richiedi aiuto" apre un popup con messaggio, crediti in palio (inferiori a quelli della quest) e scelta opzionale di un aiutante (solo altri dipendenti della stessa organizzazione).
- Con aiutante: notifica al destinatario ("L'utente X necessita di supporto") con link alla quest in "Richieste di aiuto".
- Senza aiutante: richiesta aperta visibile a tutto il team nella Bacheca.
- Le richieste inviate compaiono in "Le mie conversazioni" con la pillola del nome dell'aiutante (o "Tutto il team").

### Approvazione con ripartizione crediti (manager)
- In `/manager/management/quests/approve`, se la quest ha avuto un aiutante, la conferma mostra la ripartizione dei crediti tra assegnatario e aiutante; i crediti vengono accreditati di conseguenza (XP intero all'assegnatario).

### Analytics dipendente
- Due griglie: **Performance** (completate in tempo, %, aiuti forniti/richiesti, fallite e %, in ritardo e %, assenze medie, presenze consecutive) e **Credits** (attuali, totale guadagnati, spesi, da collaborazione).

### Help Requests (manager)
- `/manager/management/help-requests` elenca i dipendenti del manager con richieste di aiuto, con liste collassabili delle quest (titolo, scadenza, pillole XP/crediti) e popup di dettaglio (messaggio, aiutante, crediti).
- Filtri: team di appartenenza, assegnatario, titolo Quest.

### Progetti (manager)
- Creazione progetto: nome, descrizione, date inizio/fine, assegnazione dipendenti tramite ricerca per nome (nome + reparto + livello).
- I progetti creati appaiono in "Progetti attivi"; la card mostra nome, scadenza e pillola dei membri ed è cliccabile.
- Pagina di dettaglio progetto: nome e scadenza in alto, descrizione, membri (a collasso) e lista delle quest assegnate.
- In "Nuova Quest", scegliendo la tipologia "Istanza / Quest di gruppo" l'assegnazione mostra solo i progetti esistenti.
- Una quest assegnata a un progetto compare in Quest Attive (pillola verde "In corso"), nelle quest del progetto e nelle My Quests di ogni membro del progetto.
