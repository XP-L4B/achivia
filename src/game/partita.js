/**
 * La partita: lo stato e il passo di simulazione.
 *
 * Non c'e' React qui dentro e non ci sono immagini: questo file sa dove
 * stanno le cose e che cosa succede in un sessantesimo di secondo. Si puo'
 * far girare in Node senza un browser — e' cosi' che lo si prova.
 *
 * Le regole che reggono la fluidita', tutte qui:
 *
 *   1. Nessuna allocazione nel passo. Nemici, proiettili, tiri, gemme,
 *      particelle, onde e fulmini vivono in vasche di oggetti creati
 *      all'inizio; nascere vuol dire riempirne uno, morire vuol dire
 *      spostarlo in fondo. Le ricerche di vicinato riempiono buffer
 *      preallocati.
 *   2. Le collisioni passano dall'hash spaziale (`griglia.js`).
 *   3. Chi muore in un passo viene segnato e tolto alla fine del passo,
 *      cosi' gli indici della griglia restano validi mentre si lavora.
 *
 * Il lavoro e' diviso: i nemici e le loro abilita' stanno qui
 * (`comportamentoDi`); le armi del giocatore e i suoi proiettili stanno in
 * `combattimento.js`; i boss e i loro pattern in `boss.js`; le casse in
 * `casse.js` e i loro effetti in `effetti.js`; le carte della salita di
 * livello in `contenuti/scelte.js`. I numeri stanno tutti in `contenuti/`.
 *
 * Le fasi: 'scelta' (una carta da scegliere, il tempo e' fermo),
 * 'gioco', 'morte' (l'animazione di morte del giocatore) e 'finita'.
 */

import { creaCaso } from './caso';
import { creaGriglia } from './griglia';
import { vasca, compatta } from './vasca';
import { statistichePartenza, personaggioById } from './contenuti/personaggi';
import {
  nemicoById, ELITE, ondaAlSecondo, vitaAlTempo, velocitaAlTempo, scegliTipo, eliteAlTempo,
  prossimoCapo, vitaDelCapo, minutiDiFuria, furiaStatistiche, furiaQuantita,
} from './contenuti/nemici';
import { sogliaLivello, LIVELLO_MASSIMO } from './contenuti/moduli';
import { offriScelte, applicaScelta, nuovaArma } from './contenuti/scelte';
import { bossDelTurno, prossimoBoss, vitaDelBoss, ONDATA_COL_BOSS, CURA_BOSS, GEMME_BOSS } from './contenuti/boss';
import { aggiornaArmi, aggiornaProiettili, RAGGIO_GIOCATORE } from './combattimento';
import { agisciBoss, evocaIntorno, schianto, ST_AVVICINA, ST_MIRA, ST_CARICA, ST_RIPOSA } from './boss';
import { CONFIG_CASSE, raritaById, scegliRarita } from './contenuti/casse';
import { nuovoBonus, aggiornaEffetti } from './effetti';
import { nuovoImpatto, aggiornaImpatti } from './combattimento';
import { sinergieAttive, sinergiaById } from './contenuti/sinergie';
import { nuovaCassa, aggiornaCasse, nasciCassa } from './casse';
import { tagliaGemma } from './contenuti/gemme';

export const MONDO = { w: 2400, h: 1600 };
export const MAX_NEMICI = 500;
const MAX_PROIETTILI = 240;
const MAX_TIRI = 150;
const MAX_GEMME = 300;
const MAX_PARTICELLE = 400;
const MAX_ONDE = 24;
const MAX_FULMINI = 48;
const MAX_IMPATTI = 12;
const MAX_TESTI = 8;

/** Secondi di invulnerabilita' dopo un colpo subito. Lo legge anche chi disegna la posa "colpito". */
export const INVULNERABILITA = 0.35;
const DURATA_MORTE = 1.0;
const RAGGIO_VISTA_DI_PARTENZA = 300;
const VICINI_PER_SPINTA = 8;
const VASCA_PIENA = 0.92;
/** Il fuoco addosso a un nemico: quante volte al secondo fa male. */
const TICK_BRUCIA = 0.5;

const viciniSpinta = new Int32Array(VICINI_PER_SPINTA);

