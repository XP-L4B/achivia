import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import { XpPill, CreditsPill } from '../../components/ui/Pills';
import { useAuth } from '../../context/AuthContext';
import BackTile from '../../components/ui/BackTile';
import {
  getQuestsToApproveByManager, getAssigneeLabel, getHelpRequestForQuest,
  getUserById, approveQuest, updateQuest, addNotification, subscribe, xpDiQuest,
} from '../../data/db';
import { puo } from '../../data/permessi';
import { assegnaExtraMile, puoAssegnareExtraMile } from '../../data/achievements';
import { achievementById } from '../../data/achievementsCatalog';
import useFinestra from '../../hooks/useFinestra';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function QuestApprovePage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  // Quest che si sta approvando, con il commento in scrittura.
  const [approvando, setApprovando] = useState(null);
  const [feedback, setFeedback] = useState('');
  // "Go the Extra Mile" si assegna qui e solo qui: e' il momento in cui il
  // manager sta guardando il lavoro consegnato, l'unico in cui puo' dire se
  // e' andato ben oltre quanto chiesto.
  const [extraMile, setExtraMile] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errore, setErrore] = useState('');
  const [daRifiutare, setDaRifiutare] = useState(null);
  const finestra = useFinestra(Boolean(approvando), () => chiudiApprovazione());
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  const quests = getQuestsToApproveByManager(user.id);

  // L'approvazione passa da una finestra invece che da un confirm: e' il
  // momento in cui il manager puo' lasciare due righe di commento al lavoro.
  const extraMileDef = achievementById('extra-mile');

  function chiudiApprovazione() {
    setApprovando(null);
    setFeedback('');
    setExtraMile(false);
    setMotivo('');
    setErrore('');
  }

  function confermaApprovazione() {
    const q = approvando;
    if (!puo(getUserById(user.id) || user, 'quest.approve')) {
      setErrore('Non hai il permesso di approvare le quest.');
      return;
    }
    const testo = feedback.trim();
    const destinatario = q.assigneeId ? getUserById(q.assigneeId) : null;

    if (extraMile) {
      if (!motivo.trim()) { setErrore('La motivazione dell’achievement è obbligatoria.'); return; }
      if (!puoAssegnareExtraMile(getUserById(user.id) || user, destinatario)) {
        setErrore('Non puoi assegnare questo achievement a questa persona.');
        return;
      }
    }

    approveQuest(q.id, { text: testo, byId: user.id });

    if (extraMile && destinatario) {
      const esito = assegnaExtraMile({
        employeeId: destinatario.id, byId: user.id, motivo, questId: q.id,
      });
      if (esito.errore) { setErrore(esito.errore); return; }
    }
    if (q.assigneeId) {
      addNotification({
        userId: q.assigneeId,
        kind: 'quest_approvata',
        text: testo
          ? `La quest "${q.title}" e’ stata approvata, con un feedback`
          : `La quest "${q.title}" e’ stata approvata`,
        questId: q.id,
      });
    }
    chiudiApprovazione();
    setVersion((v) => v + 1);
  }

  function reject() {
    const q = daRifiutare;
    if (!puo(getUserById(user.id) || user, 'quest.reject')) {
      setDaRifiutare(null);
      return;
    }
    updateQuest(q.id, { status: 'in_corso' });
    if (q.assigneeId) {
      addNotification({ userId: q.assigneeId, kind: 'quest_rifiutata', text: `Il completamento di "${q.title}" non e’ stato approvato`, questId: q.id });
    }
    setDaRifiutare(null);
    setVersion((v) => v + 1);
  }

  return (
    <>
      <PageShell title="Approvazione Quest" description="Quest segnalate come completate dai dipendenti." />
      <div className="ui-corpo-pagina">
        {quests.length === 0 ? (
          <div className="empty-state">Nessuna quest da approvare.</div>
        ) : (
          <div className="ui-colonna">
            {quests.map((q) => {
              const help = getHelpRequestForQuest(q.id);
              const helper = help ? getUserById(help.helperId) : null;
              return (
                <div key={q.id} className="px-panel">
                  <b>{q.title}</b>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', margin: 'var(--space-3) 0' }}>
                    <XpPill value={xpDiQuest(q)} />
                    <CreditsPill value={q.credits || 0} />
                    <span className="badge badge-neutral">{getAssigneeLabel(q)}</span>
                    {helper && <span className="badge badge-primary">aiutante: {helper.name}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <button type="button" className="confirm-pill" onClick={() => { chiudiApprovazione(); setApprovando(q); }}>Conferma</button>
                    <button type="button" className="cancel-pill" onClick={() => setDaRifiutare(q)}>Rifiuta</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {approvando && (
        <div className="ui-overlay" role="dialog" aria-modal="true">
          <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog is-stretta">
            <b>Approva “{approvando.title}”</b>
            <p style={{ fontSize: '0.55rem', margin: 'var(--space-2) 0', lineHeight: 1.8 }}>
              Puoi lasciare un feedback: lo trovera’ aprendo la quest fra quelle concluse.
            </p>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Feedback (facoltativo)"
              className="ui-campo-pixel"
            />
            {approvando.assigneeId && (
              <fieldset className="skill-fieldset">
                <legend>Achievement</legend>
                <label className="skill-radio">
                  <input
                    type="checkbox"
                    checked={extraMile}
                    onChange={(e) => { setExtraMile(e.target.checked); setErrore(''); }}
                    style={{ width: 'auto' }}
                  />
                  Assegna “{extraMileDef.nome}”
                </label>
                {extraMile && (
                  <>
                    <p className="ui-dialog-hint">
                      Premia un lavoro fatto ben oltre quanto la quest chiedeva.
                      Si assegna solo qui, verificando il lavoro, e una volta
                      per quest; la motivazione è obbligatoria e resta nello
                      storico insieme al tuo nome.
                    </p>
                    <textarea
                      rows={3}
                      value={motivo}
                      onChange={(e) => { setMotivo(e.target.value); setErrore(''); }}
                      placeholder="Che cosa ha fatto oltre a quanto chiesto"
                      className="ui-campo-pixel"
                    />
                  </>
                )}
              </fieldset>
            )}

            {errore && <p className="ui-errore" role="alert">{errore}</p>}

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <button type="button" className="confirm-pill" onClick={confermaApprovazione}>Approva</button>
              <button type="button" className="cancel-pill" onClick={chiudiApprovazione}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {daRifiutare && (
        <ConfirmDialog
          titolo={`Rifiutare "${daRifiutare.title}"?`}
          testo="La quest torna in corso e chi ce l’aveva potrà segnalarla di nuovo come completata. Nessuna ricompensa viene accreditata."
          conferma="Rifiuta"
          distruttiva
          onConferma={reject}
          onChiudi={() => setDaRifiutare(null)}
        />
      )}
      <BackTile />
    </>
  );
}

