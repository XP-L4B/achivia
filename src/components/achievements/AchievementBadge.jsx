import { badgeAchievement } from '../../data/achievementBadges';
import riflesso from '../motion/riflesso';

/**
 * La medaglia di un achievement.
 *
 * Qui non si disegna nessuna medaglia: si prende il file, se c'e'. Quando
 * manca resta un segnaposto tecnico — un tondo con le iniziali — che si vede
 * essere un segnaposto e non finge di essere una medaglia.
 *
 *   ottenuto  piena, col numero di volte se sono piu' di una
 *   da fare   spenta: si puo' prendere, non e' ancora arrivata
 *
 * Una medaglia vera e un segnaposto non si spengono allo stesso modo: il
 * segnaposto sbiadisce, la medaglia perde colore e luce ma resta
 * riconoscibile — si deve vedere che cosa si sta per conquistare.
 *
 * Sulla medaglia conquistata passa ogni tanto un riflesso di luce, come su
 * un metallo lucidato: ce lo mette il sistema del movimento, che si prende
 * il file stesso come maschera. Su quella da conquistare no — e' spenta, e
 * una medaglia spenta non riflette.
 */
export default function AchievementBadge({ definizione, ottenuto = false, volte = 0, size = 64 }) {
  const img = badgeAchievement(definizione, { ottenuto });
  const iniziali = (definizione?.nome || '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

  return (
    <span
      className={`ach-badge${img ? ' is-immagine' : ''}${ottenuto ? ' is-ottenuto' : ''}${img && ottenuto ? ' mo-medaglia' : ''}${definizione?.mascheraSmeraldo ? ' is-smeraldo' : ''}`}
      style={{ width: size, height: size, ...riflesso(img, definizione?.id, ottenuto) }}
    >
      {img
        ? <img src={img} alt="" aria-hidden="true" />
        : <span className="ach-badge-segnaposto" aria-hidden="true">{iniziali}</span>}
      {volte > 1 && <span className="ach-badge-volte">×{volte}</span>}
    </span>
  );
}