const nuovoNemico = () => ({
  x: 0, y: 0, vita: 1, vitaMax: 1, morso: 0, lampo: 0, fase: 0, tipo: null, morto: false, kx: 0, ky: 0,
  st: 0, tim: 0, t2: 0, cx: 0, cy: 0, elite: false, scala: 1, vel: 0,
  // quello che le armi gli lasciano addosso
  uid: 0, tocco: 0, brucia: 0, bruciaDanno: 0, bruciaTick: 0, lento: 0,
  // quello che serve a un boss: il punto mirato, l'attacco in corso coi suoi numeri, la fase, il passo nella sequenza
  tx: 0, ty: 0, attacco: null, ab: null, faseBoss: 0, passo: 0, attesa: 0,
});
const nuovoProiettile = () => ({
  x: 0, y: 0, vx: 0, vy: 0, vita: 0, danno: 0, morto: false,
  perfora: 0, segue: false, sterzo: 0, scoppio: 0, brucia: 0, arma: 'freccia', colpiti: 0, uid: new Int32Array(8),
  // la falce e la sfera: il ritorno a meta' strada, il rimbalzo sul vicino
  durata: 0, ritorno: false, giro: 0, rimbalza: 0, portataRimbalzo: 0, crescita: 0,
});
const nuovoTiro = () => ({ x: 0, y: 0, vx: 0, vy: 0, vita: 0, danno: 0, morto: false });
const nuovaGemma = () => ({ x: 0, y: 0, xp: 0, taglia: 0, vx: 0, vy: 0, attratta: false, tirata: 0, morta: false, fase: 0 });
const nuovaParticella = () => ({ x: 0, y: 0, vx: 0, vy: 0, vita: 0, durata: 0, colore: '#fff', morta: false });
const nuovaOnda = () => ({ x: 0, y: 0, r: 0, rMax: 0, vita: 0, durata: 0, colore: '#fff', morta: false });
const nuovoFulmine = () => ({ x1: 0, y1: 0, x2: 0, y2: 0, vita: 0, durata: 0, spessore: 1.5, colore: '#d6f4ff', morto: false });
const nuovoTesto = () => ({ x: 0, y: 0, testo: '', colore: '#fff', vita: 0, durata: 0, morto: false });

/**
 * Crea una partita nuova.
 *
 *   personaggio    l'id del personaggio scelto
 *   livello        il livello dell'account: mezzo punto percentuale di
 *                  statistiche per ogni livello salito
 *   moduliGratis   quante carte si scelgono prima di cominciare
 *   seme           il seme del caso
 *   maxNemici      la vasca dei nemici: si cambia solo per le prove di carico
 */
export function creaPartita({ personaggio = 'soldato', livello = 1, moduliGratis = 0, seme = 1, maxNemici = MAX_NEMICI } = {}) {
  const caso = creaCaso(seme);
  const scheda = personaggioById(personaggio);
  const stats = statistichePartenza(scheda, livello);

  const stato = {
    seme, caso, scheda,
    mondo: MONDO,
    tempo: 0,
    fase: moduliGratis > 0 ? 'scelta' : 'gioco',
    scelteIniziali: moduliGratis,
    offerta: [],
    uccisioni: 0,
    accumuloSpawn: 0,
    capiNati: 0,
    bossNati: 0,
    bossAbbattuti: 0,
    boss: null,          // il boss in campo, o null
    bottino: false,      // un boss e' appena caduto: la carta in piu' si offre al passo dopo
    motivo: moduliGratis > 0 ? 'iniziale' : 'livello',
    // le casse: quando arriva la prossima, quante se ne sono aperte, l'ultimo effetto preso (per il cruscotto)
    prossimaCassa: CONFIG_CASSE.nascita.prima,
    ultimaCadutaElite: -1e9,   // quando un'elite ha lasciato l'ultima cassa
    casseAperte: 0,
    annuncio: null,
    lampoSchermo: 0, lampoColore: '#ffffff', scossa: 0,
    // i moltiplicatori degli effetti attivi, ricomposti a ogni passo
    bonus: nuovoBonus(),
    // le sinergie gia' annunciate: quando `giocatore.sinergie` cambia, le nuove si dicono
    sinergieDette: null,
    // le misure per i traguardi dell'arena: la serie di uccisioni senza un colpo subito,
    // il tetto del livello e la furia che ne segue: `tettoT` e' l'istante in
    // cui il giocatore ha smesso di crescere, e i due moltiplicatori si
    // rifanno a ogni passo da li' (stanno sullo stato per non ricalcolarli
    // per ogni nemico che entra)
    tettoT: null, furiaMinuti: 0, furia: 1, furiaEntrate: 1,
    // i colpi subiti, i critici, le casse epiche, il livello ai due minuti, i boss abbattuti puliti
    serie: 0, serieMax: 0, colpiSubiti: 0, critici: 0, casseEpiche: 0, livelloA120: 0, bossPuliti: 0, colpiAlBoss: 0,
    prossimoUid: 1,
    raggioVista: RAGGIO_VISTA_DI_PARTENZA,
    molt: { velocita: 1 },
    giocatore: {
      x: MONDO.w / 2, y: MONDO.h / 2,
      vx: 0, vy: 0, verso: 1, muove: false,
      vita: stats.vitaMax, stats,
      invulnerabile: 0,
      xp: 0, livello: 1, prese: {},
      armi: [nuovaArma('freccia')],
      attivi: [],
      sinergie: [],
      animT: 0, morteT: 0, lampo: 0,
    },
    nemici: vasca(maxNemici, nuovoNemico),
    proiettili: vasca(MAX_PROIETTILI, nuovoProiettile),
    tiri: vasca(MAX_TIRI, nuovoTiro),
    gemme: vasca(MAX_GEMME, nuovaGemma),
    particelle: vasca(MAX_PARTICELLE, nuovaParticella),
    onde: vasca(MAX_ONDE, nuovaOnda),
    fulmini: vasca(MAX_FULMINI, nuovoFulmine),
    casse: vasca(CONFIG_CASSE.massimoInVasca, nuovaCassa),
    impatti: vasca(MAX_IMPATTI, nuovoImpatto),
    testi: vasca(MAX_TESTI, nuovoTesto),
    griglia: creaGriglia(MONDO.w, MONDO.h, 32),
    decori: [],
    eventi: [],
    // Le porte che il combattimento e i boss usano per toccare le vasche e
    // il giocatore: stanno sullo stato, cosi' `combattimento.js` e `boss.js`
    // non importano questo file (che importa loro).
    uccidi, onda, spruzza, fulmine, entra, ferisci, tira, galleggia,
  };

  for (let y = 120; y < MONDO.h; y += 240) {
    for (let x = 120; x < MONDO.w; x += 240) {
      if (caso.numero() < 0.55) stato.decori.push({ x: x + caso.fra(-40, 40), y: y + caso.fra(-40, 40), fase: caso.numero() });
    }
  }

  stato.giocatore.sinergie = sinergieAttive(stato.giocatore);
  stato.sinergieDette = stato.giocatore.sinergie;
  if (stato.fase === 'scelta') stato.offerta = offriScelte(caso, stato.giocatore);
  return stato;
}

