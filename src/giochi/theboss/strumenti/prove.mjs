/**
 * Le prove del motore di The Boss.
 *
 *     node src/giochi/theboss/strumenti/prove.mjs
 *     npm run boss:prove
 *
 * Non c'e' un framework di prove in Achivia, e non lo si aggiunge per un
 * modulo: quello che serve — dire una cosa vera o falsa e contare — sono
 * dieci righe. Le prove stanno dentro il modulo perche' sono parte di
 * quello che il modulo garantisce, e girano con `node` senza compilare
 * niente.
 *
 * Che cosa si vuole dimostrare, in ordine di importanza:
 *
 *  1. **Determinismo.** Stesso seme e stesse risposte, stessa partita.
 *     Senza questo non si puo' rigiocare un difetto, non si puo' far
 *     girare il simulatore, e un giorno non si potra' ricontrollare un
 *     punteggio.
 *  2. **Le due spirali funzionano davvero**, e non solo sulla carta:
 *     accettare alza l'asticella e fa costare di piu' quello che arriva
 *     dopo; rifiutare accende i guai in fila.
 *  3. **Non decidere costa piu' che decidere male.**
 *  4. **Le conseguenze differite tornano**, alla loro distanza, e il
 *     rapporto le sa nominare.
 *  5. **Il contenuto non contiene numeri**: gli archetipi e gli eventi
 *     parlano per gradini, e i gradini sono piccoli.
 */

import { creaPartita, iniziaGiornata, richiestaCorrente, decidi, chiudiGiornata, prossimoGiorno, fotografia, riassunto, dietroLeQuinte, scalaDi, autoreDi } from '../motore/partita.js';
import { creaCaso } from '../motore/caso.js';
import { livelloDi } from '../motore/pescaggio.js';
import { fatturatoDi, costiDi } from '../motore/giornata.js';
import { ARCHETIPI, LEVE, archetipoById } from '../contenuti/archetipi.js';
import { applicaGradini } from '../motore/leve.js';
import { analizza } from '../motore/analisi.js';
import { CONSIGLI, consigliDi } from '../contenuti/consigli.js';
import { EVENTI_MONDO } from '../contenuti/eventi.js';
import { PASSO, PARTENZA, LIMITI, INDULGENZA, RANCORE, SCONFITTA, PARTITA, ECONOMIA, RITMO, MANAGER as QUOTA_MANAGER, richiesteDelGiorno, secondiDelGiorno, managerDelGiorno, rincaroDi } from '../contenuti/bilancio.js';
import { DIPENDENTI, MANAGER } from '../contenuti/cast.js';
import { MONDO, POSTI } from '../contenuti/stanza.js';
import { umoreDopo } from '../motore/persone.js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let falliti = 0;
const ok = (cond, testo, extra = '') => {
  if (!cond) falliti += 1;
  console.log(`  ${cond ? '✓' : '✗'} ${testo}${extra ? '  — ' + extra : ''}`);
};
const titolo = (t) => console.log(`\n${t}`);

/** Gioca una partita intera con una funzione che decide. */
function gioca(seme, decide, { fino = 999 } = {}) {
  const s = creaPartita({ seme });
  while (s.fase !== 'finita' && s.giorno <= fino) {
    iniziaGiornata(s);
    while (richiestaCorrente(s)) decidi(s, decide(richiestaCorrente(s), s));
    chiudiGiornata(s);
    if (s.fase !== 'finita') prossimoGiorno(s);
  }
  return s;
}

/* ══ 1. Determinismo ══ */
titolo('IL DETERMINISMO');
{
  const scelte = ['accetta', 'rifiuta', 'rimanda'];
  const decide = (r, s) => scelte[(s.decisioni.length + s.giorno) % 3];
  const a = riassunto(gioca(4242, decide));
  const b = riassunto(gioca(4242, decide));
  ok(JSON.stringify(a) === JSON.stringify(b), 'stesso seme e stesse risposte, stessa partita');
  const c = riassunto(gioca(4243, decide));
  ok(JSON.stringify(a) !== JSON.stringify(c), 'seme diverso, partita diversa');
  const s1 = gioca(77, decide);
  const s2 = gioca(77, () => 'accetta');
  ok(JSON.stringify(riassunto(s1)) !== JSON.stringify(riassunto(s2)), 'stesso seme, risposte diverse, partita diversa');
  /* la prova che conta per un futuro server: dalla lista delle risposte si
     rifa' la partita identica, senza sapere altro */
  const originale = gioca(999, decide);
  const risposte = originale.decisioni.map((d) => d.azione);
  let i = 0;
  const rifatta = gioca(999, () => risposte[i++]);
  ok(JSON.stringify(riassunto(originale)) === JSON.stringify(riassunto(rifatta)),
    'la partita si rigioca dalla sola lista delle risposte', `${risposte.length} risposte`);
}

