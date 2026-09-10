import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { guidaPer } from '../../data/helpContents';

/**
 * Il "?" della guida contestuale.
 *
 * Non gli si dice di quale schermata parlare: lo capisce dal percorso in cui
 * si trova. Cosi' non c'e' niente da tenere allineato fra pagine e testi, e
 * una schermata senza guida semplicemente non mostra il pulsante — meglio
 * niente che un pannello vuoto.
 *
 * Il pannello si apre sotto al pulsante e non e' una finestra modale: non
 * copre la schermata e non chiede di essere chiuso prima di continuare. Si
 * chiude con Esc, con un tocco fuori o con la ×, e chi non lo vuole non lo
 * apre mai.
 */
export default function HelpButton() {
  const { pathname } = useLocation();
  const [aperto, setAperto] = useState(false);
  const contenitore = useRef(null);
  const pannello = useRef(null);
  const bottone = useRef(null);
  // Da che parte si apre il pannello, e quanto puo' essere largo. Non sono
  // preferenze estetiche: il "?" non sta sempre nello stesso angolo — nella
  // pillola del titolo e' a destra, nel profilo a sinistra perche' a destra
  // c'e' gia' l'icona dei messaggi — e un pannello che si apre sempre dalla
  // stessa parte, prima o poi, finisce fuori dallo schermo.
  const [posa, setPosa] = useState({ verso: 'destra', largo: null });

  const guida = guidaPer(pathname);

  const MARGINE = 14;          // lo stesso respiro che tengono i pannelli
  const LARGO_MAX = 320;

  function apriChiudi() {
    if (!aperto) {
      const r = bottone.current?.getBoundingClientRect();
      const schermo = typeof window !== 'undefined' ? window.innerWidth : 0;
      if (r && schermo) {
        // Si apre verso il centro: dal pulsante a sinistra il pannello va a
        // destra, e viceversa. E' il lato che ha piu' spazio.
        const verso = r.left + r.width / 2 < schermo / 2 ? 'sinistra' : 'destra';
        // Poi si stringe fino a quanto spazio c'e' davvero da quella parte.
        // Serve al caso in cui il pulsante finisse vicino al centro di uno
        // schermo stretto: li' nessun lato basterebbe, e senza questo il
        // pannello uscirebbe comunque.
        const spazio = verso === 'sinistra' ? schermo - r.left - MARGINE : r.right - MARGINE;
        setPosa({ verso, largo: Math.max(180, Math.min(LARGO_MAX, Math.round(spazio))) });
      }
    }
    setAperto((v) => !v);
  }

  useEffect(() => {
    if (!aperto) return undefined;
    // Il pannello prende il fuoco: chi naviga da tastiera ci arriva subito, e
    // da li' Esc o Tab lo riportano dove stava.
    pannello.current?.focus();
    const suTasto = (e) => { if (e.key === 'Escape') setAperto(false); };
    const suClic = (e) => {
      if (!contenitore.current?.contains(e.target)) setAperto(false);
    };
    document.addEventListener('keydown', suTasto);
    document.addEventListener('pointerdown', suClic);
    return () => {
      document.removeEventListener('keydown', suTasto);
      document.removeEventListener('pointerdown', suClic);
    };
  }, [aperto]);

  // Cambiando schermata il pannello non deve restare aperto sul testo di
  // prima: si azzera durante il disegno, non dopo, cosi' non si vede un
  // istante di guida sbagliata.
  const [percorsoVisto, setPercorsoVisto] = useState(pathname);
  if (percorsoVisto !== pathname) {
    setPercorsoVisto(pathname);
    setAperto(false);
  }

  if (!guida) return null;

  return (
    <div className="ui-help" ref={contenitore}>
      <button
        type="button"
        ref={bottone}
        className={`ui-help-btn${aperto ? ' is-aperto' : ''}`}
        aria-label="Scopri di più su questa schermata"
        aria-expanded={aperto}
        onClick={apriChiudi}
      >
        ?
      </button>

      {aperto && (
        <div
          className={`ui-help-pannello is-${posa.verso}`}
          style={posa.largo ? { maxWidth: posa.largo } : undefined}
          ref={pannello}
          tabIndex={-1}
          role="dialog"
          aria-label={`Guida: ${guida.titolo}`}
        >
          <div className="ui-help-testa">
            <b>{guida.titolo}</b>
            <button type="button" className="ui-help-chiudi" aria-label="Chiudi la guida" onClick={() => setAperto(false)}>
              ×
            </button>
          </div>

          <p className="ui-help-testo">{guida.testo}</p>

          {guida.azioni?.length > 0 && (
            <>
              <p className="ui-help-etichetta">Cosa puoi fare</p>
              <ul className="ui-help-azioni">
                {guida.azioni.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </>
          )}

          {guida.consiglio && <p className="ui-help-consiglio">{guida.consiglio}</p>}
        </div>
      )}
    </div>
  );
}
