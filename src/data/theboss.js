/**
 * Le regole di The Boss come le vedono le schermate.
 *
 * Sta in mezzo fra il deposito e le pagine, come `data/arena.js` e
 * `data/lexora.js`: le schermate non chiamano mai il deposito e non
 * conoscono il motore. Importa il deposito **direttamente** e non da
 * `db.js`, cosi' la banca dei testi e il motore restano fuori dal pacchetto
 * principale di Achivia.
 */

export {
  registraPartitaTheBoss, partiteTheBoss, primatiTheBoss, classificaTheBoss,
  divisioneDi, chiudiStagione, telemetriaTheBoss, verificaPartita, puntiPartita,
  LEGHE_THEBOSS, DIVISIONI, PESI, chiaveLegaTheBoss,
} from './deposito/theboss';

import { LEGHE_THEBOSS, chiaveLegaTheBoss, DIVISIONI } from './deposito/theboss';
import { personaById } from '../giochi/theboss/contenuti/cast';
import { archetipoById } from '../giochi/theboss/contenuti/archetipi';

export const nomeDivisione = (id) => DIVISIONI.find((d) => d.id === id)?.nome || DIVISIONI[0].nome;
export const etichettaLega = (lega) => LEGHE_THEBOSS.find((l) => l.id === lega)?.nome || lega;
export { chiaveLegaTheBoss as chiaveLega };

/**
 * I tre momenti che hanno deciso la partita.
 *
 * Non e' una classifica di decisioni: e' il racconto che serve a chi ha
 * appena perso per capire **dove**. Si guardano le conseguenze differite
 * che hanno spostato di piu' gli indicatori, si risale alla decisione che
 * le ha messe in moto, e si dice il giorno. Senza questo pezzo la fine
 * della partita e' un numero; con questo pezzo e' una storia con tre punti
 * di svolta, e la prossima volta si gioca diversamente.
 */
export function momentiChiave(stato) {
  if (!stato) return [];
  const peso = (c) => Math.abs(c.cassa || 0) / 200
    + Math.abs(c.produttivita || 0) * 2
    + Math.abs(c.morale || 0) * 2
    + Math.abs(c.reputazione || 0);

  const candidati = [];
  for (const rap of stato.rapporti) {
    for (const d of rap.differite) {
      candidati.push({
        giorno: d.deciso,
        quando: rap.giorno,
        peso: peso(d.cambiato),
        chi: d.chi,
        causa: d.causa,
      });
    }
  }
  /* e i giorni in cui e' rimasta gente senza risposta: sono decisioni anche
     quelle, e di solito le peggiori */
  for (const rap of stato.rapporti) {
    if (rap.scadute >= 3) {
      candidati.push({
        giorno: rap.giorno, quando: rap.giorno, peso: rap.scadute * 3,
        chi: null, causa: `${rap.scadute} persone sono rimaste senza risposta`,
      });
    }
  }
  candidati.sort((a, b) => b.peso - a.peso);

  const visti = new Set();
  const scelti = [];
  for (const c of candidati) {
    if (visti.has(c.giorno)) continue;
    visti.add(c.giorno);
    const nome = c.chi ? personaById(c.chi)?.nome : null;
    scelti.push({
      giorno: c.giorno,
      testo: c.quando === c.giorno
        ? `${c.causa}.`
        : `quello che hai deciso con ${nome || 'qualcuno'} è tornato indietro il giorno ${c.quando}: ${c.causa}.`,
    });
    if (scelti.length === 3) break;
  }
  return scelti;
}

/** Come si legge una decisione, per chi guarda una partita salvata. */
export const raccontaDecisione = (d) => {
  const a = archetipoById(d.archetipo);
  const chi = personaById(d.autoreId);
  const verbo = { accetta: 'accettata', rifiuta: 'rifiutata', rimanda: 'rimandata', scaduta: 'lasciata cadere' }[d.azione];
  return `${chi?.nome || d.autoreId}: ${a?.nome || d.archetipo} — ${verbo}`;
};

/** Quanto dura una partita, per chi legge l'atrio. */
export const durataPartita = () => '20–30 minuti';
