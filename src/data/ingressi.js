/**
 * Entrare in un'organizzazione.
 *
 * Due strade, e servono tutte e due.
 *
 *   richiesta   qualcuno ha il codice e chiede di entrare; chi ha il
 *               permesso approva o rifiuta
 *   invito      l'organizzazione chiama una persona per nome — col suo
 *               numero Achivia o col suo indirizzo email — e quella accetta
 *
 * La prima regge il caso che la seconda non regge: una persona che
 * l'organizzazione non sa ancora nominare. Un nuovo assunto di cui non hai
 * l'indirizzo, un ragazzo che si presenta agli allenamenti. La seconda e'
 * piu' forte dove si sa gia' chi si vuole, ed e' l'unica che ha senso in un
 * gruppo piccolo: in una famiglia sai esattamente chi sono i cinque.
 *
 * In tutti e due i casi entrare richiede due volonta': quella di chi entra
 * e quella di chi c'e' gia'. Nessuna delle due da sola basta, e questa e'
 * tutta la differenza con il codice-lasciapassare di prima.
 *
 * La regola vale anche per i gruppi. Un gruppo di famiglia con la
 * burocrazia dell'approvazione e' pesante, ma e' anche il posto dove un
 * estraneo che entra fa piu' danno: la' dentro ci sono i compiti dei
 * ragazzini, non i verbali di una riunione.
 *
 * I permessi stanno qui e non nel deposito, come per gli achievement e le
 * competenze: il deposito tiene le righe, i domini sanno chi puo' toccarle.
 */

import {
  getUserById, getUserByEmail, getUserByAchiviaId, getUsersByOrg, getOrgSeats, getOrgByCode,
  membroDi, entraNellOrg, nomeOrgDi, orgChiusa, addNotification,
  apriRichiesta, apriInvito, chiudiIngresso, ingressoById, ingressoAperto,
  ingressiDiOrg, richiesteDiPersona, invitiPerPersona,
} from './db';
import { puoApprovareIngressi } from './permessi';
import { nomeVisibile, codiceVisibile } from './identita';

export { ingressiDiOrg, richiesteDiPersona, invitiPerPersona };

/** Chi, dentro un'organizzazione, riceve gli avvisi di chi bussa. */
const chiDecide = (orgId) => getUsersByOrg(orgId).filter(puoApprovareIngressi);

/* ─── Chiedere di entrare ────────────────────────────────── */

/**
 * Una persona chiede di entrare, con il codice.
 *
 * Il codice non fa entrare: dice a quale porta si sta bussando. Chi decide
 * riceve un avviso, e finche' non risponde la richiesta resta in attesa —
 * visibile a chi l'ha mandata, cosi' nessuno la rimanda dieci volte
 * pensando che non sia arrivata.
 */
export function chiediIngresso(persona, codice, messaggio = '') {
  if (!persona) return { errore: 'Devi aver fatto l’accesso.' };
  const trovata = getOrgByCode(codice);
  if (!trovata) return { errore: 'Codice non valido.' };
  if (membroDi(persona.id, trovata.orgId)) {
    return { errore: 'Fai già parte di questa organizzazione.' };
  }
  const gia = ingressoAperto(persona.id, trovata.orgId);
  if (gia) {
    return gia.verso === 'invito'
      ? { errore: 'Hai già un invito da questa organizzazione: accettalo da qui.' }
      : { errore: 'La tua richiesta è già in attesa di risposta.' };
  }

  /* I posti non si controllano adesso ma al momento di approvare: fra oggi
     e la risposta qualcuno puo' uscire, e rifiutare in partenza chi
     entrerebbe domani sarebbe una porta chiusa per un motivo che nel
     frattempo e' passato. */
  const richiesta = apriRichiesta({ userId: persona.id, orgId: trovata.orgId, messaggio });

  for (const chi of chiDecide(trovata.orgId)) {
    addNotification({
      userId: chi.id,
      kind: 'ingresso',
      text: `${nomeVisibile(persona)} ${codiceVisibile(persona)} chiede di entrare`,
      ingressoId: richiesta.id,
    });
  }
  return { richiesta, org: trovata.org };
}

