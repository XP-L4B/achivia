import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { XpPill, CreditsPill } from '../../components/ui/Pills';
import { useAuth } from '../../context/AuthContext';
import { getQuestsAssignedToManager, getUserById, xpDiQuest } from '../../data/db';
import { puoQualcosa } from '../../data/permessi';
import newIcon from '../../assets/manager/questNew_icon.png';
import activeIcon from '../../assets/manager/questActive_icon.png';
import expiringIcon from '../../assets/manager/questExpiring_icon.png';
import approveIcon from '../../assets/manager/questApprove_icon.png';
import savedIcon from '../../assets/manager/questTemplates_icon.png';
import BackTile from '../../components/ui/BackTile';

// Anche qui i riquadri seguono i permessi: chi puo' solo creare quest
// trova "Nuova" e "Salvate", e non una schermata di approvazione che poi
// gli direbbe di no.
const TILES = [
  { to: '/manager/management/quests/new',      label: 'Nuova',      img: newIcon,       chiavi: ['quest.create'] },
  { to: '/manager/management/quests/active',   label: 'Attive',     img: activeIcon,    chiavi: ['quest.edit', 'quest.delete', 'quest.team', 'quest.assign'] },
  { to: '/manager/management/quests/expiring', label: 'In scadenza', img: expiringIcon, chiavi: ['quest.edit', 'quest.delete', 'quest.team', 'quest.assign'] },
  { to: '/manager/management/quests/approve',  label: 'Approvazione', img: approveIcon, chiavi: ['quest.approve', 'quest.reject'] },
  { to: '/manager/management/quests/saved',    label: 'Salvate',    img: savedIcon,     chiavi: ['quest.create'] },
];

export default function QuestsHubPage() {
  const { user } = useAuth();
  const me = getUserById(user.id) || user;
  const visibili = TILES.filter((t) => puoQualcosa(me, t.chiavi));
  const mine = getQuestsAssignedToManager(user.id);

  return (
    <>
      <PageShell title="Quests" description="Le quest che hai ricevuto e la gestione di quelle che assegni." />
      <div className="ui-corpo-pagina">
        <div className="mgmt-grid" style={{ marginBottom: 'var(--space-5)' }}>
          {visibili.map((t) => (
            <Link key={t.to} to={t.to} className="mgmt-tile">
              <span className="mgmt-icon">
                <img src={t.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
              </span>
              <span className="mgmt-label">{t.label}</span>
            </Link>
          ))}
          <BackTile inGrid className="mgmt-tile" />
        </div>

        <h2 style={{ margin: '0 0 var(--space-3)' }}>My Quest</h2>
        {mine.length === 0 ? (
          <div className="empty-state">Non hai quest assegnate a te.</div>
        ) : (
          <div className="ui-colonna">
            {mine.map((q) => (
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
    </>
  );
}
