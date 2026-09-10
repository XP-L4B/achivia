/**
 * Gli archetipi: che cosa fa davvero una richiesta, al netto di come e'
 * scritta.
 *
 * Sono trenta, e sono la lista chiusa a cui ogni testo della banca deve
 * agganciarsi. Il testo racconta — «il calderone perde da tre settimane e
 * ogni volta ci rimetto mezz'ora» — l'archetipo decide — `STRUMENTO_ROTTO`,
 * costa poco, se lo rifiuti la produttivita' scende e fra qualche giorno si
 * rompe davvero. Mille testi diversi possono puntare allo stesso
 * archetipo: e' quello che permette di avere millottocento richieste senza
 * millottocento regole.
 *
 * **Qui dentro non c'e' un solo numero.** Gli effetti sono gradini —
 * `{ cassa: -2, morale: +1 }` — e quanto valga un gradino sta in
 * `bilancio.js`, campo `PASSO`. Cosi' ribilanciare il gioco non vuol dire
 * rileggere trenta archetipi, e un archetipo non puo' sbilanciare il gioco
 * di nascosto.
 *
 * Le leve sono sette: `cassa`, `produttivita`, `morale`, `reputazione`,
 * `indulgenza`, `rancore`, `lealta` (quest'ultima solo su chi ha chiesto).
 *
 *   autore        chi la porta: un dipendente, un assistant manager, o entrambi
 *   accetta       che cosa succede se dici si'
 *   rifiuta       se dici no
 *   rimanda       se rimandi. Il costo immediato e' sempre zero: quello che
 *                 si paga e' che la richiesta torna, piu' grossa
 *   differita     che cosa torna indietro fra tre e dieci giorni, e perche'.
 *                 `se` dice dopo quale risposta parte
 *   escalation    se accettarla alza l'asticella: chi ottiene chiede ancora
 *   livelli       a quali livelli di escalation puo' uscire (1 e' l'inizio)
 *   ricorrente    se puo' ripresentarsi nella stessa partita con un altro testo
 *
 * `attendibile` vale solo per gli assistant manager, ed e' il cuore della
 * loro meccanica: quanto spesso quello che promettono si avvera. Chi ha
 * `0.55` mente quasi una volta su due, e il giocatore non ha modo di
 * saperlo prima — puo' solo ricordarsi com'e' andata le altre volte.
 */

/**
 * LA DOMANDA. Ogni archetipo dice, in poche parole, **che cosa si sta
 * decidendo**: «Lo fai riparare?», «Assumi?», «Lo mandi via?».
 *
 * Serve perche' i testi delle richieste sono racconti, non domande, ed e'
 * giusto che lo siano: chi entra descrive il suo problema come lo
 * descriverebbe davvero — «perde da tre settimane, ogni volta che lo
 * riempio devo restare li' a guardarlo» — e in mezzo a un racconto la
 * domanda o non c'e' o si perde. Contate: due terzi dei testi in banca non
 * contengono nessuna forma di richiesta, e chi legge di corsa con nove
 * secondi sul cronometro si trova a premere «Accetta» senza sapere che
 * cosa sta accettando.
 *
 * Sta qui e non nei testi per la stessa ragione per cui i numeri stanno in
 * `bilancio.js`: e' una cosa sola per archetipo, e scritta una volta sola
 * vale anche per le richieste che verranno scritte domani.
 */

export const LEVE = ['cassa', 'struttura', 'produttivita', 'morale', 'reputazione', 'indulgenza', 'rancore', 'lealta'];

export const CATEGORIE = [
  'materiale', 'denaro', 'tempo', 'relazioni', 'crescita', 'sicurezza',
  'struttura', 'potere',
];

