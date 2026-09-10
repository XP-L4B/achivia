/**
 * La scala di carriera: da stagista a CEO di ACHIVIA SPA.
 *
 * Undici gradini in quattro fasce. La fascia decide quanto pesano hard e
 * soft skill (`competenze.js`), e da dove in su non si sale senza uno
 * sponsor — qualcuno che fa il tuo nome nelle stanze dove tu non sei.
 * Quello lo scopre il giocatore, alla prima promozione mancata.
 *
 * Non si scontra con le divisioni della classifica di The Boss, che si
 * chiamano allo stesso modo, perche' le divisioni di The Climb hanno nomi
 * loro (`base · versante · cresta · parete · vetta · cima`, fase otto).
 */
export const LIVELLI = [
  { n: 0,  id: 'stagista',       nome: 'Stagista',        fascia: 'basso' },
  { n: 1,  id: 'junior',         nome: 'Junior',          fascia: 'basso' },
  { n: 2,  id: 'senior',         nome: 'Senior',          fascia: 'medio' },
  { n: 3,  id: 'team_lead',      nome: 'Team Lead',       fascia: 'medio' },
  { n: 4,  id: 'manager',        nome: 'Manager',         fascia: 'medio' },
  { n: 5,  id: 'senior_manager', nome: 'Senior Manager',  fascia: 'alto' },
  { n: 6,  id: 'director',       nome: 'Director',        fascia: 'alto' },
  { n: 7,  id: 'vp',             nome: 'VP',              fascia: 'alto' },
  { n: 8,  id: 'svp',            nome: 'SVP',             fascia: 'altissimo' },
  { n: 9,  id: 'c_level',        nome: 'C-Level',         fascia: 'altissimo' },
  { n: 10, id: 'ceo',            nome: 'CEO di ACHIVIA SPA', fascia: 'altissimo' },
];

/** Da questo livello in su senza sponsor non si sale. */
export const SERVE_SPONSOR_DA = 4;

export const livelloById = (id) => LIVELLI.find((l) => l.id === id) || LIVELLI[0];
export const livelloN = (n) => LIVELLI.find((l) => l.n === n) || LIVELLI[0];
