import { Link } from 'react-router-dom';

/**
 * Riquadro con icona grande e etichetta sotto: è il pulsante ricorrente dei
 * mockup (Create org, Active quests, Projects, Go back…).
 *
 * Con `to` diventa un link, con `onClick` un pulsante.
 * `count` mostra il pallino rosso col numero in alto a destra.
 */
export default function Tile({ icon, label, to, onClick, count, alt = '', className = '' }) {
  const content = (
    <>
      {count > 0 && <span className="ui-tile-count">{count}</span>}
      {typeof icon === 'string' ? <img src={icon} alt={alt} /> : icon}
      {/* Alcune immagini portano gia' la scritta dentro: in quel caso
          l'etichetta sotto sarebbe un doppione. Quando invece la scrive
          l'app, la scrive col carattere dell'insegna dello Shop — che quel
          nome ce l'ha dipinto dentro. */}
      {label && <span className="ui-tile-label">{label}</span>}
    </>
  );

  const cls = `ui-tile ${className}`.trim();
  if (to) return <Link to={to} className={cls}>{content}</Link>;
  return <button type="button" className={cls} onClick={onClick}>{content}</button>;
}
