import Button from '../ui/Button';
import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows from '../terminal/TerminalRows';
import Carte from './Carte';
import { NOMI } from '../../data/theclimb';

/**
 * Com'e' andata la settimana.
 *
 * Compare sopra la pagina senza uscirne, come il report di The Boss: la
 * vita resta li' sotto e si torna alla stessa settimana, quella dopo.
 *
 * La parte che conta non sono le differenze: e' il **perche'**, riga per
 * riga, con il numero accanto. «Stress +3: essere in rosso e' una tassa
 * fissa sulla testa» insegna qualcosa; «stress +3» no. E' la trasparenza
 * che il gioco promette, e questo e' il posto in cui la mantiene.
 */

const segno = (v) => (v > 0 ? `+${Math.round(v * 10) / 10}` : String(Math.round(v * 10) / 10));
const euro = (v) => `${Math.round(v).toLocaleString('it-IT')} €`;

export default function Riepilogo({ riepilogo, settimaneGiocate = 1, finita = false, onAvanti }) {
  if (!riepilogo) return null;
  const r = riepilogo;
  const cambi = Object.entries(r.cambiato || {})
    .filter(([k, v]) => typeof v === 'number' && Math.abs(v) >= 0.05 && k !== 'hard' && k !== 'soft')
    .map(([k, v]) => ({ id: k, label: NOMI[k] ?? k, valore: k === 'soldi' ? euro(v) : segno(v), tono: v < 0 && k !== 'stress' && k !== 'noia' && k !== 'sonno' ? 'errore' : '' }));
  const competenze = Object.entries({ ...(r.cambiato?.hard || {}), ...(r.cambiato?.soft || {}) })
    .filter(([, v]) => Math.abs(v) >= 0.05)
    .map(([k, v]) => ({ id: k, label: k.replace(/_/g, ' '), valore: segno(v) }));

  return (
    <div className="tc-riepilogo" role="dialog" aria-modal="true" aria-label={`Riepilogo della settimana ${r.settimana}`}>
      <div className="tc-scorre tc-foglio">
        <TerminalPanel
          titolo={settimaneGiocate > 1 ? `${settimaneGiocate} settimane con la routine` : `Settimana ${r.settimana}`}
          meta={r.energia ? `energia ${r.energia.chiesta}/${r.energia.avuta}${r.energia.sforo ? ` · sforata di ${r.energia.sforo}` : ''}` : undefined}
        >
          {cambi.length > 0 ? <TerminalRows voci={cambi} /> : <p className="tv-nota">Niente si è mosso in modo visibile.</p>}
          {competenze.length > 0 && (
            <>
              <div className="tv-riga" aria-hidden="true" />
              <TerminalRows voci={competenze} />
            </>
          )}
        </TerminalPanel>

        {r.perche?.length > 0 && (
          <TerminalPanel titolo="Perché" meta="riga per riga">
            <ul className="tc-elenco">
              {r.perche.map((p, i) => (
                <li key={i}>
                  <b>{NOMI[p.cosa] ?? p.cosa}{typeof p.quanto === 'number' ? ` ${p.cosa === 'soldi' ? euro(p.quanto) : segno(p.quanto)}` : ''}:</b> {p.testo}
                </li>
              ))}
            </ul>
          </TerminalPanel>
        )}

        {r.valutazione && (
          <TerminalPanel
            titolo={r.valutazione.tipo === 'consiglio' ? 'Il consiglio di amministrazione' : r.valutazione.tipo === 'valutazione' ? (r.valutazione.promosso ? 'Promosso' : 'Non promosso') : r.valutazione.tipo === 'tetto' ? 'Il tetto' : r.valutazione.tipo === 'licenziamento' ? 'A casa' : 'Riorganizzazione'}
            meta="perché"
            tonoPiede={r.valutazione.promosso ? '' : 'attesa'}
          >
            <p className="tc-riga-testo">{r.valutazione.testo}</p>
            <Carte carte={r.valutazione.carte} />
            {r.valutazione.domande?.length > 0 && (
              <ul className="tc-elenco"><li className="tv-nota">Le domande del consiglio vengono da come hai giocato:</li>{r.valutazione.domande.map((d, i) => <li key={i}><i>{d.domanda}</i></li>)}</ul>
            )}
            {r.valutazione.caso && r.valutazione.carte?.every((c) => c.ok) && (
              <p className="tv-nota">Il caso: un posto c’era con {r.valutazione.caso.posti} probabilità su cento, e {r.valutazione.caso.aperto ? 'c’era' : 'non c’era'}.</p>
            )}
            {r.valutazione.lezione && <p className="tc-lezione">{r.valutazione.lezione}</p>}
          </TerminalPanel>
        )}

        {r.conti && (
          <TerminalPanel titolo="Fine mese" meta={r.conti.saldo >= 0 ? 'in attivo' : 'in perdita'}>
            <TerminalRows voci={[
              ['Stipendio', euro(r.conti.stipendio)],
              ['Affitto', euro(-r.conti.affitto)],
              ['Spese', euro(-r.conti.spese)],
              r.conti.rimesse ? ['A casa', euro(-r.conti.rimesse)] : null,
              r.conti.percorso ? ['Il percorso', euro(-r.conti.percorso)] : null,
              r.conti.interessi ? ['Interessi sul debito', euro(-r.conti.interessi)] : null,
              { id: 'saldo', label: 'Saldo del mese', valore: euro(r.conti.saldo), tono: r.conti.saldo < 0 ? 'errore' : '' },
            ]} />
          </TerminalPanel>
        )}

        {r.eventi?.length > 0 && (
          <p className="tv-nota">{r.eventi.length === 1 ? 'È successa una cosa' : 'Sono successe due cose'}: {r.eventi.map((e) => e.titolo).join(', ')}. La leggi subito dopo.</p>
        )}

        {r.segnali?.length > 0 && (
          <TerminalPanel titolo="Segnali" meta="ascoltali" tonoPiede="attesa">
            <ul className="tc-elenco">
              {r.segnali.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </TerminalPanel>
        )}

        <div className="tc-azioni">
          <Button variante="primario" onClick={onAvanti}>{finita ? 'Vedi come è finita' : 'Settimana dopo'}</Button>
        </div>
      </div>
    </div>
  );
}
