import {
  getCustomSkills, getCertification, getCertificationsForEmployee,
  getRecommendationsForEmployee, getUserById, getUsersByOrg,
  getCertifications, puoGuidare, orgPersonalizzata,
} from './db';
import { puo, puoQualcosa } from './permessi';
import {
  SKILLS_STANDARD, SKILL_CATEGORIES, SKILL_LEVELS, livelloById, categoriaById,
} from './skillsCatalog';

/**
 * Lo Skill Tree: come le competenze si compongono in una mappa e chi puo'
 * fare cosa. La persistenza sta in db.js, qui c'e' quello che se ne ricava.
 *
 * La regola che tiene insieme tutto: una competenza non si prende da soli.
 * La certifica qualcun altro, e resta scritto chi, quando e perche'.
 */

/**
 * Catalogo completo per un'organizzazione: standard piu' quelle sue.
 *
 * Le standard non sono piu' solo le sedici soft: da quando le competenze
 * degli annunci sono entrate nel catalogo sono centoventidue, e coprono
 * anche il mestiere. Un'azienda che apre oggi trova gia' "Saldatura" e
 * "Contabilità generale" da certificare, senza doverle inventare — ed e'
 * quello che permette di confrontarle fra aziende diverse.
 *
 * Un'organizzazione personalizzata no: parte da un foglio bianco e si scrive le
 * sue. Non e' una versione ridotta — e' che il vocabolario comune serve a
 * confrontarsi con gli altri, e un gruppo o un clan non si confrontano con
 * nessuno. "Saldatura" in casa non vuol dire niente,
 * "Ha apparecchiato per una settimana" si'.
 */
export function getSkills(orgId) {
  if (orgPersonalizzata(orgId)) return getCustomSkills(orgId);
  return [...SKILLS_STANDARD, ...getCustomSkills(orgId)];
}

export function getSkillById(orgId, skillId) {
  return getSkills(orgId).find((s) => s.id === skillId) || null;
}

/**
 * Stato di una competenza per una persona: o e' riconosciuta, o si puo'
 * ottenere. Nessuna competenza e' preclusa — i prerequisiti restano come
 * percorso consigliato, non come sbarramento: chi arriva gia' capace di una
 * cosa non deve prima farsi certificare quelle che vengono "prima".
 */
export function statoSkill(skill, employeeId) {
  return getCertification(employeeId, skill.id) ? 'certified' : 'available';
}

/**
 * Le competenze che nel percorso vengono prima di questa e che la persona
 * non ha ancora. Non bloccano nulla: servono a dire "di solito si arriva da
 * qui", e a far vedere che la mappa e' un cammino e non un elenco.
 */
export function prerequisitiMancanti(orgId, skill, employeeId) {
  return (skill.prerequisites || [])
    .filter((p) => !getCertification(employeeId, p))
    .map((p) => getSkillById(orgId, p))
    .filter(Boolean);
}

/**
 * L'albero di una persona: le competenze raggruppate per categoria, ognuna
 * con il suo stato, il livello raggiunto e i legami che la precedono.
 * E' quello che disegna la mappa.
 */
export function skillTreeOf(user) {
  const orgId = user?.orgId;
  const skills = getSkills(orgId);

  const nodi = skills.map((skill) => {
    const cert = getCertification(user.id, skill.id);
    return {
      skill,
      stato: cert ? 'certified' : 'available',
      certificazione: cert,
      livello: cert?.level ? livelloById(cert.level) : null,
      // Il percorso consigliato: mostrato, mai imposto.
      vienePrima: cert ? [] : prerequisitiMancanti(orgId, skill, user.id),
    };
  });

  const categorie = SKILL_CATEGORIES
    .map((cat) => ({
      ...cat,
      nodi: nodi.filter((n) => n.skill.categoria === cat.id),
    }))
    // Una categoria senza competenze non merita un ramo vuoto nella mappa.
    .filter((cat) => cat.nodi.length > 0);

  return { nodi, categorie };
}

/** Numeri dell'intestazione: certificate, per tipo, e quante restano. */
export function riepilogoSkill(user) {
  const { nodi } = skillTreeOf(user);
  const certificate = nodi.filter((n) => n.stato === 'certified');
  return {
    totale: nodi.length,
    certificate: certificate.length,
    soft: certificate.filter((n) => n.skill.type === 'soft').length,
    tecniche: certificate.filter((n) => n.skill.type === 'technical').length,
    daSviluppare: nodi.length - certificate.length,
    // Quanti livelli sono stati raggiunti in tutto: e' la misura che cresce
    // anche quando il numero di competenze resta lo stesso.
    livelli: certificate.reduce((s, n) => s + (n.certificazione?.level || 0), 0),
    percentuale: nodi.length ? Math.round((certificate.length / nodi.length) * 100) : 0,
  };
}

/** Competenze consigliate a una persona, con chi le ha consigliate. */
export function consigliDi(user) {
  const orgId = user?.orgId;
  return getRecommendationsForEmployee(user.id)
    .map((r) => ({
      ...r,
      skill: getSkillById(orgId, r.skillId),
      da: getUserById(r.byId),
    }))
    .filter((r) => r.skill && !getCertification(user.id, r.skillId));
}

