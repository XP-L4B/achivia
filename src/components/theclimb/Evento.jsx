import Button from '../ui/Button';
import TerminalPanel from '../terminal/TerminalPanel';

/**
 * Un evento: che cosa e' successo, e che cosa fai.
 *
 * Compare sopra la pagina e non si chiude senza rispondere: la settimana
 * dopo non comincia finche' quello che e' successo aspetta. Le opzioni
 * che questa vita non ha si vedono spente, con il perche' accanto —
 * «servono almeno 3.000 €», «per chi parte da qui questa porta non
 * c'e'» — e una porta chiusa del tutto e' un evento con una risposta
 * sola: prenderne atto.
 *
 * Gli effetti non si scrivono sull'opzione: si leggono dopo, nel
 * riepilogo. Scriverli prima trasformerebbe una scelta in un calcolo.
 */

const NOME_CATEGORIA = { imprevisto: 'un imprevisto', opportunita: 'un’occasione', vita: 'la vita', bivio: 'un bivio' };

export default function Evento({ evento, onRispondi }) {
  if (!evento) return null;
  return (
    <div className="tc-riepilogo" role="dialog" aria-modal="true" aria-label={`Evento: ${evento.titolo}`}>
      <div className="tc-scorre tc-foglio">
        <TerminalPanel titolo={evento.titolo} meta={`settimana ${evento.s} · ${NOME_CATEGORIA[evento.categoria] ?? evento.categoria}`} tonoPiede={evento.chiusa ? 'attesa' : ''}>
          <p className="tc-riga-testo">{evento.testo}</p>
          {!evento.chiusa && evento.categoria === 'opportunita' && evento.salto && (
            <p className="tv-nota">Un’occasione. Chi le lascia cadere viene chiamato di meno; chi si lancia, di più. Essere prudenti costa anche quello.</p>
          )}
          {evento.chiusa && <p className="tc-lezione">Questa porta, per chi parte da dove parti tu, non c’è. La vedi lo stesso: fa parte del gioco.</p>}
          {!evento.chiusa && evento.lezione && <p className="tc-lezione">{evento.lezione}</p>}
          <div className="tc-opzioni">
            {evento.opzioni.map((o) => (
              <span key={o.id} className="tc-opzione">
                {/* Nessuna opzione e' quella consigliata: la predefinita e' la
                    prudente, quella che vale se non si decide, e il salto e'
                    segnato come salto. Scegliere e' il gioco. */}
                <Button
                  variante="secondario"
                  disabled={!o.disponibile}
                  onClick={() => onRispondi(evento.id, o.id)}
                >
                  {o.testo}
                  {o.audace && <small className="tc-tag"> · un salto</small>}
                  {!evento.chiusa && o.id === evento.predefinita && evento.opzioni.length > 1 && <small className="tc-tag"> · prudente</small>}
                </Button>
                {!o.disponibile && o.perche && <small className="tc-mossa-perche">{o.perche}</small>}
              </span>
            ))}
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
}
