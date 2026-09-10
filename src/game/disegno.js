/**
 * Il disegno: lo stato della partita, sul canvas, una volta per fotogramma.
 *
 * La telecamera segue il giocatore e si ferma ai bordi del mondo. Lo zoom
 * e' 2,3 — un nemico da 16 pixel ne occupa una trentina — e scende a 1,55
 * sugli schermi stretti, dove con lo zoom largo si vedrebbe un fazzoletto
 * di mondo e i nemici arriverebbero senza preavviso.
 *
 * Quello che costa in un fotogramma, e come si tiene basso:
 *
 *   · la misura della tela non si legge dal DOM a ogni fotogramma (una
 *     lettura di layout sessanta volte al secondo) ma quando cambia, da un
 *     `ResizeObserver`;
 *   · le sagome rovesciate e quelle bianche sono copie pronte dal
 *     caricatore: un `drawImage` ciascuna, niente `save`/`scale`/`restore`;
 *   · l'ombra sotto ogni creatura e' un'immagine, non un'ellisse
 *     tracciata: con quattrocento nemici sono quattrocento riempimenti
 *     di percorso risparmiati;
 *   · la telecamera e le sagome stanno su pixel interi *dello schermo*
 *     (`aSchermo`), cosi' la pixel art non trema.
 *
 * Tutto quello che si disegna passa dal registro degli asset; un asset che
 * manca diventa un rettangolo acceso, cosi' il gioco resta giocabile anche
 * a meta' della grafica.
 */

import { spriteDi } from './contenuti/personaggi';
import { INVULNERABILITA } from './partita';
import { numeriEffettivi } from './combattimento';
import { puntoMeteora, angoloRaffica, ST_MIRA } from './boss';
import { RARITA } from './contenuti/casse';
import { GEMME, CONTORNO_GEMMA } from './contenuti/gemme';
import { CH_APRE, CH_APERTA } from './casse';

/* ─── Lo zoom ───
   Quanto mondo entra nello schermo. Era tre su schermo largo e due su
   schermo stretto; adesso e' un terzo abbondante piu' largo, perche' con
   le ondate che arrivano da fuori vedere prima quello che sta arrivando e'
   meta' del gioco.
   Non sono numeri tondi apposta: sono i vecchi divisi per 1,3. */
const ZOOM_LARGO = 2.3;
const ZOOM_STRETTO = 1.55;

const FPS_CAMMINO = 10;
const FPS_IDLE = 6;
const FPS_NEMICO = 6;
/* La posa "colpito" si mostra per quasi tutta l'invulnerabilita', tranne la coda. */
const SOGLIA_COLPITO = 0.05;
/* Sotto questa larghezza (px CSS) si passa allo zoom stretto. */
const SCHERMO_STRETTO = 380;

function ombraPronta() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 16; c.height = 8;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(8, 4, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
  return c;
}

/**
 * Le casse, pronte: un corpo e un coperchio per rarita', disegnati una
 * volta su tele fuori schermo. Nessun pacchetto con licenza chiara ha una
 * cassa, e una cassa da diciotto pixel si disegna in dodici rettangoli.
 */
function cassePronte() {
  if (typeof document === 'undefined') return null;
  const pronte = new Map();
  for (const r of RARITA) {
    const corpo = document.createElement('canvas'); corpo.width = 18; corpo.height = 10;
    const c = corpo.getContext('2d');
    if (!c) return null;
    c.fillStyle = '#2a1a12'; c.fillRect(1, 0, 16, 10);
    c.fillStyle = r.colore; c.fillRect(2, 1, 14, 8);
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(2, 7, 14, 2);
    c.fillStyle = '#2a1a12'; c.fillRect(4, 1, 1, 8); c.fillRect(13, 1, 1, 8);
    c.fillStyle = '#f0d9a8'; c.fillRect(8, 2, 2, 3);
    c.fillStyle = '#2a1a12'; c.fillRect(8, 4, 2, 1);
    const coperchio = document.createElement('canvas'); coperchio.width = 18; coperchio.height = 6;
    const l = coperchio.getContext('2d');
    l.fillStyle = '#2a1a12'; l.fillRect(1, 0, 16, 6);
    l.fillStyle = r.luce; l.fillRect(2, 1, 14, 4);
    l.fillStyle = r.colore; l.fillRect(3, 2, 12, 2);
    l.fillStyle = '#2a1a12'; l.fillRect(4, 1, 1, 4); l.fillRect(13, 1, 1, 4);
    pronte.set(r.id, { corpo, coperchio });
  }
  return pronte;
}

/**
 * Una riga di una gemma: il contorno ai due lati e, in mezzo, le facce.
 * `n` e' quanto e' larga la parte colorata — zero e' la punta, dove
 * restano i due pixel di contorno e basta.
 */
