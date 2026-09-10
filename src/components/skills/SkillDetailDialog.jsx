import SkillBadge from './SkillBadge';
import { categoriaById, SKILL_LEVELS } from '../../data/skillsCatalog';
import { getUserById } from '../../data/db';
import useFinestra from '../../hooks/useFinestra';

const data = (v) => (v ? new Date(v).toLocaleDateString('it-IT') : '—');

/**
 * La scheda che si apre cliccando una medaglia.
 *
 * La riga che conta e' la motivazione: senza, il badge resta un premio; con
 * quella scritta, diventa il racconto di cosa la persona ha fatto per
 * meritarlo. Per questo sta in evidenza e non fra i dettagli.
 */
export default function SkillDetailDialog({ nodo, onChiudi, azioni }) {
  const finestra = useFinestra(Boolean(nodo), onChiudi);
  if (!nodo) return null;
  const { skill, stato, certificazione, livello, vienePrima = [] } = nodo;
  const cat = categoriaById(skill.categoria);
  const da = certificazione?.certifiedBy ? getUserById(certificazione.certifiedBy) : null;
  const revocataDa = certificazione?.revokedBy ? getUserById(certificazione.revokedBy) : null;

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" onClick={onChiudi}>
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ui-dialog-head">
          <SkillBadge skill={skill} stato={stato} livello={livello} size={84} />
          <div>
            <b>{skill.name}</b>
            <p className="ui-dialog-cat">
              {cat?.label} · {skill.type === 'soft' ? 'Soft skill' : 'Competenza tecnica'}
              {skill.isStandard ? ' · standard Achivia' : ''}
            </p>
            <span className={`badge ${stato === 'certified' ? 'badge-success' : 'badge-primary'}`}>
              {stato === 'certified' ? 'Certificata' : 'Da sviluppare'}
            </span>
          </div>
        </div>

        <p className="ui-dialog-desc">{skill.description}</p>

        {/* I quattro livelli, sempre. Vedere la scala intera dice a colpo
            d'occhio a che punto si e' e quanta strada resta. */}
        <ol className="skill-levels" aria-label="Livelli della competenza">
          {SKILL_LEVELS.map((l) => {
            const raggiunto = livello ? l.id <= livello.id : false;
            const attuale = livello?.id === l.id;
            return (
              <li key={l.id} className={`skill-level${raggiunto ? ' is-done' : ''}${attuale ? ' is-current' : ''}`}>
                <span className="skill-level-n">{l.id}</span>
                <span className="skill-level-txt">
                  <b>{l.label}</b>
                  <small>{l.descrizione}</small>
                </span>
              </li>
            );
          })}
        </ol>

        {stato === 'certified' && certificazione && (
          <>
            {certificazione.reason ? (
              <blockquote className="skill-reason">
                <p>“{certificazione.reason}”</p>
                <cite>{da?.name || 'Manager'} · {data(certificazione.certifiedAt)}</cite>
              </blockquote>
            ) : (
              <p className="ui-dialog-hint">
                Nessuna motivazione scritta: la competenza è certificata, ma senza il
                racconto di cosa l&apos;ha meritata.
              </p>
            )}

            <dl className="info-list">
              {livello && <div className="info-row"><dt>Livello</dt><dd>{livello.label}</dd></div>}
              <div className="info-row"><dt>Certificata il</dt><dd>{data(certificazione.certifiedAt)}</dd></div>
              <div className="info-row"><dt>Da</dt><dd>{da?.name || '—'}</dd></div>
              {certificazione.status === 'revoked' && (
                <div className="info-row">
                  <dt>Revocata</dt>
                  <dd>{data(certificazione.revokedAt)} da {revocataDa?.name || '—'}</dd>
                </div>
              )}
            </dl>
          </>
        )}

        {stato === 'available' && (
          <p className="ui-dialog-hint">
            Competenza non ancora certificata. La riconosce un manager, non si prende da soli.
            {vienePrima.length > 0 && ` Nel percorso si arriva di solito da ${vienePrima.map((x) => x.name).join(', ')}, ma non è un passaggio obbligato.`}
          </p>
        )}

        {/* Quest, formazione e KPI collegati: il posto c'e' gia', si
            riempira' quando quelle parti verranno agganciate. */}
        {certificazione?.links?.questIds?.length > 0 && (
          <p className="ui-dialog-hint">Quest collegate: {certificazione.links.questIds.length}</p>
        )}

        {azioni && <div className="ui-dialog-actions">{azioni}</div>}

        <button type="button" className="px-btn block" style={{ marginTop: 'var(--space-4)' }} onClick={onChiudi}>
          Chiudi
        </button>
      </div>
    </div>
  );
}
