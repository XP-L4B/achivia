/**
 * I boss: la macchina che li muove e i pattern dei loro attacchi.
 *
 * Il posto e' lo stesso di `combattimento.js` per le armi: un ramo per
 * pattern in `PATTERN`, e una sola macchina a stati (`agisciBoss`) che li
 * chiama. I numeri stanno in `contenuti/boss.js`; qui non ce n'e' uno.
 *
 * Ogni attacco fa lo stesso giro:
 *
 *   avvicina   il boss si muove come dice la scheda, finche' la ricarica
 *              e' scaduta e il giocatore e' `entro` la distanza;
 *   mira       `prepara` fissa il bersaglio (una direzione, un punto) e
 *              per `mira` secondi il boss sta fermo: e' il telegrafo, e chi
 *              disegna lo legge da `e.attacco` e `e.ab`;
 *   esegui     il colpo. Chi ferisce lo fa attraverso `stato.ferisci`, chi
 *              tira attraverso `stato.tira`, chi evoca attraverso
 *              `stato.entra`: le stesse porte dei nemici normali;
 *   riposa     un attimo fermo, poi da capo con l'attacco dopo in sequenza.
 *
 * Le fasi: quando la vita passa una soglia il boss cambia fase — si ferma,
 * lampeggia, manda un'onda — e da li' in poi usa la sequenza e i numeri
 * della fase nuova. Le porte sullo stato (`entra`, `ferisci`, `tira`,
 * `onda`, `spruzza`, `fulmine`) stanno li' perche' questo file non importa
 * `partita.js`, che importa lui.
 */

import { numeriAttacco, faseDiVita } from './contenuti/boss';
import { RAGGIO_GIOCATORE } from './combattimento';

export const ST_AVVICINA = 0;
export const ST_MIRA = 1;
export const ST_CARICA = 2;
export const ST_RIPOSA = 3;

/** Se il giocatore resta fuori portata per tanto, si passa all'attacco dopo. */
const PAZIENZA = 2.5;
/** Quanto sta fermo il boss quando cambia fase. */
const PAUSA_FASE = 1.0;
/** Il raggio a cui si mettono le creature evocate. */
const RAGGIO_EVOCAZIONE = 22;

/* Un punto di lavoro, riusato: chi lo riceve lo legge subito. */
const punto = { x: 0, y: 0 };

/* ─── Le porte che anche il miniboss usa ─── */

/** Evoca `quanti` creature di `tipo` in cerchio intorno a `e`. */
export function evocaIntorno(stato, e, tipo, quanti) {
  for (let k = 0; k < quanti; k += 1) {
    const a = (Math.PI * 2 * k) / quanti + e.fase * Math.PI * 2;
    stato.entra(stato, tipo, e.x + Math.cos(a) * RAGGIO_EVOCAZIONE, e.y + Math.sin(a) * RAGGIO_EVOCAZIONE);
  }
  stato.eventi.push('evoca');
}

/** Lo schianto a terra: un'onda, e chi sta nel cerchio si fa male. */
export function schianto(stato, e, ab, d) {
  stato.onda(stato, e.x, e.y, ab.raggio, '#ff7a5c');
  stato.spruzza(stato, e.x, e.y, 12, '#c9a98a', 90);
  stato.eventi.push('schianto');
  if (d < ab.raggio + RAGGIO_GIOCATORE) stato.ferisci(stato, ab.danno);
}

/**
 * Dove cade la k-esima meteora: la prima sul punto segnato, le altre
 * intorno, a `sparsa` di distanza, in direzioni che dipendono dal boss
 * (cosi' il telegrafo e il colpo dicono la stessa cosa).
 */
export function puntoMeteora(e, ab, k) {
  if (k === 0) { punto.x = e.tx; punto.y = e.ty; return punto; }
  const a = e.fase * Math.PI * 2 + (Math.PI * 2 * (k - 1)) / Math.max(1, ab.quante - 1);
  punto.x = e.tx + Math.cos(a) * ab.sparsa; punto.y = e.ty + Math.sin(a) * ab.sparsa * 0.6;
  return punto;
}

