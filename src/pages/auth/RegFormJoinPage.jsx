import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { addUser, getPendingRegistration, clearPendingRegistration, getOrgByCode } from '../../data/db';
import { chiediIngresso, invitiPerPersona } from '../../data/ingressi';
import BackTile from '../../components/ui/BackTile';

export default function RegFormJoinPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleJoin() {
    const reg = getPendingRegistration();
    if (!reg) {
      navigate('/auth', { replace: true });
      return;
    }
    const org = getOrgByCode(code);
    if (!org) {
      setError('Codice errato');
      return;
    }

    /* L'account nasce comunque: e' suo, e vale anche senza organizzazione —
       ci sono gli XP, i crediti, il negozio. Quello che il codice fa non e'
       farlo entrare, e' fargli bussare. */
    const persona = addUser({
      role: 'employee',
      name: reg.email.split('@')[0],
      email: reg.email,
      password: reg.password,
    });
    clearPendingRegistration();
    login(reg.email, reg.password);

    /* Se qualcuno l'aveva gia' invitato a quell'indirizzo, l'invito e'
       diventato suo appena nato l'account: non ha senso fargli anche
       chiedere: gli basta accettarlo dall'elenco. */
    const invitato = invitiPerPersona(persona.id).some((r) => r.orgId === org.orgId);
    if (!invitato) chiediIngresso(persona, code);

    navigate('/org', { replace: true });
  }

  return (
    <div className="page-center">
      <div style={{ textAlign: 'center' }}>
        <h2>Entra in un’organizzazione</h2>
        <p className="page-desc" style={{ marginTop: '0.4rem' }}>
          Inserisci il codice che ti hanno dato. Non ti fa entrare subito: manda una
          richiesta a chi amministra l’organizzazione, che decide se accettarla.
        </p>
      </div>

      <div className="form">
        <input
          type="text"
          name="org-code"
          placeholder="Codice Organizzazione"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
        />
        {error && (
          <p className="ui-errore" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="px-btn block" onClick={handleJoin}>Chiedi di entrare</button>
      </div>
      <BackTile />
    </div>
  );
}
