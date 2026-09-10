/**
 * Che cosa avresti dovuto fare meglio.
 *
 * Alla fine di una partita si legge un consuntivo e non si impara niente:
 * i numeri dicono com'è andata, non perché. Questi trenta consigli dicono
 * il perché, e ognuno guarda una cosa sola che si può cambiare la volta
 * dopo.
 *
 * LE SOGLIE NON SONO OPINIONI. Ogni `quando` confronta una misura con un
 * numero, e quel numero viene dal confronto fra le partite vinte e quelle
 * perse: quattromila partite giocate dal giocatore di riferimento,
 * misurate una per una, e la soglia messa dove le due popolazioni si
 * separano. Il conto lo rifà `npm run boss:consigli` quando si vuole —
 * dice anche quante volte ognuno esce, così nessun consiglio resta scritto
 * e mai detto.
 *
 * Le misure sono normalizzate apposta (vedi `motore/analisi.js`): chi
 * arriva al trentesimo giorno ha più di tutto per il solo fatto di essere
 * arrivato, e un consiglio tarato sui numeri grezzi direbbe soprattutto
 * «sei morto presto».
 *
 * SI DANNO A DUE O TRE PER VOLTA, i più pesanti per primi. Dieci consigli
 * insieme non sono dieci consigli, sono un muro di testo che non cambia
 * niente.
 */

/* Quanto pesa un consiglio: a parità di condizione escono prima quelli
   che riguardano la cosa che ha davvero deciso la partita. */
const CAUSA = 100;      // e' morto di questo
const RADICE = 70;      // e' la ragione sotto la causa
const ABITUDINE = 45;   // un modo di giocare che costa
const RIFINITURA = 25;  // si puo' fare meglio, ma non e' quello che ti ha ucciso

