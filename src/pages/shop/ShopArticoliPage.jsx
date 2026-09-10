import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import Chips from '../../components/ui/Chips';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import BackTile from '../../components/ui/BackTile';
import useFinestra from '../../hooks/useFinestra';
import { useAuth } from '../../context/AuthContext';
import { getArticoli, getUserById, scartaSeOrfana, subscribe } from '../../data/db';
import { IMMAGINI_ARTICOLO, caricaImmagine, immagineArticolo } from '../../data/articoliImmagini';
import {
  ZONE, categoriaDi, categorie, disponibile, eliminaArticolo, eliminaCategoria, impostaSpedizione,
  oggiIso, prezzoDi, pubblica, quantiIn, salvaArticolo, salvaCategoria, spedizione,
} from '../../data/negozio';

const FILTRI = [
  { id: 'tutti',    label: 'Tutti' },
  { id: 'vendita',  label: 'In vendita' },
  { id: 'nascosti', label: 'Nascosti' },
  { id: 'offerta',  label: 'In offerta' },
  { id: 'esauriti', label: 'Esauriti' },
];

const VUOTO = {
  nome: '', descrizione: '', crediti: 100, sconto: 0, offertaFino: '',
  scorta: '', immagine: IMMAGINI_ARTICOLO[0]?.id ?? '', pixelata: false,
  categoriaId: '', attivo: true,
};

/** La scorta come si legge: un numero, o il fatto che non ce n'e' un limite. */
const scortaLabel = (scorta) => {
  if (scorta === null || scorta === undefined) return 'illimitata';
  return scorta === 0 ? 'esaurito' : `${scorta} ${scorta === 1 ? 'pezzo' : 'pezzi'}`;
};

/**
 * Il modulo di un articolo, per crearlo e per modificarlo.
 *
 * E' la stessa finestra nei due casi: un articolo nuovo e uno che c'e'
 * gia' hanno gli stessi campi e gli stessi controlli, e tenerli in due
 * moduli diversi vuol dire solo dimenticarsi di aggiornarne uno.
 */
