/**
 * The Boss: tutti i numeri, in un posto solo.
 *
 * Questa e' la regola piu' importante del modulo, e vale anche per chi lo
 * tocchera' fra sei mesi: **nessun numero di bilanciamento sta altrove**.
 * Non nel motore, non nelle schermate, e soprattutto non nei testi delle
 * richieste — quelli raccontano, non calcolano. Un gioco a decisioni si
 * bilancia provando, e provare vuol dire cambiare una riga qui e rilanciare
 * il simulatore, non andare a cercare il numero in trenta file.
 *
 * Quello che si legge qui e' la partita: trenta giorni, un timer per
 * giornata, cinque indicatori che salgono e scendono, e due che il
 * giocatore non vede mai.
 */

/* ─── La partita ─── */

export const PARTITA = {
  /**
   * Arrivare in fondo al trentesimo giorno con l'azienda viva e' la
   * vittoria.
   *
   * Erano cinquanta, e cinquanta erano troppi per due ragioni. La prima e'
   * il tempo di chi gioca: una partita da cinquanta giornate e' un'ora
   * abbondante, e questo e' un gioco da pausa. La seconda e' la banca dei
   * testi: cinquanta giorni consumano quasi cinquecento richieste, e sopra
   * quel numero il giocatore comincia a rileggere cose gia' lette. A trenta
   * ne servono trecento, e la banca ne ha di piu': **dentro una partita non
   * si ripete un testo**.
   */
  giorni: 30,
  /** Il briefing di apertura: si puo' saltare, e chi lo salta non e' punito. */
  briefingSecondi: 6,
};

/**
 * Quante richieste bussano in una giornata.
 *
 * Da cinque a diciotto, in gradini. La difficolta' cresce perche' crescono
 * le decisioni — piu' occasioni di sbagliare, piu' conseguenze che partono
 * — non perche' il testo diventi illeggibile.
 *
 * Ogni riga e' `[fino al giorno, quante]`, letta dall'alto: la prima che
 * copre il giorno vince. Una partita intera consuma circa 485 richieste,
 * che e' il numero da tenere a mente quando si guarda quanto e' grande la
 * banca dei testi: dentro una partita non se ne ripete mai una.
 */
export const RICHIESTE_PER_GIORNO = [
  [3, 5], [6, 6], [9, 7], [12, 8], [15, 9], [18, 10],
  [20, 11], [22, 12], [24, 13], [26, 14], [27, 15], [28, 16], [29, 17], [30, 18],
];

export function richiesteDelGiorno(giorno) {
  for (const [fino, quante] of RICHIESTE_PER_GIORNO) if (giorno <= fino) return quante;
  return RICHIESTE_PER_GIORNO[RICHIESTE_PER_GIORNO.length - 1][1];
}

/**
 * Quanto dura una giornata, in secondi.
 *
 * Il timer scorre sempre e leggere costa tempo: e' la pressione del gioco,
 * ed e' voluto che a fine giornata qualche richiesta scada. Ma "difficile"
 * e "impossibile" sono due cose diverse: una richiesta si legge in quattro
 * o cinque secondi e si decide in due o tre, quindi sotto i dieci secondi a
 * testa non si sta piu' giocando, si sta tirando a indovinare.
 *
 * Percio' la giornata cresce insieme alle richieste — dieci secondi
 * ciascuna — ma con un tetto: dal quindicesimo giorno in poi il tempo per
 * richiesta comincia a stringersi davvero, e negli ultimi giorni si arriva
 * a nove secondi scarsi. Chi rilegge due volte la stessa richiesta paga.
 */
export const TURNO = {
  secondiPerRichiesta: 10,
  minimo: 90,
  massimo: 170,
};

export function secondiDelGiorno(giorno) {
  const n = richiesteDelGiorno(giorno);
  return Math.min(TURNO.massimo, Math.max(TURNO.minimo, n * TURNO.secondiPerRichiesta));
}

/**
 * Quanti degli interventi della giornata li propone un assistant manager.
 *
 * Non superano mai i dipendenti — un terzo delle richieste, arrotondato in
 * giu' — e da meta' partita ce n'e' sempre almeno uno: e' il momento in cui
 * il gioco smette di essere una fila allo sportello e diventa una
 * questione di strategia.
 */