/** Le sinergie nuove dall'ultima volta: una scritta e un evento per ognuna. Costa un confronto di identita'. */
function annunciaSinergie(stato) {
  const g = stato.giocatore;
  if (g.sinergie === stato.sinergieDette) return;
  const prima = stato.sinergieDette || [];
  for (let i = 0; i < g.sinergie.length; i += 1) {
    if (prima.includes(g.sinergie[i])) continue;
    const s = sinergiaById(g.sinergie[i]);
    if (s) { galleggia(stato, g.x, g.y - 22, `SINERGIA: ${s.nome.toUpperCase()}`, '#ffc233', 1.8); stato.eventi.push('sinergia'); }
  }
  stato.sinergieDette = g.sinergie;
}

/* ─── Effetti ─── */
function spruzza(stato, x, y, quante, colore, forza) {
  const v = stato.particelle;
  for (let i = 0; i < quante && v.n < v.lista.length; i += 1) {
    const p = v.lista[v.n]; v.n += 1;
    const a = stato.caso.fra(0, Math.PI * 2);
    const s = stato.caso.fra(forza * 0.4, forza);
    p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
    p.durata = stato.caso.fra(0.25, 0.5); p.vita = p.durata; p.colore = colore; p.morta = false;
  }
}

function onda(stato, x, y, rMax, colore, durata = 0.45) {
  const v = stato.onde;
  if (v.n >= v.lista.length) return;
  const o = v.lista[v.n]; v.n += 1;
  o.x = x; o.y = y; o.r = 0; o.rMax = rMax; o.durata = durata; o.vita = durata; o.colore = colore; o.morta = false;
}

function fulmine(stato, x1, y1, x2, y2, durata = 0.18, spessore = 1.5, colore = '#d6f4ff') {
  const v = stato.fulmini;
  if (v.n >= v.lista.length) return;
  const f = v.lista[v.n]; v.n += 1;
  f.x1 = x1; f.y1 = y1; f.x2 = x2; f.y2 = y2; f.durata = durata; f.vita = durata; f.spessore = spessore; f.colore = colore; f.morto = false;
}

/** Una scritta che sale e sbiadisce: il contenuto di una cassa, per chi guarda la tela. */
function galleggia(stato, x, y, testo, colore, durata = 1.3) {
  const v = stato.testi;
  if (v.n >= v.lista.length) return;
  const t = v.lista[v.n]; v.n += 1;
  t.x = x; t.y = y; t.testo = testo; t.colore = colore; t.durata = durata; t.vita = durata; t.morto = false;
}

/* ─── Una nascita: la porta unica ─── */
export function entra(stato, tipoId, x, y, { elite = false, vita = null } = {}) {
  const v = stato.nemici;
  if (v.n >= v.lista.length) return null;
  const tipo = typeof tipoId === 'string' ? nemicoById(tipoId) : tipoId;
  const e = v.lista[v.n]; v.n += 1;
  e.x = Math.min(stato.mondo.w - 8, Math.max(8, x));
  e.y = Math.min(stato.mondo.h - 8, Math.max(8, y));
  e.tipo = tipo;
  e.elite = elite;
  e.scala = tipo.scala * (elite ? ELITE.scala : 1);
  e.vitaMax = Math.round((vita ?? vitaAlTempo(tipo, stato.tempo)) * (elite ? ELITE.vita : 1) * stato.furia);
  e.vita = e.vitaMax;
  e.morso = 0; e.lampo = 0; e.fase = stato.caso.numero(); e.morto = false; e.kx = 0; e.ky = 0;
  e.st = ST_AVVICINA; e.tim = 0; e.t2 = tipo.abilita?.evoca ? tipo.abilita.evoca.ogni * 0.5 : 0; e.cx = 0; e.cy = 0; e.vel = 0;
  e.uid = stato.prossimoUid; stato.prossimoUid += 1;
  e.tocco = 0; e.brucia = 0; e.bruciaDanno = 0; e.bruciaTick = 0; e.lento = 0;
  e.tx = 0; e.ty = 0; e.attacco = null; e.ab = null; e.faseBoss = 0; e.passo = 0; e.attesa = 0;
  return e;
}

