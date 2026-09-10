/**
 * Le regole di The Climb come le vedono le schermate.
 *
 * Sta in mezzo fra il deposito e le pagine, come `data/theboss.js`: le
 * schermate non chiamano mai il deposito e non conoscono il motore.
 * Importa il deposito **direttamente** e non da `db.js`, cosi' il motore
 * resta fuori dal pacchetto principale di Achivia.
 */

export {
  corsaClimb, nuovaCorsaClimb, apriCorsaClimb, salvaCorsaClimb, abbandonaCorsaClimb, partiteClimb, enciclopediaClimb,
  tutorialClimbVisto, segnaTutorialClimb,
  classificaClimb, divisioneClimbDi, primatiClimb, partitaClimb, chiudiStagioneClimb,
  DIVISIONI_CLIMB, LEGHE_CLIMB, TEMI_CLIMB, PESI, puntiPartita,
  PARTITE_TENUTE_THECLIMB,
} from './deposito/theclimb';
import { DIVISIONI_CLIMB } from './deposito/theclimb';
export const nomeDivisioneClimb = (id) => DIVISIONI_CLIMB.find((d) => d.id === id)?.nome || DIVISIONI_CLIMB[0].nome;
export { SCHEDE, schedaById } from '../giochi/theclimb/contenuti/enciclopedia';

import { BACKGROUND as VITE } from '../giochi/theclimb/contenuti/background';
import { BACKGROUND as NUMERI_VITE } from '../giochi/theclimb/contenuti/bilancio';
/* le vite, con il moltiplicatore del punteggio accanto: la classifica lo mostra */
export const BACKGROUND = VITE.map((b) => ({ ...b, moltiplicatore: NUMERI_VITE[b.id]?.moltiplicatore ?? 1 }));
export { backgroundById } from '../giochi/theclimb/contenuti/background';
export { PERCORSI, percorsoById } from '../giochi/theclimb/contenuti/percorsi';
export { AZIENDE, aziendaById } from '../giochi/theclimb/contenuti/aziende';
export { STORIA, NOMI, NOMI_ATTRIBUTI, FINALI, finaleDi } from '../giochi/theclimb/contenuti/storia';
export { LIVELLI, livelloN } from '../giochi/theclimb/contenuti/livelli';

import { backgroundById } from '../giochi/theclimb/contenuti/background';
import { percorsoById } from '../giochi/theclimb/contenuti/percorsi';
import { PARTITA } from '../giochi/theclimb/contenuti/bilancio';

export const nomeBackground = (id) => backgroundById(id)?.nome || id;
export const nomePercorso = (id) => percorsoById(id)?.nome || id;

/** Da settimane ad anni e settimane, come si dice. */
export function durataDetta(settimane) {
  const anni = Math.floor(settimane / PARTITA.settimanePerAnno);
  const resto = settimane % PARTITA.settimanePerAnno;
  const a = anni ? `${anni} ${anni === 1 ? 'anno' : 'anni'}` : '';
  const s = resto ? `${resto} ${resto === 1 ? 'settimana' : 'settimane'}` : '';
  return [a, s].filter(Boolean).join(' e ') || '0 settimane';
}

export const durataPartita = () => `${PARTITA.settimaneMassime / PARTITA.settimanePerAnno} anni, una settimana alla volta`;
