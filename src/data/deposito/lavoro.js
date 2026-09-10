/** Il lavoro fuori dall'organizzazione: abbonamenti, storico, elenco,
 *  messaggi, tetti e blocchi. */

import { db, ensureLavoro, nuovoId, save, segnaAttivita } from './nucleo';
import { addNotification } from './avvisi';
import { orgDiPersona } from './membri';
import { orgPersonalizzata } from './organizzazioni';

/* ─── Il lavoro fuori dall'organizzazione ────────────────────────────────
   Tre registri che non servono a nessuna schermata di un'azienda, e che
   proprio per questo devono esistere qui: chi guarda il proprio profilo
   vede com'e' adesso, e "adesso" cancella tutto il resto se nessuno lo
   scrive quando succede.

     abbonamenti  quando un'organizzazione ha pagato, e fino a quando. Un
                  risultato vale per sempre solo se e' stato ottenuto
                  mentre l'azienda era in abbonamento: senza le date, "era
                  premium?" e' una domanda a cui si puo' rispondere solo su
                  oggi, e oggi non e' quando il risultato e' stato preso.
     storico      un passaggio di una persona in un'organizzazione: quando
                  e' entrata, quando e' uscita, e la fotografia dei numeri
                  che al cambio si azzerano.
     messaggi     i messaggi diretti dall'osservatorio a chi si e' reso
                  trovabile, e le email che quei messaggi generano. */



export const getAbbonamenti = () => { ensureLavoro(); return db.abbonamenti; };
export const getStorico = () => { ensureLavoro(); return db.storico; };

/**
 * Apre o chiude un periodo di abbonamento. Si chiama quando il
 * proprietario di un'organizzazione accende o spegne il premium, ed e'
 * l'unico posto da cui quel registro si scrive.
 */
export function segnaAbbonamento(orgId, attivo, quando = new Date().toISOString()) {
  ensureLavoro();
  if (!orgId) return;
  const aperto = db.abbonamenti.find((a) => a.orgId === orgId && !a.a);
  if (attivo && !aperto) db.abbonamenti.push({ id: nuovoId('abb'), orgId, da: quando, a: null });
  if (!attivo && aperto) aperto.a = quando;
}

/**
 * L'organizzazione pagava, in quel momento?
 *
 * E' la domanda su cui si regge tutto il resto: un risultato ottenuto
 * mentre l'azienda era freemium non si porta via nessuno, e uno ottenuto
 * mentre pagava resta della persona per sempre. Senza data si intende
 * adesso.
 */
export function eraPremium(orgId, quando) {
  ensureLavoro();
  if (!orgId) return false;
  const t = quando ? new Date(quando).getTime() : Date.now();
  return db.abbonamenti.some((a) => a.orgId === orgId
    && new Date(a.da).getTime() <= t
    && (!a.a || new Date(a.a).getTime() > t));
}

/**
 * Il registro degli abbonamenti nasce dai dati che ci sono: chi risulta
 * premium adesso ha un periodo aperto che parte dalla nascita
 * dell'organizzazione. Serve una volta sola, al primo caricamento di un
 * database che quel registro non ce l'aveva.
 */
export function ricostruisciAbbonamenti() {
  ensureLavoro();
  if (db.abbonamenti.length) return;
  /* L'abbonamento e' dell'organizzazione, quindi si legge dal suo registro:
     leggerlo dal proprietario dava la risposta sbagliata appena uno ne
     possedeva due, una che paga e una no. */
  for (const [orgId, o] of Object.entries(db.organizzazioni || {})) {
    if (!o?.premium) continue;
    db.abbonamenti.push({
      id: nuovoId('abb'),
      orgId,
      da: o.creataIl || new Date(0).toISOString(),
      a: null,
    });
  }
}