function puntoFuoriVista(stato, extra = 0) {
  const g = stato.giocatore;
  const distanza = Math.max(RAGGIO_VISTA_DI_PARTENZA, stato.raggioVista + 40) + stato.caso.fra(0, 80) + extra;
  let x = 0; let y = 0;
  for (let tentativi = 0; tentativi < 6; tentativi += 1) {
    const a = stato.caso.fra(0, Math.PI * 2);
    x = g.x + Math.cos(a) * distanza; y = g.y + Math.sin(a) * distanza;
    if (x > 16 && y > 16 && x < stato.mondo.w - 16 && y < stato.mondo.h - 16) break;
  }
  return { x, y };
}

/* ─── La regia ─── */
function nascite(stato, dt) {
  const N = stato.nemici;
  // il boss: al suo orario, uno alla volta. Mentre c'e' lui le ondate rallentano; il miniboss ha i suoi orari, che non coincidono.
  if (!stato.boss && stato.tempo >= prossimoBoss(stato.bossNati)) {
    const p = puntoFuoriVista(stato, 40);
    const scheda = bossDelTurno(stato.bossNati);
    const e = entra(stato, scheda, p.x, p.y, { vita: vitaAlTempo(scheda, stato.tempo) * vitaDelBoss(stato.bossNati) });
    if (e) {
      stato.boss = e; stato.bossNati += 1; stato.colpiAlBoss = stato.colpiSubiti;
      onda(stato, e.x, e.y, 80, scheda.colore, 0.8);
      stato.eventi.push('boss');
    }
  }
  if (stato.tempo >= prossimoCapo(stato.capiNati)) {
    const p = puntoFuoriVista(stato, 20);
    const capo = nemicoById('ciclope');
    const e = entra(stato, capo, p.x, p.y, { vita: vitaAlTempo(capo, stato.tempo) * vitaDelCapo(stato.capiNati) });
    if (e) { stato.capiNati += 1; stato.eventi.push('capo'); }
  }
  stato.accumuloSpawn += ondaAlSecondo(stato.tempo) * stato.furiaEntrate * (stato.boss ? ONDATA_COL_BOSS : 1) * dt;
  while (stato.accumuloSpawn >= 1) {
    stato.accumuloSpawn -= 1;
    if (N.n >= N.lista.length * VASCA_PIENA) continue;
    const tipo = scegliTipo(stato.caso, stato.tempo);
    const elite = stato.caso.numero() < eliteAlTempo(stato.tempo);
    const p = puntoFuoriVista(stato);
    const quanti = tipo.nascita.gruppo || 1;
    for (let k = 0; k < quanti; k += 1) {
      const sx = quanti > 1 ? stato.caso.fra(-22, 22) : 0;
      const sy = quanti > 1 ? stato.caso.fra(-22, 22) : 0;
      entra(stato, tipo, p.x + sx, p.y + sy, { elite: elite && k === 0 });
    }
  }
}

/** Un tiro di un nemico: verso il giocatore, o lungo `angolo` se e' dato. */
function tira(stato, e, velocita, danno, angolo = null) {
  const v = stato.tiri;
  if (v.n >= v.lista.length) return;
  const g = stato.giocatore;
  const a = angolo ?? Math.atan2(g.y - 6 - e.y, g.x - e.x);
  const t = v.lista[v.n]; v.n += 1;
  t.x = e.x; t.y = e.y - 6;
  t.vx = Math.cos(a) * velocita; t.vy = Math.sin(a) * velocita;
  t.vita = 2.2; t.danno = danno; t.morto = false;
}

function lasciaGemma(stato, x, y, xp) {
  const G = stato.gemme;
  // vasca piena: l'esperienza confluisce nella prima gemma, che cresce di
  // fascia insieme a quello che ha inghiottito
  if (G.n >= G.lista.length) {
    const prima = G.lista[0];
    prima.xp += xp; prima.taglia = tagliaGemma(prima.xp);
    return;
  }
  const gm = G.lista[G.n]; G.n += 1;
  gm.x = x; gm.y = y; gm.xp = xp; gm.taglia = tagliaGemma(xp);
  gm.vx = 0; gm.vy = 0; gm.attratta = false; gm.tirata = 0; gm.morta = false; gm.fase = stato.caso.numero();
}

/** La cassa che un nemico grosso lascia dove muore. `quale` e' una rarita' o 'pesca'. */
function lasciaCassa(stato, e, quale) {
  if (!quale) return null;
  const m = stato.mondo; const margine = CONFIG_CASSE.nascita.margine;
  const x = Math.min(m.w - margine, Math.max(margine, e.x));
  const y = Math.min(m.h - margine, Math.max(margine, e.y));
  return nasciCassa(stato, x, y, quale === 'pesca' ? scegliRarita(stato.caso) : raritaById(quale));
}