/* ══ 2. La forma dei contenuti ══ */
titolo('I CONTENUTI NON CONTENGONO NUMERI');
{
  ok(ARCHETIPI.length >= 25, 'almeno venticinque archetipi', String(ARCHETIPI.length));
  ok(EVENTI_MONDO.length >= 20, 'almeno venti eventi del mondo', String(EVENTI_MONDO.length));
  const leve = new Set(LEVE);
  const fuoriLeva = [];
  const troppoGrandi = [];
  for (const a of ARCHETIPI) {
    for (const esito of ['accetta', 'rifiuta', 'rimanda']) {
      for (const [k, v] of Object.entries(a[esito] || {})) {
        if (!leve.has(k)) fuoriLeva.push(`${a.id}.${esito}.${k}`);
        if (Math.abs(v) > 6) troppoGrandi.push(`${a.id}.${esito}.${k}=${v}`);
      }
    }
  }
  ok(fuoriLeva.length === 0, 'ogni effetto tira una delle otto leve', fuoriLeva.join(', ') || 'nessuna inventata');
  ok(troppoGrandi.length === 0, 'e sono gradini, non importi: nessuno oltre sei', troppoGrandi.join(', ') || 'il piu\' grande e\' cinque');
  ok(ARCHETIPI.every((a) => a.livelli[0] >= 1 && a.livelli[1] <= 4 && a.livelli[0] <= a.livelli[1]), 'i livelli di escalation sono sensati');
  ok(ARCHETIPI.filter((a) => a.autore === 'manager').every((a) => typeof a.attendibile === 'number'),
    'ogni proposta manageriale dichiara quanto e\' attendibile');
  ok(new Set(ARCHETIPI.map((a) => a.id)).size === ARCHETIPI.length, 'nessun archetipo ripetuto');

  /* La domanda: che cosa si sta decidendo. I testi delle richieste sono
     racconti — due terzi non contengono nessuna forma di richiesta — e
     senza questa riga si preme «Accetta» senza sapere che cosa si accetta.
     Deve esserci per tutti, e deve essere una domanda. */
  const senzaDomanda = ARCHETIPI.filter((a) => !a.chiede || !/\?\s*$/.test(a.chiede));
  ok(senzaDomanda.length === 0, 'ogni archetipo dice che cosa si sta decidendo, e lo chiede',
    senzaDomanda.map((a) => a.id).join(', ') || 'tutti e trentatre\'');
  const lunghe = ARCHETIPI.filter((a) => (a.chiede || '').length > 34);
  ok(lunghe.length === 0, 'e lo chiede corto: sta sopra i pulsanti, in una colonna stretta',
    lunghe.map((a) => `${a.id} (${a.chiede.length})`).join(', ') || 'la piu\' lunga sta in trentaquattro caratteri');
}

/* ══ 3. Niente caso non seminato ══ */
titolo('IL CASO E\' SOLO QUELLO SEMINATO');
{
  /**
   * Che cosa si guarda, e perche' non tutto il modulo.
   *
   * La promessa da difendere e' una sola: **una partita si rigioca**. Chi
   * la mantiene sono la simulazione (`motore/`) e i numeri e i contenuti da
   * cui pesca (`contenuti/`). Il resto del modulo non e' la partita: i
   * suoni variano il tono di un clic a caso e devono farlo, i disegni si
   * caricano dalla rete, le schermate guardano l'orologio perche' il timer
   * e' roba loro.
   *
   * Il controllo era piu' largo e segnalava `suoni.js`, che usa
   * `Math.random` per non far suonare due tasti identici in fila. Un
   * controllo che segnala una cosa giusta va stretto, non zittito: adesso
   * guarda la simulazione, e in piu' verifica la cosa che rende vera la
   * distinzione — che **la simulazione non importi niente da fuori di se'**.
   * Finche' vale quella, quello che succede altrove non puo' entrare nella
   * partita.
   */
  const radice = new URL('../', import.meta.url).pathname;
  const CUORE = ['motore', 'contenuti'];
  const colpevoli = [];
  const importaFuori = [];
  const gira = (dir, dentro) => {
    for (const v of readdirSync(dir)) {
      const p = join(dir, v);
      if (statSync(p).isDirectory()) { if (v !== 'assets') gira(p, dentro); continue; }
      if (!/\.(js|mjs)$/.test(v)) continue;
      const grezzo = readFileSync(p, 'utf8');
      /* Si guarda il codice, non i commenti: le intestazioni del motore le
         parole `Math.random` le nominano apposta, per dire che non si usano. */
      const testo = grezzo
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      if (!dentro) continue;
      if (/Math\.random/.test(testo)) colpevoli.push(p.replace(radice, ''));
      if (/Date\.now|new Date\(/.test(testo)) colpevoli.push(`${p.replace(radice, '')} (orologio)`);
      /* la simulazione importa solo da se' stessa */
      for (const m of testo.matchAll(/from '([^']+)'/g)) {
        const dove = m[1];
        if (dove.startsWith('node:')) continue;
        const risolto = join(dir, dove).replace(radice, '');
        if (!CUORE.some((c) => risolto.startsWith(c))) importaFuori.push(`${p.replace(radice, '')} → ${dove}`);
      }
    }
  };
  for (const c of CUORE) gira(join(radice, c), true);
  ok(colpevoli.length === 0, 'nessun Math.random e nessun orologio nella simulazione', colpevoli.join(', ') || 'pulito');
  ok(importaFuori.length === 0, 'e la simulazione non importa niente da fuori di se\'', importaFuori.join(', ') || 'chiusa in se\' stessa');
}

