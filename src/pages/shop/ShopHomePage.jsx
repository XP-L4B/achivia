import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../../components/terminal/TerminalRows';
import { useAuth } from '../../context/AuthContext';
import { subscribe } from '../../data/db';
import { registroCassa, riepilogoNegozio } from '../../data/negozio';

/**
 * La prima schermata del negozio: che cosa c'e' da fare adesso, e come sta
 * andando.
 *
 * In cima il numero che conta piu' di tutti — gli ordini che nessuno ha
 * ancora preso in mano — perche' e' l'unico che chiede di fare qualcosa
 * oggi. Sotto il catalogo e l'incasso, che si guardano, non si rincorrono.
 */
export default function ShopHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, ridisegna] = useState(0);
  useEffect(() => subscribe(() => ridisegna((n) => n + 1)), []);

  const r = riepilogoNegozio();
  const cassa = registroCassa({ giorni: 7, settimane: 4 });
  const daFare = r.nuovi + r.preparazione;

  return (
    <>
      <PageShell
        title="Negozio"
        description={`Ciao ${user?.name || ''}. Da qui si tiene il Marketplace: catalogo, prezzi, offerte e ordini.`}
      />

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="ORDINI"
          meta={daFare ? 'DA EVADERE' : 'IN PARI'}
          piede={daFare
            ? `${daFare} ${daFare === 1 ? 'ordine aspetta' : 'ordini aspettano'}`
            : 'NESSUN ORDINE IN SOSPESO'}
          tonoPiede={daFare ? 'attesa' : ''}
          onClick={() => navigate('/shop/ordini')}
        >
          <TerminalValue valore={daFare} unita={daFare === 1 ? 'da evadere' : 'da evadere'} nota={`${r.ordini} in tutto`} />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            vivo
            voci={[
              { label: 'Nuovi', valore: r.nuovi, tono: r.nuovi ? '' : 'spento' },
              { label: 'In preparazione', valore: r.preparazione, tono: r.preparazione ? 'attesa' : 'spento' },
              { label: 'Consegnati', valore: r.consegnati, tono: 'testo' },
              { label: 'Annullati', valore: r.annullati, tono: 'spento' },
            ]}
          />
        </TerminalPanel>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="CATALOGO"
          meta={`${r.inVendita}/${r.articoli}`}
          piede={r.esauriti ? `${r.esauriti} ESAURITI` : 'NIENTE DA RIFORNIRE'}
          tonoPiede={r.esauriti ? 'attesa' : ''}
          onClick={() => navigate('/shop/articoli')}
        >
          <TerminalRows
            vivo
            voci={[
              { label: 'Articoli', valore: r.articoli },
              { label: 'In vendita', valore: r.inVendita, tono: 'testo' },
              { label: 'In offerta', valore: r.inOfferta, tono: r.inOfferta ? '' : 'spento' },
              { label: 'Esauriti', valore: r.esauriti, tono: r.esauriti ? 'attesa' : 'spento' },
            ]}
          />
        </TerminalPanel>
      </div>

      {/* L'incasso non e' un numero solo: «sempre» dice se l'idea funziona,
          «oggi» e «questa settimana» dicono come sta andando adesso. Il
          registro per esteso sta nella cassa, e da qui ci si arriva. */}
      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="INCASSO"
          meta="CREDITI"
          piede="ORDINI ANNULLATI ESCLUSI"
          onClick={() => navigate('/shop/cassa')}
        >
          <TerminalValue valore={r.incassato} unita="crediti" nota={`${r.ordini - r.annullati} ordini validi`} />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            vivo
            voci={[
              { id: 'oggi', label: `Oggi · ${cassa.periodi.oggi.ordini} ${cassa.periodi.oggi.ordini === 1 ? 'ordine' : 'ordini'}`, valore: cassa.periodi.oggi.totale, tono: cassa.periodi.oggi.totale ? '' : 'spento' },
              { id: 'sett', label: `Questa settimana · ${cassa.periodi.settimana.ordini} ${cassa.periodi.settimana.ordini === 1 ? 'ordine' : 'ordini'}`, valore: cassa.periodi.settimana.totale, tono: cassa.periodi.settimana.totale ? '' : 'spento' },
              { id: 'mese', label: 'Questo mese', valore: cassa.periodi.mese.totale, tono: cassa.periodi.mese.totale ? '' : 'spento' },
              { id: 'sped', label: 'Di cui spedizioni', valore: r.incassatoSpedizioni, tono: r.incassatoSpedizioni ? '' : 'spento' },
            ]}
          />
        </TerminalPanel>
      </div>

      {/* L'uscita non sta piu' qui, ne' in cima: e' una voce della barra,
          dove si cerca tutto il resto. Due pulsanti "Esci" in una pagina che
          non parla d'altro che di ordini erano due pulsanti di troppo. */}
      <div className="ui-blocco con-stacco" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Button variante="primario" to="/shop/articoli">Gestisci il catalogo</Button>
        <Button variante="secondario" to="/shop/ordini">Vedi gli ordini</Button>
        <Button variante="secondario" to="/shop/cassa">Apri la cassa</Button>
      </div>
    </>
  );
}
