/** Ritardi e assenze: si scrive solo quello che esce dalla normalita'. */

import { annuncia, db, ensureAchievements, ensurePresenze, save } from './nucleo';
import { getUserById } from './utenti';

/* ─── Presenze: ritardi e assenze ────────────────────────────
   Un evento per persona e per giorno. Non e' un cartellino — non si
   registrano le entrate e le uscite — ma il registro di quello che si
   discosta dalla normalita': chi e' arrivato tardi e chi non e' arrivato.
   I giorni normali non si scrivono, e sono la maggioranza.

   La chiave e' la coppia persona+giorno: registrare due volte lo stesso
   giorno corregge, non aggiunge. Senza questo un manager che tocca due
   volte il pulsante raddoppierebbe le assenze di qualcuno, e un conteggio
   che dipende da quante volte hai cliccato non e' un dato. */


export const getPresenze = () => {
  ensurePresenze();
  return db.attendance;
};

/**
 * Le registrazioni di una persona, dalla piu' recente.
 *
 * L'organizzazione si passa: le presenze le registra un'organizzazione, e
 * una persona che lavora in due posti ha due registri distinti. Senza, si
 * legge il canale che ha aperto adesso.
 */
export const getPresenzeForUser = (userId, orgId) => {
  ensurePresenze();
  if (orgId === undefined) orgId = getUserById(userId)?.orgId ?? null;
  return db.attendance
    .filter((p) => p.employeeId === userId && (p.orgId ?? null) === (orgId ?? null))
    .sort((a, b) => (a.giorno < b.giorno ? 1 : a.giorno > b.giorno ? -1 : 0));
};

export const getPresenzaDelGiorno = (userId, giorno, orgId) => {
  ensurePresenze();
  if (orgId === undefined) orgId = getUserById(userId)?.orgId ?? null;
  return db.attendance.find(
    (p) => p.employeeId === userId && p.giorno === giorno && (p.orgId ?? null) === (orgId ?? null)
  ) || null;
};

/**
 * Scrive un evento. Se per quella persona e quel giorno ce n'era gia' uno,
 * lo riscrive al suo posto e restituisce `sostituita: true`, cosi' chi
 * chiama puo' dirlo a chi ha registrato.
 */
export function addPresenza({ employeeId, giorno, tipo, minuti = 0, giustificata = false, nota = '', daId }) {
  ensurePresenze();
  const persona = getUserById(employeeId);
  if (!persona) return null;

  /* Chi registra la presenza lo fa stando dentro un'organizzazione, ed e'
     quella a cui la presenza appartiene. Leggerla dal canale di chi la
     riceve voleva dire che un responsabile dell'azienda, segnando
     l'assenza di qualcuno che in quel momento stava guardando il proprio
     gruppo, la scriveva nel registro del gruppo. */
  const chi = daId ? getUserById(daId) : null;
  const orgId = chi?.orgId ?? persona.orgId ?? null;

  /* Un giorno, una registrazione — per organizzazione. Chi lavora in due
     posti ha due giornate distinte, e la vecchia chiave, che l'
     organizzazione non la conteneva, le avrebbe fatte collidere.
     Quella che c'era gia' si ritrova per persona-giorno-organizzazione e
     non per id, cosi' le registrazioni scritte con la chiave vecchia si
     sostituiscono invece di sdoppiarsi. */
  const gia = db.attendance.find(
    (p) => p.employeeId === employeeId && p.giorno === giorno && (p.orgId ?? null) === orgId
  );

  const evento = {
    id: gia?.id || `pr-${orgId || 'senza-org'}-${employeeId}-${giorno}`,
    orgId,
    employeeId,
    giorno,
    tipo,
    // I minuti hanno senso solo per un ritardo: un'assenza non e' un ritardo
    // lungo tutto il giorno, e' un'altra cosa.
    minuti: tipo === 'ritardo' ? Math.max(0, Math.round(Number(minuti) || 0)) : 0,
    giustificata: Boolean(giustificata),
    nota: String(nota || '').trim(),
    daId,
    creatoIl: new Date().toISOString(),
  };

  const i = gia ? db.attendance.findIndex((p) => p.id === gia.id) : -1;
  const sostituita = i >= 0;
  if (sostituita) db.attendance[i] = evento;
  else db.attendance.unshift(evento);

  save();
  annuncia({ tipo: 'PresenzaRegistrata', presenzaId: evento.id, userId: employeeId });
  return { evento, sostituita };
}

export function deletePresenza(id) {
  ensurePresenze();
  const i = db.attendance.findIndex((p) => p.id === id);
  if (i < 0) return false;
  const { employeeId } = db.attendance[i];
  db.attendance.splice(i, 1);
  save();
  annuncia({ tipo: 'PresenzaRegistrata', presenzaId: id, userId: employeeId });
  return true;
}

/** Quando una persona e' stata sincronizzata la prima volta, se mai. */
export const getAchievementSync = (userId) => {
  ensureAchievements();
  return db.achievementSync[userId] || null;
};

export function markAchievementSync(userId) {
  ensureAchievements();
  db.achievementSync[userId] = new Date().toISOString();
  save();
}

/* La normalizzazione va in fondo al file e non accanto a `load()`: si
   appoggia a cose dichiarate piu' sotto — il generatore degli
   identificativi, per dirne una — e chiamarla prima vorrebbe dire usarle
   mentre non esistono ancora. Qui il modulo e' finito, e non c'e' niente
   che non sia al suo posto. */
