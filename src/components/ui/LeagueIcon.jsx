import AchiviaLogo from './AchiviaLogo';

/**
 * L'icona di Achivia's League: il marchio dell'app con una coppa appoggiata
 * all'angolo.
 *
 * Il logo dice di che cosa si parla — e' la lega di Achivia, non una
 * classifica interna all'organizzazione — e la coppa dice che li' dentro si
 * compete. Da sola la coppa sarebbe un trofeo qualunque, e da solo il logo
 * un pulsante che riporta a casa.
 *
 * La coppa e' disegnata a rettangoli come le altre icone dell'app: alla
 * misura in cui si vede — venti pixel scarsi nell'angolo di un riquadro —
 * una curva diventa una scaletta sfocata.
 */
export default function LeagueIcon({ size = 56, className = '' }) {
  const coppa = Math.round(size * 0.42);

  return (
    <span className={`league-icona${className ? ` ${className}` : ''}`} style={{ width: size, height: size }}>
      <AchiviaLogo size={size} />
      <svg
        className="league-coppa"
        width={coppa}
        height={coppa}
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        {/* Il fondo scuro stacca la coppa dal marchio, che e' colorato. */}
        <rect x="0" y="0" width="16" height="16" rx="4" fill="#0d1016" />
        <rect x="4" y="2.5" width="8" height="5" fill="#ffc233" />
        <rect x="5" y="7.5" width="6" height="1.5" fill="#ffc233" />
        <rect x="2.5" y="3" width="1.5" height="2.5" fill="#ffc233" />
        <rect x="12" y="3" width="1.5" height="2.5" fill="#ffc233" />
        <rect x="7.25" y="9" width="1.5" height="2" fill="#e0a52b" />
        <rect x="5" y="11" width="6" height="1.8" fill="#ffc233" />
      </svg>
    </span>
  );
}
