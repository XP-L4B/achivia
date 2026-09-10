import { useEffect, useRef, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import QuestCard from '../../components/ui/QuestCard';
import ActionRow from '../../components/ui/ActionRow';
import checkIcon from '../../assets/ui/check.png';
import crossIcon from '../../assets/ui/cross.png';
import coopIcon from '../../assets/ui/coop.png';
import { useAuth } from '../../context/AuthContext';
import BackTile from '../../components/ui/BackTile';
import useFinestra from '../../hooks/useFinestra';
import {
  getQuestsForEmployee, getUserById, updateQuest, addNotification,
  addHelpRequest, getHelpRequestForQuest, getOrgColleagues, subscribe, completeQuest,
  xpDiQuest,
} from '../../data/db';

/** Quanto resta in vista il riquadro di una quest appena conclusa. */
const TEMPO_CONFERMA = 1100;

export default function MyQuestsPage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [helping, setHelping] = useState(null);
  // Quest conclusa aperta per vederne i dettagli e il feedback del manager.
  const [aperta, setAperta] = useState(null);
  const [helpMsg, setHelpMsg] = useState('');
  const [helperId, setHelperId] = useState('');
  const [tab, setTab] = useState('accettare');
  // La quest appena segnata come fatta: resta al suo posto giusto il tempo
  // della conferma, poi passa fra le concluse come ha sempre fatto.
  const [conclusaOra, setConclusaOra] = useState(null);
  // Il confronto passa sempre di qui: le quest di esempio non hanno un
  // identificativo, e senza questo controllo `undefined === undefined`
  // accenderebbe tutte quelle senza id insieme.
  const appenaConclusa = (q) => conclusaOra != null && q.id === conclusaOra;
  const rilascio = useRef(null);
  // Ognuna delle tre finestre di questa pagina si chiude con Esc e si tiene
  // dentro il giro del Tab.
  const finestraRifiuto = useFinestra(Boolean(rejecting), () => setRejecting(null));
  const finestraDettaglio = useFinestra(Boolean(aperta), () => setAperta(null));
  const finestraAiuto = useFinestra(Boolean(helping), () => setHelping(null));

  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);
  // Se si lascia la pagina prima che la conferma sia finita, il tempo si
  // ferma con lei.
  useEffect(() => () => clearTimeout(rilascio.current), []);
  const bump = () => setVersion((v) => v + 1);

  const me = getUserById(user.id) || user;
  const quests = getQuestsForEmployee(me).filter((q) => q.status !== 'template');

  function accept(q) {
    updateQuest(q.id, { accepted: true, rejected: false });
    bump();
  }

  function confirmReject() {
    if (!reason.trim()) return;
    updateQuest(rejecting.id, { rejected: true, rejectReason: reason.trim() });
    addNotification({ userId: rejecting.createdById, kind: 'quest_rifiutata', text: `${me.name} ha rifiutato "${rejecting.title}": ${reason.trim()}`, questId: rejecting.id });
    setRejecting(null);
    setReason('');
    bump();
  }

  // Come e' finita una quest conclusa, in una riga.
  function esito(q) {
    if (q.rejected) return `Rifiutata: ${q.rejectReason || 'nessuna motivazione'}`;
    if (q.status === 'da_approvare') return 'In attesa di approvazione dal manager.';
    if (q.status === 'scaduta') return 'Scaduta senza completamento.';
    return 'Approvata: ricompensa accreditata.';
  }

  // Nome di chi e' stato chiamato in aiuto su una quest, se qualcuno c'e'.
  function aiutoAperto(q) {
    const help = getHelpRequestForQuest(q.id);
    if (!help) return null;
    return help.helperId ? (getUserById(help.helperId)?.name ?? 'un collega') : 'tutto il team';
  }

  function complete(q) {
    // La puntualita' la decide il database sulla data di consegna: e' un
    // fatto della quest, non della schermata che la chiude.
    completeQuest(q.id, me.id);
    addNotification({ userId: q.createdById, kind: 'quest_completata', text: `${me.name} ha completato "${q.title}"`, questId: q.id });
    // Il dato e' gia' cambiato: quello che resta indietro e' solo il
    // riquadro, per il tempo della conferma. Un secondo scarso, non di piu'.
    setConclusaOra(q.id ?? null);
    clearTimeout(rilascio.current);
    rilascio.current = setTimeout(() => setConclusaOra(null), TEMPO_CONFERMA);
    bump();
  }

  function sendHelp() {
    addHelpRequest({
      questId: helping.id,
      requesterId: me.id,
      helperId: helperId || null,
      message: helpMsg.trim(),
    });
    if (helperId) {
      addNotification({ userId: helperId, kind: 'aiuto_richiesto', text: `L’utente ${me.name} necessita di supporto`, questId: helping.id });
    }
    setHelping(null);
    setHelpMsg('');
    setHelperId('');
    bump();
  }

  // Le tre viste dei mockup: quest da accettare, quelle in corso, quelle chiuse.
  const gruppi = {
    accettare: quests.filter((q) => !q.accepted && !q.rejected && q.status === 'in_corso'),
    corso:     quests.filter((q) => (q.accepted && q.status === 'in_corso') || appenaConclusa(q)),
    concluse:  quests.filter((q) => (q.status !== 'in_corso' || q.rejected) && !appenaConclusa(q)),
  };
  const elenco = gruppi[tab];

  const TABS = [
    { id: 'accettare', label: `Da accettare${gruppi.accettare.length ? ` (${gruppi.accettare.length})` : ''}` },
    { id: 'corso',     label: 'In corso' },
    { id: 'concluse',  label: 'Concluse' },
  ];

  const VUOTO = {
    accettare: 'Nessuna quest in attesa di risposta.',
    corso:     'Nessuna quest in corso. Guarda la Bacheca Team in Help.',
    concluse:  'Nessuna quest conclusa.',
  };

  return (
    <>
      <PageShell
        title="Le mie quest"
        description="Le quest che ti sono state assegnate: accetta quelle nuove, porta avanti quelle in corso e segnala quando hai finito."
      />

      <Chips items={TABS} value={tab} onChange={setTab} ariaLabel="Filtra le quest" />

      <div className="ui-list">
        {elenco.length === 0 ? (
          <div className="empty-state ui-blocco">{VUOTO[tab]}</div>
        ) : (
          elenco.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              assignedBy={q.createdByName}
              perId={user.id}
              conclusa={appenaConclusa(q)}
              onOpen={tab === 'concluse' ? () => setAperta(q) : undefined}
            >
              {tab === 'accettare' && (
                <>
                  <ActionRow icon={checkIcon} label="Accetta" onClick={() => accept(q)} />
                  <ActionRow icon={crossIcon} label="Rifiuta" onClick={() => setRejecting(q)} />
                </>
              )}
              {tab === 'corso' && (
                <>
                  <ActionRow icon={checkIcon} label="Completata" onClick={() => complete(q)} />
                  <ActionRow icon={coopIcon} label="Chiedi aiuto" onClick={() => setHelping(q)} />
                  {/* La richiesta di aiuto non sposta la quest: resta qui fra
                      quelle in corso, con l'aiuto segnalato sopra. */}
                  {aiutoAperto(q) && (
                    <p className="ui-quest-by" style={{ margin: 0, width: '100%' }}>
                      Aiuto richiesto a {aiutoAperto(q)}.
                    </p>
                  )}
                </>
              )}
              {tab === 'concluse' && (
                <p className="ui-quest-by" style={{ margin: 0 }}>
                  {esito(q)}{q.feedback ? ' — c’è un feedback: apri la quest.' : ''}
                </p>
              )}
            </QuestCard>
          ))
        )}
      </div>

      {rejecting && (
        <div className="ui-overlay" role="dialog" aria-modal="true">
          <div ref={finestraRifiuto} tabIndex={-1} className="px-panel ui-dialog is-stretta">
            <b>Rifiuta “{rejecting.title}”</b>
            <p style={{ fontSize: '0.55rem', margin: 'var(--space-2) 0', lineHeight: 1.8 }}>La motivazione e’ obbligatoria.</p>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo del rifiuto" className="ui-campo-pixel" />
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <button type="button" className="confirm-pill" onClick={confirmReject}>Invia</button>
              <button type="button" className="cancel-pill" onClick={() => { setRejecting(null); setReason(''); }}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      <BackTile />

      {aperta && (
        <div className="ui-overlay" role="dialog" aria-modal="true" onClick={() => setAperta(null)}>
          <div ref={finestraDettaglio} tabIndex={-1} className="px-panel ui-dialog" onClick={(e) => e.stopPropagation()}>
            <b>{aperta.title}</b>
            {aperta.description && (
              <p style={{ fontSize: '0.6rem', lineHeight: 1.8, margin: 'var(--space-3) 0' }}>{aperta.description}</p>
            )}
            <dl className="info-list">
              <div className="info-row"><dt>Esito</dt><dd>{esito(aperta)}</dd></div>
              <div className="info-row"><dt>Ricompensa</dt><dd>{xpDiQuest(aperta)} XP · {aperta.credits || 0} crediti</dd></div>
              {aperta.deadline && (
                <div className="info-row">
                  <dt>Scadenza</dt><dd>{new Date(aperta.deadline).toLocaleDateString('it-IT')}</dd>
                </div>
              )}
              {aperta.approvedAt && (
                <div className="info-row">
                  <dt>Approvata il</dt><dd>{new Date(aperta.approvedAt).toLocaleDateString('it-IT')}</dd>
                </div>
              )}
            </dl>

            <p className="ui-ai-title" style={{ margin: 'var(--space-4) 0 var(--space-2)' }}>Feedback del manager</p>
            {aperta.feedback ? (
              <>
                <p style={{ fontSize: '0.6rem', lineHeight: 1.8, margin: 0 }}>{aperta.feedback.text}</p>
                <p style={{ fontSize: '0.55rem', color: 'var(--ui-dim)', marginTop: 'var(--space-2)' }}>
                  {getUserById(aperta.feedback.byId)?.name || 'Il manager'}
                  {aperta.feedback.at ? ` · ${new Date(aperta.feedback.at).toLocaleDateString('it-IT')}` : ''}
                </p>
              </>
            ) : (
              <p style={{ fontSize: '0.6rem', color: 'var(--ui-dim)', margin: 0 }}>
                Il manager non ha lasciato un commento su questa quest.
              </p>
            )}

            <button type="button" className="px-btn block" style={{ marginTop: 'var(--space-4)' }} onClick={() => setAperta(null)}>
              Chiudi
            </button>
          </div>
        </div>
      )}

      {helping && (
        <div className="ui-overlay" role="dialog" aria-modal="true">
          <div ref={finestraAiuto} tabIndex={-1} className="px-panel ui-dialog is-stretta">
            <b>Richiedi aiuto</b>
            <textarea rows={3} value={helpMsg} onChange={(e) => setHelpMsg(e.target.value)} placeholder="Che aiuto ti serve?" style={{ width: '100%', margin: 'var(--space-3) 0', fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', lineHeight: 1.6 }} />
            <div className="px-filters ui-colonna fitta">
              <label className="label">Aiutante (facoltativo)</label>
              <select value={helperId} onChange={(e) => setHelperId(e.target.value)}>
                <option value="">Tutto il team</option>
                {getOrgColleagues(me.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <button type="button" className="confirm-pill" onClick={sendHelp}>Invia</button>
              <button type="button" className="cancel-pill" onClick={() => setHelping(null)}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

