/**
 * Il combattimento: le armi che fanno le loro cose, un passo alla volta.
 *
 * Un ramo per comportamento, in `agisci`. Ogni ramo riceve l'arma
 * posseduta (col suo livello e i suoi contatori), i numeri di quel livello,
 * e lo stato della partita; decide se e' il momento di agire e agisce
 * attraverso poche porte comuni: `lancia` mette un proiettile in vasca,
 * `colpisci` fa il danno a un nemico e ne segue le conseguenze,
 * `bersaglioVicino` trova chi colpire. Nessun ramo tocca le vasche a mano.
 *
 * Le statistiche del giocatore — danno, cadenza, gittata — sono
 * moltiplicatori e passano di qui una volta sola, in `numeriEffettivi`,
 * insieme ai moltiplicatori degli effetti delle casse (`stato.bonus`).
 *
 * Il colpo critico sta in `colpisci`, e solo li': la probabilita' e' quella
 * del giocatore piu' quella degli effetti, il moltiplicatore e' la
 * statistica `criticoDanno` (che parte da `CRITICO.molt`).
 *
 * Gli impatti — un cerchio a terra, il preavviso, poi il colpo a chi ci
 * sta dentro — stanno qui perche' sono un modo di fare danno: li usano la
 * pioggia di frecce e la tempesta di meteore delle casse.
 */

import { numeriArma } from './contenuti/scelte';
import { armaById, CRITICO } from './contenuti/armi';
import { ELITE } from './contenuti/nemici';
import { BONUS_NEUTRO } from './contenuti/casse';
import { applicaSinergie } from './contenuti/sinergie';
import { compatta } from './vasca';

/* I buffer delle ricerche: riusati a ogni passo. */
const vicini = new Int32Array(1024);
const viciniCorti = new Int32Array(64);
const giaColpiti = new Int32Array(16);

const RAGGIO_GIOCATORE = 9;

/** La ricarica non scende mai sotto questa frazione di quella dell'arma, qualunque cosa si accumuli. */
const CADENZA_MINIMA = 0.3;

/**
 * I numeri di un'arma con sopra, nell'ordine: i moltiplicatori del
 * giocatore, quelli degli effetti attivi, e le sinergie che la riguardano.
 *
 * Si scrivono in un oggetto che l'arma posseduta tiene per se'
 * (`posseduta.numeri`), riempito ogni volta: quattro armi per passo, piu'
 * il disegno, sono centinaia di oggetti al secondo se si allocasse. Chi
 * chiama li legge subito e non li conserva.
 */
export function numeriEffettivi(posseduta, stats, bonus = BONUS_NEUTRO, sinergie = null) {
  const n = numeriArma(posseduta);
  const out = posseduta.numeri || (posseduta.numeri = {});
  for (const k in n) out[k] = n[k];
  out.danno = n.danno * stats.danno * bonus.danno;
  out.cadenza = Math.max(n.cadenza * CADENZA_MINIMA, n.cadenza * stats.cadenza * bonus.cadenza);
  out.gittata = (n.gittata ?? 0) * stats.gittata;
  out.raggio = (n.raggio ?? 0) * (1 + (stats.gittata - 1) * 0.5);
  out.velocita = (n.velocita ?? 0) * (stats.velocitaProiettili ?? 1);
  if (sinergie && sinergie.length > 0) applicaSinergie(out, posseduta.id, sinergie);
  return out;
}

/* ─── Le porte comuni ─── */

/** Il nemico vivo piu' vicino a (x, y) entro `r`; -1 se nessuno. `escludi` sono uid da saltare. */
function bersaglioVicino(stato, x, y, r, escludi = null, quanti = 0) {
  const N = stato.nemici; const gr = stato.griglia;
  const q = gr.raccogli(x, y, r, vicini);
  let migliore = -1; let md = r * r;
  for (let k = 0; k < q; k += 1) {
    const j = vicini[k];
    const e = N.lista[j];
    if (e.morto) continue;
    if (escludi) { let salta = false; for (let s = 0; s < quanti; s += 1) if (escludi[s] === e.uid) { salta = true; break; } if (salta) continue; }
    const dd = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
    if (dd < md) { md = dd; migliore = j; }
  }
  return migliore;
}

