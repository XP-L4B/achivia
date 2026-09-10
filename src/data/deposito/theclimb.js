/**
 * The Climb nel deposito: la corsa in corso, e le vite finite.
 *
 * QUESTO FILE NON PASSA DA `db.js`, come `theboss.js` e `lexora.js`: lo
 * importa solo `data/theclimb.js`. Un `export *` lo attaccherebbe al
 * pacchetto principale, con il motore dietro.
 *
 * UNA CORSA SOLA PER PERSONA. Una vita e' lunga — seicento settimane — e
 * si gioca a pezzi: si chiude la pagina, si riapre domani, si ritrova la
 * settimana in cui si era. Quindi la partita in corso non vive nella
 * schermata: vive qui, riscritta **a ogni settimana giocata**, ed e' una
 * per persona. Chi ne vuole un'altra abbandona questa, e l'abbandono
 * resta scritto fra le vite finite: non e' il modo di cancellare una
 * settimana storta.
 *
 * Quello che si salva e' lo stato del motore serializzato (`serializza`):
 * seme, log, storico, tutto. Con seme e log la partita si rigioca, ed e'
 * questo che permettera' il replay «E se fossi nato altrove?» (fase 7) e
 * la verifica della classifica (fase 8) — senza server, con gli stessi
 * limiti dichiarati in `theboss.js`.
 *
 * IL PESO. Una vita intera e' ~600 righe di log e ~600 righe di storico da
 * tredici numeri: intorno ai cento kilobyte, uno solo per persona. Le vite
 * finite tengono il riassunto e basta, venti a testa.
 */

import { db, ensureTheClimb, nuovoId, save } from './nucleo';
import {
  creaPartita, scegliPercorso, serializza, deserializza, riassunto, schedeSbloccate,
} from '../../giochi/theclimb/motore/partita';
import { confronto, verificaPartita } from '../../giochi/theclimb/motore/replay';
import { epilogo } from '../../giochi/theclimb/motore/finali';
import { puntiPartita, pulisci, eVittoria, equilibrioDi, PESI } from '../../giochi/theclimb/motore/punteggio';
import { LEGHE, chiaveLega, potaLeghe } from './leghe';

export { PESI, puntiPartita };
import { backgroundById } from '../../giochi/theclimb/contenuti/background';
import { percorsoById } from '../../giochi/theclimb/contenuti/percorsi';

export const PARTITE_TENUTE_THECLIMB = 20;

const utente = (id) => db.users.find((u) => u.id === id) || null;

/** La corsa in corso di una persona, o niente. */
export function corsaClimb(userId) {
  ensureTheClimb();
  return db.corseClimb[userId] || null;
}

/**
 * Una vita nuova. Rifiuta se ce n'e' gia' una in corso: prima si abbandona
 * quella, e resta scritto.
 */
export function nuovaCorsaClimb({ da, background, percorso, seme = null, adesso = Date.now() } = {}) {
  ensureTheClimb();
  const io = utente(da);
  if (!io) return null;
  if (db.corseClimb[io.id]) return null;
  if (!backgroundById(background) || !percorsoById(percorso)) return null;

  const stato = creaPartita({ seme: seme ?? Math.floor(Math.random() * 1e9), background });
  scegliPercorso(stato, percorso);
  const corsa = {
    id: nuovoId('climb'),
    userId: io.id,
    seme: stato.seme,
    background,
    percorso,
    settimana: stato.settimana,
    motore: serializza(stato),
    creataIl: new Date(adesso).toISOString(),
    aggiornataIl: new Date(adesso).toISOString(),
  };
  db.corseClimb[io.id] = corsa;
  save();
  return corsa;
}

/** Lo stato del motore della corsa in corso, pronto da giocare. */
export function apriCorsaClimb(userId) {
  const c = corsaClimb(userId);
  return c ? deserializza(c.motore) : null;
}

/**
 * Il salvataggio: dopo ogni settimana, e dopo ogni decisione che non e'
 * una settimana (la routine, un lavoro). Se la vita e' finita, la chiude.
 */
