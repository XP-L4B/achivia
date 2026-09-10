import useFinestra from '../../hooks/useFinestra';
import Button from '../../components/ui/Button';

/**
 * La finestra con un modulo dentro, per il Castello.
 *
 * Le finestre dell'applicazione sono tre — conferma, richiesta di un testo,
 * scelta di un periodo — e nessuna delle tre serve a compilare otto campi.
 * Questa e' la quarta, e prende dalle altre tutto quello che c'e' da
 * prendere: la stessa cornice, lo stesso fondale, Esc che chiude, il fuoco
 * che entra e il Tab che resta dentro.
 */
export default function ModuloFinestra({ titolo, nota, conferma = 'Salva', onSalva, onChiudi, children }) {
  const finestra = useFinestra(true, onChiudi);
  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label={titolo}>
      <form
        ref={finestra}
        tabIndex={-1}
        className="px-panel ui-dialog"
        onSubmit={(e) => { e.preventDefault(); onSalva(); }}
      >
        <b>{titolo}</b>
        {nota && <p className="ui-dialog-hint">{nota}</p>}
        {children}
        <div className="ui-dialog-actions">
          <Button type="submit" variante="primario">{conferma}</Button>
          <Button variante="fantasma" onClick={onChiudi}>Annulla</Button>
        </div>
      </form>
    </div>
  );
}
