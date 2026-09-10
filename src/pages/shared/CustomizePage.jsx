import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { useAuth } from '../../context/AuthContext';
import { AVATARS } from '../../data/avatars';
import { getUserById, updateUser } from '../../data/db';
import { erroreNickname, salvaNickname, codiceVisibile, NICKNAME_MAX } from '../../data/identita';
import BackTile from '../../components/ui/BackTile';

// Scelta dell'avatar e del nome che si mostra. Il vestiario componibile
// (copricapo/top/bottom/scarpe/arma) previsto dall'analisi funzionale non e'
// ancora realizzato: qui si sceglie un personaggio intero fra quelli
// disponibili.
//
// Il nickname sta qui e non altrove perche' e' la stessa domanda dell'avatar:
// come voglio farmi vedere. Il nome vero non si tocca — resta scritto sotto,
// piccolo, ovunque — e il numero Achivia nemmeno: quello non e' una scelta,
// e' l'identita' dell'account.
export default function CustomizePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = getUserById(user.id) || user;
  const [selected, setSelected] = useState(me.avatar || 'header');
  const [nickname, setNickname] = useState(me.nickname || '');
  const [errore, setErrore] = useState('');

  function save() {
    const problema = erroreNickname(nickname);
    if (problema) { setErrore(problema); return; }
    updateUser(me.id, { avatar: selected });
    salvaNickname(me, nickname);
    navigate(-1);
  }

  return (
    <>
      <PageShell title="Personalizza" description="Scegli il tuo personaggio e il nome con cui farti vedere." />
      <div className="ui-corpo-pagina">
        <section className="ui-blocco con-stacco tv-modulo">
          <label className="label">
            Nickname
            <input
              type="text"
              value={nickname}
              maxLength={NICKNAME_MAX}
              placeholder={me.name}
              onChange={(e) => { setNickname(e.target.value); setErrore(''); }}
            />
          </label>
          <p className="ui-dialog-hint">
            Lo mostriamo al posto di nome e cognome, che restano scritti sotto in
            piccolo. Lascialo vuoto per farti chiamare {me.name}. Il tuo numero
            Achivia — {codiceVisibile(me) || 'in arrivo'} — non cambia mai: è
            quello che dice a tutti che sei tu.
          </p>
          {errore && <p className="ui-errore" role="alert">{errore}</p>}
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 'var(--space-3)' }}>
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a.id)}
              className="px-frame"
              style={{
                padding: 'var(--space-2)',
                cursor: 'pointer',
                background: selected === a.id ? 'var(--px-accent-d)' : 'transparent',
                border: selected === a.id ? '3px solid var(--px-gold)' : '3px solid var(--px-edge)',
              }}
              aria-pressed={selected === a.id}
            >
              {/* Qui basta la miniatura: l'avatar intero si vede nel profilo. */}
              <img src={a.thumb} alt={`Avatar ${a.id}`} loading="lazy" style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }} />
            </button>
          ))}
        </div>
        <button type="button" className="px-btn block" style={{ marginTop: 'var(--space-5)' }} onClick={save}>
          Salva
        </button>
      </div>
      <BackTile />
    </>
  );
}