export function salvaCorsaClimb(userId, stato, adesso = Date.now()) {
  const c = corsaClimb(userId);
  if (!c || !stato) return null;
  segnaEnciclopedia(userId, stato);
  if (stato.fase === 'finita') return chiudiCorsa(c, stato, adesso);
  c.motore = serializza(stato);
  c.settimana = stato.settimana;
  c.percorso = stato.percorso;
  c.aggiornataIl = new Date(adesso).toISOString();
  save();
  return c;
}

/** Lasciarla a meta'. Resta scritta come abbandonata. */
export function abbandonaCorsaClimb(userId, adesso = Date.now()) {
  const c = corsaClimb(userId);
  if (!c) return null;
  const stato = deserializza(c.motore);
  const r = riassunto(stato);
  return archivia(c, { ...r, esito: { causa: 'abbandono', settimana: stato.settimana, livello: r.livello } }, adesso);
}

function chiudiCorsa(c, stato, adesso) {
  /* «E se fossi nato altrove?»: si calcola una volta, qui, e resta con la
     vita finita. Cinque replay di una vita intera: qualche decimo di
     secondo, una volta per partita */
  return archivia(c, riassunto(stato), adesso, { confronto: confronto(stato), log: stato.log, seme: stato.seme, epilogo: epilogo(stato) });
}

/** Le schede sbloccate: l'unione fra tutte le vite di una persona. */
function segnaEnciclopedia(userId, stato) {
  const mie = new Set(db.enciclopediaClimb[userId] || []);
  for (const id of schedeSbloccate(stato)) mie.add(id);
  db.enciclopediaClimb[userId] = [...mie];
}

/* La guida della schermata: si vede da sola alla prima partita, e resta
   segnata per persona, cosi' non torna a ogni vita nuova. Si riapre dal
   tasto «Come funziona». */
export function tutorialClimbVisto(userId) {
  ensureTheClimb();
  return Boolean(db.tutorialClimb[userId]);
}

export function segnaTutorialClimb(userId) {
  ensureTheClimb();
  if (!userId) return;
  db.tutorialClimb[userId] = true;
  save();
}

export function enciclopediaClimb(userId) {
  ensureTheClimb();
  return db.enciclopediaClimb[userId] || [];
}

function archivia(c, r, adesso, extra = {}) {
  const partita = {
    id: nuovoId('climbp'),
    corsaId: c.id,
    userId: c.userId,
    background: c.background,
    percorso: r.percorso ?? c.percorso,
    seme: c.seme,
    riassunto: r,
    confronto: extra.confronto ?? null,
    epilogo: extra.epilogo ?? null,
    /* il log resta con la vita finita: e' quello che la classifica rigioca */
    log: extra.log ?? null,
    creataIl: c.creataIl,
    finitaIl: new Date(adesso).toISOString(),
    punti: 0,
    verificata: false,
  };
  /* la classifica: solo le vite finite davvero, non quelle lasciate a meta'.
     Si rigioca prima di scrivere — vedi la nota in cima al file */
  if (r.esito && r.esito.causa !== 'abbandono' && extra.log) registra(partita, r, extra.log, adesso);
  db.partiteClimb.push(partita);
  /* a rotazione, per persona: le piu' vecchie escono */
  const mie = db.partiteClimb.filter((p) => p.userId === c.userId);
  if (mie.length > PARTITE_TENUTE_THECLIMB) {
    const via = new Set(mie.slice(0, mie.length - PARTITE_TENUTE_THECLIMB).map((p) => p.id));
    db.partiteClimb = db.partiteClimb.filter((p) => !via.has(p.id));
  }
  delete db.corseClimb[c.userId];
  save();
  return partita;
}

/* ═══ La classifica ═══ */

/**
 * Sei divisioni con nomi loro — quelli della scala di carriera li ha gia'
 * The Boss — e le stesse regole: si sale col quinto migliore della
 * stagione (un mese), si scende col quinto peggiore, chi sparisce per due
 * stagioni scende.
 */
