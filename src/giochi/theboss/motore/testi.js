/**
 * Quale testo esce, per questa richiesta.
 *
 * Il motore sa che sta per arrivare un `AUMENTO_MERITATO` di secondo
 * livello da parte di chi sta al magazzino; la banca sa venti modi di
 * dirlo. Questo file sceglie quale, e lo sceglie **col caso della
 * partita**: stesso seme, stessi testi, che e' la condizione perche' una
 * partita si possa rigiocare.
 *
 * Tre regole, in ordine di importanza:
 *
 *  1. **Mai due volte lo stesso testo nella stessa partita.** E' la prima
 *     cosa che un giocatore nota, e la nota subito.
 *  2. **Si preferisce il livello giusto.** Una richiesta di quarto livello
 *     ha un tono diverso da una di primo: se c'e' un testo scritto per
 *     quel livello si usa quello. Se non c'e', si allarga invece di
 *     lasciare la richiesta muta.
 *  3. **Non si resta mai senza.** Se la banca non ha niente per quell'
 *     archetipo — perche' e' nuovo, o perche' i testi sono finiti — si
 *     pesca dalle voci di riserva, che sono scritte apposta per stare bene
 *     in bocca a chiunque.
 */

const RISERVA = 'riserva-';

/**
 * Sceglie il testo di una richiesta. `usati` e' l'insieme degli id gia'
 * usati in questa partita, e viene aggiornato.
 */
export function scegliTesto(banca, richiesta, caso, usati) {
  if (!banca) return null;
  const perArch = banca.perArchetipo.get(richiesta.archetipo) || [];
  const liberi = perArch.filter((v) => !usati.has(v.id));

  /* 2. prima quelli scritti per questo livello */
  const alLivello = liberi.filter((v) => v.liv === richiesta.livello);
  const vicini = liberi.filter((v) => Math.abs(v.liv - richiesta.livello) <= 1);
  const gruppo = alLivello.length ? alLivello : (vicini.length ? vicini : liberi);

  if (gruppo.length) {
    const scelto = gruppo[caso.intero(gruppo.length)];
    usati.add(scelto.id);
    return scelto;
  }

  /* 3. la rete: le voci di riserva, e se anche quelle sono finite si
     riusa la meno recente invece di lasciare la richiesta senza parole */
  const riserve = banca.tutte.filter((v) => v.id.startsWith(RISERVA) && !usati.has(v.id));
  if (riserve.length) {
    const scelto = riserve[caso.intero(riserve.length)];
    usati.add(scelto.id);
    return scelto;
  }
  return perArch.length ? perArch[caso.intero(perArch.length)] : null;
}
