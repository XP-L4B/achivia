/**
 * La mappa della risalita regge davvero?
 *
 *     node strumenti/controlla-risalita.mjs
 *     npm run navigazione
 *
 * «Indietro» non torna alla pagina di prima: torna alla schermata che dà
 * accesso a questa, e quale sia lo dice `components/layouts/risalita.js`.
 * Una mappa scritta a mano invecchia da sola — si aggiunge una schermata al
 * router e ci si dimentica della riga qui — e quando invecchia il difetto è
 * silenzioso: il pulsante c'è, funziona, e porta nel posto sbagliato.
 *
 * Quindi le due liste si confrontano da sole. Il router lo si legge come
 * testo invece di importarlo: importarlo vorrebbe dire tirarsi dietro
 * centosei schermate, React e le immagini, e questo è un controllo che deve
 * girare con `node` in mezzo secondo.
 *
 * Quattro cose:
 *
 *  1. **Ogni indirizzo del router ha un genitore.** Se manca, il pulsante
 *     ripiega sulla cronologia, cioè sul difetto che la mappa esiste per
 *     togliere.
 *  2. **Ogni genitore è un indirizzo che esiste.** Un rimando a una pagina
 *     cancellata porta alla schermata «pagina non trovata».
 *  3. **Nessun anello.** Risalire deve finire, e deve finire in una
 *     dashboard.
 *  4. **Nessuno schema morto**: se un ramo del router sparisce, la sua riga
 *     qui va tolta, se no la mappa cresce di roba che non serve.
 */

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const radice = new URL('../src/', import.meta.url);
const leggi = (via) => readFileSync(new URL(via, radice), 'utf8');

/* ─── Le rotte, lette dal router come testo ─── */

const router = leggi('router.jsx');

/* `path: '...'` dentro il router, con il ramo a cui appartengono. Le rotte
   annidate portano il prefisso del padre, che nel router sta su un `path:`
   di un oggetto che ha `children`. Invece di ricostruire l'albero — cosa
   che vorrebbe un parser — si sfruttano le due forme che il file usa
   davvero: gli indirizzi assoluti cominciano con `/`, quelli relativi no e
   appartengono all'ultimo `path: '/qualcosa'` che apre dei `children`. */
const rotte = new Set();
let ramo = '';
for (const riga of router.split('\n')) {
  const apre = /path:\s*'(\/[^']*)',\s*$/.exec(riga);
  const voce = /\{\s*path:\s*'([^']*)'/.exec(riga);
  if (apre && !voce) { ramo = apre[1]; continue; }
  if (!voce) {
    if (/^\s*\{\s*$/.test(riga)) continue;
    continue;
  }
  const p = voce[1];
  if (p === '*') continue;
  rotte.add(p.startsWith('/') ? p : `${ramo}/${p}`.replace(/\/+/g, '/'));
  if (p.startsWith('/')) ramo = ramo; // un indirizzo assoluto non cambia ramo
}
/* Gli indici (`index: true`) sono il ramo stesso, e i rami sono indirizzi
   che devono avere un genitore come tutti. */
for (const m of router.matchAll(/path:\s*'(\/[^']*)',\s*$/gm)) rotte.add(m[1]);
rotte.add('/');

/* ─── La mappa ─── */

const { genitoreDi, SCHEMI_RISALITA } = await import(
  pathToFileURL(new URL('components/layouts/risalita.js', radice).pathname)
);

/* Chi guarda, gia' risolto come lo risolve `doveSi` in `tabs.js`. Qui si
   scrive a mano invece di importarlo: `tabs.js` tira dentro i permessi, i
   permessi il deposito, e il deposito il `localStorage` di un browser che
   qui non c'e'. Sono sette righe e sono le sette aree dell'app — se ne
   nasce un'ottava, questa lista va allungata. */
const GENTE = [
  ['un dipendente', { entrato: true, ruolo: 'employee', area: 'employee', casa: '/employee/profile', menu: '/employee/menu' }],
  ['chi guida', { entrato: true, ruolo: 'manager', area: 'manager', casa: '/manager/profile', menu: '/manager/menu' }],
  ['un admin', { entrato: true, ruolo: 'admin', area: 'admin', casa: '/manager/profile', menu: '/manager/menu' }],
  ['il negozio', { entrato: true, ruolo: 'shop', area: 'shop', casa: '/shop', menu: '/shop' }],
  ['l’osservatorio', { entrato: true, ruolo: 'osservatorio', area: 'osservatorio', casa: '/osservatorio', menu: '/osservatorio' }],
  ['il Castello', { entrato: true, ruolo: 'castle', area: 'castle', casa: '/castle', menu: '/castle/menu' }],
  ['chi non è entrato', { entrato: false, ruolo: null, area: null, casa: null, menu: null }],
];

