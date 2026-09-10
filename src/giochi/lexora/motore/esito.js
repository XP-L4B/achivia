/**
 * Il confronto fra un tentativo e la parola segreta: il cuore del gioco.
 *
 * Tre risposte per ogni lettera:
 *
 *   'verde'   c'e', ed e' al posto giusto
 *   'giallo'  c'e', ma da un'altra parte
 *   'grigio'  non c'e'
 *
 * Le lettere doppie sono l'unico punto in cui una regola scritta a occhio
 * sbaglia, e sbaglia in un modo che chi gioca nota subito. La segreta ha
 * una sola A e il tentativo ne ha due: una sola delle due puo' accendersi,
 * altrimenti il gioco direbbe «ce ne sono due» quando ce n'e' una, e chi
 * sta ragionando sugli indizi verrebbe portato fuori strada.
 *
 * Quindi si fanno due passate. Prima si assegnano tutti i verdi e si
 * scalano quelle lettere dal conto della segreta; solo dopo, con quello
 * che resta, si guardano i gialli. E' l'ordine che conta: un giallo
 * assegnato prima si mangerebbe la lettera che serviva a un verde piu'
 * avanti nella parola.
 */

export const VERDE = 'verde';
export const GIALLO = 'giallo';
export const GRIGIO = 'grigio';

/**
 * L'esito di un tentativo, lettera per lettera.
 *
 * `segreta` e `tentativo` sono elenchi di lettere gia' normalizzate e
 * della stessa lunghezza: il controllo che siano lunghe uguale lo fa chi
 * chiama, che e' l'unico a poter dire una cosa sensata a chi ha sbagliato
 * a scrivere.
 */
export function confronta(segreta, tentativo) {
  const n = tentativo.length;
  const fuori = new Array(n).fill(GRIGIO);
  const restano = new Map();

  // Prima passata: i verdi. Quello che avanza va nel conto per i gialli.
  for (let i = 0; i < n; i += 1) {
    if (tentativo[i] === segreta[i]) fuori[i] = VERDE;
    else restano.set(segreta[i], (restano.get(segreta[i]) || 0) + 1);
  }

  // Seconda passata: i gialli, finche' di quella lettera ne resta.
  for (let i = 0; i < n; i += 1) {
    if (fuori[i] === VERDE) continue;
    const q = restano.get(tentativo[i]) || 0;
    if (q > 0) {
      fuori[i] = GIALLO;
      restano.set(tentativo[i], q - 1);
    }
  }

  return fuori;
}

/** Se un esito dice che la parola e' stata indovinata. */
export const indovinata = (esito) => esito.length > 0 && esito.every((c) => c === VERDE);

/** Quante lettere verdi ha un esito: serve al punteggio di consolazione. */
export const quantiVerdi = (esito) => esito.filter((c) => c === VERDE).length;

/**
 * Quello che si sa delle lettere dopo una serie di tentativi: per ogni
 * lettera provata, il colore migliore che ha preso. La tastiera colorata
 * si disegna da qui, e il bot ci ragiona sopra.
 */
export function letterePiuChiare(righe) {
  const ordine = { [GRIGIO]: 0, [GIALLO]: 1, [VERDE]: 2 };
  const mappa = {};
  for (const riga of righe) {
    riga.lettere.forEach((l, i) => {
      const c = riga.esito[i];
      if (mappa[l] === undefined || ordine[c] > ordine[mappa[l]]) mappa[l] = c;
    });
  }
  return mappa;
}
