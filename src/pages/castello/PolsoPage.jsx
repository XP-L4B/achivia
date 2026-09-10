import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import FinestraCastello from './FinestraCastello';
import { etichetta, finestraScelta } from './finestra';
import { ilPolso } from '../../data/castello';
import { euro, nomeCausale } from '../../data/db';

const pct = (parte, tutto) => (tutto ? Math.round((parte / tutto) * 100) : 0);

/**
 * IL POLSO — la prima schermata del Castello.
 *
 * Quattro domande, nell'ordine in cui uno se le fa entrando: quanta gente
 * c'e' e quanta e' viva, quante insegne sono aperte e quante pagano, quanto
 * entra al mese, e quanti crediti si sono mossi e perche'.
 *
 * Il denaro sta al terzo posto e non al primo apposta: e' il numero che si
 * guarda per ultimo perche' e' quello che dipende dagli altri tre. Se le
 * persone attive scendono, l'incasso lo segue con due mesi di ritardo, e
 * guardando solo l'incasso ci si accorge del problema quando e' gia'
 * successo.
 */
export default function PolsoPage() {
  const [adesso] = useState(() => Date.now());
  const [periodo, setPeriodo] = useState('7g');
  const [intervallo, setIntervallo] = useState(null);
  const finestra = finestraScelta(periodo, intervallo, adesso);
  const quando = etichetta(periodo, intervallo);
  const p = ilPolso(finestra, adesso);

  const { account: a, organizzazioni: o, crediti: c, denaro: d, incasso: i } = p;

  return (
    <>
      <PageShell
        title="Il polso"
        description="Come sta l’applicazione, adesso. Scegli il periodo e i numeri lo seguono."
      />

      <FinestraCastello
        periodo={periodo}
        intervallo={intervallo}
        oggi={adesso}
        onCambia={(id, scelto) => { setPeriodo(id); setIntervallo(scelto); }}
      />

      <div className="ui-blocco con-stacco">
        {/* Le persone prima di tutto: senza di loro gli altri tre pannelli
            sono tre modi di contare lo zero. */}
        <TerminalPanel
          titolo="PERSONE"
          meta={quando}
          piede={`ISCRITTI NEL PERIODO: ${cifra(a.nuovi)}`}
        >
          <TerminalRows
            voci={[
              ['Account in tutto', cifra(a.totali)],
              { id: 'nuovi', label: 'Iscritti nel periodo', valore: cifra(a.nuovi) },
              { id: 'a2', label: 'Attivi negli ultimi 2 giorni', valore: cifra(a.attivi[2]) },
              { id: 'a7', label: 'Attivi negli ultimi 7 giorni', valore: cifra(a.attivi[7]) },
              { id: 'a15', label: 'Attivi negli ultimi 15 giorni', valore: cifra(a.attivi[15]) },
              { id: 'a30', label: 'Attivi negli ultimi 30 giorni', valore: cifra(a.attivi[30]) },
              { id: 'quota', label: '% attiva sul totale', valore: `${pct(a.attivi[30], a.totali)}%` },
              {
                id: 'mai',
                label: 'Mai entrati dopo l’iscrizione',
                valore: cifra(a.mai),
                tono: a.mai > 0 ? 'attesa' : 'spento',
              },
              {
                id: 'soglia',
                label: 'Fermi sulla soglia (nessuna org)',
                valore: cifra(a.senzaOrg),
                tono: a.senzaOrg > 0 ? 'attesa' : 'spento',
              },
            ]}
          />
          {a.stimati > 0 && (
            <p className="tv-nota">
              {cifra(a.stimati)} account sono nati prima che la data di iscrizione venisse
              registrata: la loro è ricostruita, e resta fuori dal conto degli iscritti nel
              periodo per non farli sembrare tutti di oggi.
            </p>
          )}
        </TerminalPanel>

        <TerminalPanel
          titolo="ORGANIZZAZIONI"
          meta={quando}
          piede={`APERTE: ${cifra(o.aperte)} · PAGANO: ${cifra(o.paganti)}`}
        >
          <TerminalRows
            voci={[
              ['Aperte', cifra(o.aperte)],
              ['Aziende', cifra(o.aziende)],
              ['Gruppi', cifra(o.gruppi)],
              { id: 'paga', label: 'Con abbonamento', valore: cifra(o.paganti) },
              { id: 'quota', label: '% che paga', valore: `${pct(o.paganti, o.aperte)}%` },
              ['Nate nel periodo', cifra(o.nate)],
              {
                id: 'chiuse',
                label: 'Chiuse nel periodo',
                valore: cifra(o.chiusaNel),
                tono: o.chiusaNel > 0 ? 'errore' : 'spento',
              },
              ['Chiuse in tutto', cifra(o.chiuse)],
              ['Persone dentro le insegne', cifra(o.persone)],
              ['La più numerosa', `${cifra(o.massimo)} persone`],
            ]}
          />
        </TerminalPanel>

        <TerminalPanel
          titolo="DENARO"
          meta="ABBONAMENTI IN CORSO"
          piede={`AL MESE: ${d.scritto}`}
        >
          <TerminalRows
            voci={[
              ['Ricavo mensile atteso', euro(d.mensile)],
              ['Su dodici mesi', euro(d.annuo)],
              ['Organizzazioni che pagano', cifra(d.paganti)],
              ['Media per cliente', euro(d.paganti ? Math.round(d.mensile / d.paganti) : 0)],
              ...d.perPiano.map((v) => ({
                id: v.id,
                label: `Piano ${v.nome}`,
                valore: `${cifra(v.quante)} · ${euro(v.mensile)}`,
              })),
            ]}
          />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            voci={[
              ['Incassato nel periodo', euro(i.incassato)],
              ['Pagamenti registrati', cifra(i.quanti)],
              ['Crediti usciti col piano', cifra(i.creditiDati)],
              {
                id: 'rinn',
                label: 'Da rinnovare adesso',
                valore: cifra(i.daRinnovare),
                tono: i.daRinnovare > 0 ? 'errore' : 'spento',
              },
            ]}
          />
          {/* Detto una volta e detto chiaro: e' una previsione, non una
              cassa. Il giorno in cui i pagamenti passeranno di qui, accanto
              a questo numero ce ne sara' uno vero. */}
          <p className="tv-nota">
            Il primo blocco è quello che gli abbonamenti aperti valgono al mese; il secondo è
            quello che è stato registrato come incassato. Quando i due si allontanano c’è
            qualcuno che risulta abbonato e non paga.
          </p>
        </TerminalPanel>

        <TerminalPanel
          titolo="CREDITI"
          meta={quando}
          piede={`IN CIRCOLO: ${cifra(c.inCircolo)}`}
        >
          <TerminalRows
            voci={[
              ['Entrati nel periodo', cifra(c.entrate)],
              ['Usciti nel periodo', cifra(c.uscite)],
              {
                id: 'saldo',
                label: 'Differenza',
                valore: `${c.saldo >= 0 ? '+' : ''}${cifra(c.saldo)}`,
                tono: c.saldo > 0 ? 'attesa' : 'spento',
              },
              ['Movimenti', cifra(c.quante)],
              ['Fermi nei portafogli', cifra(c.inCircolo)],
              ['Fermi nelle casse', cifra(c.inCassa)],
            ]}
          />
          {c.perCausale.length > 0 && (
            <>
              <div className="tv-riga" aria-hidden="true" />
              <TerminalRows
                voci={c.perCausale.map((v) => ({
                  id: v.causale,
                  label: nomeCausale(v.causale),
                  valore: `${v.quanti >= 0 ? '+' : ''}${cifra(v.quanti)}`,
                }))}
              />
            </>
          )}
          {/* Il magazzino che si gonfia e' il problema che non fa rumore:
              crediti che entrano e non escono vogliono dire un negozio che
              non compra nessuno, e si vede solo guardando la differenza. */}
          {c.saldo > 0 && c.quante > 0 && (
            <p className="tv-nota">
              Nel periodo sono entrati più crediti di quanti ne siano usciti: il magazzino si
              sta gonfiando, che di solito vuol dire che nel negozio non si compra.
            </p>
          )}
        </TerminalPanel>

        <TerminalPanel titolo="IL LISTINO, IN BREVE" meta="ADESSO">
          <TerminalRows
            voci={[
              ['Piani in vendita', cifra(p.listino.piani)],
              ['Pacchetti di crediti', cifra(p.listino.pacchetti)],
              {
                id: 'off',
                label: 'Offerte in corso',
                valore: cifra(p.listino.offerteInCorso),
                tono: p.listino.offerteInCorso > 0 ? 'attesa' : 'spento',
              },
            ]}
          />
        </TerminalPanel>
      </div>
    </>
  );
}
