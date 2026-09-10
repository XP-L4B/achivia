import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import { XpPill, CreditsPill } from '../../components/ui/Pills';
import { useAuth } from '../../context/AuthContext';
import { getActiveQuestsByManager, getAssigneeLabel, updateQuest, subscribe, xpDiQuest } from '../../data/db';
import BackTile from '../../components/ui/BackTile';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function QuestActivePage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  const [filter, setFilter] = useState('');
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  const quests = getActiveQuestsByManager(user.id)
    .filter((q) => !filter || q.type === filter);

  const [daChiudere, setDaChiudere] = useState(null);

  function chiudi() {
    updateQuest(daChiudere.id, { status: 'scaduta' });
    setDaChiudere(null);
    setVersion((v) => v + 1);
  }

  return (
    <>
      <PageShell title="Quest attive" description="Le quest in corso che hai assegnato." />
      <div className="ui-corpo-pagina">
        <div className="px-filters tv-modulo" style={{ marginBottom: 'var(--space-4)' }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tutte le tipologie</option>
            <option value="principale">Principale</option>
            <option value="side">Side Quest</option>
            <option value="istanza">Istanza</option>
          </select>
        </div>

        {quests.length === 0 ? (
          <div className="empty-state">Nessuna quest attiva.</div>
        ) : (
          <div className="ui-colonna">
            {quests.map((q) => (
              <div key={q.id} className="px-panel">
                <b>{q.title}</b>
                {q.description && <p style={{ fontSize: '0.6rem', margin: 'var(--space-2) 0', lineHeight: 1.7 }}>{q.description}</p>}
                <div className="px-date">{q.deadline ? new Date(q.deadline).toLocaleString('it-IT') : 'Senza scadenza'}</div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', margin: 'var(--space-3) 0' }}>
                  <XpPill value={xpDiQuest(q)} />
                  <CreditsPill value={q.credits || 0} />
                  <span className="badge badge-neutral">{getAssigneeLabel(q)}</span>
                </div>
                <button type="button" className="px-btn ghost" onClick={() => setDaChiudere(q)}>Chiudi in anticipo</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {daChiudere && (
        <ConfirmDialog
          titolo={`Chiudere "${daChiudere.title}"?`}
          testo="La quest risulterà scaduta senza completamento: chi ce l’aveva non riceve la ricompensa e la sua serie di consegne puntuali si interrompe."
          conferma="Chiudi la quest"
          onConferma={chiudi}
          onChiudi={() => setDaChiudere(null)}
        />
      )}
      <BackTile />
    </>
  );
}