/* ─── Farsi trovare ──────────────────────────────────────────────────────
   Chi vuole essere raggiunto per un'offerta di lavoro lo dice, e da quel
   momento il suo profilo entra in un elenco che vede solo l'osservatorio.
   Lo dice, pero': non lo decide nessun altro per lui, e puo' cambiare idea
   in qualunque momento — revocare non nasconde il profilo, lo toglie. */

export const RUOLI_SENZA_LAVORO = ['shop', 'osservatorio', 'castle'];

/** Chi puo' cercare lavoro: tutti tranne il negozio e l'osservatorio. */
export const puoCercareLavoro = (persona) =>
  Boolean(persona) && !RUOLI_SENZA_LAVORO.includes(persona.role);

/**
 * Se una persona sta dentro un'azienda. Le personalizzate non contano.
 *
 * Si guardano tutte le sue appartenenze e non il canale che ha aperto
 * adesso: chi lavora da qualche parte lavora anche mentre sta guardando il
 * gruppo di calcetto, e la regola dell'elenco non puo' dipendere da quale
 * stanza si e' aperta.
 */
export const inAzienda = (userId) =>
  orgDiPersona(userId).some((m) => !orgPersonalizzata(m.orgId));

/**
 * Chi puo' mettersi in elenco: chi non sta dentro un'azienda.
 *
 * Prima l'interruttore si poteva accendere anche da dentro, e semplicemente
 * non aveva effetto: il profilo restava nascosto finche' la persona non
 * usciva. Sembrava prudenza, ed era un equivoco. Un consenso acceso che non
 * fa niente e' un consenso che nessuno rilegge — e il giorno in cui quella
 * persona lascia l'azienda si ritrova in vetrina per una spunta messa due
 * anni prima, in un'altra vita, senza nemmeno accorgersene.
 *
 * Chi entra in un'azienda mentre era in elenco viene tolto subito, e per
 * tornarci dovra' dire di si' un'altra volta, da libero: un consenso dato
 * in una situazione non vale automaticamente in un'altra.
 *
 * Le organizzazioni personalizzate non chiudono questa porta, e per un
 * motivo semplice: un gruppo, una famiglia, una squadra non sono un
 * datore di lavoro. Chi sta li' dentro sta cercando lavoro esattamente
 * come chi non sta da nessuna parte, e togliergli l'elenco perche' ha una
 * chat di famiglia su Achivia sarebbe stato un impedimento senza ragione.
 */
export const puoFarsiTrovare = (persona) =>
  puoCercareLavoro(persona) && !inAzienda(persona?.id);

/**
 * Toglie l'elenco a chi e' entrato in un'azienda. Si chiama da `updateUser`
 * — l'unico punto da cui si cambia organizzazione — e non cancella niente:
 * quello che la persona aveva scritto resta, e torna utile il giorno in cui
 * decidera' di rimettersi in elenco.
 *
 * Entrare in una personalizzata non lo fa scattare: quel posto non e' un
 * lavoro, e chi ci sta dentro puo' continuare a cercarne uno.
 */
export function sospendiTrovabilita(u, orgId = null) {
  if (!u?.trovabilita?.attiva) return;
  u.trovabilita = {
    ...u.trovabilita,
    attiva: false,
    revocatoIl: new Date().toISOString(),
    // Il motivo resta scritto: e' la differenza fra "ci ho ripensato" e
    // "sono stato assunto", e chi rilegge la propria pagina dei dati ha
    // diritto di sapere quale delle due e' stata.
    sospesoPerOrg: orgId || u.orgId || null,
  };
}

export const getTrovabilita = (userId) => {
  const u = db.users.find((x) => x.id === userId);
  return u?.trovabilita || null;
};

/**
 * Accetta i termini e si mette in elenco.
 *
 * I termini non sono una formalita' messa qui per coprirsi: sono la sola
 * ragione per cui questi dati possono uscire dal profilo di qualcuno. Senza
 * la data di accettazione la funzione non scrive niente.
 */
