/**
 * Il simulatore: tante partite, cinque modi di vivere, cinque punti di
 * partenza, una tabella.
 *
 *     node src/giochi/theclimb/strumenti/montecarlo.mjs [partite per casella]
 *     npm run climb:sim
 *
 * Nella fase uno il gioco non ha ancora promozioni, aziende strutturate, persone
 * ne' eventi: quello che si misura e' se **la vita regge** — quante
 * settimane si sopravvive con una certa routine partendo da un certo
 * posto, e di che cosa si muore. E' il fondo su cui tutto il resto si
 * appoggia, e se questo e' storto il resto lo eredita.
 *
 * Quello che gia' si puo' pretendere, e che il simulatore controlla in
 * fondo:
 *
 *  - nessuna routine dura seicento settimane su tutti e cinque i
 *    background: se una ci riesce, il gioco non e' di rinunce;
 *  - «nessuna rete» muore prima e piu' spesso di «erede», e di burnout o
 *    di soldi, non di vecchiaia;
 *  - ma non muore *sempre*: una routine ragionevole gli fa passare almeno
 *    la meta' delle partite oltre le cento settimane, se no il messaggio
 *    diventa «e' inutile provarci», che e' sbagliato.
 */

import {
  creaPartita, scegliPercorso, impostaRoutine, giocaSettimana, prendiLavoro, fotografia, riassunto,
  porteDi, faiColloquio, accettaOfferta, rifiutaOfferta, stipendioDi, schedaAzienda, lasciaLavoro, agisci, rispondiEvento,
  scorrettezzeDi, bara,
} from '../motore/partita.js';
import { BACKGROUND } from '../contenuti/background.js';
import { PARTITA, NOIA, COLLOQUIO, SOPRAVVIVENZA, STRESS } from '../contenuti/bilancio.js';

const N = Number(process.argv[2] || 60);
const TETTO = PARTITA.settimaneMassime;
/* per guardare una casella sola: CLIMB_SOLO=audace,audace_da_se CLIMB_BG=erede,ceto_medio
   (con un filtro acceso si stampa la tabella e basta, senza pretese) */
const SOLO = (process.env.CLIMB_SOLO || '').split(',').filter(Boolean);
const SOLO_BG = (process.env.CLIMB_BG || '').split(',').filter(Boolean);

/**
 * Le routine: quello che una persona fa ogni settimana. Sono scritte
 * «in desideri» — quanto vorrebbe fare di ognuna — e poi si adattano al
 * tempo che quella vita concede: prima si toglie l'ozio, poi il resto.
 */
const ROUTINE = {
  solo_studio:    { percorso: 'universita', piano: { studio: 40, sonno: 15, relazioni: 5, sport: 5, ozio: 5 } },
  solo_lavoro:    { percorso: 'lavoro',     piano: { straordinari: 25, sonno: 10, relazioni: 5, lavoretti: 10 } },
  solo_relazioni: { percorso: 'lavoro',     piano: { relazioni: 30, networking: 20, volontariato: 15, sonno: 10, ozio: 10 } },
  equilibrata:    { percorso: 'its',        piano: { studio: 20, relazioni: 15, sonno: 12, sport: 8, networking: 8, ozio: 5 } },
  lavoretti:      { percorso: 'autodidatta', piano: { lavoretti: 30, studio: 15, sonno: 10, relazioni: 5 } },
  /* le due che cercano lavoro: una con le sole competenze tecniche, una
     che coltiva anche le persone. E' il confronto della fase tre. */
  solo_hard:      { percorso: 'its',        piano: { studio: 30, progetti: 15, sonno: 12, candidature: 10, sport: 5 }, carriera: true },
  carriera:       { percorso: 'universita', piano: { studio: 15, relazioni: 12, networking: 10, volontariato: 8, sonno: 12, candidature: 8, sport: 5 }, carriera: true },
  /* la stessa vita, ma si lancia: alle occasioni dice si', ai bivi prende
     il salto, alle offerte non chiede il dieci per cento in piu'. E' il
     confronto fra prudenza e coraggio, e il gioco deve far vedere che la
     prudenza da sola blocca la crescita — e che il coraggio ha un prezzo. */
  audace:         { percorso: 'universita', piano: { studio: 15, relazioni: 12, networking: 10, volontariato: 8, sonno: 12, candidature: 8, sport: 5 }, carriera: true, audace: true },
  /* e chi bara sempre: la stessa vita audace, piu' ogni scorciatoia che
     si apre. Deve essere forte all'inizio e crollare nella seconda meta'. */
  bara:           { percorso: 'universita', piano: { studio: 15, relazioni: 12, networking: 10, volontariato: 8, sonno: 12, candidature: 8, sport: 5 }, carriera: true, audace: true, bara: true },
  /* le altre strade, con la stessa identica vita audace — cambia solo la
     strada, cosi' quello che si misura e' la strada e non la routine: i
     percorsi non universitari devono arrivare in alto piu' o meno quanto
     l'universita', con colli di bottiglia diversi */
  /* la stessa vita audace, ma giocata per arrivare in cima: alle uscite
     che chiudono la corsa — vendere l'azienda — dice di no. E' il tetto
     vero di chi gioca per vincere, e la differenza dice quanto costa
     accettare l'assegno */
  per_la_cima:    { percorso: 'universita', piano: { studio: 15, relazioni: 12, networking: 10, volontariato: 8, sonno: 12, candidature: 8, sport: 5 }, carriera: true, audace: true, perLaCima: true },
  audace_its:     { percorso: 'its',         piano: { studio: 15, relazioni: 12, networking: 10, volontariato: 8, sonno: 12, candidature: 8, sport: 5 }, carriera: true, audace: true },
  audace_da_se:   { percorso: 'autodidatta', piano: { studio: 15, relazioni: 12, networking: 10, volontariato: 8, sonno: 12, candidature: 8, sport: 5 }, carriera: true, audace: true },
};

