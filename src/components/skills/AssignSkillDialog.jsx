import { useMemo, useState } from 'react';
import SkillBadge from './SkillBadge';
import { SKILL_LEVELS } from '../../data/skillsCatalog';
import { getSkills, statoSkill, prerequisitiMancanti } from '../../data/skills';
import { certifySkill } from '../../data/db';
import useFinestra from '../../hooks/useFinestra';

const oggi = () => new Date().toISOString().slice(0, 10);

/**
 * Certificare una competenza a qualcuno.
 *
 * La motivazione e' obbligatoria: un badge senza il perche' e' un regalo, e
 * questa feature esiste perche' non lo sia. Il livello si sceglie sempre:
 * ogni competenza ne ha quattro, e certificare vuol dire dire a che punto
 * e' arrivata la persona.
 */
export default function AssignSkillDialog({ user, persone, personaIniziale, onFatto, onChiudi }) {
  const finestra = useFinestra(true, onChiudi);
  const [personaId, setPersonaId] = useState(personaIniziale?.id || persone[0]?.id || '');
  const [skillId, setSkillId] = useState('');
  const [livello, setLivello] = useState(2);
  const [motivazione, setMotivazione] = useState('');
  const [quando, setQuando] = useState(oggi);
  const [errore, setErrore] = useState('');

  const skills = useMemo(() => getSkills(user.orgId), [user.orgId]);
  const skill = skills.find((s) => s.id === skillId) || null;
  const persona = persone.find((p) => p.id === personaId) || null;

  // Da dove si arriva di solito a questa competenza: un'informazione, non
  // un vincolo. Il manager certifica quello che vede, non quello che il
  // percorso gli concede.
  const mancanti = skill && persona ? prerequisitiMancanti(user.orgId, skill, persona.id) : [];
  const gia = skill && persona ? statoSkill(skill, persona.id) === 'certified' : false;

  function conferma() {
    if (!personaId || !skillId) { setErrore('Scegli la persona e la competenza.'); return; }
    if (!motivazione.trim()) { setErrore('La motivazione è obbligatoria: è quello che rende il badge una certificazione.'); return; }

    certifySkill({
      employeeId: personaId,
      skillId,
      level: Number(livello),
      reason: motivazione.trim(),
      certifiedBy: user.id,
      certifiedAt: new Date(quando).toISOString(),
    });
    onFatto?.({ persona, skill });
  }

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true">
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog" onClick={(e) => e.stopPropagation()}>
        <b>Certifica una competenza</b>
        <p className="ui-dialog-hint" style={{ marginTop: 'var(--space-2)' }}>
          Il badge arriva nello Skill Tree della persona, con la tua motivazione.
        </p>

        <label className="label">Persona
          <select value={personaId} onChange={(e) => setPersonaId(e.target.value)}>
            {persone.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.role === 'manager' ? ' (manager)' : ''}</option>
            ))}
          </select>
        </label>

        <label className="label">Competenza
          <select value={skillId} onChange={(e) => { setSkillId(e.target.value); setErrore(''); }}>
            <option value="">Scegli…</option>
            <optgroup label="Soft skill">
              {skills.filter((s) => s.type === 'soft').map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="Competenze tecniche">
              {skills.filter((s) => s.type === 'technical').map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
          </select>
        </label>

        {skill && (
          <div className="skill-assign-preview">
            <SkillBadge skill={skill} stato="certified" livello={SKILL_LEVELS.find((l) => l.id === Number(livello))} size={56} />
            <p>{skill.description}</p>
          </div>
        )}

        {/* Ogni competenza ha quattro livelli: si certifica sempre a che
            punto e' arrivata la persona, non solo che c'e' arrivata. */}
        <label className="label">Livello
          <select value={livello} onChange={(e) => setLivello(e.target.value)}>
            {SKILL_LEVELS.map((l) => (
              <option key={l.id} value={l.id}>{l.id}. {l.label} — {l.descrizione}</option>
            ))}
          </select>
        </label>

        <label className="label">Motivazione
          <textarea
            rows={3}
            value={motivazione}
            onChange={(e) => { setMotivazione(e.target.value); setErrore(''); }}
            placeholder="Cosa ha fatto per meritarla"
            className="ui-campo-pixel"
          />
        </label>

        <label className="label">Data
          <input type="date" value={quando} max={oggi()} onChange={(e) => setQuando(e.target.value)} />
        </label>

        {gia && (
          <p className="ui-dialog-hint">
            {persona?.name} ha già questa competenza: confermando ne aggiorni livello e
            motivazione — è così che si sale di grado.
          </p>
        )}
        {mancanti.length > 0 && (
          <p className="ui-dialog-hint">
            Nel percorso questa competenza viene di solito dopo {mancanti.map((s) => s.name).join(', ')},
            ma non è un vincolo: se la merita, certificala.
          </p>
        )}
        {errore && <p className="ui-errore" role="alert">{errore}</p>}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <button type="button" className="confirm-pill" onClick={conferma}>Certifica</button>
          <button type="button" className="cancel-pill" onClick={onChiudi}>Annulla</button>
        </div>
      </div>
    </div>
  );
}
