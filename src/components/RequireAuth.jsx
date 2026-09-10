import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserById, quanteOrg } from '../data/db';
import { areaDi, fuoriDalleOrg, accessoOsservatorio } from '../data/permessi';

/**
 * Protegge un'area: se non si e' entrati manda all'accesso; se l'area non e'
 * la propria, riporta alla propria.
 *
 * Quale sia la propria non lo dice piu' il nome del ruolo ma quello che si
 * puo' fare (`areaDi`): chi gestisce qualcosa — comunque si chiami il suo
 * ruolo — passa dalle porte della gestione, chi non gestisce niente sta fra
 * le sue quest. L'area dell'admin resta dell'admin e dei co-admin.
 *
 * Il negozio ha un'area sua, che non e' quella di nessun altro: non c'e'
 * permesso che ci porti dentro, e da dentro non si esce verso le
 * organizzazioni.
 */
export default function RequireAuth({ role, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/auth" replace />;
  // Il ruolo puo' essere cambiato mentre si era dentro: si guarda la
  // persona come sta scritta adesso, non come stava quando si e' entrati.
  const me = getUserById(user.id) || user;
  const mia = areaDi(me);

  /* Le aree di un'organizzazione si aprono da dentro un'organizzazione.
     Chi ne ha almeno una ma non ne ha aperta nessuna — ha appena fatto
     l'accesso, o e' tornato indietro dall'elenco — va a scegliere: senza
     canale aperto quelle schermate mostrerebbero le quest, le persone e i
     numeri di nessuno.
     Chi non ne ha nemmeno una passa: la sua area la vede vuota, ed e' la
     verita' — l'elenco resta a un tocco dal menu, con dentro l'invito a
     crearne una. Il negozio, l'osservatorio e il Castello non hanno canali
     per costruzione, e da questa riga non passano. */
  if (!me.orgId && !fuoriDalleOrg(mia) && quanteOrg(me.id) > 0) {
    return <Navigate to="/org" replace />;
  }

  /* L'osservatorio ha due porte. La prima e' il suo account, e passa da
     `areaDi` come tutte le altre aree. La seconda l'ha aperta il listino:
     dal Gold in poi un piano apre una parte dell'osservatorio a chi
     amministra l'organizzazione che paga, e quella persona resta dov'e' —
     la sua area e' `admin` — ma di qui passa. Quale pagina possa poi
     aprire lo decide `SoloTavola`, una per una. */
  if (role === 'osservatorio' && mia !== 'osservatorio') {
    return accessoOsservatorio(me) === 'no'
      ? <Navigate to={`/${mia}`} replace />
      : children;
  }

  const passa = !role || role === mia || (role === 'manager' && mia === 'admin');
  if (!passa) return <Navigate to={`/${mia}`} replace />;

  return children;
}
