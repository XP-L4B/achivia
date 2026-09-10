/**
 * L'istogramma della cassa: una colonna per periodo, merce sotto e
 * spedizioni sopra.
 *
 * E' disegnato con due div impilati e nient'altro — niente libreria,
 * niente SVG — perche' quello che deve dire e' semplice: quanto e' alto
 * questo giorno rispetto al piu' alto della finestra. La scala e' quella:
 * la colonna piu' alta arriva in cima e le altre stanno in proporzione,
 * cosi' un negozio che incassa dieci crediti al giorno e uno che ne
 * incassa diecimila leggono lo stesso disegno.
 *
 * I periodi vuoti ci sono lo stesso, come colonne alte zero con la loro
 * riga di base: un giorno che manca si legge «non lo so», un giorno a
 * zero si legge «zero».
 *
 * Le etichette sotto si diradano da sole quando le colonne sono tante:
 * trenta date scritte una accanto all'altra non si leggono, e una ogni
 * cinque basta a capire dove si e'.
 */
export default function Istogramma({ righe, altezza = 132, etichettaOgni, vuoto = 'Ancora niente.' }) {
  const massimo = Math.max(0, ...righe.map((r) => r.totale));
  const passo = etichettaOgni ?? (righe.length > 16 ? Math.ceil(righe.length / 6) : 1);

  if (!righe.length || massimo === 0) {
    return <p className="tv-nota shop-istogramma-vuoto">{vuoto}</p>;
  }

  return (
    <div className="shop-istogramma" style={{ '--shop-istogramma-h': `${altezza}px` }}>
      <ol className="shop-colonne">
        {righe.map((r, i) => {
          const alta = massimo ? (r.totale / massimo) * 100 : 0;
          const quotaMerce = r.totale ? (r.merce / r.totale) * 100 : 0;
          return (
            <li
              key={r.chiave}
              className={`shop-colonna${r.totale === 0 ? ' is-vuota' : ''}`}
              title={`${r.etichetta}: ${r.totale} crediti (${r.merce} di merce, ${r.spedizioni} di spedizioni), ${r.ordini} ${r.ordini === 1 ? 'ordine' : 'ordini'}`}
            >
              <span className="shop-colonna-barra" style={{ height: `${alta}%` }} aria-hidden="true">
                <span className="shop-colonna-spedizioni" />
                <span className="shop-colonna-merce" style={{ height: `${quotaMerce}%` }} />
              </span>
              <span className={`shop-colonna-eti${i % passo === 0 || i === righe.length - 1 ? '' : ' is-muta'}`}>
                {r.etichetta}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="shop-legenda">
        <span className="shop-legenda-voce"><i className="shop-quadro is-merce" aria-hidden="true" />merce</span>
        <span className="shop-legenda-voce"><i className="shop-quadro is-spedizioni" aria-hidden="true" />spedizioni</span>
        <span className="shop-legenda-max">il massimo della finestra: {massimo} crediti</span>
      </p>
    </div>
  );
}
