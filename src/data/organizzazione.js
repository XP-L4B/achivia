/**
 * I numeri dell'organizzazione.
 *
 * L'admin non esegue quest, non prende certificazioni e non ha una serie di
 * presenze: un profilo che gli raccontasse i suoi traguardi personali gli
 * mostrerebbe tre riquadri vuoti. Quello che a lui interessa e' come sta
 * andando l'azienda — quante quest girano, quante si chiudono, quanto si
 * certifica, quanto vale l'economia interna.
 *
 * Come per gli achievement, qui non si tiene nessun contatore: ogni misura e'
 * una domanda sui dati di adesso. Ricalcolarla due volte da lo stesso
 * risultato, e nessun numero puo' restare indietro rispetto ai fatti.
 */

import {
  getUsersByOrg, getQuests, getOrdini, getCertifications, getCustomSkills,
  getAchievementInstances, getHelpRequestsByRequester, getReviewsForUser,
  getTeamsByOrg, getProjectsByManager, getPresenze, getUserById, creditiPagatiDi,
} from './db';
import { gestisce } from './permessi';
import {
  riepilogoDi, presenceStreak, inizioTracciamento, oggiIso,
  LIVELLI_PRESENZA, ASSENZA, RITARDO,
} from './presenze';

const GIORNO = 86400000;

const conclusa = (q) => q.status === 'approvata';
const diGruppo = (q) =>
  q.type === 'istanza' || q.assigneeType === 'project' || q.assigneeType === 'department';

/* ─── Il perimetro ───────────────────────────────────────────────────────
   Una quest e' dell'organizzazione quando qualcuno di qui l'ha scritta o
   qualcuno di qui l'ha ricevuta. I modelli non contano: sono lavoro che non
   e' mai stato chiesto a nessuno. */

export const personeDi = (orgId) => getUsersByOrg(orgId);

export function questDi(orgId) {
  const suoi = new Set(personeDi(orgId).map((p) => p.id));
  return getQuests().filter(
    (q) => q.status !== 'template' && (suoi.has(q.createdById) || suoi.has(q.assigneeId))
  );
}

/** Le quest concluse dentro una finestra: si datano alla loro approvazione. */
const nella = (finestra) => (q) => {
  if (!finestra) return true;
  const t = new Date(q.approvedAt || q.completedAt || 0).getTime();
  return t >= finestra.da && t <= finestra.a;
};

/* ─── Le misure ──────────────────────────────────────────────────────────
   Una domanda per misura, sui dati di adesso. Sono scritte una volta sola
   perche' le usano sia i riquadri del profilo sia — piu' avanti — i
   traguardi dell'organizzazione. */

