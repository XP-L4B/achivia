import { useState } from 'react';
import useFinestra from '../../hooks/useFinestra';
import Button from './Button';

/**
 * Come ConfirmDialog, ma chiede anche di scrivere qualcosa: e' il rimpiazzo di
 * `window.prompt`, che oltre ad arrivare da fuori non sapeva dire quando una
 * risposta non andava bene — accettava anche il vuoto, e chi chiamava doveva
 * accorgersene dopo.
 *
 * Con `obbligatorio` il pulsante resta spento finche' il campo e' vuoto, e il
 * perche' e' scritto sotto al campo invece che immaginato.
 */
export default function PromptDialog({
  titolo,
  testo,
  etichetta,
  valoreIniziale = '',
  segnaposto = '',
  righe = 3,
  obbligatorio = false,
  conferma = 'Conferma',
  onConferma,
  onChiudi,
}) {
  const [valore, setValore] = useState(valoreIniziale);
  const finestra = useFinestra(true, onChiudi);
  const vuoto = obbligatorio && !valore.trim();

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label={titolo}>
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog is-stretta">
        <b>{titolo}</b>
        {testo && <p className="ui-dialog-hint">{testo}</p>}

        <label className="label">
          {etichetta}
          {righe > 1 ? (
            <textarea
              rows={righe}
              value={valore}
              onChange={(e) => setValore(e.target.value)}
              placeholder={segnaposto}
              style={{ width: '100%', fontFamily: "'Press Start 2P', monospace", fontSize: 'var(--t-s)', lineHeight: 1.6 }}
            />
          ) : (
            <input value={valore} onChange={(e) => setValore(e.target.value)} placeholder={segnaposto} />
          )}
        </label>

        {vuoto && (
          <p className="ui-errore" role="alert">Serve scrivere qualcosa per continuare.</p>
        )}

        <div className="ui-dialog-actions">
          <Button variante="primario" disabled={vuoto} onClick={() => onConferma(valore.trim())}>
            {conferma}
          </Button>
          <Button variante="fantasma" onClick={onChiudi}>Annulla</Button>
        </div>
      </div>
    </div>
  );
}
