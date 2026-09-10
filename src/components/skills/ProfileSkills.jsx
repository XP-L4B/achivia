import { Link } from 'react-router-dom';
import SkillBadge from './SkillBadge';
import { skillTreeOf, riepilogoSkill } from '../../data/skills';
import TerminalPanel from '../terminal/TerminalPanel';

/**
 * La fascia "Le mie competenze" nel profilo: le medaglie gia' ottenute e
 * quante ne restano. E' il gancio fra la home e lo Skill Tree — il profilo
 * dice a che punto sei, la mappa spiega come si va avanti.
 */
export default function ProfileSkills({ persona, to }) {
  const { nodi } = skillTreeOf(persona);
  const riepilogo = riepilogoSkill(persona);
  const certificate = nodi.filter((n) => n.stato === 'certified').slice(0, 6);

  // Il conteggio che stava sotto le medaglie e' la riga di stato del
  // pannello: e' esattamente quello che il piede di un terminale dice.
  return (
    <TerminalPanel
      titolo="COMPETENZE"
      meta={<Link to={to} className="profile-skills-link">Skill Tree</Link>}
      piede={`CERTIFICATE: ${riepilogo.certificate} · DA SVILUPPARE: ${riepilogo.daSviluppare}`}
      className="profile-skills"
    >
      {certificate.length === 0 ? (
        <p className="tv-vuoto">
          Nessuna competenza certificata: il tuo Skill Tree sta appena iniziando.
        </p>
      ) : (
        <div className="profile-skills-badges">
          {certificate.map((n) => (
            <SkillBadge key={n.skill.id} skill={n.skill} stato="certified" livello={n.livello} size={40} title={n.skill.name} />
          ))}
          {riepilogo.certificate > certificate.length && (
            <Link to={to} className="skill-more">+{riepilogo.certificate - certificate.length}</Link>
          )}
        </div>
      )}
    </TerminalPanel>
  );
}
