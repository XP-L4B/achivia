import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resetDb } from '../../data/db';
import { primaTavola } from '../../data/permessi';
import BackTile from '../../components/ui/BackTile';
import HelpButton from '../../components/ui/HelpButton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';

const baseItems = [
  { label: 'Storico lavorativo',  to: '/storico-lavorativo' },
  { label: 'Marketplace',         to: '/marketplace' },
  { label: 'Achivia Leaderboard', to: '/leaderboard' },
  { label: 'Games',               to: '/giochi' },
  { label: 'Aiuto',               to: '/help' },
  { label: 'FAQ',                 to: '/faq' },
  { label: 'Impostazioni',        to: '/settings' },
  { label: 'About Achivia',       to: '/about' },
  { label: 'Termini di servizio', to: '/terms' },
  { label: 'Privacy Policy',      to: '/privacy' },
  // Subito sotto la privacy, perche' e' la privacy applicata a se stessi:
  // la prima dice come funziona in generale, questa che cosa c'e' scritto
  // sul tuo profilo e chi lo vede.
  { label: 'I tuoi dati e i tuoi diritti', to: '/i-miei-dati' },
];

export default function MenuPage() {
  const navigate = useNavigate();
  const [ripristino, setRipristino] = useState(false);
  const { user, logout } = useAuth();

  // L'assistente AI è disponibile solo per i dipendenti.
  let items = baseItems;
  if (user?.role === 'employee') {
    /* L'assistente non e' piu' una voce di questo menu, e non e' una
       dimenticanza: non e' una cosa con cui si chiacchiera. Si consulta dal
       profilo di una persona, premendo una delle azioni, e lo fa chi
       guida — vedi `AiPanel`. */
    items = [
      { label: 'I miei achievement', to: '/employee/achievements' },
      ...baseItems,
    ];
  } else if (user?.role === 'admin') {
    /* L'admin gira nelle schermate del manager: da qui torna alle sue.
       E se il piano dell'organizzazione apre una parte dell'osservatorio —
       dal Gold in poi — la voce compare qui, che e' l'unico posto da cui
       si arriva: l'osservatorio non e' nella barra di nessuna
       organizzazione, e non deve esserlo. Porta alla prima tavola che il
       piano apre, non a una che sarebbe chiusa. */
    const osservatorio = primaTavola(user);
    items = [
      { label: 'Area amministratore', to: '/admin' },
      ...(osservatorio ? [{ label: 'Osservatorio', to: osservatorio }] : []),
      ...baseItems,
    ];
  }

  function handleLogout() {
    logout();
    navigate('/auth', { replace: true });
  }

  function handleReset() {
    resetDb();
    window.location.reload();
  }

  return (
    <div className="page">
      <div className="ui-help-riga">
        <h1 style={{ margin: 0 }}>Menu</h1>
        <HelpButton />
      </div>
      <ul className="menu-list" style={{ marginTop: 'var(--space-2)' }}>
        {items.map((item) => (
          <li key={item.to} className="menu-item">
            <Link to={item.to} className="menu-link">{item.label}</Link>
          </li>
        ))}
        <li className="menu-item">
          <Button variante="fantasma" blocco className="menu-azione" onClick={() => setRipristino(true)}>
            Ripristina dati di test
          </Button>
        </li>
        {/* Appena sopra il logout, e non fra le voci sopra, perche' e' la
            stessa famiglia di azioni: tutte e due cambiano dove ti trovi
            invece di portarti in una schermata. Cambiare organizzazione e'
            un'uscita che non richiede di rientrare. */}
        <li className="menu-item">
          <Button variante="secondario" blocco className="menu-azione" to="/org">
            Seleziona org
          </Button>
        </li>
        <li className="menu-item">
          <Button variante="pericolo" blocco className="menu-azione" onClick={handleLogout}>
            Logout
          </Button>
        </li>
      </ul>
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
      <BackTile />
    </div>
  );
}
