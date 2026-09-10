/**
 * L'icona di Lexora: una tessera con una lettera sopra.
 *
 * Disegnata con rettangoli come il calendario di Time & Attendance e per
 * la stessa ragione: alla misura in cui si usa — dentro un riquadro, in
 * una scheda — una curva diventa una scala di pixel sfocati, mentre un
 * rettangolo resta un rettangolo.
 *
 * Il soggetto e' la tessera, non il libro o il dizionario: quello che si
 * tocca giocando sono le lettere sul campo, e una tessera con la L dice
 * "gioco di parole" senza dire "scuola". Sotto, tre caselle piu' piccole:
 * il campo che continua.
 */
export default function LexoraIcon({ size = 15, className = '', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {/* la tessera */}
      <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* la L dentro la tessera */}
      <rect x="4" y="3.5" width="1.5" height="4" fill="currentColor" />
      <rect x="4" y="6" width="4" height="1.5" fill="currentColor" />
      {/* il valore della lettera, in basso a destra della tessera */}
      <rect x="8.5" y="8.5" width="1" height="1" fill="currentColor" />
      {/* le tessere che continuano: il campo */}
      <rect x="12.5" y="4" width="3" height="3" fill="currentColor" opacity="0.55" />
      <rect x="12.5" y="8.5" width="3" height="3" fill="currentColor" opacity="0.8" />
      <rect x="8" y="12.5" width="3" height="3" fill="currentColor" opacity="0.8" />
      <rect x="3.5" y="12.5" width="3" height="3" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