export const MANAGER = {
  quotaMassima: 1 / 3,
  daGiorno: 15,
};

export function managerDelGiorno(giorno) {
  const n = richiesteDelGiorno(giorno);
  const massimo = Math.floor(n * MANAGER.quotaMassima);
  return { massimo, minimo: giorno >= MANAGER.daGiorno ? Math.min(1, massimo) : 0 };
}


/* ═══ Gli indicatori: da dove parte l'azienda ═══ */

/**
 * I cinque numeri che il giocatore vede, e i due che non vede mai.
 *
 * Cassa in euro; produttivita', morale e reputazione in percentuale.
 * Il fatturato non sta qui perche' non e' uno stato: si ricalcola ogni
 * sera da produttivita', organico e modificatori attivi.
 *
 * I due nascosti sono il cuore del gioco. **Indulgenza** sale quando
 * accetti, e piu' e' alta piu' quello che ti chiedono e' caro e assurdo:
 * chi ha ottenuto il calderone nuovo chiede il banco personale, poi la
 * stanza sua, poi il venerdi' libero. **Rancore** sale quando rifiuti,
 * tagli o ignori, e apre la fila degli eventi brutti — cali di ritmo,
 * bugie sui rapporti, furti, assenze, dimissioni, passaparola, vertenza.
 * Non si mostrano mai come numero: si sentono dai dialoghi e si vedono
 * dalle conseguenze.
 */
export const PARTENZA = {
  cassa: 5850,
  produttivita: 70,
  morale: 65,
  reputazione: 60,
  indulgenza: 15,
  rancore: 10,
  /**
   * Quanto costa far girare l'azienda, rispetto a com'e' messa oggi.
   *
   * E' l'ottava leva, ed e' arrivata per ultima perche' mancava un buco
   * che si vedeva solo giocando: tutte le altre spostano un **saldo** —
   * quanta cassa hai adesso, quanto morale — e nessuna spostava il
   * **conto giornaliero**. Percio' chi si trovava in perdita non aveva
   * niente da fare: poteva perdere piu' piano, non poteva smettere di
   * perdere. Il simulatore lo diceva senza mezzi termini — accettare i
   * tagli del manager faceva vincere **meno** partite, anche negli ultimi
   * dieci giorni, che e' come dire che la leva dei tagli non esisteva.
   *
   * Adesso una riorganizzazione, un taglio, un'esternalizzazione tolgono
   * qualche punto ai costi di ogni sera **per sempre**, e un consulente o
   * una persona in piu' li aggiungono. Uno vale l'altro, e il prezzo dei
   * tagli lo pagano il morale e il rancore: non e' una scorciatoia, e'
   * una scelta con un costo che si vede dopo.
   */
  struttura: 1,
};

/** I confini dentro cui vivono. La cassa puo' andare sotto zero: e' la sconfitta. */
export const LIMITI = {
  produttivita: [0, 100],
  morale: [0, 100],
  reputazione: [0, 100],
  indulgenza: [0, 100],
  rancore: [0, 100],
  /* Un quarto in meno e' il massimo che si puo' tagliare prima di non
     avere piu' un'azienda; un quarto in piu' e' il massimo che si puo'
     appesantire prima che sia il conto a chiudere la partita. */
  struttura: [0.82, 1.25],
};

/* ═══ Il passo: quanto vale un gradino su ogni leva ═══ */

/**
 * Nessun archetipo, nessun evento e nessuna conseguenza porta un numero.
 * Portano **gradini**: `{ cassa: -3, morale: +1 }` vuol dire tre gradini
 * di cassa in giu' e uno di morale in su. Quanto sia un gradino si decide
 * qui, e ribilanciare il gioco vuol dire toccare queste sette righe invece
 * di rileggere venticinque archetipi e venti eventi.
 *
 * E' anche una difesa: un file di contenuti che non puo' scrivere un
 * numero non puo' sbilanciare il gioco di nascosto.
 */
