/**
 * Che cosa e' successo davvero in questa partita.
 *
 * Serve ai consigli di fine giornata: per dire a qualcuno che cosa
 * dovrebbe fare meglio bisogna prima sapere che cosa ha fatto, e saperlo
 * in numeri e non a occhio. Qui si legge il diario — le decisioni, i
 * rapporti della sera, chi se n'e' andato — e se ne tira fuori una
 * trentina di misure.
 *
 * Nessuna soglia, nessun giudizio: questo file misura e basta. Che cosa
 * sia troppo e che cosa sia poco lo dice `contenuti/consigli.js`, e i suoi
 * numeri non sono opinioni — vengono dal confronto fra diecimila partite
 * vinte e diecimila perse (`strumenti/consigli.mjs`).
 *
 * Sta nel motore e non nella schermata perche' il simulatore lo deve poter
 * chiamare senza React: e' l'unico modo di tarare un consiglio invece di
 * inventarlo.
 */

import { PARTITA, SCONFITTA, INDULGENZA, RANCORE } from '../contenuti/bilancio.js';

/** Gli archetipi in cui dire di no costa piu' che dire di si'. */
export const DA_NON_RIFIUTARE = [
  'SICUREZZA_SUL_LAVORO', 'STRUMENTO_ROTTO', 'AUMENTO_MERITATO', 'CONFLITTO_TRA_COLLEGHI',
];

/** Le proposte che alleggeriscono la macchina, e quelle che la appesantiscono. */
export const TAGLI = ['PROPOSTA_TAGLIO_COSTI', 'PROPOSTA_TAGLIO_WELFARE', 'PROPOSTA_OUTSOURCING', 'PROPOSTA_LICENZIAMENTO'];
export const INVESTIMENTI = ['PROPOSTA_INVESTIMENTO', 'PROPOSTA_MARKETING', 'FORMAZIONE', 'PROPOSTA_ASSUNZIONE'];

const quota = (n, su) => (su > 0 ? n / su : 0);
const media = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0);

/**
 * Le misure di una partita finita (o in corso: si puo' chiamare quando si
 * vuole, e legge quello che c'e').
 */