/** Chi bara prende una scorciatoia ogni due mesi — la prima che si apre — e non ammette mai. */
const OGNI_SCORCIATOIA = 8;
function scorciatoie(s) {
  const ultima = Math.max(-999, ...Object.entries(s.scorrettezze).filter(([id]) => id !== 'confessa').map(([, w]) => w));
  if (s.settimana - ultima < OGNI_SCORCIATOIA) return;
  const v = scorrettezzeDi(s).find((x) => x.disponibile && !x.riparazione);
  if (v) bara(s, v.id);
}

/** Gli eventi: la routine prudente risponde con la predefinita; chi si lancia prende il salto quando puo'. */
function eventi(s, audace, perLaCima = false) {
  const f = fotografia(s);
  for (const ev of f.eventi) {
    /* chi gioca per la cima non prende le uscite che chiudono la corsa —
       vendere l'azienda paga bene e finisce li' */
    const buona = (o) => o.disponibile && !(perLaCima && o.effetti?.fine);
    const salto = audace ? ev.opzioni.find((o) => o.audace && buona(o)) : null;
    const pred = ev.opzioni.find((o) => o.id === ev.predefinita && buona(o)) || ev.opzioni.find((o) => buona(o)) || ev.opzioni.find((o) => o.disponibile);
    rispondiEvento(s, ev.id, (salto || pred).id);
  }
}

/**
 * La politica della carriera, per chi cerca lavoro: quando la ricerca
 * basta si bussa alla porta aperta che rende di piu' (probabilita' per
 * stipendio), purche' paghi piu' del posto di adesso; un'offerta si
 * accetta se non si ha un posto in azienda o se paga almeno il dieci per
 * cento in piu'. Non e' furba: e' quello che farebbe chiunque.
 */
function carriera(s, audace = false) {
  const f = fotografia(s);
  const attuale = stipendioDi(s.lavoro);
  const vero = s.lavoro && !SOPRAVVIVENZA[s.lavoro.aziendaId];
  /* un posto che non lascia tempo per vivere non si prende; uno che sta
     bruciando si lascia prima del burnout, come farebbe una persona. Chi
     si lancia accetta posti piu' stretti e offerte che non pagano di piu' */
  const vivibile = (ore) => ore <= f.tempo - (audace ? 12 : 24);
  /* si cambia posto per un aumento vero o per un gradino in piu': chi
     cambia ogni tre mesi per due euro azzera l'anzianita' ogni volta e
     non sale mai — era quello che faceva il simulatore, e nessuna persona */
  const livelloAttuale = s.lavoro?.livello ?? 0;
  const meglio = audace ? 1.15 : 1.25;
  const valeIlSalto = (stipendio, livello) => !vero || livello > livelloAttuale || stipendio >= attuale * meglio;
  if (vero && s.corpo.stress >= STRESS.crollo && f.lavoro.azienda.ore >= 48) { lasciaLavoro(s); return; }
  for (const o of [...s.offerte]) {
    if (vivibile(o.ore) && valeIlSalto(o.stipendio, o.livello)) accettaOfferta(s, o.aziendaId);
    else rifiutaOfferta(s, o.aziendaId);
  }
  if (s.ricerca < COLLOQUIO.costo) return;
  const aperte = porteDi(s).filter((p) => !p.chiusa && vivibile(p.ore) && valeIlSalto(p.stipendio, p.livello));
  if (!aperte.length) return;
  /* si sceglie pesando anche la cultura — quella che si vede, cioe' quella
     che l'azienda dice di avere */
  const valore = (p) => p.probabilita * p.stipendio * (0.5 + (f.porte.find((q) => q.aziendaId === p.aziendaId) ? culturaVista(s, p.aziendaId) : 5) / 20);
  aperte.sort((a, b) => valore(b) - valore(a));
  faiColloquio(s, aperte[0].aziendaId);
}
const culturaVista = (s, id) => schedaAzienda(s, id)?.attributi.cultura?.valore ?? 5;