export const MISURE_ORG = {
  /* Quest */
  quest_assegnate: (orgId) => questDi(orgId).length,
  quest_completate: (orgId) => questDi(orgId).filter(conclusa).length,
  quest_in_tempo: (orgId) => questDi(orgId).filter((q) => conclusa(q) && q.late !== true).length,
  quest_in_ritardo: (orgId) => questDi(orgId).filter((q) => conclusa(q) && q.late === true).length,
  quest_in_corso: (orgId) => questDi(orgId).filter((q) => q.status === 'in_corso').length,
  quest_da_approvare: (orgId) => questDi(orgId).filter((q) => q.status === 'da_approvare').length,
  quest_scadute: (orgId) => questDi(orgId).filter((q) => q.status === 'scaduta').length,
  quest_gruppo: (orgId) => questDi(orgId).filter((q) => conclusa(q) && diGruppo(q)).length,
  quest_side: (orgId) => questDi(orgId).filter((q) => conclusa(q) && q.type === 'side').length,

  /* Persone */
  membri: (orgId) => personeDi(orgId).length,
  responsabili: (orgId) => personeDi(orgId).filter((p) => p.role !== 'admin' && gestisce(p)).length,

  /* Competenze */
  certificazioni: (orgId) => certificazioniDi(orgId).length,
  competenze_coperte: (orgId) => new Set(certificazioniDi(orgId).map((c) => c.skillId)).size,
  competenze_proprie: (orgId) => getCustomSkills(orgId).length,

  /* Riconoscimenti */
  // Le medaglie consegnate alle persone. I traguardi dell'organizzazione
  // restano fuori: sono la misura, non possono anche essere il misurato —
  // altrimenti prenderne uno avvicinerebbe il successivo.
  medaglie: (orgId) => istanzeDi(orgId).filter((i) => i.ambito !== 'org').length,
  extra_mile: (orgId) =>
    istanzeDi(orgId).filter((i) => i.achievementId === 'extra-mile').length,
  review: (orgId) => personeDi(orgId).reduce((n, p) => n + getReviewsForUser(p.id).length, 0),

  /* Collaborazione */
  aiuti_risolti: (orgId) => aiutiDi(orgId).filter((h) => h.acceptedAt).length,
  aiuti_chiesti: (orgId) => aiutiDi(orgId).length,
  team: (orgId) => getTeamsByOrg(orgId).length,
  progetti: (orgId) =>
    personeDi(orgId).reduce((n, p) => n + getProjectsByManager(p.id).length, 0),

  /* Qualita', ritmo, storia */
  puntualita: (orgId) => {
    const complete = questDi(orgId).filter(conclusa);
    // Sotto le cinquanta quest una percentuale dice piu' del caso che
    // dell'organizzazione: due consegne su due non sono il 100%.
    if (complete.length < 50) return 0;
    return percentuale(complete.filter((q) => q.late !== true).length, complete.length);
  },
  approvazioni_rapide: (orgId) =>
    questDi(orgId).filter((q) => conclusa(q) && entro(q.completedAt, q.approvedAt, 48)).length,
  settimane_di_fila: (orgId) => serieDiPeriodi(settimaneAttive(orgId)),
  trimestri_in_crescita: (orgId) => trimestriInCrescita(orgId),
  mesi_puliti: (orgId) => mesiPuliti(orgId),
  anzianita: (orgId) => {
    const nascita = nascitaOrg(orgId);
    return nascita ? Math.max(0, Math.floor((Date.now() - nascita) / GIORNO)) : 0;
  },

  /* Competenze e presenze, letture piu' fini */
  certificazioni_esperto: (orgId) => certificazioniDi(orgId).filter((c) => Number(c.level) === 4).length,
  persone_serie_lunga: (orgId) => personeDi(orgId).filter((p) => {
    const s = presenceStreak(p.id);
    return s.misurabile && s.giorni >= SOGLIA_SERIE_LUNGA;
  }).length,

  /* Collaborazione, letture piu' fini */
  aiutanti_diversi: (orgId) =>
    new Set(aiutiDi(orgId).filter((h) => h.acceptedAt && h.helperId).map((h) => h.helperId)).size,
  aiuti_rapidi: (orgId) => aiutiDi(orgId).filter((h) => entro(h.createdAt, h.acceptedAt, 24)).length,

  /* Crediti */
  // Quello che e' uscito davvero: una quest di gruppo si divide fra i suoi,
  // e la parte che sarebbe toccata a un admin non viene pagata a nessuno.
  crediti_distribuiti: (orgId) =>
    questDi(orgId).filter(conclusa).reduce((s, q) => s + creditiPagatiDi(q), 0)
    + istanzeDi(orgId).reduce((s, i) => s + (Number(i.crediti) || 0), 0),
  crediti_circolanti: (orgId) => personeDi(orgId).reduce((s, p) => s + (Number(p.credits) || 0), 0),
  crediti_spesi: (orgId) => ordiniDi(orgId).reduce((s, o) => s + (Number(o.crediti) || 0), 0),
  ordini: (orgId) => ordiniDi(orgId).length,
};

/* ─── Conti sul calendario ───────────────────────────────────────────────
   Le date si maneggiano come giorni, non come istanti: un evento del 3
   marzo alle 23 e uno del 4 alle 8 sono due giorni diversi anche se fra
   loro passano nove ore. E' la stessa aritmetica del registro delle
   presenze, tenuta qui perche' serve anche alle quest. */

