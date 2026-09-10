/**
 * I testi della guida contestuale, uno per schermata.
 *
 * La chiave e' il percorso della schermata, con `:qualcosa` dove c'e' un
 * parametro: e' l'unica cosa che identifica una schermata senza doverla
 * andare a marcare a mano una per una. Il pulsante "?" cerca qui dentro il
 * percorso in cui si trova, e se non trova niente non compare: nessuna pagina
 * mostra un aiuto vuoto, e aggiungerne uno domani vuol dire aggiungere una
 * voce qui — non toccare nessun componente.
 *
 * Come si scrive una voce:
 *
 *   titolo      il nome della schermata, come lo chiamerebbe una persona
 *   testo       una, due, al massimo tre frasi: a cosa serve questa schermata
 *   azioni      cosa si puo' fare, all'infinito e in ordine di importanza
 *   consiglio   facoltativo: la cosa che conviene fare, o quella che da fuori
 *               non si capisce
 *
 * Regola per chi scrive: si parla di quello che c'e' davvero in quella
 * schermata. Se una funzione non e' li', non va scritta qui.
 */

export const GUIDE = {
  /* ─── I giochi ──────────────────────────────────────────── */
  '/giochi': {
    titolo: 'Games',
    testo: 'I giochi di Achivia, in un posto solo. Lexora si gioca da soli contro il computer o in due contro un collega; Survival si gioca da soli. Nessuno dei due dà crediti o esperienza dell’account: quelli si guadagnano lavorando.',
    azioni: [
      'Vedere i giochi disponibili, con chi si gioca e quanto durano',
      'Entrare in una partita',
    ],
    consiglio: 'Sono partite corte, pensate per una pausa: Lexora dura pochi minuti, una partita di Survival finisce quando finisci tu.',
  },

  /* ─── Lexora ──────────────────────────────────────── */
  '/giochi/lexora': {
    titolo: 'Lexora',
    testo: 'C’è una parola segreta e all’inizio sai solo quante lettere ha: tante caselle vuote. Provi una parola vera della stessa lunghezza e ogni lettera si colora — verde se è quella giusta al posto giusto, gialla se c’è ma altrove, grigia se non c’è. Con quello che impari stringi il cerchio. Prima si sceglie la lingua, poi se giocare da soli o in due: la difficoltà del computer si sceglie dopo, e solo se si gioca da soli.',
    azioni: [
      'Scegliere la lingua fra italiano, inglese, francese, spagnolo e tedesco',
      'Giocare da soli contro il computer, in tre difficoltà',
      'Sfidare una persona della propria organizzazione',
      'Leggere le regole in quattro schermate',
    ],
    consiglio: 'Il primo tentativo conviene spenderlo in vocali: scoprire dove stanno le A e le E restringe più di azzeccare una consonante rara. Lexora non dà crediti né esperienza.',
  },
  '/giochi/lexora/partita': {
    titolo: 'La partita',
    testo: 'Due minuti e mezzo per tentativo, otto tentativi per ogni parola segreta. Un tentativo è una qualsiasi combinazione di lettere della lunghezza giusta: non deve essere una parola vera. Il punteggio: indovinarla vale, indovinarla presto vale di più — ogni tentativo risparmiato sono punti — e una parola lunga o rara paga più di una corta e comune. Chi non ci arriva porta a casa le lettere che aveva messo al posto giusto.',
    azioni: [
      'Scrivere una combinazione di lettere della lunghezza giusta e provarla',
      'Leggere i colori: verde al posto giusto, giallo fuori posto, grigio non c’è',
      'Lasciare la parola se proprio non viene',
      'Chiedere la rivincita a fine partita',
    ],
    consiglio: 'Le lettere già provate restano sotto il tabellone col loro colore: prima di scrivere, guarda lì — riprovare una lettera che hai già visto grigia è l’errore più comune.',
  },
  '/giochi/lexora/traguardi': {
    titolo: 'Traguardi di Lexora',
    testo: 'Ventisette traguardi del gioco, in quattro categorie: vocabolario, duello, intuito, costanza. Sono a parte: non contano nel profilo di Achivia e non danno crediti.',
    azioni: [
      'Vedere quanti traguardi hai sbloccato',
      'Leggere il requisito e il progresso di ognuno',
      'Tornare all’atrio',
    ],
    consiglio: 'Giocare in cinque lingue diverse ne apre due da solo, e si imparano parole per strada.',
  },
  '/giochi/lexora/classifica': {
    titolo: 'Classifica di Lexora',
    testo: 'Le stesse tre leghe dell’arena: la settimana e il mese ripartono da zero, quella di sempre no. Conta la partita migliore del periodo, non la somma, così venti partite mediocri non battono una partita buona.',
    azioni: [
      'Scegliere la lega e con chi confrontarsi',
      'Vedere la propria posizione e quanti punti mancano per salire',
      'Vedere chi ha vinto la lega scorsa',
    ],
    consiglio: 'I punti sono del gioco e non valgono crediti.',
  },

  /* ─── The Climb ────────────────────────────────────────── */
  '/giochi/the-climb': {
    titolo: 'The Climb',
    testo: 'Un simulatore di carriera a settimane. Parti a diciannove anni da una vita che non hai scelto — una delle cinque, con soldi, tempo e contatti diversi — e hai dodici anni davanti. Ogni settimana decidi dove va il tempo; il gioco ti dice che cosa è cambiato e perché. Si finisce prima del tempo in quattro modi: burnout, bore-out, crollo fisico, soldi. Una vita alla volta: si salva da sola a ogni settimana.',
    azioni: [
      'Riprendere la vita in corso, o abbandonarla (resta scritta)',
      'Leggere la storia, che è anche il tutorial',
      'Scegliere da dove partire e che strada prendere, e cominciare',
      'Rileggere come sono finite le vite precedenti, e dove sarebbero arrivate le stesse scelte partendo altrove',
      'Aprire l’enciclopedia «Nella vita reale» e la classifica',
    ],
    consiglio: 'Le vite non sono livelli di difficoltà: «nessuna rete» ha meno tempo e nessuno che copra i debiti, e certe porte non le vede nemmeno. Provale tutte, e confronta. The Climb non dà crediti né esperienza.',
  },
  '/giochi/the-climb/enciclopedia': {
    titolo: 'Nella vita reale',
    testo: 'Le schede didattiche del gioco: visibilità, sponsor, capo tossico, burnout, porte chiuse, integrità… Due-quattro frasi ciascuna, senza paroloni. Si sbloccano quando le si incontra giocando, e restano fra una vita e l’altra.',
    azioni: ['Leggere le schede sbloccate', 'Vedere quante mancano (non quali)'],
    consiglio: 'La scheda sullo sponsor si apre alla prima valutazione in cui manca: è il momento in cui serve.',
  },
  '/giochi/the-climb/classifica': {
    titolo: 'Classifica di The Climb',
    testo: 'Tre leghe (settimana, mese, di sempre) e sei divisioni — base, versante, cresta, parete, vetta, cima — con le stesse regole di The Boss: si sale col quinto migliore della stagione, si scende col quinto peggiore. Il punteggio moltiplica per da dove si parte: arrivare in cima partendo da «nessuna rete» vale più del doppio che partendo da erede. Tre classifiche tematiche: integrità (chi l’ha a cento), vita equilibrata e velocità (fra chi è arrivato). Ogni riga si apre: il percorso di quella vita, e dove sarebbe arrivata altrove.',
    azioni: ['Scegliere lega, divisione e tema', 'Filtrare per vita e per strada', 'Aprire il profilo di una corsa', 'Vedere i propri primati'],
    consiglio: 'Le vite abbandonate non entrano. Le altre si rigiocano dal seme e dal log prima di entrare: una che non torna resta fuori, e lo dice.',
  },
  '/giochi/the-climb/partita': {
    titolo: 'La settimana',
    testo: 'La stanza, con l’avatar del tuo profilo: il fumetto dice come stai o l’ultima cosa successa, la finestra la stagione, la targa dove lavori. A lato i numeri della vita: salute, stress, noia, felicità, sonno arretrato, soldi, lavoro, persone. Sotto, i tasti: ognuno apre una finestra — il piano della settimana per primo, una riga per attività con il più e il meno; poi il lavoro, le offerte, le porte, le persone, le competenze, la strada, le scorciatoie. «Vivi la settimana» la gioca e mostra il riepilogo, riga per riga; «Avanza un mese» gioca quattro settimane con la routine. «Come funziona», in alto, riapre la guida passo passo.',
    azioni: [
      'Dividere il tempo fra le attività, e vivere la settimana',
      'Salvare il piano come routine, e avanzare di un mese',
      'Prendere o lasciare uno dei lavori che si trovano subito',
      'Bussare alle porte delle aziende strutturate («Cercare lavoro» dà la ricerca che un colloquio spende), e rispondere alle offerte',
      'Leggere la scheda dell’azienda: da fuori quello che dicono, da dentro quello che è',
      'Leggere il «perché» di ogni valutazione trimestrale: che cosa ha pesato, che cosa è mancato',
      'Rispondere a quello che succede: imprevisti, occasioni, la vita, i bivi — da zero a due a settimana, e la settimana dopo non comincia finché aspettano',
      'Prendere una scorciatoia — barare funziona all’inizio — o ammettere quello che si è fatto; e chiudere la vita dove si è, fermandosi con una buona vita o mollando tutto',
      'Fare mosse con le persone: chiedere consiglio al mentore, proporsi al dirigente, aiutare un alleato, documentare un capo tossico e portarlo da HR, tenere a distanza chi rema contro',
      'Cambiare strada',
      'Uscire quando si vuole: è tutto salvato',
    ],
    consiglio: 'Le persone hanno memoria: chi hai aiutato fa il tuo nome anni dopo, chi hai fregato ti aspetta a un colloquio. Leggi il «perché»: nel riepilogo (lo stress in rosso, la noia di un lavoro ripetitivo, il sonno che manca) e nella valutazione (le competenze che da metà scala in su pesano diversamente, la visibilità, e da Manager in su lo sponsor). I segnali arrivano settimane prima della fine, e sono scritti lì.',
  },

  /* ─── L'arena ───────────────────────────────────────────── */
  '/arena': {
    titolo: 'Achivia: Survival',
    testo: 'L’atrio dell’arena. Scegli il personaggio, guarda i tuoi primati ed entra. Il tuo livello in Achivia apre personaggi nuovi e moduli gratis di partenza.',
    azioni: [
      'Scegliere un personaggio fra quelli sbloccati',
      'Vedere quanti moduli gratis si scelgono all’inizio',
      'Rileggere i propri primati e le ultime partite',
      'Entrare nell’arena',
    ],
    consiglio: 'Ogni livello dell’account rende il personaggio più forte dello 0,5%. Un personaggio nuovo ogni dieci livelli fino al 50, e un modulo gratis in più ogni dieci livelli. Si guadagnano lavorando: l’arena non dà crediti né esperienza.',
  },
  '/arena/traguardi': {
    titolo: 'Traguardi dell’arena',
    testo: 'Quarantasei traguardi del gioco, in quattro categorie: combattimento, progressione, esplorazione, sfida. Ognuno dice che cosa serve e a che punto sei. Sono a parte: non contano nel profilo di Achivia e non danno crediti.',
    azioni: [
      'Vedere quanti traguardi hai sbloccato',
      'Leggere il requisito e il progresso di ognuno',
      'Tornare all’atrio',
    ],
    consiglio: 'I traguardi di sfida chiedono una partita con una condizione addosso: cinque minuti senza un colpo, il livello 10 con un’arma sola. Il progresso mostra il tuo miglior tentativo.',
  },
  '/arena/classifica': {
    titolo: 'Classifica dell’arena',
    testo: 'Tre leghe: la settimana e il mese ripartono da zero quando cambiano, quella di sempre no. Ti confronti con tutti o con le organizzazioni di cui fai parte. Conta la partita migliore del periodo: un punto al secondo, uno per nemico, venti per livello, cinquecento per boss.',
    azioni: [
      'Scegliere la lega e con chi confrontarsi',
      'Vedere la propria posizione e quanti punti mancano per salire',
      'Vedere quanto manca alla fine della lega, e chi ha vinto quella scorsa',
    ],
    consiglio: 'I punti sono del gioco e non valgono crediti. Una partita sola ti mette in classifica; quella migliore del periodo è l’unica che conta.',
  },
  '/arena/partita': {
    titolo: 'La partita',
    testo: 'Le ondate arrivano da fuori e ti inseguono. Si spara da soli al nemico più vicino: tu ti muovi, raccogli le gemme e scegli i moduli quando sali di livello. A quattro minuti arriva il primo boss, poi uno ogni tre e mezzo: ha una barra sua, cambia fase mentre lo ferisci, e ogni colpo lo annuncia prima di partire. Ogni tanto compare una cassa, e i boss, i miniboss e i nemici con la corona ne lasciano una dove cadono: ci passi sopra e ti dà un effetto solo, più raro e più forte quanto più la cassa è colorata.',
    azioni: [
      'Muoversi con WASD o le frecce, tenendo premuto sulla tela, o con la leva sul telefono',
      'Raccogliere le gemme che i nemici lasciano',
      'Scegliere un modulo a ogni salita di livello (anche con i tasti 1, 2 e 3)',
      'Mettere in pausa',
    ],
    consiglio: 'Non fermarsi mai: le ossa sono lente ma arrivano da tutte le parti, e un cerchio largo le tiene in fila davanti ai colpi. Il livello si ferma al 30: da lì in poi non cresci più tu, cresce l’arena — ogni minuto i nemici prendono il 5% di vita e di danno e arrivano il 10% più fitti, e la barra dell’esperienza diventa quella della furia.',
  },
  /* ─── Profilo e personaggio ─────────────────────────────── */
  '/employee/profile': {
    titolo: 'Il tuo profilo',
    testo: 'La tua scheda: livello, esperienza e crediti guadagnati. I riquadri qui sotto portano a tutto il resto dell’app.',
    azioni: [
      'Vedere a che livello sei e quanta esperienza manca al prossimo',
      'Aprire quest, dati, Shop, organizzazione, messaggi e notifiche',
      'Seguire la Presence Streak: i giorni di fila senza assenze',
      'Guardare le competenze riconosciute e le medaglie conquistate',
    ],
    consiglio: 'La Presence Streak conta i giorni di calendario senza un’assenza registrata: ferie, festivi e weekend non la interrompono. A 365 giorni arriva Immortal, e si può riprendere ogni volta che la serie riparte.',
  },
  '/manager/profile': {
    titolo: 'Il tuo profilo',
    testo: 'La tua scheda personale. Da qui raggiungi la gestione del team e tutto quello che riguarda te.',
    azioni: [
      'Vedere livello, esperienza e crediti',
      'Aprire Gestione, dati, Shop, messaggi e notifiche',
      'Seguire la tua Presence Streak: i giorni di fila senza assenze',
      'Guardare le tue competenze e le tue medaglie',
    ],
    consiglio: 'Anche tu ricevi quest e achievement: quello che chiedi al team vale anche per te.',
  },
  '/manager/customize': {
    titolo: 'Personalizza',
    testo: 'Scegli il personaggio che ti rappresenta nell’app.',
    azioni: ['Scegliere un avatar dalla galleria', 'Cambiarlo quando vuoi'],
  },
  '/employee/customize': {
    titolo: 'Personalizza',
    testo: 'Scegli il personaggio che ti rappresenta nell’app.',
    azioni: ['Scegliere un avatar dalla galleria', 'Cambiarlo quando vuoi'],
  },

  /* ─── Quest ─────────────────────────────────────────────── */
  '/employee/quests': {
    titolo: 'Le mie quest',
    testo: 'Le attività che ti sono state assegnate, divise in tre gruppi: da accettare, in corso e concluse.',
    azioni: [
      'Accettare una quest nuova, o rifiutarla spiegando perché',
      'Segnalare una quest come completata quando hai finito',
      'Chiedere aiuto a un collega su una quest in corso',
      'Riaprire una quest conclusa per leggere il feedback del manager',
    ],
    consiglio: 'Segnala il completamento entro la scadenza: la puntualità conta per il tuo storico e per gli achievement.',
  },
  '/employee/help': {
    titolo: 'Bacheca del team',
    testo: 'Il posto dove il team si dà una mano: le richieste dei colleghi e le quest libere che puoi prendere.',
    azioni: [
      'Rispondere a una richiesta di aiuto con “Do una mano”',
      'Prendere in carico una quest libera',
      'Controllare a che punto sono le richieste che hai mandato tu',
    ],
    consiglio: 'Ogni aiuto che dai viene registrato: dieci aiuti valgono l’achievement Helping Hand.',
  },
  '/manager/management/quests': {
    titolo: 'Quest',
    testo: 'Il centro delle quest che assegni: crearne di nuove, seguire quelle in corso, approvare quelle finite.',
    azioni: [
      'Creare una quest nuova o partire da un modello salvato',
      'Vedere le quest attive e quelle vicine alla scadenza',
      'Approvare le quest che i collaboratori hanno segnalato come completate',
    ],
  },
  '/manager/management/quests/new': {
    titolo: 'Nuova quest',
    testo: 'Crea un’attività da assegnare, con la sua scadenza e la sua ricompensa.',
    azioni: [
      'Scegliere titolo, descrizione e scadenza',
      'Decidere la ricompensa in crediti, che vale anche come esperienza',
      'Assegnarla a una persona o a un progetto',
      'Salvarla come modello per riusarla',
    ],
    consiglio: 'Senza destinatario diventa una Side Quest: resta libera nella bacheca e la prende chi vuole.',
  },
  '/manager/management/quests/active': {
    titolo: 'Quest attive',
    testo: 'Le quest che hai assegnato e che sono ancora in corso.',
    azioni: ['Controllare a chi è andata ognuna', 'Filtrare per tipologia'],
  },
  '/manager/management/quests/expiring': {
    titolo: 'Quest in scadenza',
    testo: 'Le quest che scadono entro due giorni e quelle già scadute.',
    azioni: ['Vedere quali stanno per scadere', 'Capire dove serve una spinta'],
    consiglio: 'Una quest che scade senza essere completata interrompe la serie di consegne puntuali di chi l’aveva.',
  },
  '/manager/management/quests/approve': {
    titolo: 'Approvazione quest',
    testo: 'Le quest che i collaboratori hanno segnalato come finite. Qui verifichi il lavoro e accrediti la ricompensa.',
    azioni: [
      'Approvare, lasciando un feedback scritto se vuoi',
      'Rifiutare il completamento: la quest resta in corso',
      'Assegnare l’achievement “Go the Extra Mile” a un lavoro fatto ben oltre quanto chiesto',
    ],
    consiglio: '“Go the Extra Mile” si assegna solo da qui, una volta per quest, e la motivazione è obbligatoria.',
  },
  '/manager/management/quests/saved': {
    titolo: 'Modelli di quest',
    testo: 'Le quest che hai salvato come modello, pronte da riusare.',
    azioni: ['Creare una quest nuova partendo da un modello'],
  },
  '/manager/management/help-requests': {
    titolo: 'Richieste di aiuto',
    testo: 'Le richieste che i tuoi collaboratori hanno aperto sulle loro quest.',
    azioni: ['Vedere chi ha chiesto aiuto e su cosa', 'Sapere se un collega ha già risposto'],
  },

  /* ─── Persone, team, progetti ───────────────────────────── */
  '/manager/management': {
    titolo: 'Gestione',
    testo: 'Il punto di partenza per tutto quello che riguarda il team: persone, quest, aiuto, progetti e competenze.',
    azioni: [
      'Aprire l’elenco dei collaboratori e le loro schede',
      'Gestire quest, team e progetti',
      'Entrare nello Skill Tree per certificare le competenze',
    ],
  },
  '/manager/management/employees': {
    titolo: 'Persone',
    testo: 'Tutte le persone dell’organizzazione, i posti ancora liberi nel piano e il codice per farne entrare altre. Aprine una per vedere come sta andando.',
    azioni: [
      'Cercare per nome, per team o per livello',
      'Restringere a chi guidi tu',
      'Aprire la scheda di una persona',
      'Condividere il codice di invito',
    ],
  },
  '/manager/management/employees/:id': {
    titolo: 'Scheda del collaboratore',
    testo: 'Tutto su una persona: i suoi numeri, le sue quest, i progetti, le competenze e le medaglie.',
    azioni: [
      'Guardare i dati, a valori o come grafico nel tempo',
      'Assegnarle una quest',
      'Scrivere una performance review o rileggere quelle passate',
      'Aprire il suo Skill Tree per certificare una competenza',
    ],
  },
  '/manager/management/employees/:id/review': {
    titolo: 'Nuova performance review',
    testo: 'Una valutazione scritta su criteri concordati, che resta nello storico della persona.',
    azioni: ['Dare un punteggio ai criteri', 'Aggiungere un commento'],
  },
  '/manager/management/employees/:id/reviews': {
    titolo: 'Storico review',
    testo: 'Le performance review già scritte per questa persona, dalla più recente.',
    azioni: ['Rileggere una valutazione passata'],
  },
  '/manager/management/teams': {
    titolo: 'Team',
    testo: 'I gruppi di lavoro dell’organizzazione: servono ad assegnare quest di gruppo e a filtrare le persone.',
    azioni: ['Creare un team', 'Aprirne uno per gestirne i membri'],
  },
  '/manager/management/teams/new': {
    titolo: 'Nuovo team',
    testo: 'Crea un gruppo e scegli chi ne fa parte.',
    azioni: ['Dare un nome al team', 'Aggiungere le persone'],
  },
  '/manager/management/teams/:id': {
    titolo: 'Team',
    testo: 'Chi fa parte di questo gruppo.',
    azioni: ['Vedere i membri', 'Modificare il team'],
  },
  '/manager/management/teams/:id/edit': {
    titolo: 'Modifica team',
    testo: 'Cambia il nome del gruppo o chi ne fa parte.',
    azioni: ['Rinominare il team', 'Aggiungere o togliere persone'],
  },
  '/manager/management/projects': {
    titolo: 'Progetti',
    testo: 'Gruppi temporanei a cui assegnare quest di gruppo.',
    azioni: ['Creare un progetto', 'Aprirne uno per vederne quest e membri'],
  },
  '/manager/management/projects/new': {
    titolo: 'Nuovo progetto',
    testo: 'Crea un progetto e scegli chi ci lavora.',
    azioni: ['Dare nome, descrizione e data di fine', 'Scegliere i membri'],
  },
  '/manager/management/projects/:id': {
    titolo: 'Progetto',
    testo: 'Le quest e le persone di questo progetto.',
    azioni: ['Vedere a che punto è', 'Controllare chi ci lavora'],
  },
  '/employee/org': {
    titolo: 'La mia organizzazione',
    testo: 'Le persone che fanno parte della tua organizzazione.',
    azioni: ['Cercare un collega', 'Vedere di che team fa parte'],
  },

  /* ─── Competenze ────────────────────────────────────────── */
  '/employee/skills': {
    titolo: 'Il mio Skill Tree',
    testo: 'La mappa delle tue competenze: quelle già riconosciute e quelle su cui puoi ancora crescere.',
    azioni: [
      'Vedere quali competenze hai certificate e a che livello',
      'Aprire una medaglia per leggere chi l’ha certificata e perché',
      'Scoprire le competenze che il manager ti ha consigliato',
    ],
    consiglio: 'Le competenze non si prendono da soli: le certifica un manager, e resta scritto chi e quando.',
  },
  '/manager/management/skills': {
    titolo: 'Skill Tree',
    testo: 'Le competenze dell’organizzazione e chi le ha ottenute. Da qui si certifica.',
    azioni: [
      'Certificare una competenza a una persona, con motivazione e livello',
      'Creare una competenza tecnica dell’organizzazione',
      'Consigliare una competenza a chi vuoi far crescere',
      'Rileggere lo storico, revoche comprese',
    ],
    consiglio: 'Ogni competenza ha quattro livelli: ricertificare la stessa fa salire il grado senza creare doppioni.',
  },

  /* ─── Achievement ───────────────────────────────────────── */
  '/employee/achievements': {
    titolo: 'I miei achievement',
    testo: 'Gli obiettivi che puoi conquistare e quanto ti manca per ognuno. Si possono prendere più volte: raggiunto il traguardo il conteggio riparte.',
    azioni: [
      'Vedere a che punto sei su ogni obiettivo',
      'Aprire un achievement per lo storico di tutte le volte che l’hai preso',
      'Controllare i crediti che ogni medaglia porta',
    ],
    consiglio: 'Il numero grande è il ciclo in corso; le medaglie accanto al nome sono le volte che l’hai già conquistato.',
  },
  '/manager/achievements': {
    titolo: 'Achievements',
    testo: 'Come sta andando il team con le medaglie, quali obiettivi esistono e quanto valgono.',
    azioni: [
      'Vedere quante medaglie sono state consegnate e a chi',
      'Sfogliare tutti gli obiettivi con le loro condizioni',
      'Vedere quanti crediti vale ogni achievement',
      'Seguire i tuoi, nella scheda “I miei”',
    ],
    consiglio: 'La ricompensa in crediti la stabilisce l’amministratore, uguale per tutta l’organizzazione.',
  },
  '/manager/attendance': {
    titolo: 'Time & Attendance',
    testo: 'Il registro dei ritardi e delle assenze delle persone che guidi. Non è un cartellino: si scrive solo quello che esce dalla giornata normale.',
    azioni: [
      'Registrare un ritardo (con i minuti) o un\u2019assenza',
      'Segnare se era giustificata e annotare il motivo',
      'Correggere o eliminare una registrazione sbagliata, dalla scheda “Registro”',
      'Scegliere il periodo da guardare',
    ],
    consiglio: 'Una persona ha una registrazione sola per giorno: rifarla lo stesso giorno corregge quella che c’è, non ne aggiunge un’altra. I numeri finiscono nelle analytics della persona, con il periodo scelto lì.',
  },
  '/admin/attendance': {
    titolo: 'Time & Attendance',
    testo: 'Il registro dei ritardi e delle assenze di tutta l’organizzazione.',
    azioni: [
      'Registrare un ritardo o un\u2019assenza per chiunque',
      'Correggere o eliminare una registrazione',
    ],
  },
  '/admin/achievements': {
    titolo: 'Achievements',
    testo: 'Gli obiettivi dell’organizzazione, quante volte sono stati presi e quanto valgono.',
    azioni: ['Vedere il quadro generale', 'Decidere i crediti di ogni achievement'],
    consiglio: 'I crediti li imposti solo tu: valgono dal prossimo sblocco, le medaglie già consegnate tengono la ricompensa che avevano.',
  },

  /* ─── Dati ──────────────────────────────────────────────── */
  '/employee/analytics': {
    titolo: 'I tuoi dati',
    testo: 'Come stanno andando le tue attività: quante ne chiudi in tempo, quante saltano, quanti crediti hai guadagnato.',
    azioni: [
      'Scegliere il periodo da guardare, o una finestra di date a mano',
      'Toccare una riga di Performance per vederla in grande in cima',
      'Passare dai valori al grafico nel tempo',
    ],
    consiglio: 'Il pulsante col calendario serve a scegliere due date qualsiasi, se i periodi pronti non ti bastano.',
  },
  '/manager/data': {
    titolo: 'Dati',
    testo: 'I tuoi indicatori di performance e crediti. Più sotto ci sono le persone del tuo team: aprine una per vedere i suoi.',
    azioni: [
      'Scegliere il periodo o una finestra di date a mano',
      'Toccare una riga di Performance per vederla in grande in cima',
      'Passare dai valori al grafico nel tempo',
      'Aprire la scheda di una persona del team',
    ],
  },
  '/admin/data': {
    titolo: 'Dati',
    testo: 'Le persone dell’organizzazione: apri una scheda per vedere i suoi indicatori di performance e crediti.',
    azioni: ['Aprire la scheda di una persona', 'Da lì scegliere il periodo o passare al grafico'],
  },

  /* ─── Crediti, premi, messaggi ──────────────────────────── */
  '/marketplace': {
    titolo: 'Marketplace',
    testo: 'Il posto dove i crediti diventano qualcosa: premi e benefit che puoi riscattare.',
    azioni: ['Guardare i premi disponibili', 'Riscattarne uno con i tuoi crediti'],
    consiglio: 'I crediti arrivano dalle quest approvate e dagli achievement: qui si spendono.',
  },
  '/marketplace/purchases': {
    titolo: 'I miei acquisti',
    testo: 'I premi che hai già riscattato.',
    azioni: ['Rivedere cosa hai preso e quando'],
  },
  '/messaggi': {
    titolo: 'Casella',
    testo: 'Tutto quello che ti arriva, in un posto solo: gli avvisi dell’applicazione — quest, aiuti, competenze, achievement — e i messaggi di chi ti ha cercato per un lavoro.',
    azioni: [
      'Leggere quello che è arrivato',
      'Silenziare o bloccare chi ti scrive',
      'Svuotare gli avvisi (i messaggi restano)',
    ],
  },

  /* ─── Amministrazione ───────────────────────────────────── */
  '/admin': {
    titolo: 'La mia organizzazione',
    testo: 'Il pannello di chi amministra: persone, dati, crediti e piano.',
    azioni: [
      'Condividere il codice per far entrare qualcuno',
      'Gestire gli utenti registrati',
      'Aprire la dashboard da manager: quest, team, competenze e dati',
      'Ricaricare i crediti o cambiare piano',
    ],
    consiglio: 'Dalla dashboard da manager fai tutto quello che fa un manager, ma su tutte le persone dell’organizzazione.',
  },
  '/admin/users': {
    titolo: 'Gestione utenti',
    testo: 'Tutti gli utenti registrati nell’organizzazione.',
    azioni: ['Aprire la scheda di un utente', 'Reimpostare una password', 'Rimuovere un utente'],
  },
  '/admin/users/:id': {
    titolo: 'Scheda utente',
    testo: 'I dati di un utente registrato e le azioni che puoi fare su di lui.',
    azioni: ['Vedere ruolo, team e crediti', 'Reimpostare la password', 'Rimuovere l’utente dall’organizzazione'],
  },
  '/admin/settings': {
    titolo: 'Impostazioni',
    testo: 'Il piano dell’organizzazione e i crediti a disposizione.',
    azioni: ['Aprire il piano dell’organizzazione', 'Comprare crediti', 'Chiudere l’organizzazione'],
  },
  '/admin/cassa': {
    titolo: 'La cassa',
    testo: 'I crediti dell’organizzazione: quanti ce ne sono, da dove arrivano e a chi darli.',
    azioni: ['Vedere quanto c’è in cassa', 'Dare crediti a una persona dell’organizzazione', 'Leggere tutti i movimenti'],
    consiglio: 'I crediti del piano entrano in cassa a ogni rinnovo dell’abbonamento, non allo scadere del mese. Chi amministra non può versarli a sé stesso: è la stessa regola delle ricompense delle quest — chi mette i crediti in circolo non li incassa.',
  },
  '/admin/settings/piani': {
    titolo: 'Il tuo piano',
    testo: 'Il piano che hai adesso e che cosa danno gli altri: persone, annunci di lavoro, assistente, crediti ogni mese, osservatorio e pubblicità.',
    azioni: ['Vedere quante persone tiene il tuo piano e quante ne hai', 'Confrontare i quattro piani'],
    consiglio: 'Da qui i piani si guardano, non si comprano: il pagamento passa da un servizio esterno che non è ancora collegato. Se ti serve tenere più persone di quante ne tiene il piano più grande, il piano si fa su misura — l’indirizzo è in fondo alla pagina.',
  },
  '/compra-crediti': {
    titolo: 'Acquisto crediti',
    testo: 'Prima il pacchetto, poi dove devono andare i crediti. Il pagamento non è ancora collegato: qui si guarda, non si compra.',
    azioni: [
      'Vedere quanto costa ogni pacchetto e se c’è un’offerta in corso',
      'Scegliere se i crediti vanno sul tuo conto o nella cassa di un’organizzazione che possiedi',
    ],
    consiglio: 'I crediti sul tuo conto li spendi tu nel negozio; quelli in cassa sono dell’organizzazione — li distribuisci alle persone e ci paghi quello che serve a lei. Da una parte all’altra non si spostano, quindi la scelta si fa guardando a che cosa ti servono. La cassa compare solo se un’organizzazione la possiedi: comprare crediti per la cassa di qualcun altro è una decisione che spetta a chi ce l’ha.',
  },
  '/admin/skills': {
    titolo: 'Skill Tree',
    testo: 'Le competenze dell’organizzazione e chi le ha ottenute.',
    azioni: ['Certificare una competenza', 'Creare una competenza dell’organizzazione'],
  },

  /* ─── Menu e pagine di servizio ─────────────────────────── */
  '/employee/menu': {
    titolo: 'Menu',
    testo: 'Tutto quello che non sta nella barra in basso: achievement, assistente, Marketplace, impostazioni e informazioni.',
    azioni: ['Aprire una voce', 'Uscire dall’account'],
  },
  '/manager/menu': {
    titolo: 'Menu',
    testo: 'Marketplace, aiuto, impostazioni e informazioni sull’app.',
    azioni: ['Aprire una voce', 'Uscire dall’account'],
  },
  '/settings': {
    titolo: 'Impostazioni',
    testo: 'Le preferenze del tuo account.',
    azioni: ['Cambiare le tue impostazioni'],
  },
  '/faq': {
    titolo: 'FAQ',
    testo: 'Le domande che si fanno tutti su quest, crediti e livelli.',
    azioni: ['Cercare la risposta a un dubbio'],
  },
  '/credits-info': {
    titolo: 'Info crediti',
    testo: 'Come si guadagnano i crediti e dove si spendono.',
    azioni: ['Capire da dove arrivano i crediti'],
  },

  /* ─── Registrarsi ───────────────────────────────────────────
     Le uniche schermate di prima dell'accesso con una guida: sono quelle in
     cui si prende una decisione che poi non si disfa in un tocco. Le altre
     — l'accesso, la password dimenticata — chiedono una cosa sola e la
     chiedono scritta sopra al campo. */
  '/auth/register/org-choice': {
    titolo: 'Entri o ne crei una?',
    testo: 'Se qualcuno ti ha dato un codice, usa quello per chiedere di entrare. Se invece l’organizzazione la stai facendo tu, creala.',
    azioni: ['Chiedere di entrare con un codice', 'Creare la tua organizzazione'],
    consiglio: 'Non è una scelta definitiva: più avanti potrai fare parte di più organizzazioni insieme, e anche crearne una tua mentre lavori in un’altra.',
  },
  '/auth/register/org-type': {
    titolo: 'Azienda o gruppo?',
    testo: 'Sono due prodotti diversi, non due nomi per la stessa cosa. L’azienda ha le competenze standard, la lega e un curriculum che sopravvive all’uscita; il gruppo si inventa le proprie competenze e le proprie medaglie, e quando qualcuno esce non resta niente.',
    azioni: ['Leggere il confronto riga per riga', 'Scegliere il tipo e andare avanti'],
    consiglio: 'Il gruppo è per famiglie, squadre, classi, clan: chiunque voglia gamificare i compiti di una piccola realtà. Se quello che riconosci deve valere anche fuori, serve un’azienda.',
  },
  '/auth/register/org/company': {
    titolo: 'Dati dell’azienda',
    testo: 'Il nome con cui la tua azienda si presenta dentro Achivia. Da qui nasce anche il suo codice, che serve a farsi raggiungere.',
    azioni: ['Dare un nome all’azienda', 'Confermare e diventarne l’amministratore'],
  },
  '/auth/register/org/personalizzata': {
    titolo: 'Dati del gruppo',
    testo: 'Il nome del gruppo — una famiglia, una squadra, una classe. Da qui nasce anche il suo codice, che serve a farsi raggiungere.',
    azioni: ['Dare un nome al gruppo', 'Confermare e diventarne l’amministratore'],
  },
  '/auth/register/join': {
    titolo: 'Entrare con un codice',
    testo: 'Il codice non ti fa entrare: manda una richiesta a chi amministra l’organizzazione, che decide se accettarla. L’account intanto è già tuo.',
    azioni: ['Inserire il codice e mandare la richiesta'],
    consiglio: 'Se qualcuno ti ha già invitato al tuo indirizzo email, l’invito ti aspetta nell’elenco delle organizzazioni: lì basta accettarlo.',
  },
  '/auth/reset-password': {
    titolo: 'Password dimenticata',
    testo: 'Rimetti la password del tuo account.',
    azioni: ['Scegliere una password nuova'],
  },

  /* ─── Le organizzazioni come canali ─────────────────────── */
  '/org': {
    titolo: 'Le tue organizzazioni',
    testo: 'Ogni organizzazione è un canale a sé: ci entri, e da lì in poi vedi le sue quest, le sue persone e le sue medaglie. Puoi farne parte di più d’una, con un ruolo diverso in ognuna.',
    azioni: [
      'Entrare in una delle tue organizzazioni',
      'Accettare o rifiutare un invito che hai ricevuto',
      'Chiedere di entrare in un’altra, con il suo codice',
      'Crearne una tua, azienda o gruppo',
    ],
    consiglio: 'Nessuno può sapere di quali organizzazioni fai parte: questo elenco lo vedi solo tu, e da nessuna schermata dell’app si può risalire alle altre.',
  },
  '/admin/ingressi': {
    titolo: 'Ingressi',
    testo: 'Chi ha chiesto di entrare e chi hai invitato. Il codice dell’organizzazione non fa entrare nessuno da solo: manda una richiesta, e decidi tu.',
    azioni: [
      'Accettare o rifiutare chi ha chiesto di entrare',
      'Invitare una persona con il suo numero Achivia',
      'Invitare un indirizzo email, anche di chi su Achivia non c’è ancora',
      'Ritirare un invito a cui nessuno ha ancora risposto',
    ],
    consiglio: 'Il numero Achivia è il modo migliore per invitare qualcuno che è già qui: identifica senza equivoci e non ti obbliga a farti dare il suo indirizzo. L’email serve per chi deve ancora registrarsi: l’invito lo aspetta.',
  },

  /* ─── Organizzazione: le altre schermate dell'admin ─────── */
  '/admin/roles': {
    titolo: 'Ruoli e permessi',
    testo: 'Chi può fare cosa dentro l’organizzazione. Non lo decide il nome del ruolo ma la lista dei suoi permessi: un “Capo turno” che può creare quest lavora come un responsabile, comunque lo chiami.',
    azioni: [
      'Creare un ruolo su misura, o duplicarne uno preimpostato',
      'Scegliere i permessi che quel ruolo porta con sé',
      'Vedere quante persone hanno ciascun ruolo',
    ],
    consiglio: 'Manager e Dipendente non si modificano: ci sta sopra mezza organizzazione. Per partire da uno di loro, duplicalo.',
  },
  '/admin/departments': {
    titolo: 'Dipartimenti',
    testo: 'Le aree in cui è divisa l’organizzazione. Servono ad assegnare quest a un gruppo intero e a dare a chi guida il perimetro giusto.',
    azioni: ['Creare e rinominare un dipartimento', 'Toglierne uno che non serve più'],
  },
  '/admin/annunci': {
    titolo: 'Annunci di lavoro',
    testo: 'Gli annunci che l’organizzazione ha pubblicato in bacheca: li vede chiunque abbia un profilo Achivia.',
    azioni: [
      'Scrivere e pubblicare un annuncio',
      'Chiudere un annuncio quando la posizione è coperta',
      'Rileggere quelli già pubblicati',
    ],
    consiglio: 'L’indirizzo email di contatto è obbligatorio e lo vede chi apre l’annuncio: mettine uno che qualcuno legga davvero.',
  },
  '/manager/emblema': {
    titolo: 'L’insegna',
    testo: 'La faccia dell’organizzazione: il logo che avete già, oppure uno stemma da comporre qui in quattro scelte.',
    azioni: [
      'Caricare un logo',
      'Comporre uno stemma: forma, sfondo, colore e simbolo',
      'Toglierla e tornare alle iniziali',
    ],
    consiglio: 'Lo stemma non è un’immagine ma una ricetta: resta nitido a ventiquattro pixel nella barra come a centoventi nel profilo.',
  },

  /* ─── Lavoro e vetrina ──────────────────────────────────── */
  '/leaderboard': {
    titolo: 'Achivia Leaderboard',
    testo: 'Le aziende con abbonamento, confrontate sui risultati che si sono guadagnate. Le organizzazioni personalizzate non ci sono: non sono aziende, e misurarle con lo stesso metro non direbbe niente.',
    azioni: [
      'Cambiare il parametro su cui si confrontano',
      'Restringere per dimensione e periodo',
      'Aprire la vetrina di un’organizzazione',
    ],
  },
  '/leaderboard/:orgId': {
    titolo: 'La vetrina',
    testo: 'Come sta andando un’organizzazione, con i numeri che ha deciso di mostrare e le posizioni che ha conquistato.',
    azioni: ['Guardare i suoi risultati', 'Cambiare il periodo'],
  },
  '/annunci': {
    titolo: 'Bacheca degli annunci',
    testo: 'Le posizioni aperte pubblicate dalle organizzazioni su Achivia.',
    azioni: [
      'Scorrere gli annunci e aprirne uno',
      'Restringere per luogo, competenze richieste e tipo di contratto',
      'Scrivere all’indirizzo di contatto',
    ],
  },
  '/lavoro': {
    titolo: 'Trova lavoro',
    testo: 'La parte di Achivia che guarda fuori dall’organizzazione: gli annunci, e la scelta di farsi trovare da chi cerca profili.',
    azioni: ['Aprire la bacheca degli annunci', 'Decidere se farti trovare'],
  },
  '/lavoro/fatti-trovare': {
    titolo: 'Fatti trovare',
    testo: 'Metti il tuo profilo a disposizione di chi cerca personale. Il tuo nome non esce: chi guarda vede le competenze certificate, le medaglie e il tuo numero Achivia.',
    azioni: [
      'Accendere o spegnere l’elenco',
      'Dire in che zone e in che lingue lavori',
      'Dire che cosa stai cercando',
    ],
    consiglio: 'Ci si mette in elenco da liberi: entrando in un’organizzazione si esce, e per rientrare bisogna dirlo di nuovo.',
  },
  '/storico-lavorativo': {
    titolo: 'Storico lavorativo',
    testo: 'Dove sei stato e che cosa ti sei portato via. Quello che hai ottenuto in un’azienda con abbonamento resta qui per sempre, con la sua data.',
    azioni: ['Aprire un passaggio e vedere che cosa ci hai guadagnato'],
    consiglio: 'Le organizzazioni senza abbonamento non ci sono: quei risultati si sono persi nel momento in cui ne sei uscito. È il patto su cui si regge l’abbonamento.',
  },
  '/i-miei-dati': {
    titolo: 'I tuoi dati e i tuoi diritti',
    testo: 'Che cosa c’è scritto sul tuo profilo, chi lo vede, e che cosa succede se cancelli l’account.',
    azioni: ['Leggere che cosa sparisce e che cosa resta', 'Cancellare l’account'],
  },

  /* ─── Negozio ───────────────────────────────────────────── */
  '/shop': {
    titolo: 'Il negozio',
    testo: 'La postazione di chi tiene il negozio: gli ordini che arrivano e il catalogo da cui arrivano.',
    azioni: ['Aprire gli ordini', 'Aprire il catalogo degli articoli'],
    consiglio: 'Questo è un account a sé, non un ruolo dentro un’organizzazione: non ha profilo, non ha quest e non sta in nessuna classifica. Si riceve da Achivia, non si crea e non si compra.',
  },
  '/shop/articoli': {
    titolo: 'Articoli',
    testo: 'Il catalogo del negozio: quello che si può comprare con i crediti, e quanto costa portarlo a destinazione. Il catalogo è uno solo per tutta l’applicazione: quello che si cambia qui lo vedono tutti.',
    azioni: ['Aggiungere un articolo con foto e prezzo', 'Modificarne uno', 'Toglierlo dal catalogo', 'Impostare le spese di spedizione per l’Italia e per l’Unione Europea'],
    consiglio: 'Le spese di spedizione sono in crediti come tutto il resto, e si sommano al prezzo della merce. La soglia della spedizione gratis si può lasciare vuota: vuol dire che si paga sempre.',
  },
  '/shop/cassa': {
    titolo: 'La cassa',
    testo: 'Quanto ha incassato il negozio, e quando. Oggi, questa settimana, questo mese e sempre; sotto, il giorno per giorno degli ultimi trenta giorni e la settimana per settimana delle ultime dodici. Merce e spedizioni restano separate: sono due incassi diversi. Piu’ sotto: dove si spedisce, che cosa si vende di piu’, chi compra, e quanto e’ stato rimborsato per gli ordini annullati.',
    azioni: ['Passare dal giorno per giorno alla settimana per settimana', 'Aprire la classifica degli articoli e quella dei clienti'],
    consiglio: 'Un ordine annullato non ha incassato niente e resta fuori dai totali: quello che e’ tornato indietro sta nella sua riga, in fondo. Se quel numero cresce, il problema non e’ la cassa.',
  },
  '/shop/ordini': {
    titolo: 'Ordini',
    testo: 'Quello che è stato comprato, dal più recente. Da qui si segna quando un ordine è stato consegnato.',
    azioni: ['Vedere i dettagli di un ordine', 'Segnarlo come consegnato'],
  },

  /* ─── Il Castello ───────────────────────────────────────── */
  '/castle': {
    titolo: 'Il polso',
    testo: 'Come sta l’applicazione: quante persone ci sono e quante sono vive, quante organizzazioni pagano, quanto entra al mese, quanti crediti si muovono e perché.',
    azioni: [
      'Scegliere il periodo: da due giorni a sempre, o due date a mano',
      'Guardare gli iscritti nuovi e gli attivi a 2, 7, 15 e 30 giorni',
      'Vedere quante insegne sono aperte, quante pagano e quante hanno chiuso',
      'Leggere il movimento dei crediti diviso per causale',
      'Confrontare il ricavo atteso con quello incassato davvero',
    ],
    consiglio: 'Il denaro sta al terzo posto e non al primo apposta: dipende dagli altri tre. Se gli attivi scendono, l’incasso lo segue con due mesi di ritardo — e guardando solo l’incasso ci si accorge del problema quando è già successo.',
  },
  '/castle/organizzazioni': {
    titolo: 'Organizzazioni',
    testo: 'Ogni insegna con il suo piano, le sue persone e il suo stato.',
    azioni: [
      'Cercare per nome o per codice',
      'Filtrare: chi paga, chi è al limite dei posti, chi è fermo, chi ha chiuso',
      'Vedere da quando paga e quante persone si sono fatte vedere di recente',
    ],
    consiglio: 'Chi è arrivato al limite dei posti farà una di due cose: comprare o andarsene. È l’unica vista di questa pagina che chiede di fare qualcosa oggi.',
  },
  '/castle/listino': {
    titolo: 'Listino',
    testo: 'Gli abbonamenti, i pacchetti di crediti e il tariffario del risalto. Tutti i prezzi e tutti i limiti dell’applicazione stanno qui.',
    azioni: [
      'Creare o modificare un piano: prezzo, persone, annunci, domande all’assistente, crediti mensili, osservatorio, pubblicità',
      'Spegnere un piano senza cancellarlo',
      'Creare pacchetti di crediti: prezzo, quanti crediti, e quanti in più',
      'Cambiare quanto costa mettere un annuncio in cima',
    ],
    consiglio: 'Di un pacchetto si scelgono prezzo e crediti: la differenza fra i due è quanto conviene comprare in blocco, ed è l’unica cosa che si dice a chi compra. Un piano che qualcuno sta pagando non si cancella — si spegne, così sparisce dalla vetrina e chi ce l’ha resta dov’è.',
  },
  '/castle/offerte': {
    titolo: 'Offerte',
    testo: 'Sconti con una data di scadenza: in percentuale, in euro, o in crediti in più.',
    azioni: [
      'Creare un’offerta su un piano, su un pacchetto o su tutto il listino',
      'Dare una finestra di validità e un tetto di attivazioni',
      'Legarla a un codice, così vale solo per chi ce l’ha',
    ],
    consiglio: 'Le offerte non si sommano: quando più d’una vale sullo stesso prodotto si applica quella che fa risparmiare di più. Se un’offerta non ha una scadenza, non è un’offerta: è un prezzo, e va scritta nel listino.',
  },
  '/castle/crm': {
    titolo: 'CRM',
    testo: 'Le persone come clienti: numero Achivia, email, da quando ci sono, quanto hanno comprato e speso, in quali organizzazioni stanno.',
    azioni: [
      'Cercare per numero Achivia o per email',
      'Ordinare per chi ha pagato, per crediti, per iscrizione o per chi è fermo da più tempo',
      'Aprire una scheda e leggerne lo storico completo dei crediti, filtrato per causale',
      'Chiedere di vedere il nome e il cognome, dicendo perché',
    ],
    consiglio: 'Il nome non si vede da qui: si chiede, e la richiesta resta scritta con la data e il motivo in "Chi ha guardato". Non è uno scrupolo — è quello che permette di tenere l’anagrafica a portata di mano invece di non poterla tenere affatto.',
  },
  '/castle/pagamenti': {
    titolo: 'Pagamenti',
    testo: 'Chi deve rinnovare, chi aspetta i crediti del piano, e quello che è stato incassato.',
    azioni: [
      'Registrare un pagamento: apre o rinnova l’abbonamento e mette l’organizzazione sul piano pagato',
      'Far uscire la dotazione di crediti a chi ha diritto',
      'Vedere chi risulta abbonato ma è scoperto',
    ],
    consiglio: 'I crediti del piano escono solo dopo un pagamento: non alla scadenza, non perché sono passati trenta giorni. Il servizio di pagamento non è ancora collegato, quindi per ora si registra a mano da qui — il giorno in cui arriva chiamerà la stessa funzione e questa pagina diventerà il registro di quello che ha fatto.',
  },
  '/castle/pubblicita': {
    titolo: 'Pubblicità',
    testo: 'Che cosa compare negli spazi pubblicitari: il banner in fondo alle schermate e lo spot che parte a ogni quest assegnata.',
    azioni: [
      'Creare una reclame con titolo, testo e indirizzo',
      'Scegliere dove compare e quanto spesso',
      'Darle una finestra di validità',
      'Vedere quante volte è comparsa',
      'Decidere quanti secondi dura lo spot prima che si possa chiudere',
    ],
    consiglio: 'Chi la vede lo decide il piano, non questa pagina: si cambia dal listino. Quando non c’è niente da mostrare lo spazio resta e si vede che è uno spazio — chi sta sul piano con la pubblicità deve vederla anche il giorno in cui non è stata venduta, se no il piano di sopra sembra togliere qualcosa che non c’era.',
  },
  '/castle/accessi': {
    titolo: 'Chi ha guardato',
    testo: 'Il registro delle richieste di identità: chi, di chi, quando e perché.',
    azioni: ['Leggere tutte le occhiate', 'Vedere quante ce ne sono state per ogni motivo'],
    consiglio: 'Questo registro non si cancella e non si modifica. Serve a rispondere alla domanda "chi ha visto i miei dati" senza doverci pensare, che è una domanda che una persona ha il diritto di fare.',
  },
  '/castle/leve': {
    titolo: 'Le leve',
    testo: 'La mappa di dove si cambiano le cose: che cosa comanda che cosa, e da quale schermata.',
    azioni: ['Vedere quali regole si cambiano dal listino e quali dalle offerte', 'Leggere che cosa è ancora scritto nel codice'],
    consiglio: 'L’elenco dice anche quello che non si può cambiare da qui: un elenco di leve vale solo se è onesto su quelle che non ci sono.',
  },
  '/castle/menu': {
    titolo: 'Menu',
    testo: 'Le sezioni del Castello che non stanno nella barra, e l’uscita.',
    azioni: ['Aprire i pagamenti, le offerte, la pubblicità, il registro delle occhiate e la mappa delle leve', 'Chiudere la sessione'],
  },

  /* ─── Osservatorio ──────────────────────────────────────── */
  '/osservatorio': {
    titolo: 'Osservatorio',
    testo: 'Il mercato del lavoro visto dai dati delle aziende con abbonamento: che competenze girano, come si muovono le persone, che cosa si cerca.',
    azioni: ['Aprire le tavole: competenze, profili, mobilità, annunci'],
    consiglio: 'Questo è un account a sé, che si riceve da Achivia: non si compra abbonando un’organizzazione, e nessun abbonamento ci dà accesso. Il legame va nell’altro verso — i numeri vengono dalle aziende con abbonamento, mentre le organizzazioni personalizzate restano fuori: quello che succede dentro un gruppo o una famiglia non è un dato di mercato.',
  },
  '/osservatorio/competenze': {
    titolo: 'Competenze',
    testo: 'Quali competenze vengono certificate, quanto, e come cambia nel tempo.',
    azioni: ['Cambiare la finestra temporale', 'Aprire una famiglia di competenze', 'Guardare l’andamento di una singola'],
  },
  '/osservatorio/profili': {
    titolo: 'Profili',
    testo: 'Chi ha chiesto di farsi trovare per un’offerta di lavoro e in questo momento non è in nessuna organizzazione.',
    azioni: [
      'Restringere per competenze, zona, lingue e disponibilità',
      'Aprire una scheda e leggerne le competenze certificate',
      'Scrivere a un profilo',
    ],
    consiglio: 'I nomi non ci sono, e nemmeno le aziende da cui queste persone vengono: ogni profilo si presenta col suo numero Achivia e con quello che sa fare.',
  },
  '/osservatorio/mobilita': {
    titolo: 'Mobilità',
    testo: 'Quanta gente entra ed esce dalle organizzazioni, e quanto ci resta.',
    azioni: ['Cambiare la finestra temporale', 'Confrontare ingressi e uscite'],
  },
  '/osservatorio/annunci': {
    titolo: 'Annunci',
    testo: 'La domanda di lavoro: quanti annunci vengono aperti, che retribuzione offrono, che competenze chiedono e dove.',
    azioni: ['Restringere per dimensione, luogo e competenze richieste', 'Cambiare il periodo'],
  },
};

