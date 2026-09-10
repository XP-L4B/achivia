import { useMemo, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import Button from '../../components/ui/Button';
import FiltroIcona from '../../components/ui/FiltroIcona';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../../components/terminal/TerminalRows';
import Tavola from '../../components/osservatorio/Tavola';
import { PERIODI, PERIODO_PREDEFINITO, giorniDi } from '../../data/osservatorio';
import { DIMENSIONI } from '../../data/classifica';
import {
  FILTRI_ANNUNCI_MERCATO, riepilogoAnnunci, competenzeRichieste, dovesiCerca, competenzeInUso,
} from '../../data/mercatoAnnunci';
import {
  CONTINENTI, paesiDi, areeDi, nomeLivelloArea, nomeZona,
} from '../../data/geografia';

/**
 * La domanda di lavoro: che cosa cercano le organizzazioni.
 *
 * Tutte le altre tavole dell'osservatorio guardano dentro le
 * organizzazioni, e per questo si fermano agli abbonati e non scendono
 * sotto la soglia di anonimato. Questa guarda documenti pubblici — un
 * annuncio e' scritto apposta perche' lo leggano degli sconosciuti, e in
 * bacheca si apre uno per uno con la paga scritta dentro — quindi conta
 * tutti gli annunci, di chiunque, e non nasconde nessuna riga. Aggregare
 * cose gia' pubbliche non le rende piu' pubbliche.
 *
 * "Aperti" vuol dire pubblicati nel periodo, non aperti in questo momento.
 * Un annuncio chiuso il mese dopo e' stato lo stesso una posizione cercata,
 * e non contarlo direbbe che quella domanda non c'e' mai stata. Quanti ne
 * sono in bacheca adesso e' un'altra cosa, e sta scritta accanto.
 *
 * La paga non si mescola mai. Portare uno stipendio mensile a una RAL vuol
 * dire scegliere quante mensilita', e fra tredici e quattordici ballano
 * quasi venti punti percentuali: una media che nasconde una scelta del
 * genere e' una media falsa. Quindi la RAL media e' quella dei soli annunci
 * espressi in RAL, e le altre unita' hanno la loro riga.
 */
const segno = (v) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v}%`);
const euro = (v) => (v === null ? '—' : v.toLocaleString('it-IT'));

export default function AnnunciMercatoPage() {
  const [periodo, setPeriodo] = useState(PERIODO_PREDEFINITO);
  const [filtri, setFiltri] = useState(FILTRI_ANNUNCI_MERCATO);
  const [filtriAperti, setFiltriAperti] = useState(false);

  const chiave = { giorni: giorniDi(periodo), ...filtri };
  const testa = useMemo(() => riepilogoAnnunci(chiave), [periodo, filtri]); // eslint-disable-line react-hooks/exhaustive-deps
  const skill = useMemo(() => competenzeRichieste(chiave), [periodo, filtri]); // eslint-disable-line react-hooks/exhaustive-deps
  const luoghi = useMemo(() => dovesiCerca(chiave), [periodo, filtri]); // eslint-disable-line react-hooks/exhaustive-deps
  const vocabolario = useMemo(() => competenzeInUso(), []);

  const annua = testa.paghe.find((p) => p.id === 'annuo');
  const altre = testa.paghe.filter((p) => p.id !== 'annuo' && p.quanti > 0);

  /* Quanti tagli sono accesi. Il periodo non si conta: sta fuori dal menu,
     sempre visibile, perche' inquadra ogni numero della pagina. */
  const accesi = [
    filtri.dimensione !== 'tutte',
    Boolean(filtri.zona.continente || filtri.zona.paese || filtri.zona.area),
    filtri.competenze.length > 0,
  ].filter(Boolean).length;

  const cambia = (patch) => setFiltri({ ...filtri, ...patch });
  const zona = (patch) => cambia({ zona: { ...filtri.zona, ...patch } });

  return (
    <>
      <PageShell
        title="Annunci di lavoro"
        description="Che cosa cercano le organizzazioni: quante posizioni aprono, quanto offrono e quali competenze chiedono. Gli annunci sono documenti pubblici, quindi qui ci sono tutti — anche quelli delle organizzazioni senza abbonamento."
      />

      <div className="ui-corpo-pagina">
        <div className="oss-ricerca">
          <div className="oss-filtri">
            <label className="label">Periodo</label>
            <Chips
              items={PERIODI.map((p) => ({ id: p.id, label: p.nome }))}
              value={periodo}
              onChange={setPeriodo}
              ariaLabel="Periodo"
            />
          </div>

          <div className="oss-filtri-comando">
            <Button
              variante="secondario"
              compatto
              className={`oss-filtri-tasto${filtriAperti ? ' is-aperto' : ''}`}
              aria-expanded={filtriAperti}
              aria-controls="filtri-annunci-mercato"
              onClick={() => setFiltriAperti(!filtriAperti)}
            >
              <FiltroIcona aperto={filtriAperti} />
              <span>Filtri</span>
              {accesi > 0 && <span className="oss-filtri-quanti">{accesi}</span>}
            </Button>
            {accesi > 0 && (
              <>
                <Button variante="secondario" compatto onClick={() => setFiltri(FILTRI_ANNUNCI_MERCATO)}>
                  Azzera
                </Button>
                {!filtriAperti && (
                  <small className="ui-dialog-hint">
                    {accesi === 1 ? 'Un filtro attivo' : `${accesi} filtri attivi`}
                  </small>
                )}
              </>
            )}
          </div>

          <div className="oss-filtri" id="filtri-annunci-mercato" hidden={!filtriAperti}>
            <label className="label">Dimensione delle organizzazioni</label>
            <Chips
              items={DIMENSIONI.map((d) => ({ id: d.id, label: d.nome }))}
              value={filtri.dimensione}
              onChange={(v) => cambia({ dimensione: v })}
              ariaLabel="Fascia di dimensione"
            />

            <label className="label">Dove</label>
            <div className="lb-filtri">
              <label className="label">
                Continente
                <select
                  value={filtri.zona.continente}
                  onChange={(e) => cambia({ zona: { continente: e.target.value, paese: '', area: '' } })}
                >
                  <option value="">Ovunque</option>
                  {CONTINENTI.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>
              <label className="label">
                Paese
                <select
                  value={filtri.zona.paese}
                  disabled={!filtri.zona.continente}
                  onChange={(e) => zona({ paese: e.target.value, area: '' })}
                >
                  <option value="">Tutto il continente</option>
                  {paesiDi(filtri.zona.continente).map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </label>
              <label className="label">
                {nomeLivelloArea(filtri.zona.paese)}
                <select
                  value={filtri.zona.area}
                  disabled={!areeDi(filtri.zona.paese).length}
                  onChange={(e) => zona({ area: e.target.value })}
                >
                  <option value="">Tutto il paese</option>
                  {areeDi(filtri.zona.paese).map((a) => (
                    <option key={a.nome} value={a.nome}>{a.nome}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="label">Competenze richieste</label>
            {vocabolario.length > 0 ? (
              <>
                <Chips
                  multipla
                  items={vocabolario.map((v) => ({ id: v.id, label: `${v.nome} (${v.quanti})` }))}
                  value={filtri.competenze}
                  onChange={(v) => cambia({ competenze: v })}
                  ariaLabel="Competenze richieste"
                />
                <small className="ui-dialog-hint">
                  Sceglierne più di una tiene gli annunci che ne chiedono <b>almeno una</b>: in «e»
                  su tre competenze non resterebbe quasi niente.
                </small>
              </>
            ) : (
              <p className="ui-dialog-hint">Nessun annuncio dichiara ancora delle competenze.</p>
            )}
          </div>
        </div>

        
        <TerminalPanel
          titolo="LA DOMANDA"
          meta={nomeZona(filtri.zona).toUpperCase() || 'OVUNQUE'}
          piede={`${testa.inBacheca} IN BACHECA IN QUESTO MOMENTO`}
          className="ui-blocco con-stacco"
        >
          <TerminalValue
            valore={testa.aperti}
            unita={testa.aperti === 1 ? 'annuncio aperto' : 'annunci aperti'}
            nota={`${segno(testa.variazione)} sul periodo precedente`}
          />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            vivo
            voci={[
              { label: 'Nel periodo precedente', valore: testa.precedenti },
              { label: 'Organizzazioni che hanno pubblicato', valore: testa.organizzazioni },
              { label: 'Annunci che dichiarano competenze', valore: testa.conCompetenze },
              ...testa.modalita.map((m) => ({ id: m.id, label: m.nome, valore: m.quanti })),
            ]}
          />
        </TerminalPanel>

        <TerminalPanel
          titolo="QUANTO SI OFFRE"
          meta={`${annua.quanti} SU ${testa.aperti} IN RAL`}
          piede="LE UNITÀ NON SI MESCOLANO"
          className="ui-blocco con-stacco"
        >
          {annua.quanti > 0 ? (
            <>
              <TerminalValue
                valore={euro(annua.media)}
                unita="€ di RAL media"
                nota={`da ${euro(annua.minimo)} a ${euro(annua.massimo)} in media`}
              />
              <div className="tv-riga" aria-hidden="true" />
            </>
          ) : (
            <p className="tv-vuoto">
              Nessun annuncio del periodo è espresso in RAL annua.
            </p>
          )}
          {altre.length > 0 && (
            <TerminalRows
              vivo
              voci={altre.map((p) => ({
                id: p.id,
                label: `${p.nome} · ${p.quanti} ${p.quanti === 1 ? 'annuncio' : 'annunci'}`,
                valore: `${euro(p.media)} ${p.breve}`,
              }))}
            />
          )}
        </TerminalPanel>

        <p className="ui-dialog-hint">
          La media è quella del <b>punto medio</b> della forbice offerta: prendere il minimo
          direbbe sempre meno del vero, il massimo sempre di più. Mensile e oraria restano
          separate perché convertirle in RAL vuol dire scegliere quante mensilità, e fra tredici
          e quattordici ballano quasi venti punti percentuali.
        </p>

        <Tavola
          titolo="Competenze richieste"
          nota="Quante volte una competenza è stata chiesta, e quanto offrono in media gli annunci che la chiedono. La quota è sugli annunci che dichiarano competenze, non su tutti: dire «il dieci per cento chiede inglese» quando metà degli annunci non dichiara niente è una frase che sembra vera e non lo è."
          tavola="competenze-richieste"
          periodo={periodo}
          meta={`${skill.length} competenze chieste`}
          vuoto="Nessun annuncio del periodo dichiara competenze."
          righe={skill}
          colonne={[
            { chiave: 'nome', nome: 'Competenza', valore: (r) => r.nome },
            { chiave: 'annunci', nome: 'Annunci', numero: true, valore: (r) => r.annunci },
            { chiave: 'quota', nome: 'Quota', numero: true, valore: (r) => r.quota, mostra: (r) => `${r.quota}%` },
            { chiave: 'precedenti', nome: 'Periodo prima', numero: true, valore: (r) => r.precedenti },
            { chiave: 'variazione', nome: 'Variazione', numero: true, valore: (r) => r.variazione, mostra: (r) => segno(r.variazione) },
            { chiave: 'ral', nome: 'RAL media', numero: true, valore: (r) => r.ral, mostra: (r) => euro(r.ral) },
          ]}
        />

        <Tavola
          titolo="Dove si cerca"
          nota="Le righe scendono di livello da sole: scelto un paese diventano le sue regioni, altrimenti sarebbe una tavola con una riga sola."
          tavola="annunci-dove"
          periodo={periodo}
          meta={luoghi.length === 1 ? 'un solo luogo' : `${luoghi.length} luoghi`}
          vuoto="Nessun annuncio nel periodo."
          righe={luoghi}
          colonne={[
            { chiave: 'nome', nome: 'Luogo', valore: (r) => r.nome },
            { chiave: 'annunci', nome: 'Annunci', numero: true, valore: (r) => r.annunci },
            { chiave: 'quota', nome: 'Quota', numero: true, valore: (r) => r.quota, mostra: (r) => `${r.quota}%` },
            { chiave: 'ral', nome: 'RAL media', numero: true, valore: (r) => r.ral, mostra: (r) => euro(r.ral) },
          ]}
        />
      </div>
    </>
  );
}
