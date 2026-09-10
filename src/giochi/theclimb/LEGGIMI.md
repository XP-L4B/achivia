# The Climb — come è fatto, e come si cambia

Un simulatore di carriera a settimane: si parte dalla vita che è capitata
in sorte e si prova ad arrivare a CEO di ACHIVIA SPA. Il piano completo è in
`PLAN.md`; questo file dice dove sta cosa e come si tocca.

> C'è il motore — settimane, statistiche, competenze,
> soldi, le fini — il loop giocabile (atrio, piano, riepilogo, salvataggio
> a ogni settimana, una vita per persona), la carriera (undici aziende
> strutturate con gli attributi che dichiarano e quelli veri, colloqui, offerte,
> valutazione trimestrale con il «perché», tetto, licenziamenti,
> riorganizzazioni, la cima) e le persone: mentore, sponsor, capo
> tossico, collega manipolatore, alleato, HR, capo eccellente, con
> fiducia, potere e memoria — e il torto che torna al colloquio duecento
> settimane dopo — e gli eventi: centoventi schede in quattro lotti
> (imprevisti, occasioni, vita, bivi), da zero a due a settimana dal
> seme, con le porte chiuse che si vedono grigie — e l'etica: sette
> scorciatoie più le due con le persone, il sospetto nascosto che esplode
> con la visibilità in tre gradi (voce, scandalo con la macchia, la fine),
> la riparazione, l'integrità sotto trenta che chiude ACHIVIA, il
> consiglio di amministrazione con le domande dal diario, e tutti i
> finali con l'epilogo (le cause strutturali del burnout, le decisioni
> che hanno pesato, la linea della carriera) — e il replay: la stessa
> partita rigiocata dal seme e dal log, per verificarla e per «E se fossi
> nato altrove?», con l'enciclopedia «Nella vita reale» che si sblocca
> giocando — e la classifica: tre leghe, sei divisioni con nomi loro,
> le classifiche tematiche, il profilo pubblico di ogni corsa, e la
> verifica prima di entrare (si rigioca dal seme e dal log). **Stato:
> fase 9: i sei bersagli del brief (§18) sono pretese del simulatore e
> reggono.** Il gioco è acceso nel catalogo (`data/giochi/catalogo.js`):
> per spegnerlo si rimette `attivo: false` sulla sua riga, e da spento
> si prova con `VITE_GIOCHI_IN_LAVORAZIONE=theclimb`.

## Dove sta cosa

```
src/giochi/theclimb/
  motore/            la simulazione. JS puro: niente DOM, niente rete, niente orologio
    caso.js          il PRNG seminato: senza questo niente si può rigiocare
    stato.js         com'è fatta una partita, e come nasce
    competenze.js    la crescita a rendimenti decrescenti, e la ruggine
    settimana.js     pianifica → risolvi → riepilogo; fine mese; il titolo; le fini
    carriera.js      le porte, i colloqui, le offerte, la valutazione trimestrale e il suo perché
    persone.js       chi si incontra, che cosa fa da solo, le mosse, la memoria, il passato che torna
    eventi.js        il vocabolario delle condizioni e degli effetti, il pescaggio, la risposta
    etica.js         le scorciatoie, il sospetto che esplode, la macchia, la riparazione
    finali.js        fermarsi, mollare, il consiglio di amministrazione, l'epilogo
    replay.js        rigioca dal log: la verifica, e «E se fossi nato altrove?»
    enciclopedia.js  quali schede questa vita ha sbloccato
    punteggio.js     la formula della classifica (§15), pura
    partita.js       l'API pubblica: creaPartita, scegliPercorso, prendiLavoro, faiColloquio, accettaOfferta, impostaRoutine, giocaSettimana
  contenuti/
    bilancio.js      TUTTI i numeri del gioco. Nessun altro file ne contiene
    background.js    le cinque vite: obblighi e porte chiuse, zero numeri
    attivita.js      le tredici attività, in gradini
    competenze.js    otto hard, nove soft, e i pesi per fascia di livello
    livelli.js       la scala da stagista a CEO
    percorsi.js      le cinque strade: che cosa insegnano, che cosa dicono
    battute.js       quello che dice l'avatar nella stanza, dai numeri della settimana
    calendario.js    mesi e stagioni: cinquantadue settimane, si parte a settembre
    tutorial.js      la guida della schermata, nove passi che puntano ai pezzi dello schermo
    aziende.js       i quattro lavori che si trovano subito, dieci aziende strutturate, ACHIVIA SPA; e che cosa dicono di sé (`dice`)
    persone.js       gli otto archetipi con la scheda «Nella vita reale», le mosse, quaranta nomi
    eventi/          la banca: schema.js (la forma e il vocabolario), quattro lotti, indice.js
    scorrettezze.js  le sette scorciatoie e la riparazione, con le schede «Nella vita reale»
    enciclopedia.js  le ventidue schede «Nella vita reale», con quando si sbloccano
    storia.js        i testi delle schermate: la storia, i nomi, i finali
  strumenti/         attrezzi da riga di comando, non fanno parte della build
```

