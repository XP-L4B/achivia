// "Database" mock su localStorage. Al primo avvio copia il seed in localStorage;
// da lì in poi legge/scrive sempre su localStorage, così le modifiche
// (nuove quest, approvazioni, ecc.) sopravvivono al refresh.
//
// Reset: aggiungere ?reset all'URL (es. /webapp/auth?reset) oppure chiamare resetDb().

import seed from '../seed.json';
import { datiDemo } from '../demoOrg';
import { ARTICOLI_NEGOZIO, CATEGORIE_NEGOZIO, CATALOGO_CONSEGNATO } from './catalogoNegozio';

const DB_KEY = 'achivia_db';
// Alzando il numero i dati salvati vengono considerati vecchi e si riparte
// dal seed: serve quando il seed stesso cambia, come all'arrivo delle quest
// di esempio, altrimenti chi ha gia' usato l'app non le vedrebbe mai.
export const DB_VERSION = 22;

/**
 * Le quest di esempio non hanno una data fissa ma la distanza in mesi dal
 * giorno in cui si caricano (`chiusaMesiFa` e `giorno`): datate a mano
 * invecchierebbero, e dopo qualche mese i grafici tornerebbero vuoti.
 */
function datiQuest(quest) {
  const { chiusaMesiFa, giorno, ...resto } = quest;
  if (chiusaMesiFa == null) return resto;
  const oggi = new Date();
  const d = new Date();
  d.setDate(1);                                  // prima di cambiare mese, per
  d.setMonth(d.getMonth() - chiusaMesiFa);       // non scivolare in quello dopo
  // Nel mese in corso una quest non puo' essere stata chiusa domani.
  const ultimo = chiusaMesiFa === 0 ? oggi.getDate() : 28;
  d.setDate(Math.min(giorno || 15, ultimo));
  const quando = d.toISOString();
  // Una quest chiusa bene porta la data di approvazione, una fallita quella
  // della scadenza che ha superato: sono le due date su cui contano i grafici.
  return resto.status === 'scaduta'
    ? { ...resto, deadline: quando }
    : { ...resto, approvedAt: quando, deadline: quando };
}

export function freshFromSeed() {
  const data = JSON.parse(JSON.stringify(seed));
  data.quests = (data.quests || []).map(datiQuest);

  /* Il catalogo del negozio non sta nel seed ma in `catalogoNegozio.js`:
     e' uno solo per tutta l'app, e da li' lo prendono sia il deposito che
     nasce adesso sia quello che c'era gia' (vedi `avvia`). */
  data.articoli = JSON.parse(JSON.stringify(ARTICOLI_NEGOZIO));
  data.categorie = JSON.parse(JSON.stringify(CATEGORIE_NEGOZIO));
  data.catalogoConsegnato = CATALOGO_CONSEGNATO;

  // Le organizzazioni di prova della classifica: gente, quest, aiuti,
  // presenze e riconoscimenti veri, generati da una descrizione compatta.
  // Stanno in `demoOrg.js` e non nel seed perche' sono migliaia di righe
  // che si ricavano da sette: scritte a mano sarebbero un file da mezzo
  // megabyte da tenere aggiornato.
  const demo = datiDemo();
  data.users = [...(data.users || []), ...demo.users];
  data.quests = [...data.quests, ...demo.quests];
  data.helpRequests = [...(data.helpRequests || []), ...demo.helpRequests];
  data.achievementInstances = [...(data.achievementInstances || []), ...demo.achievementInstances];
  data.attendance = [...(data.attendance || []), ...demo.attendance];
  // Competenze, certificazioni e carriera: non servono a nessuna schermata
  // delle organizzazioni, servono all'osservatorio — che senza mercato non
  // ha niente da osservare.
  data.skills = [...(data.skills || []), ...demo.skills];
  data.certifications = [...(data.certifications || []), ...demo.certifications];
  data.carriera = [...(data.carriera || []), ...demo.carriera];
  data.dipartimenti = [...(data.dipartimenti || []), ...demo.dipartimenti];
  // I passaggi gia' chiusi: chi e' uscito da un'organizzazione e si e' reso
  // trovabile porta con se' quello che ha fatto li' dentro.
  data.storico = [...(data.storico || []), ...demo.storico];
  // La bacheca: senza qualche annuncio non si vede che forma ha una scheda
  // ne' che cosa fanno i filtri.
  data.annunci = [...(data.annunci || []), ...demo.annunci];
  return data;
}

