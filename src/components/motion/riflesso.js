/**
 * Il riflesso di luce sulle medaglie.
 *
 * Le medaglie sono file gia' disegnati: qui non se ne tocca nessuno. Quello
 * che serve al foglio di stile per farci passare sopra una striscia di luce
 * sono tre cose, e le prepara questa funzione:
 *
 *   --mo-medaglia         il file stesso, che fa da maschera: la luce tocca
 *                         solo i pixel della medaglia, non il vuoto attorno
 *   --mo-ciclo-riflesso   ogni quanto torna il riflesso (fra 10 e 15 secondi)
 *   --mo-ritardo          da che punto del ciclo parte questa medaglia
 *
 * Ciclo e ritardo vengono da un'impronta della chiave — l'identificativo
 * della medaglia — e non dal caso: cosi' due medaglie diverse non lampeggiano
 * mai insieme, ma la stessa medaglia si comporta sempre allo stesso modo, e
 * un ridisegno della pagina non la fa ripartire da capo.
 */

/** Numero stabile ricavato da una stringa (hash di Java, senza segno). */
function impronta(testo) {
  let n = 0;
  for (let i = 0; i < testo.length; i += 1) {
    n = (n * 31 + testo.charCodeAt(i)) | 0;
  }
  return Math.abs(n);
}

/**
 * Le variabili da mettere nello `style` della medaglia, oppure `undefined`
 * se la medaglia non c'e' o non e' stata conquistata: una medaglia spenta
 * non riflette la luce.
 */
export default function riflesso(immagine, chiave, attivo = true) {
  if (!immagine || !attivo) return undefined;
  const n = impronta(String(chiave ?? immagine));
  return {
    '--mo-medaglia': `url("${immagine}")`,
    // 10.0 → 15.0 secondi, a passi di un decimo.
    '--mo-ciclo-riflesso': `${(100 + (n % 51)) / 10}s`,
    // Fino a dodici secondi di ritardo: le medaglie di una stessa pagina si
    // accendono una alla volta, mai in coro.
    '--mo-ritardo': `${((n >> 5) % 121) / 10}s`,
  };
}
