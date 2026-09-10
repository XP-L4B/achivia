/**
 * Chi sta dentro quale organizzazione, e con che ruolo.
 *
 * Prima era un campo sulla persona: `orgId`, `role`, `roleId`,
 * `departmentIds` scritti sul record dell'utente. Un campo pero' non
 * contiene due valori, e una persona puo' stare in piu' organizzazioni —
 * un'azienda di giorno, la squadra di calcio la sera, la classe di suo
 * figlio. Ognuna e' un canale, si sceglie all'accesso, e dentro ognuna si
 * ha un ruolo diverso: dipendente di la', allenatore di qua.
 *
 * Quindi l'appartenenza diventa una riga a se'. Sul record della persona
 * restano le cose che sono davvero sue e valgono ovunque — il nome, il
 * numero Achivia, gli XP, i crediti — piu' la *proiezione* del canale
 * aperto in questo momento: `orgId`, `role`, `roleId`, `departmentIds`.
 *
 * Quella proiezione non e' un residuo da togliere piu' avanti: e' quello
 * che tiene in piedi le settanta schermate che chiedono `me.orgId` e
 * `me.role`. Chiedono "dove sono adesso", ed e' esattamente quello che la
 * proiezione risponde. L'alternativa era passare l'organizzazione attiva a
 * mano attraverso ogni componente dell'app.
 *
 * Una regola vale sopra tutte: da qui non esce mai l'elenco delle
 * organizzazioni di qualcun altro. Si puo' chiedere chi c'e' dentro
 * un'organizzazione, e si puo' chiedere dove si sta di persona. Chiedere
 * dove sta un altro non si puo', e non perche' una schermata si trattenga:
 * perche' la funzione non esiste.
 */

import { db, ensureMembri, nuovoId, save } from './nucleo';
import { orgPersonalizzata } from './organizzazioni';
import { nomePubblico } from '../identita';

export function getMembri() {
  ensureMembri();
  return db.membri;
}

/** Le appartenenze ancora aperte: quelle da cui non si e' usciti. */
const attive = () => getMembri().filter((m) => !m.uscitoIl);

/** L'appartenenza aperta di una persona in un'organizzazione. */
export const membroDi = (userId, orgId) =>
  attive().find((m) => m.userId === userId && m.orgId === orgId) || null;

/**
 * Le organizzazioni di una persona, aperte, in ordine di ingresso.
 *
 * Si chiama solo per se stessi. Non c'e' nessun controllo scritto qui che
 * lo imponga — sarebbe un controllo che il deposito non ha modo di fare,
 * perche' non sa chi sta guardando — ma non esiste una sola schermata che
 * la chiami con l'id di un altro, ed e' cosi' che deve restare.
 */
export const orgDiPersona = (userId) => attive()
  .filter((m) => m.userId === userId)
  .sort((a, b) => String(a.entratoIl).localeCompare(String(b.entratoIl)));

/** Quante ne ha. Serve a decidere che cosa mostrare dopo l'accesso. */
export const quanteOrg = (userId) => orgDiPersona(userId).length;

/** Chi sta dentro un'organizzazione. Solo appartenenze aperte. */
export const membriDiOrg = (orgId) => attive().filter((m) => m.orgId === orgId);

/* ─── I campi che l'appartenenza porta con se' ───────────────
   Sono quelli che descrivono il lavoro dentro *quella* organizzazione, e
   sono anche esattamente quelli che, cambiando canale, devono cambiare
   tutti insieme. */
const daMembro = (m) => ({
  orgId: m.orgId,
  role: m.role,
  roleId: m.roleId ?? null,
  departmentIds: m.departmentIds ?? [],
  managerId: m.managerId ?? null,
  orgOwner: Boolean(m.proprietario),
});

/**
 * La persona come si presenta dentro una certa organizzazione.
 *
 * E' la funzione che rende possibile all'admin di un'azienda vedere il
 * ruolo che uno ha *li'*, e non quello che ha nel canale che quella
 * persona ha aperto sul suo telefono in questo momento. Senza, un elenco
 * dipendenti mostrerebbe a caso i ruoli di un'altra organizzazione.
 *
 * Torna una copia: chi la riceve legge, non scrive. Le modifiche passano
 * da `updateUser` e da `aggiornaMembro`, che sanno dove va messa ogni cosa.
 */
export function personaIn(persona, orgId) {
  if (!persona) return null;
  const m = membroDi(persona.id, orgId);
  const base = m ? daMembro(m) : daMembro({ orgId, role: 'employee' });
  /* Dentro un'organizzazione personalizzata il nome vero non esce: si toglie
     qui, dove passa chiunque chieda chi c'e' in un'organizzazione, e non
     nelle trenta schermate che scrivono `u.name`. Una regola che vive nelle
     schermate si perde alla prima schermata nuova.
     Il record vero non si tocca: questa e' una copia, e il nome della
     persona resta suo e resta scritto — quando entrera' in un'azienda si
     rivedra'. */
  const nome = orgPersonalizzata(orgId) ? { name: nomePubblico(persona) } : null;
  return { ...persona, ...base, ...nome };
}

/* ─── Scrivere ───────────────────────────────────────────── */

/**
 * Fa entrare una persona in un'organizzazione, o ne aggiorna l'ingresso se
 * c'era gia'. Non tocca le altre appartenenze: entrare in un posto non
 * vuol dire uscire da un altro, ed e' tutta la differenza fra prima e
 * adesso.
 */
export function entraNellOrg(userId, orgId, campi = {}) {
  ensureMembri();
  if (!userId || !orgId) return null;
  const gia = membroDi(userId, orgId);
  if (gia) {
    Object.assign(gia, campi);
    save();
    return gia;
  }
  const m = {
    id: nuovoId('mem'),
    userId,
    orgId,
    role: campi.role || 'employee',
    roleId: campi.roleId ?? null,
    departmentIds: campi.departmentIds ?? [],
    managerId: campi.managerId ?? null,
    proprietario: Boolean(campi.proprietario),
    entratoIl: campi.entratoIl || new Date().toISOString(),
    uscitoIl: null,
  };
  db.membri.push(m);
  save();
  return m;
}

/** Aggiorna i campi di un'appartenenza aperta. */
export function aggiornaMembro(userId, orgId, campi) {
  const m = membroDi(userId, orgId);
  if (!m) return null;
  Object.assign(m, campi);
  save();
  return m;
}

/**
 * Chiude un'appartenenza. La riga resta, con la data d'uscita: e' quella
 * che dice fino a quando una persona e' stata li' dentro, e serve a
 * rispondere alle domande sui risultati anche molto dopo.
 */
export function chiudiMembro(userId, orgId, quando = new Date().toISOString()) {
  const m = membroDi(userId, orgId);
  if (!m) return null;
  m.uscitoIl = quando;
  save();
  return m;
}