let falliti = 0;
const ok = (cond, testo, extra = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${testo}${extra ? `  — ${extra}` : ''}`);
  if (!cond) falliti += 1;
};

/** Un indirizzo di prova per uno schema con dei segmenti variabili. */
const esempio = (schema) => schema.split('/').map((s) => (s.startsWith(':') ? 'x1' : s)).join('/');

console.log('\nOGNI SCHERMATA SA DA DOVE SI ARRIVA');
{
  const senza = [];
  for (const r of [...rotte].sort()) {
    const via = esempio(r);
    if (GENTE.some(([, chi]) => genitoreDi(via, chi) === undefined)) senza.push(r);
  }
  ok(senza.length === 0, `tutte le ${rotte.size} rotte del router sono in mappa`, senza.join(', ') || 'nessuna scoperta');
}

console.log('\nE SI ARRIVA IN UN POSTO CHE ESISTE');
{
  const inesistenti = new Set();
  const schemi = [...rotte].map((r) => r.split('/').filter(Boolean));
  const esiste = (via) => {
    const parti = via.split('/').filter(Boolean);
    return schemi.some((s) => s.length === parti.length
      && s.every((seg, i) => seg.startsWith(':') || seg === parti[i]));
  };
  for (const r of rotte) {
    for (const [chi, persona] of GENTE) {
      const meta = genitoreDi(esempio(r), persona);
      if (typeof meta === 'string' && !esiste(meta)) inesistenti.add(`${r} → ${meta} (${chi})`);
    }
  }
  ok(inesistenti.size === 0, 'nessun «Indietro» punta a una pagina che non c’è', [...inesistenti].join(', ') || 'tutti buoni');
}

console.log('\nRISALIRE FINISCE SEMPRE');
{
  const anelli = [];
  for (const r of rotte) {
    for (const [chi, persona] of GENTE) {
      let via = esempio(r);
      const visti = new Set();
      for (let i = 0; i < 12 && typeof via === 'string'; i += 1) {
        if (visti.has(via)) { anelli.push(`${r} (${chi}) gira su ${via}`); break; }
        visti.add(via);
        via = genitoreDi(via, persona);
      }
      if (typeof via === 'string') anelli.push(`${r} (${chi}) non arriva a una dashboard in dodici passi`);
    }
  }
  ok(anelli.length === 0, 'da ogni schermata si arriva a una dashboard', anelli.slice(0, 4).join(' · ') || 'nessun anello');
}

console.log('\nE NELLA MAPPA NON C’È ROBA MORTA');
{
  const schemi = [...rotte].map((r) => r.split('/').filter(Boolean));
  const copre = (schema) => {
    const s = schema.split('/').filter(Boolean);
    return schemi.some((r) => r.length === s.length
      && r.every((seg, i) => seg.startsWith(':') || s[i].startsWith(':') || seg === s[i]));
  };
  const morti = SCHEMI_RISALITA.filter((s) => s !== '/' && !copre(s));
  ok(morti.length === 0, 'ogni schema della mappa copre una rotta vera', morti.join(', ') || 'nessuno di troppo');
}

/* ─── E i casi che contano, uno per uno ───
   I quattro controlli qui sopra dicono che la mappa e' completa e che
   regge; questi dicono che dice la cosa giusta. Sono i casi in cui
   «Indietro» sbagliava prima, piu' quelli in cui la risposta dipende da
   chi guarda. */
console.log('\nE OGNUNO TORNA DOVE DEVE');
{
  const [, dipendente] = GENTE[0];
  const [, guida] = GENTE[1];
  const [, admin] = GENTE[2];
  const [, castello] = GENTE[5];
  const [, fuori] = GENTE[6];

  const casi = [
    // La scheda di qualcuno torna al suo elenco, non alla schermata da cui
    // si veniva: ci si arriva da Analytics, dai team, dagli achievement.
    ['/manager/management/employees/u7', guida, '/manager/management/employees', 'la scheda di una persona torna ai dipendenti'],
    ['/manager/management/employees/u7/review', guida, '/manager/management/employees/u7', 'la valutazione torna alla scheda'],
    ['/manager/management/employees/u7/reviews', guida, '/manager/management/employees/u7', 'e lo storico anche'],
    ['/manager/management/teams/t3/edit', guida, '/manager/management/teams/t3', 'la modifica di una squadra torna alla squadra'],
    ['/manager/management/teams/new', guida, '/manager/management/teams', 'ma una squadra nuova torna all’elenco'],
    ['/manager/management/quests/approve', guida, '/manager/management/quests', 'le quest da approvare tornano alle quest'],
    ['/manager/management/skills', guida, '/manager/management', 'e le competenze a Gestione'],
    ['/manager/data', guida, '/manager/profile', 'i dati tornano al profilo di gestione'],
    ['/admin/users/u7', admin, '/admin/users', 'la scheda di un membro torna ai membri'],
    ['/admin/cassa', admin, '/admin', 'e la cassa all’area amministratore'],
    /* L'area amministratore non è una casa: ci si entra dal profilo di
       gestione, con un riquadro, e da lì si torna. */
    ['/admin', admin, '/manager/profile', 'e l’area amministratore al profilo da cui si entra'],

    // I giochi: l’atrio torna a Games, e le sue schermate all’atrio — non
    // alla partita appena chiusa, che è dove portava la cronologia.
    ['/arena', dipendente, '/giochi', 'l’atrio dell’arena torna a Games'],
    ['/arena/classifica', dipendente, '/arena', 'e la classifica all’atrio'],
    ['/giochi/the-boss/crediti', dipendente, '/giochi/the-boss', 'i crediti di The Boss al suo atrio'],
    ['/giochi/the-climb/partita', dipendente, '/giochi/the-climb', 'la partita di The Climb al suo atrio'],
    ['/giochi/the-climb', dipendente, '/giochi', 'l\'atrio di The Climb ai giochi'],
    ['/giochi/the-climb/enciclopedia', dipendente, '/giochi/the-climb', 'l\'enciclopedia di The Climb al suo atrio'],
    ['/giochi/the-climb/classifica', dipendente, '/giochi/the-climb', 'la classifica di The Climb al suo atrio'],
    ['/giochi', dipendente, '/employee/profile', 'e Games al profilo'],

    // Le pagine di tutti: quelle del profilo al profilo, quelle del menu
    // al menu, e il menu è quello di chi guarda.
    ['/settings', dipendente, '/employee/menu', 'le impostazioni al menu del dipendente'],
    ['/settings', guida, '/manager/menu', 'e al menu della gestione per chi guida'],
    ['/settings', castello, '/castle/menu', 'e a quello del Castello per il Castello'],
    ['/terms', dipendente, '/employee/menu', 'i termini al menu'],
    ['/messaggi', dipendente, '/employee/profile', 'la casella al profilo'],
    ['/marketplace/purchases', dipendente, '/marketplace', 'i propri acquisti al negozio'],
    ['/lavoro/fatti-trovare', dipendente, '/lavoro', 'farsi trovare torna a Trova lavoro'],

    // Le due porte della ricarica crediti.
    ['/compra-crediti', dipendente, '/marketplace', 'la ricarica torna al negozio'],
    ['/compra-crediti', admin, '/admin', 'ma per l’admin all’area amministratore'],

    // L’ingresso: chi non è entrato risale il modulo, chi è dentro no.
    ['/auth/reset-password', fuori, '/auth', 'la password dimenticata torna all’accesso'],
    ['/auth/reset-password', dipendente, '/settings', 'ma cambiarla dall’interno torna alle impostazioni'],
    ['/auth/register/org/company', fuori, '/auth/register/org-type', 'il modulo torna alla scelta del tipo'],

    // Le dashboard non hanno un sopra.
    ['/employee/profile', dipendente, null, 'il profilo non ha un sopra'],
    ['/castle', castello, null, 'e nemmeno il Castello'],
    ['/shop', GENTE[3][1], null, 'né il banco del negozio'],
  ];

  const sbagliati = casi.filter(([via, chi, atteso]) => genitoreDi(via, chi) !== atteso);
  for (const [via, chi, atteso, testo] of casi) {
    const avuto = genitoreDi(via, chi);
    if (avuto !== atteso) console.log(`    ${via} → ${avuto} invece di ${atteso}`);
    else void testo;
  }
  ok(sbagliati.length === 0, `${casi.length} risalite vanno dove devono`,
    sbagliati.map(([v]) => v).join(', ') || 'tutte giuste');
}

console.log(falliti === 0 ? '\nTUTTO OK\n' : `\n${falliti} CONTROLLI FALLITI\n`);
process.exit(falliti ? 1 : 0);