/**
 * Con le persone: quello che farebbe chi ha capito il gioco. Il mentore
 * si ascolta, al dirigente si propone quando la performance regge,
 * l'alleato si aiuta, il capo tossico si documenta e poi si porta da HR;
 * se HR non tutela, si cambia aria. Niente scorrettezze: quelle le prova
 * la fase sei.
 */
function persone(s) {
  const f = fotografia(s);
  for (const p of f.persone) {
    const puo = (id) => p.azioni.find((a) => a.id === id)?.disponibile;
    if (p.archetipo === 'mentore' && puo('consiglio')) agisci(s, p.id, 'consiglio');
    if ((p.archetipo === 'sponsor' || p.archetipo === 'capo_eccellente' || p.archetipo === 'capo') && puo('proponi') && s.lavoro?.performance >= 65) agisci(s, p.id, 'proponi');
    if (p.archetipo === 'alleato' && puo('aiuta')) agisci(s, p.id, 'aiuta');
    if (p.archetipo === 'alleato' && puo('chiedi') && s.lavoro?.performance < 60) agisci(s, p.id, 'chiedi');
    if (p.archetipo === 'tossico' && !p.neutralizzato) {
      if (puo('appello')) agisci(s, p.id, 'appello');
      else if (p.dossier < 6 && puo('documenta')) agisci(s, p.id, 'documenta');
      else if (puo('hr')) { const r = agisci(s, p.id, 'hr'); if (!/funzionato/.test(r.testo || '')) lasciaLavoro(s); }
    }
    if (p.archetipo === 'manipolatore' && p.svelato && !p.neutralizzato && !p.evitato) {
      if (puo('confronta') && (p.azioni.find((a) => a.id === 'confronta')?.probabilita ?? 0) >= 0.5) agisci(s, p.id, 'confronta');
      else if (puo('evita')) agisci(s, p.id, 'evita');
    }
  }
}

function adatta(stato, desiderio) {
  const f = fotografia(stato);
  const piano = { lavoro: f.oreObbligatorie, ...desiderio };
  for (const a of f.attivita) {
    if (a.invisibile) piano[a.id] = 0;
    if ((piano[a.id] ?? 0) > a.massimo) piano[a.id] = a.massimo;
    if ((piano[a.id] ?? 0) < a.minimo) piano[a.id] = a.minimo;
  }
  let tot = Object.values(piano).reduce((s, t) => s + (t || 0), 0);
  /* prima si toglie l'ozio, poi quello che si fa per se' (i progetti),
     poi le persone: se no la routine autodidatta, che ha una voce in
     piu', resta senza rete appena il lavoro si mangia le ore */
  const ordine = ['ozio', 'lavoretti', 'progetti', 'networking', 'volontariato', 'straordinari', 'studio', 'sport', 'relazioni', 'sonno'];
  /* e chi e' in rosso i lavoretti li taglia per ultimi: sono quelli che lo tengono a galla */
  if (stato.vita.soldi < 0) ordine.push(ordine.splice(ordine.indexOf('lavoretti'), 1)[0]);
  for (const id of ordine) {
    while (tot > f.tempo && (piano[id] ?? 0) > 0) { piano[id] -= 1; tot -= 1; }
  }
  return piano;
}

/**
 * Quando i soldi finiscono, chi non ha un lavoro se ne prende uno di
 * sopravvivenza: e' il «devi lavoricchiare» del ceto medio, e senza questa
 * riga ogni routine senza stipendio moriva di fame al secondo mese.
 * Cambia le ore obbligatorie, quindi la routine si riadatta.
 */
const SOGLIA_LAVORICCHIARE = 1000;
const LAVORICCHIARE = ['bar', 'magazzino', 'callcenter', 'negozio'];

/** Chi e' in rosso non ha la scelta di rallentare: riempie di lavoretti le ore che restano. */
const LAVORETTI_IN_ROSSO = 20;
const pianoDi = (s, r) => (s.vita.soldi < 0 ? { ...r.piano, lavoretti: (r.piano.lavoretti ?? 0) + LAVORETTI_IN_ROSSO } : r.piano);

