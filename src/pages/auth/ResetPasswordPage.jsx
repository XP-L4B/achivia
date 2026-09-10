import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import { useAuth } from '../../context/AuthContext';
import { getUserById, updateUser, MIN_PASSWORD } from '../../data/db';

/**
 * Cambiare la password.
 *
 * Questa pagina prima non cambiava niente: due campi senza stato e un
 * collegamento vestito da pulsante, che riportava all'accesso. Chi ci
 * passava scriveva la nuova password, premeva Conferma e se ne andava
 * convinto di averla cambiata. Un controllo che finge di funzionare su una
 * cosa di sicurezza e' peggio di un controllo assente: fallisce in
 * silenzio, e chi lo usa non ha nessun modo di accorgersene.
 *
 * Adesso fa quello che puo' fare davvero, e dice quello che non puo'.
 *
 *   Chi e' entrato la cambia, dando prima quella di adesso. Chiederla non
 *   e' burocrazia: senza, chiunque trovi un telefono sbloccato si prende
 *   l'account, e questa e' l'unica porta che protegge tutto il resto.
 *
 *   Chi non e' entrato non puo' fare niente da qui, e lo legge subito.
 *   Recuperare una password dimenticata vuol dire mandare qualcosa a un
 *   indirizzo — un'email, un codice — e questo non c'e'. Fingere un
 *   modulo che non spedisce niente sarebbe tornare al punto di partenza:
 *   la strada che esiste davvero e' l'amministratore, che una password la
 *   sa rigenerare, e la pagina manda li'.
 */
export default function ResetPasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = user ? getUserById(user.id) : null;

  const [attuale, setAttuale] = useState('');
  const [nuova, setNuova] = useState('');
  const [conferma, setConferma] = useState('');
  const [errore, setErrore] = useState('');
  const [fatto, setFatto] = useState(false);

  function cambia(e) {
    e.preventDefault();
    if (attuale !== me.password) { setErrore('La password di adesso non è quella giusta.'); return; }
    if (nuova.length < MIN_PASSWORD) { setErrore(`La nuova password deve avere almeno ${MIN_PASSWORD} caratteri.`); return; }
    if (nuova === attuale) { setErrore('La nuova password è uguale a quella di adesso.'); return; }
    if (nuova !== conferma) { setErrore('Le due password non coincidono.'); return; }
    updateUser(me.id, { password: nuova });
    setErrore('');
    setFatto(true);
    setAttuale(''); setNuova(''); setConferma('');
  }

  if (!me) {
    return (
      <>
        <PageShell
          title="Password dimenticata"
          description="Da qui non si può ancora recuperare da soli."
        />
        <div className="ui-corpo-pagina">
          <TerminalPanel titolo="NON DA QUI" className="ui-blocco con-stacco">
            <p className="tv-vuoto">
              Per rimandarti una password servirebbe scriverti a un indirizzo, e Achivia non manda
              ancora email di recupero. Preferiamo dirtelo che darti un modulo che non spedisce
              niente.
            </p>
            <p className="ui-dialog-hint">
              Chi amministra la tua organizzazione può generarti una password nuova dal tuo profilo
              e consegnartela. Se l’account è tuo e sei ancora dentro da un altro dispositivo, la
              cambi dalle impostazioni.
            </p>
            <Button variante="primario" compatto to="/auth">Torna all’accesso</Button>
          </TerminalPanel>
        </div>
        <BackTile />
      </>
    );
  }

  return (
    <>
      <PageShell title="Cambia password" description="Serve quella di adesso: è l’unica cosa che dimostra che sei tu." />
      <div className="ui-corpo-pagina">
        <form className="ui-colonna" onSubmit={cambia}>
          <label className="label" htmlFor="attuale">Password di adesso</label>
          <input
            id="attuale"
            name="current-password"
            type="password"
            autoComplete="current-password"
            value={attuale}
            onChange={(e) => { setAttuale(e.target.value); setErrore(''); setFatto(false); }}
          />

          <label className="label" htmlFor="nuova">Nuova password</label>
          <input
            id="nuova"
            name="new-password"
            type="password"
            autoComplete="new-password"
            value={nuova}
            onChange={(e) => { setNuova(e.target.value); setErrore(''); setFatto(false); }}
          />

          <label className="label" htmlFor="conferma">Ripetila</label>
          <input
            id="conferma"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            value={conferma}
            onChange={(e) => { setConferma(e.target.value); setErrore(''); setFatto(false); }}
          />

          {errore && <p className="ui-errore" role="alert">{errore}</p>}
          {fatto && (
            <p className="ui-dialog-hint" role="status">
              Fatto: da adesso entri con quella nuova. <Link to="/settings">Torna alle impostazioni</Link>
            </p>
          )}

          <div className="oss-scarico">
            <Button variante="primario" type="submit" disabled={!attuale || !nuova || !conferma}>
              Cambia password
            </Button>
            <Button variante="fantasma" compatto onClick={() => navigate(-1)}>Annulla</Button>
          </div>
        </form>
      </div>
      <BackTile />
    </>
  );
}