/* ─── La morte di un nemico: una porta sola per tutte le cause ─── */
function uccidi(stato, e) {
  if (e.morto) return;
  e.morto = true;
  stato.uccisioni += 1;
  stato.serie += 1; if (stato.serie > stato.serieMax) stato.serieMax = stato.serie;
  const t = e.tipo;
  // i grossi lasciano una cassa: il boss, il miniboss, e chi porta la corona
  if (t.comportamento === 'boss') lasciaCassa(stato, e, CONFIG_CASSE.caduta.boss);
  else if (t.comportamento === 'capo') lasciaCassa(stato, e, CONFIG_CASSE.caduta.capo);
  else if (e.elite && stato.tempo - stato.ultimaCadutaElite >= CONFIG_CASSE.caduta.eliteOgni) {
    if (lasciaCassa(stato, e, CONFIG_CASSE.caduta.elite)) stato.ultimaCadutaElite = stato.tempo;
  }
  spruzza(stato, e.x, e.y - 6, e.elite ? 14 : 8, e.elite ? '#ffc233' : t.colore, e.elite ? 110 : 80);
  if (t.comportamento === 'boss') {
    // il bottino: l'esperienza in un anello di gemme, un po' di vita, e una carta al passo dopo
    const g = stato.giocatore;
    for (let k = 0; k < GEMME_BOSS; k += 1) {
      const a = (Math.PI * 2 * k) / GEMME_BOSS;
      lasciaGemma(stato, e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 12, t.xp / GEMME_BOSS);
    }
    g.vita = Math.min(g.stats.vitaMax, g.vita + g.stats.vitaMax * CURA_BOSS);
    stato.bottino = true;
    stato.boss = null; stato.bossAbbattuti += 1;
    if (stato.colpiSubiti === stato.colpiAlBoss) stato.bossPuliti += 1;
    onda(stato, e.x, e.y, 130, '#ffc233', 0.9); onda(stato, e.x, e.y, 70, t.colore, 0.6);
    spruzza(stato, e.x, e.y - 10, 30, '#ffc233', 140);
    stato.eventi.push('boss-morto');
    return;
  }
  lasciaGemma(stato, e.x, e.y, t.xp * (e.elite ? ELITE.xp : 1));
  if (t.comportamento === 'capo') { onda(stato, e.x, e.y, 90, '#ffc233', 0.7); stato.eventi.push('capo-morto'); }
  if (t.comportamento === 'scinde' && t.abilita) {
    for (let k = 0; k < t.abilita.quanti; k += 1) {
      const a = stato.caso.fra(0, Math.PI * 2);
      const f = entra(stato, t.abilita.figlio, e.x + Math.cos(a) * 6, e.y + Math.sin(a) * 6, { elite: e.elite });
      if (f) { f.kx = Math.cos(a) * 120; f.ky = Math.sin(a) * 120; }
    }
  }
}

function ferisci(stato, danno) {
  const g = stato.giocatore;
  if (g.invulnerabile > 0) return false;
  // la barriera: il colpo arriva, si vede, e non passa
  if (stato.bonus.barriera) { spruzza(stato, g.x, g.y - 8, 4, '#4ad9ff', 50); stato.eventi.push('parato'); return false; }
  // l'armatura toglie punti al colpo, ma un colpo fa sempre almeno uno.
  // Ogni colpo che il giocatore prende passa da qui — il morso, i tiri, i
  // colpi dei boss — quindi la furia si moltiplica in questo punto solo
  g.vita -= Math.max(1, danno * stato.furia - (g.stats.armatura || 0));
  stato.colpiSubiti += 1; stato.serie = 0;
  g.invulnerabile = INVULNERABILITA;
  g.lampo = 0.12;
  stato.eventi.push('colpito');
  spruzza(stato, g.x, g.y - 8, 6, '#ff7a5c', 60);
  if (g.vita <= 0) {
    g.vita = 0; stato.fase = 'morte'; g.morteT = 0; stato.eventi.push('morte');
    return true;
  }
  return false;
}

function controllaLivello(stato) {
  const g = stato.giocatore;
  // al tetto il giocatore ha finito di crescere: l'esperienza non si
  // accumula piu' (resterebbe li' a gonfiarsi senza servire a niente) e
  // parte l'orologio della furia
  if (g.livello >= LIVELLO_MASSIMO) {
    if (stato.tettoT === null) { stato.tettoT = stato.tempo; stato.eventi.push('tetto'); }
    g.xp = 0;
    return;
  }
  const soglia = sogliaLivello(g.livello);
  if (g.xp < soglia) return;
  g.xp -= soglia;
  g.livello += 1;
  stato.eventi.push('livello');
  const offerta = offriScelte(stato.caso, g);
  if (offerta.length === 0) return;   // mazzo finito: il livello sale, e non c'e' niente da scegliere
  stato.fase = 'scelta'; stato.motivo = 'livello';
  stato.offerta = offerta;
}

/** Il bottino di un boss: una carta in piu', quando il passo e' finito e non c'e' gia' una scelta aperta. */
function controllaBottino(stato) {
  if (!stato.bottino || stato.fase !== 'gioco') return;
  stato.bottino = false;
  stato.fase = 'scelta'; stato.motivo = 'bottino';
  stato.offerta = offriScelte(stato.caso, stato.giocatore);
  stato.eventi.push('bottino');
}

/**
 * Applica la carta scelta e riprende. Se c'erano scelte iniziali da fare,
 * ne resta una in meno e si offre di nuovo.
 */
export function scegliOpzione(stato, id) {
  if (stato.fase !== 'scelta') return false;
  if (!stato.offerta.some((o) => o.id === id)) return false;
  if (!applicaScelta(stato.giocatore, id)) return false;
  if (stato.scelteIniziali > 0) {
    stato.scelteIniziali -= 1;
    if (stato.scelteIniziali > 0) { stato.offerta = offriScelte(stato.caso, stato.giocatore); return true; }
  }
  stato.offerta = [];
  stato.fase = 'gioco';
  return true;
}
/** Il nome di prima: chi lo usa continua a funzionare. */
export const scegliModulo = scegliOpzione;

