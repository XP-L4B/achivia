/**
 * Carica i disegni del gioco, una volta per sessione.
 *
 * Piccolo apposta: il modulo ha trenta immagini in tutto e nessuna
 * animazione da comporre al volo, quindi non serve niente di quello che fa
 * il caricatore dell'arena (le sagome bianche, le copie rovesciate). Serve
 * solo che le immagini siano decodificate prima del primo fotogramma, se
 * no la stanza appare a pezzi.
 *
 * Un'immagine che manca non ferma niente: la stanza si disegna con quello
 * che c'e' e il gioco resta giocabile, perche' quello che conta davvero —
 * il testo della richiesta e i tre pulsanti — non e' un disegno.
 *
 * E "non ferma niente" e' scritto anche nel codice, non solo qui. La prima
 * versione aspettava `onload` oppure `onerror` e basta, e nelle prove il
 * gioco restava per sempre sulla scritta «Apro l'ufficio…»: ci sono
 * situazioni — un banco di prova senza rete, una connessione che si pianta,
 * un blocco del browser — in cui **nessuno dei due eventi arriva mai**, e
 * una promessa che aspetta un evento che non arriva non si risolve. Adesso
 * c'e' anche un tempo massimo: passato quello si gioca con i disegni che
 * sono arrivati. Meglio una stanza a meta' di una porta che non si apre.
 */

/** Oltre questo tempo si comincia lo stesso, con quello che c'e'. */
const ATTESA_MASSIMA = 4000;

import { ASSET } from './asset.js';

let cache = null;

export async function caricaDisegni() {
  if (cache) return cache;
  const voci = Object.entries(ASSET);
  const mappa = new Map();
  await Promise.all(voci.map(([nome, sch]) => new Promise((risolvi) => {
    if (!sch.via || typeof Image === 'undefined') { risolvi(); return; }
    const img = new Image();
    const orologio = setTimeout(risolvi, ATTESA_MASSIMA);
    const finito = (tienila) => {
      clearTimeout(orologio);
      if (tienila) mappa.set(nome, { img, ...sch });
      risolvi();
    };
    img.onload = () => finito(true);
    img.onerror = () => finito(false);
    img.src = sch.via;
  })));
  cache = mappa;
  return mappa;
}
