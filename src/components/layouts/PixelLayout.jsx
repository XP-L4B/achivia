import { Outlet } from 'react-router-dom';
import TabBar from './TabBar';
import { tabsPer, casaDi } from './tabs';
import Wordmark from '../ui/Wordmark';
import BackTile from '../ui/BackTile';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';

/**
 * Pagine condivise raggiunte dal menu. In fondo il riquadro "Indietro",
 * che nei mockup e' il modo standard per risalire.
 *
 * Di solito queste pagine sono l'intera schermata, senza barra: ci si entra
 * per una cosa sola e si torna indietro. Con `conBarra` invece la pagina
 * tiene la navigazione dell'app — la barra in basso sul telefono, la
 * colonna a sinistra sullo schermo largo — e serve alle pagine dove non si
 * entra per fare una commissione ma per stare: la lega, per esempio, da cui
 * si vuole poter passare al proprio profilo senza prima uscire.
 *
 * La barra e' quella dell'area di chi guarda: chi arriva dal profilo
 * dipendente ritrova le voci del dipendente, chi guida quelle della
 * gestione. Se non si e' entrati non c'e' barra: cinque voci chiuse a
 * chiave non servono a nessuno.
 */
export default function PixelLayout({ conBarra = false }) {
  const { user } = useAuth();
  const me = user ? getUserById(user.id) || user : null;
  const tabs = conBarra ? tabsPer(me) : null;

  if (!tabs) {
    return (
      <main className="pixel-bg app-page">
        <Wordmark />
        <Outlet />
        <BackTile />
      </main>
    );
  }

  return (
    <div className="app-shell">
      <main className="pixel-bg app-main with-rail">
        <Wordmark to={casaDi(me)} />
        <Outlet />
        <BackTile />
      </main>
      <TabBar tabs={tabs} />
    </div>
  );
}
