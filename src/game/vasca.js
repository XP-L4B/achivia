/**
 * La vasca: una lista di oggetti creati all'inizio, riempiti e svuotati
 * senza mai allocare. Nascere e' riempire il primo posto libero (`n`),
 * morire e' segnare un campo e lasciare che `compatta` sposti in fondo,
 * a fine passo, chi e' segnato. Cosi' gli indici restano validi mentre si
 * lavora, e la memoria non cresce.
 *
 * La usano la partita (nemici, proiettili, gemme, effetti), le casse e
 * gli impatti: un posto solo per la regola.
 */

export function vasca(n, fabbrica) {
  const lista = new Array(n);
  for (let i = 0; i < n; i += 1) lista[i] = fabbrica();
  return { lista, n: 0 };
}

export function compatta(v, campo) {
  let scrivi = 0;
  for (let leggi = 0; leggi < v.n; leggi += 1) {
    const e = v.lista[leggi];
    if (!e[campo]) {
      if (scrivi !== leggi) { v.lista[leggi] = v.lista[scrivi]; v.lista[scrivi] = e; }
      scrivi += 1;
    } else {
      e[campo] = false;
    }
  }
  v.n = scrivi;
}
