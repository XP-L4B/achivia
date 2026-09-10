import { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

/**
 * Ogni pagina si apre dalla cima.
 *
 * Senza questo, cambiando pagina il browser lascia la finestra dove stava:
 * si arriva a meta' di una schermata nuova, con il titolo gia' passato di
 * sopra, e sembra che la pagina si sia caricata male. E' il comportamento
 * normale di un'app a pagina unica — il documento non viene ricaricato,
 * quindi non c'e' niente che riporti su.
 *
 * Si guarda solo il percorso: cambiare scheda, filtro o finestra dentro una
 * pagina non cambia il percorso, e chi sta leggendo a meta' schermata non
 * viene riportato in cima per un clic su un filtro. Un indirizzo con
 * l'ancora (`#qualcosa`) chiede un punto preciso della pagina, e allora si
 * lascia stare.
 *
 * Sta prima del disegno (`useLayoutEffect`), cosi' la pagina nuova non si
 * vede mai comparire alla vecchia altezza per un fotogramma.
 */
export default function InCima() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) return;
    // `instant`: qui non c'e' niente da accompagnare, e' una pagina nuova.
    // Chi ha chiesto di fermare le animazioni non vedrebbe comunque
    // scorrere niente, e questo non e' un movimento ma un punto di
    // partenza.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return <Outlet />;
}
