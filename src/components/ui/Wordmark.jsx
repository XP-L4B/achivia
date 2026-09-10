import { Link } from 'react-router-dom';
import Emblema from './Emblema';
import { useAuth } from '../../context/AuthContext';
import { getUserById, nomeOrgDi } from '../../data/db';

/**
 * Scritta "ACHIVIA" in alto a sinistra, presente in ogni schermata dei
 * mockup. Riporta al proprio profilo: e' anche il modo piu' rapido per
 * tornare alla home.
 *
 * Accanto, in piccolo, l'insegna dell'organizzazione di chi sta guardando —
 * il logo dell'azienda o lo stemma che si e' scelta. E' il posto giusto per
 * una cosa che si deve vedere sempre e non deve mai essere protagonista:
 * ventisei pixel, di fianco al marchio dell'app, in ogni schermata.
 *
 * Con `titolo` sotto il marchio compare il nome dell'area. Serve dove il
 * nome non si legge da nessun'altra parte: su desktop lo dice la barra a
 * sinistra, che porta le etichette scritte, ma su telefono la barra in
 * basso mostra solo icone e il marchio dell'app — e "ACHIVIA" da solo non
 * dice in quale delle sue dashboard si e' finiti. Percio' il titolo esiste
 * solo dove serve: `desktop.css` lo toglie appena la barra a sinistra
 * compare, per non dire due volte la stessa cosa a un palmo di distanza.
 */
export default function Wordmark({ to, titolo }) {
  const { user } = useAuth();
  const me = user ? getUserById(user.id) || user : null;
  // Il nome sta sul proprietario dell'organizzazione: senza cercarlo li',
  // uno stemma con le iniziali ne mostrava di sbagliate a chiunque non
  // fosse l'admin.
  const nomeOrg = me?.orgId ? me.org || nomeOrgDi(me.orgId) : '';

  const label = (
    <span className={`ui-marchio-riga${titolo ? ' con-titolo' : ''}`}>
      <span className="ui-wordmark">ACHIVIA</span>
      {titolo && <span className="ui-marchio-area">{titolo}</span>}
      {me?.orgId && (
        <Emblema orgId={me.orgId} nomeOrg={nomeOrg} size={26} titolo={nomeOrg ? `Insegna di ${nomeOrg}` : 'Insegna dell’organizzazione'} />
      )}
    </span>
  );

  return to
    ? <Link to={to} style={{ textDecoration: 'none' }}>{label}</Link>
    : label;
}