/* Quanto dura un consenso, e quando si avvisa che sta per finire. Un
   profilo fermo da un anno non e' piu' un profilo in cerca: e' un residuo,
   e tenerlo in elenco fa male a tutti e due i lati — a chi cerca, che
   scrive a gente che ha gia' trovato lavoro, e a chi e' cercato, che resta
   esposto senza volerlo piu'. La scadenza non cancella niente: spegne
   l'elenco, e basta un clic per riaccenderlo. */
export const GIORNI_CONSENSO = 365;
export const GIORNI_PROMEMORIA = 30;

const piuGiorni = (iso, giorni) =>
  new Date(new Date(iso).getTime() + giorni * 86400000).toISOString();

/**
 * Che lavoro si sta cercando. Tutto facoltativo, tutto dichiarato dalla
 * persona: non e' dedotto da quello che ha fatto, e per questo e' il dato
 * meno problematico che ci sia qui dentro. Vuoto vuol dire "non lo dico",
 * e chi cerca lo vede come tale invece di leggerci un no.
 */
export const CERCA_VUOTO = {
  mestiere: '', disponibilita: '', contratto: '', orario: '', remoto: '',
};

export function fattiTrovare(userId, {
  lettera, zone, lingue, accettato, posizione, cerca,
}) {
  const u = db.users.find((x) => x.id === userId);
  if (!u || !puoFarsiTrovare(u) || !accettato) return null;
  const adesso = new Date().toISOString();
  u.trovabilita = {
    attiva: true,
    lettera: String(lettera || '').trim(),
    zone: (zone || []).filter((z) => z && z.continente),
    lingue: lingue || [],
    // La posizione e' un consenso a parte dentro il consenso: si puo' stare
    // in elenco senza darla, e chi la da' la puo' togliere lasciando il
    // resto. Arriva gia' agganciata alla griglia da chi la chiede al
    // browser — qui non passa mai una coordinata esatta.
    posizione: posizione || null,
    cerca: { ...CERCA_VUOTO, ...(cerca || {}) },
    accettatoIl: adesso,
    scadeIl: piuGiorni(adesso, GIORNI_CONSENSO),
    promemoriaIl: null,
    revocatoIl: null,
    sospesoPerOrg: null,
  };
  save();
  return u.trovabilita;
}

/** Il consenso e' ancora buono? */
export const consensoScaduto = (t) =>
  Boolean(t?.scadeIl) && new Date(t.scadeIl).getTime() <= Date.now();

/** Quanti giorni mancano alla scadenza (negativi se e' gia' passata). */
export const giorniAllaScadenza = (t) => (t?.scadeIl
  ? Math.ceil((new Date(t.scadeIl).getTime() - Date.now()) / 86400000)
  : null);

/**
 * Rinnova per un altro anno. Non ricrea niente: quello che la persona
 * aveva scritto resta dov'era, cambia solo la data.
 */
export function rinnovaTrovabilita(userId) {
  const u = db.users.find((x) => x.id === userId);
  if (!u?.trovabilita || !puoFarsiTrovare(u)) return null;
  const adesso = new Date().toISOString();
  u.trovabilita = {
    ...u.trovabilita,
    attiva: true,
    revocatoIl: null,
    accettatoIl: adesso,
    scadeIl: piuGiorni(adesso, GIORNI_CONSENSO),
    promemoriaIl: null,
    sospesoPerOrg: null,
  };
  save();
  return u.trovabilita;
}

/**
 * Avvisa che il consenso sta per finire, una volta sola per scadenza.
 * Si chiama quando la persona apre le sue schermate del lavoro: senza un
 * programma che gira di notte, e' il momento in cui si puo' sapere.
 */
