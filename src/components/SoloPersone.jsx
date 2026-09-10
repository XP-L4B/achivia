import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserById } from '../data/db';
import { areaDi, fuoriDalleOrg } from '../data/permessi';

/**
 * Le schermate che hanno senso solo per chi lavora in un'organizzazione.
 *
 * Il negozio e l'osservatorio sono due dashboard, non due profili: non
 * hanno crediti da spendere, non hanno colleghi da aiutare, non stanno in
 * nessuna classifica. Le pagine condivise pero' stavano fuori da ogni
 * controllo, e con l'indirizzo giusto ci si arrivava lo stesso — trovando
 * un Marketplace da cui non si puo' comprare e una lega a cui non si
 * partecipa. Non e' un buco di sicurezza: e' un vicolo cieco, che e' un
 * modo piu' lento di far perdere tempo.
 *
 * Chi non passa non finisce su un errore: torna a casa sua, che e' l'unico
 * posto dove quello che vede lo riguarda.
 */
export default function SoloPersone({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;

  const me = getUserById(user.id) || user;
  const mia = areaDi(me);
  if (fuoriDalleOrg(mia)) return <Navigate to={`/${mia}`} replace />;

  return children;
}
