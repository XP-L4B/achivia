/**
 * Il controllo della banca delle richieste.
 *
 *     node src/giochi/theboss/strumenti/valida-banca.mjs
 *     npm run boss:banca
 *
 * Si lancia su ogni lotto nuovo, prima di considerarlo scritto. Controlla
 * cinque cose, e le ultime due sono quelle che contano davvero.
 *
 *  1. **Lo schema**: ogni voce ha tutti i campi, il testo sta sotto i 280
 *     caratteri, l'archetipo esiste nella lista chiusa, il tono e' uno dei
 *     tre, il livello sta fra uno e quattro.
 *  2. **Gli id sono unici**, in tutti i lotti insieme: un id ripetuto
 *     manderebbe in confusione il salvataggio delle partite.
 *  3. **Nessun effetto numerico dichiarato**: una voce che provi a portare
 *     una cifra che il motore possa leggere viene scartata. I numeri
 *     stanno in `bilancio.js` e da nessun'altra parte.
 *  4. **La deduplica**: due richieste che dicono la stessa cosa con parole
 *     diverse contano come una. Si confrontano per trigrammi — sequenze di
 *     tre lettere — perche' cercare le parole uguali non basta: «il
 *     calderone perde» e «la caldaia gocciola» sono la stessa richiesta con
 *     zero parole in comune. Lo script **segnala e non cancella**: quale
 *     delle due riscrivere e' una scelta di chi scrive.
 *  5. **Le quote di tono**: sessanta per cento realistiche, venticinque
 *     sarcastiche, quindici demenziali, con tolleranza. Il demenziale e'
 *     quello che si ricorda ed e' anche quello che stanca.
 *
 * E stampa la matrice di copertura: archetipo per tono, per vedere dove la
 * banca e' magra prima che se ne accorga chi gioca.
 */

import { caricaTuttiILotti } from '../contenuti/richieste/indice.js';
import { TONI, QUOTE_TONO } from '../contenuti/richieste/schema.js';
import { ARCHETIPI, archetipoById } from '../contenuti/archetipi.js';

const MAX_TESTO = 280;
const MAX_TITOLO = 46;
/** Sopra questa somiglianza due voci raccontano la stessa cosa. */
const SOGLIA_DOPPIONE = 0.62;
/** Quanto le quote di tono possono sbagliare prima che sia un problema. */
const TOLLERANZA_TONO = 0.12;

const problemi = [];
const avvisi = [];

/* ─── I trigrammi: come si misura se due testi dicono la stessa cosa ─── */
const normalizza = (t) => t.toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();

function trigrammi(testo) {
  const t = normalizza(testo).replace(/ /g, '_');
  const s = new Set();
  for (let i = 0; i + 3 <= t.length; i += 1) s.add(t.slice(i, i + 3));
  return s;
}

const somiglianza = (a, b) => {
  let comuni = 0;
  for (const g of a) if (b.has(g)) comuni += 1;
  return comuni / Math.max(1, Math.min(a.size, b.size));
};

/* ─── Il controllo ─── */
const lotti = await caricaTuttiILotti();
const tutte = lotti.flatMap((l) => l.voci.map((v) => ({ ...v, lotto: l.lotto })));
const visti = new Map();

for (const v of tutte) {
  const dove = `lotto ${String(v.lotto).padStart(2, '0')} · ${v.id}`;
  if (!v.id || !v.arch || !v.tono || !v.titolo || !v.testo) problemi.push(`${dove}: campi mancanti`);
  if (!archetipoById(v.arch)) problemi.push(`${dove}: archetipo sconosciuto "${v.arch}"`);
  if (!TONI.includes(v.tono)) problemi.push(`${dove}: tono sconosciuto "${v.tono}"`);
  if (!(v.liv >= 1 && v.liv <= 4)) problemi.push(`${dove}: livello fuori scala (${v.liv})`);
  if (v.testo && v.testo.length > MAX_TESTO) problemi.push(`${dove}: testo di ${v.testo.length} caratteri (massimo ${MAX_TESTO})`);
  if (v.titolo && v.titolo.length > MAX_TITOLO) problemi.push(`${dove}: titolo di ${v.titolo.length} caratteri (massimo ${MAX_TITOLO})`);
  if (!v.acc || !v.rif || !v.rim) problemi.push(`${dove}: mancano le battute delle tre risposte`);
  /* nessun effetto dichiarato: le uniche chiavi ammesse sono quelle dello schema */
  const ammesse = new Set(['id', 'arch', 'tono', 'liv', 'titolo', 'testo', 'acc', 'rif', 'rim', 'ctx', 'lotto']);
  for (const k of Object.keys(v)) if (!ammesse.has(k)) problemi.push(`${dove}: campo non previsto "${k}" — gli effetti stanno nel motore`);
  if (visti.has(v.id)) problemi.push(`${dove}: id gia' usato in ${visti.get(v.id)}`);
  else visti.set(v.id, dove);
  /* un archetipo puo' uscire solo ai suoi livelli: un testo scritto per un
     livello che non esiste per quell'archetipo non uscirebbe mai */
  const a = archetipoById(v.arch);
  if (a && (v.liv < a.livelli[0] || v.liv > a.livelli[1])) {
    avvisi.push(`${dove}: livello ${v.liv} fuori dai livelli dell'archetipo (${a.livelli.join('–')}): non uscira' mai`);
  }
}

