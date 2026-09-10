import PageShell from '../../components/ui/PageShell';
import EmployeeAnalytics from '../../components/ui/EmployeeAnalytics';
import OrgAnalytics from '../../components/ui/OrgAnalytics';
import MemberRow from '../../components/ui/MemberRow';
import { useAuth } from '../../context/AuthContext';
import { getUsersByOrg, getUserById, puoGuidare } from '../../data/db';
import { puo } from '../../data/permessi';
import BackTile from '../../components/ui/BackTile';

/**
 * Dati e analytics.
 *
 * Sopra i propri numeri, sotto le persone di cui si risponde: da qui si apre
 * la loro scheda, che e' il posto dove i loro dati stanno per intero. Le due
 * cose non si mescolano piu' in un selettore: prima accanto a "I miei dati"
 * comparivano le prime due persone, e cambiando pillola i numeri cambiavano
 * padrone senza che la pagina lo dicesse piu' di tanto.
 *
 * Chi vede i dati di tutta l'organizzazione trova in cima quelli
 * dell'insieme — valori e grafico, le stesse domande fatte su tutti — e
 * sotto le persone da aprire quando un numero non torna. L'admin non esegue
 * quest, quindi numeri suoi non ne ha: al loro posto ci sono quelli
 * dell'azienda, che sono il suo mestiere.
 */
export default function DataPage() {
  const { user } = useAuth();
  const me = getUserById(user.id) || user;
  // Chi vede i dati di tutta l'organizzazione li vede tutti; gli altri
  // vedono le persone che guidano — la propria squadra e i propri reparti.
  const tuttaOrg = puo(me, 'analytics.org');
  const persone = tuttaOrg
    ? getUsersByOrg(me.orgId).filter((u) => u.id !== me.id)
    : getUsersByOrg(me.orgId).filter((u) => puoGuidare(me, u) && puo(me, 'analytics.team'));

  return (
    <>
      <PageShell
        title="Dati"
        description={tuttaOrg
          ? 'I numeri di tutta l’organizzazione. Più sotto, le persone: apri una scheda per i suoi indicatori.'
          : 'I tuoi indicatori di performance e crediti. Più sotto, le persone del tuo team.'}
      />

      {tuttaOrg && <OrgAnalytics persona={me} />}

      {!tuttaOrg && puo(me, 'analytics.personal') && <EmployeeAnalytics user={me} />}

      {persone.length > 0 && (
        <>
          <h2>{tuttaOrg ? 'Persone' : 'Tutti'}</h2>
          <div className="ui-list">
            {persone.map((p) => (
              <MemberRow key={p.id} user={p} to={`/manager/management/employees/${p.id}`} />
            ))}
          </div>
        </>
      )}
      <BackTile />
    </>
  );
}
