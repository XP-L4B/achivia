// Avatar selezionabili dall'utente (cartella src/assets/avatar).
// header.png è l'avatar di default.
//
// I file non si elencano più a mano: Vite li raccoglie dalla cartella, così
// per aggiungerne altri basta metterceli dentro. Ogni avatar ha due immagini,
// la sua e quella ridotta in `thumbs/`: la schermata di scelta le mostra
// tutte insieme, e a piena risoluzione sarebbero quindici megabyte di
// download per riempire una griglia di riquadri da cento pixel.
const pieni = import.meta.glob('../assets/avatar/*.png', { eager: true, import: 'default' });
const ridotti = import.meta.glob('../assets/avatar/thumbs/*.png', { eager: true, import: 'default' });

const nomeFile = (percorso) => percorso.split('/').pop().replace('.png', '');

/**
 * Numero ricavato dal nome del file. Serve a sparpagliare gli avatar: in
 * fila per numero si vedrebbe l'ordine in cui sono arrivati, e i simili
 * finirebbero vicini perche' sono stati disegnati in serie.
 */
function mescola(id) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  // Passata finale: senza, nomi vicini ("31", "32") restano vicini.
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491) >>> 0;
  return h ^ (h >>> 13);
}

/**
 * L'ordine e' sparso ma sempre lo stesso: se cambiasse a ogni apertura, i
 * riquadri ballerebbero sotto le dita mentre si sceglie e l'avatar guardato
 * un attimo prima si ritroverebbe altrove.
 */
const inOrdine = (a, b) => mescola(a.id) - mescola(b.id);

export const AVATARS = Object.entries(pieni)
  .map(([percorso, img]) => {
    const id = nomeFile(percorso);
    return { id, img, thumb: ridotti[`../assets/avatar/thumbs/${id}.png`] ?? img };
  })
  .sort(inOrdine);

export const DEFAULT_AVATAR = AVATARS.find((a) => a.id === 'header')?.img ?? AVATARS[0]?.img;

// Avatar dell'utente in base alla scelta salvata (campo `avatar`); default: header.
export function avatarForUser(user) {
  return AVATARS.find((a) => a.id === user?.avatar)?.img ?? DEFAULT_AVATAR;
}

// Avatar per id (con fallback al default).
export function avatarById(id) {
  return AVATARS.find((a) => a.id === id)?.img ?? DEFAULT_AVATAR;
}

// La miniatura del proprio avatar: quella che va dove l'immagine e' piccola
// — un riquadro, una riga d'elenco. A piena risoluzione sarebbe un megabyte
// per un quadratino di cento pixel.
export const DEFAULT_THUMB = AVATARS.find((a) => a.id === 'header')?.thumb ?? DEFAULT_AVATAR;

export function thumbForUser(user) {
  return AVATARS.find((a) => a.id === user?.avatar)?.thumb ?? DEFAULT_THUMB;
}
