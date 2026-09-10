import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { getUserById, creditiInCassa } from '../../data/db';
import {
  puoPubblicareAnnunci, getAnnunciDiOrg, schedaAnnuncio, salvaAnnuncio, problemiDi,
  chiudi, riapri, elimina, compraRisalto, getRisalto, MODALITA, UNITA_PAGA,
  ANNUNCIO_VUOTO, MIN_DESCRIZIONE, MAX_DESCRIZIONE, MAX_TITOLO, MAX_EMAIL,
  MAX_COMPETENZE, GRUPPI_COMPETENZE, competenzeDiGruppo, nomeCompetenza, caselleCompetenze,
  tettoAnnunci, annunciApertiDi, puoAprirneAncora, autoreDi,
} from '../../data/annunci';
import {
  CONTINENTI, paesiDi, areeDi, nomeLivelloArea,
} from '../../data/geografia';

/**
 * Gli annunci dell'organizzazione: si scrivono qui, e da qui si chiudono.
 *
 * E' una schermata dell'admin e dei co-admin — nessun ruolo su misura ci
 * arriva, perche' un annuncio impegna l'azienda con degli sconosciuti e non
 * e' una delega che si spunta in una casella.
 *
 * Le caselle obbligatorie non si contrattano, ma la schermata non le fa
 * pesare: si scrive tutto e alla fine si legge in chiaro che cosa manca,
 * una riga per problema. Un modulo che dice solo "non va" costringe a
 * indovinare, e chi indovina due volte chiude la pagina.
 *
 * Chiudere non cancella. Un annuncio chiuso resta qui, libera il posto ed
 * e' un clic per rimetterlo in bacheca — il tetto vale anche quando si
 * riapre, altrimenti bastava chiudere e riaprire per averne quanti se ne
 * vuole.
 */
const giorno = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '');