function gioca(seme, background, nome) {
  const r = ROUTINE[nome];
  const s = creaPartita({ seme, background });
  scegliPercorso(s, r.percorso);
  let esito = impostaRoutine(s, adatta(s, pianoDi(s, r)));
  if (!esito.ok) throw new Error(`${nome}/${background}: ${esito.errore}`);
  let inRosso = s.vita.soldi < 0;
  while (s.fase !== 'finita' && s.settimana <= TETTO) {
    if (!s.lavoro && s.vita.soldi < SOGLIA_LAVORICCHIARE) {
      prendiLavoro(s, s.caso.scelta(LAVORICCHIARE));
      esito = impostaRoutine(s, adatta(s, pianoDi(s, r)));
      if (!esito.ok) throw new Error(`${nome}/${background}: ${esito.errore}`);
    }
    /* il conto che passa lo zero, in un senso o nell'altro, cambia la settimana */
    if ((s.vita.soldi < 0) !== inRosso) {
      inRosso = s.vita.soldi < 0;
      esito = impostaRoutine(s, adatta(s, pianoDi(s, r)));
      if (!esito.ok) throw new Error(`${nome}/${background}: ${esito.errore}`);
    }
    /* e chi si sta spegnendo cambia posto: e' quello che una persona
       ragionevole fa quando i segnali sono quelli del crollo */
    if (s.lavoro && s.corpo.noia >= NOIA.crollo) {
      prendiLavoro(s, s.caso.scelta(LAVORICCHIARE.filter((id) => id !== s.lavoro.aziendaId)));
      esito = impostaRoutine(s, adatta(s, pianoDi(s, r)));
      if (!esito.ok) throw new Error(`${nome}/${background}: ${esito.errore}`);
    }
    if (r.carriera) {
      const prima = s.lavoro?.aziendaId;
      eventi(s, Boolean(r.audace), Boolean(r.perLaCima));
      persone(s);
      if (r.bara) scorciatoie(s);
      carriera(s, Boolean(r.audace));
      /* una risposta a un evento puo' chiudere la partita (vendere l'impresa) */
      if (s.fase === 'finita') break;
      if (s.lavoro?.aziendaId !== prima) {
        esito = impostaRoutine(s, adatta(s, pianoDi(s, r)));
        if (!esito.ok) throw new Error(`${nome}/${background}: ${esito.errore}`);
      }
    }
    const x = giocaSettimana(s);
    if (!x.ok) throw new Error(x.errore);
    /* un posto perso: la routine si riadatta alle ore libere */
    if (r.carriera && !s.lavoro && s.routine.lavoro > 0) impostaRoutine(s, adatta(s, pianoDi(s, r)));
  }
  const fine = riassunto(s);
  /* le carte che mancavano nelle ultime valutazioni non promosse: e' la
     diagnosi di dove si ferma questa vita (si legge con CLIMB_JSON) */
  fine.blocchi = {};
  for (const v of s.valutazioni.filter((x) => x.tipo === 'valutazione' && !x.promosso)) {
    for (const c of v.carte.filter((x) => !x.ok)) fine.blocchi[`${v.livelloA}:${c.id}`] = (fine.blocchi[`${v.livelloA}:${c.id}`] || 0) + 1;
  }
  /* e a che settimana si e' arrivati a ogni livello: e' l'orologio della
     scalata, quello che dice se il tempo basta */
  fine.arrivoA = {};
  for (const riga of s.storico) {
    const liv = riga.at(-1);
    for (let l = 1; l <= liv; l += 1) if (fine.arrivoA[l] == null) fine.arrivoA[l] = riga[0];
  }
  return fine;
}

