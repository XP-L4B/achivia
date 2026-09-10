/**
 * Le carte di una valutazione o di un colloquio: la voce, il valore, la
 * richiesta, e se basta. E' la schermata «Perche'» del gioco, ridotta
 * alla sua forma: una lista in cui ogni riga dice che cosa ha pesato.
 *
 *   Performance ............ 88 / 65  ✓
 *   Leadership ............. 34 / 60  ✗
 *
 * Il segno non e' solo un colore: c'e' il carattere, e c'e' la parola
 * per chi legge con lo schermo.
 */
export default function Carte({ carte }) {
  if (!carte?.length) return null;
  return (
    <ul className="tc-carte">
      {carte.map((c) => (
        <li key={c.id} className={`tc-carta${c.ok ? ' is-ok' : ' is-no'}`}>
          <span className="tc-carta-nome">{c.nome}{c.dettaglio ? <small> · {c.dettaglio}</small> : null}</span>
          <span className="tc-carta-valore">
            <b>{String(c.valore)}</b>
            {c.richiesto !== undefined && c.richiesto !== null && <i> / {String(c.richiesto)}</i>}
            <span className="tc-carta-segno" role="img" aria-label={c.ok ? 'basta' : 'non basta'}>{c.ok ? '✓' : '✗'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
