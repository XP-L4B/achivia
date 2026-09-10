import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { LevelPill } from '../../components/ui/Pills';
import { useAuth } from '../../context/AuthContext';
import { getUsersByOrg } from '../../data/db';
import BackTile from '../../components/ui/BackTile';

const ROLE_META = {
  admin:    { label: 'Admin',    cls: 'badge-warning' },
  manager:  { label: 'Manager',  cls: 'badge-primary' },
  employee: { label: 'Dipendente', cls: 'badge-neutral' },
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const users = getUsersByOrg(user.orgId).filter((u) => {
    if (!q) return true;
    return [u.name, u.email, u.department, ROLE_META[u.role]?.label]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  return (
    <>
      <PageShell
        title="Gestione Utenti"
        description="Utenti registrati dell'organizzazione."
      />
      <div style={{ padding: '0 var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <input
          type="search"
          aria-label="Cerca utenti"
          placeholder="Cerca per nome, email, ruolo o dipartimento…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {users.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nessun utente trovato.</p>
        ) : (
          users.map((u) => {
            const meta = ROLE_META[u.role] || { label: u.role, cls: 'badge-neutral' };
            return (
              <Link key={u.id} to={`/admin/users/${u.id}`} className="card-row">
                <div>
                  <div className="px-name" style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {u.email}{u.department ? ` · ${u.department}` : ''}
                  </div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <LevelPill level={u.level} />
                  <span className={`badge ${meta.cls}`}>{meta.label}</span>
                </span>
              </Link>
            );
          })
        )}
      </div>
      <BackTile />
    </>
  );
}
