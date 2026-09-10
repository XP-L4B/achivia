/**
 * The Climb: tutti i numeri, in un posto solo.
 *
 * Vale la regola di The Boss, e vale piu' forte qui perche' il gioco e' piu'
 * grande: **nessun numero di bilanciamento sta altrove**. Non nel motore,
 * non negli eventi, non nelle aziende, non nei background. Quei file dicono
 * *che cosa* succede; quanto, lo dice questo. Ribilanciare vuol dire
 * cambiare una riga qui e rilanciare `npm run climb:sim`.
 *
 * Le grandezze del gioco:
 *
 *  - il **Tempo** di una settimana sono cento punti, e si spendono;
 *  - l'**Energia** e' quella che salute e sonno permettono, e si puo'
 *    sforare a debito;
 *  - le **statistiche** vanno da 0 a 100, tranne i soldi;
 *  - le **competenze** vanno da 0 a 100 e crescono a rendimenti
 *    decrescenti: da 0 a 40 in fretta, da 80 a 100 quasi mai.
 */

/* ─── La partita ─── */

export const PARTITA = {
  /** Da qui in su la partita e' lunga abbastanza da valere: dodici anni. */
  settimaneMassime: 624,
  settimanePerMese: 4,
  settimanePerTrimestre: 13,
  settimanePerAnno: 52,
  etaIniziale: 19,
};

/* ─── Il tempo e l'energia ─── */

export const TEMPO = {
  /** I punti di una settimana. Le attivita' li consumano. */
  settimana: 100,
  /** Un'unita' di attivita': ogni effetto e' scritto per dieci punti. */
  unita: 10,
};

/**
 * L'energia della settimana viene da salute e sonno, e non e' un numero
 * fisso: un corpo a pezzi e tre notti in bianco la dimezzano. Chi spende
 * piu' energia di quella che ha la prende in prestito dalla salute e dal
 * sonno — funziona, e si paga dopo.
 */
export const ENERGIA = {
  base: 100,
  /** Quanto pesa la salute: a salute 50 si ha il 70% dell'energia. */
  esponenteSalute: 0.5,
  /** Quanto pesa il debito di sonno: a sonno 50 si ha il 65% dell'energia. */
  esponenteSonno: 0.6,
  /** Ogni punto di energia sforato costa questo in salute e in sonno.
      Il sonno paga piu' della salute, e paga piu' di quanto una settimana
      recuperi da sola (`DERIVA.sonnoRecupero`): se no uno sforo moderato
      non lascerebbe traccia, e il prestito non sarebbe un prestito. */
  debitoSalute: 0.2,
  debitoSonno: 0.6,
};

/* ─── Il corpo e la mente: dove si parte, e dove si muore ─── */

export const PARTENZA = {
  salute: 80,
  sonno: 10,
  stress: 15,
  felicita: 60,
  relazioni: 50,
  rete: 5,
  reputazione: 30,
  integrita: 70,
  sospetto: 0,
  noia: 0,
};

/**
 * Quello che succede da solo, ogni settimana, senza fare niente. Lo stress
 * scende un po' e il sonno si recupera un po': sono i «basta non fare
 * niente di sbagliato» del gioco, e sono piccoli apposta.
 */
export const DERIVA = {
  stressSfiato: 2.0,
  sonnoRecupero: 4.0,
  saluteEta: -0.04,          // un decimo di punto al mese: l'eta' si sente, piano
  /** Il corpo si ripara da solo, piano, verso il suo punto di riposo — ma
      solo finche' lo stress e' sotto i segnali: oltre, e' il corpo a pagare. */
  saluteRiposo: 75,
  saluteVersoRiposo: 0.02,
  saluteSottoStress: 0.6,    // punti di salute persi a settimana con lo stress oltre i segnali
  felicitaVersoNeutro: 0.03, // la felicita' torna verso il suo punto di riposo
  felicitaRiposo: 55,
  relazioniSfiato: 0.6,      // le relazioni non curate si allentano
  reteSfiato: 0.3,           // i contatti non frequentati si raffreddano
};

/**
 * Lo stress sale da solo quando la vita e' storta. Non sono decisioni: sono
 * condizioni, e finche' durano pesano ogni settimana.
 */
