import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';

/**
 * La guida della schermata: un passo alla volta, con il pezzo di cui si
 * parla acceso e il resto in ombra.
 *
 * Ogni passo ha un `punta` — un selettore — e la guida mette la classe
 * `tc-in-luce` su quell'elemento: e' lui a salire sopra il velo, non un
 * ritaglio disegnato sopra di lui, cosi' resta vero e leggibile e non
 * serve calcolare niente. La scheda con il testo sta in basso; se il
 * pezzo acceso sta nella meta' bassa dello schermo, la scheda va in
 * alto, per non coprirlo.
 *
 * Si chiude con «Ho capito» all'ultimo passo, con «Salta» a qualsiasi
 * passo, o con Esc. Chi la chiude non la rivede da sola: resta il tasto
 * «Come funziona».
 */
export default function Tutorial({ passi, onChiudi }) {
  const [i, setI] = useState(0);
  const scheda = useRef(null);
  const passo = passi[i];
  const ultimo = i === passi.length - 1;

  /* Dove sta la scheda lo decide il pezzo acceso, misurato dopo il disegno:
     e' una classe messa sul nodo, non uno stato, perche' uno stato scritto
     dentro un effetto ridisegnerebbe due volte per niente. */
  useEffect(() => {
    const el = passo.punta ? document.querySelector(passo.punta) : null;
    const carta = scheda.current;
    if (!el) { carta?.classList.remove('is-in-alto'); return undefined; }
    el.classList.add('tc-in-luce');
    el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    const r = el.getBoundingClientRect();
    carta?.classList.toggle('is-in-alto', r.top + r.height / 2 > window.innerHeight / 2);
    return () => el.classList.remove('tc-in-luce');
  }, [passo]);

  useEffect(() => {
    const suTasto = (e) => { if (e.key === 'Escape') onChiudi?.(); };
    window.addEventListener('keydown', suTasto);
    return () => window.removeEventListener('keydown', suTasto);
  }, [onChiudi]);

  return (
    <>
      <div className="tc-guida-velo" aria-hidden="true" />
      <div ref={scheda} className="tc-guida" role="dialog" aria-modal="true" aria-label={`Come funziona, passo ${i + 1} di ${passi.length}: ${passo.titolo}`}>
        <p className="tc-guida-conto">Come funziona · {i + 1} di {passi.length}</p>
        <h3 className="tc-guida-titolo">{passo.titolo}</h3>
        <p className="tc-guida-testo">{passo.testo}</p>
        <div className="tc-guida-azioni">
          <Button variante="fantasma" compatto onClick={onChiudi}>Salta</Button>
          {i > 0 && <Button variante="secondario" compatto onClick={() => setI(i - 1)}>Indietro</Button>}
          <Button variante="primario" compatto onClick={() => (ultimo ? onChiudi() : setI(i + 1))}>{ultimo ? 'Ho capito' : 'Avanti'}</Button>
        </div>
      </div>
    </>
  );
}