/* ─── I doppioni ─── */
const impronte = tutte.map((v) => ({ v, g: trigrammi(`${v.titolo} ${v.testo}`) }));
const doppioni = [];
for (let i = 0; i < impronte.length; i += 1) {
  for (let j = i + 1; j < impronte.length; j += 1) {
    const s = somiglianza(impronte[i].g, impronte[j].g);
    if (s >= SOGLIA_DOPPIONE) doppioni.push({ a: impronte[i].v, b: impronte[j].v, s });
  }
}

/* ─── Le quote di tono ─── */
const perTono = {};
for (const v of tutte) perTono[v.tono] = (perTono[v.tono] || 0) + 1;

/* ─── La matrice di copertura ─── */
const matrice = new Map();
for (const v of tutte) {
  if (!matrice.has(v.arch)) matrice.set(v.arch, { realistica: 0, sarcastica: 0, demenziale: 0, tot: 0 });
  const riga = matrice.get(v.arch);
  riga[v.tono] += 1; riga.tot += 1;
}

/* ─── Il referto ─── */
console.log(`LA BANCA — ${tutte.length} voci in ${lotti.length} lotti\n`);

console.log('MATRICE DI COPERTURA  (archetipo × tono)');
console.log('archetipo                        real  sarc  dem   tot');
const magri = [];
for (const a of ARCHETIPI) {
  const r = matrice.get(a.id) || { realistica: 0, sarcastica: 0, demenziale: 0, tot: 0 };
  if (r.tot < 5) magri.push(`${a.id} (${r.tot})`);
  console.log(
    a.id.padEnd(32),
    String(r.realistica).padStart(4), String(r.sarcastica).padStart(5),
    String(r.demenziale).padStart(5), String(r.tot).padStart(5),
    r.tot < 5 ? '  magro' : '',
  );
}

console.log('\nQUOTE DI TONO');
for (const t of TONI) {
  const quota = (perTono[t] || 0) / tutte.length;
  const bersaglio = QUOTE_TONO[t];
  const dentro = Math.abs(quota - bersaglio) <= TOLLERANZA_TONO;
  if (!dentro) avvisi.push(`tono ${t}: ${(quota * 100).toFixed(0)}% invece di ${(bersaglio * 100).toFixed(0)}%`);
  console.log(`  ${dentro ? '✓' : '·'} ${t.padEnd(12)} ${(quota * 100).toFixed(1)}%  (bersaglio ${(bersaglio * 100).toFixed(0)}%)`);
}

if (doppioni.length) {
  console.log(`\nDOPPIONI DA RISCRIVERE (${doppioni.length})`);
  for (const d of doppioni.slice(0, 20)) {
    console.log(`  ${(d.s * 100).toFixed(0)}%  ${d.a.id} "${d.a.titolo}"  ≈  ${d.b.id} "${d.b.titolo}"`);
  }
} else {
  console.log('\n✓ nessun doppione: nessuna coppia di voci dice la stessa cosa');
}

if (avvisi.length) {
  console.log(`\nAVVISI (${avvisi.length})`);
  for (const a of avvisi) console.log(`  · ${a}`);
}
if (magri.length) console.log(`\n  archetipi magri (meno di cinque testi): ${magri.join(', ')}`);

if (problemi.length) {
  console.log(`\nERRORI (${problemi.length})`);
  for (const p of problemi) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\n✓ la banca e\' valida.');
