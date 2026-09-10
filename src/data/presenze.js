import {
  addPresenza,
  deletePresenza,
  getEmployeesOfManager,
  getPresenzaDelGiorno,
  getPresenze,
  getPresenzeForUser,
  getUserById,
  puoGuidare,
} from './db';
import { badgePerNome } from './skillBadges';
import { puo } from './permessi';

/**
 * Time & Attendance: ritardi e assenze.
 *
 * Il registro non e' un cartellino. Non ci sono entrate e uscite: ci sono
 * solo gli eventi che si discostano dalla giornata normale — chi e' arrivato
 * tardi, e di quanto, e chi non e' arrivato. I giorni normali non si
 * scrivono, e sono la maggioranza; scriverli vorrebbe dire chiedere a un
 * manager di compilare un foglio ogni mattina, cioe' un registro che dopo
 * due settimane non e' piu' aggiornato e non vale piu' niente.
 *
 * Chi registra e' chi guida la persona, le stesse regole di tutto il resto:
 * il manager per la sua squadra, l'admin per tutti, nessuno per l'admin.
 *
 * I numeri che ne escono vanno nelle analytics della persona, con lo stesso
 * periodo scelto li': un'assenza di marzo non deve comparire nei dati di
 * questa settimana.
 */

export const RITARDO = 'ritardo';
export const ASSENZA = 'assenza';

export const TIPI = [
  { id: RITARDO, label: 'Ritardo', descrizione: 'È arrivato tardi' },
  { id: ASSENZA, label: 'Assenza', descrizione: 'Non è venuto' },
];

export const etichettaTipo = (tipo) => TIPI.find((t) => t.id === tipo)?.label || tipo;

/** Il giorno di oggi in aaaa-mm-gg, che e' il formato in cui si salva. */
export const oggiIso = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Mezzanotte del giorno indicato, per confrontarlo con una finestra. */
const istante = (giorno) => new Date(`${giorno}T12:00:00`).getTime();

/* ─── Chi puo' fare cosa ─────────────────────────────────── */

export const puoRegistrare = (me, persona) =>
  puo(me, 'people.attendance') && puoGuidare(me, persona);

/** Le persone per cui chi guarda puo' registrare qualcosa. */
export const squadraDi = (me) => {
  if (!me) return [];
  return getEmployeesOfManager(me.id).filter((p) => puoGuidare(me, p));
};

/* ─── Scrivere ───────────────────────────────────────────── */

/**
 * Registra un ritardo o un'assenza. Restituisce `null` se chi chiede non
 * guida quella persona: il controllo sta qui e non nella pagina, cosi' vale
 * anche se un domani lo chiama qualcun altro.
 */
export function registra(me, { employeeId, giorno, tipo, minuti, giustificata, nota }) {
  const persona = getUserById(employeeId);
  if (!persona || !puoRegistrare(me, persona)) return null;
  if (tipo !== RITARDO && tipo !== ASSENZA) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(giorno || '')) return null;
  // Un ritardo domani non e' un dato, e' una previsione.
  if (giorno > oggiIso()) return null;

  return addPresenza({ employeeId, giorno, tipo, minuti, giustificata, nota, daId: me.id });
}

export function elimina(me, id) {
  // La persona si legge dall'evento, non dall'id: l'id la contiene, ma gli
  // identificativi hanno il trattino dentro ("u-mgr1") e a spezzarli si
  // ottiene il pezzo sbagliato.
  const evento = getPresenze().find((e) => e.id === id);
  if (!evento) return false;
  const persona = getUserById(evento.employeeId);
  if (!persona || !puoRegistrare(me, persona)) return false;
  return deletePresenza(id);
}

export const eventoDelGiorno = (employeeId, giorno, orgId) =>
  getPresenzaDelGiorno(employeeId, giorno, orgId);

/* ─── Leggere ────────────────────────────────────────────── */

/** Gli eventi di una persona dentro una finestra (o tutti, senza finestra). */
export function eventiDi(userId, finestra = null, orgId) {
  const tutti = getPresenzeForUser(userId, orgId);
  if (!finestra) return tutti;
  return tutti.filter((e) => {
    const t = istante(e.giorno);
    return t >= finestra.da && t <= finestra.a;
  });
}

/**
 * I numeri di una persona: quante assenze, quanti ritardi, quanti minuti in
 * tutto. E' quello che finisce nelle analytics.
 */
export function riepilogoDi(userId, finestra = null, orgId) {
  const eventi = eventiDi(userId, finestra, orgId);
  const assenze = eventi.filter((e) => e.tipo === ASSENZA);
  const ritardi = eventi.filter((e) => e.tipo === RITARDO);
  return {
    eventi,
    assenze: assenze.length,
    assenzeGiustificate: assenze.filter((e) => e.giustificata).length,
    ritardi: ritardi.length,
    ritardiGiustificati: ritardi.filter((e) => e.giustificata).length,
    minuti: ritardi.reduce((s, e) => s + (e.minuti || 0), 0),
    ultimo: eventi[0] || null,
  };
}

