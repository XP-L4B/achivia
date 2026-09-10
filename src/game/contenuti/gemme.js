/**
 * Le gemme dell'esperienza: cinque taglie, dalla scheggia al nucleo.
 *
 * Una gemma e' la ricevuta di quello che hai appena ammazzato, quindi non
 * possono essere tutte uguali: uno sciame lascia una briciola, un ciclope
 * una pietra che si vede da mezzo schermo. Chi gioca legge il valore dal
 * colore e dalla mole, prima ancora di raccoglierla, e decide se vale la
 * pena andarla a prendere in mezzo all'ondata.
 *
 * La fascia si sceglie sull'esperienza, non sul nemico: un elite vale
 * quattro volte il suo nemico normale, e la sua gemma sale di fascia da
 * sola. Le soglie sono tarate sull'economia vera del gioco —
 *
 *   scheggia   1-2    sciame, pipistrello
 *   frammento  3-6    ossa, mano, arciere, scarabeo, e gli elite piu' magri
 *   gemma      7-14   melma, troll, gli elite dei nemici comuni
 *   cristallo  15-39  gli elite grossi e le otto schegge di un boss
 *   nucleo     40+    il ciclope, e gli elite dei nemici grossi
 *
 * — e vanno riguardate se cambiano gli `xp` in `nemici.js` o `ELITE.xp`.
 *
 * I colori sono quelli delle rarita' delle casse (`contenuti/casse.js`)
 * piu' l'oro dei boss: un gioco solo, una scala di colori sola. La
 * geometria e' quella della gemma disegnata a mano che c'era prima —
 * `larghezza` e' il corpo senza il contorno, `corpo` quante righe piene ha
 * in mezzo — e la sagoma finita misura `larghezza + 2` per
 * `larghezza + corpo + 2`. Il disegno sta in `disegno.js`, `gemmePronte`.
 */

export const GEMME = [
  {
    id: 'scheggia', da: 0, larghezza: 4, corpo: 1, alone: 0,
    luccichio: '#ffffff', luce: '#f0d9a8', colore: '#c9a06a', ombra: '#8a6440', fondo: '#4a3526',
  },
  {
    id: 'frammento', da: 3, larghezza: 6, corpo: 2, alone: 0,
    luccichio: '#ffffff', luce: '#d6ffb0', colore: '#8fd06a', ombra: '#4f8a3d', fondo: '#2b4229',
  },
  {
    id: 'gemma', da: 7, larghezza: 6, corpo: 4, alone: 0,
    luccichio: '#ffffff', luce: '#2ce8f5', colore: '#0095e9', ombra: '#124e89', fondo: '#262b44',
  },
  {
    id: 'cristallo', da: 15, larghezza: 8, corpo: 5, alone: 1,
    luccichio: '#ffffff', luce: '#efd7ff', colore: '#c58cff', ombra: '#6d3fa8', fondo: '#322453',
  },
  {
    id: 'nucleo', da: 40, larghezza: 10, corpo: 6, alone: 2,
    luccichio: '#ffffff', luce: '#ffe9a8', colore: '#ffc233', ombra: '#b06f13', fondo: '#4a2f10',
  },
];

/** Il contorno, uguale per tutte: e' il nero del resto della pixel art. */
export const CONTORNO_GEMMA = '#181425';

/**
 * La fascia di una gemma da quanta esperienza vale. Torna l'indice in
 * `GEMME`, che e' quello che la gemma si porta dietro nella vasca: un
 * numero, non un oggetto, cosi' la vasca resta piatta.
 */
export function tagliaGemma(xp) {
  let i = 0;
  while (i + 1 < GEMME.length && xp >= GEMME[i + 1].da) i += 1;
  return i;
}
