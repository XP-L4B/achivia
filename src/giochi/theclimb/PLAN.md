# The Climb — piano di lavoro

> **Fase 0 — chiusa.** Questo documento è il risultato della ricognizione
> del repository. Non c'è ancora una riga di codice del gioco. Le tre
> decisioni aperte sono state prese (§7); manca solo il via per la Fase 1.

---

## 1. Che cosa ho trovato nel repository

Achivia ha già tre minigiochi, e sono fatti tutti e tre con la stessa
forma. Il quarto la eredita.

| | Achivia: Survival | Lexora | The Boss |
|---|---|---|---|
| motore | `src/game/` | `src/giochi/lexora/` | `src/giochi/theboss/` |
| righe | 4 641 | 3 405 | 4 372 |
| schermate | `src/pages/arena/` | `src/pages/giochi/*Lexora*` | `src/pages/giochi/*TheBoss*` |
| parti di schermo | `src/components/arena/` | `src/components/lexora/` | `src/components/theboss/` |
| salvataggio | `src/data/deposito/arena.js` | `…/lexora.js` | `…/theboss.js` |
| porta pubblica | `src/data/arena.js` | `src/data/lexora.js` | `src/data/theboss.js` |
| stile | `src/styles/arena.css` | `…/lexora.css` | `…/theboss.css` |

**La regola che li tiene insieme**: il motore è JavaScript puro — niente
DOM, niente rete, niente orologio — e gira identico dentro il browser e
dentro `node`. È quello che permette di simulare diecimila partite da riga
di comando, ed è la ragione per cui il bilanciamento di The Boss si può
misurare invece che indovinare.

Altre convenzioni che The Climb deve rispettare:

- **Il deposito non passa da `db.js`.** Un `export *` attaccherebbe il
  motore e i contenuti al pacchetto che scarica chiunque apra Achivia,
  anche chi non gioca. Lexora e The Boss importano il proprio deposito
  direttamente, e The Climb farà lo stesso.
- **Le pagine si caricano a parte** (`lazy()` in `src/pages/giochi/pigre.jsx`).
- **Un gioco è una riga** in `src/data/giochi/catalogo.js`. L'hub, il menu e
  il profilo non si toccano. Finché è in lavorazione, `attivo: false` e si
  apre con `VITE_GIOCHI_IN_LAVORAZIONE=theclimb npm run dev`.
- **`ensureX()` additivo** in `deposito/nucleo.js`. `DB_VERSION` **non si
  alza**: alzarla cancellerebbe i dati di tutti per aggiungere un gioco.
- **I giochi non pagano.** Niente crediti, niente esperienza dell'account:
  quelli si guadagnano lavorando (`CLAUDE.md`).
- **Le tacche agli angoli** su ogni finestra e ogni pulsante nuovo, dal
  capitolo «Gli angoli» di `terminal.css`. Non si riscrive il disegno: si
  aggiunge il nome della classe ai suoi elenchi.
- **Il negozio resta fuori.** Le rotte dei giochi passano da `SoloPersone`.
- **L'interfaccia non la provo io.** Build e lint puliti a ogni consegna,
  la prova visiva è tua.

### La classifica di The Boss, che è quella da riusare

Sta in `src/data/deposito/theboss.js` ed è fatta di tre pezzi:

1. **Tre leghe** — `sett`, `mese`, `sempre` — con la chiave del periodo
   calcolata dal calendario ISO (`chiaveLegaTheBoss`). Se ne tengono
   quattro passate più quella in corso.
2. **Sei divisioni** — `stagista · teamleader · reparto · manager ·
   direttore · ceo`. A fine stagione (un mese) sale il 20% migliore e
   scende il 20% peggiore; chi non gioca per due stagioni di fila scende
   di una. `chiudiStagione` si chiama pigramente — quando qualcuno guarda
   la classifica o finisce una partita — perché **non c'è un server che
   possa farlo a mezzanotte**.
3. **La verifica** — `verificaPartita(dichiarato, decisioni)` rigioca la
   partita dal seme e dalla sequenza di risposte e confronta il riassunto.
   È scritta per girare su un server, e intanto gira qui.

The Climb userà le stesse leghe e lo stesso meccanismo di stagione. Le
divisioni **no**, e per una ragione precisa: vedi il punto 4 qui sotto.

---

## 2. Le cinque cose in cui il repository contraddice il documento

Come chiesto, le segnalo invece di forzarle.

### 2.1 Non c'è un server, quindi il punteggio non può essere validato lato server

