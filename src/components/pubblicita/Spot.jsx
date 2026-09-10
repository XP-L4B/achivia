import { useEffect, useState } from 'react';
import useFinestra from '../../hooks/useFinestra';
import Button from '../ui/Button';
import { segnaVista, secondiSpot } from '../../data/db';

/**
 * Lo spot: la pubblicita' che parte quando si assegna una quest.
 *
 * Solo sullo Standard. E' la meta' scomoda del piano gratuito, e la
 * scomodita' e' il punto: si mette in mezzo a un gesto di lavoro, e per
 * qualche secondo non si puo' chiudere. Il conto alla rovescia si vede —
 * un'attesa dichiarata si sopporta, una muta no — e passato quello si
 * chiude e si va avanti.
 *
 * Quanti secondi lo dice il Castello (`secondiSpot`): e' il numero che
 * decide se questo piano e' fastidioso o inaccettabile, e va potuto
 * cambiare guardando quanta gente sale di piano e quanta se ne va.
 *
 * Chi apre lo spot decide se aprirlo: qui non si guarda il piano. Lo fa
 * `useSpot`, che sta in fondo a questo file, cosi' una schermata che assegna
 * una quest scrive una riga sola.
 */
export default function Spot({ reclame, onChiudi }) {
  // La durata si legge una volta, all'apertura: cambiarla dal Castello
  // mentre uno spot e' aperto non deve allungare quello che sta gia'
  // correndo.
  const [restano, setRestano] = useState(() => secondiSpot());
  const finestra = useFinestra(restano === 0, onChiudi);

  useEffect(() => {
    if (reclame) segnaVista(reclame.id);
  }, [reclame]);

  useEffect(() => {
    if (restano === 0) return undefined;
    const t = setTimeout(() => setRestano((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [restano]);

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label="Pubblicità">
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog is-stretta pub-spot">
        <span className="pub-etichetta">Pubblicità</span>
        {reclame ? (
          <>
            <b className="pub-titolo">{reclame.titolo}</b>
            {reclame.testo && <p className="pub-testo">{reclame.testo}</p>}
            {reclame.collegamento && (
              <a
                className="pub-collegamento"
                href={reclame.collegamento}
                target="_blank"
                rel="noreferrer noopener"
              >
                Vai
              </a>
            )}
          </>
        ) : (
          <>
            <b className="pub-titolo">Spazio pubblicitario</b>
            <p className="pub-testo">
              Con un piano a pagamento questo non parte a ogni quest che assegni.
            </p>
          </>
        )}
        <div className="ui-dialog-actions">
          <Button variante="primario" disabled={restano > 0} onClick={onChiudi}>
            {restano > 0 ? `Attendi ${restano}` : 'Continua'}
          </Button>
        </div>
      </div>
    </div>
  );
}
