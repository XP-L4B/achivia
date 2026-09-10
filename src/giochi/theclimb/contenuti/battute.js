/**
 * Quello che dice l'avatar nella stanza.
 *
 * Una battuta per stato d'animo, scelta guardando i numeri di questa
 * settimana — nell'ordine in cui pesano: prima il crollo, poi lo stress,
 * la noia, il sonno, i soldi, il lavoro che non c'e', la felicita'. Non
 * dice niente che il cruscotto non dica gia': lo dice con la voce di chi
 * lo sta vivendo, che e' il modo in cui Tabboz raccontava i suoi numeri.
 *
 * Non c'e' caso: la battuta della settimana si prende dal numero della
 * settimana, cosi' due persone con la stessa vita leggono la stessa cosa
 * e il replay e' identico anche in questo.
 *
 * Le soglie sono quelle del motore (`STRESS`, `NOIA`): la voce cambia
 * dove cambiano i colori delle barre.
 */
import { STRESS, NOIA } from './bilancio.js';

export const BATTUTE = {
  crollo: [
    'Non ce la faccio più a stare dietro alle cose.',
    'Le decisioni le prendo stanco. Lo so, e non riesco a fermarmi.',
    'Ho pianto in macchina prima di entrare. Non lo dico a nessuno.',
  ],
  stress: [
    'Dormo male da tre settimane.',
    'Ho saltato di nuovo la cena con i miei.',
    'Se squilla il telefono la domenica mi si chiude lo stomaco.',
    'Sto bene. Sto bene. Ho solo bisogno di una settimana tranquilla.',
  ],
  noia: [
    'Guardo l’orologio ogni dieci minuti.',
    'Non ricordo l’ultima volta che ho imparato qualcosa.',
    'Il lunedì pesa più del solito, e non saprei dire perché.',
    'Faccio le stesse cose di un anno fa, solo più in fretta.',
  ],
  stanco: [
    'Cinque ore di sonno. Sei, se vado bene.',
    'Mi addormento sui mezzi. Mi sveglio alla fermata dopo.',
    'Caffè. Poi vediamo.',
  ],
  rosso: [
    'Conto i giorni alla fine del mese. Poi ricomincio a contarli.',
    'Ho rimandato il dentista un’altra volta.',
    'Il conto è sotto zero e lo stipendio arriva il ventisette.',
  ],
  senzaLavoro: [
    'Senza uno stipendio i conti sono tutti in uscita.',
    'Mando curriculum. Rispondono in pochi.',
    'Ho tempo. È l’unica cosa che ho.',
  ],
  felice: [
    'Oggi è andata bene. Me lo segno.',
    'Sto facendo la cosa giusta, credo.',
    'Ho chiamato un amico che non sentivo da mesi. Bello.',
  ],
  nuovo: [
    'Primo giorno. Non so ancora dove sta la macchina del caffè.',
    'Nuovo posto, nuove facce. Vediamo chi sono davvero.',
  ],
  normale: [
    'Una settimana come le altre. Non è poco.',
    'Passo dopo passo.',
    'Studio, lavoro, gente. Regge.',
    'Vediamo che porta la settimana.',
    'Non è dove voglio essere. Ma è più su di ieri.',
  ],
};

/** Lo stato d'animo di questa settimana, dal peso maggiore al minore. */
export function umoreDi(foto) {
  const c = foto.corpo; const v = foto.vita;
  if (c.stress >= STRESS.crollo) return 'crollo';
  if (c.stress >= STRESS.segnali) return 'stress';
  if (c.noia >= NOIA.segnali) return 'noia';
  if (c.sonno >= STRESS.sogliaSonno) return 'stanco';
  if (v.soldi < 0) return 'rosso';
  if (!foto.lavoro) return 'senzaLavoro';
  if (foto.lavoro.anzianita <= 1) return 'nuovo';
  if (c.felicita >= 75) return 'felice';
  return 'normale';
}

/** La battuta della settimana: dallo stato d'animo, senza caso. */
export function battutaDi(foto) {
  const lista = BATTUTE[umoreDi(foto)] ?? BATTUTE.normale;
  return lista[foto.settimana % lista.length];
}

/** Le etichette che compaiono accanto alla mano, per chi non legge i colori. */
export const UMORI = {
  crollo: { segno: '!!', testo: 'al limite' },
  stress: { segno: '!', testo: 'sotto stress' },
  noia: { segno: '…', testo: 'annoiato' },
  stanco: { segno: 'zzz', testo: 'senza sonno' },
  rosso: { segno: '−€', testo: 'in rosso' },
  /* senza lavoro non c'e' un segno: lo dice gia' la targa sul muro */
  senzaLavoro: { segno: '', testo: 'senza lavoro' },
  felice: { segno: '♥', testo: 'contento' },
  nuovo: { segno: '✦', testo: 'appena arrivato' },
  normale: { segno: '', testo: '' },
};