export const DIVISIONI_CLIMB = [
  { id: 'base', nome: 'Base' },
  { id: 'versante', nome: 'Versante' },
  { id: 'cresta', nome: 'Cresta' },
  { id: 'parete', nome: 'Parete' },
  { id: 'vetta', nome: 'Vetta' },
  { id: 'cima', nome: 'Cima' },
];
export const LEGHE_CLIMB = LEGHE;
export const QUOTA_PROMOZIONE_CLIMB = 0.2;
export const STAGIONI_INATTIVO_CLIMB = 2;
export const TEMI_CLIMB = [
  { id: 'principale', nome: 'Principale' },
  { id: 'integrita', nome: 'Integrità' },
  { id: 'equilibrio', nome: 'Vita equilibrata' },
  { id: 'velocita', nome: 'Velocità' },
];

export function divisioneClimbDi(userId) {
  ensureTheClimb();
  return db.divisioniClimb[userId] || { divisione: 'base', stagione: null, inattive: 0 };
}

function registra(partita, r, log, adesso) {
  const pulito = pulisci(r);
  const prova = verificaPartita(r, log);
  partita.verificata = prova.ok;
  partita.perche = prova.ok ? null : prova.perche;
  partita.punti = prova.ok ? puntiPartita(pulisci(prova.riassunto)) : puntiPartita(pulito);
  /* una vita non verificata resta con la persona, con scritto perche', e
     non entra in classifica: e' l'unica difesa che c'e' senza un server */
  if (!prova.ok) return;
  if (!db.divisioniClimb[partita.userId]) db.divisioniClimb[partita.userId] = { divisione: 'base', stagione: null, inattive: 0 };
  chiudiStagioneClimb(adesso);
  const riga = {
    userId: partita.userId, partitaId: partita.id, punti: partita.punti,
    background: pulito.background, percorso: pulito.percorso, causa: pulito.esito?.causa ?? null,
    settimane: pulito.settimane, livelloMassimo: pulito.livelloMassimo, integrita: pulito.integrita,
    equilibrio: equilibrioDi(pulito), vittoria: eVittoria(pulito), giocataIl: partita.finitaIl,
  };
  for (const { id: lega } of LEGHE) {
    const chiave = chiaveLega(lega, adesso);
    const tavola = db.classificaClimb[chiave] || (db.classificaClimb[chiave] = {});
    const prima = tavola[partita.userId];
    const migliore = !prima || riga.punti > prima.punti;
    tavola[partita.userId] = { ...(migliore ? riga : prima), partite: (prima?.partite || 0) + 1 };
  }
  potaLeghe(db.classificaClimb);
  const p = db.primatiClimb[partita.userId] || { partite: 0, vittorie: 0, puntiMax: 0, livelloMax: 0, settimaneMin: null };
  db.primatiClimb[partita.userId] = {
    partite: p.partite + 1,
    vittorie: p.vittorie + (riga.vittoria ? 1 : 0),
    puntiMax: Math.max(p.puntiMax, riga.punti),
    livelloMax: Math.max(p.livelloMax, riga.livelloMassimo),
    settimaneMin: riga.vittoria ? Math.min(p.settimaneMin ?? 9999, riga.settimane) : p.settimaneMin,
  };
}