function rigaGemma(c, g, y, n, banda) {
  const x = (g.larghezza - n) / 2;   // il corpo sta sempre in mezzo alla tela
  c.fillStyle = CONTORNO_GEMMA;
  c.fillRect(x, y, 1, 1); c.fillRect(x + n + 1, y, 1, 1);
  if (n === 0) return;
  if (banda === 'cima') {
    // la punta prende la luce: chiara a sinistra, il luccichio a destra
    c.fillStyle = g.luce; c.fillRect(x + 1, y, n / 2, 1);
    c.fillStyle = g.luccichio; c.fillRect(x + 1 + n / 2, y, n / 2, 1);
    return;
  }
  if (banda === 'fondo') {
    // sotto la pietra e' in ombra, e a destra un po' meno
    c.fillStyle = g.fondo; c.fillRect(x + 1, y, n / 2, 1);
    c.fillStyle = g.ombra; c.fillRect(x + 1 + n / 2, y, n / 2, 1);
    return;
  }
  const lato = Math.floor(n / 3);    // le tre facce del corpo: scura, piena, chiara
  c.fillStyle = g.ombra; c.fillRect(x + 1, y, lato, 1);
  c.fillStyle = g.colore; c.fillRect(x + 1 + lato, y, n - 2 * lato, 1);
  c.fillStyle = g.luce; c.fillRect(x + 1 + n - lato, y, lato, 1);
}

/**
 * Le gemme, pronte: una tela fuori schermo per taglia, disegnata riga per
 * riga una volta sola. Cinque pietre della stessa famiglia — stessa
 * sagoma, stesse facce, dimensioni e colori che crescono — si scrivono in
 * una regola invece che in cinque disegni, e restano d'accordo fra loro
 * anche quando si aggiunge una fascia.
 *
 * La sagoma: una punta che si allarga di due pixel per riga, il corpo, e
 * la punta di sotto che si richiude. La forma e' quella della gemma
 * disegnata a mano che c'era prima, che era una taglia sola.
 */
function gemmePronte() {
  if (typeof document === 'undefined') return null;
  const pronte = [];
  for (const g of GEMME) {
    const tela = document.createElement('canvas');
    tela.width = g.larghezza + 2; tela.height = g.larghezza + g.corpo + 2;
    const c = tela.getContext('2d');
    if (!c) return null;
    const meta = g.larghezza / 2;
    let y = 0;
    for (let k = 0; k < meta; k += 1) { rigaGemma(c, g, y, 2 * k, 'cima'); y += 1; }
    rigaGemma(c, g, y, g.larghezza, 'cima'); y += 1;
    for (let k = 0; k < g.corpo; k += 1) { rigaGemma(c, g, y, g.larghezza, 'corpo'); y += 1; }
    rigaGemma(c, g, y, g.larghezza, 'fondo'); y += 1;
    for (let k = meta - 1; k >= 0; k -= 1) { rigaGemma(c, g, y, 2 * k, 'fondo'); y += 1; }
    pronte.push(tela);
  }
  return pronte;
}

