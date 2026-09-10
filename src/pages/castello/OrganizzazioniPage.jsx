import { useMemo, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import { elencoOrganizzazioni } from '../../data/castello';
import { euro } from '../../data/db';

const quando = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');

const VISTE = [
  { id: 'tutte', label: 'TUTTE' },
  { id: 'paganti', label: 'PAGANO' },
  { id: 'limite', label: 'AL LIMITE' },
  { id: 'ferme', label: 'FERME' },
  { id: 'chiuse', label: 'CHIUSE' },
];

/**
 * Le organizzazioni, una per una.
 *
 * Non e' un elenco da leggere tutto: e' un elenco da filtrare. Le tre viste
 * che contano non sono "tutte" — sono quelle che chiedono di fare qualcosa:
 * chi e' arrivato al limite dei posti (comprera' o se ne andra', e sono le
 * uniche due cose che puo' fare), chi non si fa vedere da un mese (se ne
 * sta andando e non l'ha ancora detto), chi ha gia' chiuso.
 *
 * Di persone non c'e' nessun nome: il proprietario e' un numero Achivia. Il
 * nome sta nel CRM, dove guardarlo lascia una traccia.
 */
export default function OrganizzazioniPage() {
  const [vista, setVista] = useState('tutte');
  const [cerca, setCerca] = useState('');
  const tutte = useMemo(() => elencoOrganizzazioni(), []);

  const q = cerca.trim().toLowerCase();
  const filtrate = tutte
    .filter((o) => {
      if (vista === 'paganti') return o.paga && !o.chiusa;
      if (vista === 'limite') return o.alLimite && !o.chiusa;
      if (vista === 'ferme') return !o.chiusa && o.persone > 0 && o.vivi === 0;
      if (vista === 'chiuse') return o.chiusa;
      return true;
    })
    .filter((o) => !q || o.nome.toLowerCase().includes(q) || o.codice.toLowerCase().includes(q));

  return (
    <>
      <PageShell
        title="Organizzazioni"
        description="Chi c’è, chi paga, chi sta per finire i posti e chi non si fa più vedere."
      />

      <div className="oss-ricerca">
        <label className="label" htmlFor="cas-cerca">Cerca per nome o codice</label>
        <input
          id="cas-cerca"
          name="cas-cerca"
          type="search"
          autoComplete="off"
          placeholder="Faro, oppure FARO01"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
        />
      </div>

      <Chips items={VISTE} value={vista} onChange={setVista} ariaLabel="Quali organizzazioni" />

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="ELENCO"
          meta={`${cifra(filtrate.length)} su ${cifra(tutte.length)}`}
          piede={vista === 'limite'
            ? 'CHI È AL LIMITE COMPRA O SE NE VA: NON C’È UNA TERZA COSA'
            : undefined}
        >
          {filtrate.length === 0 ? (
            <p className="tv-vuoto">Nessuna organizzazione in questa vista.</p>
          ) : (
            filtrate.map((o) => (
              <section key={o.id} className="cas-scheda">
                <header className="cas-scheda-testa">
                  <b>{o.nome}</b>
                  <small>
                    {[
                      o.tipo === 'azienda' ? 'Azienda' : 'Gruppo',
                      o.codice,
                      o.chiusa ? `chiusa il ${quando(o.chiusaIl)}` : null,
                    ].filter(Boolean).join(' · ')}
                  </small>
                </header>
                <TerminalRows
                  voci={[
                    {
                      id: 'piano',
                      label: 'Piano',
                      valore: o.paga ? `${o.piano} · ${euro(o.prezzo)}` : o.piano,
                      tono: o.paga ? undefined : 'spento',
                    },
                    o.pagaDal ? ['Paga dal', quando(o.pagaDal)] : null,
                    o.paga
                      ? {
                        id: 'coperta',
                        label: 'Pagata fino al',
                        valore: quando(o.copertaFinoAl),
                        tono: !o.copertaFinoAl || new Date(o.copertaFinoAl) < new Date()
                          ? 'errore' : undefined,
                      }
                      : null,
                    {
                      id: 'posti',
                      label: 'Persone',
                      valore: o.posti == null
                        ? `${cifra(o.persone)} · senza limite`
                        : `${cifra(o.persone)} su ${cifra(o.posti)}`,
                      tono: o.alLimite ? 'attesa' : undefined,
                    },
                    {
                      id: 'vivi',
                      label: 'Attive negli ultimi 30 giorni',
                      valore: cifra(o.vivi),
                      tono: o.persone > 0 && o.vivi === 0 ? 'errore' : undefined,
                    },
                    o.azioniAi
                      ? {
                        id: 'ai',
                        label: 'Assistente questo mese',
                        valore: o.azioniAi,
                        tono: o.aiEsaurito ? 'attesa' : undefined,
                      }
                      : null,
                    o.cassa ? ['In cassa', `${cifra(o.cassa)} crediti`] : null,
                    ['Aperta il', quando(o.creataIl)],
                    ['Proprietario', o.proprietario],
                  ].filter(Boolean)}
                />
              </section>
            ))
          )}
        </TerminalPanel>
      </div>
    </>
  );
}
