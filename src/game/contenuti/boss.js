/**
 * I boss, come dati. Tre, e arrivano a orari fissi.
 *
 * Un boss e' un nemico come gli altri — sta nella stessa vasca, entra dalla
 * stessa porta, muore dalla stessa porta, le armi lo colpiscono come
 * colpiscono un troll — con addosso una scheda piu' ricca. La scheda dice:
 *
 *   vita, velocita, danno, raggio, contatto, xp, scala, spinta
 *                come per ogni nemico (`contenuti/nemici.js`); la vita e'
 *                la base a tempo zero, e sale con `vitaAlTempo` e con
 *                `vitaDelBoss` come per i miniboss
 *   movimento    come si muove quando non attacca: 'insegue' va addosso,
 *                'tiene' resta a distanza (con `tieni`)
 *   attacchi     i pattern che sa fare, coi loro numeri. Ogni attacco ha
 *                un `pattern` (la funzione in `boss.js`), una `mira` —
 *                i secondi di preavviso, in cui il telegrafo si vede e il
 *                colpo non e' ancora partito — un `riposo` dopo, e `entro`,
 *                la distanza dal giocatore sotto la quale lo comincia
 *   fasi         le fasi del combattimento, in ordine. Si scende di fase
 *                quando la vita passa sotto `sotto` (frazione della vita
 *                massima). Ogni fase porta una sequenza di attacchi, che
 *                il boss ripete in ordine, un moltiplicatore di velocita',
 *                la ricarica fra un attacco e l'altro, e puo' ridichiarare
 *                i numeri di un attacco (`attacchi`) per farlo piu' cattivo
 *
 * Il boss numero n (il primo e' lo zero) arriva a `prossimoBoss(n)`, e'
 * `bossDelTurno(n)`, e ha la vita moltiplicata per `vitaDelBoss(n)`.
 * Finiti i tre si ricomincia dal primo, piu' forte.
 *
 * Quello che il boss lascia — le gemme, la cura, la carta in piu' — e'
 * scritto in `partita.js`, nella morte; qui solo i numeri: `xp` e `cura`.
 */

/** Quanta vita massima si recupera quando un boss cade. */
export const CURA_BOSS = 0.35;
/** In quante gemme si spezza l'esperienza di un boss. */
export const GEMME_BOSS = 8;

