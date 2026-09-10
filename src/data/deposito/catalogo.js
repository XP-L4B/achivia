/** Quello che un'organizzazione si configura: ruoli, reparti, categorie,
 *  immagini — e il catalogo del negozio con i suoi ordini. */

import { db, ensureArticoli, ensureCategorie, ensureDipartimenti, ensureImmagini, ensureOrdini, ensureOrganizzazioni, ensureRuoli, ensureSpedizione, save } from './nucleo';
import { muoviCrediti } from './crediti';

/* ─── Il negozio: articoli e ordini ──────────────────────────
   Il catalogo del Marketplace e gli ordini che ne escono. Qui c'e' solo
   il deposito — leggere, scrivere, cancellare; le regole (chi puo'
   toccare cosa, quanto costa davvero un articolo in offerta, che cosa
   succede annullando un ordine) stanno in `negozio.js`, come per le
   presenze. */



/* Le immagini caricate stanno per conto loro, e articoli e ordini le
   nominano: la stessa immagine puo' essere in un articolo e in dieci
   ordini, e tenerne dieci copie riempirebbe lo spazio del browser per
   niente. */

export const getImmagineDati = (id) => {
  ensureImmagini();
  return db.immagini.find((i) => i.id === id)?.dati ?? null;
};

let immagineSeq = 0;
export function addImmagine(dati) {
  ensureImmagini();
  immagineSeq += 1;
  const created = { id: `img-${Date.now()}-${immagineSeq}`, dati };
  db.immagini.push(created);
  if (!save()) {
    // Non c'e' stato spazio: si torna indietro, cosi' quello che sta in
    // memoria e quello che sta scritto restano la stessa cosa.
    db.immagini = db.immagini.filter((i) => i.id !== created.id);
    save();
    return null;
  }
  return created;
}

/** Se un'immagine caricata la sta ancora nominando qualcuno. */
export function immagineInUso(chiave) {
  ensureArticoli();
  ensureOrdini();
  ensureOrganizzazioni();
  return db.articoli.some((a) => a.immagine === chiave)
    || db.ordini.some((o) => o.immagine === chiave)
    // Anche l'insegna di un'organizzazione e' un'immagine caricata: senza
    // questa riga la pulizia degli orfani cancellerebbe un logo appeso.
    || Object.values(db.organizzazioni).some((o) => o?.logo === chiave);
}

export function deleteImmagine(id) {
  ensureImmagini();
  const prima = db.immagini.length;
  db.immagini = db.immagini.filter((i) => i.id !== id);
  if (db.immagini.length !== prima) save();
}

/* ─── Ruoli e dipartimenti ───────────────────────────────────
   Il deposito e basta: le regole — chi puo' cosa, chi puo' cambiare che
   cosa — stanno in `permessi.js`. */


export const getRuoli = () => {
  ensureRuoli();
  return db.ruoli;
};

let ruoloSeq = 0;
export function addRuolo(ruolo) {
  ensureRuoli();
  ruoloSeq += 1;
  const created = { id: `ruolo-${Date.now()}-${ruoloSeq}`, creatoIl: new Date().toISOString(), ...ruolo };
  db.ruoli.push(created);
  save();
  return created;
}

export function updateRuolo(id, patch) {
  ensureRuoli();
  const r = db.ruoli.find((x) => x.id === id);
  if (!r) return null;
  Object.assign(r, patch);
  save();
  return r;
}

export function deleteRuolo(id) {
  ensureRuoli();
  const prima = db.ruoli.length;
  db.ruoli = db.ruoli.filter((r) => r.id !== id);
  if (db.ruoli.length === prima) return false;
  save();
  return true;
}


export const getDipartimenti = () => {
  ensureDipartimenti();
  return db.dipartimenti;
};

let dipartimentoSeq = 0;
export function addDipartimento(dipartimento) {
  ensureDipartimenti();
  dipartimentoSeq += 1;
  const created = { id: `dip-${Date.now()}-${dipartimentoSeq}`, ...dipartimento };
  db.dipartimenti.push(created);
  save();
  return created;
}

export function updateDipartimento(id, patch) {
  ensureDipartimenti();
  const d = db.dipartimenti.find((x) => x.id === id);
  if (!d) return null;
  Object.assign(d, patch);
  save();
  return d;
}

export function deleteDipartimento(id) {
  ensureDipartimenti();
  const prima = db.dipartimenti.length;
  db.dipartimenti = db.dipartimenti.filter((d) => d.id !== id);
  if (db.dipartimenti.length === prima) return false;
  db.users.forEach((u) => {
    if (u.departmentIds?.includes(id)) {
      u.departmentIds = u.departmentIds.filter((x) => x !== id);
    }
  });
  save();
  return true;
}


export const getCategorie = () => {
  ensureCategorie();
  return db.categorie;
};

export const getCategoriaById = (id) => {
  ensureCategorie();
  return db.categorie.find((c) => c.id === id) ?? null;
};

let categoriaSeq = 0;
export function addCategoria(categoria) {
  ensureCategorie();
  categoriaSeq += 1;
  const created = { id: `cat-${Date.now()}-${categoriaSeq}`, ...categoria };
  db.categorie.push(created);
  save();
  return created;
}

export function updateCategoria(id, patch) {
  ensureCategorie();
  const c = db.categorie.find((x) => x.id === id);
  if (!c) return null;
  Object.assign(c, patch);
  save();
  return c;
}

/**
 * Toglie una categoria.
 *
 * Gli articoli che ci stavano dentro non si toccano: restano, senza
 * categoria. Cancellare un modo di ordinare le cose non e' cancellare le
 * cose.
 */