/** L'angolo del k-esimo dardo di una raffica, intorno alla direzione fissata in mira. */
export function angoloRaffica(e, ab, k) {
  const a0 = Math.atan2(e.cy, e.cx);
  if (ab.apertura >= Math.PI * 2) return a0 + (Math.PI * 2 * k) / ab.quanti;
  if (ab.quanti === 1) return a0;
  return a0 - ab.apertura / 2 + (ab.apertura * k) / (ab.quanti - 1);
}

const fissaDirezione = (stato, e, ab, d, dx, dy) => { e.cx = dx; e.cy = dy; };

/* ─── I pattern ───
   `prepara` all'inizio della mira, `esegui` alla fine. `esegui` torna
   `true` se l'attacco continua in uno stato suo (la carica). */
const PATTERN = {
  schianto: {
    prepara: null,
    esegui: (stato, e, ab, d) => { schianto(stato, e, ab, d); return false; },
  },
  carica: {
    prepara: fissaDirezione,
    esegui: (stato, e, ab, d, dx, dy, base) => {
      e.st = ST_CARICA; e.tim = ab.durata; e.vel = base * ab.moltiplicatore;
      stato.eventi.push('carica');
      return true;
    },
  },
  evoca: {
    prepara: null,
    esegui: (stato, e, ab) => { evocaIntorno(stato, e, ab.tipo, ab.quanti); return false; },
  },
  raffica: {
    prepara: fissaDirezione,
    esegui: (stato, e, ab) => {
      for (let k = 0; k < ab.quanti; k += 1) stato.tira(stato, e, ab.velocita, ab.danno, angoloRaffica(e, ab, k));
      stato.eventi.push('tiro');
      return false;
    },
  },
  raggio: {
    prepara: fissaDirezione,
    esegui: (stato, e, ab) => {
      const g = stato.giocatore;
      const x1 = e.x; const y1 = e.y - 6;
      const x2 = x1 + e.cx * ab.portata; const y2 = y1 + e.cy * ab.portata;
      stato.fulmine(stato, x1, y1, x2, y2, 0.4, ab.spessore, '#b6ff7a');
      stato.eventi.push('raggio');
      // la distanza del giocatore dal segmento
      const px = g.x - x1; const py = g.y - y1;
      const t = Math.max(0, Math.min(ab.portata, px * e.cx + py * e.cy));
      const qx = px - e.cx * t; const qy = py - e.cy * t;
      if (qx * qx + qy * qy < (ab.spessore + RAGGIO_GIOCATORE) ** 2) stato.ferisci(stato, ab.danno);
      return false;
    },
  },
  meteora: {
    prepara: (stato, e) => { e.tx = stato.giocatore.x; e.ty = stato.giocatore.y; },
    esegui: (stato, e, ab) => {
      const g = stato.giocatore;
      let colpito = false;
      for (let k = 0; k < ab.quante; k += 1) {
        const p = puntoMeteora(e, ab, k);
        stato.onda(stato, p.x, p.y, ab.raggio, '#ff9a4c', 0.4);
        stato.spruzza(stato, p.x, p.y - 4, 10, '#ff9a4c', 110);
        const dd = (g.x - p.x) * (g.x - p.x) + (g.y - p.y) * (g.y - p.y);
        if (!colpito && dd < (ab.raggio + RAGGIO_GIOCATORE) ** 2) { colpito = true; stato.ferisci(stato, ab.danno); }
      }
      stato.eventi.push('meteora');
      return false;
    },
  },
  frusta: {
    prepara: fissaDirezione,
    esegui: (stato, e, ab, d, dx, dy) => {
      stato.onda(stato, e.x + e.cx * ab.raggio * 0.5, e.y + e.cy * ab.raggio * 0.5, ab.raggio * 0.6, '#ff7a5c', 0.3);
      stato.eventi.push('frusta');
      if (d >= ab.raggio + RAGGIO_GIOCATORE) return false;
      // l'angolo fra la direzione fissata e dove sta il giocatore adesso
      const cos = e.cx * dx + e.cy * dy;
      if (cos >= Math.cos(ab.apertura / 2)) stato.ferisci(stato, ab.danno);
      return false;
    },
  },
};

export const patternDi = (nome) => PATTERN[nome] || null;

/* ─── La macchina ─── */

