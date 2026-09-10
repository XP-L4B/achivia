import { useEffect, useMemo, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../../components/terminal/TerminalRows';
import Istogramma from '../../components/shop/Istogramma';
import { subscribe } from '../../data/db';
import { immagineArticolo } from '../../data/articoliImmagini';
import { registroCassa } from '../../data/negozio';

/**
 * La cassa: quanto e' entrato, e quando.
 *
 * Un negozio non si tiene con un totale solo. «Sempre» dice se l'idea
 * funziona, ma non dice se questa settimana e' andata peggio della
 * scorsa — ed e' quella la domanda che si fa chi vende. Quindi qui i
 * numeri sono quattro (oggi, la settimana, il mese, sempre) e sotto c'e'
 * il disegno del tempo: trenta giorni uno accanto all'altro, e dodici
 * settimane.
 *
 * Merce e spedizioni restano separate dappertutto: sono due incassi
 * diversi, e sommarli nasconde quale dei due si sta muovendo.
 *
 * Gli ordini annullati non stanno nell'incasso — non hanno incassato
 * niente — ma non spariscono: hanno la loro riga, perche' un negozio con
 * molti annullamenti ha un problema, e un totale che li ignora non lo fa
 * vedere.
 *
 * L'istante di riferimento si fissa all'apertura: un "adesso" che cambia
 * a ogni ridisegno farebbe scorrere le colonne da solo mentre si guarda.
 */

const FINESTRE = [
  { id: 'giorni', label: 'GIORNO PER GIORNO' },
  { id: 'settimane', label: 'SETTIMANA PER SETTIMANA' },
];

export default function ShopCassaPage() {
  const [, ridisegna] = useState(0);
  const [adesso] = useState(() => Date.now());
  const [finestra, setFinestra] = useState('giorni');
  useEffect(() => subscribe(() => ridisegna((n) => n + 1)), []);

  const r = useMemo(() => registroCassa({ giorni: 30, settimane: 12, adesso }), [adesso]);
  const p = r.periodi;
  const perTempo = finestra === 'giorni' ? r.perGiorno : r.perSettimana;

  return (
    <>
      <PageShell
        title="Cassa"
        description="Quanto e’ entrato, e quando. Gli ordini annullati non contano come incasso: stanno nella loro riga."
      />

      <div className="ui-blocco con-stacco">
        <TerminalPanel titolo="OGGI" meta="CREDITI" piede={`${p.oggi.ordini} ${p.oggi.ordini === 1 ? 'ordine' : 'ordini'}`}>
          <TerminalValue
            valore={p.oggi.totale}
            unita="crediti"
            nota={p.oggi.ordini ? `scontrino medio ${p.oggi.medio}` : 'nessun ordine, per ora'}
          />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            voci={[
              { label: 'Merce', valore: p.oggi.merce },
              { label: 'Spedizioni', valore: p.oggi.spedizioni, tono: p.oggi.spedizioni ? '' : 'spento' },
            ]}
          />
        </TerminalPanel>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel titolo="IL PASSO" meta="CREDITI INCASSATI">
          <TerminalRows
            vivo
            voci={[
              { id: 'sett', label: `Questa settimana · ${p.settimana.ordini} ${p.settimana.ordini === 1 ? 'ordine' : 'ordini'}`, valore: p.settimana.totale },
              { id: 'mese', label: `Questo mese · ${p.mese.ordini} ${p.mese.ordini === 1 ? 'ordine' : 'ordini'}`, valore: p.mese.totale },
              { id: 'sempre', label: `Sempre · ${p.sempre.ordini} ${p.sempre.ordini === 1 ? 'ordine' : 'ordini'}`, valore: p.sempre.totale, tono: 'testo' },
            ]}
          />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            voci={[
              { label: 'Di cui merce', valore: p.sempre.merce },
              { label: 'Di cui spedizioni', valore: p.sempre.spedizioni, tono: p.sempre.spedizioni ? '' : 'spento' },
              { label: 'Scontrino medio', valore: p.sempre.medio },
            ]}
          />
        </TerminalPanel>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="IL TEMPO"
          meta={finestra === 'giorni' ? 'ULTIMI 30 GIORNI' : 'ULTIME 12 SETTIMANE'}
          piede={r.giornoMigliore?.totale
            ? `GIORNO MIGLIORE: ${r.giornoMigliore.etichetta} CON ${r.giornoMigliore.totale} CREDITI`
            : 'NESSUN INCASSO IN QUESTA FINESTRA'}
        >
          <Chips items={FINESTRE} value={finestra} onChange={setFinestra} ariaLabel="Come guardare il tempo" />
          <Istogramma
            righe={perTempo}
            vuoto={finestra === 'giorni'
              ? 'In questi trenta giorni non e’ entrato niente.'
              : 'In queste dodici settimane non e’ entrato niente.'}
          />
          <p className="tv-nota">
            Ha incassato in {r.giorniConIncasso} {r.giorniConIncasso === 1 ? 'giorno' : 'giorni'} su {r.giorniGuardati}.
          </p>
        </TerminalPanel>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="LE SPEDIZIONI"
          meta="PER DESTINAZIONE"
          piede={`${p.sempre.spedizioni} CREDITI DI TRASPORTI`}
        >
          <TerminalRows
            voci={r.perZona.map((z) => ({
              id: z.id,
              label: `${z.label} · ${z.ordini} ${z.ordini === 1 ? 'ordine' : 'ordini'}`,
              valore: z.spedizioni,
              tono: z.ordini ? '' : 'spento',
            }))}
          />
        </TerminalPanel>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="CHE COSA SI VENDE"
          meta={`${r.articoli.length} ARTICOLI USCITI`}
          pieghevole
          apertoDiDefault={r.articoli.length > 0}
        >
          {r.articoli.length === 0 ? (
            <p className="tv-nota">Non e’ ancora uscito niente.</p>
          ) : (
            <ol className="shop-classifica">
              {r.articoli.map((a, i) => {
                const img = immagineArticolo(a.immagine);
                return (
                  <li key={a.id} className="shop-classifica-riga">
                    <span className="shop-classifica-posto">{i + 1}</span>
                    {img && (
                      <img
                        className="shop-classifica-figura"
                        src={img}
                        alt=""
                        style={{ imageRendering: a.pixelata ? 'pixelated' : 'auto' }}
                      />
                    )}
                    <span className="shop-classifica-nome">{a.nome}</span>
                    <span className="shop-classifica-conto">
                      <b>{a.pezzi}</b>
                      <small>{a.pezzi === 1 ? 'pezzo' : 'pezzi'} · {a.crediti} crediti</small>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </TerminalPanel>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="CHI COMPRA"
          meta={`${r.clienti.length} ${r.clienti.length === 1 ? 'CLIENTE' : 'CLIENTI'}`}
          pieghevole
          apertoDiDefault={false}
        >
          {r.clienti.length === 0 ? (
            <p className="tv-nota">Ancora nessuno.</p>
          ) : (
            <TerminalRows
              voci={r.clienti.slice(0, 20).map((c) => ({
                id: c.userId,
                label: `${c.nome} · ${c.ordini} ${c.ordini === 1 ? 'ordine' : 'ordini'}`,
                valore: c.crediti,
              }))}
            />
          )}
        </TerminalPanel>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="ANNULLATI"
          meta="RIMBORSATI"
          piede={r.rimborsi.ordini ? 'CREDITI TORNATI A CHI AVEVA COMPRATO' : 'NESSUN ORDINE ANNULLATO'}
          tonoPiede={r.rimborsi.ordini ? 'attesa' : ''}
        >
          <TerminalValue
            valore={r.rimborsi.crediti}
            unita="crediti"
            nota={`${r.rimborsi.ordini} ${r.rimborsi.ordini === 1 ? 'ordine' : 'ordini'}`}
          />
        </TerminalPanel>
      </div>
    </>
  );
}