/** Un proiettile del giocatore. `extra` porta i campi speciali (perfora, segue, scoppio, ritorno, rimbalza, arma). */
function lancia(stato, x, y, angolo, velocita, danno, gittata, extra) {
  const v = stato.proiettili;
  if (v.n >= v.lista.length) return null;
  const p = v.lista[v.n]; v.n += 1;
  p.x = x; p.y = y;
  p.vx = Math.cos(angolo) * velocita; p.vy = Math.sin(angolo) * velocita;
  p.vita = extra?.vita ?? (velocita > 0 ? gittata / velocita + 0.15 : 1);
  p.durata = p.vita;
  p.danno = danno; p.morto = false;
  p.perfora = extra?.perfora ?? 0;
  p.segue = extra?.segue ?? false;
  p.sterzo = extra?.sterzo ?? 0;
  p.scoppio = extra?.scoppio ?? 0;
  p.brucia = extra?.brucia ?? 0;
  p.arma = extra?.arma ?? 'freccia';
  p.ritorno = extra?.ritorno ?? false; p.giro = 0;
  p.rimbalza = extra?.rimbalza ?? 0; p.portataRimbalzo = extra?.portataRimbalzo ?? 0; p.crescita = extra?.crescita ?? 0;
  p.colpiti = 0;
  return p;
}

/* ─── Gli impatti ─── */
export const nuovoImpatto = () => ({ x: 0, y: 0, r: 0, vita: 0, durata: 0, danno: 0, morto: false });

/** Un impatto che cadra' fra `preavviso` secondi: il telegrafo si vede da subito. */
export function impatto(stato, x, y, r, danno, preavviso) {
  const v = stato.impatti;
  if (v.n >= v.lista.length) return null;
  const m = v.lista[v.n]; v.n += 1;
  m.x = x; m.y = y; m.r = r; m.danno = danno; m.durata = preavviso; m.vita = preavviso; m.morto = false;
  return m;
}

/**
 * Gli impatti in attesa: quando il preavviso scade, cadono. Il danno passa
 * da `colpisci` a chi sta nel cerchio, quindi morti, gemme, conto delle
 * uccisioni e bottino dei boss seguono la regola di sempre. Il giocatore
 * non si fa male: sono suoi.
 */
export function aggiornaImpatti(stato, dt) {
  const I = stato.impatti; const N = stato.nemici;
  for (let i = 0; i < I.n; i += 1) {
    const m = I.lista[i];
    m.vita -= dt;
    if (m.vita > 0) continue;
    stato.onda(stato, m.x, m.y, m.r, '#ffc233', 0.35);
    stato.spruzza(stato, m.x, m.y - 4, 10, '#ffc233', 110);
    const q = stato.griglia.raccogli(m.x, m.y, m.r, vicini);
    for (let k = 0; k < q; k += 1) {
      const e = N.lista[vicini[k]];
      if (e.morto) continue;
      const dd = (e.x - m.x) * (e.x - m.x) + (e.y - m.y) * (e.y - m.y);
      if (dd <= m.r * m.r) colpisci(stato, e, m.danno, (e.x - m.x) * 2, (e.y - m.y) * 2);
    }
    m.morto = true;
    stato.eventi.push('impatto');
  }
  compatta(I, 'morto');
}

