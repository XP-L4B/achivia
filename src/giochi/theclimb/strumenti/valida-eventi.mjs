/**
 * Il controllo della banca degli eventi.
 *
 *     node src/giochi/theclimb/strumenti/valida-eventi.mjs
 *     npm run climb:eventi
 *
 * Si lancia su ogni lotto nuovo. Controlla:
 *
 *  1. **Lo schema**: campi, categoria fra le quattro, da due a quattro
 *     opzioni, la predefinita esiste, i testi ci sono e non sono muri.
 *  2. **Gli id sono unici**, in tutti i lotti insieme.
 *  3. **Il vocabolario**: ogni chiave di `quando`, di `richiede` e di
 *     `effetti` e' fra quelle che il motore sa leggere. Una parola nuova
 *     qui e' un evento che scatta mai o fa niente, in silenzio.
 *  4. **Le porte chiuse**: ogni id in `background.invisibili` e' un evento
 *     con moltiplicatore zero per quella vita e `porta: true`; e ogni
 *     evento con uno zero ha `porta: true`, se no la porta sparisce invece
 *     di vedersi.
 *  5. **La copertura**: almeno venti eventi per categoria, almeno
 *     centoventi in tutto.
 *  6. **I doppioni**: due eventi che dicono la stessa cosa con parole
 *     diverse, per trigrammi (segnala, non cancella).
 *  7. **Le condizioni morte**: si giocano un po' di vite — cinque
 *     background, tre modi di vivere, qualche seme — e si guarda quali
 *     eventi non scattano mai. Un evento che non scatta in centoventi
 *     vite intere e' quasi certamente scritto con una condizione che non
 *     si verifica.
 */

import { EVENTI, CATEGORIE, CHIAVI_QUANDO, CHIAVI_EFFETTI } from '../contenuti/eventi/indice.js';
import { BACKGROUND } from '../contenuti/background.js';
import { AZIENDE } from '../contenuti/aziende.js';
import { COMPETENZE } from '../contenuti/competenze.js';
import {
  creaPartita, scegliPercorso, impostaRoutine, giocaSettimana, prendiLavoro, fotografia, accettaOfferta, porteDi, faiColloquio, stipendioDi, rispondiEvento,
} from '../motore/partita.js';
import { SOPRAVVIVENZA, COLLOQUIO } from '../contenuti/bilancio.js';

const problemi = [];
const avvisi = [];
const MAX_TESTO = 320;
const SOGLIA_DOPPIONE = 0.6;
const MAI_TOLLERATI = 8;

/* ─── 1–5: lo schema e le regole ─── */
const ids = new Set();
const perCategoria = {};
const idAziende = new Set(AZIENDE.map((a) => a.id));
const idCompetenze = new Set(COMPETENZE.map((c) => c.id));
const idBackground = new Set(BACKGROUND.map((b) => b.id));

function controllaEffetti(dove, effetti) {
  for (const [k, v] of Object.entries(effetti ?? {})) {
    if (!CHIAVI_EFFETTI.has(k)) { problemi.push(`${dove}: effetto sconosciuto «${k}»`); continue; }
    if (k === 'offerta' && !idAziende.has(v)) problemi.push(`${dove}: offerta da un'azienda che non esiste «${v}»`);
    if (k === 'competenze') for (const c of Object.keys(v)) if (!idCompetenze.has(c)) problemi.push(`${dove}: competenza sconosciuta «${c}»`);
    if (k === 'lavoro' && v !== 'perdi') problemi.push(`${dove}: lavoro puo' essere solo 'perdi'`);
    if (k === 'ritardo') { if (!(v.settimane > 0) || !v.testo) problemi.push(`${dove}: ritardo senza settimane o senza testo`); controllaEffetti(`${dove}/ritardo`, v.effetti); }
    if (k === 'persona' && !v?.archetipo) problemi.push(`${dove}: persona senza archetipo`);
    if (typeof v === 'number' && k !== 'soldi' && k !== 'posti' && Math.abs(v) > 40) problemi.push(`${dove}: «${k}» ${v} e' un numero da bilancio, non un gradino`);
  }
}
function controllaQuando(dove, quando) {
  for (const [k, v] of Object.entries(quando ?? {})) {
    if (!CHIAVI_QUANDO.has(k)) problemi.push(`${dove}: condizione sconosciuta «${k}»`);
    if ((k === 'background' || k === 'nonBackground') && !v.every((b) => idBackground.has(b))) problemi.push(`${dove}: background sconosciuto in «${k}»`);
  }
}

