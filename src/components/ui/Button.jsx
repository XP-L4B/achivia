import { Link } from 'react-router-dom';

/**
 * Il pulsante dell'app.
 *
 * Le regole grafiche stanno in `buttons.css` e valgono anche per i nomi di
 * classe che le pagine usavano prima (`px-btn`, `confirm-pill`, ...): questo
 * componente non porta un aspetto suo, porta i nomi giusti. Serve a scrivere
 * codice nuovo senza doversi ricordare quale classe fosse quella buona, e a
 * dire in una parola che ruolo ha il pulsante.
 *
 * Le varianti:
 *   primario     l'azione per cui si e' aperta la schermata
 *   secondario   importante, ma non e' il motivo per cui si e' arrivati qui
 *   fantasma     azioni di contorno (annulla, chiudi)
 *   pericolo     cancellare, revocare, azzerare
 *   successo     certificare, approvare — dove il verde dice qualcosa
 *
 * Con `to` diventa un collegamento, con `onClick` un pulsante: la stessa
 * distinzione che fanno gia' `Tile` e `TerminalPanel`, e serve perche' una
 * cosa che porta altrove deve essere un link anche per chi naviga da
 * tastiera o apre in una scheda nuova.
 */
export default function Button({
  variante = 'secondario',
  compatto = false,
  blocco = false,
  icona = false,
  caricamento = false,
  to,
  className = '',
  children,
  ...resto
}) {
  const classi = [
    'ui-btn',
    `is-${variante}`,
    compatto && 'is-compatto',
    blocco && 'is-blocco',
    icona && 'is-icona',
    caricamento && 'is-caricamento',
    className,
  ].filter(Boolean).join(' ');

  if (to) return <Link to={to} className={classi} {...resto}>{children}</Link>;

  return (
    <button
      type="button"
      className={classi}
      // In attesa il pulsante non risponde, e chi usa un lettore di schermo
      // lo sente invece di premere a vuoto.
      aria-busy={caricamento || undefined}
      {...resto}
    >
      {children}
    </button>
  );
}
