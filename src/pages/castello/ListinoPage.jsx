import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import ModuloFinestra from './ModuloFinestra';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import {
  getPiani, salvaPiano, eliminaPiano,
  getPacchetti, salvaPacchetto, eliminaPacchetto,
  getRisalto, salvaRisalto, euro,
  LIVELLI_OSSERVATORIO, LIVELLI_PUBBLICITA,
} from '../../data/db';

/* Un prezzo si scrive in euro e si conserva in centesimi. La conversione
   sta qui e in nessun altro punto della schermata: un numero che passa da
   una virgola a un intero in due posti diversi prima o poi si arrotonda in
   due modi diversi. */
const inEuro = (centesimi) => (Number(centesimi) || 0) / 100;
const inCentesimi = (valore) => Math.max(0, Math.round(Number(String(valore).replace(',', '.')) * 100));

const PIANO_VUOTO = {
  nome: '', prezzo: 0, periodicita: 'mensile', perTipo: 'azienda', attivo: true,
  limiti: {
    posti: 5, annunci: 1, azioniAi: 0, creditiMensili: 0,
    osservatorio: 'no', pubblicita: 'no',
  },
};

const nomeDi = (elenco, id) => elenco.find((x) => x.id === id)?.nome || id;

/**
 * IL LISTINO — che cosa si vende e a che prezzo.
 *
 * Tre cose, e l'ordine e' quello del valore: gli abbonamenti, che sono il
 * ricavo ricorrente; i pacchetti di crediti, che sono il ricavo una volta;
 * il tariffario del risalto, che si tocca una volta all'anno.
 *
 * Ogni numero di questa pagina stava dentro il codice fino a ieri. E' il
 * motivo per cui la pagina esiste: perche' cambiare un prezzo torni a
 * essere una decisione e smetta di essere una pubblicazione.
 */
