import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { nomeOrgDi, subscribe } from '../../data/db';
import { areaDi } from '../../data/permessi';
import {
  chiediIngresso, ritiraRichiesta, accettaInvito, rifiutaInvito,
  richiesteDiPersona, invitiPerPersona,
} from '../../data/ingressi';
import PageShell from '../../components/ui/PageShell';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import Emblema from '../../components/ui/Emblema';
import Button from '../../components/ui/Button';
import { emblemaDi, inizialiDi } from '../../data/emblema';

/* Come si chiama il ruolo che si ha li' dentro, scritto in italiano. Il
   ruolo su misura ha un nome suo dentro l'organizzazione, ma qui serve la
   parola che si capisce prima di entrare. */
const RUOLO = {
  admin: 'Amministratore',
  manager: 'Responsabile',
  employee: 'Membro',
};

/** L'insegna, o le iniziali per chi non se n'e' ancora data una. */
function Insegna({ orgId, nome, size = 40 }) {
  return (
    <span className="sel-org-insegna">
      {emblemaDi(orgId)
        ? <Emblema orgId={orgId} nomeOrg={nome} size={size} />
        : <span className="sel-org-iniziali" aria-hidden="true">{inizialiDi(nome)}</span>}
    </span>
  );
}

/**
 * Le organizzazioni di cui si fa parte, come canali da aprire.
 *
 * E' la prima schermata dopo l'accesso, e ci si torna dal menu. Una persona
 * puo' stare in piu' organizzazioni con ruoli diversi — dipendente in
 * azienda, allenatore nella squadra — e ognuna ha le sue schermate, i suoi
 * permessi e le sue medaglie. Entrare in una non vuol dire uscire dalle
 * altre.
 *
 * L'ordine dei pannelli e' l'ordine delle cose da fare, non quello in cui
 * sono state scritte: prima dove si entra adesso, poi chi ti sta aspettando
 * una risposta, poi quello che hai chiesto tu e sta aspettando, in fondo il
 * modo di aggiungerne una. Chi apre questa pagina nove volte su dieci vuole
 * la prima riga.
 *
 * Questo elenco e' l'unico posto dell'app in cui le organizzazioni di
 * qualcuno compaiono tutte insieme, e lo vede solo lui: da nessuna
 * schermata, nemmeno aprendo la scheda di una persona, si puo' sapere di
 * quali altre organizzazioni faccia parte.
 */
