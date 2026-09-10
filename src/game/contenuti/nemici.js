/**
 * I nemici, come dati, e la regia che decide chi entra e quando.
 *
 * Nove archetipi. Le ossa sono il nemico del primo minuto: lente, deboli,
 * servono a imparare come ci si muove. Gli altri otto arrivano uno alla
 * volta col passare dei minuti, ognuno con un comportamento suo:
 *
 *   insegue    va dritto al giocatore                          (ossa)
 *   veloce     come sopra, ma corre e regge poco               (segugio)
 *   pesante    lento, molta vita, il contraccolpo non lo sposta (troll)
 *   arciere    tiene la distanza e tira                        (arciere)
 *   sciame     arriva in gruppo, muore in un colpo             (scarabeo)
 *   carica     si ferma, mira, e parte a testa bassa           (cavalcalupo)
 *   scinde     quando muore si divide in due piu' piccoli      (melma → melmetta)
 *   capo       il miniboss: schianto a terra ed evocazioni     (ciclope)
 *
 * L'elite non e' un decimo disegno: e' uno qualunque degli altri con
 * addosso una corona — piu' vita, piu' danno, piu' esperienza, un alone —
 * e una sua probabilita' che cresce col tempo.
 *
 * I numeri di ogni scheda:
 *
 *   vita, velocita, danno   la base a tempo zero (vedi le scale sotto)
 *   raggio                  il cerchio di collisione, in pixel di mondo
 *   contatto                secondi fra un morso e l'altro
 *   xp                      quanto vale la gemma che lascia
 *   scala                   quanto e' grande a vedersi rispetto al foglio
 *   spinta                  quanto lo sposta un colpo (0 = per niente)
 *   nascita                 da quando entra, con che peso, e se in gruppo
 *   abilita                 i numeri del suo comportamento
 *
 * ── La difficolta' ──────────────────────────────────────────────────────
 * Cresce col tempo della partita, e su cinque leve indipendenti, cosi' non
 * c'e' mai un gradino:
 *
 *   quantita'      nemici al secondo             `ondaAlSecondo`
 *   vita           moltiplicatore della vita     `vitaAlTempo`
 *   velocita'      moltiplicatore (con un tetto) `velocitaAlTempo`
 *   composizione   i pesi di nascita per tipo    `pesiAlTempo`
 *   elite          la probabilita' della corona  `eliteAlTempo`
 *   miniboss       a orari fissi, sempre piu' forti  `prossimoCapo`
 */

