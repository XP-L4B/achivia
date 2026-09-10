/**
 * Il calendario a pixel dell'app.
 *
 * Disegnato con rettangoli invece che con curve: alla misura piccola in cui
 * si usa — dentro una pillola, dentro un riquadro — una linea curva diventa
 * una scala di pixel sfocati, mentre un rettangolo resta un rettangolo.
 *
 * Nato nel selettore di periodo delle analytics, sta anche sul riquadro di
 * Time & Attendance: sono due modi di dire la stessa cosa — dei giorni su un
 * calendario — e due disegni diversi lo avrebbero nascosto.
 */
export default function CalendarIcon({ size = 15, className = '', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <rect x="1" y="3" width="14" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="3" width="14" height="3.5" fill="currentColor" />
      <rect x="4" y="1" width="1.5" height="3" fill="currentColor" />
      <rect x="10.5" y="1" width="1.5" height="3" fill="currentColor" />
      <rect x="3.5" y="8.5" width="2" height="2" fill="currentColor" />
      <rect x="7" y="8.5" width="2" height="2" fill="currentColor" />
      <rect x="10.5" y="8.5" width="2" height="2" fill="currentColor" />
      <rect x="3.5" y="11.5" width="2" height="2" fill="currentColor" />
      <rect x="7" y="11.5" width="2" height="2" fill="currentColor" />
    </svg>
  );
}
