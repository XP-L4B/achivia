import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import { useAuth } from '../../context/AuthContext';
import { getEmployeesOfManager, getHelpRequestsByRequester, getQuestById, getUserById, subscribe } from '../../data/db';
import BackTile from '../../components/ui/BackTile';
import useFinestra from '../../hooks/useFinestra';

export default function HelpRequestsPage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  const [open, setOpen] = useState(null);
  const finestra = useFinestra(Boolean(open), () => setOpen(null));
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  const rows = getEmployeesOfManager(user.id)
    .map((e) => ({ employee: e, requests: getHelpRequestsByRequester(e.id) }))
    .filter((r) => r.requests.length > 0);

  return (
    <>
      <PageShell title="Help Requests" description="Le richieste di aiuto aperte dai tuoi dipendenti." />
      <div className="ui-corpo-pagina">
        {rows.length === 0 ? (
          <div className="empty-state">Nessuna richiesta di aiuto.</div>
        ) : (
          <div className="ui-colonna">
            {rows.map(({ employee, requests }) => (
              <div key={employee.id} className="px-panel">
                <b>{employee.name}</b>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                  {requests.map((h) => {
                    const q = getQuestById(h.questId);
                    const helper = h.helperId ? getUserById(h.helperId) : null;
                    return (
                      <button key={h.id} type="button" className="card-row" style={{ cursor: 'pointer', textAlign: 'left' }} onClick={() => setOpen({ h, q, helper, employee })}>
                        <span>{q?.title || 'Quest rimossa'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="ui-overlay" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog is-stretta" onClick={(e) => e.stopPropagation()}>
            <b>{open.q?.title || 'Quest'}</b>
            <p style={{ fontSize: '0.6rem', lineHeight: 1.8, margin: 'var(--space-3) 0' }}>{open.h.message || 'Nessun messaggio.'}</p>
            <dl className="info-list">
              <div className="info-row"><dt>Richiedente</dt><dd>{open.employee.name}</dd></div>
              <div className="info-row"><dt>Aiutante</dt><dd>{open.helper ? open.helper.name : 'Tutto il team'}</dd></div>
            </dl>
            <button type="button" className="px-btn block" style={{ marginTop: 'var(--space-4)' }} onClick={() => setOpen(null)}>Chiudi</button>
          </div>
        </div>
      )}
      <BackTile />
    </>
  );
}

