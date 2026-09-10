/**
 * Chi chiede di entrare, e chi viene chiamato.
 *
 * Il codice di un'organizzazione era un lasciapassare: chi ce l'aveva era
 * dentro. Girava in un gruppo di messaggi, veniva inoltrato, fotografato —
 * e una volta uscito non si poteva ritirare senza cambiarlo a tutti quelli
 * a cui era stato dato davvero.
 *
 * Adesso il codice e' un *indirizzo*: dice quale organizzazione, non che ci
 * si puo' entrare. Puo' girare quanto vuole, perche' da solo non vale
 * niente. A far entrare qualcuno e' sempre una persona di dentro.
 *
 * Le due direzioni stanno nello stesso registro, e non e' un risparmio: e'
 * che sono la stessa cosa guardata dai due lati. Una richiesta e' "qualcuno
 * chiede di entrare", un invito e' "l'organizzazione chiede a qualcuno di
 * entrare"; tutte e due finiscono con una persona dentro e un'altra che ha
 * detto di si'.
 *
 * L'invito si puo' mandare a un numero Achivia o a un indirizzo email. La
 * seconda strada non e' una comodita': senza, un'organizzazione non
 * potrebbe far entrare nessuno che non abbia gia' un account — e chi arriva
 * da fuori resterebbe fuori per sempre. L'invito a un'email aspetta li', e
 * chi si registra con quell'indirizzo se lo trova.
 *
 * Qui non ci sono permessi: questo file tiene le righe. Chi puo' invitare e
 * chi puo' approvare lo decide `src/data/ingressi.js`, che conosce i ruoli.
 */

import { db, ensureIngressi, nuovoId, save } from './nucleo';

export function getIngressi() {
  ensureIngressi();
  return db.ingressi;
}

const inAttesa = () => getIngressi().filter((r) => r.stato === 'in_attesa');

export const ingressoById = (id) => getIngressi().find((r) => r.id === id) || null;

/** La coda di un'organizzazione: richieste ricevute e inviti mandati. */
export const ingressiDiOrg = (orgId, stato = 'in_attesa') => getIngressi()
  .filter((r) => r.orgId === orgId && (!stato || r.stato === stato))
  .sort((a, b) => String(b.creatoIl).localeCompare(String(a.creatoIl)));

/** Le richieste che una persona ha mandato e che aspettano una risposta. */
export const richiesteDiPersona = (userId) =>
  inAttesa().filter((r) => r.verso === 'richiesta' && r.userId === userId);

/** Gli inviti che una persona ha ricevuto e non ha ancora deciso. */
export const invitiPerPersona = (userId) =>
  inAttesa().filter((r) => r.verso === 'invito' && r.userId === userId);

/** C'e' gia' qualcosa in ballo fra questa persona e questa organizzazione? */
export const ingressoAperto = (userId, orgId) =>
  inAttesa().find((r) => r.userId === userId && r.orgId === orgId) || null;

/* ─── Scrivere ───────────────────────────────────────────── */

function nuovo(riga) {
  ensureIngressi();
  const creato = {
    id: nuovoId('ing'),
    stato: 'in_attesa',
    creatoIl: new Date().toISOString(),
    decisoIl: null,
    decisoDaId: null,
    ...riga,
  };
  db.ingressi.push(creato);
  save();
  return creato;
}

export const apriRichiesta = ({ userId, orgId, messaggio = '' }) => nuovo({
  verso: 'richiesta',
  userId,
  orgId,
  email: null,
  // Chi chiede entra da membro. Il ruolo lo decide l'organizzazione dopo:
  // non e' chi bussa a dire con che titolo entra.
  ruolo: 'employee',
  daId: null,
  messaggio: String(messaggio || '').trim(),
});

export const apriInvito = ({ userId = null, email = null, orgId, daId, ruolo = 'employee', messaggio = '' }) => nuovo({
  verso: 'invito',
  userId,
  orgId,
  email: email ? String(email).trim().toLowerCase() : null,
  ruolo,
  daId,
  messaggio: String(messaggio || '').trim(),
});

/** Chiude una riga con l'esito che ha avuto, e da chi. */
export function chiudiIngresso(id, stato, daId = null) {
  const r = ingressoById(id);
  if (!r || r.stato !== 'in_attesa') return null;
  r.stato = stato;
  r.decisoIl = new Date().toISOString();
  r.decisoDaId = daId;
  save();
  return r;
}

/**
 * Gli inviti mandati a un indirizzo email prima che quella persona avesse
 * un account: adesso ce l'ha, e diventano suoi.
 *
 * Si chiama alla registrazione. Senza, un invito mandato a chi non era
 * ancora su Achivia resterebbe li' per sempre a nome di nessuno — e
 * l'unica strada per far entrare qualcuno da fuori sarebbe chiusa.
 */
export function collegaInvitiA(persona) {
  ensureIngressi();
  const mail = String(persona?.email || '').trim().toLowerCase();
  if (!mail) return [];
  const suoi = db.ingressi.filter(
    (r) => r.verso === 'invito' && !r.userId && r.email === mail && r.stato === 'in_attesa'
  );
  for (const r of suoi) r.userId = persona.id;
  if (suoi.length) save();
  return suoi;
}