export function promemoriaScadenza(userId) {
  const u = db.users.find((x) => x.id === userId);
  const t = u?.trovabilita;
  if (!t?.attiva || t.revocatoIl || t.promemoriaIl) return null;
  const mancano = giorniAllaScadenza(t);
  if (mancano === null || mancano > GIORNI_PROMEMORIA) return null;
  t.promemoriaIl = new Date().toISOString();
  addNotification({
    userId,
    kind: 'consenso_in_scadenza',
    text: mancano > 0
      ? `Il tuo profilo esce dall’elenco fra ${mancano} ${mancano === 1 ? 'giorno' : 'giorni'}: se stai ancora cercando, rinnova il consenso.`
      : 'Il consenso è scaduto e non compari più a chi cerca. I tuoi dati sono al loro posto: puoi rimetterti in elenco quando vuoi.',
  });
  save();
  return t;
}

/** Toglie la sola posizione, lasciando il profilo in elenco. */
export function togliPosizione(userId) {
  const u = db.users.find((x) => x.id === userId);
  if (!u?.trovabilita) return null;
  u.trovabilita = { ...u.trovabilita, posizione: null };
  save();
  return u.trovabilita;
}

/**
 * Revoca. Il consenso se ne va e con lui il profilo dall'elenco: resta
 * scritto quando, perche' un consenso ritirato e' un fatto che va
 * dimostrabile quanto uno dato.
 */
export function revocaTrovabilita(userId) {
  const u = db.users.find((x) => x.id === userId);
  if (!u?.trovabilita) return null;
  u.trovabilita = { ...u.trovabilita, attiva: false, revocatoIl: new Date().toISOString() };
  save();
  return u.trovabilita;
}

/* ─── I messaggi dell'osservatorio ───────────────────────────────────────
   Un messaggio diretto, e l'email che avvisa che e' arrivato. L'email qui
   non parte davvero — non c'e' un server che la spedisca — ma finisce in
   una posta in uscita, che e' l'unico modo onesto di dire "il messaggio
   c'e', la spedizione la fara' qualcun altro". */

export const getMessaggi = (userId) => {
  ensureLavoro();
  return db.messaggi
    .filter((m) => !userId || m.aId === userId)
    .sort((a, b) => new Date(b.il) - new Date(a.il));
};

export const getPostaUscita = () => { ensureLavoro(); return db.postaUscita; };

/* ─── Quanto si puo' scrivere ────────────────────────────────────────────
   Senza un tetto, un account puo' scrivere a tutto l'elenco in un
   pomeriggio, e l'elenco muore: le persone revocano il consenso e lo
   strumento resta senza nessuno dentro. I due numeri sotto sono lo
   standard; si cambiano per singolo account, uno alla volta e a mano,
   quando c'e' una ragione per farlo. */
export const LIMITI_STANDARD = { giornaliero: 500, giorniStessoProfilo: 30 };

/* Un messaggio e' un messaggio, non un allegato: oltre duemila caratteri
   non si legge nessuno e si paga il deposito per tutti. */
export const MAX_TESTO_MESSAGGIO = 2000;

/* La posta in uscita e' una coda di spedizione, non un archivio: in
   produzione la svuota chi manda le email. Qui nessuno la svuota, quindi
   si tiene corta da sola — le ultime cento bastano a vedere che funziona. */
const TETTO_POSTA = 100;

export const getLimitiContatto = (accountId) => {
  ensureLavoro();
  return { ...LIMITI_STANDARD, ...(db.limitiContatto[accountId] || {}) };
};

/** Alza o abbassa i tetti per un account solo. Passare `null` rimette lo standard. */
export function impostaLimitiContatto(accountId, limiti) {
  ensureLavoro();
  if (!limiti) delete db.limitiContatto[accountId];
  else db.limitiContatto[accountId] = { ...db.limitiContatto[accountId], ...limiti };
  save();
  return getLimitiContatto(accountId);
}