export const NEMICI = [
  {
    id: 'ossa', nome: 'Ossa decrepite', sprite: 'nemico.ossa', comportamento: 'insegue',
    vita: 10, velocita: 44, danno: 8, raggio: 6, contatto: 0.8, xp: 3, scala: 1, spinta: 1,
    colore: '#d8d0c4',
    nascita: { da: 0, peso: 10, cresce: 0, gruppo: 1 },
  },
  {
    id: 'segugio', nome: 'Segugio tossico', sprite: 'nemico.segugio', comportamento: 'veloce',
    // 61, non 80: correva al 91% degli 88 del giocatore, e col +30% della
    // curva del tempo lo superava — chi ti sta in scia non ti lascia piu'
    // una manovra. A 61 arriva al massimo a 79, il 90% del giocatore: resta
    // il piu' svelto, e uno stacco ce l'hai sempre
    vita: 10, velocita: 61, danno: 6, raggio: 6, contatto: 0.6, xp: 3, scala: 1, spinta: 1.2,
    colore: '#9dd46e',
    nascita: { da: 45, peso: 3, cresce: 1.5, gruppo: 1 },
  },
  {
    id: 'troll', nome: 'Troll di pietra', sprite: 'nemico.troll', comportamento: 'pesante',
    vita: 90, velocita: 26, danno: 16, raggio: 9, contatto: 1.0, xp: 12, scala: 1.25, spinta: 0.15,
    colore: '#a9b7a2',
    nascita: { da: 240, peso: 1, cresce: 0.8, gruppo: 1 },
  },
  {
    id: 'arciere', nome: 'Arciere fragile', sprite: 'nemico.arciere', comportamento: 'arciere',
    vita: 16, velocita: 34, danno: 5, raggio: 6, contatto: 0.9, xp: 5, scala: 1, spinta: 1,
    colore: '#e0d8c0',
    nascita: { da: 130, peso: 1.5, cresce: 1, gruppo: 1 },
    // tiene la distanza fra `tieni` e `gittata`, e tira ogni `cadenza` secondi.
    // La freccia va a 100 (non 125): a quella velocita' si vedeva partire e
    // non si faceva in tempo a togliersi. Vive 2,2 secondi, quindi copre 220
    // pixel: la gittata di 130 la raggiunge ancora con margine
    abilita: { gittata: 130, tieni: 85, cadenza: 2.2, velocitaTiro: 100, dannoTiro: 7 },
  },
  {
    id: 'scarabeo', nome: 'Scarabeo reale', sprite: 'nemico.scarabeo', comportamento: 'sciame',
    // 53, non 62: entra in sette alla volta, e a quella velocita' lo sciame
    // si chiudeva addosso al giocatore invece di sfilargli accanto
    vita: 4, velocita: 53, danno: 3, raggio: 4, contatto: 0.5, xp: 1, scala: 1, spinta: 1.5,
    colore: '#e2b93a',
    nascita: { da: 100, peso: 2, cresce: 0.6, gruppo: 7 },
  },
  {
    id: 'cavalcalupo', nome: 'Cavalcalupo', sprite: 'nemico.cavalcalupo', comportamento: 'carica',
    vita: 28, velocita: 50, danno: 10, raggio: 7, contatto: 0.9, xp: 7, scala: 1.1, spinta: 0.6,
    colore: '#b8b0d8',
    nascita: { da: 180, peso: 1.5, cresce: 0.8, gruppo: 1 },
    // sotto `distanza` si ferma, mira per `mira` secondi, poi carica per `durata` a `moltiplicatore` volte la velocita'
    abilita: { distanza: 150, mira: 0.55, durata: 0.45, moltiplicatore: 4.2, dannoCarica: 2, riposo: 1.2 },
  },
  {
    id: 'melma', nome: 'Melma ocra', sprite: 'nemico.melma', comportamento: 'scinde',
    vita: 30, velocita: 30, danno: 7, raggio: 6, contatto: 0.9, xp: 4, scala: 1.1, spinta: 0.8,
    colore: '#e0b43c',
    nascita: { da: 100, peso: 2, cresce: 1, gruppo: 1 },
    abilita: { figlio: 'melmetta', quanti: 2 },
  },
  {
    id: 'melmetta', nome: 'Melmetta', sprite: 'nemico.melmetta', comportamento: 'insegue',
    vita: 10, velocita: 52, danno: 4, raggio: 5, contatto: 0.7, xp: 2, scala: 0.85, spinta: 1.3,
    colore: '#8fd06a',
    // non entra da sola: nasce solo da una melma che muore
    nascita: { da: Infinity, peso: 0, cresce: 0, gruppo: 1 },
  },
  {
    id: 'ciclope', nome: 'Ciclope schiacciante', sprite: 'nemico.ciclope', comportamento: 'capo',
    vita: 420, velocita: 24, danno: 20, raggio: 12, contatto: 1.2, xp: 60, scala: 2, spinta: 0,
    colore: '#c9a98a',
    // non entra a caso: arriva agli orari di `prossimoCapo`
    nascita: { da: Infinity, peso: 0, cresce: 0, gruppo: 1 },
    abilita: {
      schianto: { ogni: 3.5, mira: 0.8, raggio: 58, danno: 18 },
      evoca: { ogni: 9, tipo: 'scarabeo', quanti: 4 },
    },
  },
];

export const nemicoById = (id) => NEMICI.find((n) => n.id === id) || NEMICI[0];

/** La corona: che cosa cambia in un nemico elite. */
export const ELITE = { vita: 3, danno: 1.6, xp: 4, scala: 1.3, spinta: 0.5 };

/* ─── Le cinque leve della difficolta' ─── */

/**
 * Nemici al secondo. Una curva morbida sui minuti: 0,55 all'inizio, 1,5 a
 * tre minuti, 3,3 a sette, 6,4 a dodici, 8,8 a quindici, 13,5 a venti. La
 * parte quadratica e' quella che rende il tardo gioco estremo. Lo sciame
 * entra a gruppi di sette: il suo peso cresce piano apposta.
 */
export function ondaAlSecondo(secondi) {
  const min = secondi / 60;
  return 0.55 + min * 0.25 + min * min * 0.02;
}

/**
 * La vita cresce col tempo: raddoppia a quattro minuti, e dopo il decimo
 * la parte quadratica prende il sopravvento — x5,4 a dodici, x7 a quindici,
 * x10 a venti. E' quello che rende il tardo gioco estremo anche per chi ha
 * tutto al massimo.
 */
