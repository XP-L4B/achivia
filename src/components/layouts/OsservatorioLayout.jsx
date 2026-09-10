import { Outlet } from 'react-router-dom';
import TabBar from './TabBar';
import { tabsOsservatorio } from './tabs';
import Wordmark from '../ui/Wordmark';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';
import { primaTavola } from '../../data/permessi';

/**
 * L'area di chi guarda il mercato.
 *
 * Le sue tavole e il marchio in mezzo. Non c'e' la barra delle
 * organizzazioni — quest, competenze, persone — perche' chi sta qui non
 * appartiene a nessuna: guarda tutte insieme e nessuna in particolare, ed
 * e' proprio quella la promessa del prodotto.
 *
 * Il nome dell'area sta sotto il marchio, e su telefono e' l'unico posto in
 * cui si legge: la barra in basso li' mostra solo icone. Su desktop lo dice
 * gia' la barra a sinistra, e sparisce.
 *
 * Da qui non passa piu' solo l'account dell'osservatorio: dal Gold in poi
 * un piano ne apre una parte a chi amministra l'organizzazione che paga, e
 * quella persona vede una barra ridotta a quello che le spetta, con il
 * ritorno alla sua dashboard al posto dell'uscita. Il marchio la riporta
 * alla prima tavola che puo' aprire e non alla prima in assoluto: mandarla
 * su una pagina che le e' chiusa sarebbe un rimbalzo a ogni clic.
 */
export default function OsservatorioLayout() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  const tabs = tabsOsservatorio(me);
  return (
    <div className="app-shell">
      <main className="pixel-bg app-main with-rail">
        <Wordmark to={primaTavola(me) || '/osservatorio'} titolo="Osservatorio del lavoro" />
        <Outlet />
      </main>
      <TabBar tabs={tabs} />
    </div>
  );
}
