/**
 * L'arena nel deposito: le partite giocate e i primati.
 *
 * Due collezioni, e per una ragione precisa. Le partite si tengono a
 * rotazione — le ultime venti per persona — perche' il deposito ha meno di
 * quattro megabyte liberi e una riga per partita, per sempre, li
 * riempirebbe. I primati stanno a parte proprio perche' le partite
 * girano: il miglior tempo di sei mesi fa deve restare anche quando la
 * partita che l'ha fatto e' uscita dall'elenco.
 *
 * I traguardi dell'arena stanno in una terza collezione, `traguardiArena`,
 * una voce per persona: le misure (i totali e i primati che i traguardi
 * leggono) e gli sbloccati, con la data. E' un profilo a parte: non tocca
 * `achievements`, le medaglie, i contatori del profilo di Achivia, e non
 * paga niente.
 *
 * La classifica dell'arena sta in `classificaArena`: per ogni lega — la
 * settimana, il mese, sempre — e per ogni persona, la sua partita migliore
 * del periodo, coi punti. La settimana e il mese sono chiavi nuove ogni
 * volta che cambiano (`chiaveLega`), quindi ripartono da zero da sole;
 * `sempre` e' una chiave sola e non riparte mai. Le leghe passate restano
 * per qualche giro, cosi' si puo' dire chi ha vinto la scorsa.
 *
 * Si scrive una volta sola, a fine partita. Mai durante. E si scrive solo
 * quello che si riconosce: `pulisci` tiene i campi che il motore produce,
 * con id che esistono e numeri dentro tetti ragionevoli. Il resto — campi
 * in piu', numeri rotti, nomi inventati — non entra. Da qui non parte
 * nessun credito e nessuna esperienza dell'account: l'arena non paga.
 */

/* I tetti: nessuna partita vera li passa, e un numero oltre non e' una partita. */
const TETTI = { secondi: 4 * 3600, uccisioni: 100000, livello: 200, boss: 200, casse: 2000, colpiSubiti: 100000, serie: 100000, critici: 1000000, casseEpiche: 2000, bossPuliti: 200 };
const ID_PERSONAGGI = new Set(PERSONAGGI.map((p) => p.id));
const ID_ARMI = new Set(ARMI.map((a) => a.id));
const ID_MODULI = new Set(MODULI.map((m) => m.id));
const ID_SINERGIE = new Set(SINERGIE.map((s) => s.id));

const intero = (v, tetto, minimo = 0) => Math.min(tetto, Math.max(minimo, Math.round(Number(v) || 0)));
const decimale = (v, tetto) => Math.min(tetto, Math.max(0, Number(v) || 0));

/** Il riassunto come lo accettiamo: campi noti, id che esistono, numeri nei tetti. */
export function pulisci(r) {
  const armi = Array.isArray(r.armi)
    ? r.armi.map(String).filter((v) => /^[a-z]+:[1-5]\+?$/.test(v) && ID_ARMI.has(v.split(':')[0])).slice(0, 4)
    : [];
  const moduli = {};
  if (r.moduli && typeof r.moduli === 'object') {
    for (const id of Object.keys(r.moduli)) if (ID_MODULI.has(id)) moduli[id] = intero(r.moduli[id], 20);
  }
  const st = r.statistiche && typeof r.statistiche === 'object' ? r.statistiche : {};
  return {
    personaggio: ID_PERSONAGGI.has(r.personaggio) ? r.personaggio : PERSONAGGI[0].id,
    secondi: intero(r.secondi, TETTI.secondi),
    uccisioni: intero(r.uccisioni, TETTI.uccisioni),
    livello: intero(r.livello, TETTI.livello, 1),
    seme: Number.isFinite(Number(r.seme)) ? Number(r.seme) : null,
    moduli,
    armi,
    boss: intero(r.boss, TETTI.boss),
    casse: intero(r.casse, TETTI.casse),
    sinergie: Array.isArray(r.sinergie) ? r.sinergie.filter((id) => ID_SINERGIE.has(id)).slice(0, SINERGIE.length) : [],
    colpiSubiti: intero(r.colpiSubiti, TETTI.colpiSubiti),
    serie: intero(r.serie, TETTI.serie),
    critici: intero(r.critici, TETTI.critici),
    casseEpiche: intero(r.casseEpiche, TETTI.casseEpiche),
    bossPuliti: intero(r.bossPuliti, TETTI.bossPuliti),
    livelloA120: intero(r.livelloA120, TETTI.livello),
    statistiche: { armatura: decimale(st.armatura, 100), proiettiliExtra: intero(st.proiettiliExtra, 20), danno: decimale(st.danno, 50) },
  };
}