export const PASSO = {
  cassa: 100,
  produttivita: 0.5,
  morale: 0.6,
  reputazione: 0.6,
  indulgenza: 0.75,
  rancore: 0.38,
  lealta: 2.5,
  /* Un gradino di struttura e' poco piu' di un punto di costi al giorno.
     Sembra niente e non lo e': vale per tutte le sere che restano, e
     quattro gradini su trenta giorni pesano piu' di qualunque somma una
     tantum. E' voluto: e' l'unica leva che si compone con il tempo. */
  struttura: 0.012,
};

/* ═══ L'economia della giornata ═══ */

/**
 * La sera si fa il conto: quanto ha reso la giornata, quanto e' costata,
 * e la differenza entra in cassa.
 *
 *   ricavo = perTesta x organico x (produttivita/100) x modificatori
 *   costo  = stipendi + fissi + quello che le decisioni hanno aggiunto
 *
 * I numeri disegnano un arco, e l'arco e' il gioco. Erano tarati perche'
 * l'azienda partisse sotto **e ci restasse**, e questo era l'errore: il
 * saldo era negativo il primo giorno ed era ancora negativo il trentesimo,
 * quindi chi giocava bene non guadagnava niente, perdeva solo piu' piano.
 * Un gioco in cui fare bene non si vede e' un gioco che sembra truccato.
 *
 * L'arco di adesso ha tre tempi:
 *
 *  1. **I primi giorni si e' sotto**, ma di poco — un paio di centinaia di
 *     monete a sera. Serve a dire subito che l'azienda non si regge da
 *     sola, e a non lasciare la strada di rifiutare tutto e aspettare.
 *  2. **Da meta' della prima settimana si puo' stare sopra**, e chi ha
 *     tenuto su il morale ci sta: la produttivita' segue il morale, il
 *     fatturato segue la produttivita', e in dieci giorni la cassa
 *     raddoppia. E' il premio, ed e' l'unico posto in cui si mette via
 *     qualcosa.
 *  3. **Dal sedicesimo il regno rincara sul serio** e quello che si e'
 *     messo via e' esattamente quello con cui si compra la fine della
 *     partita. Chi non ha messo via niente non ci arriva.
 *
 * Il numero che tiene insieme i tre tempi non e' qui: e' `RITMO`, che lega
 * la produttivita' al morale. Senza quello questa sarebbe una tabella di
 * entrate e uscite, e non ci sarebbe niente da decidere.
 */
export const ECONOMIA = {
  ricavoPerTesta: 305,
  costiFissi: 877,
  /** Sotto questa produttivita' i clienti cominciano ad andarsene: il ricavo cade piu' in fretta del lineare. */
  produttivitaCritica: 40,
  cadutaSottoCritica: 1.35,
  /** La reputazione sposta il ricavo: a 100 vale un quinto in piu', a 0 un quinto in meno. */
  spintaReputazione: 0.42,
  /**
   * Il regno rincara, e non allo stesso modo per tutta la partita.
   *
   * Serve a una cosa sola, e sostituisce dieci regole piu' complicate: una
   * partita che va bene non deve poter andare bene per sempre. Senza
   * questa riga, chi ha trovato l'equilibrio al ventesimo giorno lo tiene
   * fino al trentesimo senza piu' decidere niente, e l'ultima settimana
   * diventa una formalita'.
   *
   * Era un rincaro solo, uguale ogni giorno, e cosi' faceva il danno nel
   * posto sbagliato: schiacciava la meta' della partita in cui il
   * giocatore sta ancora cercando di rimettere in piedi l'azienda, cioe'
   * proprio dove serve che rimettere in piedi l'azienda sia possibile.
   *
   * Adesso sono due tempi. Nei primi quindici giorni il regno rincara
   * appena — meno di un punto in tutto — e chi lavora bene arriva
   * all'attivo e mette via qualcosa. Dal sedicesimo il conto cambia passo:
   * due punti al giorno, che alla trentesima giornata fanno un terzo
   * abbondante in piu' di quello che si pagava a gennaio. Il gioco non
   * diventa piu' cattivo, diventa **piu' caro**, e la scorta messa via
   * nella prima meta' e' esattamente quello con cui si compra la seconda.
   */
  rincaro: { giornaliero: 0.004, daGiorno: 16, dopo: 0.0360 },
};