Il documento lo chiede in due punti (§15 «il punteggio va calcolato e
validato lato server», §20 «non calcolare il punteggio della classifica sul
client»). **Achivia è un'applicazione statica**: `.github/workflows/deploy.yml`
fa `npm ci && npm run build` e pubblica `dist` su GitHub Pages. Il deposito
è un finto database su `localStorage`. La cartella `api/` esiste ma è in
formato Vercel e quel workflow non la pubblica.

Vince il repository. Faccio quello che fa già The Boss, che è la cosa più
onesta possibile senza server:

- la partita è **deterministica** (seme + log delle decisioni);
- `verificaClimb()` la rigioca e confronta il risultato, **scritta per
  girare identica su un server** il giorno che ci sarà;
- il limite è **dichiarato nel codice e nella schermata**, non nascosto:
  ferma chi ritocca il punteggio nel deposito, non chi apre la console.

Conseguenza da sapere: il «profilo pubblico della corsa» di §15 esiste, ma
mostra solo le corse che stanno su questo dispositivo — come le classifiche
degli altri tre giochi.

### 2.2 I contenuti in JSON sarebbero un corpo estraneo

§16 chiede «costi, effetti, curve, eventi, aziende, personaggi tutti in
JSON». Nel repository **non c'è un solo file JSON di contenuto**: sono tutti
moduli `.js`. Non è pigrizia — è che JSON non ammette commenti, e in questo
codice il commento che spiega *perché* un numero è quel numero vale quanto
il numero.

Propongo di tenere la sostanza della richiesta e cambiare il formato:
moduli `.js` che **non esportano funzioni**, solo dati, con la stessa
disciplina di The Boss — *tutti* i numeri di bilanciamento in un file solo
(`contenuti/bilancio.js`), e nessun numero negli altri contenuti. Ritoccare
il bilanciamento resta «apri un file, cambia una riga, rilancia il
simulatore».

### 2.3 Non c'è un framework di test, e non serve

§16 chiede test automatici e §18 uno script da 10 000 partite. Il
repository non ha Jest né Vitest: ha **attrezzi da riga di comando** in
`strumenti/` con uno script npm ciascuno (`boss:prove`, `boss:sim`,
`boss:banca`, `boss:emoji`, `boss:consigli`). Girano con `node` in mezzo
secondo perché il motore è puro.

È esattamente la forma che §18 chiede. Farò lo stesso: `climb:prove`,
`climb:sim`, `climb:eventi`.

### 2.4 «Stagista → CEO» è già la scala delle divisioni di The Boss

Questa è la collisione che mi ha sorpreso di più. La scala di carriera che
The Climb usa come **progressione interna** (§9: Stagista → Junior → …→ CEO)
è, parola per parola, la scala che The Boss usa come **divisioni della
classifica**. Due cose diverse con gli stessi nomi, nella stessa app, a due
schermate di distanza.

Propongo: The Climb tiene la scala di carriera com'è scritta nel documento
— è il cuore del gioco — e le sue divisioni di classifica prendono nomi di
un'altra famiglia, legata alla *scalata* e non al *grado*. Per esempio:
`base · versante · cresta · parete · vetta · cima`. Da confermare.

### 2.5 La durata è il doppio di ogni altro gioco dell'app

Il catalogo dichiara «5–10 minuti» per Lexora, «15–20» per The Boss,
«finché resisti» per Survival. The Climb ne chiede 20–45. Non è un
problema tecnico, è un fatto di prodotto: è un gioco che si apre di sera,
non nella pausa caffè. Va scritto nella scheda del catalogo così com'è, e
il salvataggio settimanale diventa obbligatorio (lo è già per §16).

---

## 3. Il problema tecnico che il documento non affronta — e come lo risolvo

**«E se fossi nato altrove?» (§5) non è un semplice replay.**

Rigiocare lo stesso log su un background diverso funziona finché le scelte
esistono in tutti e cinque. Ma il documento stesso dice il contrario, ed è
il suo punto migliore: *«alcune opzioni non compaiono proprio»*. Un Erede
che sceglie «MBA a Londra» non ha un corrispettivo per «Nessuna rete»: quel
bottone lì non c'è.

Nella Fase 0 avevo proposto un **ripiego**: ogni decisione porta con sé
l'opzione più vicina, e il replay la usa quando quella scelta non esiste.
**L'ho scartata.** Scrivendo la tabella dei ripieghi mi sono accorto che
sarei stato io a decidere che cosa fa il povero quando il ricco fa un MBA —
e allora la differenza fra i due finali non misurerebbe più la
disuguaglianza, misurerebbe la mia tabella. La frase che il gioco vuole
dire («le scelte erano identiche, cambiava solo da dove partivi») smetterebbe
di essere vera nel momento in cui una delle due partite gioca scelte che il
giocatore non ha mai fatto.

