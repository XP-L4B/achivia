/**
 * Il caso, con un seme.
 *
 * `Math.random` non si usa nel motore: una partita nata da un seme si puo'
 * rigiocare uguale, e questo rende possibile sia riprodurre un difetto sia
 * — il giorno in cui ci sara' un server — ricontrollare un punteggio.
 *
 * Mulberry32: piccolo, veloce, abbastanza buono per un gioco.
 */
export function creaCaso(seme) {
  let a = (seme >>> 0) || 0x9e3779b9;
  /* Quanti numeri sono stati chiesti. Non serve a chi gioca: serve a
     salvare una partita a meta' e riaprirla trovando lo stesso futuro —
     si rifa' il caso dal seme e gli si chiedono `passi` numeri a vuoto.
     Contare non cambia i numeri che escono. */
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
    /** Un numero in [0, 1). */
    numero: prossimo,
    /** Quanti numeri sono stati chiesti finora. */
    passi: () => passi,
    /** Un numero in [a, b). */
    fra: (a1, b1) => a1 + prossimo() * (b1 - a1),
    /** Un intero in [0, n). */
    intero: (n) => Math.floor(prossimo() * n),
    /** Un elemento a caso di un elenco. */
    scelta: (elenco) => elenco[Math.floor(prossimo() * elenco.length)],
    /** `n` elementi diversi a caso di un elenco. */
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

/** Un seme dal tempo: quando non ne arriva uno da fuori. */
export const semeDalTempo = () => (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
