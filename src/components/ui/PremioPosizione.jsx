import { badgePerNome } from '../../data/skillBadges';

/**
 * La medaglia di una posizione in classifica.
 *
 * Le prime tre sono podio: la medaglia del parametro nel suo metallo — oro,
 * argento, bronzo. Sono le stesse medaglie che l'app usa dappertutto, quindi
 * si riconoscono senza doverle spiegare.
 *
 * Dalla quarta in giu' la medaglia resta la stessa ma in metallo neutro, e
 * ci va attorno un anello inciso con il numero della fascia: TOP 25, TOP 50,
 * TOP 100, TOP 500. E' la soluzione che dice a chiare lettere in che gruppo
 * si e' — un colore da solo bisognerebbe impararlo a memoria — e che tiene
 * il podio visibilmente diverso da tutto il resto: chi e' sul podio la
 * medaglia ce l'ha nuda, senza anello.
 */

const METALLO_NEUTRO = 2;   // l'argento: il piu' spento dei quattro

export default function PremioPosizione({ famiglia, premio, size = 56 }) {
  if (!premio) return null;
  const podio = premio.tipo === 'podio';
  const img = badgePerNome(`${famiglia}-${podio ? premio.metallo : METALLO_NEUTRO}`);
  const etichetta = podio
    ? `${premio.posizione}° posto`
    : `${premio.fascia.nome}, ${premio.posizione}° posto`;

  if (podio) {
    return (
      <span className="premio is-podio" style={{ width: size, height: size }} role="img" aria-label={etichetta}>
        {img && <img src={img} alt="" aria-hidden="true" />}
        <span className="premio-posto">{premio.posizione}°</span>
      </span>
    );
  }

  const numero = String(premio.fascia.fino);
  return (
    <span className="premio is-fascia" style={{ width: size, height: size }} role="img" aria-label={etichetta}>
      {img && <img src={img} alt="" aria-hidden="true" />}
      {/* L'anello: un cerchio inciso, aperto in basso dove sta il numero. */}
      <svg className="premio-anello" viewBox="0 0 64 64" aria-hidden="true">
        <circle
          cx="32" cy="32" r="29"
          fill="none"
          stroke={premio.fascia.colore}
          strokeWidth="4"
          strokeDasharray="140 42"
          strokeDashoffset="-25"
          strokeLinecap="round"
        />
        <rect x="18" y="52" width="28" height="13" rx="6" fill={premio.fascia.colore} />
        <text
          x="32" y="62"
          textAnchor="middle"
          fill="#0d1016"
          style={{ font: "700 10px 'Micro 5', 'Press Start 2P', monospace", letterSpacing: '0.5px' }}
        >
          {numero}
        </text>
      </svg>
    </span>
  );
}