Fuori dal modulo, come per gli altri tre giochi:

```
src/data/deposito/theclimb.js   la corsa in corso (una per persona) e le vite finite
src/data/theclimb.js            la facciata per le schermate
src/components/theclimb/        Stanza, Finestra, Cruscotto, Piano, Riepilogo, Carte (il «perché»), SchedaAzienda, Persone, Evento
src/pages/giochi/TheClimbPage.jsx, PartitaTheClimbPage.jsx, EnciclopediaTheClimbPage.jsx, ClassificaTheClimbPage.jsx
src/data/deposito/leghe.js      le leghe, condivise con The Boss
src/styles/theclimb.css
```

**Il salvataggio è a ogni settimana.** La partita non vive nella
schermata: vive nel deposito, serializzata dal motore, e si riscrive a
ogni settimana giocata e a ogni decisione (routine, lavoro, strada). Chi
chiude ritrova la settimana in cui era. È una per persona: per aprirne
un'altra si abbandona quella in corso, e l'abbandono resta scritto.

## La schermata della partita

E' una stanza, alla Tabboz: l'avatar del profilo di Achivia in mezzo
(`components/theclimb/Stanza.jsx`), la finestra sul muro con la stagione,
la targa del posto, il titolo di studio, l'umore accanto alla mano e il
fumetto con la battuta o con l'ultima cosa successa. A lato i contatori
(`Cruscotto`), sotto la fila dei tasti: ogni tasto apre una finestra
sopra la stanza (`Finestra.jsx`), che si chiude con la crocetta, con Esc
o toccando fuori. L'evento, il riepilogo e l'esito del colloquio restano
fogli che aspettano una risposta. L'avatar non si ridisegna: cambia solo
per CSS, e le animazioni si spengono con `prefers-reduced-motion`.

Alla prima partita parte la guida (`Tutorial.jsx`, i passi in
`contenuti/tutorial.js`): nove passi, ognuno accende il pezzo di
schermata di cui parla e mette il resto in ombra. Si chiude con «Ho
capito», «Salta» o Esc, resta segnata per persona nel deposito
(`tutorialClimb`), e si riapre da «Come funziona» in alto.

## I comandi

| | |
|---|---|
| `npm run climb:prove` | le prove del motore |
| `npm run climb:sim` | il simulatore: sette routine × cinque background |
| `npm run climb:eventi` | il controllo della banca degli eventi: schema, id, vocabolario, porte, copertura, doppioni, condizioni morte |

## Le regole che tengono insieme il modulo

- **Ogni lavoro si rispetta.** Il bar, il magazzino, il call center, il
  negozio sono lavori che si trovano subito e insegnano un mestiere; le
  altre si chiamano **aziende strutturate**, cioè posti con una carriera
  a gradini — mai «aziende vere», perché vere lo sono tutte. Nei testi
  non esistono lavori «veri» e lavori che non lo sono, né «lavoretti»: si dice che
  cosa danno e che cosa chiedono. I nomi interni (`SOPRAVVIVENZA`,
  `primoLavoroVero`) restano per non rompere i salvataggi, e non si
  leggono da nessuna parte.

- **Gli import portano l'estensione** (`./stato.js`), così il motore gira in
  `node` così com'è, e il simulatore è un comando.
- **Niente `Math.random`, niente `Date.now`** nel motore e nei contenuti:
  una prova lo controlla.
- **I contenuti parlano per gradini**: `{ stress: +2 }`, mai un numero
  grande. Quanto vale un gradino sta in `PASSO`, dentro `bilancio.js`.
- **Il log è la fonte di verità.** Ogni decisione è una riga
  `{ s, tipo, … }`; con seme, background e log si rigioca tutto.

## Come si cambia il bilanciamento

Un numero solo si tocca in `contenuti/bilancio.js`, poi si rilancia
`npm run climb:sim`. Nella fase 1 il simulatore misura una cosa sola — se
la vita regge — e pretende nove cose: che nessuna routine arrivi in fondo
su tutti e cinque i background; che «nessuna rete» duri meno di «erede»
ma non muoia sempre, e quando muore muoia di burnout o di soldi; che
lavorare e basta logori più che coltivare le persone, ma che il burnout
prenda almeno un anno; che «nessuna rete» arrivi in fondo meno di una
volta su due, e che le vite che arrivano in fondo scendano con il punto di
partenza; e che chi studia abbia più hard e chi vive più soft.

I sei bersagli del brief, come li misura `climb:sim` (`audace` è la vita
che coltiva le persone e prende le occasioni; le vittorie sono la cima):

