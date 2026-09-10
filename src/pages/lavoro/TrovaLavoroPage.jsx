import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { useAuth } from '../../context/AuthContext';
import {
  getUserById, getMessaggi, puoCercareLavoro,
  promemoriaScadenza, notificaComparse, consensoScaduto, giorniAllaScadenza,
} from '../../data/db';

/**
 * Trova lavoro.
 *
 * Due strade, e vanno in direzioni opposte. Quella passiva: si mette il
 * proprio profilo in un elenco e si aspetta che qualcuno scriva. Quella
 * attiva: si guardano gli annunci che le organizzazioni hanno pubblicato.
 * La prima chiede un consenso e si spegne quando si vuole, la seconda non
 * chiede niente e non lascia traccia — leggere una bacheca non e' farsi
 * schedare, e per questo la si apre senza attivare nulla.
 *
 * Il negozio e l'osservatorio non passano di qui: non sono profili di
 * persone e non cercano lavoro.
 */
export default function TrovaLavoroPage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;

  /* I due avvisi periodici nascono qui, quando la persona apre le sue
     schermate del lavoro. Non c'e' un programma che gira di notte, e
     inventarne uno per due notifiche sarebbe sproporzionato: questo e' il
     momento in cui si sa che c'e' qualcuno che puo' leggerle, ed e'
     l'unico che serve. Ognuna esce una volta sola — se ne tiene traccia
     dentro il dato che l'ha generata. */
  useEffect(() => {
    if (!me?.id || !puoCercareLavoro(me)) return;
    promemoriaScadenza(me.id);
    notificaComparse(me.id);
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!puoCercareLavoro(me)) return <PageShell title="Trova lavoro" description="Non disponibile per questo tipo di accesso." />;

  const t = me?.trovabilita;
  const scaduto = consensoScaduto(t);
  const attiva = Boolean(t?.attiva) && !scaduto;
  const mancano = giorniAllaScadenza(t);
  const messaggi = getMessaggi(me.id);
  const daLeggere = messaggi.filter((m) => !m.letto).length;

  return (
    <div className="page">
      <PageShell
        title="Trova lavoro"
        description="Farsi trovare da chi cerca profili."
      />

      {(scaduto || (attiva && mancano !== null && mancano <= 30)) && (
        <p className="ui-dialog-hint">
          {scaduto
            ? 'Il tuo consenso è scaduto e non compari più a nessuno. Non è stato cancellato niente: puoi rimetterti in elenco quando vuoi.'
            : `Fra ${mancano} ${mancano === 1 ? 'giorno' : 'giorni'} smetterai di comparire a chi cerca.`}{' '}
          <Link to="/i-miei-dati">I tuoi dati</Link>
        </p>
      )}

      <ul className="menu-list">
        <li className="menu-item">
          {/* Prima gli annunci: e' quello che uno fa per primo, e non
              costa niente. Farsi trovare viene dopo perche' e' una
              decisione, non una ricerca. */}
          <Link to="/annunci" className="menu-link">
            Cerca tra gli annunci
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/lavoro/fatti-trovare" className="menu-link">
            Fatti trovare
            <span className={`badge ${attiva ? 'badge-success' : 'badge-neutral'}`}>
              {attiva ? 'Attivo' : scaduto ? 'Scaduto' : 'Spento'}
            </span>
          </Link>
        </li>
        {(attiva || messaggi.length > 0) && (
          <li className="menu-item">
            {/* Non una casella sua: la stessa di tutti. Tre posti dove
                guardare erano due di troppo. */}
            <Link to="/messaggi" className="menu-link">
              Messaggi ricevuti
              {daLeggere > 0 && <span className="badge badge-success">{daLeggere}</span>}
            </Link>
          </li>
        )}
      </ul>

    </div>
  );
}
