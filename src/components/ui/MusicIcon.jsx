/**
 * La doppia nota a pixel, accesa e barrata.
 *
 * Due teste unite dalla stanghetta, come il simbolo che si usa da sempre per
 * dire "musica". Disegnata con rettangoli come il calendario di Time &
 * Attendance: alla misura in cui si usa — dentro una pillola, accanto a una
 * manopola — una curva diventa una scala di pixel sfocati, mentre un
 * rettangolo resta un rettangolo.
 *
 * La testa di destra sta un po' piu' in alto dell'altra: con le due teste
 * alla stessa altezza il disegno diventa una parentesi quadra con due piedi,
 * e la musica non si vede piu'.
 *
 * Le due icone sono la stessa nota: spenta, si attenua e sopra ci passa una
 * sbarra. Cosi' si vede che e' la stessa cosa in due stati, e non due
 * disegni diversi.
 */
export default function MusicIcon({ spenta = false, size = 18, className = '', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {/* La stanghetta, i due gambi, le due teste. */}
      <g opacity={spenta ? 0.75 : 1}>
        <rect x="5" y="1.5" width="9.5" height="2.8" fill="currentColor" />
        <rect x="5" y="1.5" width="1.6" height="9" fill="currentColor" />
        <rect x="12.9" y="1.5" width="1.6" height="7" fill="currentColor" />
        <rect x="1" y="9.5" width="5.6" height="4.2" fill="currentColor" />
        <rect x="8.9" y="7.5" width="5.6" height="4.2" fill="currentColor" />
      </g>
      {spenta && (
        <line
          x1="2"
          y1="14"
          x2="14"
          y2="2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="square"
        />
      )}
    </svg>
  );
}
