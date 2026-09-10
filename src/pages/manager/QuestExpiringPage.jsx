import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import { XpPill, CreditsPill } from '../../components/ui/Pills';
import { useAuth } from '../../context/AuthContext';
import { getExpiringQuestsByManager, getAssigneeLabel, subscribe, xpDiQuest } from '../../data/db';
import BackTile from '../../components/ui/BackTile';

const FILTERS = [
  { id: 'tutte',      label: 'Tutte' },
  { id: 'scadute',    label: 'Scadute' },
  { id: 'in_scadenza', label: 'In scadenza' },
];

export default function QuestExpiringPage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  const [filter, setFilter] = useState('tutte');
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  const quests = getExpiringQuestsByManager(user.id).filter((q) => {
    if (filter === 'scadute') return q.status === 'scaduta';
    if (filter === 'in_scadenza') return q.status !== 'scaduta';
    return true;
  });

  return (
    <>
      <PageShell title="Quest in scadenza" description="Quest che scadono entro 48 ore e quest gia’ scadute." />
      <div className="ui-corpo-pagina">
        {/* Era una riga di pillole tutta sua, con nomi di classe che non
            usava nessun'altra schermata: e' la stessa cosa che fa `Chips`
            dappertutto. */}
        <Chips items={FILTERS} value={filter} onChange={setFilter} ariaLabel="Filtro" />

        {quests.length === 0 ? (
          <div className="empty-state">Nessuna quest in scadenza.</div>
        ) : (
          <div className="ui-colonna">
            {quests.map((q) => (
              <div key={q.id} className="px-panel">
                <b>{q.title}</b>
                <div className="px-date">{q.deadline ? new Date(q.deadline).toLocaleString('it-IT') : '—'}</div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', margin: 'var(--space-3) 0' }}>
                  <span className={`badge ${q.status === 'scaduta' ? 'badge-danger' : 'badge-warning'}`}>
                    {q.status === 'scaduta' ? 'Scaduta' : 'In scadenza'}
                  </span>
                  <XpPill value={xpDiQuest(q)} />
                  <CreditsPill value={q.credits || 0} />
                  <span className="badge badge-neutral">{getAssigneeLabel(q)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BackTile />
    </>
  );
}
