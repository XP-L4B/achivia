/**
 * Quando un pezzo dell'app non c'e' piu'.
 *
 * Le pagine dei giochi non stanno nel file principale: si caricano quando
 * qualcuno le apre, e il loro nome porta l'impronta del contenuto —
 * `LexoraPage-B1HCDvlO.js`. A ogni pubblicazione l'impronta cambia e la
 * vecchia sparisce da GitHub Pages, che tiene solo l'ultima versione.
 *
 * Da qui il guaio che si vede solo dal vivo: chi ha l'app aperta mentre
 * pubblichiamo sta ancora eseguendo il codice di prima. Quando poi tocca
 * «Achivia Survival», il browser chiede un file che sul server non esiste
 * piu', l'import fallisce e la schermata diventa l'errore secco del
 * router. Non e' un difetto del gioco: e' il gioco di ieri che chiede il
 * suo pezzo a oggi.
 *
 * La cura e' una sola e vale per tutti i giochi: accorgersene e ricaricare
 * la pagina, che e' l'unico modo di andare a prendere l'elenco nuovo dei
 * pezzi. Con due cautele — una sola volta di fila, se no un guasto vero
 * diventa un ciclo infinito; e con un parametro mai visto in coda, se no
 * la cache dell'index.html ci restituisce la stessa pagina di prima.
 *
 * La rete che sta nell'`index.html` copre il caso gemello — l'app che non
 * parte proprio — e usa la stessa chiave: le due non si pestano i piedi,
 * perche' o si e' arrivati o non si e' arrivati.
 */

const CHIAVE = 'achivia:ricarica';

/* Ogni browser lo dice a modo suo, e nessuno espone un codice. Restano le
   parole, che pero' sono stabili: sono nei messaggi di Chrome, Firefox e
   Safari da anni. */
const SEGNI = [
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
  'unable to preload css',
];

/** Questo errore e' un pezzo che non c'e' piu', o e' un errore vero? */
export function eUnPezzoMancante(errore) {
  const testo = String(errore?.message || errore || '').toLowerCase();
  return SEGNI.some((s) => testo.includes(s));
}

/**
 * Ricarica per andare a prendere la versione nuova. Torna `false` se ha
 * gia' provato poco fa: allora il problema e' un altro e va mostrato.
 */
export function riprendiIPezzi() {
  try {
    const ultima = Number(sessionStorage.getItem(CHIAVE)) || 0;
    // Mezzo minuto: un ciclo si richiude in un istante, mentre fra una
    // pubblicazione e l'altra passano ore. La finestra separa i due casi
    // senza chiedere niente a nessuno.
    if (Date.now() - ultima < 30000) return false;
    sessionStorage.setItem(CHIAVE, String(Date.now()));
  } catch {
    // Niente sessionStorage (navigazione privata di qualche browser): si
    // ricarica lo stesso, ma senza memoria non si puo' garantire la volta
    // sola, e allora meglio non ricaricare affatto.
    return false;
  }
  // Il parametro si riscrive, non si accoda: dopo tre ricariche non
  // vogliamo tre `v=` in fila nell'indirizzo.
  const l = window.location;
  const q = new URLSearchParams(l.search);
  q.set('v', String(Date.now()));
  l.replace(`${l.pathname}?${q.toString()}${l.hash}`);
  return true;
}

/**
 * Mette in ascolto la finestra. Va chiamata una volta sola, all'avvio.
 *
 * `vite:preloadError` e' il modo pulito: lo lancia il caricatore dei pezzi
 * prima ancora che l'errore arrivi a React. Le altre due sono per i casi
 * che gli sfuggono — un import fallito fuori da una pagina, una promessa
 * che nessuno raccoglie.
 */
export function sorvegliaIPezzi() {
  window.addEventListener('vite:preloadError', (e) => {
    if (riprendiIPezzi()) e.preventDefault();
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (eUnPezzoMancante(e.reason)) riprendiIPezzi();
  });
  window.addEventListener('error', (e) => {
    if (eUnPezzoMancante(e.error || e.message)) riprendiIPezzi();
  });
}
