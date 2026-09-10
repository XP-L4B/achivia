/**
 * Chi e' una persona dentro Achivia: come si chiama, come si fa chiamare,
 * e il numero con cui la si trova.
 *
 * Tre cose diverse, e servono tutte e tre:
 *
 *   nome      quello vero, che l'organizzazione conosce e usa per lavorare
 *   nickname  quello che la persona sceglie di mostrare, se vuole
 *   numero    il codice Achivia, unico e immutabile (vedi `db.js`)
 *
 * Il nickname non sostituisce il nome, gli sta davanti: nelle schermate il
 * nome vero resta scritto sotto, piccolo. In un'app dove si assegna lavoro,
 * si approvano consegne e si registrano assenze, sapere chi c'e' dall'altra
 * parte non e' un dettaglio estetico.
 *
 * E nessuno dei due identifica: di Mario Rossi ce n'e' piu' d'uno e due
 * persone possono scegliere lo stesso nickname nello stesso minuto. Per
 * quello c'e' il numero, che infatti si vede accanto al nome.
 */

import { updateUser } from './db';

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

// Lettere di qualunque alfabeto, cifre, spazio e i pochi segni che stanno
// dentro un soprannome. Niente emoji, niente parentesi, niente a capo: il
// nickname finisce in elenchi, notifiche e riquadri stretti.
const AMMESSI = /^[\p{L}\p{N} ._'-]+$/u;

/** Che cosa non va in un nickname. Stringa vuota quando va bene. */
export function erroreNickname(valore) {
  const pulito = String(valore ?? '').trim();
  if (!pulito) return '';                        // toglierlo e' sempre lecito
  if (pulito.length < NICKNAME_MIN) return `Almeno ${NICKNAME_MIN} caratteri.`;
  if (pulito.length > NICKNAME_MAX) return `Al massimo ${NICKNAME_MAX} caratteri.`;
  if (!AMMESSI.test(pulito)) return 'Solo lettere, numeri, spazio e . _ - ’';
  return '';
}

/**
 * Salva il nickname di una persona. Vuoto vuol dire "torno al mio nome": non
 * e' un errore, e' una scelta.
 *
 * Non si controlla che sia libero, di proposito: due persone possono
 * chiamarsi uguale come nella vita, ed e' il numero Achivia a dire chi e'
 * chi. Un nickname unico per tutta la piattaforma sarebbe una gara a chi
 * arriva primo, non un modo di presentarsi.
 */
export function salvaNickname(persona, valore) {
  if (!persona) return null;
  const errore = erroreNickname(valore);
  if (errore) return { errore };
  const pulito = String(valore ?? '').trim();
  updateUser(persona.id, { nickname: pulito || null });
  return { nickname: pulito || null };
}

/** Il nome che si legge grande: il nickname se c'e', altrimenti quello vero. */
export const nomeVisibile = (persona) => persona?.nickname?.trim() || persona?.name || '';

/** Il numero Achivia come si scrive: con il cancelletto davanti. */
export const codiceVisibile = (persona) => (persona?.achiviaId ? `#${persona.achiviaId}` : '');

/**
 * Come si chiama una persona quando il suo nome vero non si puo' mostrare.
 *
 * Succede nelle organizzazioni personalizzate: una famiglia, una squadra,
 * una classe se le crea chiunque in trenta secondi, e chi ci entra con un
 * codice non ha firmato niente con nessuno. Nome e cognome veri in un
 * gruppo di sconosciuti sono un dato che nessuno ha chiesto di dare. In
 * azienda e' diverso — li' il rapporto c'e', e sapere chi c'e' dall'altra
 * parte serve a lavorare.
 *
 * Resta il nickname, e per chi non se n'e' dato uno resta il numero: e'
 * l'unica cosa che identifica un account senza ambiguita', e per dire di
 * chi si sta parlando basta e avanza.
 */
export const nomePubblico = (persona) =>
  persona?.nickname?.trim() || codiceVisibile(persona) || 'Membro';
