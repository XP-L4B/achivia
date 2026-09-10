import { useMemo, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import Button from '../../components/ui/Button';
import FiltroIcona from '../../components/ui/FiltroIcona';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import SchedaTalento from '../../components/osservatorio/SchedaTalento';
import { useAuth } from '../../context/AuthContext';
import useFinestra from '../../hooks/useFinestra';
import {
  cercaTalenti, vocabolarioTalenti, FILTRI_TALENTI, ORDINI_TALENTI, profiliTrovabili,
  DISPONIBILITA, CONTRATTI, ORARI, MODI_REMOTO,
} from '../../data/talenti';
import {
  CONTINENTI, LINGUE, paesiDi, areeDi, nomeLivelloArea, paeseById, areaDiPaese,
} from '../../data/geografia';
import { chiediPosizione, RAGGI, RAGGIO_MINIMO_KM, PASSO_GRIGLIA_KM } from '../../data/posizione';
import { ACHIEVEMENTS } from '../../data/achievementsCatalog';
import { SKILL_LEVELS } from '../../data/skillsCatalog';
import { inviaMessaggio, segnaComparse } from '../../data/db';

/**
 * Le persone che hanno chiesto di essere trovate.
 *
 * E' l'unica schermata dell'osservatorio che guarda qualcuno invece di
 * qualcosa, e le regole che la tengono in piedi stanno tutte in talenti.js:
 * ci finisce solo chi ha accettato, e da li' non esce nessun nome.
 *
 * I filtri stanno tutti dentro un menu che si apre e si chiude, perche'
 * erano sette gruppi in fila e la prima scheda di un profilo cominciava
 * dopo uno schermo e mezzo di controlli. Chiuso, il pulsante porta il
 * numero di quelli accesi: un menu che nasconde tre filtri attivi senza
 * dirlo fa cercare per mezz'ora dei profili che stanno solo dietro un
 * taglio dimenticato.
 *
 * Azzerare si puo' da due posti, e non e' un doppione. Accanto al pulsante
 * dei filtri compare un "Azzera" appena c'e' qualcosa da azzerare: si vede
 * senza aprire il menu e senza scorrerlo, che e' il momento in cui serve —
 * quando ci si accorge che i risultati sono pochi. In fondo al menu c'e'
 * quello lungo, dove uno lo cerca dopo aver finito di toccare i controlli.
 * Quello sta li' sempre, anche spento, perche' un comando che compare e
 * sparisce non si impara mai dov'e'.
 *
 * I filtri sono due tipi di domanda. "Dove" e "che lingue" sono condizioni
 * pratiche, senza le quali un'offerta non ha senso di partire. "Che
 * competenze, quanti achievement, quante quest" descrivono invece la
 * persona — e c'e' anche la percentuale di quest riuscite, che si puo'
 * cercare ma non si vede: un filtro "almeno l'ottanta" non mostra mai una
 * cifra bassa, perche' chi sta sotto semplicemente non compare.
 *
 * La distanza funziona allo stesso modo, e con la stessa ragione. Il centro
 * si sceglie a mano — un recruiter che cerca dal divano vuole i profili
 * vicini alla sede, non al divano — oppure si prende dalla posizione di chi
 * cerca, con un clic. Il raggio non scende sotto i dieci chilometri, e
 * quello che si legge sulla scheda e' una fascia: "entro 25 km", mai una
 * cifra. La difesa vera pero' non e' nessuna di queste due, sta nei dati:
 * le posizioni sono agganciate a una griglia di cinque chilometri prima di
 * essere salvate, percio' ripetere la ricerca da punti diversi non aggiunge
 * niente a quello che si sapeva gia'.
 */
const MOSTRA = 12;

export default function TalentiPage() {
  const { user } = useAuth();
  const [filtri, setFiltri] = useState(FILTRI_TALENTI);
  const [ordine, setOrdine] = useState('competenze');
  const [quanti, setQuanti] = useState(MOSTRA);
  const [scrivoA, setScrivoA] = useState(null);
  const [testo, setTesto] = useState('');
  const [oggetto, setOggetto] = useState('');
  const [inviato, setInviato] = useState(null);
  // Il centro della ricerca per distanza: un'area scelta a mano, oppure la
  // posizione di chi sta cercando. A mano e' il caso normale — chi cerca dal
  // divano non vuole i profili vicini al divano, li vuole vicini alla sede.
  const [centroScelto, setCentroScelto] = useState({ paese: '', area: '' });
  const [esitoGeo, setEsitoGeo] = useState('');
  const [filtriAperti, setFiltriAperti] = useState(false);
  // Esc chiude, il fuoco entra e il Tab resta dentro: come tutte le altre
  // finestre dell'applicazione.
  const finestra = useFinestra(Boolean(scrivoA), () => setScrivoA(null));

  /* Quanti tagli sono accesi. Serve al pulsante: un menu chiuso che
     nasconde tre filtri attivi e non lo dice fa cercare per mezz'ora
     perche' mancano dei profili che invece stanno solo dietro un filtro
     dimenticato. Il numero e' li' per quello. */
  const accesi = useMemo(() => {
    const z = filtri.zona || {};
    return [
      Boolean(z.continente || z.paese || z.area),
      filtri.competenze.length > 0,
      filtri.achievement.length > 0,
      filtri.lingue.length > 0,
      filtri.livelloMinimo > 0,
      Boolean(filtri.disponibilita || filtri.contratto || filtri.orario || filtri.remoto),
      filtri.questMinime > 0,
      filtri.successoMinimo > 0,
      Boolean(filtri.centro) && filtri.raggioKm > 0,
    ].filter(Boolean).length;
  }, [filtri]);

  function azzera() {
    setFiltri(FILTRI_TALENTI);
    setCentroScelto({ paese: '', area: '' });
    setEsitoGeo('');
    setQuanti(MOSTRA);
  }

  const vocabolario = useMemo(() => vocabolarioTalenti(), []);
  const risultati = useMemo(
    () => {
      const trovati = cercaTalenti(filtri, ordine);
      /* Si scrive una cosa sola: questi profili sono comparsi nei risultati
         di questo account, questa settimana. Non i filtri, non l'ora, non
         se qualcuno ha aperto la scheda. Serve a dire a una persona "ti
         sei fatto vedere da tre aziende", che e' l'unica cosa che le
         interessa sapere e l'unica che possiamo dirle onestamente. */
      segnaComparse(trovati.map((s) => s.id), user?.id);
      return trovati;
    },
    [filtri, ordine, user?.id],
  );
  const inElenco = profiliTrovabili().length;

  const cambia = (campo) => (valore) => { setFiltri({ ...filtri, [campo]: valore }); setQuanti(MOSTRA); };
  const zona = (patch) => cambia('zona')({ ...filtri.zona, ...patch });

  function centroDaLuogo(paese, area) {
    setCentroScelto({ paese, area });
    const trovata = area ? areaDiPaese(paese, area) : paeseById(paese);
    setEsitoGeo('');
    setFiltri((f) => ({
      ...f,
      centro: trovata ? { lat: trovata.lat, lon: trovata.lon } : null,
    }));
    setQuanti(MOSTRA);
  }

  async function centroDaMe() {
    setEsitoGeo('attesa');
    const esito = await chiediPosizione();
    if (!esito.ok) { setEsitoGeo(esito.motivo); return; }
    setCentroScelto({ paese: '', area: '' });
    setEsitoGeo('presa');
    setFiltri((f) => ({ ...f, centro: { lat: esito.posizione.lat, lon: esito.posizione.lon } }));
    setQuanti(MOSTRA);
  }

  function manda() {
    const esito = inviaMessaggio({ daId: user?.id, aId: scrivoA.id, oggetto, testo });
    /* Un profilo bloccato torna un esito che sembra riuscito, e lo e' per
       chi scrive: dirgli "questa persona ti ha bloccato" gli darebbe sul
       destinatario un'informazione che il destinatario non gli ha dato.
       Il messaggio semplicemente non esiste da nessuna parte. */
    if (esito?.errore === 'tetto-giornaliero') {
      setInviato({ tipo: 'tetto', limiti: esito.limiti });
    } else if (esito?.errore === 'troppo-presto') {
      setInviato({ tipo: 'presto', giorni: esito.giorniMancanti });
    } else {
      setInviato({ tipo: 'ok', a: scrivoA.achiviaId });
    }
    setScrivoA(null);
    setTesto('');
    setOggetto('');
  }

  return (
    <>
      <PageShell
        title="Profili disponibili"
        description="Chi ha chiesto di essere trovato per un’offerta di lavoro, e in questo momento non è in nessuna organizzazione. I nomi non vengono mostrati: ogni profilo si presenta col suo numero Achivia."
      />

      <div className="ui-corpo-pagina">
        <div className="oss-ricerca">
          <div className="oss-filtri-comando">
            <Button
              variante="secondario"
              compatto
              className={`oss-filtri-tasto${filtriAperti ? ' is-aperto' : ''}`}
              aria-expanded={filtriAperti}
              aria-controls="filtri-profili"
              onClick={() => setFiltriAperti(!filtriAperti)}
            >
              <FiltroIcona aperto={filtriAperti} />
              <span>Filtri</span>
              {accesi > 0 && <span className="oss-filtri-quanti">{accesi}</span>}
            </Button>
            {accesi > 0 && (
              <>
                <Button variante="secondario" compatto onClick={azzera}>Azzera</Button>
                {!filtriAperti && (
                  <small className="ui-dialog-hint">
                    {accesi === 1 ? 'Un filtro attivo' : `${accesi} filtri attivi`}
                  </small>
                )}
              </>
            )}
          </div>

          <div className="oss-filtri" id="filtri-profili" hidden={!filtriAperti}>
            <label className="label">Dove</label>
            <div className="lb-filtri">
              <label className="label">
                Continente
                <select
                  value={filtri.zona.continente}
                  onChange={(e) => zona({ continente: e.target.value, stato: '', regione: '' })}
                >
                  <option value="">Ovunque</option>
                  {CONTINENTI.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>
              <label className="label">
                Paese
                <select
                  value={filtri.zona.paese}
                  disabled={!filtri.zona.continente}
                  onChange={(e) => zona({ paese: e.target.value, area: '' })}
                >
                  <option value="">Tutto il continente</option>
                  {paesiDi(filtri.zona.continente).map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </label>
              <label className="label">
                {nomeLivelloArea(filtri.zona.paese)}
                <select
                  value={filtri.zona.area}
                  disabled={!areeDi(filtri.zona.paese).length}
                  onChange={(e) => zona({ area: e.target.value })}
                >
                  <option value="">Tutto il paese</option>
                  {areeDi(filtri.zona.paese).map((a) => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                </select>
              </label>
            </div>

            <label className="label">Distanza da un punto</label>
            <div className="lb-filtri">
              <label className="label">
                Paese del centro
                <select
                  value={centroScelto.paese}
                  onChange={(e) => centroDaLuogo(e.target.value, '')}
                >
                  <option value="">—</option>
                  {CONTINENTI.flatMap((cc) => paesiDi(cc.id)).map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </label>
              <label className="label">
                {nomeLivelloArea(centroScelto.paese)} del centro
                <select
                  value={centroScelto.area}
                  disabled={!areeDi(centroScelto.paese).length}
                  onChange={(e) => centroDaLuogo(centroScelto.paese, e.target.value)}
                >
                  <option value="">Centro del paese</option>
                  {areeDi(centroScelto.paese).map((a) => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                </select>
              </label>
              <label className="label">
                Raggio
                <select
                  value={filtri.raggioKm}
                  disabled={!filtri.centro}
                  onChange={(e) => cambia('raggioKm')(Number(e.target.value))}
                >
                  <option value={0}>Nessun limite</option>
                  {RAGGI.map((r) => <option key={r} value={r}>{r} km</option>)}
                </select>
              </label>
            </div>
            <div className="oss-scarico">
              <Button variante="fantasma" compatto onClick={centroDaMe}>Usa la mia posizione</Button>
              {/* Il minimo si legge sempre, anche prima di scegliere un
                  centro: e' una promessa sul prodotto, non un messaggio di
                  stato, e una promessa che compare solo quando serve non
                  l'ha letta nessuno. */}
              <small className="ui-dialog-hint">
                Il raggio minimo è {RAGGIO_MINIMO_KM} km e le posizioni sono arrotondate a
                {' '}{PASSO_GRIGLIA_KM} km: la distanza si legge a fasce, mai in cifre.
              </small>
              <small className="ui-dialog-hint">
                {esitoGeo === 'attesa' && 'Sto chiedendo al browser…'}
                {esitoGeo === 'presa' && 'Centro impostato sulla tua posizione.'}
                {esitoGeo === 'negato' && 'Permesso negato: scegli un luogo dall’elenco.'}
                {esitoGeo === 'non-disponibile' && 'Questo browser non sa dire dove sei.'}
                {esitoGeo === 'non-riuscito' && 'Non è riuscito a leggerla: scegli un luogo dall’elenco.'}
                {!esitoGeo && (filtri.centro
                  ? 'Centro impostato.'
                  : 'Scegli un punto per cercare per distanza.')}
              </small>
            </div>

            {vocabolario.length > 0 && (
              <>
                <label className="label">Competenze certificate</label>
                <Chips
                  multipla
                  items={vocabolario.slice(0, 24).map((v) => ({ id: v.nome, label: `${v.nome} (${v.quanti})` }))}
                  value={filtri.competenze}
                  onChange={cambia('competenze')}
                  ariaLabel="Competenze da cercare"
                />
              </>
            )}

            <label className="label">Achievement</label>
            <Chips
              multipla
              items={ACHIEVEMENTS.map((a) => ({ id: a.id, label: a.nome }))}
              value={filtri.achievement}
              onChange={cambia('achievement')}
              ariaLabel="Achievement richiesti"
            />

            <label className="label">Lingue</label>
            <Chips
              multipla
              items={LINGUE.map((l) => ({ id: l.id, label: l.nome }))}
              value={filtri.lingue}
              onChange={cambia('lingue')}
              ariaLabel="Lingue richieste"
            />

            <div className="lb-filtri">
              <label className="label">
                Livello minimo delle competenze
                <select
                  value={filtri.livelloMinimo}
                  onChange={(e) => cambia('livelloMinimo')(Number(e.target.value))}
                >
                  <option value={0}>Qualsiasi</option>
                  {SKILL_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </label>
              <label className="label">
                Quest portate a termine, almeno
                <select
                  value={filtri.questMinime}
                  onChange={(e) => cambia('questMinime')(Number(e.target.value))}
                >
                  {[0, 10, 25, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>{n === 0 ? 'Nessun minimo' : n}</option>
                  ))}
                </select>
              </label>
              <label className="label">
                Quest riuscite, almeno
                <select
                  value={filtri.successoMinimo}
                  onChange={(e) => cambia('successoMinimo')(Number(e.target.value))}
                >
                  {[0, 60, 70, 80, 90].map((n) => (
                    <option key={n} value={n}>{n === 0 ? 'Nessun minimo' : `${n}%`}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="label">Che lavoro cerca</label>
            <div className="lb-filtri">
              {[
                ['disponibilita', 'Disponibile', DISPONIBILITA],
                ['contratto', 'Contratto', CONTRATTI],
                ['orario', 'Orario', ORARI],
                ['remoto', 'Dove', MODI_REMOTO],
              ].map(([campo, etichetta, elenco]) => (
                <label className="label" key={campo}>
                  {etichetta}
                  <select value={filtri[campo]} onChange={(e) => cambia(campo)(e.target.value)}>
                    <option value="">Indifferente</option>
                    {elenco.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <small className="ui-dialog-hint">
              Chi non ha detto che cosa cerca resta nei risultati: «non lo dico» non è un no.
            </small>

            <label className="label">Ordina per</label>
            <Chips
              items={ORDINI_TALENTI.map((o) => ({ id: o.id, label: o.nome }))}
              value={ordine}
              onChange={setOrdine}
              ariaLabel="Ordine dei profili"
            />

            {/* L'ordinamento non si azzera: non e' un filtro, non toglie
                nessuno dai risultati, e ritrovarselo cambiato dopo aver
                premuto "azzera i filtri" sarebbe una sorpresa. */}
            <div className="oss-filtri-piede">
              {/* Secondario e non fantasma: un fantasma disabilitato e' testo
                  scuro al quaranta per cento senza cornice, cioe' niente. Un
                  comando che c'e' ma non si puo' usare deve vedersi che c'e' —
                  altrimenti chi lo cerca conclude che non l'abbiamo fatto. */}
              <Button variante="secondario" compatto disabled={accesi === 0} onClick={azzera}>
                Azzera i filtri
              </Button>
              <small className="ui-dialog-hint">
                {accesi === 0
                  ? 'Nessun filtro attivo: stai vedendo tutti i profili in elenco.'
                  : `${accesi === 1 ? 'Un filtro attivo' : `${accesi} filtri attivi`}. L’ordinamento resta com’è.`}
              </small>
            </div>
          </div>
        </div>

        <TerminalPanel
          titolo="LA RICERCA"
          meta={`${risultati.length} DI ${inElenco}`}
          piede="QUEST RIUSCITE E DISTANZA SI CERCANO, NON SI VEDONO"
          className="ui-blocco con-stacco"
        >
          {inElenco === 0 ? (
            <p className="tv-vuoto">
              Nessun profilo si è ancora reso disponibile. L’elenco si riempie quando qualcuno
              accende «Fatti trovare» dalle sue impostazioni ed esce dalla sua organizzazione.
            </p>
          ) : risultati.length === 0 ? (
            <p className="tv-vuoto">Nessun profilo con questi filtri. Allargali.</p>
          ) : (
            <p className="ui-dialog-hint">
              {risultati.length === 1 ? 'Un profilo' : `${risultati.length} profili`} su {inElenco} in
              elenco. Ognuno ha accettato di essere trovato e può revocare quando vuole.
            </p>
          )}
          {inviato?.tipo === 'ok' && (
            <p className="ui-dialog-hint">
              Messaggio inviato al profilo {inviato.a}: gli arriva nell’applicazione e per email.
            </p>
          )}
          {inviato?.tipo === 'tetto' && (
            <p className="ui-dialog-hint">
              Hai raggiunto il tetto di {inviato.limiti.giornaliero} messaggi al giorno. Riprova
              domani: il limite serve a tenere in vita l’elenco, perché a chi riceve troppi
              messaggi passa la voglia di restarci.
            </p>
          )}
          {inviato?.tipo === 'presto' && (
            <p className="ui-dialog-hint">
              A questo profilo hai già scritto di recente. Si può riscrivere fra{' '}
              {inviato.giorni} {inviato.giorni === 1 ? 'giorno' : 'giorni'}.
            </p>
          )}
        </TerminalPanel>

        {risultati.slice(0, quanti).map((s) => (
          <SchedaTalento key={s.id} scheda={s} centro={filtri.centro} onScrivi={setScrivoA} />
        ))}

        {risultati.length > quanti && (
          <Button variante="secondario" onClick={() => setQuanti(quanti + MOSTRA)}>
            Vedi altri {Math.min(MOSTRA, risultati.length - quanti)}
          </Button>
        )}
      </div>

      {scrivoA && (
        <div className="ui-overlay" role="dialog" aria-modal="true" aria-label="Scrivi al profilo">
          <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog">
            <b>Scrivi al profilo {scrivoA.achiviaId}</b>
            <p className="ui-dialog-hint">
              Riceve il messaggio dentro Achivia e un’email che lo avvisa. Non sai il suo nome, e
              lui non saprà il tuo finché non deciderà di rispondere.
            </p>
            <label className="label" htmlFor="msg-oggetto">Oggetto</label>
            <input
              id="msg-oggetto"
              name="msg-oggetto"
              value={oggetto}
              onChange={(e) => setOggetto(e.target.value)}
              placeholder="Una posizione che potrebbe interessarti"
            />
            <label className="label" htmlFor="msg-testo">Messaggio</label>
            <textarea
              id="msg-testo"
              name="msg-testo"
              rows={6}
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Chi sei, che cosa cerchi, come continuare la conversazione."
            />
            <div className="ui-dialog-actions">
              <Button variante="primario" disabled={!testo.trim()} onClick={manda}>Invia</Button>
              <Button variante="fantasma" onClick={() => setScrivoA(null)}>Annulla</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