export const STRESS = {
  perSonnoAlto: 0.08,        // per ogni punto di sonno sopra la soglia
  sogliaSonno: 40,
  perSoldiSottoZero: 3.0,    // essere in rosso e' una tassa fissa sullo stress
  perIsolamento: 1.5,        // relazioni sotto la soglia
  sogliaIsolamento: 30,
  perLavoroSenzaSenso: 1.5,  // un lavoro con cultura pessima
  sogliaCultura: 3,
  /** Da qui si vedono i segnali; da qui crolla la resa; qui e' il crollo. */
  segnali: 60,
  crollo: 80,
  burnout: 100,
  /** Sopra `crollo` la performance perde questa frazione a settimana. */
  perditaPerformance: 0.06,
  /** La felicita' rallenta o accelera lo stress: a 100 lo dimezza, a 0 lo raddoppia. */
  spintaFelicita: 0.5,
};

/**
 * La noia: il contrario dello stress, e finisce nello stesso posto.
 *
 * Un lavoro ripetitivo e senza senso non logora solo per lo stress che
 * porta: svuota. Ogni lavoro ha i suoi gradini di noia a settimana (in
 * `SOPRAVVIVENZA`, e dalla fase tre nelle aziende), e la noia cresce ancora
 * quando si resta a lungo allo stesso livello senza imparare niente. La si
 * scarica facendo cose che hanno un senso — progetti, studio, ozio,
 * volontariato — o cambiando lavoro. A cento e' il **bore-out**: la fine
 * di chi si e' spento, non di chi e' scoppiato.
 */
export const NOIA = {
  sfiato: 1.5,               // quanto scende da sola ogni settimana
  /** Dopo tante settimane allo stesso livello, ogni settimana in piu' aggiunge questo. */
  assuefazioneDa: 26,
  perSettimanaOltre: 0.03,
  perAnzianitaMassimo: 1.5,
  /** Da qui si vedono i segnali, da qui la resa cala, qui e' la fine. */
  segnali: 60,
  crollo: 80,
  boreOut: 100,
  perditaFelicita: 0.6,      // felicita' persa a settimana oltre i segnali
  perditaPerformance: 0.04,  // frazione di performance persa a settimana oltre il crollo
  stressOltreCrollo: 1.0,    // e la noia oltre il crollo pesa anche sullo stress
  /** Cambiare lavoro non azzera la noia: ne lascia questa parte. */
  cambioLavoro: 0.5,
  /** Una promozione e' un lavoro nuovo a meta': ne lascia questa parte. */
  promozione: 0.6,
};

/* ─── I soldi ─── */

export const SOLDI = {
  /** Interesse settimanale sul debito: e' caro apposta. */
  interesseSettimanale: 0.012,
  /** Sotto questa cifra, per tante settimane, senza rete: crollo. */
  sogliaCollasso: -6000,
  settimaneCollasso: 8,
};

/* ─── Le competenze ─── */

/**
 * Come cresce una competenza. La spinta e' quella dell'attivita'; poi si
 * moltiplica per quanto manca al cento, elevato a un esponente:
 *
 *   crescita = spinta × ((100 − valore) / 100) ^ esponente
 *
 * Con 1,5: a 0 si prende tutta la spinta, a 40 meno della meta', a 80 un
 * undicesimo, a 95 quasi niente. Da 80 a 100 si arriva con l'esperienza
 * vera, non con i corsi — e infatti le attivita' «sul campo» hanno un
 * esponente piu' dolce.
 */
export const CRESCITA = {
  esponenteStudio: 1.5,
  esponenteCampo: 1.1,
  /** Le competenze non usate si arrugginiscono, piano. */
  ruggineSettimanale: 0.05,
  ruggineSotto: 20,          // sotto questo valore non si arrugginisce
};

/* ─── Il lavoro ─── */

