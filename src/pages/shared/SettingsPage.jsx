import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import ControlliMusica from '../../components/ui/ControlliMusica';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import { useAuth } from '../../context/AuthContext';
import {
  getUserById, puoCercareLavoro, deleteUser, COSA_SPARISCE, COSA_RESTA,
} from '../../data/db';

/**
 * Le impostazioni dell'account.
 *
 * Qui c'erano due interruttori che non facevano niente — «Attiva notifiche»
 * e «Dark Mode» — e un pulsante rosso «Elimina account» senza nemmeno un
 * gestore. Si spuntavano, si premevano, e non succedeva nulla. Un controllo
 * che finge di funzionare costa piu' di uno assente: chi lo usa non scopre
 * di aver fallito, e continua a credere di aver fatto una cosa che non ha
 * fatto. I due interruttori sono spariti; la cancellazione adesso cancella.
 *
 * La cancellazione non chiede «sei sicuro?» e basta, che e' una firma in
 * bianco. Elenca che cosa sparisce e che cosa resta, e quell'elenco viene
 * dalle stesse costanti che la funzione esegue: non puo' promettere una
 * cosa e farne un'altra.
 */
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const me = getUserById(user?.id) || user;
  const [cancella, setCancella] = useState(false);
  const cercaLavoro = puoCercareLavoro(me);

  function elimina() {
    deleteUser(me.id);
    logout();
    navigate('/auth', { replace: true });
  }

  return (
    <>
      <PageShell title="Impostazioni" />

      <div className="ui-corpo-pagina">
        {/* Prima queste righe stavano appoggiate sullo sfondo, separate da un
            filo: su una fotografia un filo non si vede, e quello che ci sta
            sopra nemmeno. Adesso sono dentro un pannello come tutto il resto
            della pagina, che nella meta' di sotto uno ce l'aveva gia'. */}
        <TerminalPanel titolo="IL TUO ACCOUNT" className="ui-blocco con-stacco">
          <div className="tv-comandi">
            <ControlliMusica riga="tv-comando" />
            <div className="tv-comando">
              <Link to="/auth/reset-password">Cambia password</Link>
              <span className="tv-comando-nota">La password di accesso</span>
            </div>
            {cercaLavoro && (
              <div className="tv-comando">
                <Link to="/lavoro">Trova lavoro</Link>
                <span className="tv-comando-nota">Annunci e «fatti trovare»</span>
              </div>
            )}
            {cercaLavoro && (
              <div className="tv-comando">
                <Link to="/i-miei-dati">I tuoi dati e i tuoi diritti</Link>
                <span className="tv-comando-nota">Che cosa sappiamo di te</span>
              </div>
            )}
          </div>
        </TerminalPanel>

        <TerminalPanel titolo="CANCELLARE L’ACCOUNT" className="ui-blocco con-stacco">
          <p className="ui-dialog-hint">
            Non si può annullare. Prima di premere, ecco esattamente che cosa succede.
          </p>

          <span className="label">Sparisce</span>
          <ul className="imp-elenco">
            {COSA_SPARISCE.map((v) => <li key={v}>{v}</li>)}
          </ul>

          <span className="label">Resta, senza il tuo nome</span>
          <ul className="imp-elenco is-resta">
            {COSA_RESTA.map((v) => <li key={v}>{v}</li>)}
          </ul>

          {cercaLavoro && (
            <p className="ui-dialog-hint">
              Se volevi solo uscire dall’elenco di chi cerca persone, non serve cancellare
              l’account: si revoca da <Link to="/i-miei-dati">I tuoi dati</Link>, e il resto resta
              dov’è.
            </p>
          )}

          <div className="oss-scarico">
            <Button variante="pericolo" compatto onClick={() => setCancella(true)}>
              Elimina il mio account
            </Button>
          </div>
        </TerminalPanel>
      </div>

      {cancella && (
        <ConfirmDialog
          titolo="Cancellare l’account?"
          testo="Sparisce tutto quello che è tuo e non si recupera. Resta soltanto, senza il tuo nome, il fatto che qualcuno sia passato dalle organizzazioni in cui hai lavorato."
          conferma="Cancella per sempre"
          distruttiva
          onConferma={elimina}
          onChiudi={() => setCancella(false)}
        />
      )}
    </>
  );
}
