import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { useAuth } from '../../context/AuthContext';
import { getProjectsByManager, subscribe } from '../../data/db';
import BackTile from '../../components/ui/BackTile';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  const projects = getProjectsByManager(user.id);
  const active = projects.filter((p) => p.status !== 'chiuso');
  const closed = projects.filter((p) => p.status === 'chiuso');

  return (
    <>
      <PageShell title="Projects" description="Team temporanei per assegnare quest di gruppo." />
      <div className="ui-corpo-pagina">
        <Link to="/manager/management/projects/new" className="px-btn block" style={{ marginBottom: 'var(--space-5)' }}>
          Nuovo progetto
        </Link>

        <h2 style={{ margin: '0 0 var(--space-3)' }}>Progetti attivi</h2>
        {active.length === 0 ? (
          <div className="empty-state">Nessun progetto attivo.</div>
        ) : (
          <div className="ui-colonna">
            {active.map((p) => (
              <Link key={p.id} to={`/manager/management/projects/${p.id}`} className="card-row">
                <span><b>{p.name}</b><br /><small style={{ color: 'var(--text-muted)' }}>{p.endDate || 'senza scadenza'}</small></span>
                <span className="badge badge-primary">{(p.memberIds || []).length} membri</span>
              </Link>
            ))}
          </div>
        )}

        {closed.length > 0 && (
          <>
            <h2 style={{ margin: 'var(--space-5) 0 var(--space-3)' }}>Progetti chiusi</h2>
            <div className="ui-colonna">
              {closed.map((p) => (
                <Link key={p.id} to={`/manager/management/projects/${p.id}`} className="card-row">
                  <span>{p.name}</span>
                  <small>{p.startDate} → {p.endDate}</small>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <BackTile />
    </>
  );
}