import { db, ensureArena, nuovoId, save } from './nucleo';
import { aggiornaMisure, raggiunti, misureVuote } from '../../game/contenuti/traguardi';
import { PERSONAGGI } from '../../game/contenuti/personaggi';
import { ARMI } from '../../game/contenuti/armi';
import { MODULI } from '../../game/contenuti/moduli';
import { SINERGIE } from '../../game/contenuti/sinergie';

export const PARTITE_TENUTE = 20;

export function getPartiteArena(userId) {
  ensureArena();
  return db.partiteArena.filter((p) => p.userId === userId);
}

/* ─── La classifica ─── */

/** Come si fanno i punti di una partita: un punto al secondo, uno per nemico, venti per livello, cinquecento per boss. */
export const PUNTI = { secondo: 1, nemico: 1, livello: 20, boss: 500 };
export const puntiPartita = (r) => r.secondi * PUNTI.secondo + r.uccisioni * PUNTI.nemico + r.livello * PUNTI.livello + r.boss * PUNTI.boss;

export const LEGHE = [
  { id: 'sett', nome: 'Settimana' },
  { id: 'mese', nome: 'Mese' },
  { id: 'sempre', nome: 'Di sempre' },
];
/** Quante leghe passate si tengono, oltre a quella in corso. */
const LEGHE_TENUTE = 4;

const giorno = 24 * 3600 * 1000;
/** Il lunedi' alle 00:00 (ora locale) della settimana in cui cade `t`. */
function lunediDi(t) {
  const d = new Date(t); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}
/** La settimana ISO di `t`: anno e numero. */
function settimanaIso(t) {
  const d = new Date(t); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));   // il giovedi' della settimana
  const anno = d.getFullYear();
  const primo = new Date(anno, 0, 4);
  const n = 1 + Math.round(((d - primo) / giorno - 3 + ((primo.getDay() + 6) % 7)) / 7);
  return { anno, n };
}