/** Storico completo delle certificazioni di una persona, revoche comprese. */
export function storicoDi(user) {
  const orgId = user?.orgId;
  return getCertificationsForEmployee(user.id, user.orgId).map((c) => ({
    ...c,
    skill: getSkillById(orgId, c.skillId),
    livello: c.level ? livelloById(c.level) : null,
    da: getUserById(c.certifiedBy),
    revocataDa: c.revokedBy ? getUserById(c.revokedBy) : null,
  }));
}

/** Storico dell'organizzazione, per la pagina di chi certifica. */
export function storicoOrg(orgId, { soloPersone } = {}) {
  const ammessi = soloPersone ? new Set(soloPersone.map((p) => p.id)) : null;
  return getCertifications()
    /* Solo quelle date qui dentro. Prima si guardavano tutte quelle delle
       persone del perimetro, e una competenza standard certificata
       dall'azienda di prima ricompariva in questo elenco col suo pulsante
       "Revoca" accanto: chi guida qui poteva togliere una medaglia data da
       qualcun altro, in un posto dove non c'era. */
    .filter((c) => (c.orgId ?? null) === (orgId ?? null))
    .filter((c) => !ammessi || ammessi.has(c.employeeId))
    .map((c) => ({
      ...c,
      skill: getSkillById(orgId, c.skillId),
      livello: c.level ? livelloById(c.level) : null,
      persona: getUserById(c.employeeId),
      da: getUserById(c.certifiedBy),
      revocataDa: c.revokedBy ? getUserById(c.revokedBy) : null,
    }))
    .filter((c) => c.skill && c.persona)
    .sort((a, b) => new Date(b.certifiedAt) - new Date(a.certifiedAt));
}

/* ─── Chi puo' fare cosa ───────────────────────────────────── */

/**
 * Le persone di cui si possono vedere e certificare le competenze.
 * L'admin arriva a tutta l'organizzazione, manager compresi; un manager ai
 * propri collaboratori e agli altri manager, perche' anche loro crescono e
 * qualcuno deve poterlo riconoscere. Il dipendente, a nessuno: le sue le
 * vede dalla propria pagina.
 */
export function personeCertificabili(user) {
  if (!user) return [];
  if (!puo(user, 'skills.certify')) return [];
  // Gli admin restano fuori dall'elenco: non e' che non si possano
  // certificare per un difetto di permessi, e' che il proprietario non ha
  // competenze da farsi riconoscere qui dentro — men che meno da se' stesso
  // o da un altro proprietario.
  return getUsersByOrg(user.orgId)
    .filter((u) => u.id !== user.id && u.role !== 'admin' && puoGuidare(user, u));
}

/** Nessuno si certifica da solo: e' la regola che rende il badge un riconoscimento. */
export function puoCertificare(user, target) {
  if (!user || !target || user.id === target.id) return false;
  return personeCertificabili(user).some((p) => p.id === target.id);
}

/** Togliere una certificazione pesa piu' che darla: e' un permesso a parte. */
export function puoRevocare(user, target) {
  if (!puo(user, 'skills.revoke')) return false;
  if (target?.role === 'admin') return false;
  return Boolean(target) && user?.id !== target.id && puoGuidare(user, target);
}

export function puoVedereSkillDi(user, target) {
  if (!user || !target) return false;
  // L'albero di un admin non esiste: non c'e' niente da vedere.
  if (target.role === 'admin') return false;
  if (user.id === target.id) return true;
  // Per guardare le competenze di qualcuno basta guidarlo: certificarle e'
  // un'altra cosa, e chi vede il team deve poterlo leggere.
  return puoGuidare(user, target) && puoQualcosa(user, ['people.team', 'skills.certify']);
}

/** Le competenze standard non si toccano; le altre solo dentro la propria organizzazione. */
export function puoModificareSkill(user, skill) {
  if (!user || !skill || skill.isStandard) return false;
  return puo(user, 'skills.create') && skill.orgId === user.orgId;
}

export const puoCreareSkill = (user) => puo(user, 'skills.create');

/* ─── Mappa delle competenze del team ──────────────────────── */

/**
 * Una riga per persona con quante competenze ha e quali: e' la vista che
 * permette di leggere il team in un colpo d'occhio e vedere dove mancano
 * pezzi.
 */
export function mappaTeam(user) {
  return personeCertificabili(user).map((persona) => {
    const riepilogo = riepilogoSkill(persona);
    const certificate = getCertificationsForEmployee(persona.id, persona.orgId)
      .filter((c) => c.status === 'certified')
      .map((c) => ({
        certificazione: c,
        skill: getSkillById(persona.orgId, c.skillId),
        livello: c.level ? livelloById(c.level) : null,
      }))
      .filter((x) => x.skill);
    return { persona, riepilogo, certificate };
  });
}

/** Le persone su cui un manager lavora, per i filtri. */
export const collaboratoriDi = (user) => personeCertificabili(user);

export { SKILL_CATEGORIES, SKILL_LEVELS, livelloById, categoriaById };
