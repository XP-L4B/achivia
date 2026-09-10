import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { LevelPill } from '../../components/ui/Pills';
import { getUserById, getUserInOrg, rimuoviDaOrg, resetUserPassword } from '../../data/db';
import BackTile from '../../components/ui/BackTile';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  assegnaDipartimenti, assegnaRuolo, dipartimentiDi, eProprietario, promuoviCoAdmin,
  revocaCoAdmin, ruoloDi, ruoliDi, trasferisciProprieta,
} from '../../data/permessi';

const ROLE_META = {
  admin:    { label: 'Admin',      cls: 'badge-warning' },
  manager:  { label: 'Manager',    cls: 'badge-primary' },
  employee: { label: 'Dipendente', cls: 'badge-neutral' },
};

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  const [daEliminare, setDaEliminare] = useState(false);
  const [daPassare, setDaPassare] = useState(false);
  const [tempPwd, setTempPwd] = useState('');
  const [errore, setErrore] = useState('');

  const me = getUserById(user.id) || user;
  /* La persona come sta in *questa* organizzazione: ruolo, reparti e nome
     sono quelli di qui. Chi non e' di qui non si apre — e non si apre
     nemmeno scrivendo l'indirizzo a mano. */
  const u = getUserInOrg(id, me.orgId);

  if (!u) {
    return (
      <>
        <PageShell title="Utente" />
        <div style={{ padding: '0 var(--space-6)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Utente non trovato.</p>
        </div>
      </>
    );
  }

  const meta = ROLE_META[u.role] || { label: u.role, cls: 'badge-neutral' };
  const ruolo = ruoloDi(u);
  const ruoli = ruoliDi(me.orgId);
  const reparti = dipartimentiDi(me.orgId);
  const suoi = new Set(u.departmentIds ?? []);
  const io = u.id === me.id;

  const handleReset = () => {
    const pwd = resetUserPassword(u.id);
    setTempPwd(pwd);
  };

  const agisci = (esito) => {
    setErrore(esito.ok ? '' : esito.errore);
    setVersion((v) => v + 1);
  };

  const cambiaReparto = (repartoId) => {
    const prossimi = suoi.has(repartoId)
      ? [...suoi].filter((x) => x !== repartoId)
      : [...suoi, repartoId];
    agisci(assegnaDipartimenti(me, u.id, prossimi));
  };

  const handleDelete = () => {
    /* Si toglie dall'organizzazione, non si cancella l'account: quella
       persona puo' farne parte di altre, e i suoi XP e i suoi crediti sono
       suoi. L'autorita' di un admin finisce alla sua organizzazione. */
    rimuoviDaOrg(u.id, me.orgId);
    navigate('/admin/users', { replace: true });
  };

  return (
    <>
      <PageShell title={u.name} />
      <div style={{ padding: '0 var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}{u.department ? ` · ${u.department}` : ''}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <LevelPill level={u.level} />
            <span className={`badge ${meta.cls}`}>{meta.label}</span>
          </div>
        </div>

        {/* Reset password */}
        <div className="card ui-colonna fitta">
          <h2 style={{ margin: 0 }}>Password</h2>
          <button type="button" className="px-btn" style={{ alignSelf: 'flex-start' }} onClick={handleReset}>Reset password</button>
          {tempPwd && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--px-text)' }}>
              Nuova password temporanea: <strong>{tempPwd}</strong>
            </p>
          )}
        </div>

        {/* Il ruolo, e quindi i permessi */}
        <div className="card ui-colonna fitta">
          <h2 style={{ margin: 0 }}>Ruolo</h2>
          {u.role === 'admin' ? (
            <p style={{ margin: 0 }}>
              Gli admin hanno tutti i permessi e non passano dai ruoli.
              {eProprietario(u) ? ' Questo account è il proprietario dell’organizzazione.' : ''}
            </p>
          ) : (
            <>
              <label className="label" htmlFor="utente-ruolo">Che ruolo ha</label>
              <select
                id="utente-ruolo"
                name="utente-ruolo"
                value={ruolo?.id ?? ''}
                onChange={(e) => agisci(assegnaRuolo(me, u.id, e.target.value))}
              >
                {ruoli.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
              <p className="ui-dialog-hint" style={{ margin: 0 }}>
                {ruolo?.descrizione || 'Nessuna descrizione.'} · {ruolo?.permessi.length ?? 0} permessi.
              </p>
            </>
          )}
        </div>

        {/* I dipartimenti: dove atterra, e con chi si vede */}
        <div className="card ui-colonna fitta">
          <h2 style={{ margin: 0 }}>Dipartimenti</h2>
          {reparti.length === 0 ? (
            <p style={{ margin: 0 }}>Non ci sono ancora dipartimenti da assegnare.</p>
          ) : reparti.map((d) => (
            <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                type="checkbox"
                name={`dip-${d.id}`}
                checked={suoi.has(d.id)}
                onChange={() => cambiaReparto(d.id)}
                style={{ width: 'auto' }}
              />
              {d.nome}
            </label>
          ))}
          <p className="ui-dialog-hint" style={{ margin: 0 }}>
            Se ne può assegnare più d’uno: chi guida vede le persone dei propri reparti.
          </p>
        </div>

        {/* Admin e proprietà dell'organizzazione */}
        {!io && (
          <div className="card ui-colonna fitta">
            <h2 style={{ margin: 0 }}>Accesso da admin</h2>
            {u.role === 'admin' ? (
              <>
                <p style={{ margin: 0 }}>
                  {eProprietario(u)
                    ? 'È il proprietario: per togliergli l’accesso deve prima passare l’organizzazione a un altro admin.'
                    : 'È un co-admin: ha gli stessi identici permessi dell’admin.'}
                </p>
                {!eProprietario(u) && (
                  <Button variante="secondario" style={{ alignSelf: 'flex-start' }} onClick={() => agisci(revocaCoAdmin(me, u.id))}>
                    Togli l’accesso da admin
                  </Button>
                )}
                {eProprietario(me) && !eProprietario(u) && (
                  <Button variante="pericolo" style={{ alignSelf: 'flex-start' }} onClick={() => setDaPassare(true)}>
                    Passagli l’organizzazione
                  </Button>
                )}
              </>
            ) : (
              <>
                <p style={{ margin: 0 }}>
                  Un co-admin ha gli stessi identici permessi dell’admin. È anche il passaggio
                  obbligato per poter cedere l’organizzazione a qualcun altro.
                </p>
                <Button variante="secondario" style={{ alignSelf: 'flex-start' }} onClick={() => agisci(promuoviCoAdmin(me, u.id))}>
                  Rendi co-admin
                </Button>
              </>
            )}
          </div>
        )}

        {errore && <p style={{ color: 'var(--ui-alert-testo)', margin: 0 }}>{errore}</p>}

        {/* Eliminazione */}
        {u.role !== 'admin' && (
          <div className="card ui-colonna fitta">
            <h2 style={{ margin: 0 }}>Organizzazione</h2>
            <Button variante="pericolo" style={{ alignSelf: 'flex-start' }} onClick={() => setDaEliminare(true)}>
              Elimina dall&apos;organizzazione
            </Button>
          </div>
        )}
      </div>

      {daPassare && (
        <ConfirmDialog
          titolo={`Passare l’organizzazione a ${u.name}?`}
          testo="Diventa il proprietario. Tu resti admin, con tutti i permessi, ma la proprietà sarà sua: per riaverla dovrà ripassartela lui."
          conferma="Passa l’organizzazione"
          distruttiva
          onConferma={() => { agisci(trasferisciProprieta(me, u.id)); setDaPassare(false); }}
          onChiudi={() => setDaPassare(false)}
        />
      )}

      {daEliminare && (
        <ConfirmDialog
          titolo={`Togliere ${u.name} dall’organizzazione?`}
          testo="Non potrà più entrare qui dentro. Il suo account resta suo, con gli XP e i crediti: quello che ha ottenuto qui lo tiene solo se l’organizzazione aveva l’abbonamento. Le quest e le certificazioni restano nello storico."
          conferma="Togli dall’organizzazione"
          distruttiva
          onConferma={handleDelete}
          onChiudi={() => setDaEliminare(false)}
        />
      )}
      <BackTile />
    </>
  );
}
