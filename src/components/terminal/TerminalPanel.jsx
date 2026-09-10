import { useState } from 'react';

/**
 * Il pannello del terminale: la cornice in cui stanno i dati.
 *
 *   >> PERFORMANCE                         ULTIMI 30 GIORNI
 *   ========================================================
 *   ... qui dentro le righe, i valori, le barre ...
 *   --------------------------------------------------------
 *   >> DATA_STREAM: ONLINE
 *
 * Le due righe divisorie non sono caratteri ma disegno (vedi
 * `terminal.css`): un lettore di schermo non ha "======" da leggere e la
 * riga resta lunga quanto il pannello a qualsiasi larghezza.
 *
 * Con `onClick` diventa un pulsante, senza resta una sezione: e' la stessa
 * distinzione che fa gia' `Tile`, e serve perche' alcuni pannelli aprono un
 * dettaglio e altri si guardano soltanto.
 *
 * Con `pieghevole` l'intestazione diventa il comando che apre e chiude il
 * pannello, con [+] e [-] all'estremita' come in un terminale. Serve dove
 * una fila di pannelli lunghi allontana quello che viene dopo — sul
 * telefono, il profilo dell'admin: quattro riquadri di numeri e i riquadri
 * dei collegamenti finiti in fondo a una pagina lunghissima.
 */
export default function TerminalPanel({
  titolo,
  livello = 2,
  meta,
  piede,
  tonoPiede = '',
  onClick,
  pieghevole = false,
  apertoDiDefault = true,
  className = '',
  children,
  ...resto
}) {
  // Finche' nessuno tocca niente decide chi ha passato `apertoDiDefault` —
  // di solito lo schermo. Al primo tocco decide chi guarda, e da li' in poi
  // il pannello resta come l'ha lasciato, anche girando il telefono.
  const [scelta, setScelta] = useState(null);
  const mostra = pieghevole ? (scelta ?? apertoDiDefault) : true;
  // Il titolo del pannello e' un vero titolo di sezione: `livello` dice a
  // che profondita' sta, perche' un h2 dentro un dialogo o dentro un'altra
  // scheda sarebbe fuori posto nella scaletta della pagina.
  const Titolo = `h${livello}`;

  const testa = titolo && (
    <>
      <span className="tv-prompt" aria-hidden="true">&gt;&gt;</span>
      <Titolo className="tv-titolo">{titolo}</Titolo>
      {meta && <span className="tv-meta">{meta}</span>}
      {pieghevole && <span className="tv-piega" aria-hidden="true">{mostra ? '[-]' : '[+]'}</span>}
    </>
  );

  const corpo = (
    <>
      {titolo && (pieghevole ? (
        <button
          type="button"
          className="tv-testa is-comando"
          aria-expanded={mostra}
          onClick={() => setScelta(!mostra)}
        >
          {testa}
        </button>
      ) : (
        <header className="tv-testa">{testa}</header>
      ))}
      {titolo && <div className="tv-riga-doppia" aria-hidden="true" />}

      {mostra && children}

      {piede && mostra && (
        <>
          <div className="tv-riga" aria-hidden="true" />
          <p className={`tv-piede${tonoPiede ? ` is-${tonoPiede}` : ''}`}>
            <span className="tv-prompt" aria-hidden="true">&gt;&gt;</span>
            {piede}
          </p>
        </>
      )}
    </>
  );

  const classi = `tv-panel${onClick ? ' is-cliccabile' : ''}${pieghevole ? ' is-pieghevole' : ''}${mostra ? '' : ' is-chiuso'}${className ? ` ${className}` : ''}`;

  if (onClick) {
    return (
      <button type="button" className={classi} onClick={onClick} {...resto}>
        {corpo}
      </button>
    );
  }

  return <section className={classi} {...resto}>{corpo}</section>;
}
