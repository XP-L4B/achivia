import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import Button from '../../components/ui/Button';
import ModuloFinestra from './ModuloFinestra';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import { useAuth } from '../../context/AuthContext';
import {
  daRinnovare, getPagamenti, registraPagamento, dotazioneDovuta, distribuisciDotazione,
  getOrganizzazioni, pianoDiOrg, getPiani, nomeOrg, euro, getUserById,
} from '../../data/db';

const giorno = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');

/**
 * I PAGAMENTI — il denaro incassato, e i crediti che ne escono.
 *
 * La regola che questa pagina fa rispettare e' una: i crediti del piano
 * escono solo dopo un pagamento. Non alla scadenza, non perche' sono passati
 * trenta giorni — dopo un incasso. Registrare un pagamento qui fa tre cose
 * insieme, perche' sono la stessa cosa vista da tre parti: apre o rinnova
 * l'abbonamento, mette l'organizzazione sul piano pagato, e fa uscire la
 * dotazione al proprietario.
 *
 * Il servizio di pagamento non e' ancora collegato: finche' non lo e', si
 * registra a mano da qui. Il giorno in cui arriva, chiamera' la stessa
 * funzione e questa pagina diventera' il registro di quello che ha fatto.
 */
export default function PagamentiPage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  const [apri, setApri] = useState(null);
  const [errore, setErrore] = useState('');
  const [avviso, setAvviso] = useState('');
  const [, bump] = useState(0);
  const ridisegna = () => bump((v) => v + 1);

  const scoperte = daRinnovare();
  const pagamenti = getPagamenti().slice(0, 30);
  const piani = getPiani();
  const dovute = getOrganizzazioni()
    .filter((o) => !o.chiusaIl)
    .map((o) => ({ orgId: o.id, nome: o.nome || o.id, ...dotazioneDovuta(o.id) }))
    .filter((d) => d.dovuta);

  function paga() {
    const esito = registraPagamento({ ...apri, daId: me?.id });
    if (!esito.ok) { setErrore(esito.errore); setAvviso(''); return; }
    setErrore('');
    setAvviso(esito.dotazione.ok
      ? `Pagamento registrato. ${cifra(esito.dotazione.crediti)} crediti al proprietario.`
      : `Pagamento registrato. Nessuna dotazione: ${esito.dotazione.errore}`);
    setApri(null);
    ridisegna();
  }

  function dai(orgId) {
    const esito = distribuisciDotazione(orgId);
    if (!esito.ok) { setErrore(esito.errore); setAvviso(''); return; }
    setErrore('');
    setAvviso(`${cifra(esito.crediti)} crediti dati.`);
    ridisegna();
  }

  const apriPer = (orgId) => {
    const piano = pianoDiOrg(orgId);
    setApri({ orgId, pianoId: piano.id, importo: piano.prezzo, nota: '' });
    setErrore('');
  };

  return (
    <>
      <PageShell
        title="Pagamenti"
        description="Chi deve rinnovare, chi aspetta i crediti del piano, e quello che è stato incassato."
      />

      <div className="ui-blocco con-stacco">
        {/* Prima chi deve pagare: e' l'unica cosa di questa pagina che
            qualcuno sta aspettando dall'altra parte. */}
        <TerminalPanel
          titolo="DA RINNOVARE"
          meta={`${cifra(scoperte.length)}`}
          piede={scoperte.length ? 'UN ABBONAMENTO APERTO CHE NON PAGA È UN BUCO NEI CONTI' : undefined}
        >
          {scoperte.length === 0 ? (
            <p className="tv-vuoto">Nessuna organizzazione scoperta.</p>
          ) : scoperte.map((r) => (
            <section key={r.orgId} className="cas-scheda">
              <header className="cas-scheda-testa">
                <b>{r.nome}</b>
                <small>{`${r.piano} · ${euro(r.importo)}`}</small>
              </header>
              <TerminalRows
                voci={[
                  r.maiPagato
                    ? { id: 'mai', label: 'Pagamenti', valore: 'mai', tono: 'errore' }
                    : { id: 'sc', label: 'Scoperta da', valore: `${cifra(r.giorniScoperti)} giorni`, tono: 'errore' },
                  ['Coperta fino al', giorno(r.copertoFinoAl)],
                ]}
              />
              <div className="cas-azioni">
                <Button variante="primario" compatto onClick={() => apriPer(r.orgId)}>
                  Registra un pagamento
                </Button>
              </div>
            </section>
          ))}
        </TerminalPanel>

        <TerminalPanel titolo="CREDITI DA DARE" meta={`${cifra(dovute.length)}`}>
          {dovute.length === 0 ? (
            <p className="tv-vuoto">Nessuna dotazione in scadenza: escono trenta giorni dopo l’ultima.</p>
          ) : dovute.map((d) => (
            <section key={d.orgId} className="cas-scheda">
              <header className="cas-scheda-testa">
                <b>{d.nome}</b>
                <small>{`${cifra(d.quanti)} crediti`}</small>
              </header>
              <div className="cas-azioni">
                <Button variante="secondario" compatto onClick={() => dai(d.orgId)}>
                  Dai la dotazione
                </Button>
              </div>
            </section>
          ))}
        </TerminalPanel>

        <TerminalPanel titolo="INCASSATO" meta={`${cifra(getPagamenti().length)} pagamenti`}>
          {pagamenti.length === 0 ? (
            <p className="tv-vuoto">Nessun pagamento registrato.</p>
          ) : (
            <TerminalRows
              voci={pagamenti.map((p) => ({
                id: p.id,
                label: `${giorno(p.quando)} · ${nomeOrg(p.orgId) || p.orgId}`,
                valore: `${euro(p.importo)} · ${p.piano}`,
              }))}
            />
          )}
        </TerminalPanel>

        <div className="cas-azioni">
          <Button
            variante="secondario"
            blocco
            onClick={() => {
              const prima = getOrganizzazioni().find((o) => !o.chiusaIl);
              if (prima) apriPer(prima.id);
            }}
          >
            Registra un pagamento qualsiasi
          </Button>
        </div>

        {errore && <p className="ui-errore" role="alert">{errore}</p>}
        {avviso && <p className="ui-esito" role="status">{avviso}</p>}
      </div>

      <BackTile />

      {apri && (
        <ModuloFinestra
          titolo="Registra un pagamento"
          nota="Apre o rinnova l’abbonamento, mette l’organizzazione sul piano pagato e fa uscire i crediti al proprietario."
          conferma="Registra"
          onSalva={paga}
          onChiudi={() => setApri(null)}
        >
          <label className="label" htmlFor="pag-org">Organizzazione
            <select
              id="pag-org"
              value={apri.orgId}
              onChange={(e) => {
                const piano = pianoDiOrg(e.target.value);
                setApri({ ...apri, orgId: e.target.value, pianoId: piano.id, importo: piano.prezzo });
              }}
            >
              {getOrganizzazioni().filter((o) => !o.chiusaIl).map((o) => (
                <option key={o.id} value={o.id}>{o.nome || o.id}</option>
              ))}
            </select>
          </label>
          <label className="label" htmlFor="pag-piano">Piano pagato
            <select
              id="pag-piano"
              value={apri.pianoId}
              onChange={(e) => {
                const p = piani.find((x) => x.id === e.target.value);
                setApri({ ...apri, pianoId: e.target.value, importo: p?.prezzo ?? apri.importo });
              }}
            >
              {piani.map((p) => <option key={p.id} value={p.id}>{`${p.nome} — ${euro(p.prezzo)}`}</option>)}
            </select>
          </label>
          <label className="label" htmlFor="pag-imp">Incassato in euro
            <input
              id="pag-imp"
              type="number"
              min="0"
              step="0.01"
              value={(Number(apri.importo) || 0) / 100}
              onChange={(e) => setApri({
                ...apri,
                importo: Math.max(0, Math.round(Number(String(e.target.value).replace(',', '.')) * 100)),
              })}
            />
          </label>
          <label className="label" htmlFor="pag-nota">Nota
            <textarea
              id="pag-nota"
              rows={2}
              value={apri.nota}
              onChange={(e) => setApri({ ...apri, nota: e.target.value })}
            />
          </label>
          {errore && <p className="ui-errore" role="alert">{errore}</p>}
        </ModuloFinestra>
      )}
    </>
  );
}
