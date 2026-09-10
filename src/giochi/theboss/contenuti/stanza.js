/**
 * La stanza: dove sta ogni cosa, in pixel di mondo.
 *
 * L'ufficio e' fisso e si vede sempre tutto: non c'e' una telecamera da
 * seguire, non c'e' niente fuori campo. Per questo la stanza e' un elenco
 * di ritagli e non un motore di mappe — otto righe di dati contro
 * duecento di codice, e il risultato sullo schermo e' lo stesso.
 *
 * Ogni voce dice: da quale foglio, quale cella (di sedici pixel), quanto
 * e' grande in celle, e dove va messa. I fogli sono quelli di LimeZu
 * ridotti a sedici pixel; le celle le ho scelte guardando i fogli, e le
 * coordinate sono quelle e non cambiano da sole.
 *
 * Il mondo e' 224 x 144. Non e' una misura a caso: sta in quattordici
 * celle per nove, si ingrandisce di un numero intero su qualunque schermo
 * (x3 sul telefono, x4 o x5 sul monitor) e la pixel art resta netta.
 */

export const MONDO = { w: 224, h: 144 };

/** Il muro in fondo: tre righe, due di parete e una di zoccolo. */
export const MURO = { foglio: 'scena.muri', alto: [8, 3], basso: [8, 4], righe: 3 };

/** Il pavimento, ripetuto ovunque. */
export const PAVIMENTO = { foglio: 'scena.pavimenti', cella: [0, 0] };

/** Quello che sta appoggiato o appeso, dal fondo verso davanti. */
export const ARREDI = [
  { foglio: 'scena.scaffali', cella: [8, 7], celle: [2, 3], x: 8, y: 16, nome: 'scaffale delle pozioni' },
  { foglio: 'scena.scaffali', cella: [10, 7], celle: [2, 3], x: 40, y: 16, nome: 'scaffale degli sciroppi' },
  { foglio: 'scena.scaffali', cella: [1, 7], celle: [2, 2], x: 168, y: 16, nome: 'la lavagna dei numeri' },
  { foglio: 'scena.scaffali', cella: [6, 7], celle: [1, 1], x: 150, y: 32, nome: 'il mappamondo' },
  { foglio: 'scena.scaffali', cella: [0, 0], celle: [2, 2], x: 88, y: 104, nome: 'la scrivania' },
  { foglio: 'scena.scaffali', cella: [2, 0], celle: [2, 2], x: 120, y: 104, nome: 'la scrivania, seconda meta\'' },
];

/**
 * Dove sta il capo, e dove si ferma chi entra.
 *
 * `guarda` e' il verso in cui e' girato il cavaliere. I fogli lo disegnano
 * rivolto a destra, ma chi entra si ferma alla sua sinistra: un capo che
 * ascolta dando le spalle e' una scena sbagliata, e si nota subito anche
 * senza saperla spiegare. Non si ribaltano i fogli — si ribalta il
 * disegno, che e' reversibile e non tocca gli originali comprati.
 */
export const POSTI = {
  capo: { x: 96, y: 72, guarda: 'sinistra' },        // il cavaliere, riquadro da 40
  visitatore: { x: 48, y: 76 },  // chi ha bussato, riquadro da 16
  porta: { x: 8, y: 76 },        // da dove entra e dove esce
};

/** Quanto e' lontano il visitatore quando entra, e quanto ci mette ad arrivare. */
export const INGRESSO = { secondi: 0.55, uscita: 0.45 };