function comportamentoDi(stato, e, d, dx, dy, dt) {
  const t = e.tipo;
  const base = t.velocita * stato.molt.velocita * (e.lento > 0 ? 0.55 : 1);
  switch (t.comportamento) {
    case 'arciere': {
      const ab = t.abilita;
      if (e.tim > 0) e.tim -= dt;
      if (d > ab.gittata) { e.cx = dx; e.cy = dy; e.vel = base; }
      else if (d < ab.tieni) { e.cx = -dx; e.cy = -dy; e.vel = base * 0.9; }
      else { e.cx = -dy; e.cy = dx; e.vel = base * 0.5; }
      if (d <= ab.gittata && e.tim <= 0) {
        tira(stato, e, ab.velocitaTiro, ab.dannoTiro);
        e.tim = ab.cadenza;
        stato.eventi.push('tiro');
      }
      return;
    }
    case 'carica': {
      const ab = t.abilita;
      if (e.tim > 0) e.tim -= dt;
      if (e.st === ST_AVVICINA) {
        e.cx = dx; e.cy = dy; e.vel = base;
        if (d < ab.distanza) { e.st = ST_MIRA; e.tim = ab.mira; }
      } else if (e.st === ST_MIRA) {
        e.cx = dx; e.cy = dy; e.vel = 0;
        if (e.tim <= 0) { e.st = ST_CARICA; e.tim = ab.durata; stato.eventi.push('carica'); }
      } else if (e.st === ST_CARICA) {
        e.vel = base * ab.moltiplicatore;
        if (e.tim <= 0) { e.st = ST_RIPOSA; e.tim = ab.riposo; }
      } else {
        e.cx = dx; e.cy = dy; e.vel = base * 0.4;
        if (e.tim <= 0) e.st = ST_AVVICINA;
      }
      return;
    }
    case 'boss':
      agisciBoss(stato, e, d, dx, dy, dt);
      return;
    case 'capo': {
      const ab = t.abilita;
      const g = stato.giocatore;
      if (e.tim > 0) e.tim -= dt;
      if (e.t2 > 0) e.t2 -= dt;
      if (e.t2 <= 0) { evocaIntorno(stato, e, ab.evoca.tipo, ab.evoca.quanti); e.t2 = ab.evoca.ogni; }
      if (e.st === ST_MIRA) {
        e.vel = 0;
        if (e.tim <= 0) {
          schianto(stato, e, ab.schianto, d);
          e.st = ST_AVVICINA; e.tim = ab.schianto.ogni;
        }
        return;
      }
      e.cx = dx; e.cy = dy; e.vel = base;
      if (e.tim <= 0 && d < ab.schianto.raggio * 0.8 && g.vita > 0) { e.st = ST_MIRA; e.tim = ab.schianto.mira; }
      return;
    }
    case 'sciame': {
      const s = Math.sin((stato.tempo + e.fase * 10) * 7) * 0.5;
      e.cx = dx - dy * s; e.cy = dy + dx * s; e.vel = base;
      return;
    }
    default:
      e.cx = dx; e.cy = dy; e.vel = base;
  }
}

/**
 * Un passo di simulazione. `asse` e' la direzione chiesta dall'ingresso,
 * gia' normalizzata (o zero). `dt` e' fisso: chi chiama lo garantisce.
 */