/* ─── Chi non si vuole sentire ───────────────────────────────────────────
   Due gradi, e sono diversi. Il silenzioso continua ad arrivare ma non fa
   rumore: niente notifica, niente email, resta nella casella. Il bloccato
   non arriva affatto, e chi scrive non se ne accorge — dirglielo darebbe a
   un'azienda un'informazione sul destinatario che il destinatario non ha
   voluto darle. */
export const getBlocchi = (userId) => {
  ensureLavoro();
  return db.blocchi.filter((b) => !userId || b.userId === userId);
};

export const gradoVerso = (userId, versoId) => {
  ensureLavoro();
  return db.blocchi.find((b) => b.userId === userId && b.versoId === versoId)?.tipo || null;
};

export function impostaGrado(userId, versoId, tipo) {
  ensureLavoro();
  db.blocchi = db.blocchi.filter((b) => !(b.userId === userId && b.versoId === versoId));
  if (tipo) db.blocchi.push({ id: nuovoId('blk'), userId, versoId, tipo, il: new Date().toISOString() });
  save();
  return tipo;
}

/* ─── In quante ricerche si e' comparsi ──────────────────────────────────
   Non e' un registro degli accessi: non si scrive chi ha cercato che cosa,
   ne' quando, ne' con quali filtri. Si scrive una cosa sola — in questa
   settimana il profilo e' comparso nei risultati di N aziende diverse — e
   gli identificativi servono solo a non contare due volte la stessa
   azienda dentro la stessa settimana. Passata la settimana resta il numero
   e gli identificativi si buttano.

   "Comparso nei risultati" non e' "guardato": nessuno sa se quella scheda
   e' stata aperta o letta, e non e' un dato che questo prodotto raccoglie. */
const SETTIMANE_TENUTE = 8;