/** Il danno lungo una riga: a chi sta entro `spessore` dal segmento (x1,y1)→(x2,y2). Torna quanti. */
function colpisciLungo(stato, x1, y1, x2, y2, spessore, danno, brucia = 0) {
  const N = stato.nemici;
  const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
  const lungh = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / lungh; const uy = (y2 - y1) / lungh;
  const q = stato.griglia.raccogli(mx, my, lungh / 2 + spessore + 12, vicini);
  let colpiti = 0;
  for (let k = 0; k < q; k += 1) {
    const e = N.lista[vicini[k]];
    if (e.morto) continue;
    const px = e.x - x1; const py = e.y - y1;
    const t = Math.max(0, Math.min(lungh, px * ux + py * uy));
    const qx = px - ux * t; const qy = py - uy * t;
    const r = spessore + e.tipo.raggio * e.scala;
    if (qx * qx + qy * qy <= r * r) { colpisci(stato, e, danno, 0, 0, brucia); colpiti += 1; }
  }
  return colpiti;
}

/** Il danno a un nemico, e quello che ne segue. Torna `true` se e' morto. */
export function colpisci(stato, e, danno, spintaX = 0, spintaY = 0, brucia = 0) {
  if (e.morto) return false;
  // il critico: una probabilita' sola, un moltiplicatore solo
  const stats = stato.giocatore.stats;
  const critico = (stats.critico || 0) + stato.bonus.critico;
  if (critico > 0 && stato.caso.numero() < critico) { danno *= stats.criticoDanno || CRITICO.molt; e.lampo = 0.16; stato.critici += 1; stato.eventi.push('critico'); }
  else e.lampo = 0.09;
  e.vita -= danno;
  const s = e.tipo.spinta * (e.elite ? ELITE.spinta : 1);
  e.kx += spintaX * s; e.ky += spintaY * s;
  if (brucia > 0) { e.brucia = 2.0; e.bruciaDanno = Math.max(e.bruciaDanno, brucia); }
  stato.eventi.push('colpo');
  if (e.vita <= 0) { stato.uccidi(stato, e); return true; }
  return false;
}

/* ─── I comportamenti ─── */

function agisciFreccia(stato, arma, n, g) {
  const b = bersaglioVicino(stato, g.x, g.y, n.gittata);
  if (b < 0) return false;
  const t = stato.nemici.lista[b];
  const quanti = 1 + g.stats.proiettiliExtra;
  const a0 = Math.atan2(t.y - g.y, t.x - g.x);
  for (let k = 0; k < quanti; k += 1) {
    const extra = quanti === 1 ? 0 : (k - (quanti - 1) / 2) * 0.16;
    lancia(stato, g.x, g.y - 8, a0 + extra, n.velocita, n.danno, n.gittata, { arma: 'freccia', brucia: arma.evoluta ? n.bruciaDanno : 0 });
  }
  return true;
}

function agisciVentaglio(stato, arma, n, g) {
  const b = bersaglioVicino(stato, g.x, g.y, n.gittata);
  if (b < 0) return false;
  const t = stato.nemici.lista[b];
  const a0 = Math.atan2(t.y - g.y, t.x - g.x);
  const quanti = n.schegge + g.stats.proiettiliExtra;
  if (arma.evoluta && n.effetto === 'cerchio') {
    for (let k = 0; k < quanti; k += 1) lancia(stato, g.x, g.y - 8, a0 + (Math.PI * 2 * k) / quanti, n.velocita, n.danno, n.gittata, { arma: 'ventaglio' });
    return true;
  }
  for (let k = 0; k < quanti; k += 1) {
    const a = quanti === 1 ? a0 : a0 - n.apertura / 2 + (n.apertura * k) / (quanti - 1);
    lancia(stato, g.x, g.y - 8, a, n.velocita, n.danno, n.gittata, { arma: 'ventaglio' });
  }
  return true;
}

function agisciSigillo(stato, arma, n, g) {
  const b = bersaglioVicino(stato, g.x, g.y, n.gittata);
  if (b < 0) return false;
  const c = stato.nemici.lista[b];
  const cx = c.x; const cy = c.y;
  stato.onda(stato, cx, cy, n.raggio, '#ff7a5c', 0.35);
  stato.spruzza(stato, cx, cy - 4, 10, '#ff9a4c', 90);
  const q = stato.griglia.raccogli(cx, cy, n.raggio, vicini);
  const brucia = arma.evoluta && n.effetto === 'brucia' ? n.bruciaDanno : 0;
  for (let k = 0; k < q; k += 1) {
    const e = stato.nemici.lista[vicini[k]];
    if (e.morto) continue;
    const dd = (e.x - cx) * (e.x - cx) + (e.y - cy) * (e.y - cy);
    if (dd <= n.raggio * n.raggio) colpisci(stato, e, n.danno, 0, 0, brucia);
  }
  return true;
}

