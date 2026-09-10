import { useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { XpPill, CreditsPill } from '../../components/ui/Pills';
import { getProjectById, getQuestsByProject, getUserById, xpDiQuest } from '../../data/db';
import BackTile from '../../components/ui/BackTile';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [showMembers, setShowMembers] = useState(false);
  const project = getProjectById(id);

  if (!project) return <PageShell title="Progetto" description="Progetto non trovato." />;

  const quests = getQuestsByProject(project.id);
  const members = (project.memberIds || []).map(getUserById).filter(Boolean);

  return (
    <>
      <PageShell title={project.name} description={project.endDate ? `Scadenza ${project.endDate}` : 'Senza scadenza'} />
      <div className="ui-corpo-pagina">
        {project.description && <p style={{ fontSize: '0.6rem', lineHeight: 1.8 }}>{project.description}</p>}

        <button type="button" className="px-btn ghost" style={{ margin: 'var(--space-4) 0' }} onClick={() => setShowMembers(!showMembers)}>
          Membri ({members.length})
        </button>
        {showMembers && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            {members.map((m) => (
              <div key={m.id} className="card-row"><span>{m.name}</span><small>{m.department}</small></div>
            ))}
          </div>
        )}

        <h2 style={{ margin: '0 0 var(--space-3)' }}>Quest del progetto</h2>
        {quests.length === 0 ? (
          <div className="empty-state">Nessuna quest assegnata al progetto.</div>
        ) : (
          <div className="ui-colonna">
            {quests.map((q) => (
              <div key={q.id} className="card-row">
                <span><b>{q.title}</b><br /><small style={{ color: 'var(--text-muted)' }}>{q.status}</small></span>
                <span style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <XpPill value={xpDiQuest(q)} />
                  <CreditsPill value={q.credits || 0} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <BackTile />
    </>
  );
}
