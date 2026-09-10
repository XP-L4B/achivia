import { Outlet } from 'react-router-dom';
import TabBar from './TabBar';
import { TABS_CASTELLO } from './tabs';
import Wordmark from '../ui/Wordmark';

/**
 * IL CASTELLO.
 *
 * La dashboard da cui si tiene in piedi l'applicazione: quanti account ci
 * sono, quante organizzazioni pagano, quanti crediti si muovono, che cosa
 * si vende e a che prezzo. Non e' un'area di Achivia — e' il posto da cui
 * si guarda Achivia — e per questo non ha niente delle organizzazioni: ne'
 * quest, ne' competenze, ne' profilo.
 *
 * Il guscio e' quello del negozio e dell'osservatorio, e non e' pigrizia:
 * sono tre dashboard con un accesso consegnato a mano, e chi le apre deve
 * riconoscerle come la stessa famiglia di cose.
 */
export default function CastelloLayout() {
  return (
    <div className="app-shell">
      <main className="pixel-bg app-main with-rail">
        <Wordmark to="/castle" titolo="Il Castello" />
        <Outlet />
      </main>
      <TabBar tabs={TABS_CASTELLO} />
    </div>
  );
}
