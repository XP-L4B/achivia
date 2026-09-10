/**
 * Il simulatore: diecimila partite, sei modi di giocare, una tabella.
 *
 *     node src/giochi/theboss/strumenti/montecarlo.mjs [partite]
 *     npm run boss:sim
 *
 * A che serve. Un gioco a decisioni non si bilancia leggendolo: si
 * bilancia guardando quante partite finiscono bene e come finiscono le
 * altre. Il bersaglio dichiarato e' **intorno al dodici per cento** di
 * vittorie per la politica equilibrata — un giocatore capace vince una
 * partita su otto, abbastanza da poterci sperare e abbastanza poco da
 * essere una notizia — e **sotto il due per cento** per «accetta sempre» e
 * «rifiuta sempre», perche' nessuna delle due strade estreme deve
 * funzionare.
 *
 * Era fra il cinque e il dieci. E' salito perche' a quel ritmo la partita
 * finiva quasi sempre allo stesso modo, e un gioco in cui si perde
 * novantatre volte su cento smette di sembrare una cosa che si puo'
 * imparare.
 *
 * IL TEMPO CONTA ANCHE QUI. Una giornata ha un tetto di secondi, e leggere
 * costa: il simulatore da' a ogni richiesta un tempo di lettura pescato dal
 * caso, e quando la giornata finisce quello che resta in fila **scade**.
 * Senza questo, il simulatore misurerebbe un gioco in cui si risponde
 * sempre a tutto, che non e' il gioco.
 */

import { creaPartita, iniziaGiornata, richiestaCorrente, decidi, chiudiGiornata, prossimoGiorno, fotografia, riassunto, dietroLeQuinte } from '../motore/partita.js';
import { creaCaso } from '../motore/caso.js';
import { secondiDelGiorno } from '../contenuti/bilancio.js';
import { POLITICHE, archDi } from './politiche.js';

/** Quanto ci mette un giocatore a leggere e decidere una richiesta. */
const LETTURA = { minimo: 7, massimo: 14 };

export function giocaUna(seme, politica, { lettura = LETTURA } = {}) {
  const stato = creaPartita({ seme });
  const decide = POLITICHE[politica];
  /* Un caso a parte per il giocatore: le sue esitazioni non devono spostare
     il caso della partita, se no due politiche non vedrebbero lo stesso mondo. */
  const casoGiocatore = creaCaso(seme ^ 0x5bf03635);
  while (stato.fase !== 'finita') {
    iniziaGiornata(stato);
    let restano = secondiDelGiorno(stato.giorno);
    while (richiestaCorrente(stato)) {
      const r = richiestaCorrente(stato);
      const tempo = casoGiocatore.fra(lettura.minimo, lettura.massimo);
      if (tempo > restano) break;              // il tempo e' finito: il resto scadra'
      restano -= tempo;
      decidi(stato, decide(r, archDi(r), fotografia(stato), casoGiocatore));
    }
    chiudiGiornata(stato);
    if (stato.fase !== 'finita') prossimoGiorno(stato);
  }
  return { ...riassunto(stato), ...dietroLeQuinte(stato) };
}

function statistiche(esiti) {
  const n = esiti.length;
  const vinte = esiti.filter((e) => e.vinta).length;
  const cause = {};
  for (const e of esiti) if (!e.vinta) cause[e.causa] = (cause[e.causa] || 0) + 1;
  const giorni = esiti.filter((e) => !e.vinta).map((e) => e.giorni);
  const media = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0);
  const ordina = (v) => v.slice().sort((a, b) => a - b);
  const mediana = (v) => (v.length ? ordina(v)[Math.floor(v.length / 2)] : 0);
  const scadute = esiti.map((e) => e.scadute);
  return {
    n,
    vinte,
    percentuale: (vinte / n) * 100,
    giornoMedioMorte: media(giorni),
    causaPiuFrequente: Object.entries(cause).sort((a, b) => b[1] - a[1])[0] || ['—', 0],
    cause,
    scaduteMedie: media(scadute),
    produttivitaMedia: media(esiti.map((e) => e.produttivitaMedia)),
    fatturatoMedio: media(esiti.map((e) => e.fatturatoMedio)),
    cassaMediana: mediana(esiti.map((e) => e.cassaFinale)),
    indulgenzaMedia: media(esiti.map((e) => e.indulgenza)),
    rancoreMedio: media(esiti.map((e) => e.rancore)),
    usciti: media(esiti.map((e) => e.usciti)),
  };
}

const num = (v, c = 1) => v.toFixed(c);

export function corri(quante = 10000, politiche = Object.keys(POLITICHE)) {
  const tavola = {};
  for (const p of politiche) {
    const esiti = [];
    for (let i = 0; i < quante; i += 1) esiti.push(giocaUna(1000 + i, p));
    tavola[p] = statistiche(esiti);
  }
  return tavola;
}

export function stampa(tavola) {
  console.log('politica          partite  vinte      %   morte a  causa piu\' frequente   prod  fattur.  scad.  indulg  ranc  usciti');
  for (const [nome, s] of Object.entries(tavola)) {
    console.log(
      nome.padEnd(17),
      String(s.n).padStart(7),
      String(s.vinte).padStart(6),
      num(s.percentuale, 2).padStart(7),
      num(s.giornoMedioMorte, 1).padStart(10),
      `${s.causaPiuFrequente[0]} (${s.causaPiuFrequente[1]})`.padEnd(23),
      num(s.produttivitaMedia, 0).padStart(4),
      num(s.fatturatoMedio, 0).padStart(8),
      num(s.scaduteMedie, 1).padStart(6),
      num(s.indulgenzaMedia, 0).padStart(7),
      num(s.rancoreMedio, 0).padStart(5),
      num(s.usciti, 1).padStart(7),
    );
  }
  const eq = tavola.equilibrata;
  const acc = tavola['accetta-sempre'];
  const rif = tavola['rifiuta-sempre'];
  console.log('');
  if (eq) {
    const dentro = eq.percentuale >= 10 && eq.percentuale <= 14;
    console.log(`${dentro ? '✓' : '✗'} equilibrata al ${num(eq.percentuale, 2)}%  (bersaglio 10–14%)`);
  }
  for (const [n, s] of [['accetta-sempre', acc], ['rifiuta-sempre', rif]]) {
    if (!s) continue;
    console.log(`${s.percentuale < 2 ? '✓' : '✗'} ${n} al ${num(s.percentuale, 2)}%  (bersaglio sotto il 2%)`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const quante = Number(process.argv[2]) || 10000;
  const t0 = Date.now();
  stampa(corri(quante));
  console.log(`\n${quante} partite per politica in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
