import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Tile from '../../components/ui/Tile';
import { useAuth } from '../../context/AuthContext';
import { getTeamsByOrg, getUserById } from '../../data/db';
import makeNewIcon from '../../assets/ui/makeNew.png';
import BackTile from '../../components/ui/BackTile';

export default function TeamsPage() {
  const { user } = useAuth();
  const [cerca, setCerca] = useState('');

  const teams = getTeamsByOrg(user.orgId).filter((t) =>
    t.name.toLowerCase().includes(cerca.trim().toLowerCase()));

  return (
    <>
      <PageShell
        title="Team"
        description="Crea e gestisci i team dell'organizzazione. I team servono ad assegnare quest di gruppo e a filtrare le persone per reparto."
      />

      <div className="ui-corpo-stretto">
        <input
          type="text"
          placeholder="Cerca un team"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
          aria-label="Cerca un team"
        />
      </div>

      <div style={{ paddingBottom: 16 }}>
        {teams.length === 0 ? (
          <div className="empty-state ui-blocco">
            {cerca ? 'Nessun team con questo nome.' : 'Non ci sono ancora team.'}
          </div>
        ) : (
          teams.map((t) => (
            <Link key={t.id} to={`/manager/management/teams/${t.id}`} className="ui-member">
              <div>
                <p className="ui-member-name">{t.name}</p>
                <p className="ui-member-role">
                  {t.memberIds.length} {t.memberIds.length === 1 ? 'membro' : 'membri'}
                  {t.createdById && ` · creato da ${getUserById(t.createdById)?.name ?? '—'}`}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="ui-tiles one">
        <Tile to="/manager/management/teams/new" icon={makeNewIcon} label="Nuovo team" />
      </div>
      <BackTile />
    </>
  );
}
