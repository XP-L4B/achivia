/**
 * Lexora nel deposito: le sfide, le partite, le statistiche.
 *
 * Qui sta la sola porta da cui una mossa entra in una partita. Il client
 * manda gli id delle tessere che ha toccato e niente altro: non la parola,
 * non i punti, non se ha completato l'obiettivo. Il motore rifa' il conto
 * dallo stato che sta nel deposito e scrive il risultato. Una mossa che
 * arrivasse con dentro «parola: FANTASMA, punti: 9000» perderebbe quei
 * campi in `pulisciMossa` prima ancora di essere guardata.
 *
 * Le partite finite si tengono a rotazione, le ultime venti per persona,
 * per la stessa ragione dell'arena: il deposito e' piccolo. Le statistiche
 * e i traguardi stanno a parte proprio perche' le partite girano.
 *
 * Lexora non paga. Non muove crediti, non da' esperienza, non tocca
 * gli achievement dei profili di Achivia: i suoi traguardi sono un profilo
 * a se' (`traguardiLexora`), come quelli dell'arena. Il livello di un
 * account dice quanto una persona ha lavorato, e giocare non e' lavorare.
 *
 * ─── Una nota su cosa vuol dire «1vs1» qui ───
 *
 * Il deposito e' il localStorage del browser: due persone su due computer
 * diversi non vedono le stesse righe. Quindi una sfida si gioca in due
 * modi, e tutti e due sono veri qui dentro:
 *
 *   - contro il bot, subito, con tre difficolta';
 *   - contro una persona di Achivia, a turni: la sfida resta aperta nel
 *     deposito e ognuno gioca i suoi turni quando tocca a lui.
 *
 * Il modello dei dati e' gia' quello che servirebbe a un server — una riga
 * di sfida con dentro lo stato del motore, e le mosse che entrano da una
 * funzione sola — quindi il giorno che ci sara' un server si sostituisce
 * il corpo di queste funzioni con una chiamata, e le schermate non
 * cambiano di una riga.
 */

import { db, ensureLexora, nuovoId, save } from './nucleo';
import { chiaveLega, LEGHE, orgDiUtente } from './arena';
import { creaPartita, gioca, serializza, deserializza, fotografia, riassunto } from '../../giochi/lexora/motore/partita';
import { mossaBot } from '../../giochi/lexora/motore/bot';
import { linguaById, LINGUE } from '../../giochi/lexora/contenuti/lingue/registro';
import { aggiornaMisure, raggiunti, misureVuote } from '../../giochi/lexora/contenuti/traguardi';
import { configDiLivello, ULTIMO_LIVELLO } from '../../giochi/lexora/contenuti/config';
import { fuoriDalleOrg } from '../permessi';

/* Il nome porta il gioco perche' `data/db.js` riespone tutti i depositi
   insieme: due `PARTITE_TENUTE` diversi si annullerebbero a vicenda, e il
   valore sparirebbe da tutte e due senza che nessuno se ne accorga. */
export const PARTITE_TENUTE_LEXORA = 20;
export const LIVELLI_BOT = ['facile', 'medio', 'difficile'];

const ID_LINGUE = new Set(LINGUE.map((l) => l.id));
const utente = (id) => db.users?.find?.((u) => u.id === id) || null;
const nomeDi = (u) => u?.name || u?.nome || 'Giocatore';

/* ─── Quello che accettiamo da fuori ─── */

/**
 * La mossa come la accettiamo: il tipo, e per una parola gli id delle
 * tessere. Tutto il resto — la parola, i punti, l'obiettivo — non passa,
 * perche' e' il motore a produrlo.
 */
