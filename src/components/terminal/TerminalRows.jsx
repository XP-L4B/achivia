/**
 * Le righe di dati di un pannello: etichetta a sinistra, valore a destra,
 * puntini in mezzo.
 *
 *   COMPLETATE IN TEMPO .................. 24
 *   % SUL TOTALE ........................ 78%
 *
 * I puntini sono la ragione per cui questo non e' un elenco qualsiasi:
 * portano l'occhio dall'etichetta alla cifra e tengono i numeri incolonnati
 * senza bisogno di una tabella. Sono disegnati, non scritti.
 *
 * Le voci si passano come coppie `[etichetta, valore]` — la forma che le
 * pagine gia' usavano per le griglie — oppure come oggetti quando serve
 * dire di piu': `{ id, label, valore, tono }`, con `tono` fra "errore",
 * "attesa" e "spento".
 *
 * Con `onSceglie` le righe diventano selezionabili: non sono piu' un
 * tabulato da leggere ma l'indice di quello che si vede sopra, e allora
 * ognuna e' un pulsante. La lista di definizioni lascia il posto a una fila
 * di schede — fra <dt> e <dd> un pulsante non ci puo' stare, e comunque una
 * riga su cui si clicca non e' piu' la definizione di un termine.
 */

const normalizza = (v) => (Array.isArray(v) ? { label: v[0], valore: v[1] } : v);

export default function TerminalRows({
  voci,
  vivo = false,
  className = '',
  attivo,
  onSceglie,
  ariaLabel,
  controlla,
}) {
  const righe = voci.filter(Boolean).map(normalizza);

  if (typeof onSceglie === 'function') {
    return (
      <div
        className={`tv-rows is-scelta${className ? ` ${className}` : ''}`}
        role="tablist"
        aria-label={ariaLabel}
      >
        {righe.map(({ id, label, valore, tono }) => {
          const chiave = id ?? label;
          const scelta = chiave === attivo;
          return (
            <button
              key={chiave}
              type="button"
              role="tab"
              aria-selected={scelta}
              aria-controls={controlla}
              className={`tv-row is-sceglibile${scelta ? ' is-attiva' : ''}`}
              onClick={() => onSceglie(chiave)}
            >
              <span className="tv-row-label"><span>{label}</span></span>
              <span className={`tv-row-value${tono ? ` is-${tono}` : ''}`}>{valore}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <dl className={`tv-rows${vivo ? ' is-vivo' : ''}${className ? ` ${className}` : ''}`}>
      {righe.map(({ id, label, valore, tono }) => (
        <div className="tv-row" key={id ?? label}>
          {/* I puntini sono l'::after dell'etichetta, non un elemento a
              parte: dentro una lista di definizioni fra <dt> e <dd> non ci
              puo' stare nient'altro. */}
          <dt className="tv-row-label"><span>{label}</span></dt>
          <dd className={`tv-row-value${tono ? ` is-${tono}` : ''}`}>{valore}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Il valore che si legge da lontano: quello per cui si e' aperta la pagina.
 * Il numero e' grande e luminoso, l'unita' piccola accanto, la nota — se
 * c'e' — spenta all'altro capo della riga.
 */
export function TerminalValue({ valore, unita, nota }) {
  return (
    <p className="tv-focale">
      <span className="tv-focale-num">{valore}</span>
      {unita && <span className="tv-focale-unita">{unita}</span>}
      {nota && <span className="tv-focale-nota">{nota}</span>}
    </p>
  );
}

/**
 * Una riga di stato: l'esito di un'operazione detto come lo direbbe un
 * terminale. `tono` accende il colore giusto — il fosforo per l'esito buono,
 * il rosso per l'errore — senza cambiare la forma della riga.
 */
export function TerminalStato({ children, tono = '', cursore = false }) {
  return (
    <p className={`tv-stato${tono ? ` is-${tono}` : ''}`} role={tono === 'errore' ? 'alert' : undefined}>
      <span className="tv-prompt" aria-hidden="true">&gt;</span>
      {children}
      {cursore && <span className="tv-cursore" aria-hidden="true" />}
    </p>
  );
}