/**
 * Scrive il deposito nel browser. Torna `false` se non ci sta.
 *
 * Lo spazio di `localStorage` e' cinque megabyte scarsi, e da quando si
 * possono caricare le immagini degli articoli e' diventato un limite che si
 * puo' toccare davvero. Prima questa riga poteva esplodere in faccia a chi
 * stava salvando; adesso dice di no, e chi ha chiesto il salvataggio decide
 * che cosa farne.
 */
export function persist(data) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify({ version: DB_VERSION, data }));
    return true;
  } catch {
    return false;
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === DB_VERSION && parsed.data) return parsed.data;
    }
  } catch {
    /* dati corrotti: si ricade sul seed */
  }
  const data = freshFromSeed();
  persist(data);
  return data;
}


/**
 * Quello che il deposito deve avere e che i dati di partenza non portano.
 *
 * Due cose, e tutte e due servono a rispondere a una domanda sola: questo
 * risultato, dove e quando e' stato ottenuto? Un profilo che cambia
 * azienda riparte da zero, ma quello che ha fatto prima non sparisce — e
 * per sapere che cosa tenere bisogna sapere di chi era.

/* Il deposito e' un `let` e non un `const` perche' un'altra scheda puo'
   riscriverlo: quando succede si ricarica, e chi lo ha importato vede il
   nuovo — i moduli ES tengono viva la scatola, non il contenuto. */
export let db = load();

/* ─── Il numero Achivia ──────────────────────────────────────
   Ogni account porta un numero suo, che non cambia mai e che non ha nessun
   altro. Serve perche' i nomi non bastano: due Mario Rossi esistono, due
   nickname uguali pure, e le email si scrivono sbagliate. Il numero invece
   e' uno solo, si legge ad alta voce e si trova con una ricerca.

   Si genera alla nascita dell'account e non si tocca piu'. L'unicita' non
   e' una speranza: si estrae finche' non si trova un numero libero, e le
   otto cifre lasciano novanta milioni di posti. */

const CIFRE_ID = 8;
const MIN_ID = 10 ** (CIFRE_ID - 1);
const MAX_ID = 10 ** CIFRE_ID - 1;

export function generaAchiviaId(presi = new Set(db.users.map((u) => u.achiviaId))) {
  for (let tentativi = 0; tentativi < 200; tentativi += 1) {
    const numero = String(Math.floor(MIN_ID + Math.random() * (MAX_ID - MIN_ID)));
    if (!presi.has(numero)) return numero;
  }
  // Se il caso non collabora si scende in fila dal primo libero: meglio un
  // numero brutto che un numero doppio.
  for (let n = MIN_ID; n <= MAX_ID; n += 1) {
    if (!presi.has(String(n))) return String(n);
  }
  return String(Date.now()).slice(-CIFRE_ID);
}

/** Gli account che c'erano prima del numero se lo trovano assegnato qui. */
(function assegnaIdMancanti() {
  const presi = new Set(db.users.map((u) => u.achiviaId).filter(Boolean));
  let cambiato = false;
  for (const u of db.users) {
    if (u.achiviaId) continue;
    u.achiviaId = generaAchiviaId(presi);
    presi.add(u.achiviaId);
    cambiato = true;
  }
  if (cambiato) persist(db);
}());

// Reset esplicito via URL:
//   ?reset=all  → reset COMPLETO (ricarica tutto dal seed: utenti, quest, ecc.)
//   ?reset      → svuota SOLO le quest, lasciando intatti utenti, notifiche, ecc.
if (typeof window !== 'undefined' && /[?&]reset\b/.test(window.location.search)) {
  if (/[?&]reset=all\b/.test(window.location.search)) {
    db = freshFromSeed();
  } else {
    db.quests = [];
  }
  persist(db);
}

/* ─── Notifiche di modifica (per ri-renderizzare le pagine) ──
   Le pagine leggono uno snapshot in memoria di `db`. Quando i dati cambiano
   — nella stessa scheda (save) o in un'altra scheda (evento `storage`) —
   avvisiamo gli iscritti così possono ricaricare la vista. */