export const LAVORO = {
  /** La performance si muove ogni settimana verso quella che le competenze e le ore sostengono. */
  velocitaPerformance: 0.15,
  /** Quanto pesa l'adeguatezza delle competenze contro le ore fatte. */
  pesoCompetenze: 0.6,
  /** La visibilita' si raffredda se non la si coltiva. */
  visibilitaSfiato: 0.6,
  /** Ma una performance alta si nota da sola: per ogni dieci punti sopra sessanta. */
  visibilitaDaPerformance: 0.8,
  /** Quanto si impara sul campo dipende dal posto: `formazione` conta, un buon capo raddoppia quasi. */
  crescitaPerFormazione: 0.1,   // × formazione, sommato a 0.5
  crescitaBuonCapo: 1.4,
  managementBuono: 7,
  managementCattivo: 3,
  stressCattivoCapo: 1.0,
  /** Ore base di chi ha un lavoro, in punti di tempo. */
  oreBase: 40,
};

/* ─── Le condizioni di fine, quelle nude ─── */

/**
 * Le tre fini che il motore deve saper dichiarare da subito, perche' senza
 * una fine il simulatore non si ferma. Il *racconto* di ognuna — la
 * schermata, l'epilogo, il «non e' colpa tua» del burnout — arriva nella
 * fase sei; qui c'e' solo la condizione.
 */
export const FINE = {
  burnout: { stress: 100 },
  boreOut: { noia: 100 },
  crolloFisico: { salute: 0 },
  crolloEconomico: { soldi: SOLDI.sogliaCollasso, settimane: SOLDI.settimaneCollasso },
};

/* ═══ Le aziende strutturate, in numeri ═══ */

/**
 * Lo stipendio al mese per livello, a paga 1,0. Ogni azienda lo moltiplica
 * per la sua `paga`: e' cosi' che la stessa scala vale per il piccolo
 * studio e per la finanza, e che «+40% di stipendio» e' un numero.
 */
export const STIPENDIO_LIVELLO = [1100, 1500, 2100, 2700, 3400, 4300, 5600, 7500, 10000, 14000, 22000];

/**
 * Gli attributi di ogni azienda, da 1 a 10 dove non e' detto altro. Chi
 * sono e che cosa dicono di se' sta in `aziende.js`.
 *
 *   paga        moltiplicatore sullo stipendio di livello
 *   ore         punti di tempo che il lavoro pretende a settimana
 *   prestigio   quanto vale sul curriculum: apre le porte dopo
 *   cultura     quanto e' sano lavorarci (sotto `STRESS.sogliaCultura` logora)
 *   management  la qualita' dei capi: sopra 7 si cresce di piu', sotto 4 si soffre
 *   formazione  quanto si impara stando li'
 *   equilibrio  vita e lavoro
 *   stabilita   quanto e' difficile perdere il posto
 *   stress      gradini di stress a settimana per il solo fatto di starci
 *   noia        gradini di noia a settimana
 *   entrata     a che livelli assume [dal, al]
 *   tetto       il livello piu' alto che si puo' raggiungere li' dentro
 *   titolo      la credenziale minima per passare il filtro del curriculum
 *               (vedi `PERCORSO.*.credenziale`); si aggira con la rete o
 *               con il portfolio
 *   posti       quanto spesso si apre un posto sopra: la probabilita' che
 *               a una valutazione con tutte le carte in regola ci sia
 *               davvero un posto
 *   difficile   la porta stretta: quanto si toglie alla probabilita' di
 *               passare il colloquio
 */
