/**
 * Gli umori: l'unico posto del gioco in cui vive un'emoji.
 *
 * Dopo ogni risposta il dipendente reagisce, e la reazione si legge da tre
 * cose insieme: la faccina sopra la testa, come si muove il corpo, e
 * quanto ci mette ad andarsene. Il pacchetto dei disegni da' una sola
 * animazione per personaggio — l'attesa, quattro fotogrammi — quindi il
 * resto lo fa il codice: un saltello, un tremolio, un abbassarsi, un
 * voltarsi e uscire di corsa.
 *
 * `moto` e' il nome del movimento, non il movimento: chi disegna la scena
 * decide come si fa un `tremolio`. `uscita` sono i secondi che restano in
 * stanza dopo la risposta — chi e' furioso se ne va subito, chi e'
 * rassegnato ci mette un attimo di troppo, e si vede.
 *
 * L'umore non dipende solo dall'ultima risposta: un dipendente gia'
 * rifiutato due volte reagisce peggio a parita' di decisione. Quella
 * regola sta nel motore; qui c'e' solo il vocabolario.
 *
 * ATTENZIONE: `controlla-emoji.mjs` autorizza le emoji in questo file e
 * in nessun altro del modulo. Aggiungerne una qui e' una scelta di
 * gioco; aggiungerne una altrove fa fallire il controllo.
 */

export const UMORI = [
  { id: 'soddisfatto', emoji: '😄', nome: 'Soddisfatto', moto: 'saltello', uscita: 0.6 },
  { id: 'trionfante', emoji: '😎', nome: 'Trionfante', moto: 'saltello-lento', uscita: 1.2 },
  { id: 'sollevato', emoji: '😌', nome: 'Sollevato', moto: 'respiro', uscita: 0.8 },
  { id: 'deluso', emoji: '😞', nome: 'Deluso', moto: 'abbassa', uscita: 1.0 },
  { id: 'umiliato', emoji: '😳', nome: 'Umiliato', moto: 'volta-subito', uscita: 0.4 },
  { id: 'furioso', emoji: '😠', nome: 'Furioso', moto: 'tremolio', uscita: 0.4 },
  { id: 'rassegnato', emoji: '😐', nome: 'Rassegnato', moto: 'attesa-lenta', uscita: 1.4 },
  { id: 'comprensivo', emoji: '🙂', nome: 'Falsamente comprensivo', moto: 'attesa', uscita: 1.6 },
  { id: 'pretenzioso', emoji: '🤨', nome: 'Pretenzioso', moto: 'avanza', uscita: 1.0 },
  { id: 'offeso', emoji: '😤', nome: 'Offeso', moto: 'volta-subito', uscita: 0.6 },
  { id: 'impaziente', emoji: '⏳', nome: 'In attesa di risposta', moto: 'attesa', uscita: 0.8 },
  { id: 'ignorato', emoji: '😶', nome: 'Ignorato', moto: 'abbassa', uscita: 1.2 },
];

export const umoreById = (id) => UMORI.find((u) => u.id === id) || UMORI[0];

/** L'umore dell'azienda, quello che si vede in alto: cinque gradini sul morale. */
export const CLIMA = [
  { fino: 20, id: 'furioso' },
  { fino: 40, id: 'offeso' },
  { fino: 60, id: 'rassegnato' },
  { fino: 80, id: 'sollevato' },
  { fino: 100, id: 'soddisfatto' },
];

export function climaDi(morale) {
  for (const c of CLIMA) if (morale <= c.fino) return umoreById(c.id);
  return umoreById('soddisfatto');
}