/**
 * Quanto costa oggi quello che a gennaio costava uno.
 *
 * I due tempi di `ECONOMIA.rincaro`, messi in fila: il primo si ferma al
 * giorno dello scalino, il secondo comincia da li'.
 */
export function rincaroDi(giorno) {
  const { giornaliero, daGiorno, dopo } = ECONOMIA.rincaro;
  const primi = Math.min(giorno, daGiorno) - 1;
  const poi = Math.max(0, giorno - daGiorno);
  return (1 + giornaliero) ** primi * (1 + dopo) ** poi;
}

/**
 * Il morale tira la produttivita', ed e' il cuore della tesi del gioco.
 *
 * Senza questa regola il morale sarebbe un numero decorativo e trattare
 * bene le persone sarebbe solo un costo. Con questa regola, ogni sera la
 * produttivita' si muove verso il livello che il morale sostiene: gente
 * contenta lavora, gente scontenta no, e il conto arriva sul fatturato
 * senza bisogno di spiegarlo a nessuno.
 *
 * Non e' immediata: si muove di una frazione al giorno. Un giorno buono non
 * risolve una settimana storta, e una settimana storta non si vede subito —
 * che e' esattamente il modo in cui succede davvero.
 */
export const RITMO = {
  /**
   * Quanto si produce quando non importa piu' niente a nessuno.
   *
   * Era trentaquattro, ed era un pavimento regalato: qualunque cosa
   * facessi, ogni sera la produttivita' risaliva verso trentaquattro da
   * sola. Due conseguenze, tutte e due sbagliate. La prima: il morale a
   * meta' costava pochissimo, perche' il tiro lo compensava. La seconda:
   * la sconfitta per produttivita' a terra non poteva succedere — la
   * soglia e' quindici, e da un pavimento a trentaquattro non ci si
   * arriva. Una sconfitta dichiarata e irraggiungibile e' una promessa
   * non mantenuta.
   *
   * Adesso il pavimento e' basso e il morale porta quasi tutto il peso:
   * in cima si arriva dove si arrivava prima — gente contenta produce —
   * ma un'azienda demoralizzata scende sul serio, e allora l'officina si
   * ferma davvero.
   */
  base: 12,
  perMorale: 0.85,
  velocita: 0.17,
};

/**
 * Gli stipendi, per anzianita'. Non e' una tabella di ruoli: chi sta qui da
 * otto anni costa piu' di chi e' arrivato a marzo, e questo basta a far
 * pesare in modo diverso la stessa richiesta di aumento.
 */
export const STIPENDI = {
  base: 96,
  perAnno: 9,
  /** Un dipendente sottopagato costa meno e ha ragione: il tratto lo sconta. */
  scontoSottopagato: 0.82,
  /** Chi e' indispensabile costa di piu': lo sa anche lui. */
  premioIndispensabile: 1.15,
};

/* ═══ Le due spirali ═══ */

/**
 * L'indulgenza non fa danni da sola: cambia quello che ti chiedono.
 *
 * Ogni gradino di escalation moltiplica il costo di quello che arriva. A
 * indulgenza bassa arrivano richieste di primo livello; salendo si aprono
 * il secondo, il terzo e il quarto, dove stanno il veto sulle assunzioni e
 * il piano di espansione personale. E il costo cresce con loro.
 */
export const INDULGENZA = {
  /** Sopra queste soglie si sbloccano i livelli 2, 3 e 4 di escalation. */
  soglie: [22, 42, 62],
  /**
   * Quanto alza l'asticella **ogni** si', al di la' di quello che chiede
   * l'archetipo.
   *
   * Senza questa riga la spirale non si accende: nelle prove il giocatore
   * equilibrato accettava cose che non portano indulgenza scritta —
   * la sicurezza, lo strumento rotto, il permesso — e restava al primo
   * livello per tutta la partita, cioe' non vedeva mai il meccanismo
   * principale del gioco. La regola vera e' piu' semplice di qualunque
   * tabella: chi ottiene si abitua a ottenere, qualunque cosa abbia
   * ottenuto.
   */
  perSi: 0.6,
  /** Quanto costa di piu' una richiesta, per ogni livello sopra il primo. */
  rincaro: 0.4,
  /**
   * Ogni giorno l'indulgenza cala di una **frazione** di se stessa, non di
   * un numero fisso: chi ha molto pretende molto, e dimentica in fretta
   * solo se ha poco. Cosi' la spirale trova un equilibrio invece di
   * saturare a cento e restarci — e l'equilibrio dipende da come giochi,
   * che e' il punto.
   */
  sfiato: 0.09,
};