function cambiaFase(stato, e, nuova) {
  e.faseBoss = nuova;
  e.st = ST_RIPOSA; e.tim = PAUSA_FASE; e.vel = 0;
  e.attacco = null; e.ab = null; e.passo = 0; e.attesa = 0;
  e.lampo = 0.3;
  stato.onda(stato, e.x, e.y, 70, e.tipo.colore, 0.6);
  stato.spruzza(stato, e.x, e.y - 10, 18, e.tipo.colore, 120);
  stato.eventi.push('boss-fase');
}

function muovi(stato, e, fase, base, d, dx, dy, dt) {
  const t = e.tipo;
  if (t.movimento === 'tiene') {
    const tn = t.tieni;
    if (d > tn.lontano) { e.cx = dx; e.cy = dy; e.vel = base; }
    else if (d < tn.vicino) { e.cx = -dx; e.cy = -dy; e.vel = base * 0.9; }
    else { e.cx = -dy; e.cy = dx; e.vel = base * 0.5; }
    // lo sbalzo: se il giocatore e' sotto, ricompare piu' in la'
    if (t.sbalzo && fase.sbalzo) {
      if (e.t2 > 0) e.t2 -= dt;
      if (e.t2 <= 0 && d < t.sbalzo.sotto) {
        const a = Math.atan2(-dy, -dx) + (e.fase - 0.5) * 1.6;
        stato.onda(stato, e.x, e.y, 30, t.colore, 0.35);
        e.x = Math.min(stato.mondo.w - 24, Math.max(24, e.x + Math.cos(a) * t.sbalzo.a));
        e.y = Math.min(stato.mondo.h - 24, Math.max(24, e.y + Math.sin(a) * t.sbalzo.a));
        stato.onda(stato, e.x, e.y, 30, t.colore, 0.35);
        stato.spruzza(stato, e.x, e.y - 8, 10, t.colore, 80);
        e.t2 = t.sbalzo.ogni;
        stato.eventi.push('sbalzo');
      }
    }
    return;
  }
  e.cx = dx; e.cy = dy; e.vel = base;
}

/**
 * Un passo del boss. Chi chiama ha gia' calcolato la distanza `d` e la
 * direzione normalizzata (`dx`, `dy`) verso il giocatore.
 */
export function agisciBoss(stato, e, d, dx, dy, dt) {
  const t = e.tipo;
  // la fase: se la vita e' scesa sotto una soglia, si cambia (anche piu' di una in un colpo)
  const dovuta = faseDiVita(t, e.vita / e.vitaMax);
  if (dovuta > e.faseBoss) { cambiaFase(stato, e, dovuta); return; }
  const fase = t.fasi[e.faseBoss];
  const base = t.velocita * stato.molt.velocita * fase.velocita * (e.lento > 0 ? 0.7 : 1);
  if (e.tim > 0) e.tim -= dt;

  switch (e.st) {
    case ST_MIRA: {
      e.vel = 0;
      if (e.tim > 0) return;
      const continua = patternDi(e.ab.pattern).esegui(stato, e, e.ab, d, dx, dy, base);
      if (!continua) { e.st = ST_RIPOSA; e.tim = e.ab.riposo; }
      return;
    }
    case ST_CARICA:
      e.vel = base * e.ab.moltiplicatore;
      if (e.tim <= 0) { e.st = ST_RIPOSA; e.tim = e.ab.riposo; }
      return;
    case ST_RIPOSA:
      e.vel = 0; e.cx = dx; e.cy = dy;
      if (e.tim <= 0) { e.st = ST_AVVICINA; e.tim = fase.ricarica; e.attacco = null; e.ab = null; }
      return;
    default: {
      muovi(stato, e, fase, base, d, dx, dy, dt);
      if (e.tim > 0 || stato.giocatore.vita <= 0) return;
      const nome = fase.sequenza[e.passo % fase.sequenza.length];
      const ab = numeriAttacco(t, e.faseBoss, nome);
      if (d > ab.entro) {
        e.attesa += dt;
        if (e.attesa > PAZIENZA) { e.passo += 1; e.attesa = 0; }
        return;
      }
      e.ab = ab; e.attacco = nome; e.st = ST_MIRA; e.tim = ab.mira; e.passo += 1; e.attesa = 0;
      patternDi(ab.pattern).prepara?.(stato, e, ab, d, dx, dy);
      stato.eventi.push('boss-mira');
    }
  }
}
