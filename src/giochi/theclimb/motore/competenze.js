/**
 * Come cresce una competenza, e come arrugginisce.
 *
 * Rendimenti decrescenti: da 0 a 40 si sale in fretta, da 80 a 100 quasi
 * mai. La formula sta in `CRESCITA` (bilancio), e ha due esponenti — uno
 * per lo studio, uno piu' dolce per il campo — perche' gli ultimi venti
 * punti si prendono facendo, non leggendo.
 */

import { CRESCITA, PASSO } from '../contenuti/bilancio.js';

const stretto = (v) => Math.min(100, Math.max(0, v));

/**
 * Il valore dopo `gradini` di spinta. `campo` dice se e' esperienza vera.
 * Torna il nuovo valore, non il delta: chi chiama fa la differenza se gli
 * serve per il riepilogo.
 */
export function cresci(valore, gradini, { campo = false, scala = 1 } = {}) {
  if (!gradini) return valore;
  const spinta = gradini * PASSO.competenza * scala;
  const esponente = campo ? CRESCITA.esponenteCampo : CRESCITA.esponenteStudio;
  const margine = Math.max(0, (100 - valore) / 100);
  return stretto(valore + spinta * margine ** esponente);
}

/** Una competenza non usata perde un po', ma non sotto la soglia. */
export function arrugginisci(valore) {
  if (valore <= CRESCITA.ruggineSotto) return valore;
  return Math.max(CRESCITA.ruggineSotto, valore - CRESCITA.ruggineSettimanale);
}

/** La media di una famiglia, per le valutazioni. */
export const mediaDi = (mappa) => {
  const v = Object.values(mappa);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
};