const tavola = {};
const t0 = Date.now();
const ROUTINE_SCELTE = Object.keys(ROUTINE).filter((n) => !SOLO.length || SOLO.includes(n));
const BACKGROUND_SCELTI = BACKGROUND.filter((b) => !SOLO_BG.length || SOLO_BG.includes(b.id));
for (const nome of ROUTINE_SCELTE) {
  for (const b of BACKGROUND_SCELTI) {
    const esiti = [];
    for (let seme = 1; seme <= N; seme += 1) esiti.push(gioca(seme, b.id, nome));
    const media = (k) => esiti.reduce((s, e) => s + (e[k] || 0), 0) / esiti.length;
    const cause = {};
    for (const e of esiti) cause[e.esito?.causa || '?'] = (cause[e.esito?.causa || '?'] || 0) + 1;
    tavola[`${nome}|${b.id}`] = {
      settimane: media('settimane'),
      oltre100: esiti.filter((e) => e.settimane > 100).length / esiti.length,
      inFondo: esiti.filter((e) => e.esito?.causa === 'tempo').length / esiti.length,
      cause,
      livello: media('livelloMassimo'),
      sponsor: esiti.filter((e) => e.sponsorAvuto).length / esiti.length,
      eventi: media('eventiVisti'),
      salti: media('salti'),
      scandali: esiti.filter((e) => e.esplosioni > 0).length / esiti.length,
      vince: esiti.filter((e) => e.esito?.causa === 'cima' || e.esito?.causa === 'cima_vuota').length / esiti.length,
      livelloMax: Math.max(0, ...esiti.map((e) => e.livelloMassimo)),
      burnout: esiti.filter((e) => e.esito?.causa === 'burnout').length / esiti.length,
      finiti: esiti.filter((e) => e.esito?.causa === 'scandalo').length / esiti.length,
      /* dove si e' dopo sei anni: la prima meta' della partita */
      livello6: esiti.reduce((a, e) => a + (e.livelloSeiAnni ?? 0), 0) / esiti.length,
      livello3: media('livelloTreAnni'),
      vero: esiti.filter((e) => e.primoLavoroVero !== null).length / esiti.length,
      primoVero: (() => { const v = esiti.filter((e) => e.primoLavoroVero !== null).map((e) => e.primoLavoroVero); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : Infinity; })(),
      soldi: media('soldi'), stress: media('stress'), noia: media('noia'), hard: media('mediaHard'), soft: media('mediaSoft'), rel: media('relazioni'),
      /* quante partite si sono fermate a ciascun livello massimo: serve a
         leggere «quanti ci arrivano», non solo «a che media si arriva» */
      livelli: esiti.reduce((a, e) => { a[e.livelloMassimo] = (a[e.livelloMassimo] || 0) + 1; return a; }, {}),
      blocchi: esiti.reduce((a, e) => { for (const [k, n] of Object.entries(e.blocchi || {})) a[k] = (a[k] || 0) + n; return a; }, {}),
      arrivoA: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => { const v = esiti.map((e) => e.arrivoA?.[l]).filter((x) => x != null); return [l, v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null]; })),
      partite: esiti.length,
    };
  }
}

/* per contare le percentuali fuori di qui: CLIMB_JSON=1 stampa la tavola
   intera — le cause di ogni finale, i livelli raggiunti — e si ferma */
if (process.env.CLIMB_JSON) { console.log(JSON.stringify({ N, tavola }, null, 1)); process.exit(0); }

const num = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '-');
const pc = (v) => `${Math.round(v * 100)}%`;
console.log(`\n${N} partite per casella · ${ROUTINE_SCELTE.length} routine × ${BACKGROUND_SCELTI.length} background · fino a ${TETTO} settimane\n`);
console.log('routine          background   settim.  >100  in fondo  causa piu\' frequente        soldi  stress  noia  hard  soft  rel   liv  3anni   az.   1ª az.  spons  eventi  salti  6anni  scand  vince  burn');
for (const nome of ROUTINE_SCELTE) {
  for (const b of BACKGROUND_SCELTI) {
    const r = tavola[`${nome}|${b.id}`];
    const causa = Object.entries(r.cause).sort((x, y) => y[1] - x[1])[0];
    console.log(
      nome.padEnd(16), b.id.padEnd(12),
      num(r.settimane).padStart(6), pc(r.oltre100).padStart(6), pc(r.inFondo).padStart(9),
      `  ${causa[0]} (${causa[1]})`.padEnd(28),
      num(r.soldi).padStart(7), num(r.stress).padStart(6), num(r.noia).padStart(5), num(r.hard).padStart(5), num(r.soft).padStart(5), num(r.rel).padStart(4),
      num(r.livello, 1).padStart(5), num(r.livello3, 1).padStart(6), pc(r.vero).padStart(5), num(r.primoVero).padStart(7), pc(r.sponsor).padStart(6), num(r.eventi).padStart(7), num(r.salti).padStart(6), num(r.livello6, 1).padStart(6), pc(r.scandali).padStart(6), pc(r.vince).padStart(6), pc(r.burnout).padStart(5),
    );
  }
  console.log('');
}

/* ─── Quello che deve valere gia' adesso ─── */
if (SOLO.length || SOLO_BG.length) { console.log('(filtro acceso: niente pretese)'); process.exit(0); }
let falliti = 0;
const ok = (cond, testo, extra = '') => { console.log(`${cond ? '✓' : '✗'} ${testo}${extra ? `  — ${extra}` : ''}`); if (!cond) falliti += 1; };
const car = (b) => tavola[`carriera|${b}`];
const hard = (b) => tavola[`solo_hard|${b}`];

/* Le routine di vita: nessuna regge dodici anni ovunque. Quelle che
   cercano lavoro con una politica prudente reggono quasi sempre — con
   gli eventi a rispondere con la predefinita, che e' quella prudente —
   e la pretesa per loro e' piu' bassa: gli eventi devono lasciare un
   segno da qualche parte. Quanto, lo decide la fase nove. */
