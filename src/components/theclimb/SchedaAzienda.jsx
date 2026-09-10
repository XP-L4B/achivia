import { NOMI_ATTRIBUTI } from '../../data/theclimb';

/**
 * Un'azienda come la si vede: gli attributi da uno a dieci e, se ci si
 * e' lavorato dentro abbastanza, accanto a ognuno quello che dicevano al
 * colloquio. La riga «diceva 7» e' la lezione: nella realta' i colloqui
 * mentono, e il gioco lo fa scoprire cosi'.
 */
export default function SchedaAzienda({ scheda, compatta = false }) {
  if (!scheda) return null;
  const voci = Object.entries(scheda.attributi);
  return (
    <div className={`tc-scheda${compatta ? ' is-compatta' : ''}`}>
      {!compatta && <p className="tc-riga-testo">{scheda.racconto}</p>}
      <dl className="tc-attributi">
        {voci.map(([k, a]) => (
          <div key={k} className="tc-attributo">
            <dt>{NOMI_ATTRIBUTI[k] ?? k}</dt>
            <dd>
              <b>{a.valore}</b><i>/10</i>
              {a.diceva !== null && a.diceva !== a.valore && <small className="tc-diceva"> al colloquio dicevano {a.diceva}</small>}
            </dd>
          </div>
        ))}
      </dl>
      {!compatta && scheda.conosciuta && <p className="tv-nota">La conosci da dentro: questi sono i numeri veri.</p>}
      {!compatta && !scheda.conosciuta && <p className="tv-nota">Quello che si vede da fuori. Da dentro, dopo qualche settimana, si vede com’è davvero.</p>}
    </div>
  );
}
