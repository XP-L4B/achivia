import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import { identitaViste, MOTIVI_IDENTITA } from '../../data/castello';

const quando = (iso) => (iso
  ? new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—');

/**
 * CHI HA GUARDATO — il registro delle occhiate all'identità.
 *
 * Ogni volta che dal CRM si chiede il nome e il cognome di qualcuno, qui
 * resta una riga: chi, di chi, quando, e per quale motivo. Il registro non
 * si cancella e non si modifica: se si potesse, non sarebbe un registro.
 *
 * A che serve, in pratica: a rispondere alla domanda "chi ha visto i miei
 * dati" senza doverci pensare, che e' una domanda che una persona ha il
 * diritto di fare. E, in secondo luogo, a tenere onesto chi guarda —
 * compreso chi ha scritto questa pagina.
 */
export default function AccessiPage() {
  const righe = identitaViste();
  const perMotivo = MOTIVI_IDENTITA.map((m) => ({
    id: m.id,
    label: m.nome,
    valore: cifra(righe.filter((r) => r.motivo === m.id).length),
  }));

  return (
    <>
      <PageShell
        title="Chi ha guardato"
        description="Ogni richiesta di vedere il nome di qualcuno lascia una riga qui. Non si cancella."
      />

      <div className="ui-blocco con-stacco">
        <TerminalPanel titolo="PER MOTIVO" meta={`${cifra(righe.length)} in tutto`}>
          <TerminalRows voci={perMotivo} />
        </TerminalPanel>

        <TerminalPanel titolo="LE OCCHIATE" meta={`${cifra(righe.length)}`}>
          {righe.length === 0 ? (
            <p className="tv-vuoto">Nessuno ha ancora chiesto di vedere l’identità di nessuno.</p>
          ) : (
            righe.slice(0, 100).map((r) => (
              <section key={r.id} className="cas-scheda">
                <header className="cas-scheda-testa">
                  <b>{r.numero}</b>
                  <small>{quando(r.quando)}</small>
                </header>
                <TerminalRows
                  voci={[
                    ['Motivo', r.motivoNome],
                    r.nota ? ['Nota', r.nota] : null,
                  ].filter(Boolean)}
                />
              </section>
            ))
          )}
          {righe.length > 100 && (
            <p className="tv-nota">Le ultime cento. Le altre restano scritte.</p>
          )}
        </TerminalPanel>
      </div>

      <BackTile />
    </>
  );
}
