/**
 * Le cinque strade. Nessuna e' *la* strada.
 *
 * Tutte devono poter arrivare in cima, con difficolta' simili e colli di
 * bottiglia diversi. Quanto costano e quanto rendono sta in `bilancio.js`
 * (`PERCORSO`); qui c'e' che cosa insegnano e che cosa dicono al giocatore.
 *
 *   insegna    le competenze che un'unita' di studio fa crescere
 *   spiega     la scheda che si legge scegliendo: che cosa da' davvero e
 *              che cosa costa, in parole semplici
 */
export const PERCORSI = [
  {
    id: 'universita',
    nome: 'Università',
    insegna: { analisi_dati: +1, finanza: +1, diritto: +1, settore: +1 },
    spiega: 'Costa molti soldi e moltissimo tempo. Dà competenze solide, un titolo che apre i processi di selezione delle aziende strutturate, e — soprattutto — compagni di corso che fra dieci anni saranno manager. Il rischio: uscirne a venticinque anni con un debito e zero esperienza.',
  },
  {
    id: 'its',
    nome: 'ITS / formazione tecnica',
    insegna: { tecnologia: +2, settore: +2 },
    spiega: 'Veloce, economico, competenze precise, e si entra subito nel mondo del lavoro. Il collo di bottiglia: certe aziende filtrano i curriculum per titolo di studio, quindi si entra di lato e bisogna farsi notare.',
  },
  {
    id: 'autodidatta',
    nome: 'Autodidatta / portfolio',
    /* con l'AI come maestro non c'e' materia tecnica chiusa: si impara
       tutto, un po' meno in profondita' per unita' di studio di chi ha
       un corso addosso, e con l'energia che chiede studiare da soli */
    insegna: { analisi_dati: +1, finanza: +1, tecnologia: +1, vendita: +1, lingue: +1, gestione_progetti: +1, diritto: +1, settore: +1, creativita: +1 },
    spiega: 'Gratis o quasi, e chiede una disciplina che consuma. Con l’AI come maestro si impara qualunque competenza tecnica, senza un titolo in mano: si costruisce un portfolio che vale più di un titolo — ma solo se qualcuno lo guarda, quindi si compensa con molto networking.',
  },
  {
    id: 'lavoro',
    nome: 'Lavoro da subito',
    insegna: { settore: +1, vendita: +1 },
    spiega: 'Soldi subito, esperienza vera, e le soft skill crescono in fretta perché stai con le persone. Il rischio: restare fermi nello stesso ruolo se non si studia in parallelo.',
  },
  {
    id: 'impresa',
    nome: 'Impresa / partita IVA',
    insegna: { vendita: +1, finanza: +1, negoziazione: +1 },
    spiega: 'Alto rischio, alta ricompensa. Si può fallire e ripartire — se c’è una rete di sicurezza — o affondare. Un’impresa riuscita è la scorciatoia più rapida verso l’alto, e la probabilità di riuscirci dipende moltissimo dal capitale con cui si parte.',
  },
];

export const percorsoById = (id) => PERCORSI.find((p) => p.id === id) || null;