function agisciAnello(stato, arma, n, g, dt) {
  // le lame girano sempre; il danno lo fanno quando toccano
  arma.angolo += n.giri * Math.PI * 2 * dt;
  const respinge = arma.evoluta && n.effetto === 'respinge';
  for (let l = 0; l < n.lame; l += 1) {
    const a = arma.angolo + (Math.PI * 2 * l) / n.lame;
    const lx = g.x + Math.cos(a) * n.raggio; const ly = g.y - 4 + Math.sin(a) * n.raggio * 0.6;
    const q = stato.griglia.raccogli(lx, ly, 10, viciniCorti);
    for (let k = 0; k < q; k += 1) {
      const e = stato.nemici.lista[viciniCorti[k]];
      if (e.morto || e.tocco > 0) continue;
      const r = e.tipo.raggio * e.scala + 5;
      const dd = (e.x - lx) * (e.x - lx) + (e.y - ly) * (e.y - ly);
      if (dd > r * r) continue;
      e.tocco = n.cadenza;
      const sp = respinge ? 80 : 40;
      colpisci(stato, e, n.danno, (e.x - g.x) / (Math.hypot(e.x - g.x, e.y - g.y) || 1) * sp, (e.y - g.y) / (Math.hypot(e.x - g.x, e.y - g.y) || 1) * sp);
    }
  }
  return false;   // l'anello non ha ricarica: agisce ogni passo
}

function agisciLancia(stato, arma, n, g) {
  const b = bersaglioVicino(stato, g.x, g.y, n.gittata);
  if (b < 0) return false;
  const t = stato.nemici.lista[b];
  const a = Math.atan2(t.y - g.y, t.x - g.x);
  const quanti = 1 + g.stats.proiettiliExtra;
  for (let k = 0; k < quanti; k += 1) {
    const extra = quanti === 1 ? 0 : (k - (quanti - 1) / 2) * 0.2;
    lancia(stato, g.x, g.y - 8, a + extra, n.velocita, n.danno, n.gittata, { arma: 'lancia', perfora: n.perfora });
  }
  return true;
}

function unaCatena(stato, n, g, giaN) {
  let quanti = giaN;
  let b = bersaglioVicino(stato, g.x, g.y, n.gittata, giaColpiti, quanti);
  if (b < 0) return quanti;
  let px = g.x; let py = g.y - 8;
  for (let s = 0; s <= n.salti && b >= 0 && quanti < giaColpiti.length; s += 1) {
    const e = stato.nemici.lista[b];
    stato.fulmine(stato, px, py, e.x, e.y - 6);
    giaColpiti[quanti] = e.uid; quanti += 1;
    colpisci(stato, e, n.danno);
    px = e.x; py = e.y - 6;
    b = bersaglioVicino(stato, px, py, n.portataSalto, giaColpiti, quanti);
  }
  return quanti;
}

function agisciFulmine(stato, arma, n, g) {
  const q = unaCatena(stato, n, g, 0);
  if (q === 0) return false;
  if (arma.evoluta && n.effetto === 'doppio') unaCatena(stato, n, g, q);
  return true;
}

function agisciSpirito(stato, arma, n, g) {
  const b = bersaglioVicino(stato, g.x, g.y, n.gittata);
  if (b < 0) return false;
  const t = stato.nemici.lista[b];
  const a = Math.atan2(t.y - g.y, t.x - g.x);
  const quanti = (arma.evoluta && n.effetto === 'doppio' ? 2 : 1) + g.stats.proiettiliExtra;
  for (let k = 0; k < quanti; k += 1) {
    lancia(stato, g.x, g.y - 8, a + (k - (quanti - 1) / 2) * 0.8, n.velocita, n.danno, n.gittata, { arma: 'spirito', segue: true, sterzo: n.sterzo, scoppio: n.scoppio });
  }
  return true;
}

