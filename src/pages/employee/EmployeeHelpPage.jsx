import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Spot from '../../components/pubblicita/Spot';
import useSpot from '../../components/pubblicita/useSpot';
import Chips from '../../components/ui/Chips';
import QuestCard from '../../components/ui/QuestCard';
import ActionRow from '../../components/ui/ActionRow';
import { useAuth } from '../../context/AuthContext';
import {
  getUserById, getHelpRequestsForUser, getHelpRequestsByRequester,
  getQuestById, getAvailableQuestsByManager, updateQuest, addNotification, subscribe,
  accettaRichiestaAiuto,
} from '../../data/db';
import coopIcon from '../../assets/ui/coop.png';
import questIcon from '../../assets/ui/activeQuest.png';
import BackTile from '../../components/ui/BackTile';

const VISTE = [
  { id: 'aiuto',       label: 'Richieste' },
  { id: 'disponibili', label: 'Disponibili' },
  { id: 'mie',         label: 'Le mie' },
];

/**
 * Bacheca del team: le richieste di aiuto dei colleghi, le quest libere che
 * si possono prendere in carico e le richieste che ho mandato io.
 */
export default function EmployeeHelpPage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  const [vista, setVista] = useState('aiuto');
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  const me = getUserById(user.id) || user;
  const { spot, parti, chiudi } = useSpot(me.orgId);
  const incoming = getHelpRequestsForUser(me);
  const mine = getHelpRequestsByRequester(me.id);
  const available = me.managerId ? getAvailableQuestsByManager(me.managerId) : [];

  // Rispondere a una richiesta di aiuto: e' questa l'azione che il sistema
  // registra come aiuto dato, non l'essere stati indicati da chi chiedeva.
  function daiUnaMano(h) {
    const richiedente = getUserById(h.requesterId);
    accettaRichiestaAiuto(h.id, me.id);
    addNotification({
      userId: h.requesterId,
      kind: 'aiuto_accettato',
      text: `${me.name} ti dà una mano su "${getQuestById(h.questId)?.title ?? 'una quest'}"`,
      questId: h.questId,
    });
    if (!richiedente) return;
    setVersion((v) => v + 1);
  }

  function prendi(q) {
    updateQuest(q.id, { assigneeType: 'employee', assigneeId: me.id, accepted: true });
    addNotification({
      userId: q.createdById,
      kind: 'quest_presa',
      text: `${me.name} ha preso in carico "${q.title}"`,
      questId: q.id,
    });
    /* Anche prendersi una quest e' assegnarla, e sul piano gratuito fa
       partire lo spot. Qui il seguito e' solo ridisegnare la bacheca: si
       fa alla chiusura, cosi' la riga sparisce quando si torna a guardare
       e non alle spalle della pubblicita'. */
    parti(() => setVersion((v) => v + 1));
  }

  return (
    <>
      <PageShell
        title="Bacheca"
        description="Le richieste di aiuto del team, le quest che puoi prendere in carico e quelle per cui hai chiesto una mano."
      />

      <Chips items={VISTE} value={vista} onChange={setVista} ariaLabel="Cosa vedere" />

      <div className="ui-list">
        {vista === 'aiuto' && (
          incoming.length === 0
            ? <div className="empty-state ui-blocco">Nessuna richiesta di aiuto aperta.</div>
            : incoming.map((h) => {
                const q = getQuestById(h.questId);
                const da = getUserById(h.requesterId);
                if (!q) return null;
                const aiutante = h.helperId ? getUserById(h.helperId) : null;
                return (
                  <QuestCard key={h.id} quest={q} assignedBy={da?.name}>
                    <p className="ui-quest-desc" style={{ margin: 0, width: '100%' }}>
                      “{h.message}”
                    </p>
                    {h.acceptedAt
                      ? (
                        <div className="ui-action" style={{ pointerEvents: 'none' }}>
                          <img src={coopIcon} alt="" />
                          <span>{aiutante?.id === me.id ? 'Ci stai pensando tu' : `Ci pensa ${aiutante?.name ?? 'un collega'}`}</span>
                        </div>
                      )
                      : <ActionRow icon={coopIcon} label="Do una mano" tone="wide" onClick={() => daiUnaMano(h)} />}
                  </QuestCard>
                );
              })
        )}

        {vista === 'disponibili' && (
          available.length === 0
            ? <div className="empty-state ui-blocco">Nessuna quest libera al momento.</div>
            : available.map((q) => (
                <QuestCard key={q.id} quest={q}>
                  <ActionRow icon={questIcon} label="Prendi in carico" tone="wide" onClick={() => prendi(q)} />
                </QuestCard>
              ))
        )}

        {vista === 'mie' && (
          mine.length === 0
            ? <div className="empty-state ui-blocco">Non hai chiesto aiuto per nessuna quest.</div>
            : mine.map((h) => {
                const q = getQuestById(h.questId);
                if (!q) return null;
                const aiutante = h.helperId ? getUserById(h.helperId)?.name : 'Tutto il team';
                return (
                  <QuestCard key={h.id} quest={q}>
                    <div className="ui-action" style={{ pointerEvents: 'none' }}>
                      <img src={coopIcon} alt="" />
                      <span>{aiutante}</span>
                    </div>
                  </QuestCard>
                );
              })
        )}
      </div>
      <BackTile />
      {spot && <Spot reclame={spot.reclame} onChiudi={chiudi} />}
    </>
  );
}