export default function AdminAnnunciPage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;

  /* Chi arriva dal pulsante "Scrivi e pubblica" della dashboard trova il
     foglio bianco gia' aperto: il pulsante ha promesso di far scrivere, e
     una pagina che invece chiede un altro clic rimangia la promessa. Chi
     arriva dal menu trova l'elenco, che e' quello che stava cercando. */
  const [parametri] = useSearchParams();
  const [bozza, setBozza] = useState(
    parametri.has('nuovo') ? ANNUNCIO_VUOTO : null,
  );
  const [problemi, setProblemi] = useState([]);
  const [errore, setErrore] = useState('');
  const [esito, setEsito] = useState('');
  const [risaltoPer, setRisaltoPer] = useState(null);
  const [daEliminare, setDaEliminare] = useState(null);
  // Cambia a ogni scrittura: e' quello che dice alla pagina di rileggere il
  // deposito. Gli annunci non stanno in uno stato di React perche' la
  // verita' e' nel deposito, e tenerne una copia vorrebbe dire tenerla
  // allineata a mano.
  const [, setGiro] = useState(0);
  const rileggi = () => setGiro((n) => n + 1);

  if (!puoPubblicareAnnunci(me)) {
    return (
      <PageShell
        title="Annunci di lavoro"
        description="Li pubblicano l’amministratore e i co-amministratori dell’organizzazione."
      />
    );
  }

  const miei = getAnnunciDiOrg(me.orgId).map(schedaAnnuncio);
  const tetto = tettoAnnunci(me.orgId);
  const aperti = annunciApertiDi(me.orgId);
  // Il risalto lo paga l'organizzazione dalla sua cassa, non chi preme
  // il pulsante: e' una spesa dell'azienda.
  const crediti = creditiInCassa(me.orgId);

  function apriModulo(a) {
    setProblemi([]);
    setErrore('');
    setEsito('');
    setBozza(a ? {
      id: a.id,
      titolo: a.titolo,
      zona: { ...a.zona },
      modalita: a.modalita,
      unita: a.unita,
      ralDa: String(a.ralDa),
      ralA: String(a.ralA),
      descrizione: a.descrizione,
      email: a.email || '',
      competenze: caselleCompetenze(a),
    } : ANNUNCIO_VUOTO);
  }

  function salva() {
    const esitoSalva = salvaAnnuncio(me, bozza);
    if (!esitoSalva.ok) {
      setProblemi(esitoSalva.problemi || []);
      setErrore(esitoSalva.errore || '');
      return;
    }
    setEsito(bozza.id ? 'Annuncio aggiornato.' : 'Annuncio pubblicato.');
    setBozza(null);
    setProblemi([]);
    setErrore('');
    rileggi();
  }

  function comando(fn, id) {
    const r = fn(me, id);
    setErrore(r.ok ? '' : r.errore || 'Non è stato possibile.');
    setEsito('');
    rileggi();
  }

  function compra(settimane) {
    const r = compraRisalto(me, risaltoPer, settimane);
    if (!r.ok) { setErrore(r.errore); return; }
    setErrore('');
    setEsito(`In evidenza per ${settimane === 1 ? 'una settimana' : `${settimane} settimane`}: ${r.costo} crediti.`);
    setRisaltoPer(null);
    rileggi();
  }

  const campo = (patch) => setBozza({ ...bozza, ...patch });
  const cambiaCompetenza = (i, valore) => campo({
    competenze: bozza.competenze.map((x, j) => (j === i ? valore : x)),
  });
  const zona = (patch) => campo({ zona: { ...bozza.zona, ...patch } });
  const lungo = String(bozza?.descrizione || '').trim().length;
  const manca = problemiDi(bozza || ANNUNCIO_VUOTO);

  return (
    <>
      <PageShell
        title="Annunci di lavoro"
        description="Le posizioni aperte della tua organizzazione, come le vede chi cerca lavoro su Achivia."
      />

      <div className="ui-corpo-pagina">
        <section className="ui-panel ui-blocco con-stacco">
          <p className="ui-ai-title">
            {aperti} di {tetto} {tetto === 1 ? 'annuncio' : 'annunci'} in bacheca
          </p>
          <p className="ui-dialog-hint">
            {tetto === 1
              ? 'Senza abbonamento si tiene un annuncio alla volta. Chiudi quello aperto per pubblicarne un altro, oppure passa a un abbonamento.'
              : 'Quanti annunci puoi tenere aperti dipende dall’abbonamento dell’organizzazione.'}
          </p>
          {!bozza && (
            <Button
              variante="primario"
              disabled={!puoAprirneAncora(me.orgId)}
              onClick={() => apriModulo(null)}
            >
              Pubblica un annuncio
            </Button>
          )}
        </section>

        {esito && <p className="ui-esito">{esito}</p>}
        {errore && <p className="ui-errore">{errore}</p>}

        {bozza && (
          <section className="ui-panel ui-blocco con-stacco">
            <p className="ui-ai-title">{bozza.id ? 'Modifica l’annuncio' : 'Nuovo annuncio'}</p>

            <label className="label" htmlFor="ann-titolo">Che ruolo cerchi</label>
            <input
              id="ann-titolo"
              name="titolo"
              value={bozza.titolo}
              maxLength={MAX_TITOLO}
              placeholder="Responsabile di magazzino, turno notte"
              onChange={(e) => campo({ titolo: e.target.value })}
            />

            <label className="label">Dove si lavora</label>
            <div className="lb-filtri">
              <label className="label">
                Continente
                <select
                  value={bozza.zona.continente}
                  onChange={(e) => zona({ continente: e.target.value, paese: '', area: '' })}
                >
                  <option value="">Scegli…</option>
                  {CONTINENTI.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>
              <label className="label">
                Paese
                <select
                  value={bozza.zona.paese}
                  disabled={!bozza.zona.continente}
                  onChange={(e) => zona({ paese: e.target.value, area: '' })}
                >
                  <option value="">Scegli…</option>
                  {paesiDi(bozza.zona.continente).map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </label>
              <label className="label">
                {nomeLivelloArea(bozza.zona.paese)}
                <select
                  value={bozza.zona.area}
                  disabled={!areeDi(bozza.zona.paese).length}
                  onChange={(e) => zona({ area: e.target.value })}
                >
                  <option value="">Tutto il paese</option>
                  {areeDi(bozza.zona.paese).map((a) => (
                    <option key={a.nome} value={a.nome}>{a.nome}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="label" htmlFor="ann-modalita">Come si lavora</label>
            <select
              id="ann-modalita"
              name="modalita"
              value={bozza.modalita}
              onChange={(e) => campo({ modalita: e.target.value })}
            >
              <option value="">Scegli…</option>
              {MODALITA.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>

            <label className="label">Quanto si offre</label>
            <div className="lb-filtri">
              <label className="label">
                Si misura in
                <select value={bozza.unita} onChange={(e) => campo({ unita: e.target.value })}>
                  {UNITA_PAGA.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </label>
              <label className="label">
                Da
                <input
                  name="ralDa"
                  type="number"
                  min="0"
                  value={bozza.ralDa}
                  onChange={(e) => campo({ ralDa: e.target.value })}
                />
              </label>
              <label className="label">
                A
                <input
                  name="ralA"
                  type="number"
                  min="0"
                  value={bozza.ralA}
                  onChange={(e) => campo({ ralA: e.target.value })}
                />
              </label>
            </div>

            <label className="label" htmlFor="ann-descrizione">Che lavoro è</label>
            <textarea
              id="ann-descrizione"
              name="descrizione"
              rows={8}
              maxLength={MAX_DESCRIZIONE}
              value={bozza.descrizione}
              placeholder="Che cosa si fa in una giornata, con chi, che cosa serve saper fare e che cosa si impara."
              onChange={(e) => campo({ descrizione: e.target.value })}
            />
            <small className="ui-dialog-hint">
              {lungo}/{MAX_DESCRIZIONE}
              {lungo < MIN_DESCRIZIONE && ` — servono almeno ${MIN_DESCRIZIONE} caratteri`}
            </small>

            <label className="label">Che competenze cerchi</label>
            <p className="ui-dialog-hint">
              Fino a {MAX_COMPETENZE}, facoltative, scelte fra le competenze che su Achivia si
              possono anche <b>certificare</b>: è quello che rende il tuo annuncio confrontabile
              con gli altri e lo fa trovare a chi quella competenza ce l’ha davvero. Se quella
              che ti serve non c’è, scrivila nella descrizione.
            </p>
            <div className="ann-competenze">
              {bozza.competenze.map((scelta, i) => (
                <label className="label" key={`competenza-${i}`}>
                  {i + 1}ª competenza
                  <select
                    value={scelta}
                    onChange={(e) => cambiaCompetenza(i, e.target.value)}
                  >
                    <option value="">—</option>
                    {GRUPPI_COMPETENZE.map((g) => (
                      <optgroup key={g.id} label={g.nome}>
                        {competenzeDiGruppo(g.id)
                          /* Quelle gia' prese nelle altre caselle spariscono
                             da questa: un elenco che permette di scegliere
                             due volte la stessa cosa e poi lo rimprovera
                             fa perdere un giro per niente. */
                          .filter((cc) => cc.id === scelta || !bozza.competenze.includes(cc.id))
                          .map((cc) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <label className="label" htmlFor="ann-email">A chi si risponde</label>
            {/* L'avvertimento sta sopra la casella e non sotto: dopo averlo
                scritto uno ha gia' deciso, e leggere li' che l'indirizzo
                sara' pubblico e' tardi. */}
            <p className="ui-dialog-hint">
              Questo indirizzo <b>sarà visibile a chiunque apra l’annuncio</b>: è lì che ti
              scriverà chi vuole candidarsi. Meglio una casella dell’organizzazione — lavoro@,
              selezione@ — che l’email personale di qualcuno.
            </p>
            <input
              id="ann-email"
              name="email"
              type="email"
              value={bozza.email}
              maxLength={MAX_EMAIL}
              placeholder="selezione@tuaazienda.it"
              onChange={(e) => campo({ email: e.target.value })}
            />

            {problemi.length > 0 && (
              <ul className="ann-problemi">
                {problemi.map((p) => <li key={p.campo + p.testo} className="ui-errore">{p.testo}</li>)}
              </ul>
            )}

            <div className="ui-dialog-actions">
              <Button variante="primario" disabled={manca.length > 0} onClick={salva}>
                {bozza.id ? 'Salva le modifiche' : 'Pubblica'}
              </Button>
              <Button variante="fantasma" onClick={() => { setBozza(null); setProblemi([]); }}>
                Annulla
              </Button>
            </div>
            {manca.length > 0 && (
              <small className="ui-dialog-hint">
                {manca.length === 1 ? 'Manca una cosa: ' : `Mancano ${manca.length} cose: `}
                {manca.map((p) => p.testo).join(' ')}
              </small>
            )}
          </section>
        )}

        {miei.length === 0 && !bozza && (
          <p className="ui-dialog-hint">
            Non hai ancora pubblicato niente. Un annuncio si vede in bacheca da qualunque
            profilo Achivia, non solo dalla tua organizzazione.
          </p>
        )}

        <ul className="ann-lista">
          {miei.map((a) => (
            <li key={a.id} className={`ann-scheda${a.risalto ? ' is-risalto' : ''}`}>
              <div className="ann-testa">
                <h3 className="ann-titolo">{a.titolo}</h3>
                <span className={`badge ${a.stato === 'pubblicato' ? 'badge-success' : 'badge-neutral'}`}>
                  {a.stato === 'pubblicato' ? 'In bacheca' : 'Chiuso'}
                </span>
              </div>
              <ul className="ann-fatti">
                <li>{a.dove}</li>
                <li>{a.comeSiLavora}</li>
                <li>{a.paga}</li>
              </ul>
              {a.competenze?.length > 0 && (
                <ul className="ann-competenze-scelte">
                  {a.competenze.map((cc) => <li key={cc}>{nomeCompetenza(cc)}</li>)}
                </ul>
              )}
              <p className="ui-dialog-hint">
                Si risponde a <b>{a.email}</b>, e lo vede chi apre l’annuncio.
              </p>
              <p className="ui-dialog-hint">
                Pubblicato il {giorno(a.creatoIl)}
                {autoreDi(a) && ` da ${autoreDi(a)}`}
                {a.risalto && ` · in evidenza fino al ${giorno(a.risaltoFinoAl)}`}
              </p>

              <div className="ann-piede">
                <Button variante="secondario" compatto onClick={() => apriModulo(a)}>Modifica</Button>
                {a.stato === 'pubblicato' ? (
                  <>
                    <Button variante="secondario" compatto onClick={() => setRisaltoPer(a.id)}>
                      {a.risalto ? 'Prolunga l’evidenza' : 'Metti in evidenza'}
                    </Button>
                    <Button variante="fantasma" compatto onClick={() => comando(chiudi, a.id)}>
                      Chiudi
                    </Button>
                  </>
                ) : (
                  <Button variante="secondario" compatto onClick={() => comando(riapri, a.id)}>
                    Rimetti in bacheca
                  </Button>
                )}
                <Button variante="pericolo" compatto onClick={() => setDaEliminare(a)}>
                  Elimina
                </Button>
              </div>

              {risaltoPer === a.id && (
                <div className="ann-risalto">
                  <p className="ui-dialog-hint">
                    Un annuncio in evidenza sta in cima ai risultati, e la scheda lo dichiara.
                    In cassa ci sono {crediti} crediti.
                  </p>
                  <div className="ann-piede">
                    {getRisalto().map((r) => (
                      <Button
                        key={r.settimane}
                        variante="primario"
                        compatto
                        disabled={crediti < r.costo}
                        onClick={() => compra(r.settimane)}
                      >
                        {r.settimane} {r.settimane === 1 ? 'settimana' : 'settimane'} · {r.costo} cr
                      </Button>
                    ))}
                    <Button variante="fantasma" compatto onClick={() => setRisaltoPer(null)}>
                      Annulla
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {daEliminare && (
        <ConfirmDialog
          titolo="Eliminare l’annuncio?"
          testo={`«${daEliminare.titolo}» sparisce per sempre. Se ti serve solo toglierlo dalla bacheca, chiudilo: resta qui e lo rimetti quando vuoi.`}
          conferma="Elimina"
          distruttiva
          onConferma={() => { comando(elimina, daEliminare.id); setDaEliminare(null); }}
          onChiudi={() => setDaEliminare(null)}
        />
      )}

      <BackTile />
    </>
  );
}
