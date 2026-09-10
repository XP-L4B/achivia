/** Competenze create, certificazioni, consigli. */

import { annuncia, db, ensureSkills, save } from './nucleo';

/* ─── Competenze e certificazioni ────────────────────────────
   Le soft skill standard non stanno qui dentro: vivono nel catalogo
   (src/data/skillsCatalog.js) e sono le stesse per tutte le organizzazioni.
   Nel database finiscono solo le competenze create da un'organizzazione, le
   certificazioni assegnate e le competenze consigliate. */


/* Competenze create da un'organizzazione (le standard arrivano dal catalogo). */
export const getCustomSkills = (orgId) => {
  ensureSkills();
  return db.skills.filter((s) => s.orgId === orgId);
};

/* Tutte le competenze create, di chiunque siano. Nessuna schermata delle
   organizzazioni la chiama — nessuno deve vedere il vocabolario di
   un'altra azienda — ma l'osservatorio guarda il mercato, e il mercato e'
   fatto di tutte. */
export const getSkillsCreate = () => {
  ensureSkills();
  return db.skills;
};

let skillSeq = 0;
export function addSkill({ orgId, name, description, categoria, type, badgeImage, prerequisites, createdById }) {
  ensureSkills();
  skillSeq += 1;
  const created = {
    id: `sk-${Date.now()}-${skillSeq}`,
    orgId,
    name: (name || '').trim(),
    description: (description || '').trim(),
    categoria: categoria || 'tecnica',
    type: type === 'soft' ? 'soft' : 'technical',
    // Nessuno puo' creare una soft skill standard: una competenza nata in
    // un'organizzazione resta sua, anche quando e' di tipo soft.
    isStandard: false,
    // Ogni competenza ha i suoi quattro livelli: non e' una scelta di chi
    // la crea, e' come funziona la certificazione.
    hasLevels: true,
    badgeImage: badgeImage || null,
    prerequisites: prerequisites || [],
    createdById,
    createdAt: new Date().toISOString(),
  };
  db.skills.push(created);
  save();
  return created;
}

// Campi che una modifica puo' toccare: id, orgId e isStandard restano fuori
// perche' sono quelli che decidono di chi e' la competenza e chi puo'
// metterci le mani.
const CAMPI_SKILL = ['name', 'description', 'categoria', 'type', 'badgeImage', 'prerequisites'];

export function updateSkill(id, patch) {
  ensureSkills();
  const s = db.skills.find((x) => x.id === id);
  if (!s) return null;
  CAMPI_SKILL.forEach((campo) => {
    if (campo in patch) s[campo] = patch[campo];
  });
  s.updatedAt = new Date().toISOString();
  save();
  return s;
}

export function deleteSkill(id) {
  ensureSkills();
  db.skills = db.skills.filter((s) => s.id !== id);
  // Le certificazioni gia' assegnate restano: sono storia, e cancellarle
  // riscriverebbe il passato di una persona.
  save();
}

/* ─── Certificazioni ─── */

export const getCertifications = () => {
  ensureSkills();
  return db.certifications;
};

/**
 * Le certificazioni di una persona dentro un'organizzazione.
 *
 * E' quello che il suo Skill Tree mostra, e cambiando canale torna vuoto —
 * non perche' qualcuno cancelli qualcosa, ma perche' una certificazione
 * porta addosso l'organizzazione che l'ha data. Per vedere tutto quello che
 * ha ottenuto nella sua vita lavorativa c'e' `getCertificazioniDi`.
 *
 * L'organizzazione si passa. Senza, si legge il canale che quella persona
 * ha aperto adesso — che va bene quando sta guardando il proprio profilo, e
 * va male in tutti gli altri casi: un responsabile che apre la scheda di
 * qualcuno vedrebbe le competenze dell'organizzazione in cui quella persona
 * si trova in quel momento, che puo' essere un'altra.
 */
export const getCertificationsForEmployee = (employeeId, orgId) => {
  ensureSkills();
  if (orgId === undefined) orgId = db.users.find((u) => u.id === employeeId)?.orgId ?? null;
  return db.certifications
    .filter((c) => c.employeeId === employeeId && (c.orgId ?? null) === orgId)
    .sort((a, b) => new Date(b.certifiedAt) - new Date(a.certifiedAt));
};

/** Tutte, di ogni organizzazione: e' lo storico, non il profilo di adesso. */
export const getCertificazioniDi = (employeeId) => {
  ensureSkills();
  return db.certifications
    .filter((c) => c.employeeId === employeeId)
    .sort((a, b) => new Date(b.certifiedAt) - new Date(a.certifiedAt));
};

/**
 * Certificazione valida di una persona su una competenza, se c'e'.
 *
 * Solo dentro l'organizzazione di adesso: la stessa competenza certificata
 * da un'azienda nuova e' una certificazione nuova, non l'aggiornamento di
 * una vecchia. E' cosi' che sul profilo una competenza riconosciuta da due
 * datori di lavoro compare due volte, con due date.
 */
export const getCertification = (employeeId, skillId, orgId) => {
  ensureSkills();
  if (orgId === undefined) orgId = db.users.find((u) => u.id === employeeId)?.orgId ?? null;
  return db.certifications.find(
    (c) => c.employeeId === employeeId && c.skillId === skillId
      && c.status === 'certified' && (c.orgId ?? null) === orgId
  ) || null;
};