function agisciSpine(stato, arma, n, g) {
  const q = stato.griglia.raccogli(g.x, g.y, n.raggio, vicini);
  const rallenta = arma.evoluta && n.effetto === 'rallenta';
  let colpito = false;
  for (let k = 0; k < q; k += 1) {
    const e = stato.nemici.lista[vicini[k]];
    if (e.morto) continue;
    const dd = (e.x - g.x) * (e.x - g.x) + (e.y - g.y) * (e.y - g.y);
    if (dd > n.raggio * n.raggio) continue;
    colpisci(stato, e, n.danno);
    if (rallenta) e.lento = 0.6;
    colpito = true;
  }
  if (colpito) stato.eventi.push('spine');
  return true;   // l'aura scandisce sempre, colpisca o no
}

/* ─── Le sei armi della progressione ─── */

function agisciFalce(stato, arma, n, g) {
  const b = bersaglioVicino(stato, g.x, g.y, n.gittata);
  if (b < 0) return false;
  const t = stato.nemici.lista[b];
  const a = Math.atan2(t.y - g.y, t.x - g.x);
  const quanti = 1 + g.stats.proiettiliExtra;
  const extra = { arma: 'falce', perfora: n.perfora, ritorno: true };
  for (let k = 0; k < quanti; k += 1) {
    const sc = quanti === 1 ? 0 : (k - (quanti - 1) / 2) * 0.35;
    lancia(stato, g.x, g.y - 6, a + sc, n.velocita, n.danno, n.gittata, extra);
    if (arma.evoluta && n.effetto === 'doppio') lancia(stato, g.x, g.y - 6, a + sc + Math.PI, n.velocita, n.danno, n.gittata, extra);
  }
  return true;
}

function agisciTrappola(stato, arma, n, g) {
  const quante = (arma.evoluta && n.quante ? n.quante : 1) + g.stats.proiettiliExtra;
  const brucia = arma.evoluta && n.effetto === 'brucia' ? n.bruciaDanno : 0;
  for (let k = 0; k < quante; k += 1) {
    const sx = quante === 1 ? 0 : (k - (quante - 1) / 2) * 14;
    lancia(stato, g.x + sx, g.y + 2, 0, 0, n.danno, 0, { arma: 'trappola', scoppio: n.scoppio, vita: n.durata, brucia });
  }
  return true;
}

function agisciRaggio(stato, arma, n, g) {
  const b = bersaglioVicino(stato, g.x, g.y, n.gittata);
  if (b < 0) return false;
  const t = stato.nemici.lista[b];
  const a0 = Math.atan2(t.y - (g.y - 6), t.x - g.x);
  const raggi = arma.evoluta && n.effetto === 'triplo' ? 3 : 1;
  for (let k = 0; k < raggi; k += 1) {
    const a = raggi === 1 ? a0 : a0 + (k - 1) * n.apertura;
    const x2 = g.x + Math.cos(a) * n.gittata; const y2 = g.y - 6 + Math.sin(a) * n.gittata;
    stato.fulmine(stato, g.x, g.y - 6, x2, y2, 0.14, n.spessore, '#fff3b0');
    colpisciLungo(stato, g.x, g.y - 6, x2, y2, n.spessore, n.danno);
  }
  return true;
}