export const AZIENDA = {
  pixelia:  { paga: 0.75, ore: 40, prestigio: 3,  cultura: 8, management: 7, formazione: 6, equilibrio: 8, stabilita: 5, stress: 0, noia: 0, entrata: [0, 2], tetto: 3,  titolo: 0,    posti: 0.5,  difficile: 0 },
  bytefarm: { paga: 1.0,  ore: 52, prestigio: 4,  cultura: 6, management: 4, formazione: 9, equilibrio: 3, stabilita: 2, stress: 2, noia: 0, entrata: [0, 3], tetto: 4,  titolo: 0,    posti: 0.7,  difficile: 0 },
  cartesio: { paga: 0.9,  ore: 40, prestigio: 2,  cultura: 7, management: 5, formazione: 2, equilibrio: 9, stabilita: 8, stress: 0, noia: 2, entrata: [0, 2], tetto: 2,  titolo: 0,    posti: 0.2,  difficile: 0 },
  meridian: { paga: 1.5,  ore: 70, prestigio: 9,  cultura: 4, management: 6, formazione: 8, equilibrio: 1, stabilita: 6, stress: 3, noia: 0, entrata: [1, 5], tetto: 7,  titolo: 1,    posti: 0.8,  difficile: 0.1 },
  volturno: { paga: 2.0,  ore: 60, prestigio: 8,  cultura: 2, management: 2, formazione: 5, equilibrio: 2, stabilita: 5, stress: 3, noia: 0, entrata: [1, 6], tetto: 8,  titolo: 1,    posti: 0.6,  difficile: 0.1 },
  helvex:   { paga: 1.1,  ore: 40, prestigio: 6,  cultura: 7, management: 6, formazione: 4, equilibrio: 8, stabilita: 9, stress: 0, noia: 2, entrata: [1, 5], tetto: 7,  titolo: 0.5,  posti: 0.25, difficile: 0 },
  aurelia:  { paga: 1.3,  ore: 48, prestigio: 8,  cultura: 4, management: 5, formazione: 5, equilibrio: 5, stabilita: 7, stress: 2, noia: 1, entrata: [2, 7], tetto: 9,  titolo: 1,    posti: 0.5,  difficile: 0.1 },
  kaleido:  { paga: 1.2,  ore: 45, prestigio: 8,  cultura: 9, management: 8, formazione: 9, equilibrio: 6, stabilita: 6, stress: 1, noia: 0, entrata: [2, 7], tetto: 9,  titolo: 0,    posti: 0.5,  difficile: 0.3 },
  orion:    { paga: 1.6,  ore: 48, prestigio: 8,  cultura: 6, management: 5, formazione: 7, equilibrio: 5, stabilita: 3, stress: 2, noia: 0, entrata: [2, 8], tetto: 9,  titolo: 0.5,  posti: 0.6,  difficile: 0.1 },
  achivia:  { paga: 1.8,  ore: 50, prestigio: 10, cultura: 8, management: 8, formazione: 8, equilibrio: 6, stabilita: 8, stress: 1, noia: 0, entrata: [5, 9], tetto: 10, titolo: 0,    posti: 0.4,  difficile: 0.2 },
};

/** Per entrare in ACHIVIA SPA non basta il colloquio. */
export const ACHIVIA_RICHIEDE = { reputazione: 70, rete: 60, soft: 65, sponsor: true };

/* ─── I colloqui ─── */

/**
 * Cercare lavoro accumula `ricerca` (l'attivita' «Cercare lavoro»); un
 * colloquio ne spende. Il colloquio e' un tiro del caso — dal seme — la
 * cui probabilita' viene da quello che il candidato porta.
 */
export const COLLOQUIO = {
  costo: 2,                  // unita' di ricerca per un colloquio
  /** Il filtro del curriculum si aggira: con una rete cosi', o con un portfolio cosi'. */
  reteAggiraTitolo: 40,
  portfolioAggiraTitolo: 30,
  /** La probabilita' di base e quanto aggiunge ogni carta in regola. */
  base: 0.15,
  perCarta: 0.15,
  /** Quanto si puo' stare sotto la richiesta di livello ed essere presi lo stesso. */
  tolleranza: 6,
  /** Un'azienda che ha detto di no non richiama prima di tante settimane. */
  memoriaRifiuto: 26,
  /** Un'offerta aspetta tante settimane, poi decade. */
  scadenzaOfferta: 4,
  /** Dopo tante settimane dentro si vede com'e' davvero. */
  scoperta: 8,
};

/* ─── Le promozioni ─── */

/**
 * Che cosa serve per salire di un gradino. L'indice e' il livello **a cui
 * si sale**: `richiesta[3]` e' quello che serve per diventare Team Lead.
 *
 * `richiesta` e' il punteggio delle competenze pesate per fascia (vedi
 * `PESO_PER_LIVELLO`): meta' migliore delle hard e meta' migliore delle
 * soft, pesate. Chi ha solo hard, dalla fascia media in su, non ci arriva:
 * e' il muro.
 */
