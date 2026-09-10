import PageShell from '../../components/ui/PageShell';
import Tile from '../../components/ui/Tile';
import teamsIcon from '../../assets/ui/teams.png';
import questIcon from '../../assets/ui/activeQuest.png';
import coopIcon from '../../assets/ui/coop.png';
import projectsIcon from '../../assets/ui/projects.png';
import membersIcon from '../../assets/ui/members.png';
import skillTreeIcon from '../../assets/ui/skilltree.png';
import BackTile from '../../components/ui/BackTile';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';
import { puoQualcosa } from '../../data/permessi';

// Hub della gestione, nella griglia di riquadri dei mockup.
//
// Ogni riquadro porta i permessi che lo aprono: chi non ne ha nessuno non
// lo vede. Una porta che si apre su un «non puoi» e' peggio di una porta
// che non c'e'.
const TILES = [
  // «Dipendenti» e «Membri» erano due riquadri per due schermate che
  // facevano la stessa cosa: adesso e' una sola, e il riquadro e' uno.
  { to: '/manager/management/employees',     label: 'Persone',    icon: teamsIcon,      chiavi: ['people.team'] },
  { to: '/manager/management/quests',        label: 'Quest',      icon: questIcon,      chiavi: ['quest.create', 'quest.edit', 'quest.assign', 'quest.approve', 'quest.reject', 'quest.team'] },
  { to: '/manager/management/help-requests', label: 'Aiuto',      icon: coopIcon,       chiavi: ['people.team'] },
  { to: '/manager/management/projects',      label: 'Progetti',   icon: projectsIcon,   chiavi: ['people.teams', 'quest.assign'] },
  { to: '/manager/management/teams',         label: 'Team',       icon: membersIcon,    chiavi: ['people.teams'] },
  { to: '/manager/management/skills',        label: 'Skill Tree', icon: skillTreeIcon,  chiavi: ['skills.create', 'skills.certify', 'skills.revoke'] },
];

export default function ManagementPage() {
  const { user } = useAuth();
  const me = getUserById(user.id) || user;
  const visibili = TILES.filter((t) => puoQualcosa(me, t.chiavi));

  return (
    <>
      <PageShell
        title="Gestione"
        description="Da qui gestisci le persone del tuo team, le quest che assegni, le richieste di aiuto e i progetti."
      />
      <div className="ui-tiles">
        {visibili.map((t) => (
          <Tile key={t.to} to={t.to} icon={t.icon} label={t.label} alt={t.alt} className={t.className} />
        ))}
        <BackTile inGrid />
      </div>
    </>
  );
}
