import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import Chips from '../../components/ui/Chips';
import ModuloFinestra from './ModuloFinestra';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import { useAuth } from '../../context/AuthContext';
import {
  elencoClienti, schedaCliente, mostraIdentita, identitaViste, MOTIVI_IDENTITA,
} from '../../data/castello';
import { getUserById, contoMovimenti, nomeCausale, nomeOrg, CAUSALI } from '../../data/db';

const giorno = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');

const ORDINI = [
  { id: 'valore', label: 'CHI HA PAGATO' },
  { id: 'crediti', label: 'PIÙ CREDITI' },
  { id: 'recenti', label: 'PIÙ RECENTI' },
  { id: 'fermi', label: 'PIÙ FERMI' },
];

/**
 * IL CRM — le persone, e con quali si ha davvero a che fare.
 *
 * Quello che si vede sempre e' operativo: numero Achivia, email, da quando
 * c'e', quando si e' fatto vedere l'ultima volta, quanto ha speso e quanto
 * ha comprato, in quali organizzazioni sta. Basta a fare tutto il lavoro di
 * tutti i giorni — attivare un'offerta, verificare un movimento, capire se
 * un cliente si sta staccando.
 *
 * Il nome e il cognome no. Quelli si chiedono, uno alla volta, dicendo
 * perche', e ogni richiesta lascia una riga con chi l'ha fatta e quando.
 * Non e' un ostacolo messo per scrupolo: e' quello che permette di tenere
 * l'anagrafica a portata di mano invece di non poterla tenere affatto. Il
 * registro si legge in "Chi ha guardato".
 */
