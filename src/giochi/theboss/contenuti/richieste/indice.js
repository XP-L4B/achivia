/**
 * La banca delle richieste: come si carica, e perche' a pezzi.
 *
 * I testi stanno in lotti (`lotto-01.js`, `lotto-02.js`, ...) e ogni lotto
 * si carica **quando serve**, non all'avvio. Con duecento voci sarebbe
 * indifferente; l'architettura pero' e' fatta per arrivare a qualche
 * migliaio, e a quel punto caricare tutto per giocare un giorno sarebbe
 * mezzo megabyte buttato addosso a chi apre il gioco.
 *
 * Il caricamento e' **asincrono e sta fuori dal motore**: la schermata
 * chiama `caricaBanca()` prima di cominciare e passa il risultato a
 * `creaPartita`. Il motore resta sincrono e senza rete, che e' la ragione
 * per cui si puo' rigiocare una partita e verificarla.
 *
 * `VERSIONE_BANCA` si salva con ogni partita: serve a rigiocare — e un
 * giorno a ricontrollare un punteggio — anche dopo che avremo aggiunto
 * altri lotti. Chi aggiunge o cambia una voce alza il numero.
 */

import { VERSIONE_BANCA } from './schema.js';

/* I lotti, elencati a mano e non con una glob: cosi' l'ordine e' stabile,
   ed e' l'ordine che rende il pescaggio ripetibile. */
const LOTTI = [
  () => import('./lotto-01.js'),
  () => import('./lotto-02.js'),
  () => import('./lotto-03.js'),
  () => import('./lotto-04.js'),
  () => import('./lotto-05.js'),
  () => import('./lotto-06.js'),
  () => import('./lotto-07.js'),
  () => import('./lotto-08.js'),
  () => import('./lotto-09.js'),
  () => import('./lotto-10.js'),
  () => import('./lotto-11.js'),
  () => import('./lotto-12.js'),
];

let cache = null;

/**
 * Carica la banca e la ordina per archetipo. La seconda chiamata non
 * ricarica niente.
 *
 * Torna `{ versione, perArchetipo, tutte }` — `perArchetipo` e' una mappa
 * da id di archetipo all'elenco dei testi che gli appartengono, che e'
 * l'unica forma in cui il pescaggio la usa.
 */
export async function caricaBanca() {
  if (cache) return cache;
  const lotti = await Promise.all(LOTTI.map((carica) => carica()));
  const tutte = lotti.flatMap((m) => m.default);
  const perArchetipo = new Map();
  for (const voce of tutte) {
    if (!perArchetipo.has(voce.arch)) perArchetipo.set(voce.arch, []);
    perArchetipo.get(voce.arch).push(voce);
  }
  cache = { versione: VERSIONE_BANCA, perArchetipo, tutte };
  return cache;
}

/** Solo per gli attrezzi: carica tutto senza passare dalla cache. */
export async function caricaTuttiILotti() {
  const lotti = await Promise.all(LOTTI.map((carica, i) => carica().then((m) => ({ lotto: i + 1, voci: m.default }))));
  return lotti;
}

export { VERSIONE_BANCA };