export const BOSS = [
  {
    id: 'ettin', nome: 'Ettin bicefalo', sprite: 'nemico.ettin', comportamento: 'boss',
    descrizione: 'Due teste e un pensiero solo: schiacciare. Lento finche\' non carica.',
    vita: 1500, velocita: 30, danno: 20, raggio: 13, contatto: 1.1, xp: 220, scala: 2.75, spinta: 0,
    colore: '#e8a898',
    movimento: 'insegue',
    // non entra a caso: arriva agli orari di `prossimoBoss`
    nascita: { da: Infinity, peso: 0, cresce: 0, gruppo: 1 },
    attacchi: {
      // si ferma, il cerchio si stringe, e batte a terra
      schianto: { pattern: 'schianto', mira: 0.9, raggio: 70, danno: 22, riposo: 0.5, entro: 95 },
      // prende la mira, e parte a testa bassa: il contatto fa il doppio
      carica: { pattern: 'carica', mira: 0.7, durata: 0.55, moltiplicatore: 5.5, moltDanno: 1.7, riposo: 0.9, entro: 280 },
      // chiama i troll
      evoca: { pattern: 'evoca', mira: 0.6, tipo: 'troll', quanti: 2, riposo: 0.4, entro: Infinity },
    },
    fasi: [
      { nome: 'Passo pesante', sotto: 1.0, velocita: 1, ricarica: 2.2, sequenza: ['schianto', 'evoca', 'schianto'] },
      { nome: 'Le due teste', sotto: 0.6, velocita: 1.2, ricarica: 1.7, sequenza: ['carica', 'schianto', 'evoca'] },
      {
        nome: 'Furia', sotto: 0.3, velocita: 1.45, ricarica: 1.1, sequenza: ['carica', 'carica', 'schianto'],
        attacchi: { schianto: { raggio: 92, danno: 32, mira: 0.7 }, carica: { mira: 0.5 } },
      },
    ],
  },
  {
    id: 'occhio', nome: 'Occhio del Vuoto', sprite: 'nemico.occhio', comportamento: 'boss',
    descrizione: 'Non ti viene addosso: ti guarda, e tira. Piu\' lo ferisci, meno sta fermo.',
    vita: 1100, velocita: 42, danno: 14, raggio: 11, contatto: 1.0, xp: 240, scala: 2.3, spinta: 0,
    colore: '#8fd06a',
    movimento: 'tiene', tieni: { vicino: 110, lontano: 175 },
    nascita: { da: Infinity, peso: 0, cresce: 0, gruppo: 1 },
    attacchi: {
      // un ventaglio di dardi verso dove eri quando ha preso la mira
      raffica: { pattern: 'raffica', mira: 0.6, quanti: 5, apertura: 0.9, velocita: 150, danno: 9, riposo: 0.4, entro: 270 },
      // dardi tutt'intorno: si passa fra uno e l'altro
      anello: { pattern: 'raffica', mira: 0.8, quanti: 14, apertura: Math.PI * 2, velocita: 115, danno: 9, riposo: 0.5, entro: 230 },
      // una riga fissa, poi il raggio: ci si sposta di lato
      raggio: { pattern: 'raggio', mira: 1.0, portata: 270, spessore: 9, danno: 26, riposo: 0.7, entro: 260 },
    },
    // quando il giocatore gli arriva sotto, sparisce e ricompare piu' in la'
    sbalzo: { sotto: 70, a: 170, ogni: 4 },
    fasi: [
      { nome: 'Sguardo fisso', sotto: 1.0, velocita: 1, ricarica: 1.8, sequenza: ['raffica', 'raffica'] },
      { nome: 'Sguardo che sfugge', sotto: 0.66, velocita: 1.15, ricarica: 1.5, sequenza: ['raffica', 'anello'], sbalzo: true },
      {
        nome: 'Pupilla spalancata', sotto: 0.33, velocita: 1.3, ricarica: 1.1, sequenza: ['raggio', 'anello', 'raffica'], sbalzo: true,
        attacchi: { raffica: { quanti: 7, apertura: 1.2 } },
      },
    ],
  },
  {
    id: 'balor', nome: 'Balor della Fossa', sprite: 'nemico.balor', comportamento: 'boss',
    descrizione: 'Il fuoco cade dove sei, non dove sara\'. Muoviti, sempre.',
    vita: 1900, velocita: 34, danno: 22, raggio: 12, contatto: 1.0, xp: 300, scala: 2.5, spinta: 0,
    colore: '#ff7a5c',
    movimento: 'insegue',
    nascita: { da: Infinity, peso: 0, cresce: 0, gruppo: 1 },
    attacchi: {
      // segna il punto dove sei, e dopo un secondo ci cade il fuoco
      meteora: { pattern: 'meteora', mira: 1.0, raggio: 40, quante: 1, sparsa: 58, danno: 24, riposo: 0.5, entro: 250 },
      // un colpo di frusta a ventaglio davanti a se'
      frusta: { pattern: 'frusta', mira: 0.7, raggio: 82, apertura: 1.9, danno: 24, riposo: 0.6, entro: 78 },
      // chiama i segugi
      evoca: { pattern: 'evoca', mira: 0.5, tipo: 'segugio', quanti: 3, riposo: 0.4, entro: Infinity },
    },
    fasi: [
      { nome: 'Brace', sotto: 1.0, velocita: 1, ricarica: 2.0, sequenza: ['meteora', 'frusta', 'evoca'] },
      {
        nome: 'Fiamma', sotto: 0.5, velocita: 1.25, ricarica: 1.5, sequenza: ['meteora', 'frusta', 'meteora', 'evoca'],
        attacchi: { meteora: { quante: 3 } },
      },
      {
        nome: 'Incendio', sotto: 0.25, velocita: 1.45, ricarica: 1.0, sequenza: ['meteora', 'frusta', 'meteora'],
        attacchi: { meteora: { quante: 3, raggio: 48, mira: 0.85 }, frusta: { apertura: 2.6, mira: 0.55 } },
      },
    ],
  },
];

export const bossById = (id) => BOSS.find((b) => b.id === id) || null;

/** Quando arriva l'n-esimo boss (il primo e' lo zero): a quattro minuti, poi ogni tre e mezzo. */
export const prossimoBoss = (n) => 240 + n * 210;

/** Quale boss e' l'n-esimo: i tre in ordine, poi da capo. */
export const bossDelTurno = (n) => BOSS[n % BOSS.length];

/** L'n-esimo boss ha piu' vita di quello prima: +35% ciascuno, sopra la crescita col tempo. */
export const vitaDelBoss = (n) => 1 + n * 0.35;

/** Mentre un boss e' in campo le ondate normali rallentano: e' il suo momento. */
export const ONDATA_COL_BOSS = 0.6;

/**
 * I numeri di un attacco in una fase: quelli della scheda con sopra
 * quelli che la fase ridichiara. Si calcolano una volta per (boss, fase,
 * attacco) e si tengono: nel passo non si alloca.
 */
const numeri = new Map();
export function numeriAttacco(boss, indiceFase, nome) {
  const chiave = `${boss.id}:${indiceFase}:${nome}`;
  let n = numeri.get(chiave);
  if (!n) {
    const fase = boss.fasi[indiceFase];
    n = { ...boss.attacchi[nome], ...(fase?.attacchi?.[nome] || {}) };
    numeri.set(chiave, n);
  }
  return n;
}

/** L'indice della fase per una frazione di vita: la piu' avanzata la cui soglia e' passata. */
export function faseDiVita(boss, frazione) {
  let i = 0;
  for (let k = 1; k < boss.fasi.length; k += 1) if (frazione <= boss.fasi[k].sotto) i = k;
  return i;
}
