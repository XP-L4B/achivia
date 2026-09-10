/**
 * Le bandiere delle lingue, a pixel.
 *
 * Erano emoji, e le emoji sono un carattere: le disegna il sistema
 * operativo, quindi la stessa schermata mostrava cinque bandiere tonde su
 * un telefono, cinque rettangoli piatti su un altro, e su Windows nemmeno
 * quelle. Qui invece sono disegno nostro, uguale ovunque, e sono a pixel
 * come il resto dell'applicazione — il calendario di Time & Attendance,
 * l'occhio, le medaglie.
 *
 * Ogni bandiera e' una griglia di dodici per nove: una lettera per casella
 * e una tavolozza per bandiera. E' il modo piu' corto per scrivere una
 * Union Jack senza diagonali vere, ed e' anche il modo in cui si legge
 * meglio quello che si sta disegnando.
 */

const PALETTE = {
  it: { G: '#008C45', W: '#F4F5F0', R: '#CD212A' },
  en: { B: '#012169', W: '#F4F5F0', R: '#C8102E' },
  fr: { B: '#002395', W: '#F4F5F0', R: '#ED2939' },
  es: { R: '#AA151B', Y: '#F1BF00' },
  de: { K: '#111111', R: '#DD0000', Y: '#FFCE00' },
};

/* Dodici colonne, nove righe. Una lettera per casella. */
const GRIGLIE = {
  it: [
    'GGGGWWWWRRRR', 'GGGGWWWWRRRR', 'GGGGWWWWRRRR',
    'GGGGWWWWRRRR', 'GGGGWWWWRRRR', 'GGGGWWWWRRRR',
    'GGGGWWWWRRRR', 'GGGGWWWWRRRR', 'GGGGWWWWRRRR',
  ],
  fr: [
    'BBBBWWWWRRRR', 'BBBBWWWWRRRR', 'BBBBWWWWRRRR',
    'BBBBWWWWRRRR', 'BBBBWWWWRRRR', 'BBBBWWWWRRRR',
    'BBBBWWWWRRRR', 'BBBBWWWWRRRR', 'BBBBWWWWRRRR',
  ],
  es: [
    'RRRRRRRRRRRR', 'RRRRRRRRRRRR',
    'YYYYYYYYYYYY', 'YYYYYYYYYYYY', 'YYYYYYYYYYYY', 'YYYYYYYYYYYY', 'YYYYYYYYYYYY',
    'RRRRRRRRRRRR', 'RRRRRRRRRRRR',
  ],
  de: [
    'KKKKKKKKKKKK', 'KKKKKKKKKKKK', 'KKKKKKKKKKKK',
    'RRRRRRRRRRRR', 'RRRRRRRRRRRR', 'RRRRRRRRRRRR',
    'YYYYYYYYYYYY', 'YYYYYYYYYYYY', 'YYYYYYYYYYYY',
  ],
  /* La Union Jack senza diagonali vere: la X bianca fatta a scaletta e la
     croce rossa bordata di bianco. A questa misura le diagonali rosse si
     perderebbero comunque, e toglierle e' quello che la tiene leggibile. */
  en: [
    'WBBBWRRWBBBW',
    'BWWBWRRWBWWB',
    'BBBWWRRWWBBB',
    'WWWWWWWWWWWW',
    'RRRRRRRRRRRR',
    'WWWWWWWWWWWW',
    'BBBWWRRWWBBB',
    'BWWBWRRWBWWB',
    'WBBBWRRWBBBW',
  ],
};

const NOMI = { it: 'Italia', en: 'Regno Unito', fr: 'Francia', es: 'Spagna', de: 'Germania' };

export default function Bandiera({ lingua, size = 18, className = '', titolo }) {
  const griglia = GRIGLIE[lingua];
  if (!griglia) return null;
  const palette = PALETTE[lingua];
  const colonne = griglia[0].length;
  const righe = griglia.length;

  /* Le caselle uguali e vicine si uniscono in un rettangolo solo: una
     bandiera a bande passa da centootto rettangoli a tre. */
  const rettangoli = [];
  griglia.forEach((riga, y) => {
    let x = 0;
    while (x < colonne) {
      const c = riga[x];
      let fine = x;
      while (fine + 1 < colonne && riga[fine + 1] === c) fine += 1;
      rettangoli.push(<rect key={`${x}-${y}`} x={x} y={y} width={fine - x + 1} height={1} fill={palette[c]} />);
      x = fine + 1;
    }
  });

  return (
    <svg
      width={size}
      height={Math.round((size * righe) / colonne)}
      viewBox={`0 0 ${colonne} ${righe}`}
      className={`lex-bandiera ${className}`.trim()}
      role={titolo ? 'img' : undefined}
      aria-hidden={titolo ? undefined : 'true'}
      aria-label={titolo ? `Bandiera: ${NOMI[lingua] ?? lingua}` : undefined}
      shapeRendering="crispEdges"
    >
      {rettangoli}
      <rect x="0" y="0" width={colonne} height={righe} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="0.5" />
    </svg>
  );
}
