/**
 * The Boss nel deposito: le partite, i primati, la classifica, le divisioni
 * e la telemetria.
 *
 * QUESTO FILE NON PASSA DA `db.js`. Chi lo vuole lo importa da qui, e lo fa
 * solo `data/theboss.js`. Un `export *` lo attaccherebbe a `db.js`, che
 * importano tutte le schermate dell'app, e con lui il motore e la banca dei
 * testi — nel pacchetto che scarica chiunque apra Achivia, anche chi non
 * gioca. E' la stessa ragione per cui non ci passa nemmeno Lexora.
 *
 * QUELLO CHE QUESTO CODICE NON PUO' FARE, e va detto invece che nascosto:
 * **non c'e' un server**. Achivia e' un'applicazione statica con un
 * deposito su `localStorage`, quindi il punteggio lo scrive il client, ed e'
 * il client stesso a controllarlo. Il controllo che c'e' — rigiocare la
 * partita dal seme e dalle decisioni e confrontare il risultato —
 * inciampa chi modifica il punteggio a mano, e non ferma chi apre la
 * console del browser. E' lo stesso livello di difesa degli altri due
 * giochi, dichiarato invece che sottinteso. La validazione vera vuole un
 * server che rigiochi la partita, ed e' scritta e pronta: `verificaPartita`
 * gira gia' qui e girerebbe identica la' — e' lo stesso motore.
 *
 * Le partite si tengono a rotazione, venti per persona: il deposito ha
 * cinque megabyte scarsi in tutto e le decisioni di una partita sono
 * cinquecento righe.
 */

import { db, ensureTheBoss, nuovoId, save } from './nucleo';
import {
  creaPartita, iniziaGiornata, richiestaCorrente, decidi, chiudiGiornata,
  prossimoGiorno, riassunto,
} from '../../giochi/theboss/motore/partita';
import { PARTITA } from '../../giochi/theboss/contenuti/bilancio';

export const PARTITE_TENUTE_THEBOSS = 20;

/* ═══ Il punteggio ═══ */

/**
 * Come si fanno i punti.
 *
 * Quattro voci, e i pesi rispondono a una domanda sola: che cosa vogliamo
 * che il giocatore insegua? Non la cassa — chi accumula monete licenziando
 * tutti ha giocato male e non deve stare in cima. Non la sola
 * sopravvivenza — chi resta immobile a fare niente non ha fatto niente.
 *
 * Quindi: **i giorni** pesano piu' di tutto (arrivare in fondo e' il gioco),
 * la **produttivita' media** viene subito dopo (e' il segno che l'azienda
 * lavorava davvero), il **fatturato medio** conta ma poco (dipende molto
 * dagli eventi, che non hai scelto tu), e la **cassa finale** conta
 * pochissimo (e' un avanzo, non un merito). Il premio della vittoria e'
 * grosso e a gradino: fra chi arriva al cinquantesimo e chi si ferma al
 * quarantanovesimo ci deve essere un salto, perche' e' l'unica cosa che il
 * gioco chiede davvero.
 */
export const PESI = { giorno: 40, produttivita: 12, fatturato: 0.1, cassa: 0.02, vittoria: 1500 };

export const puntiPartita = (r) => Math.round(
  r.giorni * PESI.giorno
  + r.produttivitaMedia * PESI.produttivita
  + r.fatturatoMedio * PESI.fatturato
  + Math.max(0, r.cassaFinale) * PESI.cassa
  + (r.vinta ? PESI.vittoria : 0),
);

/* ═══ Quello che accettiamo di salvare ═══ */

const intero = (v, tetto, minimo = 0) => Math.min(tetto, Math.max(minimo, Math.round(Number(v) || 0)));
const decimale = (v, tetto) => Math.min(tetto, Math.max(0, Math.round((Number(v) || 0) * 10) / 10));
const TETTI = { giorni: PARTITA.giorni, cassa: 5e6, fatturato: 5e5, decisioni: 2000 };

