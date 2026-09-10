import { useEffect, useRef } from 'react';
import { creaMotore } from '../../game/motore';

/**
 * La tela: il canvas e il ciclo di vita del motore, e niente altro.
 *
 * React monta il canvas, crea il motore e poi non si sveglia piu' fino a
 * fine partita: ogni fotogramma lo disegna il motore da solo. Le tre
 * chiamate verso l'alto — cruscotto, scelta, fine — arrivano attraverso le
 * funzioni passate qui, che si tengono in un riferimento cosi' un nuovo
 * disegno della pagina non ricrea la partita.
 *
 * In sviluppo `StrictMode` monta due volte: la pulizia ferma il ciclo e
 * stacca gli ascoltatori, e il motore che stava ancora caricando le
 * immagini non parte se nel frattempo e' stato smontato.
 */
export default function Tela({ personaggio, livello, moduliGratis, seme, onMotore, onHud, onScelta, onFine, onPausa }) {
  const tela = useRef(null);
  const richiami = useRef({ onMotore, onHud, onScelta, onFine, onPausa });
  useEffect(() => {
    richiami.current = { onMotore, onHud, onScelta, onFine, onPausa };
  });

  useEffect(() => {
    const canvas = tela.current;
    if (!canvas) return undefined;
    let vivo = true;
    const motore = creaMotore({
      canvas,
      personaggio,
      livello,
      moduliGratis,
      seme,
      onHud: (f) => richiami.current.onHud?.(f),
      onScelta: (o, motivo) => richiami.current.onScelta?.(o, motivo),
      onFine: (r) => richiami.current.onFine?.(r),
      onPausa: (v) => richiami.current.onPausa?.(v),
    });
    richiami.current.onMotore?.(motore);
    motore.pronto.then(() => { if (vivo) motore.avvia(); });
    return () => {
      vivo = false;
      motore.ferma();
      richiami.current.onMotore?.(null);
    };
  }, [personaggio, livello, moduliGratis, seme]);

  return <canvas ref={tela} className="arena-tela" aria-label="L’arena" />;
}