const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function emit() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  // Un'altra scheda ha scritto sul DB: ricarichiamo e avvisiamo.
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY) {
      db = load();
      emit();
    }
  });
  // Tornando sulla scheda, riallineiamo lo snapshot a localStorage.
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      db = load();
      emit();
    }
  });
}

export function resetDb() {
  db = freshFromSeed();
  persist(db);
  emit();
  return db;
}

export function save() {
  const scritto = persist(db);
  emit();
  return scritto;
}

/* ─── Registrazione in sospeso (bozza tra /auth e i form org) ── */
const REG_KEY = 'achivia_reg';
export function setPendingRegistration(data) {
  try { sessionStorage.setItem(REG_KEY, JSON.stringify(data)); } catch { /* noop */ }
}
export function getPendingRegistration() {
  try { return JSON.parse(sessionStorage.getItem(REG_KEY) || 'null'); } catch { return null; }
}
export function clearPendingRegistration() {
  try { sessionStorage.removeItem(REG_KEY); } catch { /* noop */ }
}


/* ─── Le collezioni che nascono vuote ────────────────────────
   Stanno tutte qui e non nei loro domini: chiamarle e' l'unica cosa che un
   dominio deve poter fare su una collezione di un altro, e tenerle insieme
   evita che i moduli si importino a vicenda solo per assicurarsi che un
   elenco esista. */
export function ensureAnnunci() {
  if (!db.annunci) db.annunci = [];
}

export function ensureAchievementsCreati() {
  if (!db.achievementsCreati) db.achievementsCreati = [];
}

export function ensureAchievements() {
  if (!db.achievementInstances) db.achievementInstances = [];
  if (!db.achievementConfig) db.achievementConfig = {};
  if (!db.creditTransactions) db.creditTransactions = [];
  if (!db.achievementSync) db.achievementSync = {};
}

export function ensureArticoli() {
  if (!db.articoli) db.articoli = [];
}

/* Le spese di spedizione, in crediti: due zone e una soglia oltre la quale
   la spedizione non si paga. Additiva: chi ha gia' dei dati se le ritrova
   a zero, che e' come stava il negozio prima che esistessero. */
export function ensureSpedizione() {
  if (!db.spedizione) db.spedizione = { italia: 0, ue: 0, gratisDa: null };
}

/* Il registro dei crediti. Lo creava `ensureAchievements`, perche' per un
   po' l'unica cosa che ci finiva dentro erano le ricompense dei traguardi.
   Adesso ci passano tutti i movimenti e la riga sta per conto suo, dove chi
   la cerca la trova. */
export function ensureCrediti() {
  if (!db.creditTransactions) db.creditTransactions = [];
}

/* Il listino: i piani dell'abbonamento, i pacchetti di crediti e le
   offerte. Sono le uniche tre collezioni che non descrivono quello che
   succede dentro l'applicazione ma quello che si vende. */
export function ensureListino() {
  if (!db.piani) db.piani = [];
  if (!db.pacchetti) db.pacchetti = [];
  if (!db.offerte) db.offerte = [];
  if (!db.risalto) db.risalto = [];
}

/* Il registro di chi ha guardato un'identita' nel Castello. Una collezione
   che esiste per essere letta contro chi la scrive: vedi `castello.js`. */
export function ensureCastello() {
  if (!db.identitaViste) db.identitaViste = [];
}

/* Le domande fatte all'assistente. Una riga per domanda: e' un contatore
   che si puo' rileggere, non un numero che si incrementa. */
export function ensureAzioniAi() {
  if (!db.azioniAi) db.azioniAi = [];
}

/* Gli spazi pubblicitari e quello che ci va dentro. */
export function ensurePubblicita() {
  if (!db.pubblicita) db.pubblicita = [];
  if (!db.visteAnnunci) db.visteAnnunci = {};
  if (!db.impostazioniPubblicita) db.impostazioniPubblicita = {};
}

/* I pagamenti registrati: quando un'organizzazione ha pagato, quanto, e per
   quale periodo. Vedi `pagamenti.js`. */
export function ensurePagamenti() {
  if (!db.pagamenti) db.pagamenti = [];
}

export function ensureCarriera() {
  if (!db.carriera) db.carriera = [];
}

