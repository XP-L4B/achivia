import { useId, useState } from 'react';
import Chips from './Chips';
import TrendChart from './TrendChart';
import CalendarIcon from './CalendarIcon';
import FinestraPeriodo from './FinestraPeriodo';
import { PERIODI, breve, finestraDi, etichettaPeriodo } from './periodi';
import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../terminal/TerminalRows';
import TerminalBar from '../terminal/TerminalBar';
import { cifra } from '../terminal/formato';
import { analiticheOrg } from '../../data/organizzazione';

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

/**
 * Le stesse griglie di una persona, fatte su tutta l'organizzazione.
 *
 * E' la lettura che manca a chi guida: aprire una scheda alla volta dice
 * come sta andando Alice, non come sta andando l'azienda. Qui le domande
 * sono le stesse — quanto si chiude in tempo, quanto si perde, quanto si
 * spende — ma il soggetto e' l'insieme, e sotto restano le persone da
 * aprire una per una quando un numero non torna.
 *
 * Periodo e vista a grafico funzionano come nelle griglie personali, perche'
 * sono gli stessi componenti: il periodo si applica a quello che ha una data
 * di chiusura, il grafico ha un periodo suo, a mesi.
 */
export default function OrgAnalytics({ persona }) {
  const [vista, setVista] = useState('valori');
  const [metrica, setMetrica] = useState('pct-in-tempo');
  const idLettura = useId();
  const [periodo, setPeriodo] = useState('all');
  const [intervallo, setIntervallo] = useState(null);
  const [scegliendo, setScegliendo] = useState(false);
  // L'istante di riferimento si fissa all'apertura della pagina: se lo
  // leggessimo a ogni render i conteggi ballerebbero senza motivo.
  const [adesso] = useState(() => Date.now());

  const finestra = finestraDi(periodo, intervallo, adesso);
  const o = analiticheOrg(persona.orgId, finestra);

  const completamento = pct(o.inTempo, o.totale);
  const perse = pct(o.scadute, o.totale);
  const tarde = pct(o.inRitardo, o.totale);
  const allarme = o.scadute > 0 ? 'errore' : 'spento';
  const attesa = o.inRitardo > 0 ? 'attesa' : 'spento';

  const performance = [
    { id: 'in-tempo', label: 'Completate in tempo', valore: cifra(o.inTempo),
      focale: `${cifra(o.inTempo)}/${cifra(o.totale)}`, unita: 'completate in tempo' },
    { id: 'pct-in-tempo', label: '% sul totale', valore: `${completamento}%`,
      focale: `${completamento}%`, unita: 'in tempo', percentuale: completamento,
      nota: `${cifra(o.inTempo)}/${cifra(o.totale)} quest` },
    { id: 'assegnate', label: 'Quest assegnate', valore: cifra(o.totale),
      focale: cifra(o.totale), unita: 'quest nel periodo' },
    { id: 'completate', label: 'Quest completate', valore: cifra(o.completate),
      focale: cifra(o.completate), unita: 'quest completate',
      nota: o.diGruppo > 0 ? `${cifra(o.diGruppo)} di gruppo` : undefined },
    { id: 'in-corso', label: 'In corso', valore: cifra(o.inCorso),
      focale: cifra(o.inCorso), unita: 'quest in corso',
      nota: finestra ? 'solo su tutto lo storico' : undefined },
    { id: 'da-approvare', label: 'Da approvare', valore: cifra(o.daApprovare),
      tono: o.daApprovare > 0 ? 'attesa' : 'spento',
      focale: cifra(o.daApprovare), unita: 'in attesa di approvazione' },
    { id: 'fallite', label: 'Quest fallite', valore: cifra(o.scadute), tono: allarme,
      focale: `${cifra(o.scadute)}/${cifra(o.totale)}`, unita: 'quest fallite' },
    { id: 'pct-fallite', label: '% quest fallite', valore: `${perse}%`, tono: allarme,
      focale: `${perse}%`, unita: 'quest fallite', percentuale: perse,
      nota: `${cifra(o.scadute)}/${cifra(o.totale)} quest` },
    { id: 'ritardo', label: 'Consegne in ritardo', valore: cifra(o.inRitardo), tono: attesa,
      focale: `${cifra(o.inRitardo)}/${cifra(o.totale)}`, unita: 'consegnate in ritardo' },
    { id: 'pct-ritardo', label: '% consegne in ritardo', valore: `${tarde}%`, tono: attesa,
      focale: `${tarde}%`, unita: 'in ritardo', percentuale: tarde,
      nota: `${cifra(o.inRitardo)}/${cifra(o.totale)} quest` },
    { id: 'aiuti', label: 'Richieste d’aiuto risolte', valore: `${cifra(o.aiutiRisolti)}/${cifra(o.aiutiChiesti)}`,
      focale: cifra(o.aiutiRisolti), unita: 'aiuti raccolti',
      percentuale: pct(o.aiutiRisolti, o.aiutiChiesti),
      nota: `${cifra(o.aiutiChiesti)} richieste` },
    // Dal registro delle presenze: arrivare tardi la mattina, che e' un'altra
    // cosa dalla quest consegnata tardi.
    { id: 'assenze', label: 'Assenze', valore: cifra(o.assenze),
      tono: o.assenze > 0 ? 'errore' : 'spento',
      focale: cifra(o.assenze), unita: 'assenze',
      nota: o.assenzeGiustificate > 0 ? `${o.assenzeGiustificate} giustificate` : undefined },
    { id: 'ritardi-ingresso', label: 'Ritardi in ingresso', valore: cifra(o.ritardi),
      tono: o.ritardi > 0 ? 'attesa' : 'spento',
      focale: cifra(o.ritardi), unita: 'ritardi in ingresso',
      nota: o.ritardiGiustificati > 0 ? `${o.ritardiGiustificati} giustificati` : undefined },
    { id: 'minuti-ritardo', label: 'Minuti di ritardo', valore: cifra(o.minuti),
      tono: o.minuti > 0 ? 'attesa' : 'spento',
      focale: cifra(o.minuti), unita: 'minuti di ritardo',
      nota: o.ritardi > 0 ? `su ${o.ritardi} ${o.ritardi === 1 ? 'ritardo' : 'ritardi'}` : undefined },
  ];

  const scelta = performance.find((m) => m.id === metrica) ?? performance[0];
  const periodoScritto = etichettaPeriodo(periodo, intervallo);

  if (vista === 'grafico') {
    return (
      <>
        <button type="button" className="px-btn ghost" onClick={() => setVista('valori')}>
          Vedi i valori
        </button>
        <TrendChart orgId={persona.orgId} />
      </>
    );
  }

  return (
    <>
      <Chips
        items={[...PERIODI, {
          id: 'scelta',
          label: (
            <span className="ui-chip-cal">
              <CalendarIcon style={{ flex: '0 0 auto' }} />
              {intervallo ? `${breve(intervallo.da)}–${breve(intervallo.a)}` : 'SCEGLI'}
            </span>
          ),
        }]}
        value={periodo}
        onChange={(id) => (id === 'scelta' ? setScegliendo(true) : setPeriodo(id))}
        ariaLabel="Periodo"
      />
      <button type="button" className="px-btn ghost" onClick={() => setVista('grafico')}>
        Vedi il grafico
      </button>

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="ORGANIZZAZIONE"
          meta={periodoScritto}
          piede={o.totale > 0 ? `QUEST_ANALIZZATE: ${cifra(o.totale)}` : 'NESSUNA QUEST NEL PERIODO'}
          tonoPiede={o.totale > 0 ? '' : 'attesa'}
        >
          {/* La lettura cambia sotto le dita: chi usa un lettore di schermo
              deve sentirla cambiare, non scoprirlo tornando indietro. */}
          <div id={idLettura} role="tabpanel" aria-live="polite">
            <TerminalValue valore={scelta.focale} unita={scelta.unita} nota={scelta.nota} />
            {scelta.percentuale != null && (
              <TerminalBar
                percentuale={scelta.percentuale}
                tono={scelta.tono === 'errore' ? 'errore' : ''}
                etichetta={`${scelta.percentuale}% — ${scelta.label}`}
              />
            )}
          </div>
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            voci={performance}
            attivo={scelta.id}
            onSceglie={setMetrica}
            controlla={idLettura}
            ariaLabel="Quale dato vedere in cima"
          />
        </TerminalPanel>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="PERSONE"
          meta={periodoScritto}
          piede={`ATTIVI_NEL_PERIODO: ${cifra(o.attivi)} SU ${cifra(o.persone)}`}
        >
          <TerminalRows
            voci={[
              ['Membri', cifra(o.persone)],
              ['Con responsabilità', cifra(o.responsabili)],
              ['Competenze certificate', cifra(o.certificazioni)],
              ['Achievement consegnati', cifra(o.medaglie)],
              ['Performance review svolte', cifra(o.review)],
            ]}
          />
        </TerminalPanel>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel titolo="CREDITI" meta={periodoScritto} piede={`ORDINI_NEL_NEGOZIO: ${cifra(o.ordini)}`}>
          <TerminalValue valore={cifra(o.creditiDistribuiti)} unita="crediti distribuiti" nota="nel periodo" />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            vivo
            voci={[
              { label: 'Spesi nel negozio', valore: `◉ ${cifra(o.creditiSpesi)}` },
              { label: 'In circolazione', valore: `◉ ${cifra(o.creditiCircolanti)}`, tono: 'oro' },
            ]}
          />
        </TerminalPanel>
      </div>

      {scegliendo && (
        <FinestraPeriodo
          iniziale={intervallo}
          oggi={adesso}
          onChiudi={() => setScegliendo(false)}
          onConferma={(sceltaData) => {
            setIntervallo(sceltaData);
            setPeriodo('scelta');
            setScegliendo(false);
          }}
        />
      )}
    </>
  );
}
