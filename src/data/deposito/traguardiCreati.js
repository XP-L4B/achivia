/**
 * Gli achievement che un'organizzazione si e' inventata da se'.
 *
 * Esistono per le organizzazioni personalizzate — un gruppo, un clan — che
 * gli achievement standard non li hanno: "Deadline Master" e
 * "Closer" parlano di quest aziendali, e a chi gamifica i compiti di casa o
 * gli allenamenti non dicono niente. Li' dentro le medaglie se le disegna
 * chi comanda: "Ha rifatto il letto per un mese", "Primo posto in gara",
 * "Ha aiutato un compagno".
 *
 * Sono tutti manuali, e non e' una limitazione temporanea: un achievement
 * automatico ha bisogno di una misura, e le misure sono codice — non si
 * scrivono da un modulo. Quello che si crea qui lo assegna una persona
 * quando succede, con una motivazione scritta, esattamente come "Go the
 * Extra Mile" nelle aziende.
 *
 * Vivono e muoiono con l'organizzazione: `orgId` sta su ogni definizione, e
 * quando qualcuno esce le istanze che le riguardano spariscono (vedi
 * `chiudiPassaggio` in `utenti.js`). Non finiscono in nessun curriculum e
 * in nessuna tavola dell'osservatorio, e non e' una dimenticanza — e' la
 * promessa su cui si regge questo tipo di organizzazione.
 */

import { db, ensureAchievementsCreati, nuovoId, save } from './nucleo';

export const getAchievementsCreati = (orgId) => {
  ensureAchievementsCreati();
  return db.achievementsCreati.filter((a) => a.orgId === orgId);
};

export const achievementCreatoById = (id) => {
  ensureAchievementsCreati();
  return db.achievementsCreati.find((a) => a.id === id) || null;
};

export function addAchievementCreato({ orgId, nome, descrizione, creditiDefault, badgeImage, badgeFamiglia, creatoDaId }) {
  ensureAchievementsCreati();
  const creato = {
    id: nuovoId('acr'),
    orgId,
    nome: String(nome || '').trim(),
    descrizione: String(descrizione || '').trim(),
    // Manuale sempre: una misura non si scrive da un modulo.
    tipo: 'manual',
    metrica: null,
    target: 1,
    ripetibile: true,
    // Qui la ricompensa la puo' avere chiunque: nelle aziende una sola
    // medaglia porta crediti perche' le altre premiano un lavoro che le
    // quest hanno gia' pagato, ma queste non premiano nessuna quest.
    ricompensabile: true,
    creditiDefault: Math.max(0, Number(creditiDefault) || 0),
    /* Il disegno si salva come indirizzo gia' risolto, non come nome di
       famiglia: le medaglie degli achievement non hanno i quattro metalli
       — o si e' presa o no — e chi le disegna sceglie una figura, non una
       scala. La famiglia si tiene accanto solo per poterla rimettere in
       evidenza quando si riapre il modulo. */
    badgeImage: badgeImage || null,
    badgeFamiglia: badgeFamiglia || null,
    unita: 'assegnazioni',
    creatoDaId,
    creatoIl: new Date().toISOString(),
  };
  db.achievementsCreati.push(creato);
  save();
  return creato;
}

export function updateAchievementCreato(id, patch) {
  const a = achievementCreatoById(id);
  if (!a) return null;
  const pulito = { ...patch };
  // L'identita' e l'organizzazione non si cambiano: sono quello che lega le
  // medaglie gia' consegnate alla loro definizione.
  delete pulito.id;
  delete pulito.orgId;
  delete pulito.tipo;
  Object.assign(a, pulito);
  save();
  return a;
}

/**
 * Toglie una definizione, e con lei le medaglie che erano state consegnate
 * su quella definizione: restare senza vorrebbe dire lasciare in giro delle
 * righe che nessuno sa piu' leggere.
 */
export function eliminaAchievementCreato(id) {
  ensureAchievementsCreati();
  const prima = db.achievementsCreati.length;
  db.achievementsCreati = db.achievementsCreati.filter((a) => a.id !== id);
  if (db.achievementsCreati.length === prima) return false;
  db.achievementInstances = (db.achievementInstances || [])
    .filter((i) => i.achievementId !== id);
  save();
  return true;
}
