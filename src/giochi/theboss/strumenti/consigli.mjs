/**
 * I consigli di fine partita, messi alla prova.
 *
 *     node src/giochi/theboss/strumenti/consigli.mjs [partite]
 *     npm run boss:consigli
 *
 * Un consiglio scritto e mai detto e' peggio di un consiglio mancante:
 * occupa il posto di uno che sarebbe uscito. E un consiglio che esce
 * sempre non e' un consiglio, e' una didascalia. Quindi si simulano
 * migliaia di partite — con sei modi di giocare diversi, perche' un solo
 * modo di giocare fa scattare sempre le stesse cose — e si guarda:
 *
 *  1. **ognuno esce almeno qualche volta**, se no e' testo morto;
 *  2. **nessuno esce quasi sempre**, se no non distingue niente;
 *  3. **nessuna partita finisce senza niente da dire**;
 *  4. **le soglie separano davvero**: per ogni consiglio si confronta
 *     quanto spesso esce nelle partite perse e in quelle vinte. Se esce
 *     uguale nelle due, la misura su cui e' costruito non c'entra con il
 *     vincere, e la soglia va rifatta o il consiglio va tolto.
 */

import { creaPartita, iniziaGiornata, richiestaCorrente, decidi, chiudiGiornata, prossimoGiorno, fotografia } from '../motore/partita.js';
import { analizza } from '../motore/analisi.js';
import { creaCaso } from '../motore/caso.js';
import { secondiDelGiorno } from '../contenuti/bilancio.js';
import { CONSIGLI, consigliDi } from '../contenuti/consigli.js';
import { POLITICHE, archDi } from './politiche.js';

const PARTITE = Number(process.argv[2] || 2000);
const LETTURA = { minimo: 7, massimo: 14 };

function gioca(seme, politica) {
  const stato = creaPartita({ seme });
  const decide = POLITICHE[politica];
  const cg = creaCaso(seme ^ 0x5bf03635);
  while (stato.fase !== 'finita') {
    iniziaGiornata(stato);
    let restano = secondiDelGiorno(stato.giorno);
    while (richiestaCorrente(stato)) {
      const r = richiestaCorrente(stato);
      const t = cg.fra(LETTURA.minimo, LETTURA.massimo);
      if (t > restano) break;
      restano -= t;
      decidi(stato, decide(r, archDi(r), fotografia(stato), cg));
    }
    chiudiGiornata(stato);
    if (stato.fase !== 'finita') prossimoGiorno(stato);
  }
  return analizza(stato);
}

const modi = Object.keys(POLITICHE);
const perModo = Math.max(1, Math.round(PARTITE / modi.length));
const scatti = new Map(CONSIGLI.map((c) => [c.id, { tutte: 0, vinte: 0, perse: 0, primo: 0 }]));
let vinte = 0;
let perse = 0;
let mute = 0;
let quantiTotali = 0;
const esempi = new Map();

for (const modo of modi) {
  for (let s = 1; s <= perModo; s += 1) {
    const a = gioca(s, modo);
    if (a.vinta) vinte += 1; else perse += 1;
    /* Tre e' quello che vede chi gioca; qui si guardano tutti quelli che
       scattano, se no i piu' leggeri non si vedrebbero mai. */
    const tutti = consigliDi(a, CONSIGLI.length);
    const mostrati = consigliDi(a, 3);
    quantiTotali += mostrati.length;
    if (tutti.length === 0) mute += 1;
    for (const [i, c] of tutti.entries()) {
      const v = scatti.get(c.id);
      v.tutte += 1;
      if (a.vinta) v.vinte += 1; else v.perse += 1;
      if (i === 0) v.primo += 1;
      if (!esempi.has(c.id)) esempi.set(c.id, c.testo);
    }
  }
}

const totale = vinte + perse;
let falliti = 0;
const ok = (cond, testo, extra = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${testo}${extra ? `  — ${extra}` : ''}`);
  if (!cond) falliti += 1;
};
const pc = (n, su) => (su > 0 ? (n / su) * 100 : 0);

console.log(`\n${totale} partite (${modi.length} modi di giocare) · ${vinte} vinte, ${perse} perse\n`);
console.log('consiglio'.padEnd(26), 'esce'.padStart(7), 'se perdi'.padStart(9), 'se vinci'.padStart(9), '  primo');
for (const c of CONSIGLI) {
  const v = scatti.get(c.id);
  console.log(
    c.id.padEnd(26),
    `${pc(v.tutte, totale).toFixed(1)}%`.padStart(7),
    `${pc(v.perse, perse).toFixed(1)}%`.padStart(9),
    `${pc(v.vinte, vinte).toFixed(1)}%`.padStart(9),
    `  ${v.primo}`,
  );
}

console.log('\nQUELLO CHE DEVE VALERE');
{
  const morti = CONSIGLI.filter((c) => scatti.get(c.id).tutte === 0);
  ok(morti.length === 0, 'ogni consiglio esce almeno una volta: niente testo morto',
    morti.map((c) => c.id).join(', ') || `tutti e ${CONSIGLI.length}`);

  const sempre = CONSIGLI.filter((c) => c.id !== 'VINTA' && pc(scatti.get(c.id).tutte, totale) > 92);
  ok(sempre.length === 0, 'e nessuno esce quasi sempre: un consiglio che vale per tutti non distingue niente',
    sempre.map((c) => `${c.id} ${pc(scatti.get(c.id).tutte, totale).toFixed(0)}%`).join(', ') || 'il piu\' frequente sta sotto il novantadue');

  ok(mute === 0, 'nessuna partita finisce senza niente da dire', mute ? `${mute} partite mute` : 'tutte hanno almeno un consiglio');

  const medi = quantiTotali / totale;
  ok(medi >= 1.5 && medi <= 3, 'e se ne danno due o tre per volta, non uno solo ne\' un muro', `${medi.toFixed(2)} a partita`);

  /* Il controllo che conta: la soglia separa? Un consiglio che esce
     tanto quanto nelle vinte non sta misurando niente di utile.
     `VINTA` e `QUASI` sono esenti — parlano dell'esito — e lo sono anche
     le rifiniture: quelle dicono «si puo' fare meglio», e si possono dire
     anche a chi ha vinto senza raccontare una bugia. */
  const ESENTI = new Set(['VINTA', 'QUASI']);
  const piatti = CONSIGLI.filter((c) => !ESENTI.has(c.id) && c.peso > 25).filter((c) => {
    const v = scatti.get(c.id);
    if (v.tutte < 20) return false;
    return pc(v.perse, perse) < pc(v.vinte, vinte) * 1.25;
  });
  ok(piatti.length === 0, 'e ogni soglia separa chi perde da chi vince',
    piatti.map((c) => `${c.id} (perse ${pc(scatti.get(c.id).perse, perse).toFixed(0)}% vs vinte ${pc(scatti.get(c.id).vinte, vinte).toFixed(0)}%)`).join(', ') || 'tutte');
}

console.log(falliti === 0 ? '\nTUTTO OK\n' : `\n${falliti} CONTROLLI FALLITI\n`);
process.exit(falliti ? 1 : 0);
