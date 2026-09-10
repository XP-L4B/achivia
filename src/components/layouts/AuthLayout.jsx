import { Outlet } from 'react-router-dom';
import Wordmark from '../ui/Wordmark';
import AchiviaLogo from '../ui/AchiviaLogo';

// Schermate di accesso e registrazione: marchio in alto, barra in basso con
// il solo logo al centro, come nei mockup di sign in e sign up.
export default function AuthLayout() {
  return (
    <div className="app-shell">
      {/* La barra in basso e' fissa: senza spazio riservato il fondo della
          pagina le finirebbe sotto. */}
      <main className="pixel-bg auth-screen app-main with-nav">
        <Wordmark />
        <Outlet />
      </main>
      <nav className="px-nav">
        <span className="px-nav-item brand"><AchiviaLogo className="px-nav-icon" /></span>
      </nav>
    </div>
  );
}