/** Il riepilogo di ognuno, ordinato da chi ha piu' eventi. */
export function riepilogoSquadra(me, finestra = null) {
  return squadraDi(me)
    .map((persona) => ({ persona, riepilogo: riepilogoDi(persona.id, finestra, persona.orgId) }))
    .sort((a, b) => {
      const pesa = (r) => r.assenze * 2 + r.ritardi;
      return pesa(b.riepilogo) - pesa(a.riepilogo) || a.persona.name.localeCompare(b.persona.name);
    });
}

/**
 * Il registro di tutta la squadra in ordine di data, il piu' recente in
 * cima: e' la vista "cosa e' successo", quella da cui si corregge un errore.
 */
export function registroDi(me, { finestra = null, personaId = '', tipo = '' } = {}) {
  const righe = [];
  for (const persona of squadraDi(me)) {
    if (personaId && persona.id !== personaId) continue;
    for (const evento of eventiDi(persona.id, finestra, persona.orgId)) {
      if (tipo && evento.tipo !== tipo) continue;
      righe.push({ evento, persona });
    }
  }
  return righe.sort((a, b) => (a.evento.giorno < b.evento.giorno ? 1 : -1));
}

/* ─────────────────────────────────────────────────────────────
   Presence Streak

   Quanti giorni di fila una persona non ha un'assenza registrata.

   Il conto e' sui giorni di calendario, non sui giorni lavorativi: ferie,
   festivi, sabati e domeniche non sono assenze, quindi non spezzano
   niente. A spezzare e' solo una registrazione di assenza — l'unica cosa
   che il sistema sa davvero. Il resto sarebbe un calendario dei turni che
   qui non esiste, e inventarlo vorrebbe dire azzerare le serie di
   chiunque vada in ferie.

   Da quando si conta. Se non c'e' mai stata un'assenza la domanda "da
   quanti giorni?" non ha risposta: ogni giorno da che mondo e' mondo e'
   un giorno senza assenze. L'ancora e' il giorno in cui l'organizzazione
   ha cominciato a registrare, cioe' la prima registrazione qualunque —
   di chiunque, di qualunque tipo. Prima di quella non sapevamo niente, e
   contare quel niente sarebbe regalare mesi che nessuno ha verificato.
   Finche' nessuno ha registrato nulla, la serie non e' misurabile: si
   dice, invece di mostrare uno zero che sembra una colpa.

   Le quattro soglie sono qui, in un posto solo, e si cambiano da qui.
   ───────────────────────────────────────────────────────────── */

export const LIVELLI_PRESENZA = [
  { id: 'bronze',  nome: 'Bronze',  soglia: 30,  metallo: 1 },
  { id: 'silver',  nome: 'Silver',  soglia: 90,  metallo: 2 },
  { id: 'gold',    nome: 'Gold',    soglia: 200, metallo: 3 },
  { id: 'diamond', nome: 'Diamond', soglia: 400, metallo: 4 },
];

/**
 * La famiglia di medaglie della Presence Streak: l'orologio nella corona
 * d'alloro, gia' nel progetto fra quelle che un manager puo' scegliere
 * creando una competenza. E' l'unica che parla di tempo, e ha i quattro
 * metalli che servono — cosi' Skill Tree e profilo mostrano medaglie della
 * stessa mano invece di due mondi diversi.
 */
export const FAMIGLIA_BADGE_PRESENZA = 'custom-44';

/** I giorni che valgono un Immortal. */
export const IMMORTAL_GIORNI = 365;

/** L'immagine del metallo di un livello (o del primo, se non c'e' livello). */
export const badgeLivello = (livello) =>
  badgePerNome(`${FAMIGLIA_BADGE_PRESENZA}-${livello?.metallo ?? 1}`);

/* ─── Conti sui giorni ─── */