export const CONSIGLI = [
  /* ═══ L'economia: la prima metà è l'unica finestra ═══ */
  {
    id: 'PRIMA_META_SOTTO',
    peso: RADICE,
    quando: (a) => a.giorni >= 8 && a.saldoMedioPrimaMeta < 350,
    testo: (a) => `Nei primi quindici giorni hai chiuso in media a ${Math.round(a.saldoMedioPrimaMeta)} monete al giorno. È l’unica finestra in cui l’officina può guadagnare: chi vince ci esce con più di settecento. Dal sedicesimo il regno rincara, e quello che non hai messo via lì non lo recuperi più.`,
  },
  {
    id: 'MAI_IN_ATTIVO',
    peso: RADICE,
    quando: (a) => a.giorni >= 10 && a.quotaAttivoPrimaMeta < 0.45,
    testo: (a) => `Nella prima metà hai chiuso in attivo solo ${a.attivoPrimaMeta} giorni su ${Math.min(15, a.giorni)}. Chi arriva in fondo ne chiude sette su dieci: se le serate in rosso sono la maggioranza già a gennaio, la partita è decisa prima di cominciare a essere difficile.`,
  },
  {
    id: 'MASSIMO_TROPPO_PRESTO',
    peso: ABITUDINE,
    quando: (a) => a.giorni >= 12 && a.quandoIlMassimo < 0.45,
    testo: (a) => `La tua cassa ha toccato il massimo al giorno ${a.giornoCassaMassima}, e da lì è solo scesa. Chi vince continua a salire fino al diciottesimo: se il picco arriva nella prima settimana vuol dire che stavi già consumando la dotazione iniziale invece di guadagnare.`,
  },
  {
    id: 'NIENTE_SCORTA',
    /* Rifinitura e non diagnosi: un terzo di chi vince arriva in fondo
       senza aver mai visto diecimila monete in cassa. Dirgli che gli
       mancava la scorta sarebbe vero come consiglio e falso come causa. */
    peso: RIFINITURA,
    quando: (a) => a.giorni >= 18 && a.cassaMassima < 10000,
    testo: (a) => `Il massimo che hai avuto in cassa sono ${Math.round(a.cassaMassima).toLocaleString('it-IT')} monete. Chi arriva in fondo ne accumula quindicimila: la seconda metà si compra con la scorta della prima, e senza scorta gli ultimi dieci giorni sono solo una discesa.`,
  },
  {
    id: 'ROSSO_LUNGO',
    peso: ABITUDINE,
    quando: (a) => a.rossoDiFilaPeggiore >= 8 && !a.vinta,
    testo: (a) => `Sei rimasto in perdita ${a.rossoDiFilaPeggiore} giorni di fila. Una serie così non si ferma da sola: quando il saldo è rosso tre sere di seguito bisogna cambiare qualcosa nel conto — tagliare, o alzare il morale che tira la produttività — non aspettare che passi.`,
  },
  {
    id: 'MORTO_SUBITO',
    peso: CAUSA,
    quando: (a) => !a.vinta && a.causa === 'cassa' && a.giorni <= 12,
    testo: (a) => `Sei fallito al giorno ${a.giorni}. Con la dotazione iniziale si regge una decina di giorni anche stando fermi: morire prima del dodicesimo vuol dire aver speso molto e presto. All’inizio conviene dire di sì solo a quello che rende — sicurezza, strumenti, aumenti meritati — e rimandare il resto a quando la cassa cresce.`,
  },

  /* ═══ Il morale, che è il moltiplicatore di tutto ═══ */
  {
    id: 'MORALE_A_TERRA',
    peso: RADICE,
    quando: (a) => a.moraleFinale < 65,
    testo: (a) => `Hai chiuso con il morale a ${Math.round(a.moraleFinale)}. Il morale non è un numero simpatico: ogni sera la produttività si muove verso ${Math.round(12 + a.moraleFinale * 0.85)}, e la produttività è il fatturato. Con la gente demoralizzata l’officina rende meno qualunque cosa tu decida dopo.`,
  },
  {
    id: 'MORALE_MEDIOCRE',
    peso: RIFINITURA,
    quando: (a) => a.moraleFinale >= 65 && a.moraleFinale < 82,
    testo: (a) => `Morale finale ${Math.round(a.moraleFinale)}: non è un disastro, ma chi vince chiude sopra novanta. Le cose che alzano il morale e costano poco — un grazie, un permesso, uno strumento riparato — vanno prese tutte, perché si ripagano dalla sera dopo.`,
  },
  {
    id: 'PRODUTTIVITA_BASSA',
    peso: RADICE,
    quando: (a) => a.giorni >= 8 && a.produttivitaMedia < 70,
    testo: (a) => `Produttività media ${Math.round(a.produttivitaMedia)}%. Il fatturato è quasi solo questo numero moltiplicato per le teste: tenerlo sotto settanta vuol dire lavorare tutto il mese al settanta per cento di quello che l’officina potrebbe rendere.`,
  },
  {
    id: 'MORALE_NON_COMPRATO',
    peso: ABITUDINE,
    quando: (a) => a.quotaAccettate < 0.42 && a.moraleFinale < 80,
    testo: () => 'Hai detto di sì a meno di due richieste su cinque, e il morale l’ha pagato. Non tutte le richieste costano: quelle che chiedono attenzione invece che monete — un riconoscimento, un conflitto da mediare, un orario diverso — sono morale gratis, e il morale è fatturato.',
  },
  {
    id: 'RANCORE_ALTO',
    peso: RADICE,
    quando: (a) => a.giornoRancoreGrave > 0 && a.giornoRancoreGrave <= 20,
    testo: (a) => `Al giorno ${a.giornoRancoreGrave} il rancore era già al quinto gradino, quello delle dimissioni. Arrivarci al ventinovesimo capita a chiunque; arrivarci prima del ventesimo vuol dire che ogni sera per dieci giorni si è tirato un dado su ognuno dei cinque guai aperti — e i gradini non si richiudono quando smetti, si sfiatano piano.`,
  },
  {
    id: 'DIMISSIONI',
    /* Anche questa e' una rifinitura, e l'ha deciso la misura: chi vince
       perde gente allo stesso ritmo di chi perde. Costa — millenovecento
       monete e dodici giorni di resa ridotta — ma non e' quello che
       decide la partita, e spacciarla per la causa manderebbe il
       giocatore a risolvere il problema sbagliato. */
    peso: RIFINITURA,
    quando: (a) => a.usciti >= 1 && a.usciti10Giorni >= 0.95,
    testo: (a) => `Se ne ${a.usciti === 1 ? 'è andata una persona' : `sono andate ${a.usciti} persone`} in ${a.giorni} giorni: un ritmo di quasi uno ogni dieci giornate. Ognuna costa millenovecento monete per il ricambio, e il sostituto rende il quarantacinque per cento per dodici giorni: perdere qualcuno è la cosa più cara che ti possa succedere, e succede quando il rancore supera cinquantaquattro.`,
  },
  {
    id: 'TROPPI_NO',
    peso: ABITUDINE,
    quando: (a) => a.quotaRifiutate > 0.52,
    testo: (a) => `Hai rifiutato ${Math.round(a.quotaRifiutate * 100)}% delle richieste. Dire di no non è gratis: ogni no lascia un segno anche quando l’archetipo non lo dice, e i segni si sommano nel rancore. Rifiutare tutto muore al decimo giorno — l’ha misurato il simulatore.`,
  },
  {
    id: 'SILENZI',
    /* Pesa come una radice e non come un'abitudine: chi lascia scadere le
       richieste non ha un problema di strategia, ha un problema di
       lettura, ed e' l'unica cosa che si puo' correggere domani senza
       sapere niente d'altro. Nelle simulazioni esce quasi mai — le
       politiche rispondono sempre — ma chi gioca davvero, con nove secondi
       a richiesta, lo fa eccome. */
    peso: RADICE,
    quando: (a) => a.quotaScadute > 0.09,
    testo: (a) => `${a.scadute} richieste sono scadute senza risposta, il ${Math.round(a.quotaScadute * 100)}% di quelle che hai ricevuto. Non rispondere costa in rancore più del doppio di un no: chi non riceve risposta si sente ignorato e non ti riconosce nemmeno il merito di avergli detto di no. Meglio un no veloce che un silenzio.`,
  },
  {
    id: 'GUAI_TANTI',
    peso: RIFINITURA,
    quando: (a) => a.giorni >= 10 && a.guaiPrimaMetaAlGiorno > 0.6,
    testo: () => `Già nella prima metà in officina succedeva qualcosa quasi ogni giorno. Non è sfortuna, è il rancore: ogni soglia superata apre un guaio nuovo e non chiude i precedenti, e a gennaio non dovresti averne aperti più di due.`,
  },

  /* ═══ L'indulgenza: quello che si accumula dicendo di sì ═══ */
  {
    id: 'INDULGENZA_ALTA',
    peso: RADICE,
    quando: (a) => a.giornoIndulgenzaGrave > 0 && a.giornoIndulgenzaGrave <= 20,
    testo: (a) => `Al giorno ${a.giornoIndulgenzaGrave} eri già al quarto livello di richieste, e ci sei rimasto per il resto della partita. Ogni sì alza l’asticella: chi ha ottenuto il calderone nuovo chiede il banco personale, poi la stanza sua, poi il diritto di veto sulle assunzioni. E ogni livello rincara del quaranta per cento quello che ti chiedono.`,
  },
  {
    id: 'TROPPI_SI',
    peso: ABITUDINE,
    quando: (a) => a.quotaAccettate > 0.66,
    testo: (a) => `Hai accettato ${Math.round(a.quotaAccettate * 100)}% delle richieste. Accettare sempre muore al dodicesimo giorno, e non per la cassa soltanto: è l’escalation che ti seppellisce, perché quello che ti chiedono cresce insieme a quello che hai concesso.`,
  },
  {
    id: 'ASSURDE',
    peso: ABITUDINE,
    quando: (a) => a.assurdePrese >= 1,
    testo: (a) => `Hai concesso ${a.assurdePrese === 1 ? 'una richiesta assurda' : `${a.assurdePrese} richieste assurde`}. Nelle partite vinte non ne passa nemmeno una: costano, non danno niente in cambio, e soprattutto insegnano che qui si ottiene chiedendo abbastanza.`,
  },

  /* ═══ Rimandare, che non è una terza via ═══ */
  {
    id: 'RIMANDI',
    peso: ABITUDINE,
    quando: (a) => a.quotaRimandate > 0.022,
    testo: (a) => `Hai rimandato ${a.rimandate} volte. Rimandare non è decidere a metà: la richiesta torna dopo qualche giorno con un livello in più e il quaranta per cento di costo in più, e intanto il rancore è salito quasi come con un no. Chi vince rimanda una volta su cento.`,
  },
  {
    id: 'RIMANDI_TANTI',
    peso: RADICE,
    quando: (a) => a.rimandate >= 8,
    testo: (a) => `${a.rimandate} rimandi in una partita sola. Ognuno di quelli è tornato indietro più caro di com’era: se li avessi rifiutati subito avresti pagato il rancore una volta invece di due, e non ti saresti ritrovato la fila di domani piena di roba di ieri.`,
  },

  /* ═══ I tagli: l'unica leva sul conto di ogni sera ═══ */
  {
    id: 'TAGLI_PRESTO',
    peso: RADICE,
    quando: (a) => a.tagliPrestiPrimaMeta >= 1 && a.quotaTagliPrimaMeta > 0.45,
    testo: (a) => `Hai accettato ${a.tagliPrestiPrimaMeta} tagli nella prima metà. È la mossa che sembra prudente e non lo è: misurata, tagliare dal primo giorno vince la metà delle partite di chi non taglia mai. Nella prima metà l’officina deve guadagnare, e per guadagnare le serve gente che lavora.`,
  },
  {
    id: 'TAGLI_MAI',
    peso: ABITUDINE,
    quando: (a) => a.tagliPresi === 0 && a.tagliOfferti >= 4 && !a.vinta,
    testo: (a) => `Non hai accettato nessuno dei ${a.tagliOfferti} tagli che ti hanno proposto. È giusto all’inizio e non lo è più dopo: i tagli sono l’unica cosa che cambia il conto di **ogni** sera invece del saldo di oggi, e quando il regno rincara sono l’unica risposta che hai.`,
  },
  {
    id: 'TAGLI_PERSI_IN_PERDITA',
    peso: RADICE,
    quando: (a) => a.tagliPersiInPerdita >= 3 && a.quotaTagliPersiInPerdita > 0.6,
    testo: (a) => `Per ${a.tagliPersiInPerdita} volte ti hanno proposto un taglio mentre la giornata prima aveva chiuso in rosso, e hai detto di no. È esattamente il momento in cui serve: il saldo negativo sul cruscotto è il segnale, non l’umore della stanza.`,
  },
  {
    id: 'MACCHINA_PESANTE',
    peso: RIFINITURA,
    quando: (a) => a.struttura > 1.02,
    testo: (a) => `Hai finito con i costi fissi al ${Math.round(a.struttura * 100)}% di quelli di partenza. Consulenti e assunzioni non pesano solo il giorno che li paghi: alzano il conto di tutte le sere che restano, e su trenta giorni quello conta più di qualunque somma una tantum.`,
  },

  /* ═══ Gli investimenti e i manager ═══ */
  {
    id: 'POCHI_INVESTIMENTI',
    peso: RADICE,
    quando: (a) => a.investimentiOfferti >= 5 && a.quotaInvestimentiPresi < 0.14,
    testo: (a) => `Hai accolto solo ${a.investimentiPresi} delle ${a.investimentiOfferti} proposte che facevano crescere l’officina — investimenti, corsi, campagne, assunzioni. Chi vince ne prende una su cinque, tu una su ${Math.max(1, Math.round(1 / Math.max(0.01, a.quotaInvestimentiPresi)))}: sono l’unica cosa che alza il tetto, e senza alzare il tetto si può solo scendere più piano.`,
  },
  {
    id: 'INVESTIMENTI_TARDIVI',
    peso: RIFINITURA,
    quando: (a) => a.investimentiPresi >= 3 && a.quotaInvestimentiTardivi > 0.4,
    testo: (a) => `${a.investimentiTardivi} dei tuoi ${a.investimentiPresi} investimenti sono arrivati negli ultimi otto giorni. Quello che si investe torna indietro fra tre e dieci giorni: al ventiquattresimo il ritorno arriva quando la partita è già decisa, e quello che resta è solo il costo.`,
  },
  {
    id: 'MANAGER_IGNORATI',
    peso: ABITUDINE,
    quando: (a) => a.proposteTotali >= 8 && a.quotaProposteAccettate < 0.2,
    testo: () => `Hai accettato meno di una proposta su cinque dei tuoi assistant manager. Mentono, ogni tanto — chi più chi meno, e non te lo dice nessuno — ma le loro proposte sono l’unico modo di cambiare come funziona l’officina invece di rispondere a chi bussa.`,
  },
  {
    id: 'PROMESSE_MANCATE',
    peso: RIFINITURA,
    quando: (a) => a.proposteAccettate >= 6 && a.quotaPromesseMancate > 0.3,
    testo: (a) => `${a.promesseMancate} promesse su ${a.proposteAccettate} che hai accolto non si sono avverate, e quando non si avverano non è che non succede niente: succede il contrario. Chi te le fa non vale tutto uguale — il consulente mantiene meno di una volta su due, chi propone di tagliare i costi tre su quattro — e l’unico modo di saperlo è ricordarsi com’è andata le altre volte con quella persona.`,
  },

  /* ═══ Le quattro che non si rifiutano, e la faccia dell'azienda ═══ */
  {
    id: 'NON_RIFIUTARE',
    peso: RADICE,
    quando: (a) => a.nonRifiutareTotali >= 6 && a.quotaNonRifiutareMancate > 0.14,
    testo: (a) => `Hai lasciato andare ${a.nonRifiutareMancate} richieste su ${a.nonRifiutareTotali} fra quelle in cui il no si paga più del sì: la sicurezza, lo strumento rotto, l’aumento che tocca, i due che non si sopportano. Su queste quattro il rifiuto ha una conseguenza differita peggiore della spesa che eviti.`,
  },
  {
    id: 'SICUREZZA',
    peso: RADICE,
    quando: (a) => a.sicurezzaMancate >= 2,
    testo: (a) => `Hai ignorato ${a.sicurezzaMancate} segnalazioni di sicurezza. Quella è la peggiore su cui risparmiare: quando torna indietro porta cinquecento monete di spese, tre gradini di reputazione e tre di morale — molto più del costo di sistemarla subito.`,
  },
  {
    id: 'REPUTAZIONE',
    peso: ABITUDINE,
    quando: (a) => a.giorni >= 12 && a.reputazioneFinale < 55,
    testo: (a) => `Reputazione finale ${Math.round(a.reputazioneFinale)}. Non è un numero d’immagine: moltiplica il fatturato di ogni sera, e fra cinquanta e settanta ci ballano quasi il dieci per cento degli incassi. Tagli, esternalizzazioni e sicurezza ignorata si vedono da fuori.`,
  },

  /* ═══ E per chi ce l'ha fatta ═══ */
  {
    id: 'VINTA',
    peso: CAUSA,
    quando: (a) => a.vinta,
    testo: (a) => `Ce l’hai fatta, e sei in compagnia di poche persone: passa poco più di una partita su otto. Sei arrivato in fondo con ${Math.round(a.cassaFinale).toLocaleString('it-IT')} monete, il morale a ${Math.round(a.moraleFinale)} e ${a.usciti === 0 ? 'nessuno che se ne sia andato' : `${a.usciti} ${a.usciti === 1 ? 'persona uscita' : 'persone uscite'}`}.`,
  },
  {
    id: 'QUASI',
    peso: RIFINITURA,
    quando: (a) => !a.vinta && a.giorni >= 26,
    testo: (a) => `Ti sono mancati ${31 - a.giorni} giorni. Alla fine non si perde per una decisione sbagliata: si perde perché la scorta della prima metà non bastava a comprare la seconda. La partita si vince a gennaio, si scopre a marzo.`,
  },
];

/**
 * I consigli da dare a fine partita: i più pesanti per primi, al massimo
 * `quanti`. Se non ne scatta nessuno resta comunque quello di chiusura —
 * una schermata di fine partita senza niente da dire è un'occasione persa.
 */
export function consigliDi(analisi, quanti = 3) {
  const usciti = CONSIGLI
    .filter((c) => {
      try { return c.quando(analisi); } catch { return false; }
    })
    .sort((x, y) => y.peso - x.peso)
    .slice(0, quanti);
  return usciti.map((c) => ({ id: c.id, testo: c.testo(analisi) }));
}