export function analizza(stato) {
  const d = stato.decisioni ?? [];
  const rap = stato.rapporti ?? [];
  const a = stato.azienda;
  const giorni = rap.length || stato.giorno;
  const meta = Math.ceil(PARTITA.giorni / 2);

  const conta = (f) => d.filter(f).length;
  const accettate = conta((x) => x.azione === 'accetta');
  const rifiutate = conta((x) => x.azione === 'rifiuta');
  const rimandate = conta((x) => x.azione === 'rimanda');
  const scadute = conta((x) => x.azione === 'scaduta');
  const totali = d.length;

  /* Le richieste in cui il no si paga piu' del si': quante ne ha lasciate
     andare. E' il consiglio piu' concreto che si possa dare, perche' e'
     una lista di quattro cose. */
  const nonRifiutare = d.filter((x) => DA_NON_RIFIUTARE.includes(x.archetipo));
  const nonRifiutareMancate = nonRifiutare.filter((x) => x.azione !== 'accetta').length;
  const sicurezza = d.filter((x) => x.archetipo === 'SICUREZZA_SUL_LAVORO');
  const sicurezzaMancate = sicurezza.filter((x) => x.azione !== 'accetta').length;

  const dalManager = d.filter((x) => x.autoreTipo === 'assistant_manager');
  const tagli = d.filter((x) => TAGLI.includes(x.archetipo));
  const tagliPresi = tagli.filter((x) => x.azione === 'accetta');
  const tagliPrestiPrimaMeta = tagliPresi.filter((x) => x.giorno <= meta).length;
  const tagliPersiInPerdita = tagli.filter((x) => x.azione !== 'accetta'
    && (rap[x.giorno - 2]?.saldo ?? 0) < 0).length;

  const investimenti = d.filter((x) => INVESTIMENTI.includes(x.archetipo));
  const investimentiPresi = investimenti.filter((x) => x.azione === 'accetta');
  const investimentiTardivi = investimentiPresi.filter((x) => x.giorno > PARTITA.giorni - 8).length;

  const assurde = d.filter((x) => x.archetipo.startsWith('RICHIESTA_ASSURDA'));
  const assurdePrese = assurde.filter((x) => x.azione === 'accetta').length;

  const morali = rap.map((r) => r.cambiato?.morale ?? 0);
  const saldi = rap.map((r) => r.saldo ?? 0);
  const casse = rap.map((r) => r.cassa ?? 0);
  const cassaMassima = casse.length ? Math.max(...casse) : 0;
  const giornoCassaMassima = casse.length ? casse.indexOf(cassaMassima) + 1 : 0;

  /* Quanti giorni ha chiuso in attivo, e quanti in passivo. Il gioco e'
     fatto perche' la prima meta' possa chiudere sopra: chi non ci arriva
     mai ha sbagliato qualcosa prima, non dopo. */
  const giorniInAttivo = saldi.filter((s) => s > 0).length;
  const attivoPrimaMeta = saldi.slice(0, meta).filter((s) => s > 0).length;

  const guai = rap.flatMap((r) => r.guai ?? []);
  const perGuaio = {};
  for (const g of guai) perGuaio[g.guaio] = (perGuaio[g.guaio] || 0) + 1;
  const guaiPrimaMeta = rap.slice(0, meta).flatMap((r) => r.guai ?? []).length;

  /* QUANDO, non QUANTO. Rancore e indulgenza salgono con i giorni: chi
     arriva al trentesimo ne ha per forza piu' di chi e' morto al decimo, e
     un consiglio tarato sul quanto direbbe a chi vince che ha sbagliato
     tutto. Quello che distingue e' **a che punto della partita** ci si e'
     arrivati: il quinto gradino di rancore al quindicesimo giorno e' un
     problema, allo stesso gradino al ventinovesimo ci arriva chiunque. */
  const quintoGradino = RANCORE.gradini[4]?.da ?? 54;
  const quartoLivello = INDULGENZA.soglie[2] ?? 62;
  let giornoRancoreGrave = 0;
  let giornoIndulgenzaGrave = 0;
  for (const [i, x] of (stato.storicoNascosto ?? []).entries()) {
    if (!giornoRancoreGrave && x.rancore >= quintoGradino) giornoRancoreGrave = i + 1;
    if (!giornoIndulgenzaGrave && x.indulgenza >= quartoLivello) giornoIndulgenzaGrave = i + 1;
  }

  const differite = rap.flatMap((r) => r.differite ?? []);
  const promesseMancate = differite.filter((x) => /non è successo|non e' successo/.test(x.causa || '')).length;

  const ultimoTerzo = d.filter((x) => x.giorno > PARTITA.giorni - 10);
  const scaduteUltimoTerzo = ultimoTerzo.filter((x) => x.azione === 'scaduta').length;

  /* LE MISURE NORMALIZZATE. Le altre contano quante volte e' successo una
     cosa, e chi arriva al trentesimo giorno ha piu' di tutto per il solo
     fatto di essere arrivato: confrontare i numeri grezzi di chi vince con
     quelli di chi perde dice soprattutto chi e' sopravvissuto. Queste
     invece si dividono per le occasioni avute, e su queste si puo' dare un
     consiglio senza raccontare una cosa falsa. */
  const tagliPrimaMeta = tagli.filter((x) => x.giorno <= meta);
  const saldiPrimaMeta = saldi.slice(0, meta);
  let rossoDiFila = 0;
  let rossoPeggiore = 0;
  for (const x of saldi) {
    rossoDiFila = x < 0 ? rossoDiFila + 1 : 0;
    rossoPeggiore = Math.max(rossoPeggiore, rossoDiFila);
  }

  return {
    /* ─── dove si e' arrivati ─── */
    giorni,
    vinta: Boolean(stato.esito?.vinta),
    causa: stato.esito?.causa ?? null,
    arrivataInFondo: giorni >= PARTITA.giorni,

    /* ─── come si e' risposto ─── */
    totali,
    accettate, rifiutate, rimandate, scadute,
    quotaAccettate: quota(accettate, totali),
    quotaRifiutate: quota(rifiutate, totali),
    quotaRimandate: quota(rimandate, totali),
    quotaScadute: quota(scadute, totali),
    scaduteUltimoTerzo,

    /* ─── le quattro che non si rifiutano ─── */
    nonRifiutareTotali: nonRifiutare.length,
    nonRifiutareMancate,
    quotaNonRifiutareMancate: quota(nonRifiutareMancate, nonRifiutare.length),
    sicurezzaMancate,

    /* ─── i manager ─── */
    proposteTotali: dalManager.length,
    proposteAccettate: dalManager.filter((x) => x.azione === 'accetta').length,
    quotaProposteAccettate: quota(dalManager.filter((x) => x.azione === 'accetta').length, dalManager.length),
    promesseMancate,
    quotaPromesseMancate: quota(promesseMancate, dalManager.filter((x) => x.azione === 'accetta').length),

    /* ─── la macchina ─── */
    struttura: a.struttura ?? 1,
    tagliOfferti: tagli.length,
    tagliPresi: tagliPresi.length,
    tagliPrestiPrimaMeta,
    quotaTagliPrimaMeta: quota(tagliPrimaMeta.filter((x) => x.azione === 'accetta').length, tagliPrimaMeta.length),
    tagliPersiInPerdita,
    quotaTagliPersiInPerdita: quota(tagliPersiInPerdita, tagli.filter((x) => (rap[x.giorno - 2]?.saldo ?? 0) < 0).length),
    investimentiOfferti: investimenti.length,
    investimentiPresi: investimentiPresi.length,
    quotaInvestimentiPresi: quota(investimentiPresi.length, investimenti.length),
    investimentiTardivi,
    quotaInvestimentiTardivi: quota(investimentiTardivi, investimentiPresi.length),
    assurdePrese,

    /* ─── i numeri dell'azienda ─── */
    moraleFinale: a.morale,
    produttivitaMedia: media(stato.storicoProduttivita ?? []),
    produttivitaFinale: a.produttivita,
    reputazioneFinale: a.reputazione,
    cassaFinale: a.cassa,
    cassaMassima,
    giornoCassaMassima,
    fatturatoMedio: media(stato.storicoFatturato ?? []),
    moraleMosso: media(morali),

    /* ─── i due nascosti ─── */
    indulgenza: a.indulgenza,
    rancore: a.rancore,
    livelloIndulgenza: INDULGENZA.soglie.filter((s) => a.indulgenza >= s).length + 1,
    gradiniRancore: RANCORE.gradini.filter((g) => a.rancore >= g.da).length,
    /* Zero vuol dire «non ci e' mai arrivato», che e' la cosa buona. */
    giornoRancoreGrave,
    giornoIndulgenzaGrave,

    /* ─── quello che e' andato storto ─── */
    giorniInAttivo,
    attivoPrimaMeta,
    quotaAttivoPrimaMeta: quota(saldiPrimaMeta.filter((x) => x > 0).length, saldiPrimaMeta.length),
    saldoMedio: media(saldi),
    saldoMedioPrimaMeta: media(saldiPrimaMeta),
    rossoDiFilaPeggiore: rossoPeggiore,
    /* Il giorno in cui la cassa ha toccato il massimo, in frazione di
       partita giocata: chi vince cresce fino a meta' abbondante, chi perde
       tocca il massimo subito e da li' scende e basta. */
    quandoIlMassimo: quota(giornoCassaMassima, giorni),
    saldoUltimoGiorno: saldi.at(-1) ?? 0,
    guai: perGuaio,
    guaiTotali: guai.length,
    guaiAlGiorno: quota(guai.length, giorni),
    guaiPrimaMetaAlGiorno: quota(guaiPrimaMeta, Math.min(meta, giorni)),
    usciti: (stato.usciti ?? []).length,
    usciti10Giorni: quota((stato.usciti ?? []).length, giorni) * 10,
    organico: PARTITA.organicoAllInizio ?? null,
    organicoMinimo: SCONFITTA.organicoMinimo,
  };
}
