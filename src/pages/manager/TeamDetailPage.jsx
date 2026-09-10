import { useParams, Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import MemberRow from '../../components/ui/MemberRow';
import Tile from '../../components/ui/Tile';
import { getTeamById, getUserById } from '../../data/db';
import editIcon from '../../assets/ui/edit.png';
import BackTile from '../../components/ui/BackTile';

export default function TeamDetailPage() {
  const { id } = useParams();
  const team = getTeamById(id);

  if (!team) return <PageShell title="Team" description="Team non trovato." />;

  const membri = team.memberIds.map((uid) => getUserById(uid)).filter(Boolean);

  return (
    <>
      <PageShell title={team.name} />

      <section className="ui-panel ui-blocco con-stacco">
        <p className="ui-member-role" style={{ marginTop: 0 }}>
          Creato da {getUserById(team.createdById)?.name ?? '—'}
        </p>
        <p className="ui-ai-title" style={{ marginTop: 14, marginBottom: 0 }}>
          Membri: {membri.length}
        </p>
      </section>

      {membri.length === 0 ? (
        <div className="empty-state ui-blocco con-stacco">Il team non ha ancora membri.</div>
      ) : (
        membri.map((m) => (
          <MemberRow key={m.id} user={m} to={`/manager/management/employees/${m.id}`} />
        ))
      )}

      <div className="ui-tiles one">
        <Tile to={`/manager/management/teams/${team.id}/edit`} icon={editIcon} label="Modifica" />
      </div>

      <p style={{ padding: '16px 14px 24px', textAlign: 'center' }}>
        <Link to="/manager/management/teams">Torna ai team</Link>
      </p>
      <BackTile />
    </>
  );
}