function ArticoloDialog({ me, articolo, onFatto, onChiudi }) {
  // Chiudere con Esc e' come premere Annulla: passa dalla stessa porta, e
  // quindi porta via le immagini caricate e non usate.
  const finestra = useFinestra(true, () => annulla());
  const [dati, setDati] = useState(() => (articolo
    ? {
      ...articolo,
      offertaFino: articolo.offertaFino ?? '',
      scorta: articolo.scorta === null || articolo.scorta === undefined ? '' : String(articolo.scorta),
    }
    : VUOTO));
  const [errore, setErrore] = useState('');
  // Le immagini caricate dentro questa finestra: se poi si annulla, non
  // devono restare a occupare spazio per un articolo che non esiste.
  const [caricate, setCaricate] = useState([]);
  const [carico, setCarico] = useState(false);

  const campo = (nome) => (e) => {
    const el = e.target;
    setDati((d) => ({ ...d, [nome]: el.type === 'checkbox' ? el.checked : el.value }));
  };

  const prezzo = prezzoDi({ ...dati, crediti: Number(dati.crediti) || 0 });

  async function scegliFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';            // lo stesso file si puo' riscegliere
    if (!file) return;
    setCarico(true);
    const esito = await caricaImmagine(file);
    setCarico(false);
    if (!esito.ok) { setErrore(esito.errore); return; }
    setErrore('');
    setCaricate((c) => [...c, esito.chiave]);
    setDati((d) => ({ ...d, immagine: esito.chiave }));
  }

  function salva() {
    const esito = salvaArticolo(me, dati);
    if (!esito.ok) { setErrore(esito.errore); return; }
    // Quelle caricate e poi scartate durante la modifica se ne vanno.
    caricate.filter((k) => k !== esito.articolo.immagine).forEach(scartaSeOrfana);
    onFatto();
  }

  function annulla() {
    caricate.forEach(scartaSeOrfana);
    onChiudi();
  }

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label={articolo ? 'Modifica articolo' : 'Nuovo articolo'}>
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog">
        <b>{articolo ? 'Modifica articolo' : 'Nuovo articolo'}</b>

        <div className="px-filters ui-colonna fitta" style={{ marginTop: 'var(--space-3)' }}>
          <label className="label" htmlFor="art-nome">Nome</label>
          <input id="art-nome" name="art-nome" value={dati.nome} onChange={campo('nome')} placeholder="Come si chiama" />

          <label className="label" htmlFor="art-desc">Descrizione</label>
          <textarea id="art-desc" name="art-desc" rows={2} value={dati.descrizione} onChange={campo('descrizione')} placeholder="Due righe per chi compra" />

          <label className="label" htmlFor="art-crediti">Prezzo in crediti</label>
          <input id="art-crediti" name="art-crediti" type="number" min="1" step="1" value={dati.crediti} onChange={campo('crediti')} />

          <label className="label" htmlFor="art-sconto">Offerta: sconto in percentuale (0 = nessuna)</label>
          <input id="art-sconto" name="art-sconto" type="number" min="0" max="90" step="1" value={dati.sconto} onChange={campo('sconto')} />

          {Number(dati.sconto) > 0 && (
            <>
              <label className="label" htmlFor="art-fino">L’offerta vale fino al (facoltativo)</label>
              <input id="art-fino" name="art-fino" type="date" min={oggiIso()} value={dati.offertaFino} onChange={campo('offertaFino')} />
              <p className="ui-dialog-hint" style={{ margin: 0 }}>
                In offerta si paga <b>{prezzo.finale}</b> invece di {prezzo.pieno} crediti.
                {dati.offertaFino ? ' Passata la data, il prezzo torna pieno da solo.' : ''}
              </p>
            </>
          )}

          <label className="label" htmlFor="art-scorta">Pezzi disponibili (vuoto = senza limite)</label>
          <input id="art-scorta" name="art-scorta" type="number" min="0" step="1" value={dati.scorta} onChange={campo('scorta')} placeholder="senza limite" />

          <label className="label" htmlFor="art-categoria">Categoria</label>
          <select id="art-categoria" name="art-categoria" value={dati.categoriaId ?? ''} onChange={campo('categoriaId')}>
            <option value="">senza categoria</option>
            {categorie().map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>

          <label className="label" htmlFor="art-immagine">Immagine</label>
          <select id="art-immagine" name="art-immagine" value={dati.immagine ?? ''} onChange={campo('immagine')}>
            {IMMAGINI_ARTICOLO.map((i) => <option key={i.id} value={i.id}>{i.id}</option>)}
            {/* Una caricata non sta nell'elenco del progetto: le si fa
                comunque un posto, se no il menu direbbe il nome di
                un'immagine che non e' quella che si vede sotto. */}
            {dati.immagine && !IMMAGINI_ARTICOLO.some((i) => i.id === dati.immagine) && (
              <option value={dati.immagine}>immagine caricata</option>
            )}
          </select>

          <label className="label" htmlFor="art-file">Oppure carica un’immagine</label>
          <input
            id="art-file"
            name="art-file"
            type="file"
            accept="image/*"
            onChange={scegliFile}
            disabled={carico}
          />
          <p className="ui-dialog-hint" style={{ margin: 0 }}>
            {carico
              ? 'Preparo l’immagine…'
              : 'Viene rimpicciolita qui nel browser prima di essere salvata: i dati dell’app stanno nel browser, e c’e’ poco spazio.'}
          </p>
        </div>

        {immagineArticolo(dati.immagine) && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: 'var(--space-3) 0' }}>
            <img
              src={immagineArticolo(dati.immagine)}
              alt=""
              style={{ width: 96, height: 96, objectFit: 'contain', imageRendering: dati.pixelata ? 'pixelated' : 'auto' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input type="checkbox" name="art-pixelata" checked={Boolean(dati.pixelata)} onChange={campo('pixelata')} style={{ width: 'auto' }} />
            Disegno a pixel
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input type="checkbox" name="art-attivo" checked={dati.attivo !== false} onChange={campo('attivo')} style={{ width: 'auto' }} />
            In vendita
          </label>
        </div>

        {errore && <p className="ui-dialog-hint" style={{ color: 'var(--ui-alert-testo)' }}>{errore}</p>}

        <div className="ui-dialog-actions">
          <Button variante="primario" onClick={salva} disabled={carico}>Salva</Button>
          <Button variante="fantasma" onClick={annulla}>Annulla</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Le categorie: si aggiungono, si rinominano, si tolgono.
 *
 * Togliere una categoria non toglie gli articoli che ci stavano dentro:
 * restano, senza categoria. Cancellare un modo di ordinare le cose non e'
 * cancellare le cose, e la finestra lo dice prima di farlo.
 */
function CategorieDialog({ me, onChiudi }) {
  const finestra = useFinestra(true, onChiudi);
  const [nuova, setNuova] = useState('');
  const [inModifica, setInModifica] = useState(null);   // { id, nome }
  const [daEliminare, setDaEliminare] = useState(null);
  const [errore, setErrore] = useState('');
  const [, ridisegna] = useState(0);

  const elenco = categorie();

  function aggiungi() {
    const esito = salvaCategoria(me, { nome: nuova });
    if (!esito.ok) { setErrore(esito.errore); return; }
    setNuova(''); setErrore(''); ridisegna((n) => n + 1);
  }

  function rinomina() {
    const esito = salvaCategoria(me, inModifica);
    if (!esito.ok) { setErrore(esito.errore); return; }
    setInModifica(null); setErrore(''); ridisegna((n) => n + 1);
  }

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label="Categorie">
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog is-stretta">
        <b>Categorie</b>
        <p className="ui-dialog-hint">Servono a mettere ordine nel catalogo. Un articolo puo’ anche non averne.</p>

        <div className="ui-list" style={{ margin: 'var(--space-3) 0' }}>
          {elenco.length === 0 && <p className="ui-dialog-hint" style={{ margin: 0 }}>Non ce n’e’ ancora nessuna.</p>}
          {elenco.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', padding: 'var(--space-2) 0' }}>
              {inModifica?.id === c.id && (
                <>
                  <input
                    value={inModifica.nome}
                    onChange={(e) => setInModifica({ ...inModifica, nome: e.target.value })}
                    aria-label={`Nuovo nome per ${c.nome}`}
                    style={{ flex: '1 1 120px' }}
                  />
                  <Button variante="primario" compatto onClick={rinomina}>Salva</Button>
                  <Button variante="fantasma" compatto onClick={() => setInModifica(null)}>Annulla</Button>
                </>
              )}

              {/* La conferma sta nella riga, non in un'altra finestra sopra
                  questa: due finestre aperte insieme si chiudono tutte e due
                  con lo stesso Esc, e chi voleva annullare solo la seconda si
                  ritrova fuori da entrambe. */}
              {daEliminare?.id === c.id && (
                <>
                  <span style={{ flex: '1 1 100%' }}>
                    Eliminare “{c.nome}”?{' '}
                    {quantiIn(c.id) > 0
                      ? `${quantiIn(c.id)} articoli restano nel catalogo, senza categoria.`
                      : 'Non ci sono articoli dentro.'}
                  </span>
                  <Button
                    variante="pericolo"
                    compatto
                    onClick={() => { eliminaCategoria(me, c.id); setDaEliminare(null); ridisegna((n) => n + 1); }}
                  >
                    Elimina
                  </Button>
                  <Button variante="fantasma" compatto onClick={() => setDaEliminare(null)}>Lascia stare</Button>
                </>
              )}

              {inModifica?.id !== c.id && daEliminare?.id !== c.id && (
                <>
                  <span style={{ flex: '1 1 120px' }}>
                    {c.nome} <span style={{ color: 'var(--tv-dim)' }}>· {quantiIn(c.id)}</span>
                  </span>
                  <Button variante="secondario" compatto onClick={() => setInModifica({ id: c.id, nome: c.nome })}>Rinomina</Button>
                  <Button variante="pericolo" compatto onClick={() => setDaEliminare(c)}>Elimina</Button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="px-filters ui-colonna fitta">
          <label className="label" htmlFor="cat-nuova">Aggiungi una categoria</label>
          <input
            id="cat-nuova"
            name="cat-nuova"
            value={nuova}
            onChange={(e) => setNuova(e.target.value)}
            placeholder="Come si chiama"
          />
        </div>

        {errore && <p className="ui-dialog-hint" style={{ color: 'var(--ui-alert-testo)' }}>{errore}</p>}

        <div className="ui-dialog-actions">
          <Button variante="primario" onClick={aggiungi} disabled={!nuova.trim()}>Aggiungi</Button>
          <Button variante="fantasma" onClick={onChiudi}>Chiudi</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Il catalogo dalla parte di chi lo tiene: tutti gli articoli, anche quelli
 * nascosti e quelli finiti, con quello che serve per cambiarli.
 */
/**
 * Le spese di spedizione: due numeri e una soglia.
 *
 * Stanno qui e non in una schermata loro perche' sono un prezzo: quello
 * che chi compra paga oltre alla merce, e si decide guardando il listino,
 * non i grafici. Sono in crediti come tutto il resto del negozio.
 *
 * La soglia della spedizione gratis e' facoltativa: vuota vuol dire che
 * si paga sempre, e va bene — un negozio che non la vuole non deve
 * inventarsi un numero altissimo per spegnerla.
 */
function Spedizioni({ me }) {
  const attuale = spedizione();
  const [dati, setDati] = useState(() => ({
    italia: String(attuale.italia),
    ue: String(attuale.ue),
    gratisDa: attuale.gratisDa === null ? '' : String(attuale.gratisDa),
  }));
  const [esito, setEsito] = useState('');
  const campo = (chiave) => (e) => { setDati((d) => ({ ...d, [chiave]: e.target.value })); setEsito(''); };

  function salva() {
    const r = impostaSpedizione(me, {
      italia: dati.italia,
      ue: dati.ue,
      gratisDa: dati.gratisDa === '' ? null : dati.gratisDa,
    });
    setEsito(r.ok ? 'Salvate: da adesso vale per tutti gli ordini nuovi.' : r.errore);
  }

  return (
    <TerminalPanel
      titolo="SPEDIZIONE"
      meta="CREDITI"
      pieghevole
      apertoDiDefault={false}
      piede={attuale.gratisDa === null
        ? 'LA SPEDIZIONE SI PAGA SEMPRE'
        : `GRATIS SOPRA I ${attuale.gratisDa} CREDITI DI MERCE`}
    >
      <p className="ui-dialog-hint" style={{ marginTop: 0 }}>
        Quanto costa portare un ordine a destinazione. Si somma al prezzo della merce, e chi compra
        lo vede prima di ordinare. A zero, la spedizione e’ gratis per quella destinazione.
      </p>
      <div className="shop-spese-griglia">
        {ZONE.map((z) => (
          <div key={z.id}>
            <label className="label" htmlFor={`sped-${z.id}`}>{z.label}</label>
            <input
              id={`sped-${z.id}`}
              name={`sped-${z.id}`}
              type="number"
              min="0"
              step="1"
              value={dati[z.id]}
              onChange={campo(z.id)}
            />
          </div>
        ))}
        <div>
          <label className="label" htmlFor="sped-gratis">Gratis da (vuoto = mai)</label>
          <input
            id="sped-gratis"
            name="sped-gratis"
            type="number"
            min="1"
            step="1"
            placeholder="nessuna soglia"
            value={dati.gratisDa}
            onChange={campo('gratisDa')}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
        <Button variante="primario" onClick={salva}>Salva le spese</Button>
        {esito && <small className="tv-nota" role="status">{esito}</small>}
      </div>
    </TerminalPanel>
  );
}

export default function ShopArticoliPage() {
  const { user } = useAuth();
  const [, ridisegna] = useState(0);
  const [filtro, setFiltro] = useState('tutti');
  const [categoria, setCategoria] = useState('tutte');
  const [modulo, setModulo] = useState(null);      // { articolo } oppure { articolo: null }
  const [gestisciCategorie, setGestisciCategorie] = useState(false);
  const [daEliminare, setDaEliminare] = useState(null);
  useEffect(() => subscribe(() => ridisegna((n) => n + 1)), []);

  const me = getUserById(user.id) || user;
  const elencoCategorie = categorie();
  const tutti = getArticoli();
  const articoli = tutti.filter((a) => {
    if (categoria === 'senza' && a.categoriaId) return false;
    if (categoria !== 'tutte' && categoria !== 'senza' && a.categoriaId !== categoria) return false;
    if (filtro === 'vendita') return disponibile(a);
    if (filtro === 'nascosti') return !a.attivo;
    if (filtro === 'offerta') return prezzoDi(a).inOfferta;
    if (filtro === 'esauriti') return a.scorta === 0;
    return true;
  });

  // Le categorie si filtrano solo se ce n'e' piu' d'una da distinguere.
  const filtriCategoria = elencoCategorie.length > 0
    ? [
      { id: 'tutte', label: 'Tutte' },
      ...elencoCategorie.map((c) => ({ id: c.id, label: c.nome })),
      ...(tutti.some((a) => !a.categoriaId) ? [{ id: 'senza', label: 'Senza categoria' }] : []),
    ]
    : [];

  return (
    <>
      <PageShell
        title="Articoli"
        description="Il catalogo del Marketplace: che cosa si vende, a che prezzo e in quanti pezzi."
        action={(
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variante="primario" onClick={() => setModulo({ articolo: null })}>Nuovo articolo</Button>
            <Button variante="secondario" onClick={() => setGestisciCategorie(true)}>Categorie</Button>
          </div>
        )}
      />

      <div className="ui-blocco con-stacco">
        <Spedizioni me={me} />
      </div>

      <Chips items={FILTRI} value={filtro} onChange={setFiltro} ariaLabel="Filtra il catalogo" />
      {filtriCategoria.length > 0 && (
        <Chips items={filtriCategoria} value={categoria} onChange={setCategoria} ariaLabel="Filtra per categoria" />
      )}

      <div className="ui-list">
        {articoli.length === 0 ? (
          <div className="empty-state ui-blocco">
            {tutti.length === 0
              ? 'Il catalogo e’ vuoto: il primo articolo si aggiunge da qui sopra.'
              : 'Nessun articolo con questo filtro.'}
          </div>
        ) : articoli.map((a) => {
          const prezzo = prezzoDi(a);
          const img = immagineArticolo(a.immagine);
          return (
            <article key={a.id} className="ui-panel negozio-riga">
              {img && (
                <img
                  className="negozio-figura"
                  src={img}
                  alt=""
                  style={{ imageRendering: a.pixelata ? 'pixelated' : 'auto' }}
                />
              )}

              <div className="negozio-corpo">
                <h3 className="negozio-nome">{a.nome}</h3>
                {a.descrizione && <p className="negozio-nota">{a.descrizione}</p>}

                <p className="negozio-prezzo">
                  <span className="tv-prezzo">
                    {prezzo.finale}
                    <span className="tv-prezzo-unita">crediti</span>
                  </span>
                  {prezzo.inOfferta && (
                    <span className="negozio-pieno">
                      <s>{prezzo.pieno}</s> −{prezzo.sconto}%
                      {a.offertaFino ? ` fino al ${new Date(`${a.offertaFino}T12:00:00`).toLocaleDateString('it-IT')}` : ''}
                    </span>
                  )}
                </p>

                <p className="negozio-tag">
                  <span className={`badge ${a.attivo ? 'badge-primary' : 'badge-neutral'}`}>
                    {a.attivo ? 'in vendita' : 'nascosto'}
                  </span>
                  {categoriaDi(a) && <span className="badge badge-neutral">{categoriaDi(a).nome}</span>}
                  <span className={`badge ${a.scorta === 0 ? 'badge-neutral' : 'badge-neutral'}`}>
                    {scortaLabel(a.scorta)}
                  </span>
                </p>
              </div>

              <div className="negozio-azioni">
                <Button variante="secondario" compatto onClick={() => setModulo({ articolo: a })}>Modifica</Button>
                <Button variante="fantasma" compatto onClick={() => pubblica(me, a.id, !a.attivo)}>
                  {a.attivo ? 'Nascondi' : 'Pubblica'}
                </Button>
                <Button variante="pericolo" compatto onClick={() => setDaEliminare(a)}>Elimina</Button>
              </div>
            </article>
          );
        })}
      </div>

      <BackTile />

      {gestisciCategorie && (
        <CategorieDialog me={me} onChiudi={() => setGestisciCategorie(false)} />
      )}

      {modulo && (
        <ArticoloDialog
          me={me}
          articolo={modulo.articolo}
          onFatto={() => setModulo(null)}
          onChiudi={() => setModulo(null)}
        />
      )}

      {daEliminare && (
        <ConfirmDialog
          titolo={`Eliminare “${daEliminare.nome}”?`}
          testo="Sparisce dal catalogo e non si potra’ piu’ comprare. Gli ordini gia’ fatti restano dove sono, con il nome e il prezzo di allora."
          conferma="Elimina"
          distruttiva
          onConferma={() => { eliminaArticolo(me, daEliminare.id); setDaEliminare(null); }}
          onChiudi={() => setDaEliminare(null)}
        />
      )}
    </>
  );
}
