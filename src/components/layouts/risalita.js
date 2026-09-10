/**
 * Dove porta «Indietro»: alla pagina che dà accesso a questa.
 *
 * Prima portava alla pagina **da cui si veniva**, che è un'altra cosa e
 * quasi sempre quella sbagliata. Chi apre la scheda di un dipendente da
 * Analytics e poi preme Indietro si aspetta l'elenco dei dipendenti, non
 * Analytics; chi finisce una partita e preme Indietro si aspetta l'atrio,
 * non la partita che ha appena chiuso. La cronologia racconta il giro che
 * hai fatto, non la struttura dell'applicazione, e il pulsante che
 * racconta il giro ce l'ha già il browser.
 *
 * Quindi qui c'è la struttura, scritta una volta sola. Ogni indirizzo
 * dichiara il suo genitore, e il genitore è **la schermata da cui quella
 * pagina si apre** — quella con il riquadro, la voce di menu o il pulsante
 * che ci porta. Dove le porte sono due, vince quella per cui la pagina è
 * stata fatta: la ricarica crediti si apre dal negozio per tutti e
 * dall'area amministratore per l'admin, e l'admin torna a casa sua.
 *
 * QUESTO FILE NON SA CHI STA GUARDANDO, e non deve saperlo: sa la forma
 * dell'applicazione, che è la stessa per tutti. Le tre destinazioni che
 * dipendono dall'account gli arrivano già risolte, in `dove` — chi le
 * calcola è `tabs.js`, che è il file che sa dove porta la barra. Così
 * questo resta un file di dati puro, senza un import, e
 * `strumenti/controlla-risalita.mjs` lo può leggere con `node` in mezzo
 * secondo invece di tirarsi dietro tutta l'app.
 *
 * TRE VALORI SPECIALI, perché tre destinazioni dipendono da chi guarda e
 * non dall'indirizzo:
 *
 *  - `CASA` — la dashboard di chi guarda (il marchio della sua barra):
 *    il profilo per il dipendente, il profilo di gestione per chi guida,
 *    il banco per il negozio. Le pagine che si aprono da un riquadro del
 *    profilo tornano lì.
 *  - `MENU` — il menu di chi guarda. Le pagine che si aprono solo di lì —
 *    i termini, la privacy, le impostazioni — tornano lì.
 *  - `null` — non c'è un sopra: è una dashboard, e il pulsante non compare.
 *
 * COME SI LEGGE. Il primo schema che combacia vince, quindi gli schemi più
 * specifici stanno sopra i più generali: `/manager/management/teams/new`
 * prima di `/manager/management/teams/:id`, se no una squadra nuova
 * verrebbe scambiata per una squadra che esiste. Un segmento che comincia
 * con i due punti combacia con qualunque cosa, e nel genitore riprende il
 * valore che aveva nel figlio.
 */

export const CASA = Symbol('casa');
export const MENU = Symbol('menu');

/* Un valore può anche essere una funzione di `dove`, quando la porta
   d'ingresso cambia con l'account. Sono quattro casi e sono tutti qui. */
