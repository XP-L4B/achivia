import { useState } from 'react';
import SkillBadge from './SkillBadge';
import { SKILL_CATEGORIES, SKILL_LEVELS, TECHNICAL_SUGGESTIONS } from '../../data/skillsCatalog';
import { BADGE_FAMIGLIE } from '../../data/skillBadges';
import { addSkill, updateSkill } from '../../data/db';
import useFinestra from '../../hooks/useFinestra';

/**
 * Creazione e modifica di una competenza dell'organizzazione.
 *
 * Le soft skill standard non passano di qui: sono il vocabolario comune di
 * Achivia e nessuno le riscrive. Si puo' pero' creare una soft skill
 * *dell'organizzazione*, e il modulo lo dice chiaramente, perche' la
 * differenza fra le due cose non si veda solo nel codice.
 */
export default function CreateSkillDialog({ user, skill, onFatto, onChiudi }) {
  const finestra = useFinestra(true, onChiudi);
  const modifica = Boolean(skill);
  const [nome, setNome] = useState(skill?.name || '');
  const [descrizione, setDescrizione] = useState(skill?.description || '');
  const [categoria, setCategoria] = useState(skill?.categoria || 'tecnica');
  const [tipo, setTipo] = useState(skill?.type || 'technical');
  const [badge, setBadge] = useState(skill?.badgeImage || '');
  const [errore, setErrore] = useState('');

  const anteprima = { id: skill?.id || 'nuova', name: nome || '?', categoria, badgeImage: badge || null };
  const famiglia = BADGE_FAMIGLIE.find((f) => f.id === badge) || null;

  function salva() {
    if (!nome.trim()) { setErrore('Il nome è obbligatorio.'); return; }
    if (!descrizione.trim()) { setErrore('Serve una descrizione: senza, nessuno sa cosa certifica quel badge.'); return; }

    const dati = {
      name: nome.trim(),
      description: descrizione.trim(),
      categoria,
      type: tipo,
      badgeImage: badge || null,
    };
    const salvata = modifica
      ? updateSkill(skill.id, dati)
      : addSkill({ ...dati, orgId: user.orgId, createdById: user.id });
    onFatto?.(salvata);
  }

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true">
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog" onClick={(e) => e.stopPropagation()}>
        <b>{modifica ? 'Modifica competenza' : 'Nuova competenza'}</b>

        <div className="skill-assign-preview">
          <SkillBadge skill={anteprima} stato="certified" size={56} />
          <p>Così apparirà la competenza nello Skill Tree.</p>
        </div>

        <label className="label">Nome
          <input value={nome} onChange={(e) => { setNome(e.target.value); setErrore(''); }} placeholder="Es. SQL" list="skill-suggerimenti" />
          <datalist id="skill-suggerimenti">
            {TECHNICAL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </label>

        <label className="label">Descrizione
          <textarea
            rows={2}
            value={descrizione}
            onChange={(e) => { setDescrizione(e.target.value); setErrore(''); }}
            placeholder="Che cosa sa fare chi ha questa competenza"
            className="ui-campo-pixel"
          />
        </label>

        <fieldset className="skill-fieldset">
          <legend>Tipo</legend>
          <label className="skill-radio">
            <input type="radio" name="tipo" checked={tipo === 'technical'} onChange={() => setTipo('technical')} />
            Competenza tecnica
          </label>
          <label className="skill-radio">
            <input type="radio" name="tipo" checked={tipo === 'soft'} onChange={() => setTipo('soft')} />
            Soft skill
          </label>
          {tipo === 'soft' && (
            <p className="ui-dialog-hint">
              Sarà una soft skill della tua organizzazione, non una standard Achivia:
              quelle sono uguali per tutti e non si creano da qui.
            </p>
          )}
        </fieldset>

        <label className="label">Categoria
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {SKILL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label} — {c.descrizione}</option>)}
          </select>
        </label>

        <p className="ui-dialog-hint">
          La competenza avrà i quattro livelli standard, da Beginner a Expert:
          certificarla vuol dire dire a che punto è arrivata la persona.
        </p>

        <fieldset className="skill-fieldset">
          <legend>Medaglia</legend>
          <p className="ui-dialog-hint">
            Scegli il disegno: i quattro metalli arrivano da soli, uno per livello.
            Chi certifica sceglie il grado, non l'immagine.
          </p>

          {famiglia ? (
            <div className="badge-metalli">
              {SKILL_LEVELS.map((l) => (
                <figure key={l.id}>
                  <img src={famiglia.livelli[l.id]} alt="" aria-hidden="true" />
                  <figcaption>{l.label}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="ui-dialog-hint">
              Nessuna medaglia scelta: resta il segnaposto con l'iniziale.
            </p>
          )}

          <div className="badge-griglia" role="radiogroup" aria-label="Medaglia della competenza">
            <button
              type="button"
              role="radio"
              aria-checked={badge === ''}
              className={`badge-scelta is-vuota${badge === '' ? ' is-on' : ''}`}
              onClick={() => setBadge('')}
            >
              Nessuna
            </button>
            {BADGE_FAMIGLIE.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={badge === f.id}
                aria-label={`Medaglia ${f.id}`}
                className={`badge-scelta${badge === f.id ? ' is-on' : ''}`}
                onClick={() => setBadge(f.id)}
              >
                <img src={f.livelli[1]} alt="" aria-hidden="true" loading="lazy" />
              </button>
            ))}
          </div>
        </fieldset>

        {errore && <p className="ui-errore" role="alert">{errore}</p>}

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <button type="button" className="confirm-pill" onClick={salva}>{modifica ? 'Salva' : 'Crea'}</button>
          <button type="button" className="cancel-pill" onClick={onChiudi}>Annulla</button>
        </div>
      </div>
    </div>
  );
}
