import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserById } from '../data/db';
import { puoVedereTavola, primaTavola, areaDi } from '../data/permessi';

/**
 * Una singola tavola dell'osservatorio.
 *
 * L'account dell'osservatorio le vede tutte. Chi ci arriva dal proprio
 * piano ne vede quante gliene apre: il Gold la sola pagina dei profili di
 * chi cerca lavoro, il Diamond tutte. Chi apre l'indirizzo di una tavola
 * che non gli spetta finisce sulla prima che puo' aprire, non su una
 * pagina di errore: e' arrivato in un posto che esiste, solo non e' suo.
 */
export default function SoloTavola({ tavola, children }) {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  if (puoVedereTavola(me, tavola)) return children;
  const casa = primaTavola(me);
  return <Navigate to={casa || `/${areaDi(me)}`} replace />;
}