export function deleteCategoria(id) {
  ensureCategorie();
  ensureArticoli();
  const prima = db.categorie.length;
  db.categorie = db.categorie.filter((c) => c.id !== id);
  if (db.categorie.length === prima) return false;
  db.articoli.forEach((a) => {
    if (a.categoriaId === id) a.categoriaId = null;
  });
  save();
  return true;
}

/** Butta un'immagine caricata che non serve piu' a nessuno. */
export function scartaSeOrfana(chiave) {
  if (!String(chiave ?? '').startsWith('img-')) return;
  if (!immagineInUso(chiave)) deleteImmagine(chiave);
}

export const getArticoli = () => {
  ensureArticoli();
  return db.articoli;
};

export const getArticoloById = (id) => {
  ensureArticoli();
  return db.articoli.find((a) => a.id === id) ?? null;
};

let articoloSeq = 0;
export function addArticolo(articolo) {
  ensureArticoli();
  articoloSeq += 1;
  const created = {
    id: `art-${Date.now()}-${articoloSeq}`,
    creatoIl: new Date().toISOString(),
    ...articolo,
    aggiornatoIl: new Date().toISOString(),
  };
  db.articoli.unshift(created);
  if (!save()) {
    db.articoli = db.articoli.filter((a) => a.id !== created.id);
    save();
    return null;
  }
  return created;
}

export function updateArticolo(id, patch) {
  ensureArticoli();
  const a = db.articoli.find((x) => x.id === id);
  if (!a) return null;
  const prima = { ...a };
  Object.assign(a, patch, { aggiornatoIl: new Date().toISOString() });
  if (!save()) {
    Object.assign(a, prima);
    save();
    return null;
  }
  return a;
}

/**
 * Toglie un articolo dal catalogo.
 *
 * Gli ordini gia' fatti restano dove sono: si sono portati dietro nome,
 * immagine e prezzo del giorno in cui sono stati fatti, quindi chi ha
 * comprato continua a vedere che cosa ha comprato anche quando quella
 * cosa non si vende piu'.
 */
export function deleteArticolo(id) {
  ensureArticoli();
  ensureOrdini();
  const articolo = db.articoli.find((a) => a.id === id);
  if (!articolo) return false;
  db.articoli = db.articoli.filter((a) => a.id !== id);

  save();
  // L'immagine caricata se ne va con l'articolo, ma solo se non la sta
  // nominando piu' nessuno: gli ordini vecchi devono continuare a far
  // vedere che cosa e' stato comprato.
  scartaSeOrfana(articolo.immagine);
  return true;
}

/* ─── Le spese di spedizione ─────────────────────────────────
   Due numeri e una soglia, uguali per tutti come il catalogo. Le regole —
   chi le puo' cambiare, quanto costa davvero spedire un ordine — stanno
   in `negozio.js`. */

export function getSpedizione() {
  ensureSpedizione();
  return db.spedizione;
}

export function setSpedizione(patch) {
  ensureSpedizione();
  const prima = { ...db.spedizione };
  Object.assign(db.spedizione, patch);
  if (!save()) {
    db.spedizione = prima;
    save();
    return null;
  }
  return db.spedizione;
}

export const getOrdini = () => {
  ensureOrdini();
  return db.ordini;
};

export const getOrdiniForUser = (userId) => {
  ensureOrdini();
  return db.ordini.filter((o) => o.userId === userId);
};

export const getOrdineById = (id) => {
  ensureOrdini();
  return db.ordini.find((o) => o.id === id) ?? null;
};

let ordineSeq = 0;
export function addOrdine(ordine) {
  ensureOrdini();
  ordineSeq += 1;
  const adesso = new Date().toISOString();
  const created = {
    id: `ord-${Date.now()}-${ordineSeq}`,
    creatoIl: adesso,
    aggiornatoIl: adesso,
    ...ordine,
  };
  db.ordini.unshift(created);
  save();
  return created;
}

export function updateOrdine(id, patch) {
  ensureOrdini();
  const o = db.ordini.find((x) => x.id === id);
  if (!o) return null;
  Object.assign(o, patch, { aggiornatoIl: new Date().toISOString() });
  save();
  return o;
}

/**
 * Toglie crediti a una persona, se ce li ha.
 *
 * Il contrario di `accredita`, con una differenza che non e' un dettaglio:
 * spendere non toglie esperienza. I crediti si consumano, quello che si e'
 * imparato per guadagnarli no.
 */
export function spendiCrediti(userId, crediti, movimento = {}) {
  const somma = Math.max(0, Math.round(Number(crediti) || 0));
  const u = db.users.find((x) => x.id === userId);
  if (!u || (u.credits || 0) < somma) return false;
  // Zero crediti e' una spesa che riesce senza muovere niente: capita con
  // un articolo in regalo, e non e' un errore. Nel registro non ci va,
  // perche' un movimento da zero non racconta niente.
  if (somma) muoviCrediti({ causale: 'ordine', ...movimento, userId, quanti: -somma });
  save();
  return true;
}

/** Rimette i crediti dove stavano: un ordine annullato non si paga. */
export function rimborsaCrediti(userId, crediti, movimento = {}) {
  const somma = Math.max(0, Math.round(Number(crediti) || 0));
  const u = db.users.find((x) => x.id === userId);
  if (!u || !somma) return false;
  muoviCrediti({ causale: 'rimborso', ...movimento, userId, quanti: somma });
  save();
  return true;
}
