import AchievementBadge from './AchievementBadge';
import AchievementProgress from './AchievementProgress';
import { TIPO_MANUALE } from '../../data/achievementsCatalog';

/**
 * Un achievement in una riga: medaglia, nome, cosa chiede, a che punto e'.
 * La usano il profilo, la pagina del dipendente e la libreria del manager.
 */
export default function AchievementCard({ progresso, crediti = 0, onApri, extra }) {
  const { definizione, volte } = progresso;
  const manuale = definizione.tipo === TIPO_MANUALE;

  const corpo = (
    <>
      <AchievementBadge definizione={definizione} ottenuto={volte > 0} volte={volte} size={56} />
      <div className="ach-card-testo">
        <b>{definizione.nome}</b>
        <small>{definizione.descrizione}</small>
        <AchievementProgress progresso={progresso} manuale={manuale} />
        <div className="ach-tag-riga">
          <span className="badge badge-neutral">{manuale ? 'Manuale' : 'Automatico'}</span>
          <span className="badge badge-neutral">Ripetibile</span>
          {crediti > 0 && (
            <span className="tv-chip">
              {crediti}
              <span className="tv-chip-label">crediti</span>
            </span>
          )}
        </div>
        {extra}
      </div>
    </>
  );

  if (!onApri) return <article className="ach-card">{corpo}</article>;
  return (
    <button type="button" className="ach-card is-cliccabile" onClick={onApri}>
      {corpo}
    </button>
  );
}