function agisciPioggia(stato, arma, n, g) {
  const b = bersaglioVicino(stato, g.x, g.y, n.gittata);
  if (b < 0) return false;
  const t = stato.nemici.lista[b];
  const quante = n.quante + g.stats.proiettiliExtra;
  const m = stato.mondo;
  for (let k = 0; k < quante; k += 1) {
    const a = stato.caso.fra(0, Math.PI * 2); const d = stato.caso.fra(0, n.raggio * 1.4);
    const x = Math.min(m.w - 8, Math.max(8, t.x + Math.cos(a) * d));
    const y = Math.min(m.h - 8, Math.max(8, t.y + Math.sin(a) * d * 0.6));
    impatto(stato, x, y, n.raggio, n.danno, n.preavviso);
  }
  return true;
}

function agisciSpirale(stato, arma, n, g) {
  // niente mira: un braccio che gira, una brace per ricarica
  arma.angolo += n.passo;
  const bracci = arma.evoluta && n.effetto === 'doppio' ? 2 : 1;
  for (let k = 0; k < bracci; k += 1) {
    lancia(stato, g.x, g.y - 6, arma.angolo + k * Math.PI, n.velocita, n.danno, n.gittata, { arma: 'spirale' });
  }
  return true;
}

function agisciRimbalzo(stato, arma, n, g) {
  const b = bersaglioVicino(stato, g.x, g.y, n.gittata);
  if (b < 0) return false;
  const t = stato.nemici.lista[b];
  const a = Math.atan2(t.y - g.y, t.x - g.x);
  const quanti = 1 + g.stats.proiettiliExtra;
  for (let k = 0; k < quanti; k += 1) {
    lancia(stato, g.x, g.y - 6, a + (k - (quanti - 1) / 2) * 0.3, n.velocita, n.danno, n.gittata, {
      arma: 'rimbalzo', rimbalza: n.rimbalzi, portataRimbalzo: n.portataRimbalzo, crescita: arma.evoluta && n.effetto === 'cresce' ? n.crescita : 0,
    });
  }
  return true;
}

const AGISCI = {
  falce: agisciFalce,
  trappola: agisciTrappola,
  raggio: agisciRaggio,
  pioggia: agisciPioggia,
  spirale: agisciSpirale,
  rimbalzo: agisciRimbalzo,
  freccia: agisciFreccia,
  ventaglio: agisciVentaglio,
  sigillo: agisciSigillo,
  anello: agisciAnello,
  lancia: agisciLancia,
  fulmine: agisciFulmine,
  spirito: agisciSpirito,
  spine: agisciSpine,
};

/**
 * Un passo di tutte le armi del giocatore. Le armi con la ricarica agiscono
 * quando e' scaduta e la rimettono; l'anello agisce ogni passo.
 */
export function aggiornaArmi(stato, dt) {
  const g = stato.giocatore;
  for (let i = 0; i < g.armi.length; i += 1) {
    const arma = g.armi[i];
    const scheda = armaById(arma.id);
    if (!scheda) continue;
    const n = numeriEffettivi(arma, g.stats, stato.bonus, g.sinergie);
    const agisci = AGISCI[scheda.comportamento];
    if (!agisci) continue;
    if (scheda.comportamento === 'anello') { agisci(stato, arma, n, g, dt); continue; }
    if (arma.ricarica > 0) { arma.ricarica -= dt; continue; }
    if (agisci(stato, arma, n, g, dt)) {
      arma.ricarica = n.cadenza;
      stato.eventi.push('sparo');
    }
  }
}

/**
 * Un passo dei proiettili del giocatore: movimento, inseguimento, colpi,
 * perforazione, scoppio. Chi arriva a fine corsa o fuori dal mondo muore.
 */