export default function ListinoPage() {
  const [apri, setApri] = useState(null);      // { tipo: 'piano'|'pacchetto', dati }
  const [errore, setErrore] = useState('');
  const [avviso, setAvviso] = useState('');
  const [, bump] = useState(0);
  const ridisegna = () => bump((v) => v + 1);

  const piani = getPiani();
  const pacchetti = getPacchetti();
  const risalto = getRisalto();

  function salva() {
    const { tipo, dati } = apri;
    const esito = tipo === 'piano' ? salvaPiano(dati) : salvaPacchetto(dati);
    if (!esito) { setErrore('Non è stato possibile salvare: lo spazio è finito.'); return; }
    setErrore('');
    setAvviso(tipo === 'piano' ? 'Piano salvato.' : 'Pacchetto salvato.');
    setApri(null);
    ridisegna();
  }

  function togli(tipo, id) {
    const esito = tipo === 'piano' ? eliminaPiano(id) : eliminaPacchetto(id);
    if (!esito.ok) { setErrore(esito.errore); setAvviso(''); return; }
    setErrore('');
    setAvviso('Tolto dal listino.');
    ridisegna();
  }

  /* ─── Il modulo di un piano ─── */
  const modificaPiano = (p) => setApri({
    tipo: 'piano',
    dati: p ? { ...p, limiti: { ...p.limiti } } : { ...PIANO_VUOTO, limiti: { ...PIANO_VUOTO.limiti } },
  });
  const campo = (chiave, valore) => setApri((s) => ({ ...s, dati: { ...s.dati, [chiave]: valore } }));
  const limite = (chiave, valore) => setApri((s) => ({
    ...s, dati: { ...s.dati, limiti: { ...s.dati.limiti, [chiave]: valore } },
  }));

  return (
    <>
      <PageShell
        title="Listino"
        description="Gli abbonamenti, i pacchetti di crediti e il tariffario del risalto. Qui i prezzi si cambiano, non si ricompilano."
      />

      <div className="ui-blocco con-stacco">
        <TerminalPanel titolo="ABBONAMENTI" meta={`${cifra(piani.length)} piani`}>
          {piani.map((p) => (
            <section key={p.id} className="cas-scheda">
              <header className="cas-scheda-testa">
                <b>{p.nome}</b>
                <small>
                  {[
                    p.prezzo === 0 ? 'gratuito' : `${euro(p.prezzo)} al ${p.periodicita === 'annuale' ? 'anno' : 'mese'}`,
                    p.perTipo === 'tutti' ? 'aziende e gruppi' : p.perTipo === 'azienda' ? 'solo aziende' : 'solo gruppi',
                    p.attivo ? null : 'spento',
                  ].filter(Boolean).join(' · ')}
                </small>
              </header>
              <TerminalRows
                voci={[
                  ['Persone', p.limiti.posti == null ? 'senza limite' : cifra(p.limiti.posti)],
                  ['Annunci aperti', cifra(p.limiti.annunci)],
                  p.perTipo === 'personalizzata' ? null : [
                    'Domande all’assistente',
                    p.limiti.azioniAi ? `${cifra(p.limiti.azioniAi)} al mese` : 'nessuna',
                  ],
                  ['Crediti ogni mese', cifra(p.limiti.creditiMensili)],
                  p.perTipo === 'personalizzata'
                    ? null
                    : ['Osservatorio', nomeDi(LIVELLI_OSSERVATORIO, p.limiti.osservatorio)],
                  ['Pubblicità', nomeDi(LIVELLI_PUBBLICITA, p.limiti.pubblicita)],
                ].filter(Boolean)}
              />
              <div className="cas-azioni">
                <Button variante="secondario" compatto onClick={() => modificaPiano(p)}>Modifica</Button>
                <Button
                  variante="fantasma"
                  compatto
                  onClick={() => { salvaPiano({ id: p.id, attivo: !p.attivo }); ridisegna(); }}
                >
                  {p.attivo ? 'Spegni' : 'Accendi'}
                </Button>
                <Button variante="fantasma" compatto onClick={() => togli('piano', p.id)}>Elimina</Button>
              </div>
            </section>
          ))}
          <div className="cas-azioni">
            <Button variante="primario" blocco onClick={() => modificaPiano(null)}>
              Aggiungi un piano
            </Button>
          </div>
        </TerminalPanel>

        <TerminalPanel
          titolo="PACCHETTI DI CREDITI"
          meta={`${cifra(pacchetti.length)} pacchetti`}
        >
          {pacchetti.length === 0 && (
            <p className="tv-vuoto">Nessun pacchetto. Finché non ce n’è uno, i crediti non si comprano.</p>
          )}
          {pacchetti.map((p) => (
            <section key={p.id} className="cas-scheda">
              <header className="cas-scheda-testa">
                <b>{p.nome || `${cifra(p.crediti)} crediti`}</b>
                <small>{p.attivo ? euro(p.prezzo) : `${euro(p.prezzo)} · spento`}</small>
              </header>
              <TerminalRows
                voci={[
                  { id: 'prezzo', label: 'Si paga', valore: euro(p.prezzo) },
                  ['Crediti', cifra(p.crediti)],
                  p.bonus
                    ? { id: 'bonus', label: 'In più', valore: `${cifra(p.bonus)} crediti`, tono: 'attesa' }
                    : null,
                ].filter(Boolean)}
              />
              <div className="cas-azioni">
                <Button
                  variante="secondario"
                  compatto
                  onClick={() => setApri({ tipo: 'pacchetto', dati: { ...p } })}
                >
                  Modifica
                </Button>
                <Button
                  variante="fantasma"
                  compatto
                  onClick={() => { salvaPacchetto({ id: p.id, attivo: !p.attivo }); ridisegna(); }}
                >
                  {p.attivo ? 'Spegni' : 'Accendi'}
                </Button>
                <Button variante="fantasma" compatto onClick={() => togli('pacchetto', p.id)}>Elimina</Button>
              </div>
            </section>
          ))}
          <div className="cas-azioni">
            <Button
              variante="primario"
              blocco
              onClick={() => setApri({
                tipo: 'pacchetto',
                dati: { nome: '', prezzo: 1000, crediti: 1000, attivo: true },
              })}
            >
              Aggiungi un pacchetto
            </Button>
          </div>
        </TerminalPanel>

        <TerminalPanel titolo="RISALTO DEGLI ANNUNCI" meta="IN CREDITI">
          <TerminalRows
            voci={risalto.map((r) => ({
              id: String(r.settimane),
              label: `${r.settimane} ${r.settimane === 1 ? 'settimana' : 'settimane'}`,
              valore: `${cifra(r.costo)} crediti`,
            }))}
          />
          <form
            className="tv-modulo"
            onSubmit={(e) => {
              e.preventDefault();
              const nuove = risalto.map((r) => ({
                settimane: r.settimane,
                costo: Number(new FormData(e.target).get(`ris-${r.settimane}`)),
              }));
              salvaRisalto(nuove);
              setAvviso('Tariffario aggiornato.');
              ridisegna();
            }}
          >
            {risalto.map((r) => (
              <label className="label" key={r.settimane} htmlFor={`ris-${r.settimane}`}>
                {r.settimane === 1 ? '1 settimana' : `${r.settimane} settimane`}
                <input
                  id={`ris-${r.settimane}`}
                  name={`ris-${r.settimane}`}
                  type="number"
                  min="0"
                  defaultValue={r.costo}
                />
              </label>
            ))}
            <Button type="submit" variante="secondario" blocco>Salva il tariffario</Button>
          </form>
        </TerminalPanel>

        {errore && <p className="ui-errore" role="alert">{errore}</p>}
        {avviso && <p className="ui-esito" role="status">{avviso}</p>}
      </div>

      {apri?.tipo === 'piano' && (
        <ModuloFinestra
          titolo={apri.dati.id ? 'Modifica il piano' : 'Nuovo piano'}
          onSalva={salva}
          onChiudi={() => setApri(null)}
        >
          <label className="label" htmlFor="pia-nome">Nome
            <input id="pia-nome" value={apri.dati.nome} onChange={(e) => campo('nome', e.target.value)} required />
          </label>
          <label className="label" htmlFor="pia-prezzo">Prezzo in euro
            <input
              id="pia-prezzo"
              type="number"
              min="0"
              step="0.01"
              value={inEuro(apri.dati.prezzo)}
              onChange={(e) => campo('prezzo', inCentesimi(e.target.value))}
            />
          </label>
          <label className="label" htmlFor="pia-per">Ogni
            <select id="pia-per" value={apri.dati.periodicita} onChange={(e) => campo('periodicita', e.target.value)}>
              <option value="mensile">mese</option>
              <option value="annuale">anno</option>
            </select>
          </label>
          <label className="label" htmlFor="pia-tipo">Per chi
            <select id="pia-tipo" value={apri.dati.perTipo} onChange={(e) => campo('perTipo', e.target.value)}>
              <option value="tutti">Aziende e gruppi</option>
              <option value="azienda">Solo aziende</option>
              <option value="personalizzata">Solo gruppi</option>
            </select>
          </label>
          <label className="label" htmlFor="pia-posti">Posti (vuoto = senza limite)
            <input
              id="pia-posti"
              type="number"
              min="1"
              value={apri.dati.limiti.posti ?? ''}
              onChange={(e) => limite('posti', e.target.value === '' ? null : Number(e.target.value))}
            />
          </label>
          <label className="label" htmlFor="pia-ann">Annunci aperti
            <input
              id="pia-ann"
              type="number"
              min="0"
              value={apri.dati.limiti.annunci}
              onChange={(e) => limite('annunci', Number(e.target.value))}
            />
          </label>
          <label className="label" htmlFor="pia-cred">Crediti ogni mese
            <input
              id="pia-cred"
              type="number"
              min="0"
              value={apri.dati.limiti.creditiMensili}
              onChange={(e) => limite('creditiMensili', Number(e.target.value))}
            />
          </label>
          {/* L'assistente e l'osservatorio non esistono per i gruppi: i due
              campi spariscono invece di restare li' a zero, che sembrerebbe
              una scelta da rifare a ogni modifica. */}
          {apri.dati.perTipo !== 'personalizzata' && (
          <label className="label" htmlFor="pia-ai">Domande all’assistente al mese (0 = niente assistente)
            <input
              id="pia-ai"
              type="number"
              min="0"
              value={apri.dati.limiti.azioniAi}
              onChange={(e) => limite('azioniAi', Number(e.target.value))}
            />
          </label>
          )}
          {apri.dati.perTipo !== 'personalizzata' && (
          <label className="label" htmlFor="pia-oss">Osservatorio
            <select
              id="pia-oss"
              value={apri.dati.limiti.osservatorio}
              onChange={(e) => limite('osservatorio', e.target.value)}
            >
              {LIVELLI_OSSERVATORIO.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </label>
          )}
          <label className="label" htmlFor="pia-pub">Pubblicità
            <select
              id="pia-pub"
              value={apri.dati.limiti.pubblicita}
              onChange={(e) => limite('pubblicita', e.target.value)}
            >
              {LIVELLI_PUBBLICITA.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </label>
        </ModuloFinestra>
      )}

      {apri?.tipo === 'pacchetto' && (
        <ModuloFinestra
          titolo={apri.dati.id ? 'Modifica il pacchetto' : 'Nuovo pacchetto'}
          nota="Prezzo e crediti si scelgono tutti e due: la differenza fra i due è quanto conviene comprare in blocco."
          onSalva={salva}
          onChiudi={() => setApri(null)}
        >
          <label className="label" htmlFor="pac-nome">Nome
            <input id="pac-nome" value={apri.dati.nome} onChange={(e) => campo('nome', e.target.value)} />
          </label>
          <label className="label" htmlFor="pac-prezzo">Prezzo in euro
            <input
              id="pac-prezzo"
              type="number"
              min="0"
              step="0.01"
              value={inEuro(apri.dati.prezzo)}
              onChange={(e) => campo('prezzo', inCentesimi(e.target.value))}
            />
          </label>
          <label className="label" htmlFor="pac-cred">Quanti crediti
            <input
              id="pac-cred"
              type="number"
              min="1"
              value={apri.dati.crediti}
              onChange={(e) => campo('crediti', Number(e.target.value))}
            />
          </label>
          <p className="ui-dialog-hint">
            {(() => {
              const bonus = Math.max(0, Number(apri.dati.crediti) - Number(apri.dati.prezzo));
              return bonus > 0
                ? `Chi lo compra prende ${cifra(bonus)} crediti in più di quelli che paga.`
                : 'Nessun vantaggio rispetto al taglio più piccolo: va bene per il primo scalino.';
            })()}
          </p>
        </ModuloFinestra>
      )}
    </>
  );
}
