import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { eUnPezzoMancante, riprendiIPezzi } from '../lib/pezziMancanti';

/**
 * La schermata che prende il posto dell'errore secco del router.
 *
 * Ci si arriva quasi sempre per un motivo solo, ed e' innocuo: l'app era
 * aperta da prima dell'ultima pubblicazione e ha chiesto un pezzo che sul
 * server non c'e' piu' (il perche' sta in `lib/pezziMancanti.js`). In quel
 * caso ricarica da sola e questa schermata nessuno la vede: resta accesa
 * un istante, il tempo di far partire la ricarica.
 *
 * Quando invece l'errore e' un altro — o quando ricaricare non ha
 * funzionato — allora si vede, e dice le due cose che servono: che si e'
 * rotto qualcosa e come tornare indietro. Meglio di «Unexpected
 * Application Error».
 */
export default function PezzoMancante() {
  const errore = useRouteError();
  const vecchia = eUnPezzoMancante(errore);

  useEffect(() => {
    if (vecchia) riprendiIPezzi();
  }, [vecchia]);

  return (
    <div className="page" style={{ padding: 'var(--space-4)' }}>
      <div className="ui-tile" style={{ padding: 'var(--space-4)', background: 'var(--tv-vetro)' }}>
        <h1 className="tv-titolo" style={{ marginTop: 0 }}>
          {vecchia ? 'Aggiorno Achivia…' : 'Qualcosa si è rotto'}
        </h1>
        <p className="tv-nota">
          {vecchia
            ? 'C’è una versione nuova. Sto ricaricando la pagina: se non succede da sola, tocca «Ricarica».'
            : 'Non sono riuscito ad aprire questa schermata. Ricaricare di solito basta.'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button type="button" className="ui-btn" onClick={() => window.location.reload()}>Ricarica</button>
          <button
            type="button"
            className="ui-btn"
            onClick={() => { window.location.href = import.meta.env.BASE_URL; }}
          >
            Torna all’inizio
          </button>
        </div>
      </div>
    </div>
  );
}