const settimanaDi = (data = new Date()) => {
  const d = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  // Al lunedi' della sua settimana: cosi' due ricerche di giorni diversi
  // dentro la stessa settimana cadono nella stessa casella.
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

export function segnaComparse(userIds, chiId) {
  ensureLavoro();
  if (!chiId || !userIds?.length) return;
  const settimana = settimanaDi();
  let cambiato = false;
  for (const userId of userIds) {
    let riga = db.comparse.find((c) => c.userId === userId && c.settimana === settimana);
    if (!riga) {
      riga = { userId, settimana, chi: [], quante: 0 };
      db.comparse.push(riga);
    }
    if (riga.chi.includes(chiId)) continue;
    riga.chi.push(chiId);
    riga.quante = riga.chi.length;
    cambiato = true;
  }
  if (!cambiato) return;
  // Le settimane vecchie perdono i nomi e tengono il numero; oltre due mesi
  // si buttano anche i numeri.
  for (const c of db.comparse) if (c.settimana !== settimana) c.chi = [];
  const taglio = settimanaDi(new Date(Date.now() - SETTIMANE_TENUTE * 7 * 86400000));
  db.comparse = db.comparse.filter((c) => c.settimana >= taglio);
  save();
}

export const getComparse = (userId) => {
  ensureLavoro();
  return db.comparse.filter((c) => c.userId === userId).sort((a, b) => b.settimana.localeCompare(a.settimana));
};

/**
 * Il riassunto della settimana appena chiusa, una volta sola. Anche questa
 * si emette quando la persona apre le sue schermate: e' l'unico momento in
 * cui si puo', e in cambio non serve nessun programma che giri di notte.
 */
export function notificaComparse(userId) {
  ensureLavoro();
  const scorsa = settimanaDi(new Date(Date.now() - 7 * 86400000));
  const riga = db.comparse.find((c) => c.userId === userId && c.settimana === scorsa);
  if (!riga || !riga.quante || riga.avvisata) return null;
  riga.avvisata = true;
  addNotification({
    userId,
    kind: 'comparse_settimana',
    text: riga.quante === 1
      ? 'La settimana scorsa sei comparso nei risultati di un’azienda che cercava profili.'
      : `La settimana scorsa sei comparso nei risultati di ${riga.quante} aziende diverse.`,
  });
  save();
  return riga;
}

export function inviaMessaggio({ daId, aId, oggetto, testo }) {
  ensureLavoro();
  const destinatario = db.users.find((u) => u.id === aId);
  // Si scrive solo a chi ha detto di volerlo: un consenso revocato — o
  // scaduto — chiude anche questa porta, non solo l'elenco.
  if (!destinatario?.trovabilita?.attiva) return null;
  if (consensoScaduto(destinatario.trovabilita)) return null;

  // Il blocco ferma qui, e chi scrive non lo sa: dirglielo gli darebbe sul
  // destinatario un'informazione che il destinatario non gli ha dato. Torna
  // un messaggio finto, che non esiste da nessuna parte.
  if (gradoVerso(aId, daId) === 'blocco') {
    return { id: null, daId, aId, bloccato: true };
  }

  const limiti = getLimitiContatto(daId);
  const oggi = new Date().toISOString().slice(0, 10);
  const suoiOggi = db.messaggi.filter((m) => m.daId === daId && m.il.slice(0, 10) === oggi).length;
  if (suoiOggi >= limiti.giornaliero) return { errore: 'tetto-giornaliero', limiti };

  const ultimo = db.messaggi.find((m) => m.daId === daId && m.aId === aId);
  if (ultimo) {
    const passati = (Date.now() - new Date(ultimo.il).getTime()) / 86400000;
    if (passati < limiti.giorniStessoProfilo) {
      return { errore: 'troppo-presto', limiti, giorniMancanti: Math.ceil(limiti.giorniStessoProfilo - passati) };
    }
  }

  const il = new Date().toISOString();
  const messaggio = {
    id: nuovoId('msg'),
    daId,
    aId,
    oggetto: String(oggetto || '').trim() || 'Un’opportunità di lavoro',
    testo: String(testo || '').trim().slice(0, MAX_TESTO_MESSAGGIO),
    il,
    letto: false,
  };
  db.messaggi.unshift(messaggio);
  segnaAttivita(daId, 'ha scritto a qualcuno');

  // Silenziato: il messaggio arriva e resta nella casella, ma non suona.
  if (gradoVerso(aId, daId) === 'muto') {
    messaggio.silenzioso = true;
    save();
    return messaggio;
  }

  db.postaUscita.unshift({
    id: nuovoId('mail'),
    messaggioId: messaggio.id,
    a: destinatario.email,
    oggetto: `Achivia: ${messaggio.oggetto}`,
    corpo: 'Hai ricevuto un messaggio da un’organizzazione che cerca profili su Achivia. '
      + 'Aprilo dal tuo profilo, in Trova lavoro.',
    il,
    spedita: false,
  });
  if (db.postaUscita.length > TETTO_POSTA) db.postaUscita.length = TETTO_POSTA;
  addNotification({
    userId: aId,
    kind: 'messaggio_lavoro',
    text: `Un’organizzazione ti ha scritto: «${messaggio.oggetto}»`,
    messaggioId: messaggio.id,
  });
  save();
  return messaggio;
}

/**
 * Butta un messaggio. Non lo fa nessuna pulizia automatica: una scadenza
 * su un avviso e' ragionevole, su una lettera no — la tiene o la butta chi
 * l'ha ricevuta, e nessun altro.
 */
export function eliminaMessaggio(userId, id) {
  ensureLavoro();
  const prima = db.messaggi.length;
  db.messaggi = db.messaggi.filter((m) => !(m.id === id && m.aId === userId));
  if (db.messaggi.length === prima) return false;
  db.notifications = (db.notifications || []).filter((n) => n.messaggioId !== id);
  save();
  return true;
}

export function segnaMessaggioLetto(id) {
  ensureLavoro();
  const m = db.messaggi.find((x) => x.id === id);
  if (!m || m.letto) return m || null;
  m.letto = true;
  save();
  return m;
}