- nessuna strategia vince più del 15 % in media sulle cinque vite;
- «solo competenze tecniche, zero relazioni» non passa mai Director;
- ITS e autodidatta arrivano in alto quanto l'università, più o meno;
- le vittorie scendono con il punto di partenza — l'erede arriva in cima
  intorno al 15 %, «nessuna rete» quasi mai, ma arriva almeno a VP;
- «bara sempre» nei primi tre anni non paga, e crolla nella seconda metà;
- il burnout chiude una quota significativa delle vite difficili.

Quello che il simulatore ha insegnato, e che spiega alcuni numeri:

- **La vittoria sta intorno al cinque per cento** per chi gioca bene e
  gioca per la cima (`per_la_cima` nel simulatore), in media sulle cinque
  vite. Tre cose la tengono lì: **l'esperienza viaggia**
  (`PROMOZIONE.esperienzaPortata`: chi entra a un livello già fatto porta
  con sé metà delle settimane maturate, se no ogni cambio di posto
  azzerava l'orologio), **i posti in cima sono pochi**
  (`PROMOZIONE.postiInCima`: la probabilità che si apra un posto da VP o
  da CEO si moltiplica per 0,3 e 0,08 — è un moltiplicatore, quindi
  abbassa tutti nello stesso modo senza chiudere la porta a nessuno) e il
  consiglio che chiede di più (`FINALI.consiglioReputazione` 85,
  `consiglioSoft` 75). Sotto, la scalata è più corta di prima (anzianità
  minime a 249 settimane, visibilità richiesta che *scende* dalla fascia
  alta, leadership a 60/65), perché il collo di bottiglia deve stare in
  cima, non a metà. Con l'esperienza che viaggia e i posti scarsi
  l'erede non è più il favorito netto: fonda più spesso, e fondare costa
  il posto. Un tetto alle soft imparate solo lavorando si è provato e
  tolto: chiudeva la cima a tutti.
- **Chi parte dal basso arriva a C-Level, non a CEO.** Riccardo ha chiesto che
  nessuna vita scenda sotto l'uno per cento; il gioco com'è non ce la fa,
  e il simulatore dice perché con l'orologio (`arrivoA`, con
  `CLIMB_JSON`): l'erede è Senior Manager alla settimana 120 e C-Level alla 415; la
  famiglia operaia è Senior Manager alla 270 e C-Level alla 470;
  «nessuna rete» è Senior Manager alla 330 e C-Level alla 540. Sono i tre anni persi fra il terzo e il
  quinto gradino — il conto in rosso, i turni extra, lo stress che fa
  mollare, nessuno sponsor di famiglia — e l'ultimo gradino chiede più
  tempo di quello che resta. Si è provato a spingere il resto (più
  tempo, meno stress dal debito, lo sponsor più veloce, la
  leadership più bassa): sposta di poco e non basta. Per dare a quelle
  due vite l'uno per cento bisogna toccare una delle tre cose che il
  brief prescrive — i dodici anni, il tempo settimanale di chi parte dal
  basso, o il sospetto che ogni cambio di posto costi — e la scelta è
  sua. La pretesa del simulatore, intanto, misura che ci arrivino a C-Level.

- **La salute si ripara da sola** (`DERIVA.saluteRiposo`) finché lo stress
  sta sotto i segnali, e si consuma quando li passa. Senza il ritorno a
  riposo ogni straordinario era una tacca definitiva, e chi lavorava e
  basta moriva di crollo fisico in cinque mesi.
- **Un percorso con una durata finisce** (`PERCORSO.*.durata`): il titolo
  arriva dopo tante settimane di studio, e da lì non costa più. Senza,
  l'ITS costava per dodici anni.
- **Chi è in rosso non ha la scelta di rallentare** (`pianoDi` nel
  simulatore): sotto zero la routine si riempie di turni extra, e sono
  l'ultima cosa che si taglia quando le ore non bastano. Prima le vite
  difficili morivano di soldi con lo stress a dieci — una persona vera
  fa i turni in più, e finisce in burnout: è il bersaglio di §18, ed è
  la ragione per cui l'erede, che i turni extra non li fa, non ci finisce.