const GIORNO = 86400000;
const aData = (giorno) => new Date(`${giorno}T12:00:00`).getTime();
/** Giorni interi da `a` a `b`, negativi se `b` viene prima. */
const distanza = (a, b) => Math.round((aData(b) - aData(a)) / GIORNO);
const piuGiorni = (giorno, n) => {
  const d = new Date(aData(giorno) + n * GIORNO);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Il giorno in cui l'organizzazione ha cominciato a registrare. */
export function inizioTracciamento(orgId) {
  let primo = null;
  for (const e of getPresenze()) {
    if (e.orgId !== orgId) continue;
    if (!primo || e.giorno < primo) primo = e.giorno;
  }
  return primo;
}

const assenzeDi = (userId, orgId) => getPresenzeForUser(userId, orgId)
  .filter((e) => e.tipo === ASSENZA)
  .map((e) => e.giorno)
  .sort();

/**
 * I tratti di calendario senza assenze, dal giorno in cui si e' cominciato
 * a registrare a oggi. L'ultimo e' quello in corso.
 */
function segmenti(userId, orgId, oggi) {
  const ancora = inizioTracciamento(orgId);
  if (!ancora || distanza(ancora, oggi) < 0) return { ancora: null, tratti: [] };

  /* Le assenze di *questa* organizzazione: la serie di presenza si conta
     da quando questa ha cominciato a registrare, e mescolarci le assenze di
     un altro posto la spezzerebbe per un giorno che qui non c'entra. */
  const assenze = assenzeDi(userId, orgId).filter((g) => g >= ancora && g <= oggi);
  const tratti = [];
  let da = ancora;
  for (const assenza of assenze) {
    const giorni = distanza(da, assenza);           // il giorno dell'assenza non conta
    if (giorni > 0) tratti.push({ da, a: piuGiorni(assenza, -1), giorni });
    da = piuGiorni(assenza, 1);
  }
  const giorni = distanza(da, oggi) + 1;
  tratti.push(giorni > 0 ? { da, a: oggi, giorni } : { da: null, a: null, giorni: 0 });
  return { ancora, tratti };
}

/**
 * La Presence Streak di una persona: quella in corso, la piu' lunga mai
 * fatta, il livello e quanto manca al prossimo.
 *
 * `misurabile` e' falso finche' nessuno ha registrato niente: e' diverso da
 * una serie di zero giorni, e le due cose non si devono confondere.
 */
export function presenceStreak(userId, oggi = oggiIso()) {
  const persona = getUserById(userId);
  const vuota = {
    misurabile: false, giorni: 0, inizio: null, piuLunga: 0,
    livello: null, prossimo: LIVELLI_PRESENZA[0],
    mancanti: LIVELLI_PRESENZA[0].soglia, percentuale: 0, alMassimo: false,
  };
  if (!persona) return vuota;

  const { ancora, tratti } = segmenti(userId, persona.orgId, oggi);
  if (!ancora) return vuota;

  const corrente = tratti[tratti.length - 1];
  const giorni = corrente.giorni;
  const piuLunga = tratti.reduce((max, t) => Math.max(max, t.giorni), 0);

  // Il livello e' l'ultima soglia superata; il prossimo e' quello dopo, e
  // sopra Diamond non c'e' un dopo.
  const livello = [...LIVELLI_PRESENZA].reverse().find((l) => giorni >= l.soglia) || null;
  const prossimo = LIVELLI_PRESENZA.find((l) => giorni < l.soglia) || null;

  // La barra riparte da zero a ogni livello: misura il tratto fra la soglia
  // raggiunta e quella dopo, non la strada fatta dall'inizio.
  const base = livello?.soglia ?? 0;
  const percentuale = prossimo
    ? Math.max(0, Math.min(100, Math.round(((giorni - base) / (prossimo.soglia - base)) * 100)))
    : 100;

  return {
    misurabile: true,
    giorni,
    inizio: corrente.giorni > 0 ? corrente.da : null,
    piuLunga,
    livello,
    prossimo,
    mancanti: prossimo ? prossimo.soglia - giorni : 0,
    percentuale,
    // Arrivati a Diamond la barra non riparte piu': resta piena, e a salire
    // e' solo il numero dei giorni.
    alMassimo: !prossimo,
  };
}

/**
 * Immortal: 365 giorni senza assenze, e si puo' riprendere.
 *
 * Stessa forma della serie delle quest — cicli chiusi e ciclo in corso —
 * cosi' il motore degli achievement lo tratta come tratta gia' Deadline
 * Master, senza sapere niente di presenze.
 *
 * Un tratto lungo il doppio vale due volte: e' la lettura naturale di un
 * traguardo ripetibile, e chi non si assenta mai per due anni ha fatto due
 * volte quello che l'achievement chiede.
 */
export function serieImmortal(persona, target = IMMORTAL_GIORNI) {
  if (!persona) return { cicli: 0, serie: 0 };
  const { ancora, tratti } = segmenti(persona.id, persona.orgId, oggiIso());
  if (!ancora) return { cicli: 0, serie: 0 };
  const cicli = tratti.reduce((n, t) => n + Math.floor(t.giorni / target), 0);
  const corrente = tratti[tratti.length - 1].giorni;
  return { cicli, serie: corrente % target };
}

/** I totali dell'organizzazione, per il pannello in cima alla pagina. */
export function riepilogoOrg(me, finestra = null) {
  const squadra = riepilogoSquadra(me, finestra);
  const somma = (campo) => squadra.reduce((s, r) => s + r.riepilogo[campo], 0);
  const conEventi = squadra.filter((r) => r.riepilogo.eventi.length > 0);
  return {
    persone: squadra.length,
    conEventi: conEventi.length,
    assenze: somma('assenze'),
    ritardi: somma('ritardi'),
    minuti: somma('minuti'),
    giustificate: somma('assenzeGiustificate') + somma('ritardiGiustificati'),
    squadra,
  };
}
