import { useState } from 'react';
import useFinestra from '../../hooks/useFinestra';
import { giornoIso, inizioDi } from './periodi';

const sfondoFinestra = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)',
};

/**
 * Scelta di una finestra temporale a mano: due date, nessuna delle due nel
 * futuro e la prima non dopo la seconda. Conferma solo quando l'intervallo
 * ha senso, cosi' non si finisce su griglie vuote senza capire perche'.
 *
 * La usano le griglie di una persona e quelle dell'organizzazione: e' la
 * stessa domanda, e va fatta nello stesso modo.
 */
export default function FinestraPeriodo({ iniziale, oggi, onConferma, onChiudi }) {
  const finestra = useFinestra(true, onChiudi);
  const [da, setDa] = useState(iniziale?.da || giornoIso(oggi - 29 * 86400000));
  const [a, setA] = useState(iniziale?.a || giornoIso(oggi));
  const limite = giornoIso(oggi);
  const errore = !da || !a ? 'Servono tutte e due le date.'
    : inizioDi(da) > inizioDi(a) ? 'La data di inizio viene dopo quella di fine.'
    : '';

  return (
    <div style={sfondoFinestra} role="dialog" aria-modal="true" aria-label="Finestra temporale">
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog is-stretta" onClick={(e) => e.stopPropagation()}>
        <b>Finestra personalizzata</b>
        <p className="ui-dialog-hint">
          I dati contano le quest concluse fra le due date, comprese.
        </p>
        <label className="label">Dal
          <input
            type="date"
            value={da}
            max={limite}
            aria-describedby={errore ? 'errore-finestra' : undefined}
            onChange={(e) => setDa(e.target.value)}
          />
        </label>
        <label className="label">Al
          <input
            type="date"
            value={a}
            min={da || undefined}
            max={limite}
            aria-describedby={errore ? 'errore-finestra' : undefined}
            onChange={(e) => setA(e.target.value)}
          />
        </label>
        {errore && <p className="ui-errore" role="alert" id="errore-finestra">{errore}</p>}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <button type="button" className="confirm-pill" disabled={Boolean(errore)} onClick={() => onConferma({ da, a })}>
            Applica
          </button>
          <button type="button" className="cancel-pill" onClick={onChiudi}>Annulla</button>
        </div>
      </div>
    </div>
  );
}