/* ══ 4. La spirale dell'indulgenza ══ */
titolo('LA SPIRALE DELL\'INDULGENZA');
{
  const s = gioca(31, () => 'accetta', { fino: 16 });
  const q = dietroLeQuinte(s);
  ok(q.indulgenza > PARTENZA.indulgenza + 25, 'accettare sempre fa salire l\'indulgenza', `${PARTENZA.indulgenza} → ${q.indulgenza}`);
  ok(q.livello >= 3, 'e alza l\'asticella di quello che arriva', `livello ${q.livello}`);
  const s2 = gioca(31, () => 'rifiuta', { fino: 16 });
  ok(dietroLeQuinte(s2).livello === 1, 'chi non accetta resta al primo livello', `livello ${dietroLeQuinte(s2).livello}`);
  ok(livelloDi(0) === 1 && livelloDi(100) === 4, 'la scala va da uno a quattro');
  ok(scalaDi({ livello: 3, scala: 1 }) > scalaDi({ livello: 1, scala: 1 }),
    'una richiesta di terzo livello costa piu\' della stessa al primo',
    `x${scalaDi({ livello: 3, scala: 1 }).toFixed(2)} contro x1`);
}

/* ══ 5. La spirale del rancore ══ */
titolo('LA SPIRALE DEL RANCORE');
{
  const s = gioca(31, () => 'rifiuta', { fino: 18 });
  ok(dietroLeQuinte(s).rancore > PARTENZA.rancore + 25, 'rifiutare sempre fa salire il rancore', `${PARTENZA.rancore} → ${dietroLeQuinte(s).rancore}`);
  const guai = s.rapporti.flatMap((r) => r.guai).map((g) => g.guaio);
  ok(guai.length > 0, 'e accende i guai', `${guai.length} in diciotto giorni: ${[...new Set(guai)].join(', ')}`);
  const scala = RANCORE.gradini.map((g) => g.da);
  ok(scala.every((v, i) => i === 0 || v > scala[i - 1]), 'i guai arrivano in fila, dal piu\' lieve al piu\' grave');
  ok(guai.includes('ritmo'), 'il primo e\' il ritmo che cala');
  const s2 = gioca(31, () => 'accetta', { fino: 18 });
  ok(s2.rapporti.flatMap((r) => r.guai).length < guai.length, 'chi accetta ne vede molti meno');
}

/* ══ 6. Non decidere costa piu' che decidere male ══ */
titolo('NON DECIDERE');
{
  const prova = (azione) => {
    const s = creaPartita({ seme: 55 });
    iniziaGiornata(s);
    const chi = autoreDi(s, richiestaCorrente(s));
    const lealtaPrima = chi.lealta;
    decidi(s, azione);
    return { rancore: s.azienda.rancore, lealta: chi.lealta - lealtaPrima };
  };
  const no = prova('rifiuta');
  const niente = prova('scaduta');
  ok(niente.rancore > no.rancore, 'ignorare fa piu\' rancore che rifiutare',
    `${niente.rancore.toFixed(2)} contro ${no.rancore.toFixed(2)}`);
  ok(niente.lealta < no.lealta, 'e costa piu\' lealta\'', `${niente.lealta.toFixed(1)} contro ${no.lealta.toFixed(1)}`);
  const s = creaPartita({ seme: 55 });
  iniziaGiornata(s);
  const quante = s.coda.length;
  const rap = chiudiGiornata(s);
  ok(rap.scadute === quante, 'quello che resta in fila a fine giornata scade', `${rap.scadute} su ${quante}`);
}

/* ══ 7. Rimandare non e' una via d'uscita ══ */
titolo('RIMANDARE');
{
  const s = creaPartita({ seme: 88 });
  iniziaGiornata(s);
  const prima = richiestaCorrente(s);
  decidi(s, 'rimanda');
  ok(s.rimandate.length === 1, 'la richiesta rimandata si segna un appuntamento');
  const app = s.rimandate[0];
  ok(app.torna > s.giorno && app.torna <= s.giorno + 6, 'e torna entro pochi giorni', `giorno ${app.torna}`);
  while (s.fase !== 'finita' && s.giorno < app.torna) {
    while (richiestaCorrente(s)) decidi(s, 'rifiuta');
    chiudiGiornata(s); prossimoGiorno(s); iniziaGiornata(s);
  }
  const tornata = s.coda.find((r) => r.tornata && r.archetipo === prima.archetipo);
  ok(Boolean(tornata), 'ed è tornata davvero');
  if (tornata) {
    ok(tornata.livello > prima.livello || tornata.scala > 1, 'piu\' grossa di prima',
      `livello ${prima.livello}→${tornata.livello}, costo x${tornata.scala.toFixed(2)}`);
  }
}

/* ══ 8. Le conseguenze differite ══ */
titolo('LE CONSEGUENZE DIFFERITE');
{
  const s = gioca(17, () => 'accetta', { fino: 24 });
  const tornate = s.rapporti.flatMap((r) => r.differite);
  ok(tornate.length > 0, 'qualcosa torna indietro', `${tornate.length} conseguenze in ventiquattro giorni`);
  ok(tornate.every((d) => d.causa && d.causa.length > 4), 'ognuna sa dire perche\'', tornate[0]?.causa);
  const distanze = s.rapporti.flatMap((r) => r.differite.map((d) => r.giorno - d.deciso));
  ok(distanze.every((d) => d >= 3 && d <= 10), 'e arriva fra tre e dieci giorni dalla decisione',
    `da ${Math.min(...distanze)} a ${Math.max(...distanze)}`);
  const s2 = gioca(17, () => 'rifiuta', { fino: 24 });
  ok(s2.rapporti.flatMap((r) => r.differite).length > 0, 'anche i rifiuti lasciano conti da pagare');
}