/* L'arena: le partite giocate, a rotazione, e i primati per persona. Vedi
   `deposito/arena.js`. */
export function ensureArena() {
  if (!db.partiteArena) db.partiteArena = [];
  if (!db.primatiArena) db.primatiArena = {};
  // i traguardi dell'arena: un profilo a parte, che non tocca gli achievement di Achivia
  if (!db.traguardiArena) db.traguardiArena = {};
  // la classifica dell'arena: per lega (settimana, mese, sempre), la partita migliore di ognuno
  if (!db.classificaArena) db.classificaArena = {};
}

/* Lexora: le sfide aperte, le partite finite (a rotazione), le
   statistiche, i traguardi e la classifica. Vedi `deposito/lexora.js`. */
export function ensureTheBoss() {
  /* Additiva e basta: nessuna collezione esistente viene toccata, e chi ha
     gia' dei dati non se ne accorge. La versione del deposito non si alza —
     alzarla cancellerebbe i dati di tutti per aggiungere un gioco. */
  if (!db.partiteTheBoss) db.partiteTheBoss = [];
  if (!db.primatiTheBoss) db.primatiTheBoss = {};
  if (!db.classificaTheBoss) db.classificaTheBoss = {};
  if (!db.divisioniTheBoss) db.divisioniTheBoss = {};
  if (!db.telemetriaTheBoss) db.telemetriaTheBoss = { partite: 0, giorniTotali: 0, cause: {}, azioni: {}, scadute: 0, abbandoniPerGiorno: {} };
  if (db.stagioneTheBoss === undefined) db.stagioneTheBoss = null;
}

/* The Climb: la corsa in corso di ognuno (una sola) e le vite finite.
   Vedi `deposito/theclimb.js`. Additiva, come le altre. */
export function ensureTheClimb() {
  if (!db.corseClimb) db.corseClimb = {};
  if (!db.partiteClimb) db.partiteClimb = [];
  if (!db.enciclopediaClimb) db.enciclopediaClimb = {};
  if (!db.classificaClimb) db.classificaClimb = {};
  if (!db.divisioniClimb) db.divisioniClimb = {};
  if (!db.primatiClimb) db.primatiClimb = {};
  if (db.stagioneClimb === undefined) db.stagioneClimb = null;
  if (!db.tutorialClimb) db.tutorialClimb = {};
}

export function ensureLexora() {
  if (!db.sfideLexora) db.sfideLexora = [];
  if (!db.partiteLexora) db.partiteLexora = [];
  if (!db.statisticheLexora) db.statisticheLexora = {};
  // i traguardi di Lexora: un profilo a parte, come quelli dell'arena
  if (!db.traguardiLexora) db.traguardiLexora = {};
  if (!db.classificaLexora) db.classificaLexora = {};
  /* La prova in solitario: fin dove e' arrivato ognuno. Nasce vuota e si
     riempie giocando — chi c'era prima riparte dal primo livello, che e'
     giusto: prima la prova non esisteva. */
  if (!db.proveLexora) db.proveLexora = {};
}

export function ensureCategorie() {
  if (!db.categorie) db.categorie = [];
}

export function ensureDipartimenti() {
  if (!db.dipartimenti) db.dipartimenti = [];
}

export function ensureHelpRequests() {
  if (!db.helpRequests) db.helpRequests = [];
}

export function ensureImmagini() {
  if (!db.immagini) db.immagini = [];
}

export function ensureLavoro() {
  if (!db.abbonamenti) db.abbonamenti = [];
  if (!db.storico) db.storico = [];
  if (!db.messaggi) db.messaggi = [];
  if (!db.postaUscita) db.postaUscita = [];
  if (!db.comparse) db.comparse = [];
  if (!db.blocchi) db.blocchi = [];
  if (!db.limitiContatto) db.limitiContatto = {};
}

export function ensureIngressi() {
  if (!db.ingressi) db.ingressi = [];
}

export function ensureMembri() {
  if (!db.membri) db.membri = [];
}

export function ensureNotifications() {
  if (!db.notifications) db.notifications = [];
}

export function ensureOrdini() {
  if (!db.ordini) db.ordini = [];
}

export function ensureOrganizzazioni() {
  if (!db.organizzazioni) db.organizzazioni = {};
}