export function pulisciMossa(grezza) {
  const m = grezza && typeof grezza === 'object' ? grezza : {};
  if (m.tipo === 'tentativo') {
    /* La parola tentata e' l'unica cosa che chi gioca puo' dire. I colori
       li decide il motore confrontandola con la segreta, e i punti li
       conta il motore: un `esito` o un `punti` scritti nella mossa non
       arrivano nemmeno alla porta. Trentadue caratteri sono piu' del
       doppio della parola piu' lunga che esista nei dizionari: serve solo
       a non farsi passare un romanzo. */
    return { tipo: 'tentativo', parola: String(m.parola ?? '').slice(0, 32) };
  }
  /* «continua» riprende dopo la pausa fra una parola e l'altra: non porta
     niente con se', e' solo un «ho letto». Senza questa riga finiva fra le
     mosse ignote e la prova restava ferma sull'intervallo per sempre. */
  if (m.tipo === 'passa' || m.tipo === 'scaduto' || m.tipo === 'continua') return { tipo: m.tipo };
  return { tipo: 'ignota' };
}

/* ─── Le sfide ─── */

export function sfideLexora(userId) {
  ensureLexora();
  return db.sfideLexora.filter((s) => s.da === userId || s.a === userId);
}

export function sfidaLexora(id) {
  ensureLexora();
  return db.sfideLexora.find((s) => s.id === id) || null;
}

/** Le sfide che aspettano una risposta da questa persona. */
export const invitiLexora = (userId) =>
  sfideLexora(userId).filter((s) => s.stato === 'invitata' && s.a === userId);

/** Le sfide in corso in cui tocca a questa persona. */
export function turniTuoiLexora(userId) {
  return sfideLexora(userId).filter((s) => {
    if (s.stato !== 'in corso') return false;
    return s.motore?.giocatori?.[s.motore.diChi]?.userId === userId;
  });
}

/**
 * Chi si puo' sfidare: le persone delle organizzazioni di cui si fa parte.
 *
 * Restano fuori gli account che stanno fuori dalle organizzazioni — il
 * negozio, l'osservatorio — che non hanno un profilo di gioco e non
 * c'entrano niente con una sfida a parole.
 */
export function avversariLexora(userId) {
  ensureLexora();
  const mie = new Set(orgDiUtente(userId));
  return (db.users || [])
    .filter((u) => u.id !== userId && !fuoriDalleOrg(u.role) && u.role !== 'admin')
    .filter((u) => orgDiUtente(u.id).some((o) => mie.has(o)))
    .map((u) => ({ id: u.id, nome: nomeDi(u) }));
}

/**
 * Apre una sfida. Contro il bot parte subito; contro una persona resta
 * invitata finche' l'altro non accetta.
 *
 * Il seme si sceglie qui e resta nella riga: due partite con lo stesso
 * seme sono la stessa partita, ed e' quello che permette di rigiocarla per
 * capire un punteggio.
 */
export function creaSfidaLexora({ da, a = null, lingua = 'it', bot = null, seme = null, adesso = Date.now() } = {}) {
  ensureLexora();
  const io = utente(da);
  if (!io) return null;
  const livelloBot = LIVELLI_BOT.includes(bot) ? bot : null;
  const sfidato = livelloBot ? null : utente(a);
  if (!livelloBot && !sfidato) return null;
  if (sfidato && sfidato.id === io.id) return null;
  const linguaId = ID_LINGUE.has(lingua) ? lingua : 'it';

  const giocatori = [
    { userId: io.id, nome: nomeDi(io) },
    livelloBot
      ? { userId: `bot:${livelloBot}`, nome: `Bot ${livelloBot}`, bot: livelloBot }
      : { userId: sfidato.id, nome: nomeDi(sfidato) },
  ];
  const stato = creaPartita({ lingua: linguaId, seme: seme ?? Math.floor(Math.random() * 1e9), giocatori, adesso });
  const riga = {
    id: nuovoId('lex'),
    lingua: linguaId,
    seme: stato.seme,
    da: io.id,
    a: livelloBot ? null : sfidato.id,
    bot: livelloBot,
    stato: livelloBot ? 'in corso' : 'invitata',
    motore: serializza(stato),
    creataIl: new Date(adesso).toISOString(),
    aggiornataIl: new Date(adesso).toISOString(),
    partitaId: null,
  };
  db.sfideLexora.push(riga);
  potaSfide();
  save();
  return riga;
}

