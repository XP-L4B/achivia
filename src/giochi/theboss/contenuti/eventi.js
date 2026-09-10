/**
 * Gli eventi del mondo: quello che ti succede addosso mentre decidi.
 *
 * Ventidue, e non sono modificatori di numeri travestiti da racconto:
 * alcuni **cambiano le regole**. In tempo di peste lavorare da casa smette
 * di far perdere produttivita' e comincia a farne guadagnare — l'archetipo
 * e' lo stesso, il segno si capovolge — e chi rifiuta il lavoro da casa in
 * quel periodo paga due volte. E' il motivo per cui esiste `capovolge`.
 *
 * Anche qui **nessun numero**: gradini, e quanto vale un gradino sta in
 * `bilancio.js`. Le uniche eccezioni sono `ricavo` e `costi`, che sono
 * moltiplicatori e non gradini — un dazio del venti per cento e' venti per
 * cento, non "due gradini di costo".
 *
 *   colpo       quello che succede il giorno che comincia, una volta sola
 *   ogniGiorno  quello che succede ogni giorno finche' dura
 *   ricavo      moltiplicatore sul fatturato del giorno
 *   costi       moltiplicatore sui costi del giorno
 *   capovolge   gli archetipi il cui segno si rovescia mentre dura
 *   daGiorno    prima di questo giorno non puo' capitare
 *   peso        quanto e' probabile rispetto agli altri
 *   durata      fra quanti e quanti giorni dura
 *
 * Il tono e' quello del regno: la peste e' la peste dei fossi, la crisi
 * energetica e' la carestia di fuoco di drago, il riscatto informatico e'
 * uno spiritello che ha chiuso i registri. La meccanica sotto e' quella di
 * un'azienda vera, ed e' voluto: la battuta funziona solo se il problema
 * si riconosce.
 */