export function avanza(stato, dt, asse) {
  stato.eventi.length = 0;
  const g = stato.giocatore;

  if (stato.fase === 'finita') return;
  if (stato.fase === 'morte') {
    g.morteT += dt;
    avanzaEffetti(stato, dt);
    if (g.morteT >= DURATA_MORTE) { stato.fase = 'finita'; stato.eventi.push('fine'); }
    return;
  }
  if (stato.fase !== 'gioco') return;

  stato.tempo += dt;
  g.animT += dt;
  if (stato.livelloA120 === 0 && stato.tempo >= 120) stato.livelloA120 = g.livello;
  // la furia del momento, una volta per passo: la leggono chi nasce (vita),
  // chi colpisce (danno) e le ondate (quanti entrano)
  stato.furiaMinuti = minutiDiFuria(stato.tempo, stato.tettoT);
  stato.furia = furiaStatistiche(stato.furiaMinuti);
  stato.furiaEntrate = furiaQuantita(stato.furiaMinuti);
  // gli effetti delle casse: un giro solo, che ricompone i moltiplicatori; il rallentamento
  // dei nemici passa dallo stesso moltiplicatore di velocita' che leggono tutti
  aggiornaEffetti(stato, dt);
  stato.molt.velocita = velocitaAlTempo(stato.tempo) * stato.bonus.nemici;
  annunciaSinergie(stato);

  /* Il giocatore */
  g.muove = asse.x !== 0 || asse.y !== 0;
  g.vx = asse.x * g.stats.velocita; g.vy = asse.y * g.stats.velocita;
  g.x = Math.min(stato.mondo.w - RAGGIO_GIOCATORE, Math.max(RAGGIO_GIOCATORE, g.x + g.vx * dt));
  g.y = Math.min(stato.mondo.h - RAGGIO_GIOCATORE, Math.max(RAGGIO_GIOCATORE, g.y + g.vy * dt));
  if (asse.x !== 0) g.verso = asse.x > 0 ? 1 : -1;
  if (g.invulnerabile > 0) g.invulnerabile -= dt;
  if (g.lampo > 0) g.lampo -= dt;

  nascite(stato, dt);

  /* La griglia dei nemici vivi */
  const N = stato.nemici; const gr = stato.griglia;
  gr.svuota();
  const nPrima = N.n;
  for (let i = 0; i < nPrima; i += 1) gr.metti(i, N.lista[i].x, N.lista[i].y);

  /* I nemici */
  let morto = false;
  for (let i = 0; i < nPrima; i += 1) {
    const e = N.lista[i];
    if (e.morto) continue;
    const t = e.tipo;
    let dx = g.x - e.x; let dy = g.y - e.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;   // sqrt, non hypot: e' il ciclo piu' caldo che c'e'
    dx /= d; dy /= d;
    comportamentoDi(stato, e, d, dx, dy, dt);
    if (stato.fase !== 'gioco') { morto = true; break; }
    let sx = 0; let sy = 0;
    const q = gr.raccogli(e.x, e.y, 12, viciniSpinta);
    for (let k = 0; k < q; k += 1) {
      const j = viciniSpinta[k];
      if (j === i) continue;
      const o = N.lista[j];
      const ox = e.x - o.x; const oy = e.y - o.y;
      const od = ox * ox + oy * oy;
      if (od > 0 && od < 144) { const inv = 1 / Math.sqrt(od); sx += ox * inv; sy += oy * inv; }
    }
    const spingi = t.comportamento === 'pesante' || t.comportamento === 'capo' || t.comportamento === 'boss' ? 6 : 22;
    e.x += (e.cx * e.vel + sx * spingi + e.kx) * dt;
    e.y += (e.cy * e.vel + sy * spingi + e.ky) * dt;
    e.kx *= 0.82; e.ky *= 0.82;
    e.x = Math.min(stato.mondo.w - 8, Math.max(8, e.x));
    e.y = Math.min(stato.mondo.h - 8, Math.max(8, e.y));
    if (e.lampo > 0) e.lampo -= dt;
    if (e.morso > 0) e.morso -= dt;
    if (e.tocco > 0) e.tocco -= dt;
    if (e.lento > 0) e.lento -= dt;
    // il fuoco addosso
    if (e.brucia > 0) {
      e.brucia -= dt; e.bruciaTick -= dt;
      if (e.bruciaTick <= 0) {
        e.bruciaTick = TICK_BRUCIA;
        e.vita -= e.bruciaDanno * TICK_BRUCIA; e.lampo = 0.05;
        spruzza(stato, e.x, e.y - 8, 2, '#ff9a4c', 40);
        if (e.vita <= 0) { uccidi(stato, e); continue; }
      }
      if (e.brucia <= 0) e.bruciaDanno = 0;
    }
    // il morso
    const raggio = t.raggio * e.scala + RAGGIO_GIOCATORE;
    // in forma spettrale il contatto non fa niente; i tiri e i colpi dei boss si'
    if (!stato.bonus.fantasma && d < raggio && e.morso <= 0 && g.invulnerabile <= 0) {
      e.morso = t.contatto;
      let danno = t.danno * (e.elite ? ELITE.danno : 1);
      if (t.comportamento === 'carica' && e.st === ST_CARICA) danno *= t.abilita.dannoCarica;
      if (t.comportamento === 'boss' && e.st === ST_CARICA && e.ab) danno *= e.ab.moltDanno || 1;
      if (ferisci(stato, danno)) { morto = true; break; }
    }
  }
  if (morto) return;

  /* Le armi del giocatore e i suoi proiettili */
  aggiornaArmi(stato, dt);
  aggiornaProiettili(stato, dt);
  aggiornaImpatti(stato, dt);

  /* I tiri dei nemici, contro il giocatore */
  const T = stato.tiri;
  for (let i = 0; i < T.n; i += 1) {
    const t = T.lista[i];
    t.x += t.vx * dt; t.y += t.vy * dt; t.vita -= dt;
    if (t.vita <= 0 || t.x < 0 || t.y < 0 || t.x > stato.mondo.w || t.y > stato.mondo.h) { t.morto = true; continue; }
    const dx = t.x - g.x; const dy = t.y - (g.y - 6);
    if (dx * dx + dy * dy < (RAGGIO_GIOCATORE + 2) * (RAGGIO_GIOCATORE + 2)) {
      t.morto = true;
      if (ferisci(stato, t.danno)) { compatta(T, 'morto'); return; }
    }
  }

  /* Le gemme: il raggio di raccolta porta il moltiplicatore degli effetti, e una
     gemma "tirata" (dal magnete) corre alla sua velocita'. L'esperienza entra da qui e
     solo da qui, col suo moltiplicatore. */
  const G = stato.gemme;
  const raccolta = g.stats.raccolta * stato.bonus.raccolta;
  for (let i = 0; i < G.n; i += 1) {
    const gm = G.lista[i];
    const dx = g.x - gm.x; const dy = g.y - gm.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (!gm.attratta && d < raccolta) gm.attratta = true;
    if (gm.attratta) {
      const s = gm.tirata > 0 ? gm.tirata : Math.min(420, 140 + (raccolta * 2 - d) * 3);
      gm.x += (dx / d) * Math.min(s * dt, d); gm.y += (dy / d) * Math.min(s * dt, d);
    }
    if (d < 10) { gm.morta = true; g.xp += gm.xp * stato.bonus.xp; stato.eventi.push('gemma'); }
  }

  /* Le casse: nascite, tocco, apertura */
  aggiornaCasse(stato, dt);

  avanzaEffetti(stato, dt);

  compatta(N, 'morto');
  compatta(stato.proiettili, 'morto');
  compatta(T, 'morto');
  compatta(G, 'morta');

  controllaLivello(stato);
  controllaBottino(stato);
}

