import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import { useAuth } from '../../context/AuthContext';
import { subscribe } from '../../data/db';
import { immagineArticolo } from '../../data/articoliImmagini';
import { etichettaStato, ordiniDi, etichettaZona, totaleOrdine} from '../../data/negozio';

const quando = (iso) => (iso
  ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  : '');

/**
 * Gli ordini di chi compra.
 *
 * Non e' piu' solo l'elenco di quello che si e' preso: c'e' anche a che
 * punto sta, perche' fra il clic e il premio in mano c'e' qualcuno che lo
 * prepara. Un ordine annullato resta in lista, spento: i crediti sono
 * tornati indietro, e chi guarda deve poterlo vedere.
 */
export default function PurchasesPage() {
  const { user } = useAuth();
  const [, ridisegna] = useState(0);

  // Ricarica quando il DB cambia (anche da un'altra scheda).
  useEffect(() => subscribe(() => ridisegna((v) => v + 1)), []);

  const ordini = ordiniDi(user.id);

  return (
    <>
      <PageShell title="I miei acquisti" description="I premi che hai riscattato dal Marketplace, e a che punto sono." />
      <div style={{ padding: '0 var(--space-6)' }}>
        {ordini.length === 0 ? (
          <div className="empty-state">Non hai ancora effettuato acquisti.</div>
        ) : (
          <div className="ui-cards">
            {ordini.map((o) => {
              const img = immagineArticolo(o.immagine);
              const annullato = o.stato === 'annullato';
              return (
                <div key={o.id} className="card" style={{ textAlign: 'center', padding: 'var(--space-4)', opacity: annullato ? 0.6 : 1 }}>
                  {img && (
                    <img
                      src={img}
                      alt={o.nome}
                      style={{ width: '70%', aspectRatio: '1', objectFit: 'contain', margin: '0 auto var(--space-3)', imageRendering: o.pixelata ? 'pixelated' : 'auto', display: 'block', borderRadius: o.pixelata ? 0 : 'var(--radius-sm)' }}
                    />
                  )}
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', lineHeight: 1.6, color: 'var(--px-text)' }}>{o.nome}</div>
                  <div style={{ margin: 'var(--space-3) 0 var(--space-2)' }}>
                    <span className="tv-prezzo">
                      {totaleOrdine(o)}
                      <span className="tv-prezzo-unita">crediti</span>
                    </span>
                    {/* Quanto e' costato il trasporto resta scritto: e' meta'
                        di quello che si e' pagato, e sparirebbe nel totale. */}
                    {o.spedizione > 0 && (
                      <div className="negozio-pieno" style={{ marginTop: 4 }}>
                        {o.crediti} di merce + {o.spedizione} di spedizione · {etichettaZona(o.zona)}
                      </div>
                    )}
                  </div>
                  <p className="negozio-tag" style={{ justifyContent: 'center' }}>
                    <span className={`badge ${annullato ? 'badge-neutral' : 'badge-primary'}`}>
                      {etichettaStato(o.stato)}
                    </span>
                  </p>
                  {annullato && (
                    <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--t-s)', color: 'var(--tv-dim)' }}>
                      crediti restituiti
                    </p>
                  )}
                  {o.creatoIl && (
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', lineHeight: 1.7, color: 'var(--px-muted)', marginTop: 'var(--space-2)' }}>
                      {quando(o.creatoIl)}
                    </div>
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
