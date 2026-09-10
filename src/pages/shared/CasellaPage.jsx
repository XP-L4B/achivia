import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import Chips from '../../components/ui/Chips';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import { useAuth } from '../../context/AuthContext';
import {
  getNotificationsForUser, markNotificationsRead, clearNotificationsForUser,
  getMessaggi, segnaMessaggioLetto, eliminaMessaggio, gradoVerso, impostaGrado,
  subscribe,
} from '../../data/db';

/**
 * La casella: una sola.
 *
 * Prima erano tre. Le notifiche stavano in due pagine diverse — "Notifiche"
 * e "DM" — che leggevano lo stesso elenco e lo disegnavano uguale, con due
 * tessere separate sul profilo; i messaggi di lavoro in una terza, dentro
 * Trova lavoro. Con tre caselle non si impara mai dove guardare, quindi non
 * si guarda, e il pallino sulla tessera smette di voler dire qualcosa.
 *
 * Qui dentro pero' non c'e' una cosa sola: ci sono avvisi e lettere, e sono
 * diversi. Un avviso e' una riga che dice che e' successo qualcosa e si
 * legge in un secondo; una lettera ha un mittente, un corpo, e la si vuole
 * poter zittire o buttare. Fonderli in un formato unico avrebbe reso
 * entrambi peggiori. Stanno insieme nella stessa lista, ordinati per data,
 * e ognuno tiene la sua forma — che e' quello che fa una casella di posta
 * vera quando ci arrivano cose diverse.
 */
