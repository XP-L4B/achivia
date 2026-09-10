import Button from '../ui/Button';
import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows from '../terminal/TerminalRows';

/**
 * Il report di fine giornata.
 *
 * Compare **sopra l'ufficio, senza uscire dalla schermata di gioco**: la
 * stanza resta li' sotto, un po' scurita, e chi legge sa di essere ancora
 * dentro la partita. Cambiare pagina per leggere un consuntivo spezza la
 * giornata in due, e la giornata dopo comincia da un'altra parte invece
 * che dalla stessa porta.
 *
 * La parte che conta non sono i numeri: e' l'elenco delle **conseguenze
 * differite**, cioe' quello che e' tornato indietro oggi da una decisione
 * di giorni fa, con scritto **da che giorno arriva**. E' il pezzo che
 * insegna la lezione del gioco: il disastro del ventiduesimo giorno nasce
 * dalla scelta del quattordicesimo, e se il report non lo dicesse il
 * giocatore imparerebbe solo che il mondo e' arbitrario.
 */

const euro = (v) => `${Math.round(v).toLocaleString('it-IT')} mo`;
const segno = (v) => (v > 0 ? `+${Math.round(v * 10) / 10}` : String(Math.round(v * 10) / 10));

export default function ReportGiornata({ rapporto, onAvanti, ultimo }) {
  if (!rapporto) return null;
  const r = rapporto;
  return (
    <div className="tb-report" role="dialog" aria-modal="true" aria-label={`Report di fine giornata, giorno ${r.giorno}`}>
      <div className="tb-scorre tb-report-foglio">
      <TerminalPanel titolo="Report di fine giornata" meta={`giorno ${r.giorno} · ${r.saldo >= 0 ? 'in attivo' : 'in perdita'}`}>
        <TerminalRows voci={[
          ['Fatturato', euro(r.fatturato)],
          ['Costi', euro(r.costi)],
          ['Saldo del giorno', euro(r.saldo)],
          ['Cassa', euro(r.cassa)],
          ['Produttività', segno(r.cambiato.produttivita)],
          ['Morale', segno(r.cambiato.morale)],
          ['Reputazione', segno(r.cambiato.reputazione)],
          r.scadute ? ['Rimaste senza risposta', String(r.scadute)] : null,
        ]} />
      </TerminalPanel>

      {r.differite.length > 0 && (
        <TerminalPanel titolo="Torna indietro" meta="da quello che hai deciso">
          <ul className="tb-elenco">
            {r.differite.map((d, i) => (
              <li key={i}>
                <b>Dal giorno {d.deciso}:</b> {d.causa}.
                <span className="tv-nota"> {Object.entries(d.cambiato)
                  .filter(([, v]) => Math.abs(v) > 0.05)
                  .map(([k, v]) => `${k} ${segno(v)}`).join(', ')}</span>
              </li>
            ))}
          </ul>
        </TerminalPanel>
      )}

      {r.guai.length > 0 && (
        <TerminalPanel titolo="In officina" meta="oggi">
          <ul className="tb-elenco">{r.guai.map((g, i) => <li key={i}>{g.testo}</li>)}</ul>
        </TerminalPanel>
      )}

      {(r.eventoNuovo || r.eventiFiniti.length > 0) && (
        <TerminalPanel titolo="Nel regno">
          {r.eventoNuovo && (
            <p className="tb-testo"><b>{r.eventoNuovo.nome}.</b> {r.eventoNuovo.racconto}</p>
          )}
          {r.eventiFiniti.map((e) => <p key={e.id} className="tv-nota">È finita: {e.nome}.</p>)}
        </TerminalPanel>
      )}

      <div className="tb-scelte">
        <Button variante="primario" onClick={onAvanti} autoFocus>
          {ultimo ? 'Vedi come è andata' : 'Il giorno dopo'}
        </Button>
      </div>
      </div>
    </div>
  );
}
