/**
 * Il tabellone dei tentativi.
 *
 * In cima «PAROLA SEGRETA» e tante caselle vuote quante sono le sue
 * lettere: e' tutto quello che si sa quando si comincia, ed e' apposta —
 * il gioco e' arrivarci.
 *
 * Sotto, una riga per tentativo. Le caselle di un tentativo gia' giocato
 * portano il loro colore: verde la lettera giusta al posto giusto, gialla
 * quella che c'e' ma da un'altra parte, grigia quella che non c'e'. Il
 * colore non e' l'unica cosa che lo dice — c'e' anche un segno nella
 * casella e il colore scritto nel testo per chi legge con un lettore di
 * schermo: un gioco che si puo' giocare solo distinguendo il verde dal
 * giallo taglierebbe fuori una persona su dodici fra gli uomini.
 */

const SEGNO = { verde: '✓', giallo: '~', grigio: '·' };
const DETTO = { verde: 'giusta', giallo: 'fuori posto', grigio: 'non c’è' };

export default function Griglia({ lettere, righe = [], tentativiMassimi, soluzione = null }) {
  const vuote = Math.max(0, tentativiMassimi - righe.length);

  return (
    <div className="lex-griglia">
      <p className="lex-segreta">
        <span className="lex-segreta-etichetta">Parola segreta</span>
        <span className="lex-segreta-caselle" aria-label={`La parola segreta ha ${lettere} lettere`}>
          {Array.from({ length: lettere }, (_, i) => (
            <span key={i} className="lex-casella is-segreta" aria-hidden="true">
              {soluzione ? [...soluzione.toUpperCase()][i] ?? '' : ''}
            </span>
          ))}
        </span>
        <span className="lex-segreta-conto">{lettere} lettere</span>
      </p>

      <div className="lex-righe">
        {righe.map((r, i) => (
          <div key={i} className="lex-riga-tentativo">
            {r.persa ? (
              <span className="lex-riga-persa">tempo scaduto</span>
            ) : r.lettere.map((l, j) => (
              <span
                key={j}
                className={`lex-casella is-${r.esito[j]}`}
                aria-label={`${l}: ${DETTO[r.esito[j]] ?? ''}`}
              >
                {l}
                <span className="lex-casella-segno" aria-hidden="true">{SEGNO[r.esito[j]]}</span>
              </span>
            ))}
          </div>
        ))}
        {Array.from({ length: vuote }, (_, i) => (
          <div key={`v${i}`} className="lex-riga-tentativo is-vuota" aria-hidden="true">
            {Array.from({ length: lettere }, (_, j) => <span key={j} className="lex-casella" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