### La regola, e perché è questa

Guardando come funziona il gioco, «non disponibile» sono **due cose
diverse**, e vanno trattate diversamente perché sono diverse davvero.

**1. L'occasione non arriva.** «Il socio di tuo padre ti offre uno stage in
Meridian Consulting» non esiste per chi non ha un socio di suo padre.
Questo non è nemmeno un problema di replay: l'evento non si attiva, le sue
condizioni non sono soddisfatte, e il motore lo salta come salterebbe
qualunque evento fuori condizione. **Nessuna regola serve.** Il seme è lo
stesso, il mondo è lo stesso, ma quella porta a lui non si apre.

**2. L'occasione arriva e non te la puoi permettere.** L'MBA è lì, in
elenco, grigio. Qui il giocatore *ha* fatto una scelta, e il suo doppio
altrove deve pur fare qualcosa di quella settimana.

E qui la risposta giusta non me la devo inventare, perché **ce l'ha già il
giocatore**: è la sua **routine**. Il modello la contiene già — serve alla
modalità «avanza velocemente» (§2) — ed è la sua dichiarazione di come vive
una settimana normale. Chi voleva l'MBA e non poteva permetterselo è andato
a lavorare: non perché lo dico io, ma perché è quello che quel giocatore
aveva detto di fare quando non succede niente di speciale.

> **La regola.** Il log registra `{ settimana, tipo, sceltaId }` e niente
> ripieghi. Nel replay: se l'opzione scelta è disponibile, si prende. Se non
> lo è, la settimana si gioca con **la routine che il giocatore aveva in
> quel momento** (la routine è a sua volta una decisione registrata, quindi
> il replay sa sempre qual era).

Costa un campo in meno nel log invece di uno in più, e toglie di mezzo una
tabella di corrispondenze che avrei dovuto scrivere, bilanciare e
difendere.

### E il confronto finale dice due numeri, non uno

Sono i due casi qui sopra, e tenerli separati dice molto più che sommarli:

> **Con le tue stesse scelte, partendo da «Nessuna rete»:**
> **partita chiusa alla settimana 141 per burnout.**
>
> - **41 volte** la scelta che avevi fatto tu non era disponibile: quelle
>   settimane sono andate come andavano le sue settimane normali.
> - **17 occasioni** che a te sono arrivate, a lui non sono arrivate
>   affatto. Non le ha rifiutate: non gli sono mai comparse davanti.

Il secondo numero è quello che il documento chiede a §5.2 — *«il giocatore
deve vedere la porta chiusa»* — e viene fuori dal meccanismo invece che da
un cartello. Il primo dice che non è stato meno bravo. Nessuno dei due è
una frase che qualcuno ha scritto: sono due conteggi.

## 4. Struttura dei file

```
src/giochi/theclimb/
  motore/                  la simulazione. JS puro, gira in node
    caso.js                il PRNG seminato — riuso di quello di The Boss
    stato.js               la partita: statistiche, competenze, lavoro, persone
    settimana.js           pianificazione → risoluzione → eventi → riepilogo
    competenze.js          crescita a rendimenti decrescenti
    promozioni.js          la valutazione, e la schermata «Perché»
    persone.js             fiducia, potere, memoria degli archetipi
    etica.js               integrità, sospetto, quando esplode
    burnout.js             accumulo, segnali, crollo
    finali.js              come finisce, e con quale epilogo
    punteggio.js           la formula di §15
    partita.js             l'API pubblica + serializza/deserializza
    replay.js              «E se fossi nato altrove?» e la verifica
    analisi.js             le misure di una partita finita
  contenuti/
    bilancio.js            TUTTI i numeri. Nessun altro file ne contiene
    background.js          i cinque punti di partenza
    percorsi.js            università, ITS, autodidatta, lavoro, impresa
    attivita.js            le tredici attività settimanali
    competenze.js          hard e soft, e i pesi per livello
    aziende.js             le quindici aziende, con gli attributi nascosti
    persone.js             gli archetipi e i nomi
    livelli.js             la scala di carriera
    eventi/                la banca degli eventi, a lotti come le richieste
    scuole.js              le schede «Nella vita reale» (l'enciclopedia)
  strumenti/
    prove.mjs              i controlli del motore
    montecarlo.mjs         10 000 partite × strategie × background
    valida-eventi.mjs      schema, doppioni, copertura, condizioni morte
  LEGGIMI.md               come è fatto e come si cambia
```

