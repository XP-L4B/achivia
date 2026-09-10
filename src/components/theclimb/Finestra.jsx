import { useEffect } from 'react';
import Button from '../ui/Button';

/**
 * Una finestra sopra la stanza: il modo in cui Tabboz apriva la scuola,
 * il bar, il negozio. Un titolo con la barra rigata, la crocetta per
 * chiudere, dentro il pannello che prima stava in fila nella pagina.
 *
 * Si chiude con la crocetta, con Esc, o toccando fuori. Non e' un
 * dialogo che aspetta una risposta — quelli sono l'evento e il
 * riepilogo, e non si chiudono senza rispondere — ma una stanza in cui
 * si entra e da cui si esce: per questo il fondo scuro e' meno fitto e
 * la finestra sta in alto, non al centro, cosi' su un telefono la fila
 * dei tasti resta sotto il pollice.
 *
 * Le tacche a squadra arrivano da `terminal.css`: una finestra nuova
 * nasce con gli angoli del terminale.
 */
export default function Finestra({ titolo, meta, onChiudi, children, azioni }) {
  useEffect(() => {
    const suTasto = (e) => { if (e.key === 'Escape') onChiudi?.(); };
    window.addEventListener('keydown', suTasto);
    return () => window.removeEventListener('keydown', suTasto);
  }, [onChiudi]);

  return (
    <div className="tc-riepilogo tc-sopra" role="presentation" onClick={onChiudi}>
      <div className="tc-finestra" role="dialog" aria-modal="true" aria-label={titolo} onClick={(e) => e.stopPropagation()}>
        <div className="tc-finestra-testa">
          <span className="tc-finestra-righe" aria-hidden="true" />
          <b className="tc-finestra-titolo">{titolo}</b>
          {meta && <small className="tc-finestra-meta">{meta}</small>}
          <button type="button" className="tc-finestra-chiudi" onClick={onChiudi} aria-label="Chiudi">×</button>
        </div>
        <div className="tc-finestra-corpo tc-scorre">
          {children}
        </div>
        <div className="tc-finestra-piede tc-azioni">
          {azioni}
          <Button variante="fantasma" onClick={onChiudi}>Chiudi</Button>
        </div>
      </div>
    </div>
  );
}