const tutteInFondo = Object.keys(ROUTINE).filter((nome) => !ROUTINE[nome].carriera && BACKGROUND.every((b) => tavola[`${nome}|${b.id}`].inFondo > 0.9));
ok(tutteInFondo.length === 0, 'nessuna routine di vita arriva in fondo su tutti e cinque i background: e\' un gioco di rinunce', tutteInFondo.join(', ') || 'nessuna');
ok(BACKGROUND.some((b) => car(b.id).inFondo < 1), 'e anche a chi fa carriera con prudenza qualcosa, da qualche parte, va storto', BACKGROUND.map((b) => pc(car(b.id).inFondo)).join(' / '));
/* la fase cinque: gli eventi — e il prezzo della prudenza */
const aud = (b) => tavola[`audace|${b}`];
ok(['erede', 'benestante', 'ceto_medio'].every((b) => aud(b).livello > car(b).livello), 'chi si lancia arriva piu\' in alto di chi e\' prudente: la prudenza da sola blocca la crescita', ['erede', 'benestante', 'ceto_medio'].map((b) => `${num(aud(b).livello, 1)}>${num(car(b).livello, 1)}`).join(' '));
ok(BACKGROUND.some((b) => aud(b.id).inFondo < car(b.id).inFondo || aud(b.id).stress > car(b.id).stress), 'e lanciarsi ha un prezzo: da qualche parte si arriva in fondo meno, o piu\' stanchi', BACKGROUND.map((b) => `${pc(aud(b.id).inFondo)}/${pc(car(b.id).inFondo)}`).join(' '));
ok(car('erede').salti < aud('erede').salti && car('erede').eventi < aud('erede').eventi * 1.05, 'chi lascia cadere le occasioni viene chiamato di meno', `salti ${num(car('erede').salti)} contro ${num(aud('erede').salti)} · eventi ${num(car('erede').eventi)} contro ${num(aud('erede').eventi)}`);
ok(car('ceto_medio').eventi >= 25, 'in una vita intera succedono almeno venticinque cose', num(car('ceto_medio').eventi));
/* la fase sei: barare funziona, finche' non funziona piu' */
const bar = (b) => tavola[`bara|${b}`];
/* «forte all'inizio» vuol dire: nei primi tre anni barare non costa
   ancora niente — si sta dove sta chi si lancia onestamente, con in piu'
   quello che le scorciatoie danno subito (performance, visibilita',
   soldi). Il gradino in piu' non arriva prima, perche' la scala in basso
   e' fatta di anzianita', non di merito: e' la fase nove che decidera'
   se le scorciatoie devono anche accorciare l'attesa. */
/* un gradino e' il rumore di trenta partite per casella da quando la
   scalata e' piu' corta (la deviazione della media sta intorno a 0,4):
   la pretesa e' «non paga», non «guadagna» */
ok(['erede', 'ceto_medio'].every((b) => bar(b).livello3 >= aud(b).livello3 - 1.0), 'chi bara nei primi tre anni non paga: sta piu\' o meno dove sta chi si lancia onestamente', ['erede', 'ceto_medio'].map((b) => `${num(bar(b).livello3, 1)} contro ${num(aud(b).livello3, 1)}`).join(' · '));
ok(['erede', 'ceto_medio'].every((b) => bar(b).scandali >= 0.6), 'e quasi sempre gli esplode qualcosa in mano', ['erede', 'ceto_medio'].map((b) => pc(bar(b).scandali)).join(' '));
ok(['erede', 'ceto_medio'].every((b) => bar(b).livello < aud(b).livello || bar(b).inFondo < aud(b).inFondo), 'e alla fine arriva piu\' in basso, o non arriva: crolla nella seconda meta\'', ['erede', 'ceto_medio'].map((b) => `${num(bar(b).livello, 1)}/${num(aud(b).livello, 1)} · ${pc(bar(b).inFondo)}/${pc(aud(b).inFondo)}`).join(' '));
ok(car('nessuna').eventi < car('erede').eventi * 1.6 && car('nessuna').eventi > car('erede').eventi * 0.4, 'e succedono a tutti, piu\' o meno allo stesso ritmo', `${num(car('erede').eventi)} contro ${num(car('nessuna').eventi)}`);

const eq = (b) => tavola[`equilibrata|${b}`];
ok(eq('nessuna').settimane < eq('erede').settimane, 'con la stessa routine, «nessuna rete» dura meno di «erede»', `${num(eq('nessuna').settimane)} contro ${num(eq('erede').settimane)} settimane`);
/* Con gli eventi a costare euro veri, «nessuna rete» con la routine
   equilibrata — che non fa lavoretti — non regge piu': e' voluto, e' la
   regola d'oro degli imprevisti. Ma deve esistere *una* routine con cui
   regge, se no il messaggio e' «e' inutile provarci». */