/**
 * Il rancore fa danni da solo, in fila e sempre peggiori.
 *
 * Ogni soglia apre un guaio nuovo e non chiude i precedenti: si comincia
 * col ritmo che cala, si finisce con la vertenza e l'articolo di giornale.
 * Le probabilita' sono per giornata, e si sommano a quello che gia' c'e'.
 */
export const RANCORE = {
  gradini: [
    { da: 18, guaio: 'ritmo',        probabilita: 0.30 },
    { da: 27, guaio: 'bugie',        probabilita: 0.24 },
    { da: 36, guaio: 'furto',        probabilita: 0.20 },
    { da: 45, guaio: 'assenze',      probabilita: 0.26 },
    { da: 54, guaio: 'dimissioni',   probabilita: 0.16 },
    { da: 65, guaio: 'passaparola',  probabilita: 0.22 },
    { da: 76, guaio: 'vertenza',     probabilita: 0.12 },
  ],
  /** E ogni no lascia il segno, anche quando l'archetipo non lo dice. */
  perNo: 0.45,
  /** Anche il rancore sfiata di una frazione, ma piu' piano: le offese si ricordano. */
  sfiato: 0.07,
};

/** Quanto costa perdere qualcuno: ricerca, selezione, e un sostituto che rende meno. */
export const RICAMBIO = {
  costo: 1900,
  giorniRidotto: 12,
  resaRidotta: 0.45,
  /** Con la reputazione a terra assumere costa di piu' e ci vuole di piu'. */
  rincaroPerReputazioneBassa: 0.9,
};

/* ═══ Il non decidere ═══ */

/**
 * Una richiesta scaduta e' la risposta peggiore delle due.
 *
 * Chi non riceve risposta non si prende nessuno dei vantaggi del rifiuto —
 * niente costo risparmiato che valga — e in piu' si sente ignorato: il
 * rancore sale piu' che con un no detto in faccia, e la memoria se lo
 * segna come "ignorato", che pesa il doppio nelle reazioni successive.
 */
export const SCADUTA = {
  /**
   * Il rancore del silenzio si conta a parte, e in punti, non in gradini.
   *
   * Nelle prove il conto non tornava: un no porta i gradini del suo
   * archetipo **piu'** il segno fisso che ogni no lascia (`RANCORE.perNo`),
   * e cosi' rifiutare finiva per pesare piu' che non rispondere — cioe' il
   * contrario di quello che il gioco vuole dire. Adesso il silenzio ha il
   * suo peso fisso, piu' del doppio di quello di un no.
   */
  rancorePiatto: 1.1,
  rancore: 2.2,
  morale: -1.4,
  produttivita: -0.8,
  lealta: -2,
};

/* ═══ Le conseguenze differite ═══ */

/** Fra quanti giorni torna indietro quello che hai deciso oggi. */
export const DIFFERITE = { minimo: 3, massimo: 10 };

/* ═══ Gli eventi del mondo ═══ */

export const EVENTI = {
  /** Probabilita' che la sera succeda qualcosa. Cresce coi giorni e con gli indicatori bassi. */
  baseGiornaliera: 0.14,
  perGiorno: 0.004,
  /** Quanto la aumenta un'azienda messa male (morale, cassa o produttivita' a terra). */
  spintaGuai: 0.16,
  /** Quanti eventi possono essere attivi insieme. */
  insieme: 2,
  /** Un evento appena finito non torna subito. */
  riposo: 8,
};

/* ═══ Come si perde ═══ */

export const SCONFITTA = {
  giorniCassaNegativa: 3,
  produttivitaMinima: 15,
  giorniProduttivitaBassa: 3,
  organicoMinimo: 6,
};