/* ══ 9. L'economia ══ */
titolo('L\'ECONOMIA DELLA GIORNATA');
{
  const s = creaPartita({ seme: 5 });
  const f0 = fatturatoDi(s);
  s.azienda.produttivita += 20;
  ok(fatturatoDi(s) > f0, 'piu\' produttivita\', piu\' fatturato');
  s.azienda.produttivita -= 20;
  s.azienda.reputazione = 100;
  ok(fatturatoDi(s) > f0, 'e piu\' reputazione anche');
  s.azienda.reputazione = PARTENZA.reputazione;
  const c0 = costiDi(s);
  s.persone[0].attivo = false;
  ok(costiDi(s) < c0 && fatturatoDi(s) < f0, 'chi se ne va toglie uno stipendio e un paio di braccia');
  s.persone[0].attivo = true;
  const s2 = creaPartita({ seme: 5 });
  iniziaGiornata(s2);
  const cassaPrima = s2.azienda.cassa;
  const rap = chiudiGiornata(s2);
  ok(Math.abs((cassaPrima + rap.fatturato - rap.costi) - rap.cassa) <= 2,
    'la cassa di stasera e\' quella di stamattina piu\' il saldo', `${cassaPrima} + ${rap.fatturato} - ${rap.costi} = ${rap.cassa}`);
  ok(rap.costi > 0 && rap.fatturato > 0, 'i conti non sono vuoti');
}

/* ══ 10. Il morale tira la produttivita' ══ */
titolo('IL MORALE TIRA LA PRODUTTIVITA\'');
{
  const su = creaPartita({ seme: 9 });
  su.azienda.morale = 95;
  const p0 = su.azienda.produttivita;
  iniziaGiornata(su); chiudiGiornata(su);
  ok(su.azienda.produttivita > p0, 'con la gente contenta la produttivita\' sale', `${p0} → ${su.azienda.produttivita.toFixed(1)}`);
  const giu = creaPartita({ seme: 9 });
  giu.azienda.morale = 20;
  const p1 = giu.azienda.produttivita;
  iniziaGiornata(giu); chiudiGiornata(giu);
  ok(giu.azienda.produttivita < p1, 'con la gente scontenta scende', `${p1} → ${giu.azienda.produttivita.toFixed(1)}`);
}

/* ══ 11. La memoria di chi chiede ══ */
titolo('LA MEMORIA');
{
  const s = creaPartita({ seme: 12 });
  const tizio = s.persone[0];
  const primo = umoreDopo(tizio, 'rifiuta');
  tizio.memoria.rifiutate = 3;
  const dopoTre = umoreDopo(tizio, 'rifiuta');
  ok(primo !== dopoTre, 'lo stesso no non fa lo stesso effetto la quarta volta', `${primo} → ${dopoTre}`);
  const ignorato = creaPartita({ seme: 12 }).persone[0];
  ignorato.memoria.ignorate = 2;
  ok(umoreDopo(ignorato, 'rifiuta') !== primo, 'ed essere stato ignorato pesa il doppio di essere stato rifiutato');
  const s2 = gioca(12, () => 'rifiuta', { fino: 12 });
  const memorie = s2.persone.filter((p) => p.memoria.rifiutate > 0);
  ok(memorie.length > 0, 'la memoria si riempie giocando', `${memorie.length} persone se lo ricordano`);
}

/* ══ 12. Gli assistant manager possono sbagliare ══ */
titolo('GLI ASSISTANT MANAGER');
{
  let mantenute = 0; let tradite = 0;
  for (let seme = 0; seme < 400; seme += 1) {
    const s = creaPartita({ seme: 5000 + seme });
    s.azienda.indulgenza = 0;
    iniziaGiornata(s);
    while (richiestaCorrente(s)) {
      const r = richiestaCorrente(s);
      const e = decidi(s, 'accetta');
      if (r.autoreTipo === 'assistant_manager' && e.promessaMantenuta !== null) {
        if (e.promessaMantenuta) mantenute += 1; else tradite += 1;
      }
    }
  }
  ok(mantenute > 0 && tradite > 0, 'a volte quello che promettono si avvera, a volte no',
    `${mantenute} mantenute, ${tradite} no`);
  const quota = tradite / (mantenute + tradite);
  ok(quota > 0.15 && quota < 0.6, 'e non e\' ne\' sempre ne\' mai', `sbagliano il ${(quota * 100).toFixed(0)}% delle volte`);
  ok(MANAGER.length >= 3 && new Set(MANAGER.map((m) => m.agenda)).size >= 3, 'e hanno agende diverse fra loro');
}

/* ══ 13. Un evento cambia le regole ══ */
titolo('GLI EVENTI CAMBIANO LE REGOLE');
{
  const peste = EVENTI_MONDO.find((e) => e.id === 'peste');
  ok(Boolean(peste?.capovolge?.length), 'la peste capovolge qualcosa', peste?.capovolge?.join(', '));
  const casa = archetipoById('LAVORO_DA_CASA');
  ok(casa.accetta.produttivita < 0, 'di norma lavorare da casa costa produttivita\'');
  const normale = creaPartita({ seme: 3 });
  const appestata = creaPartita({ seme: 3 });
  appestata.eventiAttivi.push({ ...peste, finisce: 99 });
  const misura = (s) => {
    s.coda = [{ id: 'x', archetipo: 'LAVORO_DA_CASA', autoreId: DIPENDENTI[0].id, autoreTipo: 'dipendente', livello: 1, scala: 1 }];
    s.indice = 0; s.fase = 'richieste';
    const p0 = s.azienda.produttivita;
    decidi(s, 'accetta');
    return s.azienda.produttivita - p0;
  };
  const senza = misura(normale);
  const con = misura(appestata);
  ok(senza < 0 && con > 0, 'ma in tempo di peste la fa guadagnare', `${senza.toFixed(2)} contro +${con.toFixed(2)}`);
}

