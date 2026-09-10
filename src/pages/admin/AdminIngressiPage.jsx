import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import { useAuth } from '../../context/AuthContext';
import { getUserById, getOrgSeats, codiceOrg, subscribe } from '../../data/db';
import { puoApprovareIngressi, ruoliDi } from '../../data/permessi';
import {
  ingressiDiOrg, rigaIngresso, invitaInOrg, approvaIngresso, rifiutaIngresso, annullaInvito,
} from '../../data/ingressi';

const quando = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');

/**
 * Chi entra nell'organizzazione.
 *
 * Due elenchi e un modulo, e sono le due direzioni della stessa cosa: chi ha
 * bussato con il codice e aspetta una risposta, e chi e' stato chiamato e
 * non ha ancora risposto.
 *
 * La pagina la vedono l'admin, i co-admin e chi ha un ruolo su misura con il
 * permesso apposta. Non e' una schermata di gestione come le altre: e' la
 * porta di casa, e chi la apre non deve trovarcisi per caso.
 */
export default function AdminIngressiPage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  const [errore, setErrore] = useState('');
  const [avviso, setAvviso] = useState('');
  const [numero, setNumero] = useState('');
  const [email, setEmail] = useState('');
  const [ruolo, setRuolo] = useState('employee');
  const [, setVersione] = useState(0);
  useEffect(() => subscribe(() => setVersione((v) => v + 1)), []);

  if (!puoApprovareIngressi(me)) {
    return (
      <>
        <PageShell
          title="Ingressi"
          description="Questa pagina è di chi amministra l’organizzazione."
        />
        <BackTile />
      </>
    );
  }

  const coda = ingressiDiOrg(me.orgId).map(rigaIngresso);
  const richieste = coda.filter((r) => r.verso === 'richiesta');
  const inviti = coda.filter((r) => r.verso === 'invito');
  const posti = getOrgSeats(me.orgId);
  // Solo i ruoli veri dell'organizzazione: l'invito non nomina admin, che e'
  // una cosa che si fa dopo, a persona entrata e riconosciuta.
  const ruoli = ruoliDi(me.orgId);

  function agisci(esito, testo = '') {
    if (esito.errore) { setErrore(esito.errore); setAvviso(''); return; }
    setErrore('');
    setAvviso(testo);
    setVersione((v) => v + 1);
  }

  function manda(e) {
    e.preventDefault();
    const esito = invitaInOrg(me, { achiviaId: numero, email, ruolo });
    if (esito.errore) { setErrore(esito.errore); setAvviso(''); return; }
    setNumero('');
    setEmail('');
    setErrore('');
    setAvviso(esito.inAttesaDiRegistrazione
      ? 'Invito mandato. Chi si registrerà con quell’indirizzo lo troverà ad aspettarlo.'
      : 'Invito mandato.');
  }

  return (
    <>
      <PageShell
        title="Ingressi"
        description="Chi ha chiesto di entrare e chi hai invitato. Nessuno entra finché non lo decidi tu."
      />

      <div className="ing-pagina">
        {/* Chi aspetta una risposta viene prima di tutto: e' l'unica cosa
            di questa pagina che ha qualcuno fermo dall'altra parte. */}
        <TerminalPanel
          titolo="CHIEDE DI ENTRARE"
          meta={richieste.length ? `${richieste.length} in attesa` : 'nessuna'}
        >
          {richieste.length === 0 ? (
            <p className="tv-vuoto">Nessuna richiesta in attesa.</p>
          ) : (
            <ul className="ing-lista">
              {richieste.map((r) => (
                <li key={r.id} className="ing-riga">
                  <span className="ing-chi">
                    <b>{r.chi}</b>
                    <small>{[r.numero, quando(r.quando)].filter(Boolean).join(' · ')}</small>
                  </span>
                  {r.messaggio && <p className="ing-messaggio">{r.messaggio}</p>}
                  <span className="ing-scelte">
                    <Button variante="successo" compatto onClick={() => agisci(approvaIngresso(me, r.id), 'Entrata.')}>
                      Accetta
                    </Button>
                    <Button variante="fantasma" compatto onClick={() => agisci(rifiutaIngresso(me, r.id))}>
                      Rifiuta
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TerminalPanel>

        <TerminalPanel
          titolo="INVITA UNA PERSONA"
          piede={`POSTI LIBERI: ${posti.liberi === Infinity ? 'ILLIMITATI' : posti.liberi}`}
        >
          <p className="ing-nota">
            Con il numero Achivia, se ce l’hai: identifica senza equivoci e non ti obbliga
            a farti dare l’indirizzo di nessuno. Con l’email invece raggiungi anche chi su
            Achivia non c’è ancora: l’invito lo aspetta.
          </p>
          <form className="ing-modulo" onSubmit={manda}>
            <label className="label" htmlFor="ing-numero">Numero Achivia</label>
            <input
              id="ing-numero"
              name="ing-numero"
              placeholder="#10000042"
              autoComplete="off"
              value={numero}
              onChange={(e) => { setNumero(e.target.value); setEmail(''); setErrore(''); }}
            />
            <label className="label" htmlFor="ing-email">oppure indirizzo email</label>
            <input
              id="ing-email"
              name="ing-email"
              type="email"
              placeholder="persona@esempio.it"
              autoComplete="off"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setNumero(''); setErrore(''); }}
            />
            <label className="label" htmlFor="ing-ruolo">Entra come</label>
            <select id="ing-ruolo" name="ing-ruolo" value={ruolo} onChange={(e) => setRuolo(e.target.value)}>
              <option value="employee">Membro</option>
              {ruoli.filter((r) => r.id !== 'preset-employee').map((r) => (
                <option key={r.id} value={r.id === 'preset-manager' ? 'manager' : 'employee'}>
                  {r.nome}
                </option>
              ))}
            </select>
            <Button type="submit" variante="primario" blocco>Manda l’invito</Button>
          </form>
          <p className="ing-nota">
            Codice dell’organizzazione: <b>{codiceOrg(me.orgId) || me.orgId}</b>. Puoi
            condividerlo senza pensarci: da solo non fa entrare nessuno.
          </p>
        </TerminalPanel>

        {inviti.length > 0 && (
          <TerminalPanel titolo="INVITI MANDATI" meta={`${inviti.length} in attesa`}>
            <ul className="ing-lista">
              {inviti.map((r) => (
                <li key={r.id} className="ing-riga">
                  <span className="ing-chi">
                    <b>{r.chi}</b>
                    <small>
                      {r.inAttesaDiRegistrazione ? 'non ha ancora un account' : r.numero}
                      {' · '}
                      {quando(r.quando)}
                    </small>
                  </span>
                  <span className="ing-scelte">
                    <Button variante="fantasma" compatto onClick={() => agisci(annullaInvito(me, r.id))}>
                      Ritira
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </TerminalPanel>
        )}

        {errore && <p className="ui-errore" role="alert">{errore}</p>}
        {avviso && <p className="sel-org-avviso" role="status">{avviso}</p>}
      </div>

      <BackTile />
    </>
  );
}
