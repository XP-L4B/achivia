import { useEffect, useRef } from 'react';

/* Quello che, dentro una finestra, si puo' raggiungere con il Tab. */
const RAGGIUNGIBILI =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), '
  + 'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Le tre cose che una finestra deve fare con la tastiera, e che nessuna delle
 * dodici finestre di Achivia faceva.
 *
 *   Esc la chiude, come ci si aspetta ovunque.
 *   All'apertura il fuoco entra dentro: senza, resta sulla pagina sotto e chi
 *     non vede lo schermo non sa nemmeno che qualcosa si e' aperto.
 *   Il Tab gira dentro la finestra invece di uscirne. Una finestra dichiarata
 *     `aria-modal` promette proprio questo: che dietro non si arrivi. Finora
 *     lo prometteva e basta.
 *
 * Alla chiusura il fuoco torna dove stava, cosi' chi navigava da tastiera
 * riprende dal punto in cui aveva aperto invece che dall'inizio della pagina.
 *
 * Restituisce il riferimento da mettere sul pannello della finestra, che va
 * anche reso raggiungibile con `tabIndex={-1}`.
 */
export default function useFinestra(aperta, onChiudi) {
  const pannello = useRef(null);
  // La funzione di chiusura cambia identita' a ogni disegno perche' i
  // chiamanti la scrivono in linea: tenerla in un riferimento evita che
  // l'effetto riparta di continuo, rubando il fuoco mentre si scrive.
  const chiudi = useRef(onChiudi);
  useEffect(() => { chiudi.current = onChiudi; });

  useEffect(() => {
    if (!aperta) return undefined;
    const prima = document.activeElement;
    pannello.current?.focus();

    const suTasto = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        chiudi.current?.();
        return;
      }
      if (e.key !== 'Tab' || !pannello.current) return;

      const dentro = [...pannello.current.querySelectorAll(RAGGIUNGIBILI)]
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (dentro.length === 0) {
        // Una finestra senza comandi: il fuoco resta sul pannello.
        e.preventDefault();
        pannello.current.focus();
        return;
      }
      const primo = dentro[0];
      const ultimo = dentro[dentro.length - 1];
      const corrente = document.activeElement;
      if (!e.shiftKey && (corrente === ultimo || !pannello.current.contains(corrente))) {
        e.preventDefault();
        primo.focus();
      } else if (e.shiftKey && (corrente === primo || !pannello.current.contains(corrente))) {
        e.preventDefault();
        ultimo.focus();
      }
    };

    document.addEventListener('keydown', suTasto, true);
    return () => {
      document.removeEventListener('keydown', suTasto, true);
      // Torna dove si era: se nel frattempo quel comando e' sparito, pazienza.
      if (prima && typeof prima.focus === 'function' && document.contains(prima)) prima.focus();
    };
  }, [aperta]);

  return pannello;
}