/* ══ 14. Come finisce ══ */
titolo('COME FINISCE');
{
  const s = creaPartita({ seme: 1 });
  s.azienda.cassa = -1;
  for (let i = 0; i < SCONFITTA.giorniCassaNegativa; i += 1) {
    iniziaGiornata(s); while (richiestaCorrente(s)) decidi(s, 'rifiuta');
    s.azienda.cassa = -1000; chiudiGiornata(s);
    if (s.fase !== 'finita') prossimoGiorno(s);
  }
  ok(s.esito && !s.esito.vinta && s.esito.causa === 'cassa', 'la cassa sotto zero per tre giorni e\' la fine', JSON.stringify(s.esito));

  const p = creaPartita({ seme: 2 });
  for (let i = 0; i < SCONFITTA.giorniProduttivitaBassa + 1 && p.fase !== 'finita'; i += 1) {
    iniziaGiornata(p); while (richiestaCorrente(p)) decidi(p, 'rifiuta');
    p.azienda.produttivita = 0; p.azienda.morale = 0; p.azienda.cassa = 99999; chiudiGiornata(p);
    if (p.fase !== 'finita') prossimoGiorno(p);
  }
  ok(p.esito?.causa === 'produttivita', 'e la produttivita\' a terra per tre giorni anche', JSON.stringify(p.esito));

  const o = creaPartita({ seme: 3 });
  o.persone.filter((x) => x.tipo === 'dipendente').slice(0, 12).forEach((x) => { x.attivo = false; });
  iniziaGiornata(o); while (richiestaCorrente(o)) decidi(o, 'accetta');
  o.azienda.cassa = 99999; chiudiGiornata(o);
  ok(o.esito?.causa === 'organico', 'e restare in pochi anche', JSON.stringify(o.esito));

  const v = creaPartita({ seme: 4 });
  v.giorno = PARTITA.giorni;
  v.azienda.cassa = 50000;
  iniziaGiornata(v); while (richiestaCorrente(v)) decidi(v, 'accetta');
  chiudiGiornata(v);
  ok(v.esito?.vinta && v.esito.causa === 'arrivato', 'arrivare in fondo vivi e\' la vittoria', JSON.stringify(v.esito));
}

/* ══ 15. La giornata, come e' tarata ══ */
titolo('LA GIORNATA');
{
  ok(richiesteDelGiorno(1) === 5 && richiesteDelGiorno(PARTITA.giorni) === 18, 'da cinque richieste a diciotto, in trenta giorni');
  let peggiore = 99;
  for (let g = 1; g <= PARTITA.giorni; g += 1) peggiore = Math.min(peggiore, secondiDelGiorno(g) / richiesteDelGiorno(g));
  ok(peggiore >= 9, 'mai meno di nove secondi a richiesta', `il minimo e\' ${peggiore.toFixed(1)}s`);
  let sempreSotto = true;
  for (let g = 1; g <= PARTITA.giorni; g += 1) if (managerDelGiorno(g).massimo > richiesteDelGiorno(g) / 3) sempreSotto = false;
  ok(sempreSotto, 'i manager non superano mai un terzo della fila');
  const s = creaPartita({ seme: 21 });
  iniziaGiornata(s);
  ok(s.coda.length === richiesteDelGiorno(1), 'la fila del primo giorno e\' lunga quanto deve', `${s.coda.length}`);
  ok(s.coda.every((r) => archetipoById(r.archetipo)), 'ogni richiesta punta a un archetipo che esiste');
  const s2 = gioca(21, () => 'accetta', { fino: 28 });
  const perPersona = {};
  for (const d of s2.decisioni) {
    const k = `${d.autoreId}|${d.archetipo}`;
    perPersona[k] = (perPersona[k] || 0) + 1;
  }
  const ripetuti = Object.entries(perPersona).filter(([, n]) => n > 2);
  ok(ripetuti.length === 0, 'e nessuno ripete lo stesso archetipo piu' + '\' di due volte in una partita',
    ripetuti.slice(0, 3).map(([k, n]) => `${k} x${n}`).join(', ') || 'nessuna ripetizione');
}

/* ══ 16. I due fumetti e il cavaliere ══
   Una promessa che si vede solo dal vivo, e proprio per questo va scritta
   qui: sul telefono il fumetto delle risposte non deve coprire il
   personaggio del giocatore. Le due grandezze in gioco — dove finisce il
   cavaliere nella stanza, dove comincia il fumetto nel foglio di stile —
   stanno in due file lontani e nessuno le confronta mai a occhio. Le
   confronta questa prova: sono tutte e due percentuali della stessa scena,
   quindi il paragone e' esatto a qualunque ingrandimento. */
