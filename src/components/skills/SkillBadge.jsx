import { badgeFor } from '../../data/skillBadges';
import { categoriaById } from '../../data/skillsCatalog';
import riflesso from '../motion/riflesso';

/**
 * La medaglia di una competenza. E' il pezzo che si vede di piu', quindi
 * fa una cosa sola e la fa in due stati:
 *
 *   certified — piena, con il livello raggiunto sul bordo
 *   available — attenuata: si puo' ottenere, non e' ancora arrivata
 *   revoked   — spenta: c'era, e non c'e' piu' (si vede nello storico)
 *
 * Sulla medaglia certificata passa ogni tanto un riflesso di luce, lo stesso
 * degli achievement e della Presence Streak: un movimento solo, per tutte le
 * medaglie dell'app.
 *
 * Finche' le medaglie vere non sono in `src/assets/skills/`, disegna un
 * segnaposto: esagono nel colore della categoria con l'iniziale. Non e' una
 * finta medaglia, e si vede che e' un segnaposto.
 */
export default function SkillBadge({
  skill,
  stato = 'available',
  livello = null,
  size = 72,
  onClick,
  title,
}) {
  const img = badgeFor(skill, { stato, livello: livello?.id ?? null });
  const colore = categoriaById(skill?.categoria)?.colore ?? '#6a52ad';

  const corpo = (
    <span
      className={`skill-badge is-${stato}${img && stato === 'certified' ? ' mo-medaglia' : ''}`}
      style={{ width: size, height: size, ...riflesso(img, skill?.id, stato === 'certified') }}
    >
      {img ? (
        <img src={img} alt="" aria-hidden="true" />
      ) : (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <polygon
            points="50,4 91,27 91,73 50,96 9,73 9,27"
            fill={stato === 'certified' ? colore : 'transparent'}
            stroke={colore}
            strokeWidth="6"
          />
          <text
            x="50" y="50"
            textAnchor="middle" dominantBaseline="central"
            fill={stato === 'certified' ? '#0b1016' : colore}
            style={{ fontSize: 38, fontWeight: 700 }}
          >
            {(skill?.name || '?').trim().charAt(0).toUpperCase()}
          </text>
        </svg>
      )}


      {stato === 'certified' && livello && (
        <span className="skill-badge-level">{livello.id}</span>
      )}
    </span>
  );

  if (!onClick) return corpo;

  return (
    <button
      type="button"
      className="skill-badge-btn"
      onClick={onClick}
      title={title}
      aria-label={title || skill?.name}
    >
      {corpo}
    </button>
  );
}
