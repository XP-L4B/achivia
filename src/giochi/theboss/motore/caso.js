/**
 * Il caso, con un seme. Copia deliberata di quello dell'arena.
 *
 * Sarebbe bastato importare `src/game/caso.js`, e sarebbe stato sbagliato:
 * The Boss e' un modulo isolato, e un gioco che importa un pezzo di un
 * altro gioco lega il destino dei due — chi domani tocca il caso
 * dell'arena non deve rompere questo. Trenta righe duplicate costano meno
 * di quella dipendenza.
 *
 * Mulberry32. Quello che serve qui e' che una partita nata da un seme si
 * rigiochi identica: serve a riprodurre un difetto, serve al simulatore
 * che gioca diecimila partite, e servira' a un server che debba
 * ricontrollare un punteggio rigiocando la partita.
 */
export function creaCaso(seme) {
  let a = (seme >>> 0) || 0x9e3779b9;
  /* Quanti numeri sono stati chiesti: serve a salvare una partita a meta'
     e riaprirla trovando lo stesso futuro — si rifa' il caso dal seme e
     gli si chiedono `passi` numeri a vuoto. Contare non cambia niente. */
  let passi = 0;
  const prossimo = () => {
    passi += 1;
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    numero: prossimo,
    passi: () => passi,
    /** Un numero in [a, b). */
    fra: (a1, b1) => a1 + prossimo() * (b1 - a1),
    /** Un intero in [0, n). */
    intero: (n) => Math.floor(prossimo() * n),
    /** Un elemento a caso di un elenco. */
    scelta: (elenco) => elenco[Math.floor(prossimo() * elenco.length)],
    /** Vero con probabilita' `p`. */
    forse: (p) => prossimo() < p,
    /** `n` elementi diversi a caso, senza toccare l'elenco di partenza. */
    mano: (elenco, n) => {
      const copia = elenco.slice();
      for (let i = copia.length - 1; i > 0; i -= 1) {
        const j = Math.floor(prossimo() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
      }
      return copia.slice(0, n);
    },
  };
}
