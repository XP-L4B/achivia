import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../terminal/TerminalRows';
import TerminalBar from '../terminal/TerminalBar';
import { cifra } from '../terminal/formato';
import { riepilogoOrganizzazione } from '../../data/organizzazione';
import { nomeOrgDi } from '../../data/db';
import useScrivania from '../../hooks/useScrivania';

/**
 * I riquadri del profilo dell'admin.
 *
 * Al posto dei traguardi personali — che l'admin non ha, perche' non esegue
 * quest e non prende certificazioni — ci sono quelli dell'organizzazione:
 * quanto lavoro gira, quanto si chiude e come, come cresce la squadra,
 * quanto vale l'economia interna.
 *
 * Sono gli stessi pannelli del terminale usati ovunque: cambia quello che
 * dicono, non come lo dicono.
 */

/** Il pannello dentro la scheda, al posto di STATUS: il colpo d'occhio. */
export function StatoOrganizzazione({ persona, dati }) {
  const o = dati ?? riepilogoOrganizzazione(persona.orgId);

  return (
    <TerminalPanel
      titolo="ORGANIZZAZIONE"
      meta={nomeOrgDi(persona.orgId) || 'La mia org'}
      piede={`MEMBRI: ${cifra(o.persone)} · QUEST_IN_CIRCOLO: ${cifra(o.inCorso + o.daApprovare)}`}
      style={{ width: '100%' }}
    >
      <TerminalValue valore={cifra(o.completate)} unita="QUEST COMPLETATE" nota={`/ ${cifra(o.assegnate)} assegnate`} />
      <TerminalBar
        percentuale={o.completamento}
        etichetta={`${o.completamento}% delle quest concluse è stata portata a termine`}
      />
      <div className="tv-riga" aria-hidden="true" />
      <TerminalRows
        vivo
        voci={[
          ['In corso', cifra(o.inCorso)],
          ['Da approvare', cifra(o.daApprovare)],
          { label: 'Crediti in circolazione', valore: `◉ ${cifra(o.creditiCircolanti)}`, tono: 'oro' },
        ]}
      />
    </TerminalPanel>
  );
}

/**
 * I pannelli sotto la scheda: il dettaglio, tre letture dell'azienda.
 *
 * Sul telefono si aprono e si chiudono, e partono chiusi: tre riquadri di
 * numeri messi in fila sono mezzo metro di pagina, e i collegamenti che
 * stanno sotto — quest, analytics, la lega — finivano fuori portata. Su uno
 * schermo largo restano aperti come sono sempre stati: li' lo spazio c'e'.
 */
export default function ProfiloOrganizzazione({ persona, dati }) {
  const o = dati ?? riepilogoOrganizzazione(persona.orgId);
  const periodo = `ULTIMI ${o.giorni} GIORNI`;
  const scrivania = useScrivania();
  const piega = { pieghevole: !scrivania, apertoDiDefault: scrivania };

  return (
    <>
      <TerminalPanel
        {...piega}
        titolo="QUEST"
        meta="TOTALE"
        piede={`PUNTUALITA': ${o.puntualita}%`}
        className="ui-blocco con-stacco"
        style={{ width: '100%' }}
      >
        <TerminalRows
          voci={[
            ['Totale assegnate', cifra(o.assegnate)],
            ['Completate', cifra(o.completate)],
            ['Consegnate in tempo', cifra(o.inTempo)],
            { label: 'Consegnate in ritardo', valore: cifra(o.inRitardo), tono: o.inRitardo > 0 ? 'attesa' : '' },
            { label: 'Scadute', valore: cifra(o.scadute), tono: o.scadute > 0 ? 'errore' : '' },
            ['Di gruppo', cifra(o.diGruppo)],
          ]}
        />
        <TerminalBar
          label="IN TEMPO"
          percentuale={o.puntualita}
          etichetta={`${o.puntualita}% delle quest completate è arrivato entro la scadenza`}
        />
      </TerminalPanel>

      <TerminalPanel
        {...piega}
        titolo="PERSONE"
        meta={periodo}
        piede={`ATTIVI_NEL_PERIODO: ${cifra(o.attivi)} SU ${cifra(o.persone)}`}
        className="ui-blocco con-stacco"
        style={{ width: '100%' }}
      >
        <TerminalRows
          voci={[
            ['Membri', cifra(o.persone)],
            ['Con responsabilità', cifra(o.responsabili)],
            ['Competenze certificate', cifra(o.certificazioni)],
            ['Competenze diverse coperte', cifra(o.competenzeCoperte)],
            ['Achievement consegnati', cifra(o.medaglie)],
            ['Performance review svolte', cifra(o.review)],
            ['Richieste d’aiuto risolte', `${cifra(o.aiutiRisolti)} / ${cifra(o.aiutiChiesti)}`],
            { label: 'Assenze nel periodo', valore: cifra(o.assenze), tono: o.assenze > 0 ? 'attesa' : '' },
            ['Ritardi nel periodo', cifra(o.ritardi)],
            ['Serie senza assenze più lunga', `${cifra(o.serieMigliore)} gg`],
          ]}
        />
      </TerminalPanel>

      <TerminalPanel
        {...piega}
        titolo="CREDITI"
        meta="ECONOMIA INTERNA"
        piede={`ORDINI_NEL_NEGOZIO: ${cifra(o.ordini)}`}
        className="ui-blocco con-stacco"
        style={{ width: '100%' }}
      >
        <TerminalRows
          vivo
          voci={[
            { label: 'Distribuiti', valore: `◉ ${cifra(o.creditiDistribuiti)}`, tono: 'oro' },
            { label: 'In circolazione', valore: `◉ ${cifra(o.creditiCircolanti)}`, tono: 'oro' },
            { label: 'Spesi nel negozio', valore: `◉ ${cifra(o.creditiSpesi)}` },
          ]}
        />
      </TerminalPanel>
    </>
  );
}