export function vitaAlTempo(nemico, secondi) {
  const m = secondi / 600;
  return Math.round(nemico.vita * (1 + secondi / 240 + m * m));
}

/** La velocita' cresce piano e si ferma a +30%: un segugio piu' veloce del giocatore non e' difficile, e' ingiusto. */
export function velocitaAlTempo(secondi) {
  return 1 + Math.min(0.3, secondi / 1200);
}

/** Il peso di nascita di un tipo, adesso. Zero prima del suo minuto. */
export function pesoAlTempo(nemico, secondi) {
  const n = nemico.nascita;
  if (secondi < n.da) return 0;
  return n.peso + n.cresce * (secondi / 60);
}

/** I pesi di tutti i tipi, adesso: chi puo' entrare, e con che probabilita'. */
export function pesiAlTempo(secondi) {
  return NEMICI.map((t) => ({ tipo: t, peso: pesoAlTempo(t, secondi) })).filter((v) => v.peso > 0);
}

/** Il tipo che entra adesso, estratto coi pesi del momento. */
export function scegliTipo(caso, secondi) {
  const pesi = pesiAlTempo(secondi);
  let totale = 0;
  for (let i = 0; i < pesi.length; i += 1) totale += pesi[i].peso;
  let r = caso.numero() * totale;
  for (let i = 0; i < pesi.length; i += 1) {
    r -= pesi[i].peso;
    if (r <= 0) return pesi[i].tipo;
  }
  return pesi[pesi.length - 1]?.tipo ?? NEMICI[0];
}

/** La probabilita' che chi entra sia elite: zero nel primo minuto e mezzo, poi sale fino al 12%. */
export function eliteAlTempo(secondi) {
  if (secondi < 90) return 0;
  return Math.min(0.12, (secondi - 90) / 3000);
}

/** Quando arriva l'n-esimo miniboss (il primo e' lo zero): a due minuti, poi ogni tre. */
export const prossimoCapo = (n) => 120 + n * 180;

/** Il miniboss numero n ha piu' vita di quello prima: +50% ciascuno. */
export const vitaDelCapo = (n) => 1 + n * 0.5;

/* ─── La furia: la sesta leva, quella che si accende dopo il tetto ─── */

/**
 * Quando il giocatore arriva al livello massimo (`LIVELLO_MASSIMO` in
 * `moduli.js`) smette di crescere lui e comincia a crescere l'arena.
 *
 * Le altre cinque leve salgono col tempo dall'inizio della partita e sono
 * tarate su un giocatore che cresce insieme a loro; passato il tetto quel
 * patto salta, e senza la furia i nemici restano fermi mentre chi gioca ha
 * gia' tutto. Quindi da quell'istante — non dall'inizio della partita —
 * ogni minuto vale +5% di statistiche e +10% di nemici che entrano.
 *
 * Si compone, non si somma: il 5% del minuto dopo si prende sul valore
 * gia' cresciuto. Dieci minuti dopo il tetto i nemici hanno x1,63 di vita
 * e di danno e arrivano x2,6 piu' fitti; a venti, x2,7 e x6,7. Il conto e'
 * continuo, non a scatti: fra un minuto e l'altro la furia sale piano, che
 * e' meno leggibile di un gradino ma non regala mezzi minuti di tregua.
 *
 *   statistiche   la vita con cui un nemico entra e il danno che fa. Non
 *                 la velocita': un nemico piu' veloce del giocatore non e'
 *                 difficile, e' ingiusto, e resta al suo tetto di +30%
 *                 (`velocitaAlTempo`)
 *   quantita      quanti ne entrano al secondo. Quanti ce ne stiano
 *                 davvero in campo lo decide la vasca, che ne tiene
 *                 cinquecento e non uno di piu'
 */
export const FURIA = { statistiche: 0.05, quantita: 0.10 };

/** Da quanti minuti dura la furia. Zero se il tetto non e' ancora arrivato. */
export function minutiDiFuria(secondi, tettoT) {
  if (tettoT === null || tettoT === undefined) return 0;
  return Math.max(0, (secondi - tettoT) / 60);
}

/** Il moltiplicatore delle statistiche dei nemici, dopo `minuti` di furia. */
export const furiaStatistiche = (minuti) => (1 + FURIA.statistiche) ** minuti;

/** Il moltiplicatore di quanti nemici entrano, dopo `minuti` di furia. */
export const furiaQuantita = (minuti) => (1 + FURIA.quantita) ** minuti;