const RISALITA = [
  /* ═══ L'ingresso ═══
     Chi non è ancora entrato risale il modulo che stava compilando; chi è
     già dentro ci arriva dalle impostazioni o dal proprio profilo, e lì
     deve tornare. */
  ['/auth/locked', '/auth'],
  ['/auth/reset-password', (d) => (d.entrato ? '/settings' : '/auth')],
  ['/auth/register/org-choice', '/auth'],
  ['/auth/register/org-type', (d) => (d.entrato ? CASA : '/auth/register/org-choice')],
  ['/auth/register/org/:tipo', '/auth/register/org-type'],
  ['/auth/register/join', '/auth/register/org-choice'],
  ['/auth', '/'],

  /* ═══ Area amministratore ═══
     Tutto si apre dalla schermata principale, che è una griglia di
     riquadri. L'unica scheda annidata è quella di una persona. */
  ['/admin/users/:id', '/admin/users'],
  ['/admin/settings/piani', '/admin'],
  /* L'area amministratore non è una casa, è una stanza: ci si entra dal
     profilo, con il riquadro «Dashboard admin», e da lì si torna. Chi la
     guarda ha la barra della gestione sotto i piedi — Gestione, Dati,
     Achievements — quindi il posto da cui è arrivato è il profilo di
     gestione, non questa schermata. Era `null`, cioè «sopra non c'è
     niente», e infatti il pulsante Indietro non compariva. */
  ['/admin', '/manager/profile'],
  ['/admin/:sezione', '/admin'],

  /* ═══ Gestione ═══
     Due rami: quello che si apre dal profilo di gestione e quello che si
     apre dalla griglia di Gestione. Le schede di persone, squadre,
     progetti e quest risalgono al loro elenco, non alla griglia: chi
     chiude una scheda vuole l'elenco da cui l'ha aperta. */
  ['/manager/management/employees/:id/review', '/manager/management/employees/:id'],
  ['/manager/management/employees/:id/reviews', '/manager/management/employees/:id'],
  ['/manager/management/employees/:id', '/manager/management/employees'],
  ['/manager/management/teams/new', '/manager/management/teams'],
  ['/manager/management/teams/:id/edit', '/manager/management/teams/:id'],
  ['/manager/management/teams/:id', '/manager/management/teams'],
  ['/manager/management/projects/new', '/manager/management/projects'],
  ['/manager/management/projects/:id', '/manager/management/projects'],
  ['/manager/management/quests/:quale', '/manager/management/quests'],
  ['/manager/management', '/manager/profile'],
  ['/manager/management/:sezione', '/manager/management'],
  ['/manager/profile', null],
  ['/manager/:sezione', '/manager/profile'],

  /* ═══ Dipendente ═══ */
  ['/employee/profile', null],
  ['/employee/:sezione', '/employee/profile'],

  /* ═══ Negozio ═══ */
  ['/shop', null],
  ['/shop/:sezione', '/shop'],

  /* ═══ Osservatorio ═══
     Chi ci entra dal proprio piano non è uscito da nessuna parte: sta
     guardando il mercato con la sessione della sua azienda, e da lì
     risale alla sua area. Chi ha l'account dell'osservatorio invece è a
     casa sua, e sopra non ha niente. */
  ['/osservatorio', (d) => (d.ruolo === 'osservatorio' ? null : '/admin')],
  ['/osservatorio/:tavola', '/osservatorio'],

  /* ═══ Il Castello ═══
     Le tre sezioni della barra tornano al polso; le cinque che si aprono
     di rado stanno nel menu, e al menu tornano. */
  ['/castle', null],
  ['/castle/menu', '/castle'],
  ['/castle/organizzazioni', '/castle'],
  ['/castle/listino', '/castle'],
  ['/castle/crm', '/castle'],
  ['/castle/:sezione', '/castle/menu'],

  /* ═══ I giochi ═══
     La porta è Games, e ogni gioco ha il suo atrio: traguardi, classifica
     e crediti tornano all'atrio, non alla porta. */
  ['/giochi', CASA],
  ['/giochi/lexora', '/giochi'],
  ['/giochi/lexora/:sezione', '/giochi/lexora'],
  ['/giochi/the-boss', '/giochi'],
  ['/giochi/the-boss/:sezione', '/giochi/the-boss'],
  ['/giochi/the-climb', '/giochi'],
  ['/giochi/the-climb/:sezione', '/giochi/the-climb'],
  ['/arena', '/giochi'],
  ['/arena/:sezione', '/arena'],

  /* ═══ Le pagine di tutti ═══
     Quelle che si aprono da un riquadro del profilo tornano al profilo;
     quelle che si aprono solo dal menu tornano al menu. */
  ['/leaderboard', CASA],
  ['/leaderboard/:orgId', '/leaderboard'],
  ['/annunci', CASA],
  ['/messaggi', CASA],
  ['/marketplace', CASA],
  ['/marketplace/purchases', '/marketplace'],
  ['/credits-info', '/marketplace'],
  /* La ricarica ha due porte: il negozio per tutti, la griglia dell'area
     amministratore per l'admin. Ognuno torna alla sua. */
  ['/compra-crediti', (d) => (d.area === 'admin' ? '/admin' : '/marketplace')],
  ['/lavoro', '/settings'],
  ['/lavoro/fatti-trovare', '/lavoro'],
  ['/storico-lavorativo', MENU],
  ['/i-miei-dati', MENU],
  ['/org', MENU],
  ['/settings', MENU],
  ['/help', MENU],
  ['/faq', MENU],
  ['/about', MENU],
  ['/terms', MENU],
  ['/privacy', MENU],

  /* ═══ I rimandi ═══
     Quattro indirizzi che non disegnano niente: portano altrove e basta
     (`/employee` e `/manager` al profilo, i due vecchi indirizzi della
     posta alla casella). Nessuno ci vede mai un pulsante Indietro, ma
     stanno in mappa lo stesso: `npm run navigazione` controlla che ogni
     rotta del router ci sia, e un buco dichiarato è meglio di un buco. */
  ['/employee', null],
  ['/manager', null],
  ['/messaging', null],
  ['/lavoro/messaggi', null],
  /* «Membri» è confluita in «Persone»: l'indirizzo resta e porta lì. */
  ['/manager/management/members', null],

  ['/', null],
];

const pezzi = (via) => via.split('/').filter(Boolean);

function combacia(schema, parti) {
  const s = pezzi(schema);
  if (s.length !== parti.length) return false;
  return s.every((seg, i) => seg.startsWith(':') || seg === parti[i]);
}

/** Il genitore, con i segmenti variabili ripresi dal figlio. */
function riempi(schema, parti) {
  return `/${pezzi(schema).map((seg, i) => (seg.startsWith(':') ? parti[i] : seg)).join('/')}`;
}

/**
 * Dove porta «Indietro» da questo indirizzo, per chi guarda.
 *
 * `dove` è quello che serve sapere dell'account, già risolto:
 * `{ entrato, ruolo, area, casa, menu }`. Lo prepara `tabs.js`.
 *
 * `null` vuol dire che sopra non c'è niente: è una dashboard.
 * `undefined` vuol dire che l'indirizzo non è in mappa — non deve
 * succedere, e `strumenti/controlla-risalita.mjs` lo verifica.
 */
export function genitoreDi(pathname, dove = {}) {
  const parti = pezzi(pathname);
  const voce = RISALITA.find(([schema]) => combacia(schema, parti));
  if (!voce) return undefined;
  const valore = typeof voce[1] === 'function' ? voce[1](dove) : voce[1];
  if (valore === CASA) return dove.casa ?? null;
  if (valore === MENU) return dove.menu ?? dove.casa ?? null;
  if (typeof valore !== 'string') return valore;
  const meta = valore.includes(':') ? riempi(valore, parti) : valore;
  /* Un genitore uguale al figlio vorrebbe dire un pulsante che non porta
     da nessuna parte: succede quando la dashboard di chi guarda è proprio
     la pagina che sta guardando. */
  return meta === pathname ? null : meta;
}

/** Gli schemi, per chi li deve controllare da fuori. */
export const SCHEMI_RISALITA = RISALITA.map(([schema]) => schema);
