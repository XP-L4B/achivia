/**
 * Le sette leve, e l'unico posto in cui un gradino diventa un numero.
 *
 * Archetipi, eventi e conseguenze parlano per gradini: `{ cassa: -2 }`.
 * Qui il gradino incontra `PASSO` e diventa milleduecentoquaranta euro. Se
 * questa conversione stesse in due posti, ribilanciare vorrebbe dire
 * ricordarsi di tutti e due.
 *
 * Il taglio ai bordi non e' un dettaglio: morale, produttivita' e
 * reputazione vivono fra zero e cento, e un gioco che li lascia scappare a
 * centoventi diventa impossibile da leggere. La cassa invece **non si
 * taglia**: sotto zero e' la sconfitta, ed e' l'unico numero a cui e'
 * permesso andarci.
 */

import { PASSO, LIMITI } from '../contenuti/bilancio.js';

const stretto = (v, [min, max]) => Math.min(max, Math.max(min, v));

/**
 * Applica dei gradini all'azienda. `scala` moltiplica tutto: la usano
 * l'escalation (una richiesta di quarto livello costa di piu') e i tratti.
 * Torna quello che e' cambiato davvero, in numeri, per il rapporto della
 * sera.
 */
export function applicaGradini(azienda, gradini, scala = 1) {
  const cambiato = {};
  for (const leva of Object.keys(gradini || {})) {
    if (leva === 'lealta') continue;              // la lealta' e' di una persona, non dell'azienda
    const passo = PASSO[leva];
    if (!passo) continue;
    const delta = gradini[leva] * passo * scala;
    const prima = azienda[leva];
    azienda[leva] = LIMITI[leva] ? stretto(prima + delta, LIMITI[leva]) : prima + delta;
    cambiato[leva] = azienda[leva] - prima;
  }
  return cambiato;
}

/** Gli stessi gradini, ma addosso a una persona sola. */
export function applicaAPersona(persona, gradini, scala = 1) {
  if (!gradini) return;
  if (gradini.lealta) persona.lealta = stretto(persona.lealta + gradini.lealta * PASSO.lealta * scala, [0, 100]);
  if (gradini.morale) persona.morale = stretto(persona.morale + gradini.morale * PASSO.morale * scala, [0, 100]);
  if (gradini.produttivita) {
    persona.produttivita = stretto(persona.produttivita + gradini.produttivita * PASSO.produttivita * scala, [0, 100]);
  }
}

export const arrotonda = (v, cifre = 1) => Math.round(v * 10 ** cifre) / 10 ** cifre;