/**
 * La prova in solitario: un livello, un giocatore, nessun avversario.
 *
 * Prima il «giocatore singolo» era una sfida contro un bot, e la
 * difficolta' era quanto il bot sbagliava. Ma un indovinello non e' una
 * gara: chi ti sta accanto non rende la parola piu' difficile da trovare.
 * Adesso si gioca contro se stessi e contro l'orologio, e quello che si
 * vince e' il livello dopo.
 *
 * Non entra in classifica, e non e' una dimenticanza: la classifica
 * confronta partite fra persone, e un livello facile rigiocato dieci volte
 * ci finirebbe sopra senza aver battuto nessuno. Il premio della prova e'
 * la prova stessa.
 */
export function creaProvaLexora({ da, lingua = 'it', livello = 1, seme = null, adesso = Date.now() } = {}) {
  ensureLexora();
  const io = utente(da);
  if (!io) return null;
  const linguaId = ID_LINGUE.has(lingua) ? lingua : 'it';
  const n = Math.max(1, Math.min(ULTIMO_LIVELLO, Math.round(Number(livello) || 1)));
  /* Non si salta la fila: si puo' rigiocare quello che si e' gia' aperto,
     non aprirne uno con l'indirizzo scritto a mano. */
  if (n > livelloLexora(io.id).aperto) return null;

  const stato = creaPartita({
    lingua: linguaId,
    seme: seme ?? Math.floor(Math.random() * 1e9),
    giocatori: [{ userId: io.id, nome: nomeDi(io) }],
    config: configDiLivello(n),
    modo: 'prova',
    adesso,
  });
  const riga = {
    id: nuovoId('lex'),
    lingua: linguaId,
    seme: stato.seme,
    da: io.id,
    a: null,
    bot: null,
    prova: n,
    stato: 'in corso',
    motore: serializza(stato),
    creataIl: new Date(adesso).toISOString(),
    aggiornataIl: new Date(adesso).toISOString(),
    partitaId: null,
  };
  db.sfideLexora.push(riga);
  potaSfide();
  save();
  return riga;
}

/**
 * Fin dove sei arrivato nella prova.
 *
 *   aperto    il livello piu' alto che puoi giocare
 *   migliori  il punteggio migliore per livello, per chi vuole rifarli
 *   finita    hai passato l'ultimo
 */
export function livelloLexora(userId) {
  ensureLexora();
  const p = db.proveLexora[userId] || { aperto: 1, migliori: {} };
  return { ...p, aperto: Math.max(1, Math.min(ULTIMO_LIVELLO, p.aperto || 1)), finita: (p.aperto || 1) > ULTIMO_LIVELLO };
}

/** L'altro accetta: la partita comincia adesso, e il turno parte adesso. */
export function accettaSfidaLexora(id, userId, adesso = Date.now()) {
  const s = sfidaLexora(id);
  if (!s || s.stato !== 'invitata' || s.a !== userId) return null;
  s.stato = 'in corso';
  // La scadenza del turno riparte da quando si accetta: l'invito puo'
  // essere stato li' per un giorno, e non e' colpa di chi gioca.
  const stato = deserializza(s.motore);
  stato.scadenza = adesso + stato.config.turno.secondi * 1000;
  s.motore = serializza(stato);
  s.aggiornataIl = new Date(adesso).toISOString();
  save();
  return s;
}

export function rifiutaSfidaLexora(id, userId) {
  const s = sfidaLexora(id);
  if (!s || s.stato !== 'invitata' || s.a !== userId) return null;
  s.stato = 'rifiutata';
  s.aggiornataIl = new Date().toISOString();
  save();
  return s;
}

