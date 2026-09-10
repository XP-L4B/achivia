/** La bacheca: gli annunci di lavoro pubblicati dalle organizzazioni. */

import { db, ensureAnnunci, nuovoId, save } from './nucleo';

export const getAnnunci = () => { ensureAnnunci(); return db.annunci; };

export const getAnnuncioById = (id) => getAnnunci().find((a) => a.id === id) || null;

/** Gli annunci di un'organizzazione, dal piu' recente. */
export const getAnnunciDiOrg = (orgId) => getAnnunci()
  .filter((a) => a.orgId === orgId)
  .sort((x, y) => new Date(y.creatoIl) - new Date(x.creatoIl));

/** Quelli che si vedono in bacheca: pubblicati e non ancora chiusi. */
export const annunciVivi = () => getAnnunci().filter((a) => a.stato === 'pubblicato');

/**
 * Scrive o riscrive un annuncio. Non controlla niente: i controlli stanno
 * in `annunci.js`, che e' il posto dove vivono le regole. Qui si scrive e
 * basta — separare le due cose e' quello che permette di provare le regole
 * senza toccare il deposito.
 */
export function salvaAnnuncioGrezzo(dati) {
  ensureAnnunci();
  const adesso = new Date().toISOString();
  if (dati.id) {
    const esistente = db.annunci.find((a) => a.id === dati.id);
    if (!esistente) return null;
    Object.assign(esistente, dati, { aggiornatoIl: adesso });
    save();
    return esistente;
  }
  const creato = {
    id: nuovoId('ann'),
    stato: 'pubblicato',
    risaltoFinoAl: null,
    creatoIl: adesso,
    aggiornatoIl: adesso,
    ...dati,
  };
  db.annunci.unshift(creato);
  save();
  return creato;
}

/** Chiudere non cancella: un annuncio chiuso resta all'organizzazione. */
export function chiudiAnnuncio(id) {
  const a = getAnnuncioById(id);
  if (!a || a.stato === 'chiuso') return a;
  a.stato = 'chiuso';
  a.chiusoIl = new Date().toISOString();
  save();
  return a;
}

export function riapriAnnuncio(id) {
  const a = getAnnuncioById(id);
  if (!a) return null;
  a.stato = 'pubblicato';
  a.chiusoIl = null;
  save();
  return a;
}

export function eliminaAnnuncio(id) {
  ensureAnnunci();
  const prima = db.annunci.length;
  db.annunci = db.annunci.filter((a) => a.id !== id);
  if (db.annunci.length === prima) return false;
  save();
  return true;
}

/** Il risalto ha una scadenza, e scaduto smette di essere risalto. */
export function metteInRisalto(id, fino) {
  const a = getAnnuncioById(id);
  if (!a) return null;
  a.risaltoFinoAl = fino;
  save();
  return a;
}

export const inRisalto = (a) => Boolean(a?.risaltoFinoAl)
  && new Date(a.risaltoFinoAl).getTime() > Date.now();
