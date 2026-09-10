/**
 * Il caricatore: precarica le immagini del registro e le tiene decodificate.
 *
 * Si carica una volta per sessione: la seconda partita, e quella dopo,
 * riusano le stesse immagini. Un asset che manca non fa crashare niente:
 * il renderer disegna un segnaposto colorato al suo posto e lo scrive in
 * console una volta sola.
 *
 * Insieme all'immagine si preparano due copie, con un canvas fuori schermo,
 * una volta sola:
 *
 *   bianca     la stessa striscia tutta bianca, per il lampo del colpo;
 *   specchio   la striscia rovesciata, per chi guarda a sinistra. Disegnare
 *              da una copia rovesciata costa un `drawImage`; rovesciare al
 *              volo costa `save`, `scale` e `restore` per ogni sprite, che
 *              con quattrocento nemici sono milleduecento chiamate al
 *              fotogramma.
 *
 * Nella copia rovesciata il fotogramma `f` sta in posizione `n - 1 - f`.
 */

import { ASSET } from './asset';

const mancanti = new Set();
let cache = null;

function tela(w, h) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  return ctx ? { c, ctx } : null;
}

function sagomaBianca(img) {
  const t = tela(img.naturalWidth || img.width, img.naturalHeight || img.height);
  if (!t) return null;
  t.ctx.drawImage(img, 0, 0);
  t.ctx.globalCompositeOperation = 'source-in';
  t.ctx.fillStyle = '#ffffff';
  t.ctx.fillRect(0, 0, t.c.width, t.c.height);
  return t.c;
}

function specchio(img, riquadro, fotogrammi) {
  const w = img.naturalWidth || img.width; const h = img.naturalHeight || img.height;
  const t = tela(w, h);
  if (!t) return null;
  t.ctx.imageSmoothingEnabled = false;
  if (riquadro && fotogrammi > 1) {
    // ogni fotogramma rovesciato al suo posto, in ordine inverso
    for (let f = 0; f < fotogrammi; f += 1) {
      t.ctx.save();
      t.ctx.translate((fotogrammi - 1 - f) * riquadro + riquadro, 0);
      t.ctx.scale(-1, 1);
      t.ctx.drawImage(img, f * riquadro, 0, riquadro, h, 0, 0, riquadro, h);
      t.ctx.restore();
    }
  } else {
    t.ctx.translate(w, 0); t.ctx.scale(-1, 1); t.ctx.drawImage(img, 0, 0);
  }
  return t.c;
}

function caricaUna(nome, sch) {
  return new Promise((risolvi) => {
    if (!sch?.via || typeof Image === 'undefined') { risolvi([nome, null]); return; }
    const img = new Image();
    img.onload = () => risolvi([nome, {
      img,
      bianca: sagomaBianca(img),
      specchio: specchio(img, sch.riquadro, sch.fotogrammi),
      ...sch,
    }]);
    img.onerror = () => { mancanti.add(nome); risolvi([nome, null]); };
    img.src = sch.via;
  });
}

/**
 * Carica tutto il registro. Torna una mappa nome → { img, bianca,
 * specchio, riquadro, fotogrammi, ancora }; le voci mancanti valgono `null`.
 * La seconda chiamata torna la stessa mappa senza ricaricare niente.
 */
export async function caricaTutto(onAvanzamento) {
  if (cache) return cache;
  const voci = Object.entries(ASSET);
  const risultato = new Map();
  let fatte = 0;
  await Promise.all(voci.map(async ([nome, sch]) => {
    const [n, v] = await caricaUna(nome, sch);
    risultato.set(n, v);
    fatte += 1;
    onAvanzamento?.(fatte, voci.length);
  }));
  if (mancanti.size) {
    console.warn(`[arena] asset non trovati, si usa il segnaposto: ${[...mancanti].join(', ')}`);
  }
  cache = risultato;
  return risultato;
}
