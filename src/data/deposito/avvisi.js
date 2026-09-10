/** Gli avvisi che arrivano nella casella, e quanto si tengono. */

import { db, ensureLavoro, ensureNotifications, save } from './nucleo';

/* ─── Notifiche / Messaggi ───────────────────────────────────
   Messaggi recapitati a un utente (es. "ti è stata proposta una quest").
   Guardia difensiva: i DB salvati prima di questa feature non hanno il campo. */

export const getNotificationsForUser = (userId) => {
  ensureNotifications();
  return db.notifications.filter((n) => n.userId === userId);
};

/**
 * Quanto c'e' da leggere, in tutto.
 *
 * Avvisi e messaggi insieme, perche' insieme stanno anche nella casella:
 * un pallino che ne conta solo meta' manda la gente a guardare e a non
 * trovare niente, e dopo due volte non ci va piu'.
 */
export const getUnreadCount = (userId) => {
  ensureLavoro();
  return getNotificationsForUser(userId).filter((n) => !n.read).length
    + db.messaggi.filter((m) => m.aId === userId && !m.letto).length;
};

let notifSeq = 0;
/* Quanto si tiene, e quante se ne tengono.
   Una casella che non butta mai niente cresce finche' il deposito non ce
   la fa piu', e il deposito qui e' cinque megabyte in tutto. Nessuno pero'
   scorre indietro di sei mesi in una lista di avvisi: quello che c'e'
   sotto le ultime cinquanta e' peso senza lettori. I due tagli sono
   diversi apposta — il tetto protegge da chi riceve tantissimo in poco
   tempo, i giorni da chi riceve poco per anni. */
export const TETTO_NOTIFICHE = 50;
export const GIORNI_NOTIFICHE = 90;

/** Il taglio si fa scrivendo, su quel solo utente: costa quanto la scrittura. */
function potaNotifiche(userId) {
  const limite = Date.now() - GIORNI_NOTIFICHE * 86400000;
  const sue = [];
  db.notifications = db.notifications.filter((n) => {
    if (n.userId !== userId) return true;
    if (new Date(n.createdAt).getTime() < limite) return false;
    sue.push(n);
    return sue.length <= TETTO_NOTIFICHE;
  });
}

export function addNotification(notification) {
  ensureNotifications();
  notifSeq += 1;
  const created = {
    id: `n-${Date.now()}-${notifSeq}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...notification,
  };
  db.notifications.unshift(created);
  potaNotifiche(created.userId);
  save();
  return created;
}

// Segna come lette tutte le notifiche di un utente (azzera il contatore).
export function markNotificationsRead(userId) {
  ensureNotifications();
  let changed = false;
  db.notifications.forEach((n) => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      changed = true;
    }
  });
  if (changed) save();
}

// Rimuove tutte le notifiche di un utente (svuota la sezione Messaggi).
export function clearNotificationsForUser(userId) {
  ensureNotifications();
  const before = db.notifications.length;
  db.notifications = db.notifications.filter((n) => n.userId !== userId);
  if (db.notifications.length !== before) save();
}
