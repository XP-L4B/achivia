import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows from '../terminal/TerminalRows';
import { SOGLIA_ORG } from '../../data/osservatorio';

/**
 * Una competenza sola, guardata da vicino.
 *
 * La tavola risponde a "quanto" e "in che direzione". Qui ci sono le
 * domande che vengono dopo, e ognuna e' un pezzo di schermo diverso perche'
 * si legge in modo diverso.
 *
 *   La curva      mese per mese, non una percentuale sola. Una crescita
 *                 costante e un picco isolato fanno la stessa variazione e
 *                 vogliono dire il contrario: l'unico modo di distinguerli
 *                 e' vederli.
 *   I livelli     la distribuzione, non la media. Cento certificazioni
 *                 tutte da principiante e cento con dentro venti esperti
 *                 danno medie vicine e descrivono due mercati diversi.
 *   Dove attecchisce  per fascia di dimensione e per tipo. Una competenza
 *                 che sale dalle piccole verso le grandi e' un segnale
 *                 precoce; il contrario e' una pratica consolidata che
 *                 scende.
 *   Insieme a che cosa  le competenze che le stesse persone tengono con
 *                 questa. Nessuno assume una competenza sola, e chi
 *                 progetta un corso ha bisogno di sapere quali viaggiano
 *                 in coppia.
 *
 * La concentrazione e' il numero che tiene onesta tutta la scheda: dice
 * quanta parte delle certificazioni viene dall'organizzazione piu' attiva.
 * Sopra meta', quello che si sta guardando non e' una tendenza di mercato
 * ma il progetto di un'azienda, e la scheda lo scrive invece di lasciarlo
 * indovinare.
 */
const segno = (v) => (v === null ? 'nuova' : `${v > 0 ? '+' : ''}${v}%`);

const meseCorto = (m) => {
  const [anno, mm] = m.split('-');
  return `${['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'][Number(mm) - 1]} ${anno.slice(2)}`;
};

function Curva({ mesi }) {
  const massimo = Math.max(1, ...mesi.map((m) => m.quante));
  // Con troppi mesi le etichette si accavallano: se ne scrive una ogni
  // tanto, scelta all'indietro dall'ultima, che e' quella che si guarda.
  const passo = Math.ceil(mesi.length / 6);
  return (
    <div className="oss-curva" role="img"
      aria-label={`Certificazioni per mese: ${mesi.map((m) => `${meseCorto(m.mese)} ${m.quante}`).join(', ')}`}>
      {mesi.map((m, i) => (
        <div key={m.mese} className="oss-curva-colonna">
          <div className="oss-curva-barra" style={{ height: `${(m.quante / massimo) * 100}%` }}>
            <span className="oss-curva-cifra">{m.quante}</span>
          </div>
          <span className="oss-curva-mese">
            {(mesi.length - 1 - i) % passo === 0 ? meseCorto(m.mese) : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

function Livelli({ livelli }) {
  return (
    <div className="oss-livelli">
      {livelli.map((l) => (
        <div key={l.id} className="oss-livello">
          <span className="oss-livello-nome">{l.nome}</span>
          <span className="oss-livello-riga">
            <span className="oss-livello-piena" style={{ width: `${l.quota}%` }} />
          </span>
          <span className="oss-livello-cifra">{l.quota}%</span>
        </div>
      ))}
    </div>
  );
}

function Ripartizione({ titolo, fette }) {
  const vive = fette.filter((f) => f.diffuso && f.certificazioni > 0);
  const nascoste = fette.length - vive.length;
  return (
    <div className="oss-ripartizione">
      <span className="label">{titolo}</span>
      {vive.length === 0 ? (
        <p className="tv-vuoto">
          Ogni fascia viene da meno di {SOGLIA_ORG} organizzazioni: il dettaglio non esce.
        </p>
      ) : (
        <TerminalRows
          voci={vive.map((f) => [f.nome, `${f.certificazioni} · ${f.organizzazioni} org.`])}
        />
      )}
      {vive.length > 0 && nascoste > 0 && (
        <small className="ui-dialog-hint">
          {nascoste === 1 ? 'Una fascia non è' : `${nascoste} fasce non sono`} diffondibile: sotto la soglia.
        </small>
      )}
    </div>
  );
}

export default function SchedaCompetenza({ riga, onChiudi }) {
  if (!riga) return null;

  const dominata = riga.concentrazione >= 50;

  return (
    <TerminalPanel
      titolo={riga.nome.toUpperCase()}
      meta={riga.tipo === 'soft' ? 'SOFT SKILL' : 'TECNICA'}
      piede={`${riga.certificazioni} CERTIFICAZIONI · ${riga.organizzazioni} ORGANIZZAZIONI · ${riga.persone} PERSONE`}
      className="ui-blocco con-stacco"
    >
      <div className="oss-scheda-testa">
        <span className="oss-scheda-cifra">{segno(riga.variazione)}</span>
        <span className="oss-scheda-nota">
          rispetto al periodo precedente, che ne aveva {riga.precedenti}
        </span>
        <button type="button" className="oss-chiudi" onClick={onChiudi}>Chiudi</button>
      </div>

      {dominata && (
        <p className="ui-dialog-hint oss-avviso">
          Il {riga.concentrazione}% di queste certificazioni viene da una sola organizzazione:
          quello che si vede qui è soprattutto il progetto di un’azienda, non una tendenza del mercato.
        </p>
      )}

      <span className="label">Certificazioni mese per mese</span>
      <Curva mesi={riga.mesi} />

      <div className="tv-riga" aria-hidden="true" />

      <div className="oss-scheda-due">
        <div>
          <span className="label">A che profondità</span>
          <Livelli livelli={riga.livelli} />
        </div>
        <div>
          <span className="label">Quanto pesa</span>
          <TerminalRows
            vivo
            voci={[
              ['Padronanza (advanced+)', `${riga.padronanza}%`],
              ['Persone del perimetro', `${riga.penetrazione}%`],
              ['Concentrazione', `${riga.concentrazione}%`],
              ['Ottenuta da chi guida', `${riga.quotaGuida}%`],
              ['Reparti diversi', riga.reparti],
              ['Livello medio', riga.livelloMedio],
            ]}
          />
        </div>
      </div>

      <div className="tv-riga" aria-hidden="true" />

      <div className="oss-scheda-due">
        <Ripartizione titolo="Per dimensione dell’organizzazione" fette={riga.perDimensione} />
      </div>

      <div className="tv-riga" aria-hidden="true" />

      <span className="label">Chi ha questa, ha anche</span>
      {riga.insieme.length === 0 ? (
        <p className="tv-vuoto">
          Nessuna coppia abbastanza diffusa: le competenze che accompagnano questa esistono
          in meno di {SOGLIA_ORG} organizzazioni, e una coppia dentro un’azienda sola è il suo
          organigramma, non un fatto di mercato.
        </p>
      ) : (
        <TerminalRows
          voci={riga.insieme.map((v) => [v.nome, `${v.quota}% · ${v.persone} persone`])}
        />
      )}

      {riga.prima && (
        <p className="ui-dialog-hint">
          Certificata per la prima volta il {new Date(riga.prima).toLocaleDateString('it-IT')}.
        </p>
      )}
    </TerminalPanel>
  );
}
