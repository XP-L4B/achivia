import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import { TerminalStato } from '../../components/terminal/TerminalRows';
import ConnectWalletButton from '../../components/web3/ConnectWalletButton';
import { useCollectionNfts } from '../../hooks/useCollectionNfts';
import { useAuth } from '../../context/AuthContext';
import { getUserById, subscribe } from '../../data/db';
import { immagineArticolo } from '../../data/articoliImmagini';
import { ZONE, catalogo, categorieInVetrina, compra, costoSpedizione, prezzoDi, spedizione } from '../../data/negozio';
import Button from '../../components/ui/Button';

// Contratto della collezione su Sepolia da mostrare. Configurabile via env
// (VITE_DEMO_COLLECTION) così lo cambi senza toccare il codice.
const DEMO_CONTRACT = import.meta.env.VITE_DEMO_COLLECTION || '';

function NftSection() {
  const { data, isLoading, error } = useCollectionNfts(DEMO_CONTRACT);

  if (!DEMO_CONTRACT) {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>
        Imposta <code>VITE_DEMO_COLLECTION</code> (indirizzo contratto su Sepolia) per
        mostrare gli NFT reali qui.
      </p>
    );
  }
  // Attesa ed errore parlano la lingua del terminale: e' la stessa superficie
  // che poi mostrera' i dati, e cambiare voce a meta' sarebbe uno stacco.
  if (isLoading) {
    return <TerminalStato cursore>Carico NFT da OpenSea…</TerminalStato>;
  }
  if (error) return <TerminalStato tono="errore">Errore: {error.message}</TerminalStato>;

  const nfts = (data?.nfts || []).filter((n) => n.image_url);
  if (nfts.length === 0) return <TerminalStato>Nessun NFT trovato.</TerminalStato>;

  return (
    <div className="ui-cards">
      {nfts.map((nft) => (
        <div key={`${nft.contract}-${nft.identifier}`} className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
          <img
            src={nft.image_url}
            alt={nft.name || `#${nft.identifier}`}
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
            loading="lazy"
          />
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', marginTop: 'var(--space-2)' }}>
            {nft.name || `#${nft.identifier}`}
          </div>
          {/* Slice 2: qui andrà il prezzo (listing) e il bottone Compra/Scambia */}
          <Button variante="secondario" compatto disabled style={{ marginTop: 'var(--space-2)' }}>
            Compra (presto)
          </Button>
        </div>
      ))}
    </div>
  );
}

/**
 * Il Marketplace come lo vede chi compra.
 *
 * Il listino non e' piu' scritto qui dentro: arriva dal catalogo che tiene
 * il negozio, e mostra solo quello che e' davvero in vendita — niente
 * articoli nascosti, niente articoli finiti. Il prezzo e' quello vero,
 * offerta compresa.
 *
 * Comprare costa: i crediti se ne vanno dal conto nel momento in cui si
 * clicca, e l'ordine parte da li'. Se non bastano, non succede niente e lo
 * si legge sotto il pulsante.
 */