- **Le strade si confrontano con la stessa vita** (`audace`, `audace_its`,
  `audace_da_se` nel simulatore hanno la stessa identica routine): finché
  l'autodidatta aveva una voce in più (i progetti), quello che si misurava
  era la routine e non la strada. Con la stessa vita l'università arriva
  poco sopra, l'ITS e l'autodidatta poco sotto, entro un gradino: sono i
  colli di bottiglia a cambiare (il filtro del curriculum, che l'autodidatta
  aggira con la rete; i tre anni di retta). Due cose sistemate in quel
  confronto: i **compagni di corso** (`PERCORSO.*.reteCompagni`) erano
  scritti nel bilancio e mai applicati — ora ogni trimestre dentro un
  percorso dà quei gradini di rete — e l'autodidatta, con l'AI come
  maestro, impara **tutte** le competenze tecniche (un gradino l'una per
  unità di studio, contro i due su due materie dell'ITS): ha le hard più
  alte di tutti, e resta comunque un gradino sotto l'università perché il
  suo collo di bottiglia non sono le competenze ma il titolo che non ha,
  la rete da costruire e l'energia che studiare da soli chiede.
- **La noia è il contrario dello stress, e finisce nello stesso posto**
  (`NOIA`): un lavoro ripetitivo — il call center più di tutti — svuota
  un po' ogni settimana, di più quando si resta a lungo allo stesso
  livello; oltre i segnali mangia la felicità, oltre il crollo la resa; a
  cento è il **bore-out**. Si scarica con quello che ha un senso —
  progetti, studio, ozio, volontariato, le persone — o cambiando posto,
  che la dimezza.
- **Le aziende mentono** (`dice` in `aziende.js`): da fuori si vede quello
  che dichiarano, da dentro — dopo `COLLOQUIO.scoperta` settimane — la
  verità, con accanto la bugia. **Lo sponsor è un cancello**, non solo
  alle promozioni: da `SERVE_SPONSOR_DA` in su nessuno ti assume sulla
  parola, se no il muro si aggirerebbe cambiando azienda. **Il muro delle
  sole competenze tecniche** sta a Senior Manager (fascia alta, 30/70):
  fino a Manager si passa di misura.
- **Le persone hanno memoria** (`persone.js`, `PERSONE.passato`): un torto
  o un aiuto restano scritti su chi li ha ricevuti; ogni trimestre le
  persone salgono o cambiano azienda; al colloquio chi lavora lì, ha
  potere e si ricorda di te pesa sulla probabilità e ha una scena. Lo
  sponsor è una persona (`stato.sponsor` punta a lei): la si conquista
  con fiducia e potere, la si perde se la fiducia cala. L'erede nasce con
  un contatto di famiglia che può farlo; «nessuna rete» con nessuno.
- **Un evento è una scheda di dati, non codice** (`eventi/schema.js`):
  condizioni ed effetti sono parole di un vocabolario chiuso che il
  motore sa leggere e il validatore controlla. I soldi sono euro veri:
  «riparazione 900 €» non va scritto due volte per pesare diversamente
  sull'erede e su «nessuna rete». Un evento che aspetta ferma la
  settimana; con la routine (e nel replay) risponde la predefinita, che
  per questo non può avere un `richiede`.
- **Lanciarsi costa, non lanciarsi costa di più** (`EVENTI.perOccasioneLasciata`):
  ogni occasione ha un salto (`audace: true`) e una predefinita prudente
  — la routine non si lancia mai — e chi lascia cadere le occasioni viene
  chiamato di meno, chi si lancia di più. Il simulatore confronta
  `carriera` (prudente) e `audace`: chi si lancia arriva più in alto, e
  paga da qualche parte.
- **Il sospetto è nascosto per costruzione** (`ETICA`): la fotografia non
  lo mostra mai. Esplode con sospetto × visibilità, quindi chi bara e
  resta piccolo la passa liscia e chi sale viene scoperto; il grado
  dipende da quanto sospetto c'è. Il simulatore lo pretende: «bara sempre»
  sta davanti dopo sei anni e crolla dopo. L'epilogo non colpevolizza: le
  cause del burnout si leggono dallo storico (settimane in rosso, sonno,
  il posto che logora, il capo tossico, da dove si partiva), e le decisioni
  che hanno pesato sono dove la curva ha cambiato pendenza, non un giudizio.
- **Il replay non ha ripieghi** (`replay.js`): su un altro background una
  scelta che non si può fare si salta e la settimana va con la routine di
  allora; un evento che non arriva non arriva; uno che arriva e non c'era
  ha la risposta della routine. Il confronto conta le tre cose. Sullo
  stesso background il replay è identico fino alla fiducia delle persone,
  ed è quello che la classifica rigioca per verificare.
- **La classifica non ha un server, e lo dice** (vedi `PLAN.md` §2.1): una
  vita finita si rigioca dal seme e dal log prima di entrare
  (`verificaPartita`); una che non torna resta con la persona, con scritto
  perché, e fuori. Le abbandonate non entrano. È la stessa difesa di The
  Boss, dichiarata.
- **Chi non ha un lavoro se ne prende uno** quando la cassa scende sotto
  mille (`prendiLavoro`, nel simulatore): è il «devi lavoricchiare» del
  ceto medio. Nella fase 3 in mezzo ci saranno le aziende strutturate e i
  colloqui; il fatto di avere un lavoro doveva esistere da subito.