export const PROMOZIONE = {
  ogniSettimane: 13,
  performanceMinima: 65,
  richiesta:  [12, 25, 36, 46, 50, 57, 64, 70, 76, 82, 88],
  /* dalla fascia alta in su la visibilita' richiesta scende invece di
     salire: a quei livelli si e' visibili per forza, e chi ci arriva senza
     ore per il networking — chi parte dal basso — non deve pagare due volte */
  visibilita: [0,  10, 20, 30, 35, 40, 45, 50, 40, 45, 50],
  /* la somma dei minimi e' 249 settimane: meno di cinque anni su dodici
     senza mai una valutazione storta. La cima resta rara per i posti
     (`postiInCima`), lo sponsor e il consiglio, non per l'orologio */
  anzianita:  [0,  13, 26, 26, 39, 20, 20, 20, 20, 26, 39],
  reputazione: { basso: 0, medio: 30, alto: 50, altissimo: 55 },
  /** Le soft che da sole chiudono la porta, per fascia del livello a cui si sale. */
  sogliaLeadership: { alto: 60, altissimo: 65 },
  sogliaPolitica: { altissimo: 55 },
  /** Un buon capo apre porte; uno cattivo le chiude. Moltiplica `posti`. */
  perManagement: 0.05,       // per punto di management sopra o sotto il cinque
  /** Si perde il posto: sotto questa performance per due valutazioni di fila. */
  performanceLicenziamento: 30,
  /** E per riorganizzazione: la probabilita' a trimestre e' (10 − stabilita') × questo. */
  riorganizzazione: 0.015,
  /** L'esperienza viaggia: chi entra a un livello che ha gia' fatto porta
      con se' questa quota delle settimane passate a quel livello. Senza,
      ogni cambio di posto azzerava l'orologio, e chi cambia piu' spesso —
      chi parte dal basso, che molla quando lo stress lo brucia — non
      arrivava mai a maturare niente. */
  esperienzaPortata: 0.5,
  /** In cima i posti sono pochi: la probabilita' che se ne apra uno, ai
      livelli scritti qui, si moltiplica per questo. Un VP se ne va di rado,
      un CEO quasi mai — ed e' quello che tiene la vittoria rara per tutti
      nello stesso modo, senza chiudere la porta a nessuno. */
  postiInCima: { 9: 0.3, 10: 0.08 },
};

/* ─── Le persone ─── */

/**
 * Chi si incontra e quanto pesa. Le probabilita' sono per settimana o per
 * trimestre, dette una per una. Gli archetipi sono in `persone.js`.
 */
export const PERSONE = {
  /** Da chi si parte: il contatto di famiglia, per chi ce l'ha (`contattiIniziali`). */
  contatti: {
    famiglia_alto:  { archetipo: 'sponsor', potere: 7, fiducia: 55 },
    famiglia_medio: { archetipo: 'sponsor', potere: 4, fiducia: 45 },
  },
  /** Il capo che si trova entrando: dipende dalla qualita' dei capi dell'azienda. */
  capo: { eccellenteDaManagement: 7, tossicoFinoAManagement: 3, eccellenteAltrimenti: 0.15, tossicoAltrimenti: 0.25, eccellenteSeBuono: 0.7, tossicoSeCattivo: 0.8 },
  /** Il collega: in una cultura bassa e' piu' facile che sia il manipolatore. */
  collega: { culturaBassa: 4, manipolatoreSeBassa: 0.6, manipolatoreAltrimenti: 0.2, alleatoAltrimenti: 0.6 },
  /** Il mentore si incontra fuori: facendo rete o volontariato. */
  mentore: { probabilitaSettimanale: 0.05, unitaMinime: 1, soft: ['leadership', 'pensiero_critico'], crescitaPassiva: 0.6, gradiniConsiglio: 2, ogniSettimane: 4 },
  sponsor: { fiduciaPerSponsor: 60, fiduciaPerPerdere: 40, daPerformance: 0.05, daVisibilita: 0.01, ogniSettimane: 8, proponiVisibilita: 6, proponiFiducia: 12, proponiPenale: 8, performanceMinima: 65 },
  tossico: { stress: 1.5, felicita: 1.0, visibilita: 0.5, performance: 0.4, svelaDopo: 4, dossierStress: 0.5, hrBase: 0.2, hrPerDossier: 0.06, hrPerCultura: 0.04, hrReputazioneSeVa: 3, hrReputazioneSeNo: 4, hrStressSeNo: 6, appelloBase: 0.7, appelloPenale: 10, rappresaglia: 1.5 },
  manipolatore: { reputazione: 0.3, visibilita: 0.3, sogliaPolitica: 35, svelaComunqueDopo: 40, confrontaBase: 0.3, confrontaPerPolitica: 0.005, confrontaPerComunicazione: 0.005, confrontaReputazioneSeNo: 5, evitaQuota: 0.5 },
  alleato: { fiduciaConRelazioni: 0.3, fiduciaPerAiuto: 60, aiutaStress: 1, aiutaFiducia: 15, chiediPerformance: 5, ogniSettimane: 8 },
  capoEccellente: { visibilita: 0.4, fiducia: 0.5 },
  /** Tutti: la fiducia si raffredda; ogni trimestre qualcuno sale o cambia aria. */
  sfiatoFiducia: 0.2,
  trimestre: { salePotere: 0.15, cambiaAzienda: 0.06 },
  /** Il passato che torna: al colloquio, chi ti ricorda pesa cosi'. */
  passato: { torto: -0.15, tortoMassimo: -0.45, aiuto: 0.15, potereMinimo: 5 },
  /** Le scorrettezze con le persone: il vantaggio subito, il conto dopo. */
  rubaMerito: { performance: 6, visibilita: 5, integrita: 6, sospetto: 8, fiducia: 40, peso: 3 },
  scaricaColpa: { stress: 5, performance: 3, integrita: 5, sospetto: 6, fiducia: 30, peso: 2 },
};

