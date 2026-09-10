import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserByEmail, setPendingRegistration } from '../../data/db';
import { areaDi, fuoriDalleOrg } from '../../data/permessi';
import ControlliMusica from '../../components/ui/ControlliMusica';
import StoriaAchivia from '../../components/ui/StoriaAchivia';

export default function AuthChoicePage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkPassword, setCheckPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin(e) {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    /* Dopo l'accesso non si entra da nessuna parte: si sceglie. Le
       organizzazioni sono canali, una persona puo' farne parte di piu'
       d'una con ruoli diversi, e quale aprire lo decide lei ogni volta.
       Il negozio, l'osservatorio e il Castello no: vivono fuori dalle
       organizzazioni,
       non hanno canali, e un elenco vuoto sarebbe solo un passaggio in
       piu' fra loro e il loro lavoro. */
    const area = areaDi(res.user);
    const fuori = fuoriDalleOrg(area);
    navigate(fuori ? `/${area}` : '/org', { replace: true });
  }

  function handleProceed(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Inserisci email e password.');
      return;
    }
    if (password !== checkPassword) {
      setError('Le password non coincidono.');
      return;
    }
    if (getUserByEmail(email)) {
      setError('Esiste già un account con questa email.');
      return;
    }
    setPendingRegistration({ email: email.trim(), password });
    navigate('/auth/register/org-choice');
  }

  return (
    // Da telefono e' una colonna sola, con la storia sopra il modulo; da
    // scrivania sono due, la storia a sinistra e l'accesso a destra. La
    // storia sta prima anche nel codice, cosi' l'ordine di lettura e quello
    // che si vede sono la stessa cosa; il modulo non ha niente davanti da
    // saltare, perche' nel racconto non c'e' niente su cui ci si ferma col
    // Tab.
    <div className="page-center pixel-bg auth-screen auth-con-storia">
      <StoriaAchivia />

      <div className="auth-colonna">
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>Achivia</h1>
          <p className="auth-tagline">enhance &amp; engage</p>
        </div>

        <form className="form" onSubmit={mode === 'login' ? handleLogin : handleProceed}>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Indirizzo email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
          />
          <input
            type="password"
            name="current-password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
          />
          {mode === 'register' && (
            <input
              type="password"
              name="check-password"
              autoComplete="new-password"
              placeholder="Conferma password"
              value={checkPassword}
              onChange={(e) => { setCheckPassword(e.target.value); setError(''); }}
            />
          )}

          {error && <p className="ui-errore" role="alert">{error}</p>}

          {mode === 'login' ? (
            <button type="submit" className="px-btn block" style={{ marginTop: '0.25rem' }}>
              Accedi
            </button>
          ) : (
            <button type="submit" className="px-btn block" style={{ marginTop: '0.25rem' }}>
              Procedi
            </button>
          )}
        </form>

        {mode === 'login' ? (
          <p className="auth-toggle" style={{ color: 'var(--text-muted)' }}>
            Non hai un account?{' '}
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              style={linkBtnStyle}
            >
              Registrati
            </button>
          </p>
        ) : (
          <p className="auth-toggle" style={{ color: 'var(--text-muted)' }}>
            Hai già un account?{' '}
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setCheckPassword(''); }}
              style={linkBtnStyle}
            >
              Accedi
            </button>
          </p>
        )}

        {/* La musica parte al primo clic, e il primo clic si fa qui: chi la
            trova troppo alta deve poterlo dire subito, non dopo essere
            entrato e aver cercato le impostazioni. */}
        <ControlliMusica compatto />

        {mode === 'login' && (
          <details style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            <summary style={{ cursor: 'pointer' }}>Account demo</summary>
            <div style={{ marginTop: '0.4rem', lineHeight: 1.6 }}>
              Admin: <b>admin@achivia.test</b> / admin<br />
              Manager: <b>laura@achivia.test</b> / manager<br />
              Dipendente: <b>alice@achivia.test</b> / emp<br />
              Negozio: <b>shop@achivia.test</b> / shop<br />
              Osservatorio: <b>osservatorio@achivia.test</b> / oss<br />
              Senza organizzazione: <b>prova@achivia.test</b> / prova
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

const linkBtnStyle = {
  background: 'none', border: 'none', padding: 0,
  color: 'var(--primary)', fontWeight: 600, cursor: 'pointer',
};