/** Si abbandona: la partita si chiude e vince l'altro, coi punti che ha. */
export function abbandonaSfidaLexora(id, userId, adesso = Date.now()) {
  const s = sfidaLexora(id);
  if (!s || (s.stato !== 'in corso' && s.stato !== 'invitata')) return null;
  if (s.da !== userId && s.a !== userId) return null;
  s.stato = 'abbandonata';
  s.aggiornataIl = new Date(adesso).toISOString();
  save();
  return s;
}

/**
 * Ci si siede al tavolo: se il turno e' scaduto mentre la pagina era
 * chiusa, riparte da adesso.
 *
 * I venti secondi misurano il tempo che ci si mette a pensare stando al
 * tavolo. Con una sfida a una persona, fra un turno e l'altro puo'
 * passare un giorno: chi apre la partita troverebbe il tempo gia' finito
 * e perderebbe il turno senza aver visto il campo, che non e' una regola,
 * e' un incidente.
 *
 * Una volta per turno, pero'. Altrimenti chi non trova la parola aspetta
 * che scada, ricarica, e ricomincia con venti secondi nuovi quante volte
 * vuole: la seconda scadenza dello stesso turno vale.
 */
export function apriTavoloLexora(id, userId, adesso = Date.now()) {
  const s = sfidaLexora(id);
  if (!s || s.stato !== 'in corso') return null;
  const stato = deserializza(s.motore);
  if (stato.giocatori[stato.diChi]?.userId !== userId) return null;
  if (stato.scadenza > adesso) return null;
  if (s.ripresa === stato.turno) return null;
  stato.scadenza = adesso + stato.config.turno.secondi * 1000;
  s.motore = serializza(stato);
  s.ripresa = stato.turno;
  s.aggiornataIl = new Date(adesso).toISOString();
  save();
  return { ...fotografia(stato, adesso, userId), sfidaId: s.id, stato: s.stato, bot: s.bot };
}

/** La partita come la vede chi guarda: il campo, l'obiettivo, i punti, il tempo. */
export function fotografiaSfida(id, adesso = Date.now(), perChi = null) {
  const s = sfidaLexora(id);
  if (!s) return null;
  const stato = deserializza(s.motore);
  return { ...fotografia(stato, adesso, perChi), sfidaId: s.id, stato: s.stato, bot: s.bot };
}

/* ─── La mossa ─── */

/**
 * La sola porta. Chi gioca dice che cosa ha toccato; il motore decide che
 * cosa succede, e il deposito scrive lo stato nuovo.
 */
export function giocaSfidaLexora(id, userId, mossaGrezza, adesso = Date.now()) {
  const s = sfidaLexora(id);
  if (!s) return { ok: false, errore: 'Questa sfida non esiste.' };
  if (s.stato !== 'in corso') return { ok: false, errore: 'Questa sfida non è in corso.' };
  const stato = deserializza(s.motore);
  const chi = stato.giocatori[stato.diChi];
  if (chi.userId !== userId) return { ok: false, errore: 'Non è il tuo turno.' };
  return applica(s, stato, pulisciMossa(mossaGrezza), adesso);
}

/**
 * Il turno del bot. Non passa da `giocaSfidaLexora` perche' non c'e'
 * nessun userId da controllare: e' il motore che gioca contro se stesso, e
 * la mossa che produce e' fatta di id di tessere come tutte le altre.
 */
export function giocaBotLexora(id, adesso = Date.now()) {
  const s = sfidaLexora(id);
  if (!s || s.stato !== 'in corso') return null;
  const stato = deserializza(s.motore);
  const chi = stato.giocatori[stato.diChi];
  if (!chi.bot) return null;
  /* Se col campo di adesso non trova niente, passa: un bot che non sa che
     cosa giocare non deve bloccare la partita di chi ha davanti. */
  return applica(s, stato, mossaBot(stato, chi.bot) || { tipo: 'passa' }, adesso);
}