/* ─── Gli eventi ─── */

/**
 * Quanti e quando. Da zero a due a settimana: prima si tira per il primo,
 * poi per il secondo. Le prime settimane sono di respiro. Un evento che si
 * ripete non torna prima di tante settimane.
 */
export const EVENTI = {
  probabilitaPrimo: 0.30,
  probabilitaSecondo: 0.08,
  respiro: 3,
  ripetiDopo: 26,
  /** Una porta chiusa scatta con questo peso: si deve vedere, non ogni settimana. */
  pesoPortaChiusa: 0.3,
  /** Le occasioni chiamano chi le prende, e smettono di chiamare chi le lascia:
      ogni occasione lasciata cadere toglie questo al peso delle prossime (fino
      a tante), ogni salto fatto aggiunge questo. Essere prudenti costa. */
  perOccasioneLasciata: 0.15,
  occasioniLasciateMassime: 4,
  perSaltoFatto: 0.08,
  saltiMassimi: 4,
};

/* ─── L'etica: quando esplode ─── */

/**
 * Il sospetto e' nascosto e sale con ogni scorrettezza; la probabilita'
 * che qualcosa esploda, ogni settimana, e' sospetto × visibilita': chi
 * bara e resta piccolo la passa liscia, chi bara e sale viene scoperto.
 * Tre gradi, a seconda di quanto sospetto c'e' quando esplode.
 */
export const ETICA = {
  /** La probabilita' a settimana: base × (sospetto/100)² × (visibilitaMinima + visibilita'/100).
      Il quadrato e' il punto: poco sospetto in basso e' quasi niente, molto
      sospetto in alto e' quasi certo. */
  esplosioneBase: 0.08,
  visibilitaMinima: 0.02,
  /** Il sospetto si raffredda da solo, piano, se non si aggiunge altro: una
      scorciatoia ogni tanto, in basso, la si fa passare; tante di fila no. */
  sfiatoSospetto: 0.5,
  /** I tre gradi: sotto il primo e' una voce, sotto il secondo uno scandalo, sopra la fine.
      E sotto questo livello e' sempre e solo una voce: di uno stagista che
      bara non si occupa nessuno — chi bara e resta piccolo la passa liscia. */
  voce: 35,
  scandalo: 70,
  scandaloDaLivello: 3,
  /** La voce: quello che costa. */
  voceReputazione: 6, voceVisibilita: 4, voceSospetto: 12,
  /** Lo scandalo: si perde il posto, e resta la macchia. */
  scandaloReputazione: 20, scandaloSospetto: 35, scandaloSoldi: -6000,
  /** Da questo livello in su lo scandalo grosso chiude la partita; sotto, e' una causa. */
  fineDaLivello: 4,
  causaSoldi: -15000,
  /** La macchia dura tanto (settimane); da questo livello in su, per sempre. */
  macchiaDura: 208, macchiaPerSempreDa: 6,
  /** Sotto questa integrita' ACHIVIA non ti fa CEO. Il giocatore lo scopre li'. */
  integritaPerAchivia: 30,
  /** La riparazione: lenta con le cose buone, un salto con la confessione. */
  integritaPerVolontariato: 0.15, integritaPerRelazioni: 0.05, integritaTetto: 70,
  confessaReputazione: 8, confessaSospetto: 40, confessaIntegrita: 8, confessaOgni: 52,
};

