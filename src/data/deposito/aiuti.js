/** Le richieste d'aiuto sulla bacheca. */

import { annuncia, db, ensureHelpRequests, save } from './nucleo';
import { membroDi } from './membri';

/* ─── Richieste di aiuto ─────────────────────────────────────
   Un dipendente chiede aiuto su una quest. Con un destinatario (helperId)
   è una richiesta diretta; senza, è aperta a tutto il team. */

let helpSeq = 0;
export function addHelpRequest(req) {
  ensureHelpRequests();
  helpSeq += 1;
  const created = {
    id: `h-${Date.now()}-${helpSeq}`,
    createdAt: new Date().toISOString(),
    helperId: null,
    ...req,
  };
  db.helpRequests.unshift(created);
  save();
  return created;
}

/**
 * Un collega risponde a una richiesta di aiuto.
 *
 * Finora l'aiutante poteva solo essere indicato da chi chiedeva: era una
 * proposta, non un aiuto dato. Questa e' l'azione esplicita — la persona
 * dice "ci penso io" — ed e' l'unica che il sistema registra come aiuto.
 * Vale una volta sola per richiesta: la seconda non cambia nulla.
 */
export function accettaRichiestaAiuto(id, helperId) {
  ensureHelpRequests();
  const h = db.helpRequests.find((x) => x.id === id);
  if (!h || h.acceptedAt) return h || null;
  if (h.requesterId === helperId) return h;      // aiutarsi da soli non conta
  h.helperId = helperId;
  h.acceptedAt = new Date().toISOString();
  save();
  annuncia({ tipo: 'AiutoDato', helpRequestId: h.id, userId: helperId });
  return h;
}

// Richieste di aiuto inviate da un utente (per "Le mie conversazioni").
export const getHelpRequestsByRequester = (userId) => {
  ensureHelpRequests();
  return db.helpRequests.filter((h) => h.requesterId === userId);
};

// Richiesta di aiuto con aiutante assegnato per una quest (per la ripartizione crediti).
export const getHelpRequestForQuest = (questId) => {
  ensureHelpRequests();
  return db.helpRequests.find((h) => h.questId === questId && h.helperId) || null;
};

// Richieste di aiuto in cui un utente è stato scelto come aiutante.
export const getHelpRequestsByHelper = (userId) => {
  ensureHelpRequests();
  return db.helpRequests.filter((h) => h.helperId === userId);
};

// Richieste di aiuto visibili a un utente: quelle dirette a lui (helperId)
// più quelle aperte del suo team (stessa organizzazione), escluse le proprie.
export const getHelpRequestsForUser = (user) => {
  ensureHelpRequests();
  return db.helpRequests.filter((h) => {
    if (h.requesterId === user.id) return false;
    if (h.helperId) return h.helperId === user.id;
    /* Collega vuol dire "sta nella mia organizzazione", non "in questo
       momento sta guardando la mia organizzazione": chi ha aperto un altro
       canale resta un collega, e la sua richiesta di aiuto va vista. */
    return Boolean(user.orgId) && Boolean(membroDi(h.requesterId, user.orgId));
  });
};