Fuori dal modulo, come per gli altri tre: `src/components/theclimb/`,
`src/pages/giochi/*Climb*.jsx`, `src/data/theclimb.js`,
`src/data/deposito/theclimb.js`, `src/styles/theclimb.css`, una riga in
`catalogo.js`, quattro righe in `pigre.jsx`, le rotte in `router.jsx`, le
voci in `helpContents.js` e in `layouts/risalita.js`.

---

## 5. Modello dati (prima bozza)

```js
stato = {
  versioneMotore, seme, caso,
  background, percorso,
  settimana, eta,
  corpo:    { salute, sonno, stress, felicita },
  vita:     { soldi, debito, relazioni, rete, reputazione, integrita },
  nascosto: { sospetto },
  lavoro:   { aziendaId, livello, performance, visibilita, anzianita },
  hard:     { …9 competenze }, soft: { …9 competenze },
  persone:  [ { id, nome, archetipo, fiducia, potere, memoria: [] } ],
  routine:  { …attivita → punti di tempo },   // per «avanza velocemente»
  log:      [ { settimana, tipo, scelta, ripiego } ],
  storico:  [ …una riga per settimana, per il grafico e per l'analisi ],
  fase, esito,
}
```

**Il peso nel deposito.** Una partita da 600 settimane con una decisione a
settimana fa ~600 righe di log: è dello stesso ordine di The Boss (~300
decisioni) e sta larga nei cinque megabyte. Lo `storico` invece cresce e va
tenuto **compatto** (una riga di numeri, non un oggetto per settimana), o
ricalcolato dal replay quando serve. Lo decido in Fase 1 misurando.

**Una sola partita attiva per utente** (§16): collezione
`db.corsaClimb[userId]` con la partita in corso, riscritta a ogni
settimana; `db.partiteClimb` per quelle finite, a rotazione come le altre.

---

## 6. Le fasi, e cosa consegno alla fine di ognuna

Come da §19. A ogni fine fase mi fermo, dico cosa c'è e cosa manca.

| Fase | Cosa | Come si verifica |
|---|---|---|
| **0** | questo documento | lo leggi tu |
| **1** | motore puro: settimane, statistiche, competenze, bilancio | `climb:prove` verde, `climb:sim` gira |
| **2** | loop giocabile: pianificazione, risoluzione, riepilogo, salvataggio | build e lint puliti, prova visiva tua |
| **3** | aziende, colloqui, promozioni, schermata «Perché» | prove sul peso delle competenze per livello |
| **4** | persone: mentore, sponsor, manager tossico, memoria | prova che un torto torna indietro dopo 200 settimane |
| **5** | i 120+ eventi | `climb:eventi` valida schema, doppioni, copertura |
| **6** | etica, sospetto, scandali, burnout, tutti i finali | `climb:sim`: «bara sempre» forte all'inizio, crolla dopo |
| **7** | «E se fossi nato altrove?» + enciclopedia | replay deterministico sui cinque background |
| **8** | classifica, divisioni, stagioni, verifica della corsa | riuso di `theboss.js`, prove sulla verifica |
| **9** | bilanciamento e rifinitura | i sei bersagli di §18, misurati — **fatte tutte e nove**; vedi `LEGGIMI.md` per lo stato e per l'interruttore del catalogo |

I bersagli di §18 diventano assert nel simulatore, come per The Boss:
nessuna strategia sopra il 15%, «solo hard skill» mai oltre Director, i
percorsi non universitari comparabili, vittorie decrescenti per background
ma **mai zero** per «Nessuna rete», «bara sempre» che crolla nella seconda
metà, burnout che chiude una quota reale delle partite difficili.

---

## 7. Le tre decisioni, prese

1. **Il nome è The Climb.** Entra nei file (`src/giochi/theclimb/`),
   nell'id del catalogo (`theclimb`), nelle rotte (`/giochi/the-climb`) e
   negli script npm (`climb:prove`, `climb:sim`, `climb:eventi`).
2. **Le divisioni della classifica** sono `base · versante · cresta ·
   parete · vetta · cima`, che non si scontrano più con la scala di
   carriera «Stagista → CEO» né con le divisioni di The Boss.
3. **Il replay non ha ripieghi**: quando la scelta non è disponibile, la
   settimana va con la routine del giocatore; quando l'occasione non
   arriva, non arriva. Il confronto finale conta le due cose separatamente
   (§3).

## 8. Una cosa che ho trovato e che non riguarda The Climb

`src/giochi/theboss/LEGGIMI.md` era rimasto indietro di due giri: diceva
«63 controlli» (sono 92) e «bersaglio fra il 5% e il 10%» (adesso è 10–14%,
e il gioco sta al 12,43%). L'ho corretto: è documentazione mia rimasta
falsa, e lasciarla lì un altro giro sarebbe costato più del sistemarla.