export default function CrmPage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  const [cerca, setCerca] = useState('');
  const [ordina, setOrdina] = useState('valore');
  const [aperto, setAperto] = useState(null);
  const [chiede, setChiede] = useState(null);       // { userId, motivo, nota }
  const [identita, setIdentita] = useState(null);   // { userId, nome, email }
  const [errore, setErrore] = useState('');

  const righe = elencoClienti({ cerca, ordina });
  const scheda = aperto ? schedaCliente(aperto) : null;

  function chiediIdentita() {
    const esito = mostraIdentita(me, chiede.userId, { motivo: chiede.motivo, nota: chiede.nota });
    if (!esito.ok) { setErrore(esito.errore); return; }
    setErrore('');
    setIdentita({ userId: chiede.userId, nome: esito.nome, email: esito.email });
    setChiede(null);
  }

  return (
    <>
      <PageShell
        title="CRM"
        description="Le persone come clienti: numero, email, movimenti, organizzazioni. Il nome si chiede a parte e resta scritto che l’hai chiesto."
      />

      <div className="oss-ricerca">
        <label className="label" htmlFor="crm-cerca">Cerca per numero Achivia o email</label>
        <input
          id="crm-cerca"
          name="crm-cerca"
          type="search"
          autoComplete="off"
          placeholder="#10000042 oppure nome@esempio.it"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
        />
      </div>

      <Chips items={ORDINI} value={ordina} onChange={setOrdina} ariaLabel="Come ordinare" />

      <div className="ui-blocco con-stacco">
        <TerminalPanel titolo="PERSONE" meta={`${cifra(righe.length)}`}>
          {righe.length === 0 ? (
            <p className="tv-vuoto">Nessuno con questi criteri.</p>
          ) : (
            <TerminalRows
              voci={righe.slice(0, 60).map((r) => ({
                id: r.id,
                label: `${r.numero} · ${r.nickname}`,
                valore: r.valore > 0 ? `${cifra(r.valore)} crediti comprati` : `${cifra(r.crediti)} crediti`,
                tono: r.giorniFermo != null && r.giorniFermo > 30 ? 'spento' : undefined,
              }))}
              attivo={aperto}
              onSceglie={(id) => { setAperto(id === aperto ? null : id); setIdentita(null); }}
              ariaLabel="Persone"
              controlla="crm-scheda"
            />
          )}
          {righe.length > 60 && (
            <p className="tv-nota">Ne mostro sessanta: restringi la ricerca per vedere le altre.</p>
          )}
        </TerminalPanel>

        {scheda && (
          <TerminalPanel titolo="SCHEDA" meta={scheda.numero} id="crm-scheda">
            <TerminalRows
              voci={[
                ['Come si fa chiamare', scheda.nickname],
                ['Email', scheda.email || '—'],
                [
                  'Iscritto il',
                  scheda.dataStimata ? `${giorno(scheda.iscrittoIl)} (stimata)` : giorno(scheda.iscrittoIl),
                ],
                ['Ultimo accesso', giorno(scheda.ultimoAccesso)],
                {
                  id: 'fermo',
                  label: 'Fermo da',
                  valore: scheda.giorniFermo == null ? 'mai entrato' : `${cifra(scheda.giorniFermo)} giorni`,
                  tono: scheda.giorniFermo != null && scheda.giorniFermo > 30 ? 'errore' : undefined,
                },
                scheda.ultimaAzione ? ['Ultima cosa fatta', scheda.ultimaAzione] : null,
                ['Crediti in cassa', cifra(scheda.crediti)],
                ['Crediti comprati', cifra(scheda.comprato)],
                ['Crediti spesi', cifra(scheda.speso)],
                ['Movimenti', cifra(scheda.movimenti)],
                ['Livello', cifra(scheda.livello)],
              ].filter(Boolean)}
            />

            <div className="tv-riga" aria-hidden="true" />
            <p className="tv-sottotitolo">Organizzazioni</p>
            {scheda.organizzazioni.length === 0 ? (
              <p className="tv-vuoto">Non è in nessuna organizzazione.</p>
            ) : (
              <TerminalRows
                voci={scheda.organizzazioni.map((o) => ({
                  id: o.orgId,
                  label: o.nome,
                  valore: [o.ruolo, o.paga ? 'paga' : null, o.dentro ? null : 'uscito']
                    .filter(Boolean).join(' · '),
                  tono: o.dentro ? undefined : 'spento',
                }))}
              />
            )}

            <div className="tv-riga" aria-hidden="true" />
            {identita?.userId === scheda.id ? (
              <>
                <p className="tv-sottotitolo">Identità</p>
                <TerminalRows voci={[['Nome dato alla registrazione', identita.nome], ['Email', identita.email]]} />
                <p className="tv-nota">
                  Questa richiesta è stata scritta nel registro delle occhiate, con la data e
                  il motivo.
                </p>
              </>
            ) : (
              <>
                <p className="tv-nota">
                  Il nome e il cognome non si vedono da qui. Si chiedono dicendo perché, e la
                  richiesta resta scritta.
                </p>
                <div className="cas-azioni">
                  <Button
                    variante="secondario"
                    onClick={() => { setChiede({ userId: scheda.id, motivo: 'pagamento', nota: '' }); setErrore(''); }}
                  >
                    Mostra l’identità
                  </Button>
                </div>
              </>
            )}
            {identitaViste({ userId: scheda.id }).length > 0 && (
              <p className="tv-nota">
                Già guardata {cifra(identitaViste({ userId: scheda.id }).length)} volte.
              </p>
            )}
          </TerminalPanel>
        )}
      </div>

      {scheda && <StoricoCrediti scheda={scheda} />}

      {chiede && (
        <ModuloFinestra
          titolo="Perché ti serve l’identità"
          nota="Resta scritto chi ha guardato, di chi, quando e per quale motivo."
          conferma="Mostra"
          onSalva={chiediIdentita}
          onChiudi={() => setChiede(null)}
        >
          <label className="label" htmlFor="idv-motivo">Motivo
            <select
              id="idv-motivo"
              value={chiede.motivo}
              onChange={(e) => setChiede((s) => ({ ...s, motivo: e.target.value }))}
            >
              {MOTIVI_IDENTITA.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </label>
          <label className="label" htmlFor="idv-nota">
            {chiede.motivo === 'altro' ? 'Spiega quale' : 'Nota (facoltativa)'}
            <textarea
              id="idv-nota"
              rows={3}
              value={chiede.nota}
              onChange={(e) => setChiede((s) => ({ ...s, nota: e.target.value }))}
            />
          </label>
          {errore && <p className="ui-errore" role="alert">{errore}</p>}
        </ModuloFinestra>
      )}
    </>
  );
}

