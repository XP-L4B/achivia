/** Le valutazioni delle persone e i loro modelli. */

import { db, ensureReviews, save } from './nucleo';

/* ─── Performance review ─────────────────────────────────────
   Una review è un elenco di criteri, ognuno con un voto da 1 a 5 e una nota.
   Il punteggio medio è la media dei voti. I modelli salvano il solo elenco
   dei criteri, per riusarlo su altre persone. */

export const averageScore = (criteri = []) => {
  const voti = criteri.map((c) => Number(c.score)).filter((n) => n >= 1 && n <= 5);
  if (!voti.length) return 0;
  return Math.round((voti.reduce((a, b) => a + b, 0) / voti.length) * 10) / 10;
};

let reviewSeq = 0;
export function addReview({ subjectId, authorId, criteria, summary }) {
  ensureReviews();
  reviewSeq += 1;
  const created = {
    id: `rv-${Date.now()}-${reviewSeq}`,
    subjectId,
    authorId,
    criteria,
    summary: summary || '',
    average: averageScore(criteria),
    date: new Date().toISOString(),
  };
  db.reviews.unshift(created);
  save();
  return created;
}

// Review di una persona, dalla più recente.
export const getReviewsForUser = (userId) => {
  ensureReviews();
  return db.reviews.filter((r) => r.subjectId === userId);
};

export const getReviewTemplatesByOrg = (orgId) => {
  ensureReviews();
  return db.reviewTemplates.filter((t) => t.orgId === orgId);
};

let templateSeq = 0;
export function addReviewTemplate({ orgId, name, criteria }) {
  ensureReviews();
  templateSeq += 1;
  const created = {
    id: `rt-${Date.now()}-${templateSeq}`,
    orgId,
    name,
    // Il modello conserva solo le domande, non i voti.
    criteria: criteria.map(({ label, description }) => ({ label, description })),
  };
  db.reviewTemplates.push(created);
  save();
  return created;
}

export function deleteReviewTemplate(id) {
  ensureReviews();
  db.reviewTemplates = db.reviewTemplates.filter((t) => t.id !== id);
  save();
}