export function aggiornaProiettili(stato, dt) {
  const P = stato.proiettili; const N = stato.nemici; const gr = stato.griglia;
  for (let i = 0; i < P.n; i += 1) {
    const p = P.lista[i];
    if (p.segue) {
      // sterza verso il nemico piu' vicino, senza cambiare velocita'
      const b = bersaglioVicino(stato, p.x, p.y, 140);
      if (b >= 0) {
        const t = N.lista[b];
        const va = Math.atan2(p.vy, p.vx);
        let da = Math.atan2(t.y - 6 - p.y, t.x - p.x) - va;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        const giro = Math.max(-p.sterzo * dt, Math.min(p.sterzo * dt, da));
        const vel = Math.hypot(p.vx, p.vy);
        p.vx = Math.cos(va + giro) * vel; p.vy = Math.sin(va + giro) * vel;
      }
    }
    // la falce: a meta' strada torna indietro, e puo' colpire di nuovo chi ha gia' colpito
    if (p.ritorno && p.giro === 0 && p.vita <= p.durata * 0.5) { p.vx = -p.vx; p.vy = -p.vy; p.giro = 1; p.colpiti = 0; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vita -= dt;
    if (p.vita <= 0 || p.x < 0 || p.y < 0 || p.x > stato.mondo.w || p.y > stato.mondo.h) { p.morto = true; continue; }
    const q = gr.raccogli(p.x, p.y, 16, viciniCorti);
    for (let k = 0; k < q; k += 1) {
      const j = viciniCorti[k];
      const e = N.lista[j];
      if (e.morto) continue;
      // una trappola (ferma, che scoppia) scatta un po' prima di essere calpestata
      const r = e.tipo.raggio * e.scala + (p.scoppio > 0 && p.vx === 0 && p.vy === 0 ? 12 : 3);
      const dd = (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y);
      if (dd >= r * r) continue;
      // un proiettile che perfora o rimbalza non colpisce due volte lo stesso
      if ((p.perfora > 0 || p.rimbalza > 0) && p.colpiti > 0) {
        let gia = false;
        for (let s = 0; s < p.colpiti && s < p.uid.length; s += 1) if (p.uid[s] === e.uid) { gia = true; break; }
        if (gia) continue;
      }
      const l = Math.hypot(p.vx, p.vy) || 1;
      if (p.scoppio > 0) {
        // lo spirito scoppia: chi sta nel raggio si fa male
        stato.onda(stato, p.x, p.y, p.scoppio, '#9b7bd4', 0.3);
        stato.spruzza(stato, p.x, p.y, 8, '#b9a3ff', 90);
        const qq = gr.raccogli(p.x, p.y, p.scoppio, vicini);
        for (let z = 0; z < qq; z += 1) {
          const o = N.lista[vicini[z]];
          if (o.morto) continue;
          const d2 = (o.x - p.x) * (o.x - p.x) + (o.y - p.y) * (o.y - p.y);
          if (d2 <= p.scoppio * p.scoppio) colpisci(stato, o, p.danno, (o.x - p.x) * 3, (o.y - p.y) * 3);
        }
        p.morto = true;
        break;
      }
      colpisci(stato, e, p.danno, (p.vx / l) * 90, (p.vy / l) * 90, p.brucia);
      if (p.rimbalza > 0) {
        // la sfera: segna chi ha colpito e riparte verso il vicino piu' prossimo non ancora colpito
        if (p.colpiti < p.uid.length) p.uid[p.colpiti] = e.uid;
        p.colpiti += 1;
        if (p.colpiti > p.rimbalza) { p.morto = true; break; }
        const prossimo = bersaglioVicino(stato, p.x, p.y, p.portataRimbalzo, p.uid, Math.min(p.colpiti, p.uid.length));
        if (prossimo < 0) { p.morto = true; break; }
        const o = N.lista[prossimo];
        const a = Math.atan2(o.y - p.y, o.x - p.x);
        p.vx = Math.cos(a) * l; p.vy = Math.sin(a) * l;
        p.vita = p.portataRimbalzo / l + 0.1;
        if (p.crescita > 0) p.danno *= 1 + p.crescita;
        stato.eventi.push('rimbalzo');
        break;
      }
      if (p.perfora > 0) {
        if (p.colpiti < p.uid.length) p.uid[p.colpiti] = e.uid;
        p.colpiti += 1;
        if (p.colpiti > p.perfora) { p.morto = true; break; }
        continue;
      }
      p.morto = true;
      break;
    }
  }
}

export { RAGGIO_GIOCATORE };