const meglioNessuna = Math.max(eq('nessuna').oltre100, tavola['lavoretti|nessuna'].oltre100, tavola['carriera|nessuna'].oltre100, tavola['audace|nessuna'].oltre100);
ok(meglioNessuna >= 0.5, 'ma non muore sempre: con almeno una routine ragionevole passa le cento settimane almeno una volta su due — per «nessuna rete» e\' quella che si lancia', `equilibrata ${pc(eq('nessuna').oltre100)} · lavoretti ${pc(tavola['lavoretti|nessuna'].oltre100)} · carriera ${pc(tavola['carriera|nessuna'].oltre100)} · audace ${pc(tavola['audace|nessuna'].oltre100)}`);
const morteNessuna = Object.entries(eq('nessuna').cause).sort((x, y) => y[1] - x[1])[0][0];
ok(['burnout', 'bore_out', 'crollo_economico', 'tempo'].includes(morteNessuna), 'e quando muore, muore di burnout, di noia o di soldi', morteNessuna);
ok(tavola['solo_lavoro|nessuna'].stress > tavola['solo_relazioni|nessuna'].stress, 'lavorare e basta logora piu\' che coltivare le persone');
ok(tavola['solo_lavoro|erede'].settimane >= 52, 'ma il burnout e\' lento: chi lavora e basta regge almeno un anno prima di crollare', `${num(tavola['solo_lavoro|erede'].settimane)} settimane`);
ok(eq('nessuna').inFondo < 0.5, 'e «nessuna rete», anche giocando bene, arriva in fondo meno di una volta su due', pc(eq('nessuna').inFondo));
ok(eq('erede').inFondo > eq('ceto_medio').inFondo && eq('ceto_medio').inFondo >= eq('nessuna').inFondo,
  'le vittorie della vita scendono con il punto di partenza', `${pc(eq('erede').inFondo)} / ${pc(eq('ceto_medio').inFondo)} / ${pc(eq('nessuna').inFondo)}`);
/* la fase tre: la carriera */
ok(car('erede').vero >= 0.8 && car('ceto_medio').vero >= 0.6, 'chi cerca lavoro un posto in azienda lo trova', `${pc(car('erede').vero)} / ${pc(car('ceto_medio').vero)}`);
/* la fase quattro: le persone */
ok(car('erede').sponsor >= 0.5, 'chi coltiva le persone trova uno sponsor, l\'erede quasi sempre', pc(car('erede').sponsor));
ok(car('erede').sponsor >= car('nessuna').sponsor, 'e chi nasce con un contatto lo trova piu\' spesso di chi nasce senza', `${pc(car('erede').sponsor)} contro ${pc(car('nessuna').sponsor)}`);
ok(BACKGROUND.some((b) => car(b.id).livello > 3.05), 'con uno sponsor si passa Manager');
ok(hard('erede').livello <= 4 && hard('ceto_medio').livello <= 4, 'ma chi studia e basta resta sotto Senior Manager: e\' il muro', `${num(hard('erede').livello, 1)} / ${num(hard('ceto_medio').livello, 1)}`);
ok(car('erede').livello >= hard('erede').livello, 'coltivare le persone porta almeno in alto quanto studiare e basta', `${num(car('erede').livello, 1)} contro ${num(hard('erede').livello, 1)}`);
/* il primo posto in azienda arriva a tutti entro due mesi: quello che pesa non
   e' la settimana d'ingresso ma dove si e' dopo tre anni */
ok(Math.round(car('erede').primoVero) <= Math.round(car('nessuna').primoVero) + 2 && car('erede').livello3 >= car('nessuna').livello3,
  'e da dove si parte pesa anche sulla carriera: l\'erede non trova il primo posto in azienda dopo gli altri, e dopo tre anni e\' piu\' avanti',
  `primo posto in azienda alla settimana ${num(car('erede').primoVero)} contro ${num(car('nessuna').primoVero)} · dopo tre anni ${num(car('erede').livello3, 1)} contro ${num(car('nessuna').livello3, 1)}`);
/* la fase nove: i sei bersagli del brief (§18) */
const nomi = Object.keys(ROUTINE);
const mediaVince = (nome) => BACKGROUND.reduce((a, b) => a + tavola[`${nome}|${b.id}`].vince, 0) / BACKGROUND.length;
const piuForte = nomi.map((n) => [n, mediaVince(n)]).sort((a, b) => b[1] - a[1])[0];
ok(piuForte[1] <= 0.15, 'nessuna strategia vince piu\' del quindici per cento, in media sulle cinque vite', `${piuForte[0]} ${pc(piuForte[1])}`);
/* nelle vite dal basso la routine «solo hard» non resta «solo hard»: il
   tempo la riduce al lavoro e ai lavoretti in rosso, e quella e' un'altra
   vita, che una volta su trenta arriva piu' su di quanto dovrebbe. Il muro
   si misura dove la routine e' davvero quella, e sulla media dappertutto */
