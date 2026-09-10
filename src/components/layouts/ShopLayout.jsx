import { Outlet } from 'react-router-dom';
import TabBar from './TabBar';
import { TABS_NEGOZIO } from './tabs';
import Wordmark from '../ui/Wordmark';

/**
 * L'area di chi tiene il negozio.
 *
 * Due voci e il marchio in mezzo, che porta al riepilogo come negli altri
 * layout porta al profilo. Non c'e' la barra delle organizzazioni — quest,
 * competenze, persone — perche' chi tiene il negozio non ha niente a che
 * vedere con loro: vende, e vede solo quello che gli serve per vendere.
 */
export default function ShopLayout() {
  return (
    <div className="app-shell">
      <main className="pixel-bg app-main with-rail">
        <Wordmark to="/shop" />
        <Outlet />
      </main>
      <TabBar tabs={TABS_NEGOZIO} />
    </div>
  );
}
