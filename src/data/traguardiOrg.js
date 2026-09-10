/**
 * Il motore dei traguardi dell'organizzazione.
 *
 * Funziona come quello degli achievement personali, e per la stessa ragione:
 * niente contatori: si guarda quanto vale adesso la misura e da li' si
 * ricava quante volte il traguardo e' stato raggiunto. Chiamarlo mille volte
 * o una sola volta fa lo stesso effetto, e nessun evento processato due
 * volte puo' consegnare due medaglie.
 *
 * Quello che si scrive e' l'istanza — la volta in cui e' successo — con un
 * id costruito (`ach-<persona>-<traguardo>-<ciclo>`) che vale da vincolo di
 * unicita'. Le istanze portano `ambito: 'org'`: le viste personali le
 * lasciano fuori, perche' queste medaglie non sono di chi le riceve ma
 * dell'azienda che le ha meritate.
 *
 * Le vince chi l'organizzazione la guida: l'admin e i co-admin, che hanno
 * gli stessi identici permessi. Ognuno le riceve per se': sono lo stesso
 * traguardo visto da due scrivanie, non una medaglia da contendersi.
 */

import {
  getUserById, getAchievementInstancesForUser, addAchievementInstance,
  addNotification, getAchievementSync, markAchievementSync,
} from './db';
import { MISURE_ORG, SERIE_ORG } from './organizzazione';
import { TRAGUARDI_ORG, traguardoOrgById, conMedaglia, NOMI_LIVELLO } from './achievementsOrg';

const SERIE_VUOTA = { tratti: [], corrente: 0, massimo: 0 };

/** Chi puo' vincerli: l'admin e i co-admin, nessun altro. */
export const vinceTraguardiOrg = (persona) => persona?.role === 'admin';

const serieDi = (orgId, def) => SERIE_ORG[def.metrica]?.(orgId) ?? SERIE_VUOTA;
const misuraDi = (orgId, def) => MISURE_ORG[def.metrica]?.(orgId) ?? 0;

/**
 * Quante medaglie di questo traguardo i dati di adesso giustificano.
 *
 * E' pubblica perche' la classifica fra organizzazioni chiede la stessa
 * cosa senza passare dalle istanze scritte: un'azienda ha le medaglie che
 * i suoi numeri dicono, che il suo admin abbia aperto l'app o no.
 */
export function medaglieMeritate(orgId, def) {
  if (def.serie) {
    const s = serieDi(orgId, def);
    return def.ripetibile
      ? s.tratti.reduce((n, tratto) => n + Math.floor(tratto / def.target), 0)
      : def.livelli.filter((soglia) => s.massimo >= soglia).length;
  }
  const valore = misuraDi(orgId, def);
  return def.ripetibile
    ? Math.floor(valore / def.target)
    : def.livelli.filter((soglia) => valore >= soglia).length;
}

/**
 * A che punto e' l'organizzazione su un traguardo.
 *
 * Per una scala, `livello` e' il gradino raggiunto e il progresso e' quello
 * dentro il gradino successivo: 82% su una scala 70/80/90/95 e' argento con
 * due punti sui dieci che portano all'oro, non "82 su 95".
 *
 * Per un traguardo ripetibile, `volte` sono le medaglie gia' prese e il
 * progresso e' il giro in corso, come per gli achievement delle persone.
 */
