import Chips from '../ui/Chips';
import { PERIODI } from '../../data/osservatorio';
import { DIMENSIONI, ANZIANITA } from '../../data/classifica';

/**
 * I tagli con cui si guarda il mercato: quando, e chi.
 *
 * Le fasce sono le stesse della lega — dimensione, tipo, anzianita' — e non
 * per pigrizia: un'organizzazione deve risultare della stessa taglia in
 * tutte e due le schermate, altrimenti due numeri che parlano della stessa
 * cosa non tornano.
 *
 * Non c'e' il settore merceologico, e non e' una dimenticanza: l'app non lo
 * chiede a nessuno, e un filtro che divide su un dato che non esiste
 * dividerebbe sul nulla. Non c'e' nemmeno il tipo di organizzazione: qui
 * dentro ci sono solo aziende con l'abbonamento, e le personalizzate non ci
 * entrano proprio. Non c'e' nemmeno il tipo di organizzazione: qui
 * dentro ci sono solo aziende con l'abbonamento, e le personalizzate non ci
 * entrano proprio.
 */
export default function FiltriMercato({ finestra, onChange }) {
  const cambia = (campo) => (valore) => onChange({ ...finestra, [campo]: valore });

  return (
    /* Il vetro sta qui e non nelle tre pagine che lo usano: se lo mettesse
       ognuna, prima o poi una se ne dimenticherebbe. */
    <div className="oss-ricerca oss-filtri">
      <label className="label">Periodo</label>
      <Chips
        items={PERIODI.map((p) => ({ id: p.id, label: p.nome }))}
        value={finestra.periodo}
        onChange={cambia('periodo')}
        ariaLabel="Periodo"
      />

      <label className="label">Dimensione delle organizzazioni</label>
      <Chips
        items={DIMENSIONI.map((d) => ({ id: d.id, label: d.nome }))}
        value={finestra.dimensione}
        onChange={cambia('dimensione')}
        ariaLabel="Fascia di dimensione"
      />

      {/* Il filtro per tipo non c'e' piu': nel perimetro entrano solo le
          aziende con l'abbonamento, quindi restava una voce sola da
          scegliere e sceglierla non cambiava niente. */}
      <div className="lb-filtri">
        <label className="label">
          Anzianità su Achivia
          <select value={finestra.anzianita} onChange={(e) => cambia('anzianita')(e.target.value)}>
            {ANZIANITA.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
