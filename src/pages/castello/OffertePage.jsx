import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import BackTile from '../../components/ui/BackTile';
import ModuloFinestra from './ModuloFinestra';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import {
  getOfferte, salvaOfferta, eliminaOfferta, offertaValida,
  getPiani, getPacchetti, TIPI_OFFERTA, euro,
} from '../../data/db';

const giorno = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');
const perInput = (iso) => (iso ? String(iso).slice(0, 10) : '');

const OFFERTA_VUOTA = {
  nome: '', su: 'pacchetto', bersaglioId: null, tipo: 'percentuale', valore: 10,
  da: null, a: null, tetto: null, codice: '', attiva: true,
};

/**
 * LE OFFERTE — uno sconto con una data di scadenza.
 *
 * La data di scadenza e' la ragione per cui questa pagina esiste separata
 * dal listino: un prezzo e' una decisione, un'offerta e' una decisione che
 * finisce da sola. Se non finisse da sola sarebbe un prezzo, e allora
 * andrebbe scritta nel listino.
 *
 * Le offerte non si sommano: quando piu' d'una vale sullo stesso prodotto
 * si applica quella che fa risparmiare di piu'. E' scritto qui e non solo
 * nel codice perche' e' la domanda che ci si fa guardando due offerte
 * accese insieme.
 */
