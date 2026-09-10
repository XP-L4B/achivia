import { useMemo, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import FiltroIcona from '../../components/ui/FiltroIcona';
import {
  cercaAnnunci, FILTRI_ANNUNCI, MODALITA, distanzaAnnuncio, quantoEGrande,
} from '../../data/annunci';
import {
  CONTINENTI, paesiDi, areeDi, nomeLivelloArea, paeseById, areaDiPaese,
} from '../../data/geografia';
import { chiediPosizione, RAGGI, RAGGIO_MINIMO_KM, PASSO_GRIGLIA_KM } from '../../data/posizione';

/**
 * La bacheca: gli annunci che le organizzazioni hanno scritto per chi sta
 * fuori.
 *
 * Due domande sole in cima — che cosa e dove — perche' sono quelle che uno
 * ha gia' in testa quando arriva. Tutto il resto (la modalita', la
 * distanza da un punto, il dettaglio della regione) sta dietro l'imbuto:
 * chi ne ha bisogno lo apre, chi non ne ha bisogno non lo vede nemmeno.
 * Il pulsante porta il numero dei filtri accesi, perche' un taglio
 * dimenticato dietro un menu chiuso fa credere che di annunci non ce ne
 * siano.
 *
 * La distanza funziona come nell'osservatorio, e per la stessa ragione: il
 * raggio non scende sotto i dieci chilometri e le posizioni sono agganciate
 * a una griglia. Qui pero' non c'e' niente di delicato da difendere — un
 * annuncio dice dov'e' apposta — e quello che si legge sulla scheda resta
 * una fascia solo per coerenza con il resto dell'applicazione.
 *
 * Gli annunci in evidenza stanno in cima e lo dicono. Un ordinamento che
 * qualcuno ha pagato e che non si dichiara e' pubblicita' travestita da
 * risultato.
 *
 * L'indirizzo a cui rispondere si legge aprendo l'annuncio. E' un dato che
 * l'organizzazione ha scritto apposta per essere letto, ma stamparlo su
 * venti schede di fila lo regala anche a chi sta solo scorrendo: aperto
 * l'annuncio, invece, c'e' qualcuno che lo sta leggendo davvero.
 *
 * Il negozio e l'osservatorio non arrivano qui: ci pensa `SoloPersone` nel
 * router. Non e' un divieto morale, e' che non cercano lavoro.
 */
const MOSTRA = 10;

const giorno = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '');

