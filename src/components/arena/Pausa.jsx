import Button from '../ui/Button';
import { tempoLeggibile } from '../../data/arena';

/**
 * La pausa: due porte.
 *
 * Prima era una scritta e basta, e per uscire da una partita in corso non
 * c'era nessuna strada — solo morire, o chiudere la scheda del browser
 * buttando via quello che si era fatto. Adesso si riprende o si esce, e
 * uscendo la partita si chiude qui: il tempo, i nemici e il livello di
 * questo momento vengono registrati come una partita finita.
 *
 * Non e' un modo per barare. In classifica conta la partita migliore del
 * periodo, quindi uscire prima non fa altro che chiudere con un risultato
 * piu' basso; quello che evita e' di perdere dodici minuti di gioco
 * perche' e' suonato il telefono.
 */
export default function Pausa({ hud, onRiprendi, onEsci }) {
  return (
    <div className="arena-velo" role="dialog" aria-modal="true" aria-labelledby="arena-pausa-titolo">
      <section className="tv-panel arena-pausa">
        <header className="tv-testa">
          <span className="tv-prompt" aria-hidden="true">&gt;&gt;</span>
          <h2 className="tv-titolo" id="arena-pausa-titolo">In pausa</h2>
          <span className="tv-meta">{tempoLeggibile(hud?.tempo ?? 0)}</span>
        </header>
        <div className="tv-riga-doppia" aria-hidden="true" />
        <p className="tv-nota">
          Le ondate aspettano. Se esci, la partita si chiude qui e quello che hai fatto resta:
          {' '}{hud?.uccisioni ?? 0} nemici, livello {hud?.livello ?? 1}.
        </p>
        <div className="arena-esito-azioni">
          <Button variante="primario" onClick={onRiprendi}>Riprendi</Button>
          <Button variante="fantasma" onClick={onEsci}>Esci dalla partita</Button>
        </div>
      </section>
    </div>
  );
}