let certSeq = 0;
export function certifySkill({ employeeId, skillId, level, reason, certifiedBy, certifiedAt, links }) {
  ensureSkills();

  /* Dove sta succedendo: nell'organizzazione di chi certifica, non in quella
     in cui la persona premiata si trova in questo momento.
     Certificare e' un atto che qualcuno compie stando dentro
     un'organizzazione, ed e' quella a metterci la firma. Leggerlo dal
     canale del destinatario voleva dire che un responsabile dell'azienda,
     certificando qualcuno che in quel momento stava guardando il proprio
     gruppo sportivo, gli intestava la competenza al gruppo — dove non
     vale niente e da dove sparisce all'uscita. */
  const daChi = certifiedBy ? db.users.find((u) => u.id === certifiedBy) : null;
  const orgId = daChi?.orgId ?? db.users.find((u) => u.id === employeeId)?.orgId ?? null;

  // Ricertificare la stessa competenza non crea un doppione: aggiorna quella
  // valida, cosi' il livello puo' salire senza sporcare lo storico.
  const esistente = getCertification(employeeId, skillId, orgId);
  if (esistente) {
    const prima = esistente.level;
    const adesso = level ?? esistente.level;
    Object.assign(esistente, {
      level: adesso,
      reason: (reason ?? esistente.reason ?? '').trim(),
      certifiedBy,
      certifiedAt: certifiedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    // Il livello raggiunto sovrascrive il precedente, ma la salita resta
    // scritta: senza, un passaggio da 2 a 3 sarebbe indistinguibile da una
    // certificazione partita direttamente a 3. Ricertificare allo stesso
    // livello non aggiunge un passo.
    if (adesso > prima) {
      esistente.storia = [...(esistente.storia || []), { level: adesso, at: esistente.certifiedAt, byId: certifiedBy ?? null }];
    }
    save();
    if (adesso > prima) {
      annuncia({ tipo: 'CompetenzaSalita', certificationId: esistente.id, userId: employeeId });
    }
    return esistente;
  }

  certSeq += 1;
  const created = {
    id: `cert-${Date.now()}-${certSeq}`,
    employeeId,
    // Dove e' successo. Senza, al cambio d'azienda non si saprebbe che cosa
    // la persona si porta via e che cosa perde.
    orgId,
    skillId,
    level: level ?? null,
    status: 'certified',
    certifiedBy,
    certifiedAt: certifiedAt || new Date().toISOString(),
    reason: (reason || '').trim(),
    revokedAt: null,
    revokedBy: null,
    revokeReason: null,
    // Agganci per quest, formazione, KPI e percorsi: oggi vuoti, ma la
    // certificazione ha gia' dove tenerli quando arriveranno.
    links: links || { questIds: [], trainingIds: [], kpiIds: [] },
  };
  // Il primo passo della scala: la certificazione stessa.
  created.storia = [{ level: created.level, at: created.certifiedAt, byId: certifiedBy ?? null }];
  db.certifications.unshift(created);
  save();
  annuncia({ tipo: 'CompetenzaCertificata', certificationId: created.id, userId: employeeId });
  return created;
}

/**
 * Revoca senza cancellare: lo storico resta, con chi ha revocato e quando.
 *
 * Si revoca solo quello che si e' certificato. Una competenza porta addosso
 * l'organizzazione che l'ha data, e chi guida un'altra organizzazione non
 * puo' toglierla: non era li' quando e' stata riconosciuta, non sa perche',
 * e quella medaglia e' il pezzo di curriculum di una persona che con lui
 * non c'entra. Vale per tutti — un'azienda non tocca quelle di un'altra
 * azienda — ed e' la ragione per cui entrare in un gruppo o in un clan non
 * mette a rischio niente di quello che si e' costruito lavorando.
 *
 * Il controllo sta qui e non nella schermata: una schermata che non mostra
 * il pulsante e una funzione che rifiuta sono due cose diverse, e la
 * seconda regge anche il giorno in cui qualcuno chiama la funzione da
 * un'altra parte.
 */
export function revokeCertification(id, { byId, reason } = {}) {
  ensureSkills();
  const c = db.certifications.find((x) => x.id === id);
  if (!c || c.status === 'revoked') return c || null;
  const chi = db.users.find((u) => u.id === byId) || null;
  if ((c.orgId ?? null) !== (chi?.orgId ?? null)) return null;
  c.status = 'revoked';
  c.revokedAt = new Date().toISOString();
  c.revokedBy = byId ?? null;
  c.revokeReason = (reason || '').trim();
  save();
  return c;
}

/* ─── Competenze consigliate ─── */

let racSeq = 0;
export function recommendSkill({ employeeId, skillId, byId, note }) {
  ensureSkills();
  const gia = db.recommendations.find((r) => r.employeeId === employeeId && r.skillId === skillId);
  if (gia) return gia;
  racSeq += 1;
  const created = {
    id: `rec-${Date.now()}-${racSeq}`,
    employeeId,
    skillId,
    byId,
    note: (note || '').trim(),
    createdAt: new Date().toISOString(),
  };
  db.recommendations.unshift(created);
  save();
  return created;
}

export function unrecommendSkill(employeeId, skillId) {
  ensureSkills();
  db.recommendations = db.recommendations.filter(
    (r) => !(r.employeeId === employeeId && r.skillId === skillId)
  );
  save();
}

export const getRecommendationsForEmployee = (employeeId) => {
  ensureSkills();
  return db.recommendations.filter((r) => r.employeeId === employeeId);
};