export function ensurePresenze() {
  if (!db.attendance) db.attendance = [];
}

export function ensureProjects() {
  if (!db.projects) db.projects = [];
}

export function ensureReviews() {
  if (!db.reviews) db.reviews = [];
  if (!db.reviewTemplates) db.reviewTemplates = [];
}

export function ensureRuoli() {
  if (!db.ruoli) db.ruoli = [];
}

export function ensureSkills() {
  if (!db.skills) db.skills = [];
  if (!db.certifications) db.certifications = [];
  if (!db.recommendations) db.recommendations = [];
}

export function ensureTeams() {
  if (db.teams) return;
  db.teams = [];
  const visti = new Map();
  db.users.forEach((u) => {
    if (!u.department) return;
    const chiave = `${u.orgId}::${u.department}`;
    if (!visti.has(chiave)) {
      const team = {
        id: `t-seed-${db.teams.length + 1}`,
        orgId: u.orgId,
        name: u.department,
        createdById: db.users.find((x) => x.orgId === u.orgId && x.role === 'admin')?.id ?? null,
        memberIds: [],
      };
      db.teams.push(team);
      visti.set(chiave, team);
    }
    visti.get(chiave).memberIds.push(u.id);
  });
}

/* ─── Eventi di dominio ──────────────────────────────────────
   Il motore degli achievement deve sapere quando succede qualcosa — una
   quest approvata, una competenza certificata, un aiuto dato — senza che il
   database sappia cosa sia un achievement. Qui c'e' solo il filo: chi vuole
   ascoltare si registra, e i pochi punti che cambiano i dati annunciano il
   fatto. Nessun controllo periodico, nessuna dipendenza all'indietro. */

const ascoltatori = new Set();

export function onEventoDominio(fn) {
  ascoltatori.add(fn);
  return () => ascoltatori.delete(fn);
}

/* Un generatore di identificativi buono per tutti: il dominio che lo usa
   non deve tenersi un contatore suo. */
let seq = 0;
/* ─── Da quanto non si fa vedere ─────────────────────────────
   Due date sulla riga della persona, e sono due domande diverse.

   `ultimoAccesso` e' l'ultima volta che ha aperto l'applicazione. Si
   aggiorna all'accesso e ogni volta che apre un canale, che vuol dire
   anche al ricaricamento della pagina: qui la sessione resta aperta per
   giorni, e contare solo gli accessi con la password farebbe risultare
   inattivo chi usa l'app tutti i giorni senza mai uscire.

   `ultimaAttivita` e' l'ultima volta che ha fatto qualcosa: consegnato una
   quest, approvata, comprato, scritto a qualcuno. Aprire e guardare non
   conta. La differenza fra le due date e' la distanza fra chi c'e' e chi
   partecipa, ed e' l'unica cosa che dice se una organizzazione e' viva o
   e' solo aperta.

   Nessuna delle due passa da `updateUser`: si scrivono sulla riga e si
   salva, senza toccare la proiezione del canale ne' il registro delle
   appartenenze. Sono osservazioni, non modifiche al profilo. */

function segna(userId, campi) {
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  Object.assign(u, campi);
  save();
  return u;
}

/** E' entrato adesso. */
export const segnaAccesso = (userId) =>
  segna(userId, { ultimoAccesso: new Date().toISOString() });

/**
 * Ha fatto qualcosa adesso, e `azione` dice che cosa.
 *
 * L'ultima azione si tiene per esteso perche' costa una parola e risparmia
 * un'indagine: davanti a un account fermo da tre mesi, sapere che l'ultima
 * cosa che ha fatto e' stata comprare cambia la lettura rispetto a sapere
 * che e' stata consegnare una quest.
 */
export function segnaAttivita(userId, azione) {
  const adesso = new Date().toISOString();
  return segna(userId, { ultimaAttivita: adesso, ultimaAzione: azione || '', ultimoAccesso: adesso });
}

export const nuovoId = (prefisso) => {
  seq += 1;
  return `${prefisso}-${Date.now()}-${seq}`;
};

export function annuncia(evento) {
  ascoltatori.forEach((fn) => {
    // Un ascoltatore che si rompe non deve far fallire l'azione dell'utente.
    try { fn(evento); } catch { /* noop */ }
  });
}

