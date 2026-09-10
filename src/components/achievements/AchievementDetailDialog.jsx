import AchievementBadge from './AchievementBadge';
import AchievementProgress from './AchievementProgress';
import TerminalPanel from '../terminal/TerminalPanel';
import { TIPO_MANUALE } from '../../data/achievementsCatalog';
import { getUserById } from '../../data/db';
import useFinestra from '../../hooks/useFinestra';

const data = (v) => (v ? new Date(v).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

/**
 * La scheda di un achievement per una persona: dove sta adesso e tutte le
 * volte in cui l'ha preso, dalla piu' recente.
 *
 * Lo storico non e' un dettaglio: e' il punto di questi achievement. La
 * quarta volta non cancella la terza, e ogni riga porta la sua data, la sua
 * ricompensa e — quando l'assegnazione e' manuale — chi l'ha data e perche'.
 */
export default function AchievementDetailDialog({ progresso, onChiudi }) {
  const finestra = useFinestra(Boolean(progresso), onChiudi);
  if (!progresso) return null;
  const { definizione, istanze, volte } = progresso;
  const manuale = definizione.tipo === TIPO_MANUALE;

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" onClick={onChiudi}>
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog is-larga" onClick={(e) => e.stopPropagation()}>
        <div className="ui-dialog-head">
          <AchievementBadge definizione={definizione} ottenuto={volte > 0} size={64} />
          <div>
            <b>{definizione.nome}</b>
            {/* Due forme diverse: un traguardo che si ripete ogni volta che lo
                si raggiunge, e una scala che si sale una volta sola nei
                quattro metalli. La riga lo dice, invece di dare per scontato
                il primo caso. */}
            <p className="ui-dialog-cat">
              {manuale ? 'Assegnato da un manager' : 'Automatico'}
              {' · '}{definizione.livelli ? 'quattro livelli' : 'ripetibile'}
              {' · '}obiettivo {definizione.livelli ? definizione.livelli.join(' / ') : progresso.target} {definizione.unita}
            </p>
          </div>
        </div>

        <p className="ui-dialog-desc">{definizione.descrizione}</p>
        <AchievementProgress progresso={progresso} manuale={manuale} />

        <TerminalPanel
          titolo="STORICO"
          livello={3}
          meta={volte > 0 ? `${volte} ${volte === 1 ? 'volta' : 'volte'}` : ''}
          style={{ marginTop: 'var(--space-4)' }}
        >
        {istanze.length === 0 ? (
          <p className="tv-vuoto">Nessuno sblocco per ora.</p>
        ) : (
          <ol className="ach-storico">
            {istanze.map((i) => {
              const da = i.assegnatoDaId ? getUserById(i.assegnatoDaId) : null;
              return (
                <li key={i.id}>
                  <div className="ach-storico-testa">
                    <b>{progresso.livelli && i.livello ? progresso.livelli[i.livello - 1] : `#${i.ciclo}`}</b>
                    <span>{data(i.ottenutoIl)}</span>
                  </div>
                  <small>
                    {i.progresso}/{i.target} · {i.fonte === 'manual' ? 'assegnato' : 'automatico'}
                    {i.crediti > 0 ? ` · +${i.crediti} crediti` : ' · nessuna ricompensa'}
                    {i.pregressa && ' · da storico precedente'}
                  </small>
                  {da && <small>Assegnato da {da.name}</small>}
                  {i.motivo && <p className="ach-motivo">“{i.motivo}”</p>}
                </li>
              );
            })}
          </ol>
        )}
        </TerminalPanel>

        <button type="button" className="px-btn block" style={{ marginTop: 'var(--space-4)' }} onClick={onChiudi}>
          Chiudi
        </button>
      </div>
    </div>
  );
}
