import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import {
  resetDb, getUserById, chiudiOrganizzazione, nomeOrgDi, getOrgSeats,
} from '../../data/db';
import { useAuth } from '../../context/AuthContext';
import BackTile from '../../components/ui/BackTile';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';

/**
 * Le impostazioni dell'organizzazione.
 *
 * Il piano dell'organizzazione ha una pagina sua: qui c'e' il collegamento.
 * Al suo posto c'era "Passa a Premium", un pulsante senza gestore, e la
 * ragione era che non c'era niente a cui passare — il premium era un
 * interruttore. Adesso i piani sono due listini da quattro, uno per le
 * aziende e uno per i gruppi, e la pagina li mette in fila.
 *
 * L'osservatorio non si compra da qui, e non si compra per intero da
 * nessuna parte: e' una dashboard a parte, con un account suo che
 * consegniamo noi. Quello che un piano puo' aprire e' una sua pagina o
 * tutte le sue pagine, ed e' scritto nella pagina dei piani.
 *
 * I crediti si comprano: si spendono nel negozio, che sta fuori dalle
 * organizzazioni e vale per tutti.
 */
export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const me = getUserById(user?.id) || user;
  const [ripristino, setRipristino] = useState(false);
  const [daChiudere, setDaChiudere] = useState(false);
  const [errore, setErrore] = useState('');

  // La chiusura la puo' fare solo chi possiede l'organizzazione.
  const proprietario = Boolean(me?.orgOwner);
  const quanti = getOrgSeats(me?.orgId).usati;

  function handleReset() {
    resetDb();
    window.location.reload();
  }

  function handleChiudi() {
    const esito = chiudiOrganizzazione(me.orgId, me.id);
    setDaChiudere(false);
    if (!esito.ok) {
      setErrore(esito.errore);
      return;
    }
    /* Si esce dall'applicazione e si rientra: l'organizzazione che si stava
       guardando non c'e' piu', e ogni schermata aperta parlerebbe di lei. */
    logout();
    navigate('/auth', { replace: true });
  }

  return (
    <>
      <PageShell title="Impostazioni Admin" />
      <div style={{ padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 400 }}>
        <Button variante="primario" blocco to="/compra-crediti">Acquisto Crediti</Button>
        <Button variante="secondario" blocco to="/admin/cassa">La cassa dell’organizzazione</Button>
        <Button variante="secondario" blocco>Toggle countdown Quest</Button>
        {/* "Passa a Premium" non faceva niente, perche' il premium era un
            interruttore e non c'era niente a cui passare. Adesso i piani
            sono quattro e hanno una pagina loro. */}
        <Button variante="secondario" blocco to="/admin/settings/piani">Il tuo piano</Button>
        <Button variante="secondario" blocco>Upload logo aziendale (JPG)</Button>
        <Button variante="secondario" blocco disabled>Brandizza Marketplace (richiede logo)</Button>
        <Button variante="pericolo" blocco onClick={() => setRipristino(true)}>
          Ripristina dati di test
        </Button>
        {/* La chiusura sta in fondo, dopo tutto il resto, e la vede solo chi
            puo' farla: e' l'unica azione di questa pagina da cui non si
            torna indietro. */}
        {proprietario && (
          <Button variante="pericolo" blocco onClick={() => { setErrore(''); setDaChiudere(true); }}>
            Chiudi l’organizzazione
          </Button>
        )}
        {errore && <p className="ui-errore" role="alert">{errore}</p>}
      </div>
      {ripristino && (
        <ConfirmDialog
          titolo="Ripristinare i dati di test?"
          testo="Tutto quello che è stato fatto — quest, competenze, achievement, persone registrate — torna com’era all’inizio. Non si può annullare."
          conferma="Ripristina"
          distruttiva
          onConferma={handleReset}
          onChiudi={() => setRipristino(false)}
        />
      )}
      {daChiudere && (
        <ConfirmDialog
          titolo={`Chiudere ${nomeOrgDi(me.orgId) || 'l’organizzazione'}?`}
          testo={`${quanti === 1 ? 'Tu esci' : `Tutte e ${quanti} le persone escono`} come se ${quanti === 1 ? 'te ne andassi' : 'se ne andassero'} da sol${quanti === 1 ? 'o' : 'i'}: quello che ognuno si è guadagnato mentre l’organizzazione aveva l’abbonamento resta suo, il resto no. Il codice smette di funzionare e l’organizzazione sparisce dall’elenco di tutti. Non si può riaprire.`}
          conferma="Chiudi l’organizzazione"
          distruttiva
          onConferma={handleChiudi}
          onChiudi={() => setDaChiudere(false)}
        />
      )}
      <BackTile />
    </>
  );
}
