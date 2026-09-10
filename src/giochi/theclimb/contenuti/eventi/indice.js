/**
 * La banca degli eventi: quattro lotti, uno per categoria.
 *
 * A differenza di The Boss, qui i lotti si importano **in modo sincrono**:
 * il motore della settimana pesca gli eventi da solo, e deve girare in
 * `node` senza un caricamento prima. Sono centoventi schede di testo — un
 * po' di kilobyte nel pezzo del gioco, che scarica solo chi lo apre.
 *
 * `VERSIONE_EVENTI` si salva con la partita: serve al replay quando la
 * banca sara' cambiata.
 */

import imprevisti from './lotto-imprevisti.js';
import opportunita from './lotto-opportunita.js';
import vita from './lotto-vita.js';
import bivi from './lotto-bivi.js';

export { VERSIONE_EVENTI, CATEGORIE, CHIAVI_QUANDO, CHIAVI_EFFETTI } from './schema.js';

export const EVENTI = [...imprevisti, ...opportunita, ...vita, ...bivi];

const perId = new Map(EVENTI.map((ev) => [ev.id, ev]));
export const eventoById = (id) => perId.get(id) || null;