export function progressoTraguardo(persona, riferimento) {
  const def = typeof riferimento === 'string' ? traguardoOrgById(riferimento) : riferimento;
  if (!persona || !def) return null;
  const orgId = persona.orgId;

  const istanze = getAchievementInstancesForUser(persona.id, persona.orgId)
    .filter((i) => i.achievementId === def.id);
  const volte = istanze.length;

  if (def.ripetibile) {
    const target = def.target;
    // Una serie non si somma: il giro in corso e' quello che sta correndo
    // adesso, non quello che resta di un totale.
    const progresso = def.serie
      ? serieDi(orgId, def).corrente % target
      : Math.max(0, Math.min(target, misuraDi(orgId, def) - target * volte));
    return {
      definizione: conMedaglia(def),
      istanze,
      volte,
      livello: null,
      progresso,
      target,
      mancanti: Math.max(0, target - progresso),
      percentuale: Math.min(100, Math.round((progresso / target) * 100)),
      ciclo: volte + 1,
      ultima: istanze[0] || null,
    };
  }

  const valore = def.serie ? serieDi(orgId, def).massimo : misuraDi(orgId, def);
  const livello = def.livelli.filter((soglia) => valore >= soglia).length;
  const finita = livello >= def.livelli.length;
  const base = livello > 0 ? def.livelli[livello - 1] : 0;
  const prossima = finita ? def.livelli[def.livelli.length - 1] : def.livelli[livello];
  const target = Math.max(1, prossima - (finita ? def.livelli[def.livelli.length - 2] ?? 0 : base));
  const progresso = finita ? target : Math.max(0, Math.min(target, valore - base));

  return {
    definizione: conMedaglia(def, Math.max(1, livello)),
    istanze,
    volte,
    livello,
    nomeLivello: livello > 0 ? NOMI_LIVELLO[livello - 1] : null,
    livelli: NOMI_LIVELLO,
    valore,
    progresso,
    target,
    mancanti: finita ? 0 : Math.max(0, target - progresso),
    percentuale: finita ? 100 : Math.min(100, Math.round((progresso / target) * 100)),
    ciclo: Math.min(def.livelli.length, livello + 1),
    ultima: istanze[0] || null,
  };
}

/** Il quadro completo, un elemento per traguardo. */
export const progressiTraguardi = (persona) =>
  TRAGUARDI_ORG.map((def) => progressoTraguardo(persona, def)).filter(Boolean);

/** I numeri dell'intestazione: quanti presi, quante medaglie in tutto. */
export function riepilogoTraguardi(persona) {
  const tutti = progressiTraguardi(persona);
  return {
    totale: tutti.length,
    presi: tutti.filter((p) => p.volte > 0).length,
    medaglie: tutti.reduce((n, p) => n + p.volte, 0),
    diamanti: tutti.filter((p) => p.livello === 4).length,
  };
}

/**
 * Allinea le medaglie dell'organizzazione ai suoi dati.
 *
 * Come per gli achievement personali, la primissima sincronizzazione
 * trascrive in silenzio quello che l'azienda ha gia' fatto: senza, un admin
 * che apre l'app la prima volta si troverebbe trenta notifiche in fila per
 * cose successe l'anno scorso. Da li' in avanti ogni traguardo e' vero e
 * viene annunciato.
 *
 * Nessun credito, mai: e' scritto qui e non e' configurabile da nessuna
 * schermata.
 */
export function sincronizzaTraguardi(userId) {
  const persona = getUserById(userId);
  if (!persona || !vinceTraguardiOrg(persona)) return [];

  const chiave = `${userId}:org`;
  const primaVolta = !getAchievementSync(chiave);
  const nate = [];

  for (const def of TRAGUARDI_ORG) {
    const gia = getAchievementInstancesForUser(userId, persona.orgId)
      .filter((i) => i.achievementId === def.id).length;
    const meritate = medaglieMeritate(persona.orgId, def);

    for (let ciclo = gia + 1; ciclo <= meritate; ciclo += 1) {
      const soglia = def.ripetibile ? def.target : def.livelli[ciclo - 1];
      const { istanza, creata } = addAchievementInstance({
        id: `ach-${userId}-${def.id}-${ciclo}`,
        userId,
        achievementId: def.id,
        ciclo,
        progresso: soglia,
        target: soglia,
        crediti: 0,
        fonte: 'automatic',
        ambito: 'org',
        livello: def.ripetibile ? null : ciclo,
        pregressa: primaVolta,
      });
      if (creata && !primaVolta) nate.push(istanza);
    }
  }

  if (primaVolta) markAchievementSync(chiave);

  nate.forEach((i) => {
    const def = traguardoOrgById(i.achievementId);
    const livello = i.livello ? ` · ${NOMI_LIVELLO[i.livello - 1]}` : '';
    addNotification({
      userId,
      kind: 'achievement',
      text: `Traguardo dell’organizzazione: ${def.nome}${livello}`,
      achievementInstanceId: i.id,
    });
  });

  return nate;
}
