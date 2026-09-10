import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import { useAuth } from '../../context/AuthContext';
import { getUserById, nomeCausale, creditiMensiliDiOrg } from '../../data/db';
import { statoCassa, versaDallaCassa, chiPuoRicevere, puoUsareLaCassa } from '../../data/cassa';

const giorno = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');

/**
 * LA CASSA — i crediti dell'organizzazione, e a chi darli.
 *
 * Il piano ci mette dentro la dotazione a ogni pagamento; da qui escono
 * verso le persone. E' il pezzo che mancava alla frase "crediti mensili da
 * distribuire": distribuire vuol dire averli da qualche parte prima di
 * darli.
 *
 * Chi amministra non puo' versarli a se stesso, e non e' un sospetto: e' la
 * stessa regola che vale per le ricompense delle quest. Chi mette i crediti
 * in circolo non li incassa, se no non e' distribuzione, e' un travaso.
 */
export default function CassaPage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  const [aId, setAId] = useState('');
  const [quanti, setQuanti] = useState('');
  const [nota, setNota] = useState('');
  const [errore, setErrore] = useState('');
  const [avviso, setAvviso] = useState('');
  const [, bump] = useState(0);

  if (!puoUsareLaCassa(me)) {
    return (
      <>
        <PageShell
          title="La cassa"
          description="I crediti dell’organizzazione li dà chi ne ha il permesso."
        />
        <BackTile />
      </>
    );
  }

  const stato = statoCassa(me.orgId);
  const persone = chiPuoRicevere(me.orgId);
  const mensili = creditiMensiliDiOrg(me.orgId);

  function versa(e) {
    e.preventDefault();
    const esito = versaDallaCassa(me, { aId, quanti, nota });
    if (!esito.ok) { setErrore(esito.errore); setAvviso(''); return; }
    setErrore('');
    setAvviso(`${cifra(esito.quanti)} crediti dati. In cassa ne restano ${cifra(esito.cassa)}.`);
    setQuanti('');
    setNota('');
    bump((v) => v + 1);
  }

  return (
    <>
      <PageShell
        title="La cassa"
        description="I crediti dell’organizzazione: quanti ce ne sono, da dove arrivano e a chi darli."
      />

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="IN CASSA"
          meta={`${cifra(stato.saldo)} CREDITI`}
          piede={mensili
            ? `IL PIANO NE METTE ${cifra(mensili)} A OGNI RINNOVO`
            : 'IL TUO PIANO NON PORTA CREDITI'}
        >
          <TerminalRows
            voci={[
              ['Disponibili adesso', cifra(stato.saldo)],
              ['Entrati in tutto', cifra(stato.entrate)],
              ['Distribuiti', cifra(stato.uscite)],
            ]}
          />
          {stato.saldo === 0 && (
            <p className="tv-nota">
              {mensili
                ? 'La cassa è vuota: i crediti del piano arrivano al rinnovo dell’abbonamento.'
                : 'La cassa è vuota. I crediti del piano arrivano dal Silver in su; le quest che assegni pagano comunque chi le porta a termine.'}
            </p>
          )}
        </TerminalPanel>

        <TerminalPanel titolo="DAI CREDITI A QUALCUNO">
          {persone.length === 0 ? (
            <p className="tv-vuoto">Non c’è ancora nessuno a cui darli.</p>
          ) : (
            <form className="tv-modulo" onSubmit={versa}>
              <label className="label" htmlFor="cassa-chi">A chi
                <select id="cassa-chi" value={aId} onChange={(e) => { setAId(e.target.value); setErrore(''); }}>
                  <option value="">Scegli</option>
                  {persone.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || `#${p.achiviaId}`}</option>
                  ))}
                </select>
              </label>
              <label className="label" htmlFor="cassa-quanti">Quanti
                <input
                  id="cassa-quanti"
                  type="number"
                  min="1"
                  max={stato.saldo || undefined}
                  value={quanti}
                  onChange={(e) => { setQuanti(e.target.value); setErrore(''); }}
                />
              </label>
              <label className="label" htmlFor="cassa-nota">Perché (facoltativo)
                <input id="cassa-nota" value={nota} onChange={(e) => setNota(e.target.value)} />
              </label>
              <Button type="submit" variante="primario" blocco disabled={!aId || !quanti}>
                Dai i crediti
              </Button>
            </form>
          )}
          {errore && <p className="ui-errore" role="alert">{errore}</p>}
          {avviso && <p className="ui-esito" role="status">{avviso}</p>}
        </TerminalPanel>

        <TerminalPanel titolo="MOVIMENTI" meta={`${cifra(stato.movimenti.length)}`}>
          {stato.movimenti.length === 0 ? (
            <p className="tv-vuoto">In cassa non si è ancora mosso niente.</p>
          ) : (
            <TerminalRows
              voci={stato.movimenti.slice(0, 30).map((m) => ({
                id: m.id,
                label: `${giorno(m.creatoIl)} · ${nomeCausale(m.causale)}`,
                valore: `${m.quanti >= 0 ? '+' : ''}${cifra(m.quanti)} → ${cifra(m.saldo)}`,
                tono: m.quanti < 0 ? 'spento' : undefined,
              }))}
            />
          )}
        </TerminalPanel>
      </div>

      <BackTile />
    </>
  );
}
