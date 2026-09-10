import { Outlet } from 'react-router-dom';
import TabBar from './TabBar';
import { TABS_DIPENDENTE } from './tabs';
import Wordmark from '../ui/Wordmark';
import AchievementWatcher from '../achievements/AchievementWatcher';
import Banner from '../pubblicita/Banner';
import { useAuth } from '../../context/AuthContext';

/* Il banner sta in fondo al contenuto e sopra la barra: e' pubblicita',
   quindi non deve rubare il posto a niente, ma sta dentro la pagina e non
   sotto la barra, se no su telefono non lo vedrebbe nessuno. Compare solo
   se il piano dell'organizzazione lo prevede — se ne occupa lui. */
export default function EmployeeLayout() {
  const { user } = useAuth();
  return (
    <div className="app-shell">
      <main className="pixel-bg app-main with-rail">
        <Wordmark to="/employee/profile" />
        <Outlet />
        <Banner orgId={user?.orgId} />
      </main>
      <TabBar tabs={TABS_DIPENDENTE} />
      <AchievementWatcher />
    </div>
  );
}