for (const ev of EVENTI) {
  const dove = ev.id || '(senza id)';
  if (!ev.id) problemi.push('un evento senza id');
  if (ids.has(ev.id)) problemi.push(`id ripetuto: ${ev.id}`);
  ids.add(ev.id);
  if (!CATEGORIE.includes(ev.categoria)) problemi.push(`${dove}: categoria «${ev.categoria}»`);
  perCategoria[ev.categoria] = (perCategoria[ev.categoria] || 0) + 1;
  if (!ev.titolo || !ev.testo) problemi.push(`${dove}: manca il titolo o il testo`);
  if ((ev.testo || '').length > MAX_TESTO) problemi.push(`${dove}: testo troppo lungo (${ev.testo.length})`);
  if (!Array.isArray(ev.opzioni) || ev.opzioni.length < 2 || ev.opzioni.length > 4) problemi.push(`${dove}: servono da due a quattro opzioni`);
  if (!ev.opzioni?.some((o) => o.id === ev.predefinita)) problemi.push(`${dove}: la predefinita «${ev.predefinita}» non esiste`);
  const idOpz = new Set();
  for (const o of ev.opzioni ?? []) {
    if (idOpz.has(o.id)) problemi.push(`${dove}: opzione ripetuta «${o.id}»`);
    idOpz.add(o.id);
    if (!o.testo) problemi.push(`${dove}/${o.id}: senza testo`);
    controllaEffetti(`${dove}/${o.id}`, o.effetti);
    controllaQuando(`${dove}/${o.id}/richiede`, o.richiede);
  }
  const pred = ev.opzioni?.find((o) => o.id === ev.predefinita);
  if (pred?.richiede) problemi.push(`${dove}: la predefinita ha un «richiede»: quando manca, la routine non sa cosa rispondere`);
  if (pred?.audace) problemi.push(`${dove}: la predefinita e' il salto: la routine non si lancia mai, e' la regola`);
  const salti = ev.opzioni?.filter((o) => o.audace).length ?? 0;
  if (ev.categoria === 'opportunita' && ev.salto && salti !== 1) problemi.push(`${dove}: un'occasione ha esattamente un salto (audace: true), qui ${salti}`);
  if (salti > 1) problemi.push(`${dove}: piu' di un salto`);
  controllaQuando(dove, ev.quando);
  for (const [b, m] of Object.entries(ev.background ?? {})) {
    if (!idBackground.has(b)) problemi.push(`${dove}: background sconosciuto «${b}»`);
    if (m === 0 && !ev.porta) problemi.push(`${dove}: moltiplicatore zero per ${b} senza porta: true — la porta sparirebbe invece di vedersi`);
  }
}
for (const b of BACKGROUND) {
  for (const id of b.invisibili) {
    const ev = EVENTI.find((x) => x.id === id);
    if (!ev) problemi.push(`la porta «${id}» chiusa a ${b.nome} non e' un evento della banca`);
    else if (ev.background[b.id] !== 0 || !ev.porta) problemi.push(`la porta «${id}» chiusa a ${b.nome} deve avere background.${b.id} = 0 e porta: true`);
  }
}
for (const c of CATEGORIE) if ((perCategoria[c] || 0) < 20) problemi.push(`categoria ${c}: ${perCategoria[c] || 0} eventi, ne servono venti`);
if (EVENTI.length < 120) problemi.push(`${EVENTI.length} eventi: ne servono centoventi`);

/* ─── 6: i doppioni ─── */
const normalizza = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
const trigrammi = (t) => { const n = normalizza(t); const s = new Set(); for (let i = 0; i + 3 <= n.length; i += 1) s.add(n.slice(i, i + 3)); return s; };
const somiglianza = (a, b) => { let c = 0; for (const x of a) if (b.has(x)) c += 1; return c / Math.max(1, Math.min(a.size, b.size)); };
const firme = EVENTI.map((ev) => trigrammi(`${ev.titolo} ${ev.testo}`));
for (let i = 0; i < EVENTI.length; i += 1) {
  for (let j = i + 1; j < EVENTI.length; j += 1) {
    const s = somiglianza(firme[i], firme[j]);
    if (s >= SOGLIA_DOPPIONE) avvisi.push(`forse doppioni: ${EVENTI[i].id} e ${EVENTI[j].id} (${Math.round(s * 100)}%)`);
  }
}