export default function AnnunciPage() {
  const [filtri, setFiltri] = useState(FILTRI_ANNUNCI);
  const [quanti, setQuanti] = useState(MOSTRA);
  const [aperti, setAperti] = useState([]);
  const [filtriAperti, setFiltriAperti] = useState(false);
  // Il centro della ricerca per distanza: un luogo scelto a mano, oppure la
  // posizione di chi cerca. A mano e' il caso normale — si cerca vicino a
  // dove si vuole andare a lavorare, che non e' sempre dove si e' adesso.
  const [centroScelto, setCentroScelto] = useState({ paese: '', area: '' });
  const [esitoGeo, setEsitoGeo] = useState('');

  const risultati = useMemo(() => cercaAnnunci(filtri), [filtri]);

  /* Quanti tagli sono accesi. Le parole e il paese non si contano: stanno
     scritti in chiaro nei due campi in cima, e contarli farebbe apparire un
     numero accanto a un menu che non nasconde niente. */
  const accesi = [
    Boolean(filtri.zona.area),
    Boolean(filtri.modalita),
    Boolean(filtri.centro) && filtri.raggioKm > 0,
  ].filter(Boolean).length;

  const daAzzerare = accesi > 0 || Boolean(filtri.parole) || Boolean(filtri.zona.paese);

  const cambia = (patch) => {
    setFiltri((f) => ({ ...f, ...patch }));
    setQuanti(MOSTRA);
  };

  function azzera() {
    setFiltri(FILTRI_ANNUNCI);
    setCentroScelto({ paese: '', area: '' });
    setEsitoGeo('');
    setQuanti(MOSTRA);
  }

  /* Il "dove" e' un paese solo, e il continente si ricava da quello: due
     tendine in fila per arrivare all'Italia sono una in piu' del dovuto. */
  function scegliPaese(paese) {
    cambia({
      zona: { continente: paeseById(paese)?.continente || '', paese, area: '' },
    });
  }

  function centroDaLuogo(paese, area) {
    setCentroScelto({ paese, area });
    const trovata = area ? areaDiPaese(paese, area) : paeseById(paese);
    setEsitoGeo('');
    cambia({ centro: trovata ? { lat: trovata.lat, lon: trovata.lon } : null });
  }

  async function centroDaMe() {
    setEsitoGeo('attesa');
    const esito = await chiediPosizione();
    if (!esito.ok) { setEsitoGeo(esito.motivo); return; }
    setCentroScelto({ paese: '', area: '' });
    setEsitoGeo('presa');
    cambia({ centro: { lat: esito.posizione.lat, lon: esito.posizione.lon } });
  }

  const apriChiudi = (id) => setAperti(
    (a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]),
  );

  return (
    <div className="page">
      <PageShell
        title="Annunci di lavoro"
        description="Le posizioni aperte pubblicate dalle organizzazioni su Achivia."
      />

      <div className="ui-corpo-pagina">
        <div className="oss-ricerca">
          <div className="lb-filtri">
            <label className="label">
              Cosa
              <input
                name="parole"
                value={filtri.parole}
                placeholder="Ruolo, mansione, competenza, azienda…"
                onChange={(e) => cambia({ parole: e.target.value })}
              />
            </label>
            <label className="label">
              Dove
              <select value={filtri.zona.paese} onChange={(e) => scegliPaese(e.target.value)}>
                <option value="">Ovunque</option>
                {CONTINENTI.map((c) => (
                  <optgroup key={c.id} label={c.nome}>
                    {paesiDi(c.id).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          <div className="oss-filtri-comando">
            <Button
              variante="secondario"
              compatto
              className={`oss-filtri-tasto${filtriAperti ? ' is-aperto' : ''}`}
              aria-expanded={filtriAperti}
              aria-controls="filtri-annunci"
              onClick={() => setFiltriAperti(!filtriAperti)}
            >
              <FiltroIcona aperto={filtriAperti} />
              <span>Altri filtri</span>
              {accesi > 0 && <span className="oss-filtri-quanti">{accesi}</span>}
            </Button>
            {daAzzerare && <Button variante="secondario" compatto onClick={azzera}>Azzera</Button>}
          </div>

          <div className="oss-filtri" id="filtri-annunci" hidden={!filtriAperti}>
            <div className="lb-filtri">
              <label className="label">
                {nomeLivelloArea(filtri.zona.paese)}
                <select
                  value={filtri.zona.area}
                  disabled={!areeDi(filtri.zona.paese).length}
                  onChange={(e) => cambia({ zona: { ...filtri.zona, area: e.target.value } })}
                >
                  <option value="">Tutto il paese</option>
                  {areeDi(filtri.zona.paese).map((a) => (
                    <option key={a.nome} value={a.nome}>{a.nome}</option>
                  ))}
                </select>
              </label>
              <label className="label">
                Come si lavora
                <select
                  value={filtri.modalita}
                  onChange={(e) => cambia({ modalita: e.target.value })}
                >
                  <option value="">Non importa</option>
                  {MODALITA.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </label>
            </div>

            <label className="label">Distanza da un punto</label>
            <div className="lb-filtri">
              <label className="label">
                Paese del centro
                <select value={centroScelto.paese} onChange={(e) => centroDaLuogo(e.target.value, '')}>
                  <option value="">—</option>
                  {CONTINENTI.flatMap((c) => paesiDi(c.id)).map((p) => (
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
                  {areeDi(centroScelto.paese).map((a) => (
                    <option key={a.nome} value={a.nome}>{a.nome}</option>
                  ))}
                </select>
              </label>
              <label className="label">
                Raggio
                <select
                  value={filtri.raggioKm}
                  disabled={!filtri.centro}
                  onChange={(e) => cambia({ raggioKm: Number(e.target.value) })}
                >
                  <option value={0}>Nessun limite</option>
                  {RAGGI.map((r) => <option key={r} value={r}>{r} km</option>)}
                </select>
              </label>
            </div>
            <div className="oss-scarico">
              <Button variante="fantasma" compatto onClick={centroDaMe}>Usa la mia posizione</Button>
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
          </div>
        </div>

        <p className="ui-dialog-hint">
          {risultati.length === 0
            ? 'Nessun annuncio con questi filtri.'
            : `${risultati.length} ${risultati.length === 1 ? 'annuncio' : 'annunci'}`}
        </p>

        <ul className="ann-lista">
          {risultati.slice(0, quanti).map((a) => {
            const aperto = aperti.includes(a.id);
            const quanto = distanzaAnnuncio(filtri.centro, a);
            return (
              <li key={a.id} className={`ann-scheda${a.risalto ? ' is-risalto' : ''}`}>
                <div className="ann-testa">
                  <h3 className="ann-titolo">{a.titolo}</h3>
                  {a.risalto && <span className="badge badge-success">In evidenza</span>}
                </div>
                <p className="ann-org">
                  {a.organizzazione}
                  <span className="ann-punto">·</span>
                  {quantoEGrande(a.orgId)} persone
                </p>
                <ul className="ann-fatti">
                  <li>{a.dove}</li>
                  <li>{a.comeSiLavora}</li>
                  <li>{a.paga}</li>
                  {quanto && <li>{quanto}</li>}
                </ul>
                {a.competenzeNomi.length > 0 && (
                  /* Le competenze stanno sopra il testo e non sotto: sono
                     la riga che dice in tre parole se l'annuncio ti
                     riguarda, e leggerla dopo duemila caratteri e' leggerla
                     quando la decisione e' gia' presa. */
                  <ul className="ann-competenze-scelte">
                    {a.competenzeNomi.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                )}
                <p className={`ann-testo${aperto ? ' is-aperto' : ''}`}>{a.descrizione}</p>
                {/* L'indirizzo compare quando l'annuncio si apre, non prima.
                    E' quello che l'organizzazione ha scritto apposta per
                    farsi rispondere — nessun dato personale di nessuno — ma
                    stamparlo su venti schede di seguito lo consegna anche a
                    chi la pagina la sta solo scorrendo. */}
                {aperto && (
                  <p className="ann-contatto">
                    Per candidarti scrivi a <a href={`mailto:${a.email}`}>{a.email}</a>
                  </p>
                )}
                <div className="ann-piede">
                  <Button variante="fantasma" compatto onClick={() => apriChiudi(a.id)}>
                    {aperto ? 'Chiudi' : 'Leggi tutto e rispondi'}
                  </Button>
                  <small className="ui-dialog-hint">Pubblicato il {giorno(a.creatoIl)}</small>
                </div>
              </li>
            );
          })}
        </ul>

        {risultati.length > quanti && (
          <Button variante="secondario" blocco onClick={() => setQuanti(quanti + MOSTRA)}>
            Mostra altri
          </Button>
        )}
      </div>

    </div>
  );
}