/**
 * Trova la guida di un percorso.
 *
 * Il confronto e' segmento per segmento e i segmenti che cominciano con ":"
 * accettano qualsiasi cosa, cosi' `/manager/management/employees/u-emp1` trova
 * la voce di `/manager/management/employees/:id`. A parita' di lunghezza vince
 * il percorso piu' preciso, quello con meno parametri: `/teams/new` non deve
 * finire sulla voce di `/teams/:id`.
 */
export function guidaPer(percorso) {
  const parti = percorso.replace(/\/+$/, '').split('/').filter(Boolean);
  let migliore = null;
  let migliorePunteggio = -1;

  for (const [chiave, contenuto] of Object.entries(GUIDE)) {
    const attese = chiave.split('/').filter(Boolean);
    if (attese.length !== parti.length) continue;
    let punteggio = 0;
    let va = true;
    for (let i = 0; i < attese.length; i += 1) {
      if (attese[i].startsWith(':')) continue;      // un parametro: prende tutto
      if (attese[i] !== parti[i]) { va = false; break; }
      punteggio += 1;                                // un segmento esatto vale di piu'
    }
    if (va && punteggio > migliorePunteggio) {
      migliore = contenuto;
      migliorePunteggio = punteggio;
    }
  }
  return migliore;
}