const quando = (iso) => {
  const d = new Date(iso);
  const passati = (Date.now() - d.getTime()) / 3600000;
  if (passati < 24) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  if (passati < 24 * 7) return d.toLocaleDateString('it-IT', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('it-IT');
};

export default function CasellaPage() {
  const { user } = useAuth();
  const [, ridisegna] = useState(0);
  const [vista, setVista] = useState('tutto');
  const [svuota, setSvuota] = useState(false);
  const [butta, setButta] = useState(null);

  useEffect(() => subscribe(() => ridisegna((v) => v + 1)), []);

  /* Aprire la casella e' averla letta. La fotografia serve a non far
     sbiadire sotto gli occhi proprio le righe che si era venuti a leggere:
     il "nuovo" che si vede e' quello di quando si e' entrati. */
  const [eranoNuovi] = useState(() => new Set([
    ...getNotificationsForUser(user?.id).filter((n) => !n.read).map((n) => n.id),
    ...getMessaggi(user?.id).filter((m) => !m.letto).map((m) => m.id),
  ]));

  useEffect(() => {
    if (!user?.id) return;
    markNotificationsRead(user.id);
    for (const m of getMessaggi(user.id)) if (!m.letto) segnaMessaggioLetto(m.id);
  }, [user?.id]);

  if (!user) return <PageShell title="Casella" description="Accedi per vedere quello che ti è arrivato." />;

  const avvisi = getNotificationsForUser(user.id).map((n) => ({
    tipo: 'avviso', id: n.id, il: n.createdAt, testo: n.text, kind: n.kind,
  }));
  const lettere = getMessaggi(user.id).map((m) => ({
    tipo: 'lettera', id: m.id, il: m.il, oggetto: m.oggetto, testo: m.testo, daId: m.daId,
  }));

  const tutto = [...avvisi, ...lettere].sort((a, b) => new Date(b.il) - new Date(a.il));
  const elenco = vista === 'tutto'
    ? tutto
    : tutto.filter((v) => (vista === 'lettere' ? v.tipo === 'lettera' : v.tipo === 'avviso'));

  function cambiaGrado(daId, tipo) {
    impostaGrado(user.id, daId, tipo);
    ridisegna((n) => n + 1);
  }

  return (
    <>
      <PageShell
        title="Casella"
        description="Gli avvisi dell’applicazione e i messaggi di chi ti ha cercato, in ordine di arrivo."
        action={avvisi.length > 0 && (
          <button type="button" className="cancel-pill" onClick={() => setSvuota(true)}>
            Svuota gli avvisi
          </button>
        )}
      />

      <div className="ui-corpo-pagina">
        {lettere.length > 0 && (
          <Chips
            items={[
              { id: 'tutto', label: `Tutto (${tutto.length})` },
              { id: 'lettere', label: `Messaggi (${lettere.length})` },
              { id: 'avvisi', label: `Avvisi (${avvisi.length})` },
            ]}
            value={vista}
            onChange={setVista}
            ariaLabel="Che cosa mostrare"
          />
        )}

        {elenco.length === 0 ? (
          <div className="empty-state">Non è arrivato niente.</div>
        ) : (
          <div className="ui-colonna">
            {elenco.map((v) => (v.tipo === 'avviso' ? (
              <div key={v.id} className={`card-row${eranoNuovi.has(v.id) ? ' is-nuovo' : ''}`}>
                <span>{v.testo}</span>
                <small style={{ color: 'var(--text-muted)' }}>{quando(v.il)}</small>
              </div>
            ) : (
              <TerminalPanel
                key={v.id}
                titolo={v.oggetto.toUpperCase()}
                meta={eranoNuovi.has(v.id) ? 'NUOVO' : ''}
                piede={quando(v.il).toUpperCase()}
                className="ui-blocco"
              >
                <p style={{ whiteSpace: 'pre-wrap' }}>{v.testo}</p>
                <div className="oss-scarico">
                  {(() => {
                    const grado = gradoVerso(user.id, v.daId);
                    return (
                      <>
                        <Button
                          variante={grado === 'muto' ? 'secondario' : 'fantasma'}
                          compatto
                          onClick={() => cambiaGrado(v.daId, grado === 'muto' ? null : 'muto')}
                        >
                          {grado === 'muto' ? 'Riattiva le notifiche' : 'Silenzia'}
                        </Button>
                        <Button
                          variante={grado === 'blocco' ? 'secondario' : 'fantasma'}
                          compatto
                          onClick={() => cambiaGrado(v.daId, grado === 'blocco' ? null : 'blocco')}
                        >
                          {grado === 'blocco' ? 'Sblocca' : 'Blocca'}
                        </Button>
                        <Button variante="fantasma" compatto onClick={() => setButta(v)}>Elimina</Button>
                        <small className="ui-dialog-hint">
                          {grado === 'muto' && 'Silenziato: i suoi messaggi arrivano ma non ti avvisano.'}
                          {grado === 'blocco' && 'Bloccato: non può più scriverti, e non gli viene detto.'}
                          {!grado && 'Silenziare toglie l’avviso, bloccare toglie il messaggio.'}
                        </small>
                      </>
                    );
                  })()}
                </div>
              </TerminalPanel>
            )))}
          </div>
        )}

        <p className="ui-dialog-hint">
          Gli avvisi si cancellano da soli dopo tre mesi, e ne restano al massimo gli ultimi
          cinquanta: nessuno scorre indietro fino a lì, e tenerli costa spazio a te. I messaggi no:
          quelli sono corrispondenza, e li butti solo tu.
        </p>
      </div>

      {svuota && (
        <ConfirmDialog
          titolo="Svuotare gli avvisi?"
          testo="Spariscono tutti gli avvisi dell’applicazione. I messaggi che ti hanno scritto restano dove sono."
          conferma="Svuota"
          distruttiva
          onConferma={() => { clearNotificationsForUser(user.id); setSvuota(false); ridisegna((n) => n + 1); }}
          onChiudi={() => setSvuota(false)}
        />
      )}

      {butta && (
        <ConfirmDialog
          titolo="Eliminare questo messaggio?"
          testo="Sparisce dalla tua casella e non si recupera. Chi te l’ha scritto non viene avvisato."
          conferma="Elimina"
          distruttiva
          onConferma={() => { eliminaMessaggio(user.id, butta.id); setButta(null); ridisegna((n) => n + 1); }}
          onChiudi={() => setButta(null)}
        />
      )}

    </>
  );
}