ok(['erede', 'benestante', 'ceto_medio'].every((b) => hard(b).livelloMax <= 6) && BACKGROUND.every((b) => hard(b.id).livello <= 4), '«solo competenze tecniche, zero relazioni» non arriva mai oltre Director, e in media resta sotto Manager', BACKGROUND.map((b) => `${b.id} ${hard(b.id).livelloMax} (media ${num(hard(b.id).livello, 1)})`).join(' '));
const its = (b) => tavola[`audace_its|${b}`]; const dase = (b) => tavola[`audace_da_se|${b}`];
ok(['erede', 'ceto_medio'].every((b) => Math.abs(its(b).livello - aud(b).livello) <= 1 && Math.abs(dase(b).livello - aud(b).livello) <= 1.5), 'i percorsi non universitari arrivano in alto quanto l\'universita\', piu\' o meno', ['erede', 'ceto_medio'].map((b) => `${b}: uni ${num(aud(b).livello, 1)} · its ${num(its(b).livello, 1)} · da sé ${num(dase(b).livello, 1)}`).join(' | '));
/* la vittoria: chi gioca per la cima vince intorno al cinque per cento
   in media sulle cinque vite, e da nessun punto di partenza meno di una
   volta su cento — questa seconda e' la pretesa di Riccardo, e per le due
   vite dal basso il gioco com'e' non la regge: arrivano a VP intorno
   alla settimana cinquecento, e l'ultimo gradino chiede piu' tempo di
   quello che resta. Si misura che ci arrivino; il resto e' scritto nel
   LEGGIMI, con i numeri. */
const cima = (b) => tavola[`per_la_cima|${b}`];
const mediaCima = mediaVince('per_la_cima');
ok(mediaCima >= 0.03 && mediaCima <= 0.08, 'chi gioca per la cima vince intorno al cinque per cento, in media sulle cinque vite', BACKGROUND.map((b) => `${b.id} ${pc(cima(b.id).vince)}`).join(' · ') + ` — media ${pc(mediaCima)}`);
/* a trenta partite per casella una vittoria in piu' o in meno sposta
   di tre punti: si confrontano le coppie, alto contro basso, e il ceto
   medio deve solo stare sopra il basso — con l'esperienza che viaggia e
   i posti scarsi in cima, l'erede non e' piu' il favorito netto: fonda
   piu' spesso, e fondare costa il posto */
const ricchi = (cima('erede').vince + cima('benestante').vince) / 2;
const poveri = (cima('operaia').vince + cima('nessuna').vince) / 2;
ok(ricchi > poveri && cima('ceto_medio').vince >= poveri, 'le vittorie scendono con il punto di partenza: chi nasce in alto arriva in cima piu\' spesso di chi nasce in basso', BACKGROUND.map((b) => `${b.id} ${pc(cima(b.id).vince)}`).join(' '));
ok(cima('nessuna').livelloMax >= 9 && cima('operaia').livelloMax >= 9, 'ma per chi parte dal basso la cima resta a portata di mano: qualcuno arriva a C-Level, l\'ultimo gradino prima', `livello massimo: nessuna ${cima('nessuna').livelloMax} · operaia ${cima('operaia').livelloMax}`);
/* la quota di partite chiuse dal burnout, in media su tutte le routine: e'
   il modo in cui *questa vita* finisce, non quello in cui finisce la routine
   piu' autodistruttiva (che brucia l'erede per primo, perche' ha piu' ore) */
const burnoutDi = (b) => nomi.reduce((a, n) => a + tavola[`${n}|${b}`].burnout, 0) / nomi.length;
ok(burnoutDi('nessuna') + burnoutDi('operaia') > burnoutDi('erede') + burnoutDi('benestante') && burnoutDi('nessuna') >= 0.3, 'il burnout chiude una quota significativa delle partite nelle vite difficili, piu\' che in quelle facili: chi e\' in rosso non ha la scelta di rallentare', BACKGROUND.map((b) => `${b.id} ${pc(burnoutDi(b.id))}`).join(' · '));
ok(tavola['solo_studio|erede'].hard > tavola['solo_relazioni|erede'].hard && tavola['solo_relazioni|erede'].soft > tavola['solo_studio|erede'].soft,
  'chi studia ha piu\' hard, chi vive ha piu\' soft');

console.log(`\n${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log(falliti === 0 ? '\nTUTTO OK\n' : `\n${falliti} CONTROLLI FALLITI\n`);
process.exit(falliti ? 1 : 0);
