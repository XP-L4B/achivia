import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { useAuth } from '../../context/AuthContext';
import { addProject, getEmployeesOfManager } from '../../data/db';
import BackTile from '../../components/ui/BackTile';

export default function ProjectNewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  const candidates = getEmployeesOfManager(user.id).filter((e) => {
    if (members.includes(e.id)) return false;
    if (!search.trim()) return true;
    return e.name.toLowerCase().includes(search.trim().toLowerCase());
  });

  function create() {
    if (!name.trim()) { setError('Il nome del progetto e’ obbligatorio.'); return; }
    addProject({ name: name.trim(), description: description.trim(), startDate, endDate, managerId: user.id, memberIds: members });
    navigate('/manager/management/projects');
  }

  return (
    <>
      <PageShell title="Nuovo progetto" description="Crea un team temporaneo e assegnagli dei dipendenti." />
      <div className="px-filters" style={{ padding: '0 var(--space-6) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <input type="text" placeholder="Nome progetto" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} />
        <textarea rows={3} placeholder="Descrizione" value={description} onChange={(e) => setDescription(e.target.value)} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', lineHeight: 1.6 }} />
        <label className="label">Data inizio</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label className="label">Data fine</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <label className="label">Aggiungi dipendenti</label>
        <input type="text" placeholder="Cerca per nome" value={search} onChange={(e) => setSearch(e.target.value)} />

        {members.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {members.map((id) => {
              const m = getEmployeesOfManager(user.id).find((e) => e.id === id);
              return (
                <button key={id} type="button" className="cancel-pill" onClick={() => setMembers(members.filter((x) => x !== id))}>
                  {m?.name} ×
                </button>
              );
            })}
          </div>
        )}

        <div className="ui-colonna fitta">
          {candidates.map((e) => (
            <button key={e.id} type="button" className="card-row" style={{ cursor: 'pointer', textAlign: 'left' }} onClick={() => setMembers([...members, e.id])}>
              <span>{e.name}</span>
              <small style={{ color: 'var(--text-muted)' }}>{e.department} · Lv {e.level}</small>
            </button>
          ))}
        </div>

        {error && <p className="ui-errore" role="alert">{error}</p>}
        <button type="button" className="px-btn block" onClick={create}>Crea progetto</button>
      </div>
      <BackTile />
    </>
  );
}