const giornoDi = (v) => {
  const t = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(t) ? isoDi(t) : null;
};
const isoDi = (t) => {
  const d = new Date(t);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const aData = (iso) => new Date(`${iso}T00:00:00`).getTime();
const distanza = (da, a) => Math.round((aData(a) - aData(da)) / GIORNO);
const piuGiorni = (iso, n) => isoDi(aData(iso) + n * GIORNO);

/** Due istanti entro un tot di ore l'uno dall'altro (e nell'ordine giusto). */
const entro = (da, a, ore) => {
  if (!da || !a) return false;
  const scarto = new Date(a).getTime() - new Date(da).getTime();
  return scarto >= 0 && scarto <= ore * 3600000;
};

const SOGLIA_SERIE_LUNGA = LIVELLI_PRESENZA.find((l) => l.id === 'silver')?.soglia ?? 90;

/**
 * Quando e' nata l'organizzazione.
 *
 * Le organizzazioni create dall'app portano la data addosso — `orgCreatedAt`
 * sull'admin, e l'id stesso e' un istante — ma quelle che c'erano prima no.
 * Per loro si prende il primo fatto registrato: la prima quest, la prima
 * presenza. E' una data d'inizio onesta: prima di quel giorno,
 * dell'organizzazione non c'e' traccia.
 */
export function nascitaOrg(orgId) {
  const admin = personeDi(orgId).find((p) => p.orgOwner) || personeDi(orgId).find((p) => p.role === 'admin');
  if (admin?.orgCreatedAt) return new Date(admin.orgCreatedAt).getTime();

  const daId = /^org-(\d{10,})$/.exec(orgId || '');
  if (daId) return Number(daId[1]);

  const date = [];
  for (const q of questDi(orgId)) {
    for (const v of [q.createdAt, q.approvedAt, q.completedAt, q.deadline]) {
      const t = v ? new Date(v).getTime() : NaN;
      if (Number.isFinite(t)) date.push(t);
    }
  }
  const primaPresenza = inizioTracciamento(orgId);
  if (primaPresenza) date.push(aData(primaPresenza));
  return date.length ? Math.min(...date) : null;
}

/* ─── Le serie ───────────────────────────────────────────────────────────
   Una serie non e' un totale: si spezza. Ognuna restituisce i tratti
   interi che ha fatto, quello in corso e il piu' lungo di sempre — con
   questi tre numeri sia un traguardo ripetibile (quante volte ho fatto
   novanta giorni) sia uno a livelli (quanto e' lungo il mio record) sanno
   cosa dire. */

const serieVuota = { tratti: [], corrente: 0, massimo: 0 };

/**
 * I tratti di calendario in cui non e' successo niente di quello che
 * spezzerebbe la serie, dal primo giorno osservato a oggi.
 */
function serieDiGiorni(inizio, rotture, oggi = oggiIso()) {
  if (!inizio || distanza(inizio, oggi) < 0) return serieVuota;
  const spezza = [...new Set(rotture)].filter((g) => g >= inizio && g <= oggi).sort();

  const tratti = [];
  let da = inizio;
  for (const giorno of spezza) {
    const giorni = distanza(da, giorno);            // il giorno rotto non conta
    if (giorni > 0) tratti.push(giorni);
    da = piuGiorni(giorno, 1);
  }
  const corrente = Math.max(0, distanza(da, oggi) + 1);
  if (corrente > 0) tratti.push(corrente);
  return { tratti, corrente, massimo: tratti.length ? Math.max(...tratti) : 0 };
}

/** I giorni in cui una quest e' scaduta senza essere completata. */
const giorniConScadenza = (orgId) => questDi(orgId)
  .filter((q) => q.status === 'scaduta')
  .map((q) => giornoDi(q.deadline))
  .filter(Boolean);

const giorniConEvento = (orgId, tipo) => getPresenze()
  .filter((e) => e.tipo === tipo && (e.orgId === orgId || getUserById(e.employeeId)?.orgId === orgId))
  .map((e) => e.giorno);

/**
 * Il filotto: quante quest di fila si sono chiuse bene. Lo spezza una
 * consegna in ritardo e lo spezza una quest lasciata scadere — che e'
 * esattamente il fallimento che questo traguardo premia di evitare.
 */
function filottoInTempo(orgId) {
  const chiusure = questDi(orgId)
    .filter((q) => conclusa(q) || q.status === 'scaduta')
    .map((q) => ({
      quando: new Date(q.approvedAt || q.completedAt || q.deadline || 0).getTime(),
      bene: conclusa(q) && q.late !== true,
    }))
    .sort((a, b) => a.quando - b.quando);

  const tratti = [];
  let corrente = 0;
  for (const c of chiusure) {
    if (c.bene) { corrente += 1; continue; }
    if (corrente > 0) tratti.push(corrente);
    corrente = 0;
  }
  if (corrente > 0) tratti.push(corrente);
  return { tratti, corrente, massimo: tratti.length ? Math.max(...tratti) : 0 };
}

export const SERIE_ORG = {
  giorni_senza_scadute: (orgId) => {
    const nascita = nascitaOrg(orgId);
    return serieDiGiorni(nascita ? isoDi(nascita) : null, giorniConScadenza(orgId));
  },
  giorni_senza_assenze: (orgId) =>
    serieDiGiorni(inizioTracciamento(orgId), giorniConEvento(orgId, ASSENZA)),
  giorni_senza_ritardi: (orgId) =>
    serieDiGiorni(inizioTracciamento(orgId), giorniConEvento(orgId, RITARDO)),
  quest_senza_ritardi: (orgId) => filottoInTempo(orgId),
};

/* ─── Settimane, mesi, trimestri ─────────────────────────────────────────*/

/** Il numero di settimana assoluto: serve solo a dire se due sono di fila. */
const settimanaDi = (t) => Math.floor((aData(isoDi(t)) + 3 * GIORNO) / (7 * GIORNO));

const settimaneAttive = (orgId) => new Set(
  questDi(orgId)
    .filter((q) => conclusa(q) && q.approvedAt)
    .map((q) => settimanaDi(new Date(q.approvedAt).getTime()))
);

/** Il tratto piu' lungo di periodi consecutivi in un insieme di periodi. */
function serieDiPeriodi(periodi) {
  const ordinati = [...periodi].sort((a, b) => a - b);
  let massimo = 0;
  let corrente = 0;
  let precedente = null;
  for (const p of ordinati) {
    corrente = precedente !== null && p === precedente + 1 ? corrente + 1 : 1;
    precedente = p;
    if (corrente > massimo) massimo = corrente;
  }
  return massimo;
}

const meseDi = (iso) => iso.slice(0, 7);

/**
 * I mesi gia' chiusi in cui nessuno si e' assentato. Il mese in corso non
 * conta: non e' ancora andato bene, sta andando bene.
 */
function mesiPuliti(orgId) {
  const inizio = inizioTracciamento(orgId);
  if (!inizio) return 0;
  const sporchi = new Set(giorniConEvento(orgId, ASSENZA).map(meseDi));
  const meseCorrente = meseDi(oggiIso());

  let contati = 0;
  const cursore = new Date(`${inizio.slice(0, 7)}-01T00:00:00`);
  // Il primo mese osservato si conta solo se lo si e' visto per intero.
  if (Number(inizio.slice(8, 10)) > 1) cursore.setMonth(cursore.getMonth() + 1);
  while (meseDi(isoDi(cursore.getTime())) < meseCorrente) {
    if (!sporchi.has(meseDi(isoDi(cursore.getTime())))) contati += 1;
    cursore.setMonth(cursore.getMonth() + 1);
  }
  return contati;
}

const trimestreDi = (t) => {
  const d = new Date(t);
  return d.getFullYear() * 4 + Math.floor(d.getMonth() / 3);
};

/**
 * I trimestri chiusi meglio del precedente. Il trimestre in corso resta
 * fuori: confrontare tre settimane con tre mesi non dice niente.
 */
function trimestriInCrescita(orgId) {
  const perTrimestre = new Map();
  for (const q of questDi(orgId)) {
    if (!conclusa(q) || !q.approvedAt) continue;
    const k = trimestreDi(new Date(q.approvedAt).getTime());
    perTrimestre.set(k, (perTrimestre.get(k) || 0) + 1);
  }
  const corrente = trimestreDi(Date.now());
  const chiavi = [...perTrimestre.keys()].filter((k) => k < corrente).sort((a, b) => a - b);

  let cresciuti = 0;
  for (const k of chiavi) {
    const prima = perTrimestre.get(k - 1);
    if (prima != null && perTrimestre.get(k) > prima) cresciuti += 1;
  }
  return cresciuti;
}

function certificazioniDi(orgId) {
  const suoi = new Set(personeDi(orgId).map((p) => p.id));
  return getCertifications().filter((c) => suoi.has(c.employeeId) && c.status === 'certified');
}

function istanzeDi(orgId) {
  const suoi = new Set(personeDi(orgId).map((p) => p.id));
  return getAchievementInstances().filter((i) => suoi.has(i.userId));
}

function aiutiDi(orgId) {
  return personeDi(orgId).flatMap((p) => getHelpRequestsByRequester(p.id));
}

function ordiniDi(orgId) {
  const suoi = new Set(personeDi(orgId).map((p) => p.id));
  return getOrdini().filter((o) => suoi.has(o.userId) && o.stato !== 'annullato');
}

/* ─── Le griglie di Analytics ────────────────────────────────────────────*/

const dentroFinestra = (v, finestra) => {
  if (!finestra) return true;
  const t = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(t) && t >= finestra.da && t <= finestra.a;
};

/**
 * I numeri dell'organizzazione dentro un periodo: e' la griglia che l'admin
 * trova in cima ad Analytics, la stessa domanda che la pagina fa su una
 * persona sola, fatta su tutti.
 *
 * Il periodo si applica a quello che ha una data di chiusura — le quest
 * concluse, gli aiuti, le certificazioni, gli acquisti. Quello che e' in
 * corso non si taglia: una quest aperta non e' "di marzo", e' aperta adesso,
 * quindi si conta solo quando si guarda tutto lo storico. E' la stessa
 * regola delle griglie personali.
 */
export function analiticheOrg(orgId, finestra = null) {
  const persone = personeDi(orgId);
  const tutte = questDi(orgId);
  const nelPeriodo = (q) => dentroFinestra(q.approvedAt, finestra);

  const complete = tutte.filter((q) => conclusa(q) && nelPeriodo(q));
  const scadute = tutte.filter((q) => q.status === 'scaduta' && dentroFinestra(q.deadline, finestra));
  const aperte = finestra ? [] : tutte.filter((q) => q.status === 'in_corso');
  const daApprovare = finestra ? [] : tutte.filter((q) => q.status === 'da_approvare');
  const inRitardo = complete.filter((q) => q.late === true);
  const inTempo = complete.length - inRitardo.length;
  // Il totale su cui si leggono le percentuali: quello che nel periodo si e'
  // chiuso in un modo o nell'altro, piu' quello che e' ancora in mano a
  // qualcuno quando si guarda tutto.
  const totale = complete.length + scadute.length + aperte.length + daApprovare.length;

  const richieste = persone.flatMap((p) => getHelpRequestsByRequester(p.id))
    .filter((h) => dentroFinestra(h.createdAt, finestra));

  const presenze = persone.reduce((acc, p) => {
    const r = riepilogoDi(p.id, finestra, p.orgId);
    acc.assenze += r.assenze;
    acc.assenzeGiustificate += r.assenzeGiustificate;
    acc.ritardi += r.ritardi;
    acc.ritardiGiustificati += r.ritardiGiustificati;
    acc.minuti += r.minuti;
    return acc;
  }, { assenze: 0, assenzeGiustificate: 0, ritardi: 0, ritardiGiustificati: 0, minuti: 0 });

  const istanze = istanzeDi(orgId).filter((i) => dentroFinestra(i.ottenutoIl, finestra));
  const certificazioni = certificazioniDi(orgId).filter((c) => dentroFinestra(c.certifiedAt, finestra));
  const ordini = ordiniDi(orgId).filter((o) => dentroFinestra(o.creatoIl, finestra));

  return {
    totale,
    completate: complete.length,
    inTempo,
    inRitardo: inRitardo.length,
    scadute: scadute.length,
    inCorso: aperte.length,
    daApprovare: daApprovare.length,
    diGruppo: complete.filter(diGruppo).length,

    aiutiChiesti: richieste.length,
    aiutiRisolti: richieste.filter((h) => h.acceptedAt).length,

    assenze: presenze.assenze,
    assenzeGiustificate: presenze.assenzeGiustificate,
    ritardi: presenze.ritardi,
    ritardiGiustificati: presenze.ritardiGiustificati,
    minuti: presenze.minuti,

    persone: persone.length,
    responsabili: MISURE_ORG.responsabili(orgId),
    // Chi nel periodo ha chiuso almeno una quest: la partecipazione, non la
    // presenza.
    attivi: new Set(complete.map((q) => q.assigneeId).filter(Boolean)).size,
    certificazioni: certificazioni.length,
    medaglie: istanze.filter((i) => i.ambito !== 'org').length,
    review: MISURE_ORG.review(orgId),

    creditiDistribuiti: complete.reduce((s, q) => s + creditiPagatiDi(q), 0)
      + istanze.reduce((s, i) => s + (Number(i.crediti) || 0), 0),
    creditiSpesi: ordini.reduce((s, o) => s + (Number(o.crediti) || 0), 0),
    creditiCircolanti: MISURE_ORG.crediti_circolanti(orgId),
    ordini: ordini.length,
  };
}

/* ─── I riquadri del profilo ─────────────────────────────────────────────*/

const percentuale = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

/**
 * Il quadro che l'admin trova aprendo il suo profilo: quante quest girano e
 * quante si chiudono, chi c'e' e come cresce, quanto vale l'economia
 * interna. `giorni` limita le voci che hanno senso solo di recente — le
 * assenze del mese, chi ha chiuso qualcosa ultimamente.
 */
export function riepilogoOrganizzazione(orgId, { giorni = 30, adesso = Date.now() } = {}) {
  const finestra = { da: adesso - giorni * GIORNO, a: adesso };
  const persone = personeDi(orgId);
  const quests = questDi(orgId);

  const completate = quests.filter(conclusa);
  const inTempo = completate.filter((q) => q.late !== true);
  const scadute = quests.filter((q) => q.status === 'scaduta');
  const concluse = completate.length + scadute.length;

  // Chi ha chiuso qualcosa nel periodo: e' la partecipazione, non la
  // presenza. Una persona che non compare qui non e' assente, ma nessuna
  // delle quest chiuse di recente e' passata dalle sue mani.
  const attivi = new Set(
    completate.filter(nella(finestra)).map((q) => q.assigneeId).filter(Boolean)
  );

  const presenze = persone.reduce(
    (acc, p) => {
      const r = riepilogoDi(p.id, finestra, p.orgId);
      acc.assenze += r.assenze;
      acc.ritardi += r.ritardi;
      return acc;
    },
    { assenze: 0, ritardi: 0 }
  );

  const serie = persone
    .map((p) => presenceStreak(p.id))
    .filter((s) => s.misurabile)
    .map((s) => s.giorni);

  return {
    giorni,
    persone: persone.length,
    responsabili: MISURE_ORG.responsabili(orgId),
    attivi: attivi.size,

    assegnate: quests.length,
    completate: completate.length,
    inCorso: quests.filter((q) => q.status === 'in_corso').length,
    daApprovare: quests.filter((q) => q.status === 'da_approvare').length,
    scadute: scadute.length,
    inTempo: inTempo.length,
    inRitardo: completate.length - inTempo.length,
    diGruppo: completate.filter(diGruppo).length,
    // Due percentuali diverse, e non e' un doppione: la prima dice quante
    // delle quest chiuse sono finite bene, la seconda con che puntualita'.
    completamento: percentuale(completate.length, concluse),
    puntualita: percentuale(inTempo.length, completate.length),

    certificazioni: MISURE_ORG.certificazioni(orgId),
    competenzeCoperte: MISURE_ORG.competenze_coperte(orgId),
    medaglie: MISURE_ORG.medaglie(orgId),
    review: MISURE_ORG.review(orgId),
    aiutiRisolti: MISURE_ORG.aiuti_risolti(orgId),
    aiutiChiesti: MISURE_ORG.aiuti_chiesti(orgId),

    creditiDistribuiti: MISURE_ORG.crediti_distribuiti(orgId),
    creditiCircolanti: MISURE_ORG.crediti_circolanti(orgId),
    creditiSpesi: MISURE_ORG.crediti_spesi(orgId),
    ordini: MISURE_ORG.ordini(orgId),

    assenze: presenze.assenze,
    ritardi: presenze.ritardi,
    // La serie piu' lunga in corso: e' il numero che dice se la squadra sta
    // tenendo, senza fare la media di serie che partono da giorni diversi.
    serieMigliore: serie.length ? Math.max(...serie) : 0,
  };
}