export default function OffertePage() {
  const [apri, setApri] = useState(null);
  const [errore, setErrore] = useState('');
  const [, bump] = useState(0);
  const ridisegna = () => bump((v) => v + 1);

  const offerte = getOfferte();
  const inCorso = offerte.filter((o) => offertaValida(o));
  const piani = getPiani();
  const pacchetti = getPacchetti();

  const bersagli = apri?.su === 'piano' ? piani : apri?.su === 'pacchetto' ? pacchetti : [];
  const campo = (chiave, valore) => setApri((s) => ({ ...s, [chiave]: valore }));

  function salva() {
    const esito = salvaOfferta(apri);
    if (!esito) { setErrore('Non è stato possibile salvare: lo spazio è finito.'); return; }
    setErrore('');
    setApri(null);
    ridisegna();
  }

  const nomeBersaglio = (o) => {
    if (!o.bersaglioId) return o.su === 'tutto' ? 'tutto il listino' : `tutti i ${o.su === 'piano' ? 'piani' : 'pacchetti'}`;
    const trovato = (o.su === 'piano' ? piani : pacchetti).find((x) => x.id === o.bersaglioId);
    return trovato?.nome || o.bersaglioId;
  };

  const valoreScritto = (o) => (o.tipo === 'percentuale' ? `−${o.valore}%`
    : o.tipo === 'importo' ? `−${euro(o.valore)}`
      : `+${cifra(o.valore)} crediti`);

  const riquadro = (titolo, righe, vuoto) => (
    <TerminalPanel titolo={titolo} meta={`${cifra(righe.length)}`}>
      {righe.length === 0 ? <p className="tv-vuoto">{vuoto}</p> : righe.map((o) => (
        <section key={o.id} className="cas-scheda">
          <header className="cas-scheda-testa">
            <b>{o.nome || 'Senza nome'}</b>
            <small>{[valoreScritto(o), nomeBersaglio(o), o.codice ? `codice ${o.codice}` : null]
              .filter(Boolean).join(' · ')}</small>
          </header>
          <TerminalRows
            voci={[
              ['Dal', giorno(o.da)],
              ['Al', o.a ? giorno(o.a) : 'senza scadenza'],
              o.tetto != null
                ? {
                  id: 'tetto',
                  label: 'Attivazioni',
                  valore: `${cifra(o.usi)} su ${cifra(o.tetto)}`,
                  tono: o.usi >= o.tetto ? 'errore' : undefined,
                }
                : ['Attivazioni', cifra(o.usi)],
              ['Accesa', o.attiva ? 'sì' : 'no'],
            ].filter(Boolean)}
          />
          <div className="cas-azioni">
            <Button variante="secondario" compatto onClick={() => setApri({ ...o, codice: o.codice || '' })}>
              Modifica
            </Button>
            <Button
              variante="fantasma"
              compatto
              onClick={() => { salvaOfferta({ id: o.id, attiva: !o.attiva }); ridisegna(); }}
            >
              {o.attiva ? 'Spegni' : 'Accendi'}
            </Button>
            <Button
              variante="fantasma"
              compatto
              onClick={() => { eliminaOfferta(o.id); ridisegna(); }}
            >
              Elimina
            </Button>
          </div>
        </section>
      ))}
    </TerminalPanel>
  );

  return (
    <>
      <PageShell
        title="Offerte"
        description="Sconti con una data di scadenza. Quando più d’una vale sullo stesso prodotto, si applica la migliore: non si sommano."
      />

      <div className="ui-blocco con-stacco">
        {riquadro('IN CORSO', inCorso, 'Nessuna offerta in corso.')}
        {riquadro(
          'FERME',
          offerte.filter((o) => !offertaValida(o)),
          'Nessuna offerta spenta, scaduta o esaurita.',
        )}

        <div className="cas-azioni">
          <Button variante="primario" blocco onClick={() => setApri({ ...OFFERTA_VUOTA })}>
            Crea un’offerta
          </Button>
        </div>

        {errore && <p className="ui-errore" role="alert">{errore}</p>}
      </div>

      <BackTile />

      {apri && (
        <ModuloFinestra
          titolo={apri.id ? 'Modifica l’offerta' : 'Nuova offerta'}
          nota="Senza data di fine l’offerta resta accesa finché non la spegni."
          onSalva={salva}
          onChiudi={() => setApri(null)}
        >
          <label className="label" htmlFor="off-nome">Nome
            <input id="off-nome" value={apri.nome} onChange={(e) => campo('nome', e.target.value)} required />
          </label>
          <label className="label" htmlFor="off-su">Su che cosa
            <select
              id="off-su"
              value={apri.su}
              onChange={(e) => setApri((s) => ({ ...s, su: e.target.value, bersaglioId: null }))}
            >
              <option value="pacchetto">Un pacchetto di crediti</option>
              <option value="piano">Un abbonamento</option>
              <option value="tutto">Tutto il listino</option>
            </select>
          </label>
          {apri.su !== 'tutto' && (
            <label className="label" htmlFor="off-bers">Quale
              <select
                id="off-bers"
                value={apri.bersaglioId || ''}
                onChange={(e) => campo('bersaglioId', e.target.value || null)}
              >
                <option value="">Tutti</option>
                {bersagli.map((b) => (
                  <option key={b.id} value={b.id}>{b.nome || b.id}</option>
                ))}
              </select>
            </label>
          )}
          <label className="label" htmlFor="off-tipo">Che sconto
            <select id="off-tipo" value={apri.tipo} onChange={(e) => campo('tipo', e.target.value)}>
              {TIPI_OFFERTA.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </label>
          <label className="label" htmlFor="off-val">
            Quanto ({TIPI_OFFERTA.find((t) => t.id === apri.tipo)?.unita})
            <input
              id="off-val"
              type="number"
              min="0"
              value={apri.tipo === 'importo' ? (apri.valore || 0) / 100 : apri.valore}
              step={apri.tipo === 'importo' ? '0.01' : '1'}
              onChange={(e) => campo('valore', apri.tipo === 'importo'
                ? Math.round(Number(e.target.value) * 100)
                : Number(e.target.value))}
            />
          </label>
          <label className="label" htmlFor="off-da">Dal
            <input id="off-da" type="date" value={perInput(apri.da)} onChange={(e) => campo('da', e.target.value || null)} />
          </label>
          <label className="label" htmlFor="off-a">Al (vuoto = senza scadenza)
            <input id="off-a" type="date" value={perInput(apri.a)} onChange={(e) => campo('a', e.target.value || null)} />
          </label>
          <label className="label" htmlFor="off-tetto">Quante volte al massimo (vuoto = senza tetto)
            <input
              id="off-tetto"
              type="number"
              min="1"
              value={apri.tetto ?? ''}
              onChange={(e) => campo('tetto', e.target.value === '' ? null : Number(e.target.value))}
            />
          </label>
          <label className="label" htmlFor="off-codice">Codice (vuoto = vale per tutti)
            <input
              id="off-codice"
              value={apri.codice || ''}
              autoComplete="off"
              onChange={(e) => campo('codice', e.target.value)}
            />
          </label>
        </ModuloFinestra>
      )}
    </>
  );
}
