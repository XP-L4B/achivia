import useFinestra from '../../hooks/useFinestra';
import Button from './Button';

/**
 * La finestra di conferma dell'app, al posto di quella del browser.
 *
 * `window.confirm` funzionava, ma arrivava da fuori: carattere di sistema,
 * pulsanti in inglese o in un'altra lingua a seconda del telefono, e nessun
 * modo di dire quali conseguenze ha un sì. Qui il testo puo' spiegarle, e
 * un'azione che cancella qualcosa si vede che cancella qualcosa.
 *
 * Come le altre finestre: Esc chiude, il fuoco entra e il Tab resta dentro.
 */
export default function ConfirmDialog({
  titolo,
  testo,
  conferma = 'Conferma',
  annulla = 'Annulla',
  // Quando il sì cancella qualcosa, il pulsante lo dice anche col colore:
  // il testo spiega le conseguenze, ma le conseguenze si devono vedere
  // prima di leggere.
  distruttiva = false,
  onConferma,
  onChiudi,
}) {
  const finestra = useFinestra(true, onChiudi);

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label={titolo}>
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog is-stretta">
        <b>{titolo}</b>
        {testo && <p className="ui-dialog-hint">{testo}</p>}
        <div className="ui-dialog-actions">
          <Button variante={distruttiva ? 'pericolo' : 'primario'} onClick={onConferma}>{conferma}</Button>
          <Button variante="fantasma" onClick={onChiudi}>{annulla}</Button>
        </div>
      </div>
    </div>
  );
}