/* ─── Come finisce ─── */

/**
 * I finali che non sono sconfitte: fermarsi, mollare, l'impresa, e la
 * cima — piena o vuota. E il consiglio di amministrazione, che chiede.
 */
export const FINALI = {
  fermarsiDaSettimana: 104, fermarsiDaLivello: 2,
  mollareDaSettimana: 52,
  /** La cima e' vuota se si arriva senza le persone, o senza salute. */
  vuotaRelazioni: 35, vuotaSalute: 40, vuotaFelicita: 35,
  /** Il consiglio: quello che chiede oltre alle carte della promozione. */
  consiglioReputazione: 85, consiglioSoft: 75,
  /** Le decisioni che hanno pesato: quante, e su quante settimane si misura il dopo. */
  decisioni: 5, finestra: 8,
  /** L'impresa: ogni trimestre puo' chiudere; il capitale in cassa la tiene in piedi.
      La probabilita' e' base − perDiecimila × (migliaia di euro / 10), mai sotto il minimo.
      E ACHIVIA la guarda solo dopo che ha retto tante settimane. */
  impresaChiudeBase: 0.22, impresaPerDiecimila: 0.03, impresaChiudeMinimo: 0.04, impresaChiudeSoldi: -5000,
  impresaRettaDa: 104,
};

/* ═══ Il passo: quanto vale un gradino ═══ */

/**
 * Le attivita', gli eventi e le persone parlano per **gradini**: `{ stress: +2,
 * relazioni: -1 }`. Quanto sia un gradino si decide qui, e solo qui. E' la
 * stessa difesa di The Boss: un file di contenuti che non puo' scrivere un
 * numero non puo' sbilanciare il gioco di nascosto.
 *
 * I gradini delle attivita' sono per unita' di tempo (dieci punti).
 */
export const PASSO = {
  salute: 1.0,
  sonno: 1.5,
  stress: 1.2,
  felicita: 1.0,
  relazioni: 1.2,
  rete: 0.8,
  reputazione: 0.6,
  integrita: 1.0,
  sospetto: 1.0,
  performance: 1.5,
  visibilita: 1.2,
  noia: 1.0,
  soldi: 40,          // un gradino di soldi sono quaranta euro
  /* La spinta di un gradino su una competenza, prima dei rendimenti
     decrescenti. Era 2,2 e portava una competenza da dieci a cinquanta in
     otto settimane: una vita, non una stagione. A 0,3 un'unita' di studio
     a settimana rende circa un punto, e da dieci a cinquanta ci vuole
     un anno buono — che e' il tempo che ci vuole. */
  competenza: 0.3,
};

/* ═══ I punti di partenza, in numeri ═══ */

/**
 * Le cinque vite, in cifre. Le identita', gli obblighi e le porte chiuse
 * stanno in `background.js`; qui c'e' quanto pesano.
 *
 *   soldi          quello che si ha in tasca alla prima settimana
 *   affitto        al mese; zero vuol dire che non si paga
 *   spese          al mese, fisse: mangiare, bollette, trasporti
 *   tempo          i punti di una settimana; sotto cento vuol dire che una
 *                  parte della vita e' gia' presa (pendolare, la casa, chi
 *                  ha bisogno di te). Per «nessuna rete» sono settantaquattro,
 *                  e quaranta se li prende il lavoro: ne restano trentaquattro
 *                  per studiare, dormire e tutto il resto. Era ottantaquattro
 *                  e con quei dieci in piu' la vita piu' dura del gioco era
 *                  una vita comoda: dodici anni a stress zero.
 *   reteSicurezza  la frazione di una catastrofe finanziaria che qualcuno
 *                  assorbe al posto tuo: 1 e' «papa' paga», 0 e' «nessuno»
 *   rete           i contatti con cui si parte
 *   rimesse        al mese, da mandare a casa
 */