export function creaDisegno(canvas, asset) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('[arena] il canvas non da\' un contesto 2D: il disegno non puo\' partire');
  const camera = { x: 0, y: 0, w: 0, h: 0 };
  let dpr = 1;
  let zoom = ZOOM_LARGO;
  let cssW = 1; let cssH = 1;
  const visibili = [];   // i nemici in vista, ordinati per y

  /**
   * Ordina per y a inserimento: i nemici si muovono poco fra un fotogramma
   * e l'altro, e la lista arriva gia' quasi ordinata (si riempie scorrendo
   * la vasca, che tiene l'ordine del fotogramma prima). Su una lista quasi
   * ordinata l'inserimento e' lineare, e non alloca la chiusura del
   * confronto che `sort` vorrebbe.
   */
  function ordinaPerY(lista) {
    for (let i = 1; i < lista.length; i += 1) {
      const e = lista[i]; let j = i - 1;
      while (j >= 0 && lista[j].y > e.y) { lista[j + 1] = lista[j]; j -= 1; }
      lista[j + 1] = e;
    }
  }
  const ombra = ombraPronta();
  const casse = cassePronte();
  const gemme = gemmePronte();

  function misura() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(1, Math.round(r.width)); cssH = Math.max(1, Math.round(r.height));
    dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    zoom = cssW < SCHERMO_STRETTO ? ZOOM_STRETTO : ZOOM_LARGO;
    const w = Math.round(cssW * dpr); const h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    camera.w = cssW / zoom; camera.h = cssH / zoom;
  }
  misura();
  let osservatore = null;
  if (typeof ResizeObserver !== 'undefined') {
    osservatore = new ResizeObserver(misura);
    osservatore.observe(canvas);
  } else if (typeof window !== 'undefined') {
    window.addEventListener('resize', misura);
  }

  /**
   * Un pixel dello schermo, misurato in pixel del mondo.
   *
   * Prima lo zoom era intero e `dpr × zoom` pure: un pixel del mondo
   * finiva su un numero intero di pixel dello schermo, e arrotondare le
   * posizioni all'unita' del mondo bastava a tenere la pixel art ferma.
   * Con uno zoom di due e tre decimi non e' piu' vero — il mondo e lo
   * schermo non hanno piu' la stessa griglia — e arrotondare al mondo
   * lascerebbe le sagome a cavallo di mezzo pixel, che si vede: i bordi
   * sfarfallano mentre ci si muove.
   *
   * Quindi si arrotonda a quello che conta davvero, il pixel dello
   * schermo. Le sagome restano dove il video puo' disegnarle intere, e
   * l'unica cosa che resta irregolare e' quanto e' largo un pixel dentro
   * la sagoma — due o tre, alternati — che e' fermo e non balla.
   */
  const aSchermo = (v) => {
    const s = dpr * zoom;
    return Math.round(v * s) / s;
  };

  function inquadra(stato) {
    const g = stato.giocatore;
    camera.x = aSchermo(Math.min(stato.mondo.w - camera.w, Math.max(0, g.x - camera.w / 2)));
    camera.y = aSchermo(Math.min(stato.mondo.h - camera.h, Math.max(0, g.y - camera.h / 2)));
    // lo scossone di una cassa epica: due pixel, per pochi decimi
    if (stato.scossa > 0) { camera.x += Math.round(Math.sin(stato.tempo * 97) * 2); camera.y += Math.round(Math.cos(stato.tempo * 83) * 2); }
  }

  /** Quanto lontano dal giocatore arriva lo schermo: serve alle nascite. */
  const raggioVista = () => Math.hypot(camera.w, camera.h) / 2;

  /** Da un punto del canvas (px CSS) alla direzione dal giocatore: serve al puntatore. */
  function direzioneDaSchermo(stato, sx, sy) {
    const mx = camera.x + sx / zoom; const my = camera.y + sy / zoom;
    const g = stato.giocatore;
    const dx = mx - g.x; const dy = my - g.y;
    const l = Math.hypot(dx, dy);
    if (l < 6) return { x: 0, y: 0 };
    return { x: dx / l, y: dy / l };
  }

  function segnaposto(x, y, r, colore) {
    ctx.fillStyle = colore; ctx.fillRect(Math.round(x - r / 2), Math.round(y - r), r, r);
  }

  /**
   * Un fotogramma di una striscia. `verso` -1 pesca dalla copia rovesciata;
   * `bianca` dalla sagoma bianca (che, rovesciata, si fa al volo: dura
   * novanta millisecondi, non vale una terza copia).
   */
  function striscia(nome, fotogramma, x, y, verso = 1, bianca = false, scala = 1) {
    const a = asset.get(nome);
    if (!a) { segnaposto(x, y, 12, '#ff00ff'); return; }
    const rq = a.riquadro ?? a.img.naturalWidth;
    const rh = a.riquadro ?? a.img.naturalHeight;
    const n = a.fotogrammi > 1 ? a.fotogrammi : 1;
    const f = fotogramma % n;
    const dw = rq * scala; const dh = rh * scala;
    const ox = -dw / 2;
    const oy = a.ancora === 'piedi' ? -dh : -dh / 2;
    const px = aSchermo(x + ox); const py = aSchermo(y + oy);
    if (bianca && a.bianca) {
      if (verso < 0) {
        ctx.save(); ctx.translate(aSchermo(x), aSchermo(y)); ctx.scale(-1, 1);
        ctx.drawImage(a.bianca, f * rq, 0, rq, rh, ox, oy, dw, dh);
        ctx.restore();
      } else {
        ctx.drawImage(a.bianca, f * rq, 0, rq, rh, px, py, dw, dh);
      }
      return;
    }
    if (verso < 0 && a.specchio) {
      ctx.drawImage(a.specchio, (n - 1 - f) * rq, 0, rq, rh, px, py, dw, dh);
    } else {
      ctx.drawImage(a.img, f * rq, 0, rq, rh, px, py, dw, dh);
    }
  }

  function pavimento(stato) {
    const a = asset.get('mondo.pavimento');
    const lato = a?.riquadro ?? 48;
    if (!a) { ctx.fillStyle = '#1a1420'; ctx.fillRect(camera.x, camera.y, camera.w, camera.h); return; }
    const x0 = Math.max(0, Math.floor(camera.x / lato) * lato);
    const y0 = Math.max(0, Math.floor(camera.y / lato) * lato);
    const x1 = Math.min(stato.mondo.w, camera.x + camera.w);
    const y1 = Math.min(stato.mondo.h, camera.y + camera.h);
    for (let y = y0; y < y1; y += lato) {
      for (let x = x0; x < x1; x += lato) ctx.drawImage(a.img, x, y);
    }
    // il bordo del mondo: fuori c'e' il buio
    ctx.fillStyle = '#04070b';
    if (camera.x < 0) ctx.fillRect(camera.x, camera.y, -camera.x, camera.h);
    if (camera.y < 0) ctx.fillRect(camera.x, camera.y, camera.w, -camera.y);
    const ex = camera.x + camera.w - stato.mondo.w; if (ex > 0) ctx.fillRect(stato.mondo.w, camera.y, ex, camera.h);
    const ey = camera.y + camera.h - stato.mondo.h; if (ey > 0) ctx.fillRect(camera.x, stato.mondo.h, camera.w, ey);
  }

  function inVista(x, y, m = 40) {
    return x > camera.x - m && x < camera.x + camera.w + m && y > camera.y - m && y < camera.y + camera.h + m;
  }

  function disegnaOmbra(x, y, r) {
    if (ombra) { ctx.drawImage(ombra, Math.round(x - r), Math.round(y - r * 0.45), r * 2, r * 0.9); return; }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x, y + 1, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  }

  function disegnaArmiAddosso(stato, tempoReale) {
    const g = stato.giocatore;
    for (let i = 0; i < g.armi.length; i += 1) {
      const arma = g.armi[i];
      const n = numeriEffettivi(arma, g.stats, stato.bonus, g.sinergie);
      if (arma.id === 'spine') {
        const pulsa = 0.55 + Math.sin(tempoReale * 6) * 0.15;
        ctx.strokeStyle = `rgba(143, 208, 106, ${pulsa})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(g.x, g.y, n.raggio, n.raggio * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (arma.id === 'anello') {
        for (let l = 0; l < n.lame; l += 1) {
          const a = arma.angolo + (Math.PI * 2 * l) / n.lame;
          const lx = g.x + Math.cos(a) * n.raggio; const ly = g.y - 4 + Math.sin(a) * n.raggio * 0.6;
          ctx.save(); ctx.translate(lx, ly); ctx.rotate(a + Math.PI / 2);
          ctx.fillStyle = '#d6f4ff'; ctx.fillRect(-1, -6, 2, 12);
          ctx.fillStyle = '#4ad9ff'; ctx.fillRect(-2, -2, 4, 4);
          ctx.restore();
        }
      }
    }
  }

  /**
   * Il telegrafo di un boss che sta mirando: la forma di quello che sta per
   * fare, dove lo fara', e quanto manca (il riempimento cresce con la mira).
   * Legge `e.ab`, i numeri dell'attacco in corso, e niente altro.
   */
  function disegnaTelegrafo(e) {
    const ab = e.ab;
    if (!ab) return;
    const avanzo = ab.mira > 0 ? 1 - Math.max(0, e.tim) / ab.mira : 1;
    const c = e.tipo.colore;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 122, 92, 0.9)';
    ctx.fillStyle = `rgba(255, 122, 92, ${0.08 + 0.22 * avanzo})`;
    switch (ab.pattern) {
      case 'schianto':
        ctx.beginPath(); ctx.ellipse(e.x, e.y, ab.raggio, ab.raggio * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(e.x, e.y, ab.raggio * avanzo, ab.raggio * 0.55 * avanzo, 0, 0, Math.PI * 2); ctx.stroke();
        break;
      case 'carica': {
        const l = e.tipo.velocita * e.tipo.fasi[e.faseBoss].velocita * ab.moltiplicatore * ab.durata;
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(e.cy, e.cx));
        ctx.fillRect(0, -6, l * avanzo, 12);
        ctx.strokeRect(0, -6, l, 12);
        ctx.restore();
        break;
      }
      case 'evoca':
        for (let k = 0; k < ab.quanti; k += 1) {
          const a = (Math.PI * 2 * k) / ab.quanti + e.fase * Math.PI * 2;
          ctx.beginPath(); ctx.ellipse(e.x + Math.cos(a) * 22, e.y + Math.sin(a) * 22, 5, 3, 0, 0, Math.PI * 2); ctx.stroke();
        }
        break;
      case 'raffica':
        for (let k = 0; k < ab.quanti; k += 1) {
          const a = angoloRaffica(e, ab, k);
          ctx.beginPath(); ctx.moveTo(e.x, e.y - 6);
          ctx.lineTo(e.x + Math.cos(a) * 34 * (0.4 + 0.6 * avanzo), e.y - 6 + Math.sin(a) * 34 * (0.4 + 0.6 * avanzo)); ctx.stroke();
        }
        break;
      case 'raggio':
        ctx.save(); ctx.globalAlpha = 0.15 + 0.35 * avanzo;
        ctx.strokeStyle = c; ctx.lineWidth = ab.spessore * 2;
        ctx.beginPath(); ctx.moveTo(e.x, e.y - 6); ctx.lineTo(e.x + e.cx * ab.portata, e.y - 6 + e.cy * ab.portata); ctx.stroke();
        ctx.restore();
        break;
      case 'meteora':
        for (let k = 0; k < ab.quante; k += 1) {
          const p = puntoMeteora(e, ab, k);
          const px = p.x; const py = p.y;
          ctx.beginPath(); ctx.ellipse(px, py, ab.raggio, ab.raggio * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(px, py, ab.raggio * avanzo, ab.raggio * 0.55 * avanzo, 0, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'frusta': {
        const a0 = Math.atan2(e.cy, e.cx);
        ctx.beginPath(); ctx.moveTo(e.x, e.y);
        ctx.ellipse(e.x, e.y, ab.raggio, ab.raggio * 0.55, 0, a0 - ab.apertura / 2, a0 + ab.apertura / 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
      default:
        break;
    }
  }

  function disegnaGiocatore(stato) {
    const g = stato.giocatore;
    const p = stato.scheda;
    let statoAnim = 'idle';
    if (stato.fase === 'morte') statoAnim = 'morte';
    else if (g.invulnerabile > SOGLIA_COLPITO) statoAnim = 'colpito';
    else if (g.muove) statoAnim = 'cammino';
    const nome = spriteDi(p, statoAnim);
    let f;
    if (p.animato) {
      if (statoAnim === 'morte') f = Math.min(3, Math.floor(g.morteT * 5));
      else if (statoAnim === 'colpito') f = Math.floor((INVULNERABILITA - g.invulnerabile) * 12);
      else f = Math.floor(g.animT * (statoAnim === 'cammino' ? FPS_CAMMINO : FPS_IDLE));
    } else {
      f = Math.floor(g.animT * FPS_IDLE);
    }
    disegnaOmbra(g.x, g.y, 7);
    // chi non ha il cammino disegnato ondeggia in codice; chi muore senza il disegno cade
    let dy = 0;
    if (!p.animato && g.muove) dy = Math.abs(Math.sin(g.animT * 12)) * -2;
    if (stato.fase === 'morte' && !p.animato) {
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(Math.min(1, g.morteT) * 1.3); ctx.translate(-g.x, -g.y);
      ctx.globalAlpha = Math.max(0.15, 1 - g.morteT);
      striscia(nome, 0, g.x, g.y, g.verso, false);
      ctx.globalAlpha = 1; ctx.restore();
      return;
    }
    const lampeggia = g.invulnerabile > 0 && Math.floor(g.invulnerabile * 30) % 2 === 0 && stato.fase !== 'morte';
    // in forma spettrale si e' mezzi trasparenti
    if (stato.bonus.fantasma) ctx.globalAlpha = 0.5;
    striscia(nome, f, g.x, g.y + dy, g.verso, lampeggia);
    ctx.globalAlpha = 1;
    // la barriera: un anello che pulsa intorno
    if (stato.bonus.barriera) {
      ctx.strokeStyle = `rgba(74, 217, 255, ${0.6 + Math.sin(g.animT * 9) * 0.25})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(g.x, g.y - 7, 13, 15, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  /**
   * La barra della vita di un mostro: rossa, sopra la testa, larga quanto
   * lui. Il boss ne ha una piu' grossa, con la tacca a meta'. Tre
   * rettangoli a testa: con cinquecento in vista sono millecinquecento
   * `fillRect`, che costano meno di un `drawImage`.
   */
  function disegnaVita(e, boss) {
    const w = boss ? 40 : Math.max(10, Math.round(11 * e.scala));
    const h = boss ? 4 : 2;
    const frazione = e.vitaMax > 0 ? Math.max(0, Math.min(1, e.vita / e.vitaMax)) : 0;
    const bx = Math.round(e.x - w / 2);
    const by = Math.round(e.y - 16 * e.scala - h - 3);
    ctx.fillStyle = '#04070b'; ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
    ctx.fillStyle = '#4a1010'; ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = boss ? '#ff3b3b' : '#e01b1b'; ctx.fillRect(bx, by, Math.round(w * frazione), h);
    if (boss) { ctx.fillStyle = '#04070b'; ctx.fillRect(bx + (w >> 1), by, 1, h); }
  }

  /** Una cassa: corpo, coperchio che si alza, luce che esce, alone per le rarita' alte. */
  function disegnaCassa(k, tempoReale) {
    const r = k.rarita;
    const pronta = casse?.get(r.id);
    const ondeggio = k.st === 0 ? Math.sin((tempoReale + k.fase * 5) * 3) * 1 : 0;
    const y = k.y + ondeggio;
    let avanzo = 0; let alfa = 1;
    if (k.st === CH_APRE) avanzo = Math.min(1, k.t / 0.55);
    else if (k.st === CH_APERTA) { avanzo = 1; alfa = Math.max(0, 1 - k.t); }
    disegnaOmbra(k.x, k.y, 8);
    if (r.aura > 0 && k.st !== CH_APERTA) {
      ctx.strokeStyle = r.colore; ctx.lineWidth = r.aura;
      ctx.globalAlpha = 0.45 + Math.sin(tempoReale * 5 + k.fase * 6) * 0.25;
      ctx.beginPath(); ctx.ellipse(k.x, k.y + 1, 13 + r.aura * 2, 6 + r.aura, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = alfa;
    const sollevo = Math.round(avanzo * 7);
    if (avanzo > 0) {
      // la luce che esce dalla cassa aperta
      ctx.fillStyle = r.luce; ctx.globalAlpha = alfa * (0.25 + 0.35 * avanzo);
      ctx.fillRect(Math.round(k.x - 4), Math.round(y - 12 - sollevo - 20 * avanzo), 8, Math.round(20 * avanzo));
      ctx.globalAlpha = alfa;
    }
    if (pronta) {
      ctx.drawImage(pronta.corpo, Math.round(k.x - 9), Math.round(y - 10));
      ctx.drawImage(pronta.coperchio, Math.round(k.x - 9), Math.round(y - 14 - sollevo));
    } else {
      ctx.fillStyle = r.colore; ctx.fillRect(Math.round(k.x - 8), Math.round(y - 12 - sollevo), 16, 12);
    }
    ctx.globalAlpha = 1;
  }

  function disegna(stato, tempoReale) {
    inquadra(stato);
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.translate(-camera.x, -camera.y);

    pavimento(stato);

    // i decori
    const fT = Math.floor(tempoReale * 8);
    for (let i = 0; i < stato.decori.length; i += 1) {
      const d = stato.decori[i];
      if (inVista(d.x, d.y)) striscia('mondo.torcia', fT + Math.floor(d.fase * 4), d.x, d.y);
    }

    // le gemme: la taglia e' la ricevuta del mostro che l'ha lasciata, e si
    // legge da lontano — le due piu' grosse hanno anche l'alone
    const G = stato.gemme;
    for (let i = 0; i < G.n; i += 1) {
      const gm = G.lista[i];
      if (!inVista(gm.x, gm.y, 20)) continue;
      const g = GEMME[gm.taglia] ?? GEMME[0];
      const sali = Math.sin((tempoReale + gm.fase * 6) * 5) * 1.5;
      const y = gm.y - 4 + sali;
      if (g.alone > 0) {
        ctx.strokeStyle = g.colore; ctx.lineWidth = g.alone;
        ctx.globalAlpha = 0.3 + Math.sin(tempoReale * 5 + gm.fase * 6) * 0.15;
        ctx.beginPath(); ctx.ellipse(gm.x, gm.y + 1, 5 + g.alone * 2, 3 + g.alone, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const t = gemme?.[gm.taglia];
      if (t) ctx.drawImage(t, aSchermo(gm.x - t.width / 2), aSchermo(y - t.height / 2));
      else segnaposto(gm.x, y, 6, g.colore);
    }

    // le casse, e i telegrafi degli impatti della tempesta
    const K = stato.casse;
    for (let i = 0; i < K.n; i += 1) if (inVista(K.lista[i].x, K.lista[i].y)) disegnaCassa(K.lista[i], tempoReale);
    const I = stato.impatti;
    for (let i = 0; i < I.n; i += 1) {
      const m = I.lista[i];
      if (!inVista(m.x, m.y, 60)) continue;
      const avanzo = 1 - Math.max(0, m.vita) / m.durata;
      ctx.strokeStyle = 'rgba(255, 194, 51, 0.9)'; ctx.lineWidth = 1;
      ctx.fillStyle = `rgba(255, 194, 51, ${0.08 + 0.25 * avanzo})`;
      ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r, m.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r * avanzo, m.r * 0.55 * avanzo, 0, 0, Math.PI * 2); ctx.fill();
    }

    // i nemici in vista, dal piu' alto al piu' basso
    const N = stato.nemici;
    visibili.length = 0;
    for (let i = 0; i < N.n; i += 1) if (inVista(N.lista[i].x, N.lista[i].y)) visibili.push(N.lista[i]);
    ordinaPerY(visibili);
    const g = stato.giocatore;
    let giocatoreDisegnato = false;
    const fN = Math.floor(tempoReale * FPS_NEMICO);
    for (let i = 0; i < visibili.length; i += 1) {
      const e = visibili[i];
      if (!giocatoreDisegnato && e.y > g.y) { disegnaGiocatore(stato); giocatoreDisegnato = true; }
      const ondeggio = Math.sin((tempoReale + e.fase * 4) * 9) * 0.8;
      const verso = e.x > g.x ? -1 : 1;
      const capo = e.tipo.comportamento === 'capo';
      const boss = e.tipo.comportamento === 'boss';
      disegnaOmbra(e.x, e.y, 5 * e.scala);
      // l'alone: oro per l'elite, brace per il capo, il suo colore per il boss. Sono pochi, e si notano.
      if (e.elite || capo || boss) {
        ctx.strokeStyle = boss ? e.tipo.colore : capo ? 'rgba(255, 122, 92, 0.75)' : 'rgba(255, 194, 51, 0.75)';
        ctx.lineWidth = boss ? 2 : 1;
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 1, 9 * e.scala, 4 * e.scala, 0, 0, Math.PI * 2); ctx.stroke();
      }
      // il boss che mira lo dice con la forma del colpo
      if (boss && e.st === ST_MIRA) disegnaTelegrafo(e);
      // chi sta mirando lo dice: una riga verso dove partira'
      if (e.st === 1 && (e.tipo.comportamento === 'carica' || capo)) {
        ctx.strokeStyle = 'rgba(255, 122, 92, 0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(e.x, e.y - 4);
        if (capo) ctx.arc(e.x, e.y, e.tipo.abilita.schianto.raggio, 0, Math.PI * 2);
        else ctx.lineTo(e.x + e.cx * 34, e.y - 4 + e.cy * 34);
        ctx.stroke();
      }
      striscia(e.tipo.sprite, fN + Math.floor(e.fase * 4), e.x, e.y + ondeggio, verso, e.lampo > 0, e.scala);
      disegnaVita(e, boss);
    }
    if (!giocatoreDisegnato) disegnaGiocatore(stato);

    // le armi intorno al giocatore: l'aura delle spine e le lame dell'anello
    disegnaArmiAddosso(stato, tempoReale);

    // i proiettili, ognuno con la faccia della sua arma
    // la trasformazione di ogni proiettile si scrive in una chiamata sola
    // (`setTransform`) invece di save/translate/rotate/restore: con
    // duecento proiettili sono seicento chiamate in meno a fotogramma
    const P = stato.proiettili;
    const fr = asset.get('proiettile.freccia');
    const sx = dpr * zoom;
    for (let i = 0; i < P.n; i += 1) {
      const p = P.lista[i];
      if (!inVista(p.x, p.y, 16)) continue;
      const a = Math.atan2(p.vy, p.vx);
      const ca = Math.cos(a); const sa = Math.sin(a);
      ctx.setTransform(sx * ca, sx * sa, -sx * sa, sx * ca, (p.x - camera.x) * sx, (p.y - camera.y) * sx);
      switch (p.arma) {
        case 'ventaglio':
          ctx.fillStyle = '#9fe4ff'; ctx.fillRect(-3, -1, 6, 2); ctx.fillStyle = '#d6f4ff'; ctx.fillRect(1, -1, 2, 2);
          break;
        case 'lancia':
          ctx.fillStyle = 'rgba(214, 244, 255, 0.55)'; ctx.fillRect(-14, -1, 20, 2);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(4, -1, 6, 2);
          break;
        case 'falce': {
          const r = a + tempoReale * 22; const cr = Math.cos(r); const sr = Math.sin(r);
          ctx.setTransform(sx * cr, sx * sr, -sx * sr, sx * cr, (p.x - camera.x) * sx, (p.y - camera.y) * sx);
          ctx.fillStyle = '#d6f4ff'; ctx.fillRect(-6, -1, 12, 2); ctx.fillRect(-1, -6, 2, 12);
          ctx.fillStyle = '#4ad9ff'; ctx.fillRect(-2, -2, 4, 4);
          break;
        }
        case 'trappola':
          ctx.setTransform(sx, 0, 0, sx, (p.x - camera.x) * sx, (p.y - camera.y) * sx);
          ctx.fillStyle = '#2a1a12'; ctx.fillRect(-5, -3, 10, 5);
          ctx.fillStyle = '#8a6a4a'; ctx.fillRect(-4, -2, 8, 3);
          ctx.fillStyle = Math.floor(tempoReale * 4) % 2 === 0 ? '#ff5c5c' : '#7a2a2a'; ctx.fillRect(-1, -2, 2, 2);
          break;
        case 'spirale':
          ctx.fillStyle = 'rgba(255, 154, 76, 0.5)'; ctx.fillRect(-5, -2, 8, 4);
          ctx.fillStyle = '#ffd27a'; ctx.fillRect(-1, -1, 3, 3);
          break;
        case 'rimbalzo':
          ctx.fillStyle = 'rgba(214, 244, 255, 0.5)'; ctx.fillRect(-4, -4, 8, 8);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -2, 4, 4);
          break;
        case 'spirito': {
          const pulsa = 3 + Math.sin(tempoReale * 18) * 1;
          ctx.fillStyle = 'rgba(155, 123, 212, 0.45)'; ctx.fillRect(-pulsa - 2, -pulsa - 2, pulsa * 2 + 4, pulsa * 2 + 4);
          ctx.fillStyle = '#d9c8ff'; ctx.fillRect(-2, -2, 4, 4);
          break;
        }
        default:
          if (fr) ctx.drawImage(fr.img, -fr.img.naturalWidth / 2, -fr.img.naturalHeight / 2);
          else { ctx.fillStyle = '#4ad9ff'; ctx.fillRect(-8, -1, 16, 2); }
          if (p.brucia > 0) { ctx.fillStyle = '#ff9a4c'; ctx.fillRect(-9, -1, 4, 2); }
      }
    }
    ctx.setTransform(sx, 0, 0, sx, 0, 0); ctx.translate(-camera.x, -camera.y);

    // i fulmini: segmenti spezzati che durano un lampo
    const F = stato.fulmini;
    for (let i = 0; i < F.n; i += 1) {
      const f = F.lista[i];
      const alfa = Math.max(0, f.vita / f.durata);
      ctx.globalAlpha = alfa;
      ctx.strokeStyle = f.colore; ctx.lineWidth = f.spessore;
      ctx.beginPath(); ctx.moveTo(f.x1, f.y1);
      // i fulmini delle armi sono spezzati; il raggio di un boss e' dritto
      if (f.spessore < 3) {
        const mx = (f.x1 + f.x2) / 2 + (f.y2 - f.y1) * 0.18; const my = (f.y1 + f.y2) / 2 - (f.x2 - f.x1) * 0.18;
        ctx.lineTo(mx, my);
      }
      ctx.lineTo(f.x2, f.y2); ctx.stroke();
      ctx.globalAlpha = alfa * 0.4; ctx.lineWidth = f.spessore * 2; ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // i tiri dei nemici: piccoli, scuri, con una punta accesa
    const T = stato.tiri;
    for (let i = 0; i < T.n; i += 1) {
      const t = T.lista[i];
      if (!inVista(t.x, t.y, 16)) continue;
      const a = Math.atan2(t.vy, t.vx);
      ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(a);
      ctx.fillStyle = '#5a2a2a'; ctx.fillRect(-5, -1, 8, 2);
      ctx.fillStyle = '#ff7a5c'; ctx.fillRect(3, -1, 3, 2);
      ctx.restore();
    }

    // le onde d'urto
    const O = stato.onde;
    for (let i = 0; i < O.n; i += 1) {
      const o = O.lista[i];
      ctx.globalAlpha = Math.max(0, o.vita / o.durata);
      ctx.strokeStyle = o.colore; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r, o.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // le particelle
    const V = stato.particelle;
    for (let i = 0; i < V.n; i += 1) {
      const p = V.lista[i];
      if (!inVista(p.x, p.y, 4)) continue;
      ctx.globalAlpha = Math.max(0, p.vita / p.durata);
      ctx.fillStyle = p.colore;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
    ctx.globalAlpha = 1;

    // le scritte che galleggiano: il contenuto delle casse
    const TX = stato.testi;
    if (TX.n > 0) {
      ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      for (let i = 0; i < TX.n; i += 1) {
        const t = TX.lista[i];
        ctx.globalAlpha = Math.max(0, Math.min(1, t.vita / t.durata * 1.5));
        ctx.fillStyle = '#04070b'; ctx.fillText(t.testo, Math.round(t.x) + 1, Math.round(t.y) + 1);
        ctx.fillStyle = t.colore; ctx.fillText(t.testo, Math.round(t.x), Math.round(t.y));
      }
      ctx.globalAlpha = 1; ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }

    // il lampo di una cassa rara o epica
    if (stato.lampoSchermo > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = Math.min(0.3, stato.lampoSchermo * 1.2);
      ctx.fillStyle = stato.lampoColore; ctx.fillRect(0, 0, cssW, cssH);
      ctx.globalAlpha = 1;
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0); ctx.translate(-camera.x, -camera.y);
    }

    // il velo rosso quando si e' colpiti
    if (g.lampo > 0 || stato.fase === 'morte') {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(224, 27, 27, ${stato.fase === 'morte' ? 0.35 : 0.22})`;
      ctx.fillRect(0, 0, cssW, cssH);
    }
  }

  function chiudi() {
    if (osservatore) osservatore.disconnect();
    else if (typeof window !== 'undefined') window.removeEventListener('resize', misura);
  }

  return {
    disegna,
    chiudi,
    misura,
    raggioVista,
    camera,
    direzioneDaSchermo: (stato, sx, sy) => direzioneDaSchermo(stato, sx, sy),
  };
}