export function pulisci(r) {
  return {
    seme: Number.isFinite(Number(r.seme)) ? Number(r.seme) : 0,
    versioneMotore: intero(r.versioneMotore, 999),
    versioneContenuti: intero(r.versioneContenuti, 999),
    giorni: intero(r.giorni, TETTI.giorni),
    vinta: Boolean(r.vinta),
    causa: ['cassa', 'produttivita', 'organico', 'arrivato'].includes(r.causa) ? r.causa : null,
    cassaFinale: Math.max(-TETTI.cassa, Math.min(TETTI.cassa, Math.round(Number(r.cassaFinale) || 0))),
    produttivitaMedia: decimale(r.produttivitaMedia, 100),
    fatturatoMedio: intero(r.fatturatoMedio, TETTI.fatturato),
    moraleFinale: decimale(r.moraleFinale, 100),
    reputazioneFinale: decimale(r.reputazioneFinale, 100),
    organicoFinale: intero(r.organicoFinale, 100),
    usciti: intero(r.usciti, 100),
    accettate: intero(r.accettate, TETTI.decisioni),
    rifiutate: intero(r.rifiutate, TETTI.decisioni),
    rimandate: intero(r.rimandate, TETTI.decisioni),
    scadute: intero(r.scadute, TETTI.decisioni),
  };
}

/* ═══ La verifica: si rigioca la partita e si confronta ═══ */

/**
 * Rigioca la partita dal seme e dalla sequenza delle risposte, e dice se il
 * riassunto dichiarato e' quello che ne esce.
 *
 * E' il pezzo pensato per un server: la si chiama con quello che manda il
 * client e si guarda il risultato. Gira anche qui, dove non c'e' un server,
 * e serve lo stesso — ferma un punteggio modificato a mano nel deposito e
 * fa da rete quando cambia il motore: se una partita salvata con la
 * versione di prima non si rigioca uguale, questo se ne accorge.
 */
export function verificaPartita(dichiarato, decisioni) {
  if (!dichiarato || !Array.isArray(decisioni)) return { ok: false, perche: 'dati mancanti' };
  if (dichiarato.versioneMotore !== creaPartita({ seme: 0 }).versioneMotore) {
    return { ok: false, perche: 'la partita viene da un altro motore' };
  }
  const s = creaPartita({ seme: dichiarato.seme });
  let i = 0;
  while (s.fase !== 'finita' && i <= decisioni.length) {
    iniziaGiornata(s);
    while (richiestaCorrente(s) && i < decisioni.length) {
      const d = decisioni[i];
      /* la risposta deve riguardare la richiesta che il motore ha davanti:
         una sequenza rimescolata non e' la stessa partita */
      if (d.richiestaId && d.richiestaId !== richiestaCorrente(s).id) {
        return { ok: false, perche: 'le risposte non combaciano con le richieste' };
      }
      decidi(s, d.azione);
      i += 1;
    }
    chiudiGiornata(s);
    if (s.fase !== 'finita') prossimoGiorno(s);
  }
  const rifatto = pulisci(riassunto(s));
  const atteso = pulisci(dichiarato);
  for (const k of ['giorni', 'vinta', 'causa', 'cassaFinale', 'produttivitaMedia', 'fatturatoMedio']) {
    if (String(rifatto[k]) !== String(atteso[k])) {
      return { ok: false, perche: `non torna: ${k} dice ${atteso[k]}, rigiocando viene ${rifatto[k]}` };
    }
  }
  return { ok: true, riassunto: rifatto, punti: puntiPartita(rifatto) };
}

/* ═══ Le leghe: settimana, mese, sempre ═══
   Sono in `leghe.js`, insieme a The Climb; qui restano i nomi di prima. */

import { LEGHE, chiaveLega, potaLeghe } from './leghe';

export const LEGHE_THEBOSS = LEGHE;
export const chiaveLegaTheBoss = chiaveLega;

/* ═══ Le divisioni ═══ */

/**
 * Sei divisioni, e si sale o si scende a fine stagione.
 *
 * Una stagione e' un mese: e' la lega piu' lunga che riparte da sola, e
 * quattro settimane sono abbastanza per giocare qualche partita senza che
 * chi salta una settimana perda tutto. Chi non gioca per un'intera stagione
 * resta dov'e'; chi non gioca per due scende di una. Sembra severo e non
 * lo e': senza, in cima resterebbero per sempre i primi che ci sono
 * arrivati.
 */