/** Ritirare la propria richiesta: si puo' cambiare idea prima della risposta. */
export function ritiraRichiesta(persona, id) {
  const r = ingressoById(id);
  if (!r || r.userId !== persona?.id || r.verso !== 'richiesta') {
    return { errore: 'Richiesta non trovata.' };
  }
  chiudiIngresso(id, 'annullato', persona.id);
  return { ok: true };
}

/* ─── Invitare ───────────────────────────────────────────── */

/**
 * L'organizzazione chiama qualcuno.
 *
 * Si puo' indicare con il numero Achivia — ed e' la strada da preferire,
 * perche' non richiede di sapere l'indirizzo di nessuno — oppure con
 * l'email, che e' l'unica che funziona per chi un account ancora non ce
 * l'ha. In quel caso l'invito aspetta, e si attacca da solo a chi si
 * registrera' con quell'indirizzo.
 */
export function invitaInOrg(me, { achiviaId = '', email = '', ruolo = 'employee', messaggio = '' } = {}) {
  if (!me?.orgId) return { errore: 'Non sei dentro nessuna organizzazione.' };
  if (!puoApprovareIngressi(me)) return { errore: 'Non puoi invitare persone in questa organizzazione.' };
  if (orgChiusa(me.orgId)) return { errore: 'Questa organizzazione è chiusa.' };

  const numero = String(achiviaId || '').trim().replace(/^#/, '');
  const mail = String(email || '').trim().toLowerCase();
  if (!numero && !mail) return { errore: 'Serve un numero Achivia o un indirizzo email.' };

  // Il numero vince sull'email: identifica senza ambiguita', e non obbliga
  // nessuno a farsi dare l'indirizzo di qualcun altro.
  const persona = numero ? getUserByAchiviaId(numero) : (getUserByEmail(mail) || null);
  if (numero && !persona) return { errore: 'Nessun account con questo numero Achivia.' };

  if (persona) {
    if (persona.id === me.id) return { errore: 'Ci sei già.' };
    if (membroDi(persona.id, me.orgId)) return { errore: 'Fa già parte dell’organizzazione.' };
    const gia = ingressoAperto(persona.id, me.orgId);
    if (gia) {
      return gia.verso === 'richiesta'
        ? { errore: 'Ha già chiesto di entrare: approva la sua richiesta.' }
        : { errore: 'Questa persona è già stata invitata.' };
    }
  }

  const posti = getOrgSeats(me.orgId);
  if (posti.liberi <= 0) return { errore: 'Non ci sono più posti liberi.' };

  const invito = apriInvito({
    userId: persona?.id ?? null,
    email: persona ? null : mail,
    orgId: me.orgId,
    daId: me.id,
    ruolo,
    messaggio,
  });

  if (persona) {
    addNotification({
      userId: persona.id,
      kind: 'ingresso',
      text: `${nomeOrgDi(me.orgId) || 'Un’organizzazione'} ti ha invitato a entrare`,
      ingressoId: invito.id,
    });
  }
  return { invito, inAttesaDiRegistrazione: !persona };
}

/** Chi ha invitato puo' anche ritirare l'invito, finche' nessuno ha risposto. */
export function annullaInvito(me, id) {
  const r = ingressoById(id);
  if (!r || r.verso !== 'invito') return { errore: 'Invito non trovato.' };
  if (!puoApprovareIngressi(me) || me.orgId !== r.orgId) {
    return { errore: 'Non puoi ritirare questo invito.' };
  }
  chiudiIngresso(id, 'annullato', me.id);
  return { ok: true };
}

/* ─── Rispondere ─────────────────────────────────────────── */

/** Fa entrare davvero. E' l'unico punto in cui una riga diventa un ingresso. */
function faiEntrare(r) {
  const posti = getOrgSeats(r.orgId);
  if (posti.liberi <= 0) return { errore: 'Non ci sono più posti liberi.' };
  entraNellOrg(r.userId, r.orgId, { role: r.ruolo || 'employee' });
  return { ok: true };
}

/** Chi decide approva una richiesta. */
export function approvaIngresso(me, id) {
  const r = ingressoById(id);
  if (!r || r.verso !== 'richiesta' || r.stato !== 'in_attesa') {
    return { errore: 'Richiesta non trovata.' };
  }
  if (!puoApprovareIngressi(me) || me.orgId !== r.orgId) {
    return { errore: 'Non puoi decidere gli ingressi di questa organizzazione.' };
  }
  const esito = faiEntrare(r);
  if (esito.errore) return esito;

  chiudiIngresso(id, 'accettato', me.id);
  addNotification({
    userId: r.userId,
    kind: 'ingresso',
    text: `Sei dentro: ${nomeOrgDi(r.orgId) || 'l’organizzazione'} ha accettato la tua richiesta`,
  });
  return { ok: true };
}

/**
 * Chi decide rifiuta. Non si dice perche': una motivazione obbligatoria
 * diventa una bugia gentile, e chi rifiuta non deve niente a chi ha bussato.
 */
export function rifiutaIngresso(me, id) {
  const r = ingressoById(id);
  if (!r || r.verso !== 'richiesta' || r.stato !== 'in_attesa') {
    return { errore: 'Richiesta non trovata.' };
  }
  if (!puoApprovareIngressi(me) || me.orgId !== r.orgId) {
    return { errore: 'Non puoi decidere gli ingressi di questa organizzazione.' };
  }
  chiudiIngresso(id, 'rifiutato', me.id);
  addNotification({
    userId: r.userId,
    kind: 'ingresso',
    text: `${nomeOrgDi(r.orgId) || 'L’organizzazione'} non ha accettato la tua richiesta`,
  });
  return { ok: true };
}

/** La persona invitata accetta. */
export function accettaInvito(persona, id) {
  const r = ingressoById(id);
  if (!r || r.verso !== 'invito' || r.stato !== 'in_attesa' || r.userId !== persona?.id) {
    return { errore: 'Invito non trovato.' };
  }
  if (orgChiusa(r.orgId)) return { errore: 'Questa organizzazione è chiusa.' };
  const esito = faiEntrare(r);
  if (esito.errore) return esito;

  chiudiIngresso(id, 'accettato', persona.id);
  if (r.daId) {
    addNotification({
      userId: r.daId,
      kind: 'ingresso',
      text: `${nomeVisibile(persona)} ha accettato l’invito`,
    });
  }
  return { ok: true, orgId: r.orgId };
}

/** O rifiuta. Chi ha invitato lo viene a sapere: aspettava una risposta. */
export function rifiutaInvito(persona, id) {
  const r = ingressoById(id);
  if (!r || r.verso !== 'invito' || r.stato !== 'in_attesa' || r.userId !== persona?.id) {
    return { errore: 'Invito non trovato.' };
  }
  chiudiIngresso(id, 'rifiutato', persona.id);
  if (r.daId) {
    addNotification({
      userId: r.daId,
      kind: 'ingresso',
      text: `${nomeVisibile(persona)} non ha accettato l’invito`,
    });
  }
  return { ok: true };
}

/** Quante decisioni aspettano: serve alla pastiglia sul riquadro dell'admin. */
export const quantiIngressiInAttesa = (orgId) =>
  ingressiDiOrg(orgId).filter((r) => r.verso === 'richiesta').length;

/** Come si legge una riga della coda, senza far uscire quello che non serve. */
export function rigaIngresso(r) {
  const persona = r.userId ? getUserById(r.userId) : null;
  return {
    id: r.id,
    verso: r.verso,
    quando: r.creatoIl,
    messaggio: r.messaggio || '',
    ruolo: r.ruolo,
    // Di chi bussa si vede come si presenta e il suo numero, che e' l'unica
    // cosa che identifica senza ambiguita'. Il resto — dove lavora, in che
    // altre organizzazioni sta — non esce di qui e non esce da nessuna
    // parte.
    chi: persona ? nomeVisibile(persona) : (r.email || '—'),
    numero: persona ? codiceVisibile(persona) : '',
    inAttesaDiRegistrazione: r.verso === 'invito' && !r.userId,
  };
}