export const EVENTI_MONDO = [
  {
    id: 'peste', nome: 'La peste dei fossi',
    racconto: 'Il regno chiude i mercati. Chi può, lavora da casa.',
    durata: [6, 12], daGiorno: 4, peso: 3,
    ricavo: 0.82, costi: 1.0,
    ogniGiorno: { morale: -0.4 },
    capovolge: ['LAVORO_DA_CASA'],
  },
  {
    id: 'dazio', nome: 'Il dazio sui reagenti',
    racconto: 'La corona tassa tutto quello che entra dai porti. I nostri reagenti entrano dai porti.',
    durata: [8, 16], daGiorno: 6, peso: 4,
    ricavo: 1.0, costi: 1.22,
  },
  {
    id: 'conio', nome: 'Il conio svalutato',
    racconto: 'Le monete pesano come prima e valgono meno. Gli stipendi no.',
    durata: [10, 20], daGiorno: 8, peso: 3,
    ricavo: 1.05, costi: 1.18,
    ogniGiorno: { morale: -0.5 },
  },
  {
    id: 'carestia-fuoco', nome: 'Carestia di fuoco di drago',
    racconto: 'Senza fuoco non si distilla. Quello che c’è costa il triplo.',
    durata: [5, 10], daGiorno: 5, peso: 3,
    ricavo: 0.88, costi: 1.25,
  },
  {
    id: 'causa', nome: 'Una causa alla corte del regno',
    racconto: 'Un cliente sostiene che la pozione l’abbia fatto diventare viola. Aveva ragione.',
    durata: [6, 14], daGiorno: 10, peso: 3,
    colpo: { cassa: -12, reputazione: -3 },
    ricavo: 0.94, costi: 1.08,
  },
  {
    id: 'ispezione', nome: 'Gli ispettori della Gilda',
    racconto: 'Vogliono vedere i registri, le etichette e le condizioni dell’officina.',
    durata: [3, 6], daGiorno: 7, peso: 4,
    ogniGiorno: { produttivita: -0.6 },
    colpo: { reputazione: -1 },
  },
  {
    id: 'ordinanza', nome: 'Nuova ordinanza sulle etichette',
    racconto: 'Ogni fiala va rietichettata entro fine mese. Ogni fiala.',
    durata: [7, 12], daGiorno: 9, peso: 3,
    costi: 1.12, ogniGiorno: { produttivita: -0.5 },
  },
  {
    id: 'bardo', nome: 'Il bardo ha cantato di noi',
    racconto: 'Una ballata sulla nostra pozione del sonno gira in tre taverne su quattro.',
    durata: [5, 10], daGiorno: 3, peso: 3,
    ricavo: 1.2, colpo: { reputazione: +3, morale: +1 },
  },
  {
    id: 'pasquinata', nome: 'Una pasquinata sul mercato',
    racconto: 'Qualcuno ha affisso un foglio con i nostri difetti in rima. Fa ridere.',
    durata: [5, 10], daGiorno: 6, peso: 3,
    ricavo: 0.85, colpo: { reputazione: -3, morale: -1 },
  },
  {
    id: 'epidemia-raffreddore', nome: 'Tutto il regno ha il raffreddore',
    racconto: 'Le pozioni curative finiscono prima di arrivare sugli scaffali.',
    durata: [4, 9], daGiorno: 3, peso: 4,
    ricavo: 1.32, ogniGiorno: { produttivita: -0.4 },
  },
  {
    id: 'spiritello', nome: 'Uno spiritello nei registri',
    racconto: 'Ha chiuso il libro mastro con un sigillo e chiede un riscatto per riaprirlo.',
    durata: [3, 7], daGiorno: 12, peso: 2,
    colpo: { cassa: -16 }, ricavo: 0.8,
    ogniGiorno: { produttivita: -0.8 },
  },
  {
    id: 'registro-perso', nome: 'Il libro mastro ha perso le scritture',
    racconto: 'Tre settimane di conti svaniti. L’inchiostro era di quello economico.',
    durata: [2, 5], daGiorno: 8, peso: 3,
    ogniGiorno: { produttivita: -1.0, morale: -0.4 },
  },
  {
    id: 'concorrente', nome: 'L’Alchimia Meridionale',
    racconto: 'Offrono il venti per cento in più a chiunque dei nostri risponda al richiamo.',
    durata: [8, 16], daGiorno: 12, peso: 4,
    ogniGiorno: { morale: -0.5 },
    perdeGente: 0.10,
  },
  {
    id: 'fornitore-sparito', nome: 'Il fornitore di radici è sparito',
    racconto: 'Con l’anticipo. Le radici si trovano altrove, al doppio.',
    durata: [5, 10], daGiorno: 6, peso: 3,
    colpo: { cassa: -8 }, costi: 1.16,
  },
  {
    id: 'commessa-grossa', nome: 'Una commessa dalla capitale',
    racconto: 'Vogliono seicento fiale in due settimane. Pagano bene e non aspettano.',
    durata: [6, 12], daGiorno: 5, peso: 3,
    ricavo: 1.28, ogniGiorno: { morale: -0.6, produttivita: -0.3 },
  },
  {
    id: 'furto-magazzino', nome: 'Il magazzino è stato visitato',
    racconto: 'Mancano due casse di essenze e nessuno ha visto niente.',
    durata: [2, 4], daGiorno: 9, peso: 3,
    colpo: { cassa: -12, morale: -2, rancore: +1 },
  },
  {
    id: 'gilda-sciopero', nome: 'La Gilda dei corrieri incrocia le braccia',
    racconto: 'Nessuno porta niente da nessuna parte, e i clienti aspettano.',
    durata: [3, 8], daGiorno: 11, peso: 3,
    ricavo: 0.78,
  },
  {
    id: 'benedizione', nome: 'La benedizione del tempio',
    racconto: 'Il tempio ci ha indicati come fornitori. Nessuno sa perché, e non lo chiediamo.',
    durata: [7, 14], daGiorno: 8, peso: 2,
    ricavo: 1.15, colpo: { reputazione: +4 },
  },
  {
    id: 'crollo-tetto', nome: 'Il tetto dell’officina',
    racconto: 'Ha ceduto sopra il banco tre. Fortuna che era notte.',
    durata: [4, 8], daGiorno: 10, peso: 2,
    colpo: { cassa: -16, produttivita: -3 },
    ogniGiorno: { produttivita: -0.4 },
  },
  {
    id: 'moda-amuleti', nome: 'La moda degli amuleti',
    racconto: 'Nessuno vuole più pozioni: vogliono tutti amuleti, che noi non facciamo.',
    durata: [8, 15], daGiorno: 14, peso: 3,
    ricavo: 0.8, ogniGiorno: { morale: -0.3 },
  },
  {
    id: 'apprendisti', nome: 'La leva degli apprendisti',
    racconto: 'La scuola di alchimia manda tre ragazzi a fare pratica. Gratis, e si vede.',
    durata: [6, 12], daGiorno: 7, peso: 3,
    costi: 0.94, ogniGiorno: { produttivita: -0.3, morale: +0.3 },
  },
  {
    id: 'inverno-lungo', nome: 'Un inverno che non finisce',
    racconto: 'Si scalda l’officina o si distilla: il fuoco non basta per tutt’e due.',
    durata: [10, 18], daGiorno: 15, peso: 3,
    costi: 1.14, ricavo: 0.92, ogniGiorno: { morale: -0.3 },
  },
];

export const eventoById = (id) => EVENTI_MONDO.find((e) => e.id === id) || null;