export const DIVISIONI = [
  { id: 'stagista', nome: 'Stagista' },
  { id: 'teamleader', nome: 'Team Leader' },
  { id: 'reparto', nome: 'Capo Reparto' },
  { id: 'manager', nome: 'Manager' },
  { id: 'direttore', nome: 'Direttore' },
  { id: 'ceo', nome: 'CEO' },
];
export const QUOTA_PROMOZIONE = 0.2;
export const STAGIONI_INATTIVO = 2;

export function divisioneDi(userId) {
  ensureTheBoss();
  return db.divisioniTheBoss[userId] || { divisione: 'stagista', stagione: null, inattive: 0 };
}

/**
 * Chiude la stagione appena finita, se non e' gia' chiusa: promuove il
 * quinto migliore, retrocede il quinto peggiore, e conta chi non si e'
 * visto. Si chiama pigramente, quando qualcuno guarda la classifica o
 * finisce una partita: non c'e' un server che possa farlo a mezzanotte.
 */
export function chiudiStagione(adesso = Date.now()) {
  ensureTheBoss();
  const stagioneOra = chiaveLegaTheBoss('mese', adesso);
  if (db.stagioneTheBoss === stagioneOra) return null;
  const precedente = db.stagioneTheBoss;
  db.stagioneTheBoss = stagioneOra;
  if (!precedente) { save(); return null; }

  const tavola = db.classificaTheBoss[precedente] || {};
  const perDivisione = {};
  for (const [userId, voce] of Object.entries(tavola)) {
    const d = divisioneDi(userId).divisione;
    (perDivisione[d] = perDivisione[d] || []).push({ userId, punti: voce.punti });
  }
  const mosse = [];
  for (const div of DIVISIONI) {
    const gente = (perDivisione[div.id] || []).sort((a, b) => b.punti - a.punti);
    if (gente.length < 3) continue;
    const quanti = Math.max(1, Math.round(gente.length * QUOTA_PROMOZIONE));
    const su = gente.slice(0, quanti);
    const giu = gente.slice(-quanti);
    const i = DIVISIONI.findIndex((x) => x.id === div.id);
    for (const g of su) if (i < DIVISIONI.length - 1) mosse.push([g.userId, DIVISIONI[i + 1].id, 'promosso']);
    for (const g of giu) if (i > 0) mosse.push([g.userId, DIVISIONI[i - 1].id, 'retrocesso']);
  }
  /* chi non ha giocato: si conta, e alla seconda stagione di fila scende */
  for (const userId of Object.keys(db.divisioniTheBoss)) {
    if (tavola[userId]) { db.divisioniTheBoss[userId].inattive = 0; continue; }
    const d = db.divisioniTheBoss[userId];
    d.inattive = (d.inattive || 0) + 1;
    if (d.inattive >= STAGIONI_INATTIVO) {
      const i = DIVISIONI.findIndex((x) => x.id === d.divisione);
      if (i > 0) { d.divisione = DIVISIONI[i - 1].id; d.inattive = 0; }
    }
  }
  for (const [userId, divisione] of mosse) {
    db.divisioniTheBoss[userId] = { ...divisioneDi(userId), divisione, stagione: precedente, inattive: 0 };
  }
  save();
  return { stagione: precedente, mosse: mosse.length };
}

function segnaInClassifica(userId, riga, punti, adesso) {
  for (const { id: lega } of LEGHE_THEBOSS) {
    const chiave = chiaveLegaTheBoss(lega, adesso);
    const tavola = db.classificaTheBoss[chiave] || (db.classificaTheBoss[chiave] = {});
    const prima = tavola[userId];
    const migliore = !prima || punti > prima.punti;
    tavola[userId] = {
      userId,
      punti: migliore ? punti : prima.punti,
      giorni: migliore ? riga.giorni : prima.giorni,
      vinta: migliore ? riga.vinta : prima.vinta,
      produttivitaMedia: migliore ? riga.produttivitaMedia : prima.produttivitaMedia,
      giocataIl: migliore ? riga.giocataIl : prima.giocataIl,
      partite: (prima?.partite || 0) + 1,
    };
  }
  potaLeghe(db.classificaTheBoss);
}