function avanzaEffetti(stato, dt) {
  const V = stato.particelle;
  for (let i = 0; i < V.n; i += 1) {
    const p = V.lista[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.vy += 60 * dt;
    p.vita -= dt;
    if (p.vita <= 0) p.morta = true;
  }
  compatta(V, 'morta');
  const O = stato.onde;
  for (let i = 0; i < O.n; i += 1) {
    const o = O.lista[i];
    o.vita -= dt;
    o.r = o.rMax * (1 - Math.max(0, o.vita / o.durata));
    if (o.vita <= 0) o.morta = true;
  }
  compatta(O, 'morta');
  const F = stato.fulmini;
  for (let i = 0; i < F.n; i += 1) {
    const f = F.lista[i];
    f.vita -= dt;
    if (f.vita <= 0) f.morto = true;
  }
  compatta(F, 'morto');
  const T = stato.testi;
  for (let i = 0; i < T.n; i += 1) {
    const t = T.lista[i];
    t.vita -= dt; t.y -= 12 * dt;
    if (t.vita <= 0) t.morto = true;
  }
  compatta(T, 'morto');
  if (stato.lampoSchermo > 0) stato.lampoSchermo -= dt;
  if (stato.scossa > 0) stato.scossa -= dt;
}

/** La fotografia per il cruscotto: pochi numeri, nessun riferimento interno. */
export function fotografia(stato) {
  const g = stato.giocatore;
  return {
    vita: Math.max(0, Math.round(g.vita)),
    vitaMax: Math.round(g.stats.vitaMax),
    xp: g.xp,
    // al tetto la soglia vale zero: e' il segno che il cruscotto legge per
    // mostrare la furia al posto della barra dell'esperienza
    soglia: g.livello >= LIVELLO_MASSIMO ? 0 : sogliaLivello(g.livello),
    livello: g.livello,
    alTetto: g.livello >= LIVELLO_MASSIMO,
    furia: stato.furia,
    furiaMinuti: stato.furiaMinuti,
    tempo: stato.tempo,
    uccisioni: stato.uccisioni,
    nemici: stato.nemici.n,
    fase: stato.fase,
    armi: g.armi.map((a) => ({ id: a.id, livello: a.livello, evoluta: a.evoluta })),
    sinergie: g.sinergie.map((id) => ({ id, nome: sinergiaById(id)?.nome ?? id })),
    casse: stato.casseAperte,
    // la partita com'e' adesso, per i traguardi che si sbloccano mentre si gioca
    parziale: { ...riassunto(stato), inCorso: true },
    barriera: stato.bonus.barriera,
    fantasma: stato.bonus.fantasma,
    // gli effetti attivi, col tempo che resta; e l'ultima cassa aperta, per qualche secondo
    attivi: g.attivi.map((a) => ({ id: a.id, resta: a.resta, durata: a.durata })),
    annuncio: stato.annuncio && stato.tempo - stato.annuncio.t < 3.2 ? stato.annuncio : null,
    bossAbbattuti: stato.bossAbbattuti,
    boss: stato.boss ? {
      nome: stato.boss.tipo.nome,
      vita: Math.max(0, Math.round(stato.boss.vita)),
      vitaMax: Math.round(stato.boss.vitaMax),
      fase: stato.boss.faseBoss + 1,
      fasi: stato.boss.tipo.fasi.length,
      faseNome: stato.boss.tipo.fasi[stato.boss.faseBoss].nome,
      attacco: stato.boss.st === ST_MIRA ? stato.boss.attacco : null,
    } : null,
  };
}

/** Il riassunto a fine partita: quello che si salva. */
export function riassunto(stato) {
  const g = stato.giocatore;
  return {
    personaggio: stato.scheda.id,
    secondi: Math.round(stato.tempo),
    uccisioni: stato.uccisioni,
    livello: g.livello,
    seme: stato.seme,
    moduli: { ...g.prese },
    armi: g.armi.map((a) => `${a.id}:${a.livello}${a.evoluta ? '+' : ''}`),
    boss: stato.bossAbbattuti,
    casse: stato.casseAperte,
    sinergie: g.sinergie.slice(),
    // per i traguardi dell'arena
    colpiSubiti: stato.colpiSubiti,
    serie: stato.serieMax,
    critici: stato.critici,
    casseEpiche: stato.casseEpiche,
    bossPuliti: stato.bossPuliti,
    livelloA120: stato.livelloA120 || (stato.tempo < 120 ? g.livello : 0),
    statistiche: { armatura: g.stats.armatura || 0, proiettiliExtra: g.stats.proiettiliExtra || 0, danno: g.stats.danno },
  };
}