export const ARCHETIPI = [
  /* ─── Cose che servono, o che sembrano servire ─── */
  {
    id: 'STRUMENTO_ROTTO', nome: 'Qualcosa si è rotto', chiede: 'Lo fai riparare?', autore: 'dipendente', categoria: 'materiale',
    accetta: { cassa: -1, produttivita: +1, morale: +1 },
    rifiuta: { produttivita: -1, morale: -1, rancore: +1 },
    rimanda: { rancore: +1, produttivita: -1 },
    differita: { se: ['rifiuta', 'rimanda', 'scaduta'], effetto: { produttivita: -2, cassa: -2 }, causa: 'si è rotto del tutto' },
    escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'BENEFIT_MATERIALE_PICCOLO', nome: 'Un oggetto che aiuta', chiede: 'Glielo compri?', autore: 'dipendente', categoria: 'materiale',
    accetta: { cassa: -1, morale: +1, indulgenza: +1, lealta: +1 },
    rifiuta: { morale: -1, rancore: +1 },
    rimanda: { rancore: +1 },
    differita: null,
    escalation: true, livelli: [1, 3], ricorrente: true,
  },
  {
    id: 'BENEFIT_MATERIALE_GRANDE', nome: 'Un oggetto che costa', chiede: 'Lo compri?', autore: 'dipendente', categoria: 'materiale',
    accetta: { cassa: -3, morale: +2, indulgenza: +2, lealta: +2 },
    rifiuta: { morale: -1, rancore: +1 },
    rimanda: { rancore: +1, indulgenza: +1 },
    differita: { se: ['accetta'], effetto: { indulgenza: +2 }, causa: 'l’hanno saputo tutti' },
    escalation: true, livelli: [2, 4], ricorrente: true,
  },
  {
    id: 'SICUREZZA_SUL_LAVORO', nome: 'Non è sicuro', chiede: 'Ci metti mano?', autore: 'entrambi', categoria: 'sicurezza',
    accetta: { cassa: -2, morale: +2, reputazione: +1 },
    rifiuta: { morale: -2, rancore: +2 },
    rimanda: { rancore: +2, morale: -1 },
    differita: { se: ['rifiuta', 'rimanda', 'scaduta'], effetto: { cassa: -5, reputazione: -3, morale: -3 }, causa: 'è successo quello che avevano detto' },
    escalation: false, livelli: [1, 4], ricorrente: true,
  },

  /* ─── Soldi ─── */
  {
    id: 'AUMENTO_STIPENDIO', nome: 'Un aumento', chiede: 'Gli aumenti lo stipendio?', autore: 'dipendente', categoria: 'denaro',
    accetta: { cassa: -2, morale: +2, indulgenza: +2, lealta: +3 },
    rifiuta: { morale: -2, rancore: +2, lealta: -2 },
    rimanda: { rancore: +2, lealta: -1 },
    differita: { se: ['accetta'], effetto: { indulgenza: +2, morale: +1 }, causa: 'adesso lo vogliono anche gli altri' },
    escalation: true, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'AUMENTO_MERITATO', nome: 'Un aumento che tocca', chiede: 'Glielo dai, l’aumento?', autore: 'dipendente', categoria: 'denaro',
    accetta: { cassa: -2, morale: +3, produttivita: +1, reputazione: +1, lealta: +4 },
    rifiuta: { morale: -3, rancore: +3, lealta: -4 },
    rimanda: { rancore: +2, lealta: -3, morale: -1 },
    differita: { se: ['rifiuta', 'rimanda', 'scaduta'], effetto: { produttivita: -2, morale: -2 }, causa: 'ha smesso di provarci' },
    escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'ANTICIPO_STIPENDIO', nome: 'Un anticipo', chiede: 'Gli anticipi lo stipendio?', autore: 'dipendente', categoria: 'denaro',
    accetta: { cassa: -1, morale: +2, lealta: +2 },
    rifiuta: { morale: -2, rancore: +2, lealta: -2 },
    rimanda: { rancore: +2, morale: -1 },
    differita: { se: ['accetta'], effetto: { cassa: +1 }, causa: 'ha restituito l’anticipo' },
    escalation: false, livelli: [1, 3], ricorrente: true,
  },
  {
    id: 'RIMBORSO_DISCUTIBILE', nome: 'Un rimborso da guardare bene', chiede: 'Lo rimborsi?', autore: 'dipendente', categoria: 'denaro',
    accetta: { cassa: -2, morale: +1, indulgenza: +3 },
    rifiuta: { morale: -1, rancore: +1 },
    rimanda: { rancore: +1, indulgenza: +1 },
    differita: { se: ['accetta'], effetto: { indulgenza: +2, cassa: -1 }, causa: 'è arrivato un altro rimborso identico' },
    escalation: true, livelli: [2, 4], ricorrente: true,
  },

  /* ─── Tempo ─── */
  {
    id: 'PERMESSO_PERSONALE', nome: 'Un permesso', chiede: 'Gli dai il permesso?', autore: 'dipendente', categoria: 'tempo',
    accetta: { produttivita: -1, morale: +2, lealta: +2 },
    rifiuta: { morale: -2, rancore: +2, lealta: -2 },
    rimanda: { rancore: +2, morale: -1 },
    differita: { se: ['rifiuta', 'scaduta'], effetto: { morale: -2, lealta: -2 }, causa: 'se n’è andato lo stesso, senza dirlo' },
    escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'FLESSIBILITA_ORARIA', nome: 'Orari diversi', chiede: 'Gli cambi l’orario?', autore: 'dipendente', categoria: 'tempo',
    accetta: { produttivita: -1, morale: +2, indulgenza: +1 },
    rifiuta: { morale: -2, rancore: +2 },
    rimanda: { rancore: +1 },
    differita: { se: ['accetta'], effetto: { produttivita: +2, morale: +1 }, causa: 'con i suoi orari rende di più' },
    escalation: true, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'LAVORO_DA_CASA', nome: 'Lavorare da casa', chiede: 'Lo lasci lavorare da casa?', autore: 'dipendente', categoria: 'tempo',
    accetta: { produttivita: -2, morale: +2, indulgenza: +1 },
    rifiuta: { morale: -2, rancore: +2 },
    rimanda: { rancore: +1 },
    differita: null,
    /* L'unico archetipo che un evento capovolge: in tempo di peste lavorare
       da casa non fa perdere produttivita', la fa guadagnare. Lo fa
       `eventi.js` con `capovolge`, non una regola scritta qui. */
    escalation: true, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'FERIE_LUNGHE', nome: 'Ferie lunghe', chiede: 'Gli firmi le ferie?', autore: 'dipendente', categoria: 'tempo',
    accetta: { produttivita: -3, morale: +3, indulgenza: +2, lealta: +2 },
    rifiuta: { morale: -2, rancore: +2, lealta: -2 },
    rimanda: { rancore: +2 },
    differita: { se: ['accetta'], effetto: { produttivita: +2, morale: +1 }, causa: 'è tornato che era un altro' },
    escalation: true, livelli: [2, 4], ricorrente: true,
  },

  /* ─── Crescita ─── */
  {
    id: 'FORMAZIONE', nome: 'Un corso', chiede: 'Glielo paghi, il corso?', autore: 'entrambi', categoria: 'crescita',
    accetta: { cassa: -2, produttivita: -1, morale: +2 },
    rifiuta: { morale: -1, rancore: +1 },
    rimanda: { rancore: +1 },
    differita: { se: ['accetta'], effetto: { produttivita: +4, morale: +1 }, causa: 'il corso ha dato i suoi frutti' },
    escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'PROMOZIONE', nome: 'Una promozione', chiede: 'Lo promuovi?', autore: 'dipendente', categoria: 'crescita',
    accetta: { cassa: -2, morale: +2, indulgenza: +2, lealta: +4, produttivita: +1 },
    rifiuta: { morale: -2, rancore: +2, lealta: -3 },
    rimanda: { rancore: +2, lealta: -2 },
    differita: { se: ['rifiuta', 'rimanda'], effetto: { lealta: -3, morale: -1 }, causa: 'ha cominciato a guardarsi intorno' },
    escalation: true, livelli: [2, 4], ricorrente: true,
  },
  {
    id: 'PROMOZIONE_IMMERITATA', nome: 'Una promozione senza motivo', chiede: 'Lo promuovi lo stesso?', autore: 'dipendente', categoria: 'crescita',
    accetta: { cassa: -2, morale: -1, indulgenza: +3, produttivita: -1, lealta: +3 },
    rifiuta: { morale: -1, rancore: +1 },
    rimanda: { rancore: +1, indulgenza: +1 },
    differita: { se: ['accetta'], effetto: { morale: -2, indulgenza: +2 }, causa: 'gli altri hanno visto chi è stato promosso' },
    escalation: true, livelli: [2, 4], ricorrente: true,
  },
  {
    id: 'CAMBIO_MANSIONE', nome: 'Fare un altro lavoro', chiede: 'Lo sposti?', autore: 'dipendente', categoria: 'crescita',
    accetta: { produttivita: -2, morale: +2, lealta: +3 },
    rifiuta: { morale: -1, rancore: +1, lealta: -2 },
    rimanda: { rancore: +1 },
    differita: { se: ['accetta'], effetto: { produttivita: +3 }, causa: 'nel posto giusto rende il doppio' },
    escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'RICONOSCIMENTO', nome: 'Un grazie', chiede: 'Glielo riconosci?', autore: 'dipendente', categoria: 'crescita',
    accetta: { morale: +2, lealta: +2, indulgenza: +1 },
    rifiuta: { morale: -2, rancore: +2, lealta: -2 },
    rimanda: { rancore: +2, morale: -1 },
    differita: null,
    escalation: false, livelli: [1, 4], ricorrente: true,
  },

  /* ─── Persone contro persone ─── */
  {
    id: 'CONFLITTO_TRA_COLLEGHI', nome: 'Due che non si sopportano', chiede: 'Intervieni?', autore: 'dipendente', categoria: 'relazioni',
    accetta: { produttivita: -1, morale: +2 },
    rifiuta: { morale: -2, rancore: +2, produttivita: -1 },
    rimanda: { rancore: +2, morale: -2 },
    differita: { se: ['rifiuta', 'rimanda', 'scaduta'], effetto: { morale: -3, produttivita: -2 }, causa: 'il litigio è diventato di tutti' },
    escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'LAMENTELA_SU_COLLEGA', nome: 'Una lamentela su qualcuno', chiede: 'Prendi provvedimenti?', autore: 'dipendente', categoria: 'relazioni',
    accetta: { morale: +1, produttivita: -1, rancore: +1 },
    rifiuta: { morale: -1, rancore: +1 },
    rimanda: { rancore: +1 },
    differita: { se: ['accetta'], effetto: { morale: -1, rancore: +1 }, causa: 'chi è stato ripreso l’ha saputo' },
    escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'RICATTO_IMPLICITO', nome: 'Ho un’altra offerta', chiede: 'Rilanci per tenerlo?', autore: 'dipendente', categoria: 'potere',
    accetta: { cassa: -3, morale: +1, indulgenza: +4, lealta: +2 },
    rifiuta: { morale: -1, rancore: +2, lealta: -4 },
    rimanda: { rancore: +2, lealta: -3 },
    differita: { se: ['rifiuta', 'rimanda', 'scaduta'], effetto: { lealta: -5 }, causa: 'l’altra offerta era vera' },
    escalation: true, livelli: [2, 4], ricorrente: true,
  },
  {
    id: 'DIRITTO_DI_VETO', nome: 'Voglio contare', chiede: 'Gli dai voce in capitolo?', autore: 'dipendente', categoria: 'potere',
    accetta: { morale: +2, indulgenza: +5, produttivita: -1 },
    rifiuta: { morale: -2, rancore: +2 },
    rimanda: { rancore: +2, indulgenza: +1 },
    differita: { se: ['accetta'], effetto: { indulgenza: +3, produttivita: -2 }, causa: 'adesso decide anche su cose che non lo riguardano' },
    escalation: true, livelli: [4, 4], ricorrente: false,
  },

  /* ─── Assurdita' ─── */
  {
    id: 'RICHIESTA_ASSURDA_BASSO_COSTO', nome: 'Una stranezza che costa poco', chiede: 'Gliela concedi?', autore: 'dipendente', categoria: 'materiale',
    accetta: { cassa: -1, morale: +2, indulgenza: +2 },
    rifiuta: { morale: -1, rancore: +1 },
    rimanda: { rancore: +1 },
    differita: null,
    escalation: true, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'RICHIESTA_ASSURDA_ALTO_COSTO', nome: 'Una stranezza che costa', chiede: 'Gliela concedi?', autore: 'dipendente', categoria: 'materiale',
    accetta: { cassa: -5, morale: +2, indulgenza: +4 },
    rifiuta: { morale: -1, rancore: +1 },
    rimanda: { rancore: +1, indulgenza: +1 },
    differita: { se: ['accetta'], effetto: { indulgenza: +3, cassa: -1 }, causa: 'la voce si è sparsa' },
    escalation: true, livelli: [3, 4], ricorrente: true,
  },

  /* ═══ Gli assistant manager ═══ */
  {
    id: 'PROPOSTA_TAGLIO_COSTI', nome: 'Tagliare i costi', chiede: 'Autorizzi il taglio?', autore: 'manager', categoria: 'struttura',
    accetta: { cassa: +3, struttura: -3, morale: -5, rancore: +5, produttivita: -2, reputazione: -2 },
    rifiuta: { morale: +1 },
    rimanda: {},
    differita: { se: ['accetta'], effetto: { produttivita: -3, morale: -2, reputazione: -2 }, causa: 'il taglio si è sentito sul lavoro' },
    attendibile: 0.75, escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'PROPOSTA_TAGLIO_WELFARE', nome: 'Tagliare quello che non serve', chiede: 'Autorizzi il taglio?', autore: 'manager', categoria: 'struttura',
    accetta: { cassa: +2, struttura: -2, morale: -6, rancore: +6, reputazione: -1 },
    rifiuta: { cassa: -1, morale: +2 },
    rimanda: {},
    differita: { se: ['accetta'], effetto: { morale: -3, rancore: +3, reputazione: -2 }, causa: 'se lo ricordano ancora' },
    attendibile: 0.7, escalation: false, livelli: [2, 4], ricorrente: true,
  },
  {
    id: 'PROPOSTA_LICENZIAMENTO', nome: 'Mandare via qualcuno', chiede: 'Lo mandi via?', autore: 'manager', categoria: 'struttura',
    accetta: { cassa: +2, morale: -5, rancore: +5, produttivita: -2, reputazione: -2 },
    rifiuta: { morale: +2 },
    rimanda: { rancore: +1 },
    differita: { se: ['accetta'], effetto: { produttivita: -2, morale: -2 }, causa: 'il lavoro di chi è uscito è rimasto lì' },
    attendibile: 0.6, escalation: false, livelli: [2, 4], ricorrente: true,
  },
  {
    id: 'PROPOSTA_INVESTIMENTO', nome: 'Investire', chiede: 'Ci metti i soldi?', autore: 'manager', categoria: 'struttura',
    accetta: { cassa: -4, morale: +1 },
    rifiuta: { morale: -1 },
    rimanda: {},
    differita: { se: ['accetta'], effetto: { produttivita: +4, reputazione: +2, cassa: +3 }, causa: 'l’investimento ha reso' },
    attendibile: 0.65, escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'PROPOSTA_OUTSOURCING', nome: 'Farlo fare fuori', chiede: 'Lo dai fuori?', autore: 'manager', categoria: 'struttura',
    accetta: { cassa: +2, struttura: -4, produttivita: +1, morale: -5, rancore: +5, reputazione: -2 },
    rifiuta: { morale: +1 },
    rimanda: {},
    differita: { se: ['accetta'], effetto: { produttivita: -4, reputazione: -3 }, causa: 'il fornitore esterno ha consegnato male' },
    attendibile: 0.5, escalation: false, livelli: [2, 4], ricorrente: true,
  },
  {
    id: 'PROPOSTA_RIORGANIZZAZIONE', nome: 'Rifare l’organigramma', chiede: 'Rifai l’organigramma?', autore: 'manager', categoria: 'struttura',
    accetta: { cassa: -1, struttura: -2, produttivita: -3, morale: -2, rancore: +2 },
    rifiuta: {},
    rimanda: {},
    differita: { se: ['accetta'], effetto: { produttivita: +5 }, causa: 'la riorganizzazione ha cominciato a funzionare' },
    attendibile: 0.55, escalation: false, livelli: [2, 4], ricorrente: true,
  },
  {
    id: 'PROPOSTA_CONSULENZA', nome: 'Chiamare un consulente', chiede: 'Chiami il consulente?', autore: 'manager', categoria: 'struttura',
    accetta: { cassa: -3, struttura: +2, morale: -1 },
    rifiuta: {},
    rimanda: {},
    differita: { se: ['accetta'], effetto: { produttivita: +2 }, causa: 'la consulenza ha lasciato qualcosa' },
    attendibile: 0.45, escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'PROPOSTA_MARKETING', nome: 'Farci conoscere', chiede: 'Finanzi la campagna?', autore: 'manager', categoria: 'struttura',
    accetta: { cassa: -3, reputazione: +3 },
    rifiuta: { reputazione: -1 },
    rimanda: {},
    differita: { se: ['accetta'], effetto: { reputazione: +2, cassa: +2 }, causa: 'la campagna ha portato clienti' },
    attendibile: 0.6, escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'PROPOSTA_AUMENTO_RITMI', nome: 'Spingere di più', chiede: 'Alzi i ritmi?', autore: 'manager', categoria: 'struttura',
    accetta: { produttivita: +4, morale: -4, rancore: +4 },
    rifiuta: { morale: +1 },
    rimanda: {},
    differita: { se: ['accetta'], effetto: { produttivita: -3, morale: -2 }, causa: 'la spinta è finita, e la gente è stanca' },
    attendibile: 0.7, escalation: false, livelli: [1, 4], ricorrente: true,
  },
  {
    id: 'PROPOSTA_ASSUNZIONE', nome: 'Prendere qualcuno', chiede: 'Assumi?', autore: 'manager', categoria: 'struttura',
    accetta: { cassa: -3, struttura: +3, morale: +2, produttivita: -1 },
    rifiuta: { morale: -1, produttivita: -1 },
    rimanda: { produttivita: -1 },
    differita: { se: ['accetta'], effetto: { produttivita: +4, morale: +1 }, causa: 'chi è arrivato ha imparato il mestiere' },
    attendibile: 0.75, escalation: false, livelli: [1, 4], ricorrente: true,
  },
];

export const archetipoById = (id) => ARCHETIPI.find((a) => a.id === id) || null;

/** Gli archetipi che può portare chi è di quel tipo. */
export const archetipiDi = (autoreTipo) => ARCHETIPI.filter(
  (a) => a.autore === 'entrambi'
    || (autoreTipo === 'assistant_manager' ? a.autore === 'manager' : a.autore === 'dipendente'),
);