export const BACKGROUND = {
  erede:      { soldi: 90000, affitto: 0,    spese: 300, tempo: 100, reteSicurezza: 1.0, rete: 45, rimesse: 0,   moltiplicatore: 0.70 },
  benestante: { soldi: 14000, affitto: 0,    spese: 350, tempo: 100, reteSicurezza: 0.6, rete: 18, rimesse: 0,   moltiplicatore: 0.85 },
  ceto_medio: { soldi: 2500,  affitto: 450,  spese: 450, tempo: 100, reteSicurezza: 0.25, rete: 5, rimesse: 0,   moltiplicatore: 1.00 },
  operaia:    { soldi: 600,   affitto: 380,  spese: 480, tempo: 82,  reteSicurezza: 0.05, rete: 2, rimesse: 120, moltiplicatore: 1.30 },
  nessuna:    { soldi: 150,   affitto: 420,  spese: 620, tempo: 74,  reteSicurezza: 0.0, rete: 0,  rimesse: 0,   moltiplicatore: 1.65 },
};

/* ═══ I percorsi, in numeri ═══ */

/**
 * Che cosa costa e che cosa rende ogni strada. La forma delle strade e'
 * in `percorsi.js`.
 *
 *   costoMese     quanto si paga al mese finche' si e' dentro
 *   durata        settimane per finire (zero: non finisce, e' un modo di vivere)
 *   spintaStudio  quanto rende un'unita' di studio, in gradini di competenza
 *   credenziale   quanto vale il titolo agli occhi di chi filtra i CV (0..1)
 *   reteCompagni  gradini di rete per trimestre passato dentro
 */
export const PERCORSO = {
  universita:  { costoMese: 320, durata: 156, spintaStudio: 1.0, credenziale: 1.0, reteCompagni: 2, energiaStudio: 1.0 },
  its:         { costoMese: 90,  durata: 78,  spintaStudio: 1.2, credenziale: 0.55, reteCompagni: 1, energiaStudio: 1.0 },
  autodidatta: { costoMese: 20,  durata: 0,   spintaStudio: 0.9, credenziale: 0.15, reteCompagni: 0, energiaStudio: 1.5 },
  lavoro:      { costoMese: 0,   durata: 0,   spintaStudio: 0.5, credenziale: 0.25, reteCompagni: 0, energiaStudio: 1.0 },
  impresa:     { costoMese: 150, durata: 0,   spintaStudio: 0.6, credenziale: 0.3, reteCompagni: 1, energiaStudio: 1.3 },
};

/* ═══ I lavori di sopravvivenza, in numeri ═══ */

/**
 * I quattro lavori con cui si comincia dal basso. Nella fase tre arrivano
 * le aziende strutturate, con i loro attributi nascosti; questi servono da subito
 * perche' senza uno stipendio il giro dei soldi non gira.
 *
 *   stipendio  al mese, netto
 *   ore        punti di tempo obbligatori a settimana
 *   cultura    da 1 a 10: sotto `STRESS.sogliaCultura` logora
 *   stress     gradini di stress a settimana, per il solo fatto di starci
 *   noia       gradini di noia a settimana: quanto e' ripetitivo
 */
export const SOPRAVVIVENZA = {
  bar:         { stipendio: 980,  ore: 40, cultura: 5, management: 5, formazione: 2, stabilita: 6, stress: 1, noia: 1 },
  magazzino:   { stipendio: 1080, ore: 44, cultura: 4, management: 4, formazione: 2, stabilita: 6, stress: 2, noia: 2 },
  callcenter:  { stipendio: 900,  ore: 40, cultura: 2, management: 4, formazione: 3, stabilita: 5, stress: 3, noia: 3 },
  negozio:     { stipendio: 1000, ore: 42, cultura: 5, management: 5, formazione: 2, stabilita: 6, stress: 1, noia: 1 },
};
/* Le spese di «nessuna rete» sono millequaranta al mese: solo il
   magazzino le copre, gli altri tre no. E' voluto — un lavoro di
   sopravvivenza tiene in piedi, non fa mettere via, e chi parte da li'
   deve fare i lavoretti per non affondare — e vuol dire che il primo
   imprevisto (fase cinque) e' una spirale. */