function applica(s, stato, mossa, adesso) {
  const esito = gioca(stato, mossa, adesso);
  s.motore = serializza(stato);
  s.aggiornataIl = new Date(adesso).toISOString();
  if (stato.fase === 'finita') chiudi(s, stato, adesso);
  save();
  return esito;
}

/* ─── La fine ─── */

/** Le statistiche di una persona, anche di chi non ha ancora giocato. */
export function statisticheLexora(userId) {
  ensureLexora();
  return db.statisticheLexora[userId] || {
    partite: 0, vittorie: 0, sconfitte: 0, pareggi: 0,
    punti: 0, indovinate: 0, tentativi: 0, scoperte: 0,
    migliorPunteggio: 0, migliorParola: null, miglioreColpo: 0,
    perLingua: {},
  };
}

/** Le misure e gli sbloccati dei traguardi di Lexora di una persona. */
export function traguardiLexora(userId) {
  ensureLexora();
  return db.traguardiLexora[userId] || { misure: misureVuote(), sbloccati: {} };
}

/** Le partite finite di una persona, le piu' recenti per prime. */
export function partiteLexora(userId) {
  ensureLexora();
  return db.partiteLexora.filter((p) => p.giocatori.some((g) => g.userId === userId)).reverse();
}

/**
 * Chiude una partita: la scrive, aggiorna statistiche, traguardi e
 * classifica di chi e' una persona vera. Il bot non ha un profilo, quindi
 * di lui non si segna niente.
 */
function chiudi(s, stato, adesso) {
  const r = riassunto(stato);
  if (r.esito?.prova) return chiudiProva(s, stato, r, adesso);
  const partita = {
    id: nuovoId('lexp'),
    sfidaId: s.id,
    lingua: r.lingua,
    seme: r.seme,
    turni: r.turni,
    esito: r.esito,
    giocatori: r.giocatori,
    giocataIl: new Date(adesso).toISOString(),
  };
  db.partiteLexora.push(partita);
  s.stato = 'finita';
  s.partitaId = partita.id;

  const [a, b] = r.giocatori;
  for (const [g, avv] of [[a, b], [b, a]]) {
    if (!g.userId || g.bot) continue;
    if (!utente(g.userId)) continue;
    const vinta = r.esito.vincitore === g.userId;
    const pareggio = Boolean(r.esito.pareggio);
    segnaStatistiche(g, avv, { vinta, pareggio, lingua: r.lingua });
    segnaTraguardi(g, { vinta, pareggio, lingua: r.lingua, margine: g.punti - avv.punti }, partita.giocataIl);
    segnaClassifica(g.userId, g.punti, vinta, adesso);
  }

  // a rotazione: le partite piu' vecchie di chi ne ha troppe escono
  for (const g of r.giocatori) {
    if (!g.userId || g.bot) continue;
    const sue = db.partiteLexora.filter((p) => p.giocatori.some((x) => x.userId === g.userId));
    if (sue.length > PARTITE_TENUTE_LEXORA) {
      const via = new Set(sue.slice(0, sue.length - PARTITE_TENUTE_LEXORA).map((p) => p.id));
      db.partiteLexora = db.partiteLexora.filter((p) => !via.has(p.id));
    }
  }
  potaSfide();
  return partita;
}

/**
 * La fine di una prova.
 *
 * Non c'e' un avversario, quindi non c'e' niente da vincere o da perdere:
 * la partita si scrive, le statistiche crescono per quello che e'
 * successo davvero — parole indovinate, tentativi, scoperte — e vittorie e
 * sconfitte restano ferme, perche' contro nessuno non si vince e non si
 * perde.
 *
 * Quello che cambia e' il livello: chi passa apre il successivo, e il
 * livello aperto non si richiude piu'.
 */
