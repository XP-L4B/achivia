/**
 * L'hash spaziale: le collisioni non si fanno tutti contro tutti.
 *
 * Il mondo e' diviso in celle quadrate; ogni passo si svuota la griglia e ci
 * si rimettono i nemici vivi. Chi vuole sapere che cosa c'e' vicino a un
 * punto guarda la sua cella e quelle intorno — con quattrocento nemici
 * sono qualche decina di confronti invece di ottantamila.
 *
 * Nessuna allocazione nel ciclo: le celle sono array riusati e si azzerano
 * con `length = 0`; la ricerca riempie un buffer passato da chi chiama
 * invece di chiamare una funzione per ogni vicino — una chiusura creata
 * dentro un ciclo da quattrocento giri e' quattrocento oggetti per passo,
 * e sono quelli che fanno scattare il garbage collector.
 */
export function creaGriglia(larghezza, altezza, cella = 32) {
  const colonne = Math.ceil(larghezza / cella);
  const righe = Math.ceil(altezza / cella);
  const celle = new Array(colonne * righe);
  for (let i = 0; i < celle.length; i += 1) celle[i] = [];

  const indice = (x, y) => {
    const cx = Math.min(colonne - 1, Math.max(0, (x / cella) | 0));
    const cy = Math.min(righe - 1, Math.max(0, (y / cella) | 0));
    return cy * colonne + cx;
  };

  return {
    cella,
    svuota() {
      for (let i = 0; i < celle.length; i += 1) celle[i].length = 0;
    },
    metti(id, x, y) {
      celle[indice(x, y)].push(id);
    },
    /**
     * Scrive in `dest` gli id delle cose nelle celle che toccano il
     * quadrato di lato 2r intorno a (x, y), e torna quanti ne ha scritti.
     * Si ferma quando `dest` e' pieno: chi chiama decide quanti vicini
     * gli servono davvero. Poi controlla lui la distanza vera.
     */
    raccogli(x, y, r, dest) {
      const cx0 = Math.max(0, ((x - r) / cella) | 0);
      const cy0 = Math.max(0, ((y - r) / cella) | 0);
      const cx1 = Math.min(colonne - 1, ((x + r) / cella) | 0);
      const cy1 = Math.min(righe - 1, ((y + r) / cella) | 0);
      const max = dest.length;
      let n = 0;
      for (let cy = cy0; cy <= cy1; cy += 1) {
        for (let cx = cx0; cx <= cx1; cx += 1) {
          const c = celle[cy * colonne + cx];
          for (let i = 0; i < c.length; i += 1) {
            if (n >= max) return n;
            dest[n] = c[i]; n += 1;
          }
        }
      }
      return n;
    },
  };
}