export function classificaTheBoss({ lega = 'sett', divisione = null, adesso = Date.now() } = {}) {
  ensureTheBoss();
  chiudiStagione(adesso);
  const tavola = db.classificaTheBoss[chiaveLegaTheBoss(lega, adesso)] || {};
  let voci = Object.values(tavola);
  if (divisione) voci = voci.filter((v) => divisioneDi(v.userId).divisione === divisione);
  voci.sort((a, b) => b.punti - a.punti || String(a.giocataIl).localeCompare(String(b.giocataIl)));
  return voci.map((v, i) => ({ ...v, posizione: i + 1, divisione: divisioneDi(v.userId).divisione }));
}

export function primatiTheBoss(userId) {
  ensureTheBoss();
  return db.primatiTheBoss[userId] || { partite: 0, vinte: 0, giorniMax: 0, puntiMax: 0, produttivitaMax: 0 };
}

/* ═══ La telemetria ═══ */

/**
 * Quattro numeri per capire come va il gioco dopo il rilascio, e nessuno
 * che dica chi ha giocato: **non c'e' un id di persona qui dentro**.
 * Servono a tarare, e per tarare basta sapere che al giorno ventidue si
 * ferma un quarto delle partite, non chi si e' fermato.
 */
export function telemetriaTheBoss() {
  ensureTheBoss();
  return db.telemetriaTheBoss || { partite: 0, giorniTotali: 0, cause: {}, azioni: {}, scadute: 0, abbandoniPerGiorno: {} };
}

function segnaTelemetria(r) {
  const t = telemetriaTheBoss();
  t.partite += 1;
  t.giorniTotali += r.giorni;
  if (r.causa) t.cause[r.causa] = (t.cause[r.causa] || 0) + 1;
  for (const k of ['accettate', 'rifiutate', 'rimandate']) t.azioni[k] = (t.azioni[k] || 0) + r[k];
  t.scadute += r.scadute;
  const fascia = String(Math.floor(r.giorni / 5) * 5);
  t.abbandoniPerGiorno[fascia] = (t.abbandoniPerGiorno[fascia] || 0) + 1;
  db.telemetriaTheBoss = t;
}

/* ═══ La registrazione ═══ */

export function registraPartitaTheBoss(userId, grezzo, decisioni = []) {
  ensureTheBoss();
  if (!userId || !grezzo || !db.users?.some?.((u) => u.id === userId)) return null;
  const r = pulisci(grezzo);

  /* Si rigioca prima di scrivere. Qui non ferma un imbroglione deciso —
     non c'e' un server — ma ferma un punteggio ritoccato nel deposito e si
     accorge se il motore e' cambiato sotto i piedi di una partita. */
  const prova = verificaPartita(grezzo, decisioni);
  const punti = prova.ok ? prova.punti : puntiPartita(r);

  const riga = {
    id: nuovoId('theboss'),
    userId,
    ...r,
    punti,
    verificata: prova.ok,
    giocataIl: new Date().toISOString(),
  };
  db.partiteTheBoss.push(riga);
  const sue = db.partiteTheBoss.filter((p) => p.userId === userId);
  if (sue.length > PARTITE_TENUTE_THEBOSS) {
    const via = new Set(sue.slice(0, sue.length - PARTITE_TENUTE_THEBOSS).map((p) => p.id));
    db.partiteTheBoss = db.partiteTheBoss.filter((p) => !via.has(p.id));
  }
  const prima = primatiTheBoss(userId);
  db.primatiTheBoss[userId] = {
    partite: (prima.partite || 0) + 1,
    vinte: (prima.vinte || 0) + (r.vinta ? 1 : 0),
    giorniMax: Math.max(prima.giorniMax || 0, r.giorni),
    puntiMax: Math.max(prima.puntiMax || 0, punti),
    produttivitaMax: Math.max(prima.produttivitaMax || 0, r.produttivitaMedia),
  };
  if (!db.divisioniTheBoss[userId]) db.divisioniTheBoss[userId] = { divisione: 'stagista', stagione: null, inattive: 0 };
  chiudiStagione(Date.parse(riga.giocataIl));
  segnaInClassifica(userId, riga, punti, Date.parse(riga.giocataIl));
  segnaTelemetria(r);
  save();
  return riga;
}

export function partiteTheBoss(userId) {
  ensureTheBoss();
  return db.partiteTheBoss.filter((p) => p.userId === userId);
}