titolo('SUL TELEFONO NIENTE SI SOVRAPPONE A NIENTE');
{
  /* Quattro rettangoli in una scena sola: i due fumetti e i due
     personaggi. La promessa e' che non se ne tocchino due, e la promessa
     vive in due file lontani — le posizioni dei personaggi in
     `contenuti/stanza.js`, quelle dei fumetti nel foglio di stile — che
     nessuno confronta mai a occhio. Sono tutte percentuali della stessa
     scena, quindi il paragone e' esatto a qualunque ingrandimento, e lo
     fa questa prova invece dello schermo di qualcuno.

     Prima si controllava solo che i due fumetti stessero lontani in
     verticale, e bastava finche' erano uno sopra e uno sotto. Ora stanno
     in due colonne, uno a sinistra e uno a destra del cavaliere, e la
     lontananza in verticale non serve piu': serve che i rettangoli non si
     intersechino, che e' la cosa che si voleva dire fin dall'inizio. */
  const qui = new URL('.', import.meta.url).pathname;
  const asset = readFileSync(join(qui, '..', 'asset.js'), 'utf8');
  const css = readFileSync(join(qui, '..', '..', '..', 'styles', 'theboss.css'), 'utf8');

  const lato = (chi) => Number(new RegExp(`'${chi}':[^}]*riquadro:\\s*(\\d+)`).exec(asset)?.[1]);
  const latoCapo = lato('capo\\.fermo');
  const latoOspite = 16;
  ok(latoCapo > 0, 'si sa quanto e\' largo il cavaliere', `${latoCapo} pixel`);

  /* E guarda chi ha davanti. I fogli lo disegnano rivolto a destra, chi
     entra si ferma alla sua sinistra: se qualcuno sposta i mobili e i due
     si scambiano di posto, questa prova lo dice prima dello schermo. */
  const versoGiusto = POSTI.visitatore.x < POSTI.capo.x ? 'sinistra' : 'destra';
  ok(POSTI.capo.guarda === versoGiusto, 'e guarda dalla parte da cui entra la gente',
    `chi entra si ferma a ${POSTI.visitatore.x}, il capo sta a ${POSTI.capo.x}: deve guardare a ${versoGiusto}`);

  /* Un personaggio: il suo riquadro, in percentuale della stanza. */
  const persona = (posto, l) => ({
    x1: (posto.x / MONDO.w) * 100, x2: ((posto.x + l) / MONDO.w) * 100,
    y1: (posto.y / MONDO.h) * 100, y2: ((posto.y + l) / MONDO.h) * 100,
  });

  /* Di blocchi per il telefono ce n'e' piu' d'uno: quello dei fumetti e'
     il solo scritto su piu' righe, e comincia con un a capo. */
  const telefono = /@media \(max-width: 700px\) \{\n([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
  const blocco = (nome) => new RegExp(`\\.tb-fumetto\\.is-${nome} \\{([\\s\\S]*?)\\}`).exec(telefono)?.[1] ?? '';
  const num = (b, prop) => Number(new RegExp(`(?:^|[;{\\s])${prop}:\\s*([\\d.]+)%`).exec(b)?.[1]);

  /* Un fumetto: si ancora a due bordi e dichiara larghezza e tetto, e i
     quattro lati si ricavano da quelli. Il tetto e' un massimo — se il
     testo e' corto il fumetto e' piu' basso — quindi il rettangolo che si
     controlla e' il piu' grande che possa diventare. */
  const fumettoRichiesta = (() => {
    const b = blocco('richiesta');
    const x1 = num(b, 'left'); const y1 = num(b, 'top');
    return { x1, x2: x1 + num(b, 'width'), y1, y2: y1 + num(b, 'max-height') };
  })();
  const fumettoScelta = (() => {
    const b = blocco('scelta');
    const y2 = 100 - num(b, 'bottom');
    return { x1: num(b, 'left'), x2: 100 - num(b, 'right'), y1: y2 - num(b, 'max-height'), y2 };
  })();

  const riquadri = [
    ['il fumetto della richiesta', fumettoRichiesta],
    ['il fumetto delle risposte', fumettoScelta],
    ['il cavaliere', persona(POSTI.capo, latoCapo)],
    ['chi ha bussato', persona(POSTI.visitatore, latoOspite)],
  ];
  ok(riquadri.every(([, r]) => Object.values(r).every(Number.isFinite)),
    'i quattro riquadri si leggono tutti', riquadri.map(([n, r]) => `${n}: ${JSON.stringify(r)}`).join(' | '));

  const sisovrappongono = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
  const scontri = [];
  for (let i = 0; i < riquadri.length; i += 1) {
    for (let j = i + 1; j < riquadri.length; j += 1) {
      if (sisovrappongono(riquadri[i][1], riquadri[j][1])) scontri.push(`${riquadri[i][0]} + ${riquadri[j][0]}`);
    }
  }
  ok(scontri.length === 0, 'nessuno dei quattro tocca nessun altro', scontri.join(', ') || 'tutti liberi');

  /* E lo spazio da leggere non e' simbolico: su una stanza alta 288 pixel
     il fumetto della richiesta deve valere almeno un quarto di schermo. */
  const alta = fumettoRichiesta.y2 - fumettoRichiesta.y1;
  ok(alta >= 40, 'e la richiesta ha spazio per essere letta', `${alta}% della scena`);
}

/* ══ Quello che non ci sta, si scorre — e si vede che si scorre ══
   Un fumetto o un report che tagliano il testo senza dirlo sono peggio di
   un fumetto piccolo: chi legge crede che la richiesta finisca li'. */
titolo('LO SCORRIMENTO SI VEDE');
{
  const qui = new URL('.', import.meta.url).pathname;
  const css = readFileSync(join(qui, '..', '..', '..', 'styles', 'theboss.css'), 'utf8');
  const scorre = /\.tb-scorre \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
  ok(/overflow-y:\s*auto/.test(scorre), 'quello che non ci sta scorre');
  ok(/scrollbar-width|::-webkit-scrollbar/.test(css), 'e la barra si vede');
  ok(/background-attachment:[^;]*local[^;]*scroll/.test(scorre),
    'e ai bordi c\'e\' l\'ombra che dice che sotto c\'e\' dell\'altro');

  /* La trappola: le ombre vivono di due sfumature del colore del fondo, e
     bastano un `background` dichiarato dopo — anche `transparent` — per
     spegnerle tutte e due senza che se ne accorga nessuno. Quindi le due
     superfici che scorrono il fondo non se lo riscrivono. */
  for (const nome of ['tb-fumetto', 'tb-report-foglio']) {
    const regola = new RegExp(`\\n\\.${nome} \\{([\\s\\S]*?)\\n\\}`).exec(css)?.[1] ?? '';
    ok(regola.length > 0 && !/(^|[;{\s])background:/.test(regola),
      `.${nome} lascia il fondo a tb-scorre`, regola.match(/background:[^;]*/)?.[0] || 'nessun fondo suo');
  }

  for (const chi of ['Fumetto', 'ReportGiornata']) {
    const jsx = readFileSync(join(qui, '..', '..', '..', 'components', 'theboss', `${chi}.jsx`), 'utf8');
    ok(jsx.includes('tb-scorre'), `${chi} lo usa`);
  }

  /* E il report, sul telefono, non si accontenta dell'altezza della
     stanza: la stanza li' e' alta 288 pixel e il consuntivo non ci sta. */
  ok(/\.tb-report \{[\s\S]*?position:\s*fixed/.test(css)
    || /@media \(max-width: 700px\) \{\s*\.tb-report \{[\s\S]*?position:\s*fixed/.test(css),
    'e sul telefono il report si appoggia allo schermo, non alla stanza');
}


/* ══ 17. L'arco della partita ══
   La cosa che si e' rotta una volta e che non deve rompersi di nuovo: il
   gioco andava in perdita il primo giorno e ci restava fino all'ultimo,
   quindi giocare bene non si vedeva. Queste prove tengono l'arco — sotto
   all'inizio, sopra in mezzo, sotto e sempre piu' sotto alla fine — senza
   dover rilanciare diecimila partite. */
titolo('L\'ARCO: SI PARTE SOTTO, SI PUO\' STARE SOPRA, POI SI STRINGE');
{
  /* Il conto di una sera, a parita' di azienda: quanto rende e quanto
     costa il giorno `g` a un'azienda messa cosi'. Non si gioca, si guarda
     solo l'economia — che e' esattamente la cosa che deve avere una forma. */
  const sera = (g, { produttivita, morale, reputazione }) => {
    const s = creaPartita({ seme: 7 });
    s.giorno = g;
    Object.assign(s.azienda, { produttivita, morale, reputazione });
    return Math.round(fatturatoDi(s) - costiDi(s));
  };
  const partenza = { produttivita: PARTENZA.produttivita, morale: PARTENZA.morale, reputazione: PARTENZA.reputazione };
  /* Un'azienda tenuta bene: e' dove arriva chi compra morale e non taglia. */
  const inForma = { produttivita: 82, morale: 95, reputazione: 66 };

  const primo = sera(1, partenza);
  ok(primo < 0, 'il primo giorno si chiude sotto', `${primo} monete`);
  ok(primo > -800, 'ma di poco: non e\' una voragine da colmare', `${primo} monete`);

  const meta = sera(12, inForma);
  ok(meta > 0, 'a meta\' partita, chi ha tenuto su il morale chiude sopra', `${meta} monete al giorno`);

  const fine = sera(PARTITA.giorni, inForma);
  ok(fine < 0, 'e la stessa azienda, alla fine, non basta piu\'', `${fine} monete`);
  ok(fine < meta - 1000, 'la stretta finale e\' una stretta vera', `da ${meta} a ${fine}`);

  /* Il rincaro e' in due tempi, e il secondo e' quello che stringe. */
  ok(rincaroDi(1) === 1, 'il primo giorno non si paga ancora niente in piu\'');
  const primaMeta = rincaroDi(ECONOMIA.rincaro.daGiorno) - 1;
  const secondaMeta = rincaroDi(PARTITA.giorni) - rincaroDi(ECONOMIA.rincaro.daGiorno);
  ok(primaMeta < 0.1, 'nella prima meta\' il regno rincara appena', `+${(primaMeta * 100).toFixed(1)}%`);
  ok(secondaMeta > primaMeta * 3, 'nella seconda cambia passo', `+${(secondaMeta * 100).toFixed(1)}%`);
}

/* ══ 18. La leva che cambia il conto di ogni sera ══
   Tutte le altre leve spostano un saldo; la struttura sposta il **flusso**.
   Senza, chi si trova in perdita non ha niente da fare: puo' perdere piu'
   piano, non puo' smettere di perdere. Il simulatore lo diceva prima che
   esistesse — accettare i tagli faceva vincere di meno, sempre. */
titolo('LA STRUTTURA');
{
  ok(LEVE.includes('struttura'), 'la struttura e\' una leva dichiarata');
  ok(PARTENZA.struttura === 1, 'si parte con la macchina com\'e\'');
  const s = creaPartita({ seme: 3 });
  const prima = costiDi(s);
  applicaGradini(s.azienda, { struttura: -4 });
  const dopo = costiDi(s);
  ok(dopo < prima, 'tagliare abbassa i costi di ogni sera', `${Math.round(prima)} → ${Math.round(dopo)}`);
  ok(s.azienda.struttura < 1 && s.azienda.struttura > LIMITI.struttura[0] - 0.001, 'e resta dentro i suoi confini');

  applicaGradini(s.azienda, { struttura: -400 });
  ok(s.azienda.struttura === LIMITI.struttura[0], 'non si puo\' tagliare all\'infinito', String(s.azienda.struttura));
  applicaGradini(s.azienda, { struttura: +400 });
  ok(s.azienda.struttura === LIMITI.struttura[1], 'ne\' appesantire all\'infinito', String(s.azienda.struttura));

  /* E la contropartita: c'e' chi la alleggerisce e c'e' chi la appesantisce.
     Se tagliassero tutti e nessuno aggiungesse, tagliare sarebbe gratis. */
  const tagliano = ARCHETIPI.filter((a) => (a.accetta?.struttura || 0) < 0);
  const appesantiscono = ARCHETIPI.filter((a) => (a.accetta?.struttura || 0) > 0);
  ok(tagliano.length >= 3, 'piu\' di una proposta alleggerisce la macchina', String(tagliano.length));
  ok(appesantiscono.length >= 2, 'e piu\' di una la appesantisce', String(appesantiscono.length));
  ok(tagliano.every((a) => (a.accetta.morale || 0) < 0 && (a.accetta.rancore || 0) > 0),
    'e nessun taglio e\' indolore: tutti costano morale e rancore');
}

/* ══ 19. Il morale porta il peso ══ */
titolo('IL MORALE E LA PRODUTTIVITA\'');
{
  const sostenuta = (morale) => RITMO.base + morale * RITMO.perMorale;
  ok(sostenuta(0) < SCONFITTA.produttivitaMinima,
    'con il morale a zero l\'officina scende sotto la soglia della sconfitta',
    `${sostenuta(0).toFixed(1)} contro ${SCONFITTA.produttivitaMinima}`);
  ok(sostenuta(100) > 90, 'e con il morale al massimo si produce quasi al massimo', sostenuta(100).toFixed(1));
  ok(sostenuta(50) < sostenuta(90) - 25, 'e in mezzo il morale pesa davvero',
    `${sostenuta(50).toFixed(0)} contro ${sostenuta(90).toFixed(0)}`);
}

/* ══ 20. I consigli di fine partita ══
   Non si prova qui che siano giusti — quello lo fa `npm run boss:consigli`
   su migliaia di partite — si prova che il meccanismo regga: che una
   partita finita produca sempre qualcosa da dire, che non ne dica dieci
   insieme, e che ogni consiglio sappia scrivere il suo testo senza
   inciampare sui numeri di una partita qualunque. */
titolo('CHE COSA FARE MEGLIO');
{
  ok(CONSIGLI.length >= 30, 'ci sono almeno trenta consigli', `${CONSIGLI.length}`);
  ok(new Set(CONSIGLI.map((c) => c.id)).size === CONSIGLI.length, 'e nessuno e\' ripetuto');
  ok(CONSIGLI.every((c) => typeof c.quando === 'function' && typeof c.testo === 'function' && typeof c.peso === 'number'),
    'ognuno sa quando uscire, che cosa dire e quanto pesa');

  /* Una partita giocata male e una giocata bene: tutte e due devono
     avere qualcosa da dire, e nessuna delle due deve inciampare. */
  for (const [come, risposta] of [['chi rifiuta tutto', () => 'rifiuta'], ['chi accetta tutto', () => 'accetta'], ['chi non risponde', () => 'scaduta']]) {
    const s = gioca(11, risposta);
    const a = analizza(s);
    const c = consigliDi(a, 3);
    ok(c.length >= 1 && c.length <= 3, `${come} riceve fra uno e tre consigli`, `${c.length}`);
    ok(c.every((x) => typeof x.testo === 'string' && x.testo.length > 40), 'e sono frasi vere, non stringhe vuote',
      c.map((x) => x.id).join(', '));
  }

  /* Il testo di ognuno deve reggere anche su una partita che non lo
     riguarda: se un consiglio si rompe quando la misura e' zero, si
     rompera' proprio nella partita di qualcuno. */
  const vuota = analizza(creaPartita({ seme: 3 }));
  const rotti = CONSIGLI.filter((c) => {
    try { return typeof c.testo(vuota) !== 'string'; } catch { return true; }
  });
  ok(rotti.length === 0, 'e nessuno si rompe su una partita appena cominciata',
    rotti.map((c) => c.id).join(', ') || 'tutti reggono');
}

console.log(falliti === 0 ? '\nTUTTO OK' : `\n${falliti} PROVE FALLITE`);
process.exit(falliti ? 1 : 0);