function chiudiProva(s, stato, r, adesso) {
  const partita = {
    id: nuovoId('lexp'),
    sfidaId: s.id,
    lingua: r.lingua,
    seme: r.seme,
    turni: r.turni,
    esito: r.esito,
    giocatori: r.giocatori,
    giocataIl: new Date(adesso).toISOString(),
  };
  db.partiteLexora.push(partita);
  s.stato = 'finita';
  s.partitaId = partita.id;

  const g = r.giocatori[0];
  if (g?.userId && utente(g.userId)) {
    const st = { ...statisticheLexora(g.userId) };
    st.partite += 1;
    st.punti += g.punti;
    st.indovinate += g.indovinate;
    st.tentativi += g.tentativi;
    st.scoperte += g.scoperte.length;
    st.migliorPunteggio = Math.max(st.migliorPunteggio, g.punti);
    if (g.minimoTentativi > 0) {
      st.miglioreColpo = st.miglioreColpo > 0 ? Math.min(st.miglioreColpo, g.minimoTentativi) : g.minimoTentativi;
    }
    if (g.migliore && (!st.migliorParola || g.migliore.punti > st.migliorParola.punti)) {
      st.migliorParola = { parola: g.migliore.parola, punti: g.migliore.punti, tentativi: g.migliore.tentativi, lingua: r.lingua };
    }
    db.statisticheLexora[g.userId] = st;

    /* I traguardi guardano quello che si e' fatto, non contro chi: una
       parola trovata al secondo colpo vale uguale da soli. */
    segnaTraguardi(g, { vinta: false, pareggio: false, lingua: r.lingua, margine: 0 }, partita.giocataIl);

    const prima = livelloLexora(g.userId);
    const n = r.esito.livello || 1;
    const migliori = { ...prima.migliori, [n]: Math.max(prima.migliori[n] || 0, g.punti) };
    const aperto = r.esito.superato ? Math.max(prima.aperto, Math.min(ULTIMO_LIVELLO, n + 1)) : prima.aperto;
    db.proveLexora[g.userId] = { aperto, migliori };
  }

  potaSfide();
  return partita;
}

function segnaStatistiche(g, avv, { vinta, pareggio, lingua }) {
  const st = { ...statisticheLexora(g.userId) };
  st.partite += 1;
  if (vinta) st.vittorie += 1;
  else if (pareggio) st.pareggi += 1;
  else st.sconfitte += 1;
  st.punti += g.punti;
  st.indovinate += g.indovinate;
  st.tentativi += g.tentativi;
  st.scoperte += g.scoperte.length;
  st.migliorPunteggio = Math.max(st.migliorPunteggio, g.punti);
  /* Il colpo migliore: il numero piu' basso di tentativi con cui ha
     trovato una parola. Zero vuol dire che non ne ha ancora trovata
     nessuna, e allora vince il numero nuovo qualunque sia. */
  if (g.minimoTentativi > 0) {
    st.miglioreColpo = st.miglioreColpo > 0 ? Math.min(st.miglioreColpo, g.minimoTentativi) : g.minimoTentativi;
  }
  if (g.migliore && (!st.migliorParola || g.migliore.punti > st.migliorParola.punti)) {
    st.migliorParola = { parola: g.migliore.parola, punti: g.migliore.punti, tentativi: g.migliore.tentativi, lingua };
  }
  const perLingua = { ...(st.perLingua || {}) };
  const l = { partite: 0, vittorie: 0, punti: 0, ...(perLingua[lingua] || {}) };
  l.partite += 1; if (vinta) l.vittorie += 1; l.punti += g.punti;
  perLingua[lingua] = l;
  st.perLingua = perLingua;
  db.statisticheLexora[g.userId] = st;
}

