import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { XpPill, CreditsPill } from '../../components/ui/Pills';
import { useAuth } from '../../context/AuthContext';
import { getTemplatesByManager, deleteQuest, subscribe, xpDiQuest } from '../../data/db';
import BackTile from '../../components/ui/BackTile';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function QuestSavedPage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  const [daCancellare, setDaCancellare] = useState(null);

  const templates = getTemplatesByManager(user.id);

  function cancella() {
    deleteQuest(daCancellare.id);
    setDaCancellare(null);
    setVersion((v) => v + 1);
  }

  return (
    <>
      <PageShell title="Quest salvate" description="Modelli riutilizzabili, non ancora assegnati." />
      <div className="ui-corpo-pagina">
        {templates.length === 0 ? (
          <div className="empty-state">Nessun modello salvato.</div>
        ) : (
          <div className="ui-colonna">
            {templates.map((q) => (
              <div key={q.id} className="px-panel">
                <b>{q.title}</b>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', margin: 'var(--space-3) 0' }}>
                  <XpPill value={xpDiQuest(q)} />
                  <CreditsPill value={q.credits || 0} />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Link to={`/manager/management/quests/new?template=${q.id}`} className="px-btn" style={{ width: 'auto' }}>Usa template</Link>
                  <button type="button" className="cancel-pill" onClick={() => setDaCancellare(q)}>Cancella</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {daCancellare && (
        <ConfirmDialog
          titolo={`Cancellare "${daCancellare.title}"?`}
          testo="Il modello sparisce dall’elenco. Le quest già create da questo modello restano dove sono."
          conferma="Cancella"
          distruttiva
          onConferma={cancella}
          onChiudi={() => setDaCancellare(null)}
        />
      )}
      <BackTile />
    </>
  );
}