/** La chiave della lega in cui cade `adesso`: 'sett:2026-W36', 'mese:2026-09', 'sempre'. */
export function chiaveLega(lega, adesso = Date.now()) {
  if (lega === 'sempre') return 'sempre';
  const d = new Date(adesso);
  if (lega === 'mese') return `mese:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const { anno, n } = settimanaIso(adesso);
  return `sett:${anno}-W${String(n).padStart(2, '0')}`;
}

/** Quando comincia e quando finisce la lega in corso, e quella prima. */
export function periodoLega(lega, adesso = Date.now()) {
  if (lega === 'sempre') return { inizio: 0, fine: Infinity, precedente: null };
  if (lega === 'mese') {
    const d = new Date(adesso);
    const inizio = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const fine = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    return { inizio, fine, precedente: chiaveLega('mese', inizio - giorno) };
  }
  const inizio = lunediDi(adesso);
  return { inizio, fine: inizio + 7 * giorno, precedente: chiaveLega('sett', inizio - giorno) };
}

/** Le organizzazioni di cui una persona fa parte: quella in cui sta, piu' le appartenenze ancora aperte. */
export function orgDiUtente(userId) {
  const u = db.users?.find?.((x) => x.id === userId);
  const ids = new Set();
  if (u?.orgId) ids.add(u.orgId);
  for (const m of db.membri || []) if (m.userId === userId && !m.uscitoIl && m.orgId) ids.add(m.orgId);
  return [...ids];
}

/** Segna una partita nelle tre leghe: resta la migliore di ognuno, e si conta quante ne ha giocate. */
function segnaInClassifica(userId, riga, adesso) {
  for (const { id: lega } of LEGHE) {
    const chiave = chiaveLega(lega, adesso);
    const tavola = db.classificaArena[chiave] || (db.classificaArena[chiave] = {});
    const prima = tavola[userId];
    const punti = puntiPartita(riga);
    const migliore = !prima || punti > prima.punti;
    tavola[userId] = {
      userId,
      punti: migliore ? punti : prima.punti,
      secondi: migliore ? riga.secondi : prima.secondi,
      uccisioni: migliore ? riga.uccisioni : prima.uccisioni,
      livello: migliore ? riga.livello : prima.livello,
      boss: migliore ? riga.boss : prima.boss,
      personaggio: migliore ? riga.personaggio : prima.personaggio,
      giocataIl: migliore ? riga.giocataIl : prima.giocataIl,
      partite: (prima?.partite || 0) + 1,
      ultimaIl: riga.giocataIl,
    };
  }
  // le leghe passate: se ne tengono poche, le piu' recenti
  for (const prefisso of ['sett:', 'mese:']) {
    const chiavi = Object.keys(db.classificaArena).filter((k) => k.startsWith(prefisso)).sort();
    while (chiavi.length > LEGHE_TENUTE + 1) delete db.classificaArena[chiavi.shift()];
  }
}

/**
 * La classifica di una lega, in una chiave data (quella in corso se non
 * si dice), per tutti o per un'organizzazione: le voci in ordine di punti,
 * con la posizione. A pari punti, chi ha fatto il punteggio prima sta sopra.
 */
export function classificaArena({ lega = 'sett', chiave = null, ambito = 'tutti', adesso = Date.now() } = {}) {
  ensureArena();
  const tavola = db.classificaArena[chiave || chiaveLega(lega, adesso)] || {};
  let voci = Object.values(tavola);
  if (ambito !== 'tutti') voci = voci.filter((v) => orgDiUtente(v.userId).includes(ambito));
  voci.sort((a, b) => b.punti - a.punti || String(a.giocataIl).localeCompare(String(b.giocataIl)));
  return voci.map((v, i) => ({ ...v, posizione: i + 1 }));
}

/** Le misure e gli sbloccati dei traguardi dell'arena di una persona. */
export function traguardiArena(userId) {
  ensureArena();
  return db.traguardiArena[userId] || { misure: misureVuote(), sbloccati: {} };
}

export function primatiArena(userId) {
  ensureArena();
  return db.primatiArena[userId] || { partite: 0, secondi: 0, uccisioni: 0, livello: 0, boss: 0, casse: 0 };
}

/**
 * Registra una partita finita e aggiorna i primati. `riassunto` e' quello
 * che produce il motore: personaggio, secondi, uccisioni, livello, seme,
 * moduli, armi (con il livello, come `freccia:3` e `anello:5+` se evoluta)
 * e quanti boss sono caduti, quante casse si sono aperte.
 */
export function registraPartitaArena(userId, grezzo) {
  ensureArena();
  if (!userId || !grezzo || typeof grezzo !== 'object' || !db.users?.some?.((u) => u.id === userId)) return null;
  const riassunto = pulisci(grezzo);
  const riga = {
    id: nuovoId('arena'),
    userId,
    personaggio: riassunto.personaggio,
    secondi: riassunto.secondi,
    uccisioni: riassunto.uccisioni,
    livello: riassunto.livello,
    seme: riassunto.seme,
    moduli: riassunto.moduli,
    armi: riassunto.armi,
    boss: riassunto.boss,
    casse: riassunto.casse,
    giocataIl: new Date().toISOString(),
  };
  db.partiteArena.push(riga);
  // a rotazione: le piu' vecchie di questa persona escono
  const sue = db.partiteArena.filter((p) => p.userId === userId);
  if (sue.length > PARTITE_TENUTE) {
    const daTogliere = new Set(sue.slice(0, sue.length - PARTITE_TENUTE).map((p) => p.id));
    db.partiteArena = db.partiteArena.filter((p) => !daTogliere.has(p.id));
  }
  const prima = primatiArena(userId);
  db.primatiArena[userId] = {
    partite: (prima.partite || 0) + 1,
    secondi: Math.max(prima.secondi || 0, riga.secondi),
    uccisioni: Math.max(prima.uccisioni || 0, riga.uccisioni),
    livello: Math.max(prima.livello || 0, riga.livello),
    boss: Math.max(prima.boss || 0, riga.boss),
    casse: Math.max(prima.casse || 0, riga.casse),
  };
  segnaInClassifica(userId, riga, Date.parse(riga.giocataIl));
  // i traguardi dell'arena: le misure si aggiornano, chi passa la soglia si sblocca con la data
  const t = traguardiArena(userId);
  const misure = aggiornaMisure(t.misure, riassunto);
  const sbloccati = { ...t.sbloccati };
  const nuoviTraguardi = [];
  for (const id of raggiunti(misure)) if (!sbloccati[id]) { sbloccati[id] = riga.giocataIl; nuoviTraguardi.push(id); }
  db.traguardiArena[userId] = { misure, sbloccati };
  save();
  return { ...riga, nuoviTraguardi };
}
