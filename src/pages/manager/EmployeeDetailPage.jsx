import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import UserHeaderCard from '../../components/ui/UserHeaderCard';
import QuestCard from '../../components/ui/QuestCard';
import AiPanel from '../../components/ui/AiPanel';
import Tile from '../../components/ui/Tile';
import perfIcon from '../../assets/ui/perfReview.png';
import skillTreeIcon from '../../assets/ui/skilltree.png';
import makeNewIcon from '../../assets/ui/makeNew.png';
import questIcon from '../../assets/ui/activeQuest.png';
import EmployeeAnalytics from '../../components/ui/EmployeeAnalytics';
import ProfileAchievements from '../../components/achievements/ProfileAchievements';
import { getUserById, getUserInOrg, getQuestsForEmployee, getProjectsForMember, puoGuidare, subscribe  , xpDiQuest,
} from '../../data/db';
import BackTile from '../../components/ui/BackTile';

const TABS = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'quests',    label: 'Quest' },
  { id: 'progetti',  label: 'Progetti' },
];

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { user: io } = useAuth();
  const [tab, setTab] = useState('analytics');
  const [, setVersione] = useState(0);
  useEffect(() => subscribe(() => setVersione((v) => v + 1)), []);
  const me = getUserById(io.id) || io;
  /* Come sta in questa organizzazione, non come sta dove si trova adesso:
     il record grezzo porta addosso il canale che quella persona ha aperto,
     e mostrarlo direbbe che ne ha un altro. */
  const u = getUserInOrg(id, me.orgId);

  if (!u) return <PageShell title="Dipendente" description="Utente non trovato." />;

  // Un manager non apre la scheda dell'admin: i suoi dati non sono materia di
  // chi gestisce le persone. Il controllo sta qui e non solo negli elenchi,
  // altrimenti basterebbe scrivere l'indirizzo a mano.
  if (!puoGuidare(me, u)) {
    return (
      <>
        <PageShell title={u.name} description="Questa scheda non è accessibile dal tuo profilo." />
        <BackTile />
      </>
    );
  }

  const eAdmin = u.role === 'admin';
  const quests = getQuestsForEmployee(u).filter((q) => q.status !== 'template');
  const attive = quests.filter((q) => q.status === 'in_corso');
  const progetti = getProjectsForMember(u.id);

  return (
    <>
      <PageShell title={u.name} />

      <UserHeaderCard
        user={u}
        teams={u.department ? 1 : 0}
        activeQuests={attive.length}
        projects={progetti.length}
      />

      <Chips items={TABS} value={tab} onChange={setTab} ariaLabel="Cosa vedere" />

      {tab === 'analytics' && <EmployeeAnalytics user={u} />}

      {tab === 'quests' && (
        quests.length === 0
          ? <div className="empty-state ui-blocco">Nessuna quest assegnata.</div>
          : quests.map((q) => <QuestCard key={q.id} quest={q} />)
      )}

      {tab === 'progetti' && (
        progetti.length === 0
          ? <div className="empty-state ui-blocco">Non partecipa a nessun progetto.</div>
          : progetti.map((p) => (
              <article key={p.id} className="ui-quest">
                <h4 className="ui-quest-title">{p.name}</h4>
                {p.description && <p className="ui-quest-desc">{p.description}</p>}
                {p.endDate && <p className="ui-quest-by">Fine: {p.endDate}</p>}
              </article>
            ))
      )}

      {/* Achievement della persona: quelli presi, quando, con che ricompensa
          e — per quelli assegnati a mano — da chi e perche'. Solo da leggere:
          "Go the Extra Mile" si assegna approvando la quest.

          La scheda di un admin non li ha: il proprietario sta fuori dal
          gioco personale, e le sue medaglie sono quelle dell'organizzazione,
          che stanno nel suo profilo. */}
      {!eAdmin && <ProfileAchievements persona={u} me={me} />}

      <div className="ui-tiles">
        <Tile
          to={`/manager/management/quests/new?assignee=${u.id}`}
          icon={questIcon}
          label={'Assegna\nquest'}
        />
        <Tile
          to={`/manager/management/employees/${u.id}/review`}
          icon={makeNewIcon}
          label={'Nuova\nreview'}
        />
        <Tile
          to={`/manager/management/employees/${u.id}/reviews`}
          icon={perfIcon}
          label={'Storico\nreview'}
        />
        {/* Le competenze di questa persona: si aprono nella pagina che le
            certifica, gia' sulla sua scheda, cosi' da qui si guarda e si
            certifica senza doverla ricercare in un elenco. Un admin un
            albero non ce l'ha: il riquadro porterebbe a una pagina vuota. */}
        {!eAdmin && (
          <Tile
            to={`/manager/management/skills?persona=${u.id}`}
            icon={skillTreeIcon}
            label={'Skill\nTree'}
          />
        )}
      </div>

      <div className="ui-list" style={{ paddingTop: 16 }}>
        <AiPanel
          subject={u.name}
          orgId={me.orgId}
          userId={me.id}
          subjectId={u.id}
          chiGuarda={me}
          context={{
            ruolo: u.role,
            reparto: u.department,
            livello: u.level,
            crediti: u.credits,
            quests: quests.map((q) => ({ titolo: q.title, stato: q.status, scadenza: q.deadline, xp: xpDiQuest(q) })),
          }}
        />
      </div>
      <BackTile />
    </>
  );
}
