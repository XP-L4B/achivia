/** Le istanze degli achievement, la loro configurazione, i movimenti
 *  di credito che ne derivano. */

import { db, ensureAchievements, save } from './nucleo';
import { accredita } from './quest';

/* ─── Achievement: istanze, configurazione, movimenti crediti ─
   Qui dentro c'e' solo la memoria. Le regole — quante quest servono, quando
   scatta un ciclo — stanno in src/data/achievements.js. */


export const getAchievementInstances = () => {
  ensureAchievements();
  return db.achievementInstances;
};

/**
 * Le medaglie di una persona dentro un'organizzazione, dalla piu' recente.
 *
 * L'organizzazione si passa; senza, si legge il canale che quella persona
 * ha aperto adesso. Vale la stessa cosa detta per le certificazioni: va
 * bene per il proprio profilo, e va male per chiunque guardi qualcun altro.
 */
export const getAchievementInstancesForUser = (userId, orgId) => {
  ensureAchievements();
  if (orgId === undefined) orgId = db.users.find((u) => u.id === userId)?.orgId ?? null;
  return db.achievementInstances
    .filter((i) => i.userId === userId && (i.orgId ?? null) === orgId)
    .sort((a, b) => new Date(b.ottenutoIl) - new Date(a.ottenutoIl));
};

/** Tutte, di ogni organizzazione: quello che ha ottenuto in tutta la carriera. */
export const getAchievementStorico = (userId) => {
  ensureAchievements();
  return db.achievementInstances
    .filter((i) => i.userId === userId)
    .sort((a, b) => new Date(b.ottenutoIl) - new Date(a.ottenutoIl));
};

export const getAchievementInstanceById = (id) => {
  ensureAchievements();
  return db.achievementInstances.find((i) => i.id === id) || null;
};

/**
 * Registra un'istanza. L'id e' costruito da chi la crea e vale da vincolo di
 * unicita': se quell'id c'e' gia', la funzione non fa nulla e restituisce
 * quella esistente. E' qui che sta l'idempotenza dell'intero sistema —
 * riprocessare lo stesso evento non puo' duplicare niente, perche' il
 * secondo tentativo trova il posto occupato.
 */
export function addAchievementInstance(istanza) {
  ensureAchievements();
  const esistente = db.achievementInstances.find((i) => i.id === istanza.id);
  if (esistente) return { istanza: esistente, creata: false };

  /* L'organizzazione la dice chi crea l'istanza, quando lo sa: una medaglia
     consegnata a mano e' della organizzazione di chi la consegna. Le
     automatiche non hanno un mittente — se le guadagna la persona facendo
     il suo lavoro — e per quelle il canale in cui sta e' la risposta
     giusta. */
  const creata = {
    ottenutoIl: new Date().toISOString(),
    crediti: 0,
    orgId: db.users.find((u) => u.id === istanza.userId)?.orgId ?? null,
    ...istanza,
  };
  db.achievementInstances.unshift(creata);

  /* I crediti si accreditano dentro la stessa creazione: o esistono tutti
     e due — istanza e movimento — o non esiste nessuno dei due.
     La riga del registro la scriveva questo punto, a mano, ed era l'unico
     movimento di crediti dell'applicazione che lasciasse traccia. Adesso
     la scrive `accredita` come per tutti gli altri, e qui resta solo la
     ragione: quale medaglia, e in che organizzazione. */
  if (creata.crediti > 0) {
    accredita(db.users.find((x) => x.id === creata.userId), creata.crediti, {
      causale: 'traguardo',
      riferimento: creata.id,
      orgId: creata.orgId ?? null,
      daId: creata.assegnatoDaId ?? null,
    });
  }

  save();
  return { istanza: creata, creata: true };
}

/** Crediti configurati per un achievement in un'organizzazione. */
export const getAchievementCredits = (orgId, achievementId, predefinito = 0) => {
  ensureAchievements();
  const perOrg = db.achievementConfig[orgId];
  const valore = perOrg ? perOrg[achievementId] : undefined;
  return Number.isFinite(valore) ? valore : predefinito;
};

export function setAchievementCredits(orgId, achievementId, crediti) {
  ensureAchievements();
  const valore = Math.max(0, Math.round(Number(crediti) || 0));
  if (!db.achievementConfig[orgId]) db.achievementConfig[orgId] = {};
  db.achievementConfig[orgId][achievementId] = valore;
  save();
  return valore;
}