export default function SelezionaOrgPage() {
  const navigate = useNavigate();
  const { user, leMie, entraInOrg } = useAuth();
  const [codice, setCodice] = useState('');
  const [errore, setErrore] = useState('');
  const [avviso, setAvviso] = useState('');
  const [destinazione, setDestinazione] = useState(null);
  // Approvazioni e inviti arrivano da un'altra parte: la pagina si ridisegna
  // quando il deposito cambia, invece di restare ferma su quello di prima.
  const [, setVersione] = useState(0);
  useEffect(() => subscribe(() => setVersione((v) => v + 1)), []);

  const mie = leMie();
  const inviti = user ? invitiPerPersona(user.id) : [];
  const richieste = user ? richiesteDiPersona(user.id) : [];

  /* La navigazione avviene dopo, non dentro il gestore che ha aperto il
     canale. Aprendo un'organizzazione da un modulo, andarsene subito
     smonterebbe il modulo mentre l'invio e' ancora in corso, e il resto
     dell'evento troverebbe un albero che non c'e' piu'. */
  useEffect(() => {
    if (destinazione) navigate(destinazione, { replace: true });
  }, [destinazione, navigate]);

  function apri(orgId, subito = false) {
    const dentro = entraInOrg(orgId);
    if (!dentro) {
      setErrore('Non fai piu’ parte di questa organizzazione.');
      return;
    }
    // Dove si atterra lo dicono i permessi che si hanno *li' dentro*: lo
    // stesso account entra da amministratore in una e da membro in
    // un'altra, e la porta non e' la stessa.
    const dove = `/${areaDi(dentro)}`;
    /* Da una tessera si va subito, nello stesso gesto: non c'e' un modulo
       da non smontare, e un tocco deve bastare. Dal modulo dell'invito si
       passa dallo stato, per la ragione scritta sopra. */
    if (subito) navigate(dove, { replace: true });
    else setDestinazione(dove);
  }

  function bussa(e) {
    e.preventDefault();
    setAvviso('');
    const esito = chiediIngresso(user, codice);
    if (esito.errore) {
      setErrore(esito.errore);
      return;
    }
    setCodice('');
    setErrore('');
    setAvviso(`Richiesta inviata a ${esito.org || 'l’organizzazione'}. Ti avvisiamo quando rispondono.`);
  }

  function accetta(id) {
    const esito = accettaInvito(user, id);
    if (esito.errore) {
      setErrore(esito.errore);
      return;
    }
    setErrore('');
    apri(esito.orgId);
  }

  function agisci(esito) {
    if (esito.errore) setErrore(esito.errore);
    else { setErrore(''); setVersione((v) => v + 1); }
  }

  return (
    <>
      <PageShell
        title="Le tue organizzazioni"
        description={mie.length
          ? 'Scegli dove entrare. Puoi cambiare quando vuoi dal menu, senza uscire dall’account.'
          : 'Non fai ancora parte di nessuna organizzazione. Creane una tua, accetta un invito, oppure chiedi di entrare in una che esiste già.'}
      />

      <div className="ing-pagina">
        {mie.length > 0 && (
          <TerminalPanel titolo="DOVE PUOI ENTRARE" meta={`${mie.length} ${mie.length === 1 ? 'canale' : 'canali'}`}>
            {/* Tessere, non righe: dove si e' gia' dentro si riconosce a
                colpo d'occhio, e si distingue dal modulo in fondo con cui
                se ne chiede o se ne crea una nuova. Un tocco e si entra. */}
            <ul className="sel-org-griglia">
              {mie.map((o) => (
                <li key={o.orgId}>
                  <Button
                    variante="secondario"
                    className={`sel-org-tessera${user?.orgId === o.orgId ? ' is-aperta' : ''}`}
                    onClick={() => apri(o.orgId, true)}
                    aria-label={`Entra in ${o.nome}`}
                  >
                    <Insegna orgId={o.orgId} nome={o.nome} size={56} />
                    <b className="sel-org-nome">{o.nome}</b>
                    <small className="sel-org-ruolo">
                      {RUOLO[o.role] || RUOLO.employee}
                      {' · '}
                      {o.tipo === 'personalizzata' ? 'Gruppo' : 'Azienda'}
                    </small>
                    {user?.orgId === o.orgId && <small className="sel-org-dentro">Sei qui</small>}
                  </Button>
                </li>
              ))}
            </ul>
          </TerminalPanel>
        )}

        {/* Gli inviti stanno sopra il codice: rispondere a chi ti ha chiamato
            viene prima di bussare da qualche altra parte. */}
        {inviti.length > 0 && (
          <TerminalPanel titolo="TI HANNO INVITATO" meta={`${inviti.length} in attesa`}>
            <ul className="sel-org-lista">
              {inviti.map((r) => (
                <li key={r.id} className="sel-org-invito">
                  <div className="sel-org-invito-testa">
                    <Insegna orgId={r.orgId} nome={nomeOrgDi(r.orgId)} size={32} />
                    <span className="sel-org-testo">
                      <b className="sel-org-nome">{nomeOrgDi(r.orgId) || 'Organizzazione'}</b>
                      <small className="sel-org-ruolo">Come {RUOLO[r.ruolo] || RUOLO.employee}</small>
                    </span>
                  </div>
                  {r.messaggio && <p className="sel-org-messaggio">{r.messaggio}</p>}
                  <div className="sel-org-scelte">
                    <Button variante="successo" compatto onClick={() => accetta(r.id)}>Accetta</Button>
                    <Button variante="fantasma" compatto onClick={() => agisci(rifiutaInvito(user, r.id))}>
                      Rifiuta
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </TerminalPanel>
        )}

        {richieste.length > 0 && (
          <TerminalPanel titolo="HAI CHIESTO DI ENTRARE" meta={`${richieste.length} in attesa`}>
            <ul className="sel-org-lista">
              {richieste.map((r) => (
                <li key={r.id} className="sel-org-invito">
                  <div className="sel-org-invito-testa">
                    <Insegna orgId={r.orgId} nome={nomeOrgDi(r.orgId)} size={32} />
                    <span className="sel-org-testo">
                      <b className="sel-org-nome">{nomeOrgDi(r.orgId) || 'Organizzazione'}</b>
                      <small className="sel-org-ruolo">In attesa di risposta</small>
                    </span>
                  </div>
                  <div className="sel-org-scelte">
                    <Button variante="fantasma" compatto onClick={() => agisci(ritiraRichiesta(user, r.id))}>
                      Ritira la richiesta
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </TerminalPanel>
        )}

        <TerminalPanel titolo="AGGIUNGINE UN’ALTRA" piede="IL CODICE NON FA ENTRARE: MANDA UNA RICHIESTA">
          <form className="sel-org-codice" onSubmit={bussa}>
            <label className="label" htmlFor="codice-org">Hai il codice di un’organizzazione?</label>
            <div className="sel-org-codice-riga">
              <input
                id="codice-org"
                name="codice-org"
                placeholder="Codice organizzazione"
                autoComplete="off"
                value={codice}
                onChange={(e) => { setCodice(e.target.value); setErrore(''); setAvviso(''); }}
              />
              <Button type="submit" variante="secondario">Chiedi</Button>
            </div>
            {/* Detto prima di premere, non dopo: chi si aspetta di entrare e
                si ritrova in attesa pensa che qualcosa non abbia funzionato. */}
            <small className="sel-org-nota">
              Chi amministra l’organizzazione riceve la richiesta e decide se accettarla.
            </small>
          </form>

          {errore && <p className="ui-errore" role="alert">{errore}</p>}
          {avviso && <p className="sel-org-avviso" role="status">{avviso}</p>}

          <div className="sel-org-crea">
            <Button to="/auth/register/org-type" variante="primario" blocco>
              Crea un’organizzazione
            </Button>
          </div>
        </TerminalPanel>
      </div>
    </>
  );
}