export default function MarketplacePage() {
  const { user } = useAuth();
  const [, ridisegna] = useState(0);
  const [esito, setEsito] = useState(null);   // { id, testo, ok }
  const [categoria, setCategoria] = useState('tutte');
  /* Dove si spedisce: la scelta vale per la pagina, non per il singolo
     articolo, perche' e' una cosa sola di chi compra — dove abita. Parte
     dall'Italia, che e' il caso comune, e si cambia con una pillola. */
  const [zona, setZona] = useState('italia');
  useEffect(() => subscribe(() => ridisegna((n) => n + 1)), []);

  const me = getUserById(user.id) || user;
  const speseZona = spedizione();
  const inVetrina = catalogo();
  // Il filtro per categoria compare solo quando c'e' davvero qualcosa da
  // separare: con una categoria sola sarebbero due pillole che dicono la
  // stessa cosa.
  const gruppi = categorieInVetrina();
  const filtri = gruppi.length > 1
    ? [{ id: 'tutte', label: 'Tutto' }, ...gruppi.map((c) => ({ id: c.id, label: c.nome }))]
    : [];
  const articoli = categoria === 'tutte'
    ? inVetrina
    : inVetrina.filter((a) => a.categoriaId === categoria);

  function acquista(articolo) {
    const risultato = compra(me, articolo.id, zona);
    setEsito(risultato.ok
      ? { id: articolo.id, ok: true, testo: 'Ordinato: lo trovi fra i tuoi acquisti.' }
      : { id: articolo.id, ok: false, testo: risultato.errore });
    if (risultato.ok) {
      setTimeout(() => setEsito((c) => (c && c.id === articolo.id ? null : c)), 2600);
    }
  }

  return (
    <>
      <PageShell title="Marketplace" description="Spendi i tuoi crediti." />
      <div style={{ padding: '0 var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/marketplace/purchases" className="px-btn ghost" style={{ width: 'auto' }}>
            I miei acquisti
          </Link>
          <Link to="/credits-info" className="px-btn ghost" style={{ width: 'auto' }}>
            Info crediti
          </Link>
          <ConnectWalletButton />
        </div>

        {/* Quanto si puo' spendere: in un negozio il saldo si vede prima di
            guardare i prezzi, non dopo aver provato a pagare. E accanto la
            strada per averne di piu': un saldo che non basta e nessun modo
            di aumentarlo e' un vicolo cieco messo davanti alla vetrina. */}
        <p className="tv-prezzo" style={{ marginBottom: 'var(--space-3)' }}>
          {me.credits || 0}
          <span className="tv-prezzo-unita">crediti tuoi</span>
        </p>
        <Link to="/compra-crediti" className="px-btn ghost" style={{ width: 'auto', marginBottom: 'var(--space-4)' }}>
          Compra crediti
        </Link>

        {/* Sezione NFT (Sepolia, via proxy OpenSea) */}
        <h2 style={{ fontSize: '0.95rem', margin: 'var(--space-2) 0 var(--space-3)' }}>NFT · Sepolia</h2>
        <NftSection />

        <h2 style={{ fontSize: '0.95rem', margin: 'var(--space-5) 0 var(--space-3)' }}>Premi a crediti</h2>
        {filtri.length > 0 && (
          <Chips items={filtri} value={categoria} onChange={setCategoria} ariaLabel="Filtra per categoria" />
        )}

        {/* La spedizione si sceglie prima, non alla cassa: il prezzo scritto
            sotto ogni articolo deve essere quello che si paga davvero. */}
        {(speseZona.italia > 0 || speseZona.ue > 0) && (
          <div className="mk-spedizione">
            <span className="mk-spedizione-eti">Spedizione</span>
            <Chips
              items={ZONE.map((z) => ({ id: z.id, label: z.label }))}
              value={zona}
              onChange={setZona}
              ariaLabel="Dove spedire"
            />
            <small className="tv-nota">
              {speseZona.gratisDa !== null
                ? `Sopra i ${speseZona.gratisDa} crediti di merce la spedizione e’ gratis.`
                : 'La spedizione si somma al prezzo dell’articolo.'}
            </small>
          </div>
        )}
        {articoli.length === 0 ? (
          <div className="empty-state">Il negozio non ha niente in vetrina in questo momento.</div>
        ) : (
          <div className="ui-cards">
            {articoli.map((a) => {
              const prezzo = prezzoDi(a);
              const img = immagineArticolo(a.immagine);
              const mio = esito && esito.id === a.id ? esito : null;
              const spese = costoSpedizione(zona, prezzo.finale);
              const totale = prezzo.finale + spese.crediti;
              const bastano = (me.credits || 0) >= totale;
              return (
                <div key={a.id} className="card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                  {img && (
                    <img
                      src={img}
                      alt={a.nome}
                      style={{ width: '70%', aspectRatio: '1', objectFit: 'contain', margin: '0 auto var(--space-3)', imageRendering: a.pixelata ? 'pixelated' : 'auto', display: 'block', borderRadius: a.pixelata ? 0 : 'var(--radius-sm)' }}
                    />
                  )}
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', lineHeight: 1.6, color: 'var(--px-text)' }}>{a.nome}</div>
                  {a.descrizione && (
                    <p style={{ fontSize: 'var(--t-xl)', color: 'var(--ui-body)', margin: 'var(--space-2) 0 0' }}>{a.descrizione}</p>
                  )}
                  <div style={{ margin: 'var(--space-3) 0' }}>
                    <span className="tv-prezzo">
                      {prezzo.finale}
                      <span className="tv-prezzo-unita">crediti</span>
                    </span>
                    {prezzo.inOfferta && (
                      <div className="negozio-pieno" style={{ marginTop: 4 }}>
                        <s>{prezzo.pieno}</s> in offerta, −{prezzo.sconto}%
                      </div>
                    )}
                    {/* Il trasporto sta accanto al prezzo, non nascosto in
                        fondo: un costo che si scopre premendo e' un costo
                        nascosto, e questo non lo e'. */}
                    {spese.pieno > 0 && (
                      <div className="negozio-pieno" style={{ marginTop: 4 }}>
                        {spese.gratis
                          ? 'spedizione gratis'
                          : `+${spese.crediti} di spedizione = ${totale} in tutto`}
                        {!spese.gratis && spese.manca > 0 && (
                          <><br />gratis con {spese.manca} crediti di merce in piu’</>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variante="primario" blocco onClick={() => acquista(a)} disabled={!bastano}>
                    {bastano ? 'Acquista' : 'Crediti insufficienti'}
                  </Button>
                  {mio && (
                    <p
                      role="status"
                      style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--t-s)', color: mio.ok ? 'var(--tv-primary)' : 'var(--ui-alert-testo)' }}
                    >
                      {mio.testo}
                    </p>
                  )}
                  {a.scorta !== null && a.scorta <= 5 && (
                    <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--t-s)', color: 'var(--tv-dim)' }}>
                      {a.scorta === 1 ? 'ne resta uno' : `ne restano ${a.scorta}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
