import { Outlet } from 'react-router-dom';
import TabBar from './TabBar';
import { TABS_GESTIONE } from './tabs';
import Wordmark from '../ui/Wordmark';
import AchievementWatcher from '../achievements/AchievementWatcher';
import Banner from '../pubblicita/Banner';
import { useAuth } from '../../context/AuthContext';

/**
 * La dashboard dell'organizzazione.
 *
 * Era l'ultima area rimasta con la vecchia barra in cima — marchio a
 * sinistra, uscita a destra — e su telefono voleva dire che da qui non si
 * andava da nessuna parte: per tornare alle quest o ai dati bisognava
 * indovinare l'indirizzo o tornare indietro col tasto del browser. Adesso
 * ha la barra di tutti: in basso sul telefono, colonna a sinistra da
 * scrivania.
 *
 * Sono le voci della gestione e non un elenco suo. L'admin gira gia' in
 * quelle schermate — le sue sono le stesse del manager con un perimetro
 * piu' largo — e una barra diversa avrebbe voluto dire due mappe della
 * stessa applicazione a seconda della porta da cui si entra.
 *
 * L'uscita non e' piu' un pulsante in cima ma sta nel Menu, dov'e' per il
 * manager e per il dipendente. Il negozio e l'osservatorio ce l'hanno nella
 * barra perche' non hanno un menu: qui c'e'.
 *
 * Il banner in fondo lo vede anche l'admin, e non e' una svista: e' lui che
 * decide se pagare per toglierlo, e una pubblicita' che vede solo chi non
 * puo' farci niente non convince nessuno.
 */
export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <div className="app-shell">
      <main className="pixel-bg app-main with-rail">
        <Wordmark to="/admin" titolo="Dashboard admin" />
        <Outlet />
        <Banner orgId={user?.orgId} />
      </main>
      <TabBar tabs={TABS_GESTIONE} />
      {/* Anche di qua i traguardi dell'organizzazione maturano: e' la
          schermata da cui l'admin passa piu' spesso. */}
      <AchievementWatcher />
    </div>
  );
}