/* ─── Lo storico dei crediti di una persona ──────────────────
   Non "gli ultimi otto movimenti" ma tutto quello che si e' mosso, con il
   riepilogo per causale sopra: e' la domanda che un CRM deve saper
   rispondere davvero — questi crediti da dove sono arrivati e dove sono
   finiti — e otto righe rispondono solo se il conto e' nuovo.

   Il filtro per causale sta qui e non nell'elenco delle persone: si arriva
   con una domanda gia' fatta ("ha comprato?", "quanto ha speso?") e
   scorrere trecento righe per trovarne sei e' il modo di non trovarle. */
function StoricoCrediti({ scheda }) {
  const [causale, setCausale] = useState('');
  const [tutti, setTutti] = useState(false);
  const conto = contoMovimenti({ userId: scheda.id });
  const righe = causale ? conto.righe.filter((m) => m.causale === causale) : conto.righe;
  const mostrate = tutti ? righe : righe.slice(0, 25);
  // Solo le causali che questa persona ha davvero: un filtro su una voce
  // che non ha nessuna riga e' un filtro che porta a una schermata vuota.
  const sue = CAUSALI.filter((v) => conto.perCausale.some((x) => x.causale === v.id));

  return (
    <div className="ui-blocco con-stacco">
      <TerminalPanel
        titolo="STORICO DEI CREDITI"
        meta={`${cifra(conto.quante)} movimenti`}
        piede={`ENTRATI ${cifra(conto.entrate)} · USCITI ${cifra(conto.uscite)}`}
      >
        {conto.quante === 0 ? (
          <p className="tv-vuoto">Su questo conto non si è mai mosso niente.</p>
        ) : (
          <>
            <TerminalRows
              voci={conto.perCausale.map((v) => ({
                id: v.causale,
                label: v.nome,
                valore: `${v.quanti >= 0 ? '+' : ''}${cifra(v.quanti)} · ${cifra(v.righe)}`,
              }))}
            />

            {sue.length > 1 && (
              <div className="cas-azioni">
                <Button
                  variante={causale ? 'fantasma' : 'secondario'}
                  compatto
                  onClick={() => setCausale('')}
                >
                  Tutto
                </Button>
                {sue.map((v) => (
                  <Button
                    key={v.id}
                    variante={causale === v.id ? 'secondario' : 'fantasma'}
                    compatto
                    onClick={() => setCausale(v.id)}
                  >
                    {v.nome}
                  </Button>
                ))}
              </div>
            )}

            <div className="tv-riga" aria-hidden="true" />
            <TerminalRows
              voci={mostrate.map((m) => ({
                id: m.id,
                label: [
                  giorno(m.creatoIl),
                  nomeCausale(m.causale),
                  m.orgId ? nomeOrg(m.orgId) : null,
                ].filter(Boolean).join(' · '),
                valore: `${m.quanti >= 0 ? '+' : ''}${cifra(m.quanti)}${m.saldo == null ? '' : ` → ${cifra(m.saldo)}`}`,
                tono: m.quanti < 0 ? 'spento' : undefined,
              }))}
            />

            {righe.length > mostrate.length && (
              <div className="cas-azioni">
                <Button variante="fantasma" compatto onClick={() => setTutti(true)}>
                  Mostra tutti i {cifra(righe.length)}
                </Button>
              </div>
            )}
            <p className="tv-nota">
              La freccia è il saldo dopo il movimento. Le righe più vecchie del registro non ce
              l’hanno: sono state scritte prima che venisse tenuto.
            </p>
          </>
        )}
      </TerminalPanel>
    </div>
  );
}