/* ─── 7: le condizioni morte ─── */
const ROUTINE = {
  vita:     { percorso: 'universita', piano: { studio: 20, relazioni: 15, sonno: 12, sport: 8, networking: 8, ozio: 5 } },
  carriera: { percorso: 'its',        piano: { studio: 15, relazioni: 12, networking: 10, volontariato: 8, sonno: 12, candidature: 8, sport: 5 }, carriera: true, audace: true },
  fatica:   { percorso: 'lavoro',     piano: { straordinari: 20, lavoretti: 10, sonno: 8, relazioni: 4, candidature: 6 }, carriera: true },
};
function adatta(stato, desiderio) {
  const f = fotografia(stato);
  const piano = { lavoro: f.oreObbligatorie, ...desiderio };
  for (const a of f.attivita) {
    if (a.invisibile) piano[a.id] = 0;
    if ((piano[a.id] ?? 0) > a.massimo) piano[a.id] = a.massimo;
    if ((piano[a.id] ?? 0) < a.minimo) piano[a.id] = a.minimo;
  }
  let tot = Object.values(piano).reduce((s, t) => s + (t || 0), 0);
  for (const id of ['ozio', 'lavoretti', 'networking', 'volontariato', 'progetti', 'straordinari', 'studio', 'sport', 'relazioni', 'sonno', 'candidature']) {
    while (tot > f.tempo && (piano[id] ?? 0) > 0) { piano[id] -= 1; tot -= 1; }
  }
  return piano;
}
const scattati = {};
let vite = 0;
for (const b of BACKGROUND) {
  for (const [nome, r] of Object.entries(ROUTINE)) {
    for (let seme = 1; seme <= 8; seme += 1) {
      const s = creaPartita({ seme, background: b.id });
      scegliPercorso(s, r.percorso);
      impostaRoutine(s, adatta(s, r.piano));
      vite += 1;
      while (s.fase !== 'finita' && s.settimana <= 624) {
        if (!s.lavoro && s.vita.soldi < 1000) { prendiLavoro(s, s.caso.scelta(['bar', 'magazzino', 'callcenter', 'negozio'])); impostaRoutine(s, adatta(s, r.piano)); }
        if (r.carriera) {
          for (const o of [...s.offerte]) if (!s.lavoro || SOPRAVVIVENZA[s.lavoro.aziendaId] || o.stipendio > stipendioDi(s.lavoro) * 1.1) { accettaOfferta(s, o.aziendaId); impostaRoutine(s, adatta(s, r.piano)); }
          if (s.ricerca >= COLLOQUIO.costo) { const aperte = porteDi(s).filter((p) => !p.chiusa && p.ore <= fotografia(s).tempo - 24); if (aperte.length) faiColloquio(s, aperte.sort((x, y) => y.probabilita - x.probabilita)[0].aziendaId); }
        }
        /* chi si lancia risponde con il salto: se no meta' delle occasioni
           (freelance, i progetti) non si apre mai, per costruzione */
        if (r.audace) for (const ev of fotografia(s).eventi) { const salto = ev.opzioni.find((o) => o.audace && o.disponibile); if (salto) rispondiEvento(s, ev.id, salto.id); }
        if (s.fase === 'finita') break;
        const x = giocaSettimana(s);
        if (!x.ok) { impostaRoutine(s, adatta(s, r.piano)); continue; }
        for (const e of x.eventi) scattati[e.id] = (scattati[e.id] || 0) + 1;
      }
    }
  }
}
const mai = EVENTI.filter((ev) => !scattati[ev.id]).map((ev) => ev.id);
const rari = EVENTI.filter((ev) => scattati[ev.id] && scattati[ev.id] < 3).map((ev) => `${ev.id}(${scattati[ev.id]})`);

/* ─── Il rapporto ─── */
console.log(`\n${EVENTI.length} eventi · ${Object.entries(perCategoria).map(([c, n]) => `${c} ${n}`).join(' · ')}`);
console.log(`\n${vite} vite giocate: ${EVENTI.length - mai.length} eventi scattati almeno una volta, ${mai.length} mai, ${rari.length} rari (meno di tre volte)`);
const top = Object.entries(scattati).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, n]) => `${id} ${n}`).join(', ');
console.log(`i piu' frequenti: ${top}`);
if (mai.length) console.log(`\nMai scattati: ${mai.join(', ')}`);
if (rari.length) console.log(`Rari: ${rari.join(', ')}`);
if (mai.length > MAI_TOLLERATI) problemi.push(`${mai.length} eventi non scattano mai in ${vite} vite: condizioni morte (se ne tollerano ${MAI_TOLLERATI})`);
if (avvisi.length) console.log(`\nAvvisi:\n  ${avvisi.join('\n  ')}`);
if (problemi.length) { console.log(`\nPROBLEMI:\n  ${problemi.join('\n  ')}\n`); process.exit(1); }
console.log('\nTUTTO OK');