/** La stagione: si chiude pigramente, quando qualcuno guarda o finisce. */
export function chiudiStagioneClimb(adesso = Date.now()) {
  ensureTheClimb();
  const stagioneOra = chiaveLega('mese', adesso);
  if (db.stagioneClimb === stagioneOra) return null;
  const precedente = db.stagioneClimb;
  db.stagioneClimb = stagioneOra;
  if (!precedente) { save(); return null; }
  const tavola = db.classificaClimb[precedente] || {};
  const perDivisione = {};
  for (const [userId, voce] of Object.entries(tavola)) {
    const d = divisioneClimbDi(userId).divisione;
    (perDivisione[d] = perDivisione[d] || []).push({ userId, punti: voce.punti });
  }
  const mosse = [];
  for (const div of DIVISIONI_CLIMB) {
    const gente = (perDivisione[div.id] || []).sort((a, b) => b.punti - a.punti);
    if (gente.length < 3) continue;
    const quanti = Math.max(1, Math.round(gente.length * QUOTA_PROMOZIONE_CLIMB));
    const i = DIVISIONI_CLIMB.findIndex((x) => x.id === div.id);
    for (const g of gente.slice(0, quanti)) if (i < DIVISIONI_CLIMB.length - 1) mosse.push([g.userId, DIVISIONI_CLIMB[i + 1].id]);
    for (const g of gente.slice(-quanti)) if (i > 0) mosse.push([g.userId, DIVISIONI_CLIMB[i - 1].id]);
  }
  for (const userId of Object.keys(db.divisioniClimb)) {
    if (tavola[userId]) { db.divisioniClimb[userId].inattive = 0; continue; }
    const d = db.divisioniClimb[userId];
    d.inattive = (d.inattive || 0) + 1;
    if (d.inattive >= STAGIONI_INATTIVO_CLIMB) {
      const i = DIVISIONI_CLIMB.findIndex((x) => x.id === d.divisione);
      if (i > 0) { d.divisione = DIVISIONI_CLIMB[i - 1].id; d.inattive = 0; }
    }
  }
  for (const [userId, divisione] of mosse) db.divisioniClimb[userId] = { ...divisioneClimbDi(userId), divisione, stagione: precedente, inattive: 0 };
  save();
  return { stagione: precedente, mosse: mosse.length };
}

/**
 * La classifica, con i filtri del brief: lega, divisione, background,
 * percorso (universita' o no), e il tema — principale, integrita' (chi ha
 * l'integrita' a cento), vita equilibrata (fra chi e' arrivato: salute +
 * relazioni + felicita'), velocita' (fra chi e' arrivato: meno settimane).
 */
export function classificaClimb({ lega = 'sett', divisione = null, background = null, percorso = null, tema = 'principale', adesso = Date.now() } = {}) {
  ensureTheClimb();
  chiudiStagioneClimb(adesso);
  const tavola = db.classificaClimb[chiaveLega(lega, adesso)] || {};
  let voci = Object.values(tavola);
  if (divisione) voci = voci.filter((v) => divisioneClimbDi(v.userId).divisione === divisione);
  if (background) voci = voci.filter((v) => v.background === background);
  if (percorso === 'universita') voci = voci.filter((v) => v.percorso === 'universita');
  else if (percorso === 'altro') voci = voci.filter((v) => v.percorso !== 'universita');
  if (tema === 'integrita') voci = voci.filter((v) => v.integrita >= 100);
  if (tema === 'equilibrio' || tema === 'velocita') voci = voci.filter((v) => v.vittoria);
  const ordina = tema === 'equilibrio' ? (a, b) => b.equilibrio - a.equilibrio || b.punti - a.punti
    : tema === 'velocita' ? (a, b) => a.settimane - b.settimane || b.punti - a.punti
      : (a, b) => b.punti - a.punti || String(a.giocataIl).localeCompare(String(b.giocataIl));
  voci.sort(ordina);
  return voci.map((v, i) => ({ ...v, posizione: i + 1, divisione: divisioneClimbDi(v.userId).divisione }));
}

export function primatiClimb(userId) {
  ensureTheClimb();
  return db.primatiClimb[userId] || { partite: 0, vittorie: 0, puntiMax: 0, livelloMax: 0, settimaneMin: null };
}

/** Il profilo pubblico di una corsa in classifica: chiunque puo' aprirlo e vedere il percorso. */
export function partitaClimb(id) {
  ensureTheClimb();
  const p = db.partiteClimb.find((x) => x.id === id);
  if (!p) return null;
  const { log, ...senzaLog } = p;
  void log;
  return senzaLog;
}

/** Le vite finite di una persona, dall'ultima. */
export function partiteClimb(userId) {
  ensureTheClimb();
  return db.partiteClimb.filter((p) => p.userId === userId).slice().reverse();
}
