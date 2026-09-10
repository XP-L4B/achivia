import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import BackTile from '../../components/ui/BackTile';
import { useAuth } from '../../context/AuthContext';
import { getOrdini, getUserById, subscribe } from '../../data/db';
import { immagineArticolo } from '../../data/articoliImmagini';
import {
  STATI, annulla, annullabile, avanza, clienteDi, etichettaStato, etichettaZona, statoDopo, totaleOrdine,
} from '../../data/negozio';

const FILTRI = [{ id: 'tutti', label: 'Tutti' }, ...STATI.map((s) => ({ id: s.id, label: s.label }))];

// Il verbo che porta l'ordine al passo dopo: "prendo in carico", "e' uscito".
const AVANTI = { nuovo: 'Prendi in carico', preparazione: 'Segna consegnato' };

const quando = (iso) => (iso
  ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—');

/**
 * Gli ordini, dalla parte del negozio.
 *
 * Un ordine va avanti di un passo alla volta e non torna indietro: nuovo,
 * in preparazione, consegnato. L'unica strada che esce dalla fila e'
 * l'annullamento, e quella rimette i crediti nel conto di chi aveva
 * comprato — un ordine annullato non si paga.
 */
export default function ShopOrdiniPage() {
  const { user } = useAuth();
  const [, ridisegna] = useState(0);
  const [filtro, setFiltro] = useState('tutti');
  const [daAnnullare, setDaAnnullare] = useState(null);
  useEffect(() => subscribe(() => ridisegna((n) => n + 1)), []);

  const me = getUserById(user.id) || user;
  const tutti = getOrdini();
  const ordini = filtro === 'tutti' ? tutti : tutti.filter((o) => o.stato === filtro);

  return (
    <>
      <PageShell
        title="Ordini"
        description="Quello che e’ stato comprato dal Marketplace, e a che punto sta."
      />

      <Chips items={FILTRI} value={filtro} onChange={setFiltro} ariaLabel="Filtra gli ordini" />

      <div className="ui-list">
        {ordini.length === 0 ? (
          <div className="empty-state ui-blocco">
            {tutti.length === 0 ? 'Non e’ ancora stato comprato niente.' : 'Nessun ordine in questo stato.'}
          </div>
        ) : ordini.map((o) => {
          const cliente = clienteDi(o);
          const img = immagineArticolo(o.immagine);
          const avanti = statoDopo(o.stato);
          return (
            <article key={o.id} className="ui-panel negozio-riga">
              {img && (
                <img
                  className="negozio-figura"
                  src={img}
                  alt=""
                  style={{ imageRendering: o.pixelata ? 'pixelated' : 'auto' }}
                />
              )}

              <div className="negozio-corpo">
                <h3 className="negozio-nome">{o.nome}</h3>
                <p className="negozio-nota">
                  {cliente?.name ?? 'utente non piu’ esistente'} · {quando(o.creatoIl)}
                </p>

                <p className="negozio-prezzo">
                  <span className="tv-prezzo">
                    {totaleOrdine(o)}
                    <span className="tv-prezzo-unita">crediti</span>
                  </span>
                  {/* Merce e trasporto restano scritti separati: e' quello
                      che serve per preparare il pacco e per la cassa. */}
                  {o.spedizione > 0 && (
                    <span className="negozio-pieno">
                      {o.crediti} di merce + {o.spedizione} di spedizione · {etichettaZona(o.zona)}
                    </span>
                  )}
                  {!o.spedizione && o.zona && (
                    <span className="negozio-pieno">spedizione gratis · {etichettaZona(o.zona)}</span>
                  )}
                  {o.sconto > 0 && <span className="negozio-pieno">comprato in offerta, −{o.sconto}%</span>}
                </p>

                <p className="negozio-tag">
                  <span className={`badge ${o.stato === 'annullato' ? 'badge-neutral' : 'badge-primary'}`}>
                    {etichettaStato(o.stato)}
                  </span>
                </p>
              </div>

              <div className="negozio-azioni">
                {avanti && (
                  <Button variante="successo" compatto onClick={() => avanza(me, o.id)}>
                    {AVANTI[o.stato]}
                  </Button>
                )}
                {annullabile(o) && (
                  <Button variante="pericolo" compatto onClick={() => setDaAnnullare(o)}>Annulla</Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <BackTile />

      {daAnnullare && (
        <ConfirmDialog
          titolo={`Annullare l’ordine di ${clienteDi(daAnnullare)?.name || 'questo utente'}?`}
          testo={`I ${daAnnullare.crediti} crediti tornano sul suo conto, e il pezzo torna disponibile.`}
          conferma="Annulla l’ordine"
          annulla="Lascia stare"
          distruttiva
          onConferma={() => { annulla(me, daAnnullare.id); setDaAnnullare(null); }}
          onChiudi={() => setDaAnnullare(null)}
        />
      )}
    </>
  );
}
