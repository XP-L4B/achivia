/**
 * La barra di avanzamento del terminale:
 *
 *   PROGRESS [███████████░░░░░░]  78%
 *
 * I blocchi non sono caratteri: sono una barra piena tagliata da una griglia
 * di fessure del colore del fondo (vedi `.tv-bar::after`). Cosi' il
 * riempimento resta continuo — quindi preciso a qualsiasi larghezza — ma si
 * legge come una fila di caselle.
 *
 * La percentuale scritta accanto non e' un doppione della barra: la barra
 * dice "quasi", il numero dice quanto. Chi usa un lettore di schermo sente
 * `etichetta`, che deve dire la stessa cosa a parole.
 */
export default function TerminalBar({
  percentuale,
  label,
  testo,
  etichetta,
  tono = '',
}) {
  const pct = Math.max(0, Math.min(100, Number(percentuale) || 0));
  const classi = `tv-bar${pct >= 100 ? ' is-piena' : ''}${tono ? ` is-${tono}` : ''}`;

  return (
    <div className="tv-progress">
      {label && <span className="tv-progress-label">{label}</span>}
      <span className="tv-bar-wrap" aria-hidden="true">
        <span className={classi}>
          <span style={{ width: `${pct}%` }} />
        </span>
      </span>
      <span className="tv-progress-pct" role="img" aria-label={etichetta || `${pct}%`}>
        {testo ?? `${pct}%`}
      </span>
    </div>
  );
}
