/**
 * Il periodo del Castello, scritto e tradotto.
 *
 * Sta in un file suo e non accanto al componente perche' non e' un
 * componente: mescolarlo agli altri export rompe il ricaricamento a caldo.
 * E' la stessa ragione per cui `periodi.js` sta accanto a `FinestraPeriodo`
 * invece che dentro.
 */

import { breve } from '../../components/ui/periodi';
import { FINESTRE, finestraDa } from '../../data/castello';

/** Il periodo scritto, per l'intestazione dei pannelli. */
export const etichetta = (periodo, intervallo) =>
  (periodo === 'personalizzata' && intervallo
    ? `${breve(intervallo.da)}–${breve(intervallo.a)}`
    : (FINESTRE.find((f) => f.id === periodo)?.nome || '').toUpperCase());

/** Le due date della finestra scelta, come le vuole il dominio. */
export const finestraScelta = (periodo, intervallo, adesso) =>
  finestraDa(periodo, intervallo || {}, adesso);