function segnaTraguardi(g, { vinta, pareggio, lingua, margine }, quando) {
  const t = traguardiLexora(g.userId);
  const misure = aggiornaMisure(t.misure, {
    vinta, pareggio, lingua, margine,
    punti: g.punti,
    indovinate: g.indovinate,
    tentativi: g.tentativi,
    scoperte: g.scoperte.length,
    minimoTentativi: g.minimoTentativi,
    paroleTotali: g.storia.length,
    duetentativi: g.storia.filter((x) => x.indovinata && x.tentativi <= 2).length,
    lettereMassime: g.storia.reduce((m, x) => (x.indovinata ? Math.max(m, x.parola.length) : m), 0),
  });
  const sbloccati = { ...t.sbloccati };
  for (const id of raggiunti(misure)) if (!sbloccati[id]) sbloccati[id] = quando;
  db.traguardiLexora[g.userId] = { misure, sbloccati };
}

/* ─── La classifica ─── */

/** Quante leghe passate si tengono, oltre a quella in corso. */
const LEGHE_TENUTE = 4;

/**
 * Le leghe sono le stesse dell'arena — settimana, mese, di sempre — e le
 * chiavi si calcolano con la stessa funzione: due calendari diversi nello
 * stesso prodotto sarebbero due modi di dire «questa settimana».
 */
function segnaClassifica(userId, punti, vinta, adesso) {
  for (const { id: lega } of LEGHE) {
    const chiave = chiaveLega(lega, adesso);
    const tavola = db.classificaLexora[chiave] || (db.classificaLexora[chiave] = {});
    const prima = tavola[userId];
    tavola[userId] = {
      userId,
      punti: Math.max(prima?.punti || 0, punti),
      vittorie: (prima?.vittorie || 0) + (vinta ? 1 : 0),
      partite: (prima?.partite || 0) + 1,
      ultimaIl: new Date(adesso).toISOString(),
      giocataIl: punti > (prima?.punti || 0) || !prima ? new Date(adesso).toISOString() : prima.giocataIl,
    };
  }
  for (const prefisso of ['sett:', 'mese:']) {
    const chiavi = Object.keys(db.classificaLexora).filter((k) => k.startsWith(prefisso)).sort();
    while (chiavi.length > LEGHE_TENUTE + 1) delete db.classificaLexora[chiavi.shift()];
  }
}

/** La classifica di una lega, per tutti o per un'organizzazione. */
export function classificaLexora({ lega = 'sett', chiave = null, ambito = 'tutti', adesso = Date.now() } = {}) {
  ensureLexora();
  const tavola = db.classificaLexora[chiave || chiaveLega(lega, adesso)] || {};
  let voci = Object.values(tavola);
  if (ambito !== 'tutti') voci = voci.filter((v) => orgDiUtente(v.userId).includes(ambito));
  voci.sort((a, b) => b.punti - a.punti || b.vittorie - a.vittorie || String(a.giocataIl).localeCompare(String(b.giocataIl)));
  return voci.map((v, i) => ({ ...v, posizione: i + 1 }));
}

/* ─── La manutenzione ─── */

const GIORNO = 24 * 3600 * 1000;

/**
 * Le sfide chiuse non servono piu': la partita finita sta nella sua riga.
 * Si tengono un giorno, il tempo di leggere l'esito e chiedere la
 * rivincita, e poi vanno via. Anche gli inviti mai risposti scadono, dopo
 * una settimana: una sfida di un mese fa non la vuole piu' nessuno.
 */
function potaSfide() {
  const ora = Date.now();
  db.sfideLexora = db.sfideLexora.filter((s) => {
    const eta = ora - Date.parse(s.aggiornataIl || s.creataIl || 0);
    if (s.stato === 'finita' || s.stato === 'rifiutata' || s.stato === 'abbandonata') return eta < GIORNO;
    if (s.stato === 'invitata') return eta < 7 * GIORNO;
    return true;
  });
}

/** La lingua di una sfida, per chi deve scriverne il nome. */
export const linguaSfida = (s) => linguaById(s?.lingua);
