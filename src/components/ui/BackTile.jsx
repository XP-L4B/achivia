import { useLocation, useNavigate } from 'react-router-dom';
import Tile from './Tile';
import backIcon from '../../assets/ui/goBack.png';
import { genitoreDi } from '../layouts/risalita';
import { doveSi } from '../layouts/tabs';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';

/**
 * Riquadro «Indietro» con la freccia gialla dei mockup.
 *
 * Nella schermata 9 dei mockup è l'ultima casella della griglia, con la
 * stessa forma delle altre voci: per questo è un `Tile`. Dove la pagina non
 * ha una griglia sta da solo, centrato in fondo al contenuto.
 *
 * **Dove porta lo decide la struttura, non la cronologia.** Senza `to`
 * risale alla schermata che dà accesso a questa, che sta scritta in
 * `layouts/risalita.js` — una volta sola, per tutta l'applicazione. Prima
 * tornava alla pagina da cui si veniva, e quella è un'altra cosa: chi apre
 * la scheda di un dipendente da Analytics vuole l'elenco dei dipendenti, e
 * chi esce da una partita non vuole rientrarci. Il giro che uno ha fatto lo
 * racconta già il tasto indietro del browser.
 *
 * Con `to` si scavalca la mappa: serve solo quando una pagina sa qualcosa
 * che la mappa non può sapere, tipo la scheda da cui si è arrivati. Con
 * `inGrid` viene reso nudo, da infilare come ultima cella di una griglia
 * esistente.
 *
 * Se sopra non c'è niente — è una dashboard — il riquadro non compare:
 * meglio nessun pulsante che un pulsante che non porta da nessuna parte.
 */
export default function BackTile({ to, label = 'Indietro', inGrid = false, className = '' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const me = user ? getUserById(user.id) || user : null;

  const meta = to ?? genitoreDi(pathname, doveSi(me));

  /* `null` e' una dashboard: niente pulsante. `undefined` e' un indirizzo
     che non e' in mappa — non deve capitare, e `npm run navigazione` lo
     verifica — ma se capita si torna alla cronologia invece di lasciare la
     pagina senza uscita. */
  if (meta === null) return null;

  const tile = meta
    ? <Tile icon={backIcon} label={label} to={meta} className={className} />
    : <Tile icon={backIcon} label={label} onClick={() => navigate(-1)} className={className} />;

  return inGrid ? tile : <div className="ui-back-row">{tile}</div>;
}
