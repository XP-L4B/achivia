/** Le quest: assegnare, accettare, consegnare, approvare. */

import { annuncia, db, ensureProjects, save, segnaAttivita } from './nucleo';
import { getUserById, getUserInOrg, xpForNextLevel } from './utenti';
import { muoviCrediti, daEsperienza } from './crediti';
import { getProjectById } from './progetti';
import { addNotification } from './avvisi';

/* ─── Quest ──────────────────────────────────────────────── */
/**
 * Le quest scadute diventano scadute.
 *
 * Prima nessuno lo faceva: `scaduta` era uno stato che solo i dati di prova
 * sapevano scrivere, e in uso vero una quest oltre la scadenza restava "in
 * corso" per sempre. Restava nell'elenco del dipendente come se fosse
 * ancora da fare, e i conti delle quest scadute — nel riepilogo
 * dell'organizzazione, nelle analitiche, nelle tendenze — erano
 * permanentemente a zero perche' misuravano una cosa che non succedeva mai.
 *
 * Il tempo passa anche mentre nessuno guarda, ma qui non c'e' niente che
 * giri di notte: la scadenza si applica quando qualcuno legge le quest,
 * che e' il momento in cui serve saperlo. Il risultato e' lo stesso, il
 * costo e' un giro sull'elenco.
 *
 * Non tocca le quest gia' consegnate: se una persona ha completato in
 * tempo e il manager approva tre giorni dopo, non e' lei ad essere in
 * ritardo — il ritardo della consegna lo dice gia' `late`, che si calcola
 * al momento della consegna e non qui.
 */
function scadiLeScadute() {
  const adesso = Date.now();
  let cambiato = false;
  for (const q of db.quests) {
    if (q.status !== 'in_corso' || !q.deadline) continue;
    if (q.completedAt) continue;
    if (new Date(q.deadline).getTime() >= adesso) continue;
    q.status = 'scaduta';
    q.scadutaIl = new Date().toISOString();
    cambiato = true;
    if (q.assigneeId) {
      addNotification({
        userId: q.assigneeId,
        kind: 'quest_scaduta',
        text: `È scaduta la quest "${q.title}" senza che venisse completata.`,
        questId: q.id,
      });
    }
    if (q.createdById && q.createdById !== q.assigneeId) {
      addNotification({
        userId: q.createdById,
        kind: 'quest_scaduta',
        text: `È scaduta la quest "${q.title}", assegnata e non completata.`,
        questId: q.id,
      });
    }
  }
  if (cambiato) save();
}

/* Ogni lettura delle quest passa di qui. Filtrare `db.quests` direttamente
   salterebbe il setaccio, e la scadenza tornerebbe a non succedere per
   chi guarda da quella porta. */
export const quest = () => { scadiLeScadute(); return db.quests; };

export const getQuests = () => quest();
export const getQuestById = (id) => quest().find((q) => q.id === id);

// Quest create da un manager.
export const getQuestsByManager = (managerId) =>
  quest().filter((q) => q.createdById === managerId);

// Quest che competono a un employee (assegnate a lui, al suo dipartimento
// o a un progetto di cui è membro).
export const getQuestsForEmployee = (employee) =>
  quest().filter(
    (q) =>
      (q.assigneeType === 'employee' && q.assigneeId === employee.id) ||
      (q.assigneeType === 'department' && q.assigneeId === employee.department) ||
      (q.assigneeType === 'project' && getProjectById(q.assigneeId)?.memberIds?.includes(employee.id))
  );

const MS_48H = 48 * 60 * 60 * 1000;

// Quest assegnate a un manager (da altri manager).
export const getQuestsAssignedToManager = (managerId) =>
  quest().filter((q) => q.assigneeType === 'manager' && q.assigneeId === managerId);

// Quest che competono a una persona qualunque sia il suo ruolo. Per un
// manager valgono anche quelle che un altro manager ha assegnato a lui:
// senza questo i suoi dati personali resterebbero vuoti.
export const getQuestsForUser = (user) =>
  user.role === 'manager'
    ? [...getQuestsForEmployee(user), ...getQuestsAssignedToManager(user.id)]
    : getQuestsForEmployee(user);

/**
 * Se una persona puo' guidarne un'altra: assegnarle quest, guardarne i dati,
 * aprirne la scheda.
 *
 * L'admin guida tutti quelli della sua organizzazione. Nessun manager guida
 * l'admin: sta sopra la linea, non dentro un team, e i suoi dati non sono
 * materia di chi gestisce le persone. Fra pari — manager e manager — la
 * visibilita' resta quella che c'era.
 */
export function puoGuidare(me, persona) {
  if (!me || !persona || me.id === persona.id || !me.orgId) return false;
  /* La persona si guarda dentro l'organizzazione di chi la sta guardando:
     ruolo, responsabile e reparti sono quelli di *qui*. Il record grezzo
     porta addosso il canale che quella persona ha aperto sul suo telefono
     in questo momento, e deciderci sopra chi puo' guidare chi vorrebbe dire
     dare o negare il comando in base a dove si trova l'altro adesso.
     Torna `null` se qui dentro non c'e': e quello e' gia' un no. */
  const qui = getUserInOrg(persona.id, me.orgId);
  if (!qui) return false;
  if (qui.role === 'admin') return me.role === 'admin';
  if (me.role === 'admin') return true;
  // Il perimetro di chi gestisce: la propria squadra, i pari, e chi sta
  // in un dipartimento che si ha in comune — un capo turno del magazzino
  // guida quelli del magazzino, anche se non gli sono appesi sotto.
  if (qui.managerId === me.id || qui.role === 'manager') return true;
  const miei = new Set(me.departmentIds ?? []);
  return miei.size > 0 && (qui.departmentIds ?? []).some((id) => miei.has(id));
}

// Etichetta leggibile dell'assegnatario di una quest.
export const getAssigneeLabel = (quest) => {
  if (quest.assigneeType === 'employee' || quest.assigneeType === 'manager') {
    return getUserById(quest.assigneeId)?.name ?? '—';
  }
  if (quest.assigneeType === 'department') return `Dipartimento ${quest.assigneeId}`;
  if (quest.assigneeType === 'project') {
    ensureProjects();
    return db.projects.find((p) => p.id === quest.assigneeId)?.name ?? 'Progetto';
  }
  return 'Non assegnata';
};

// Viste per un manager (filtrate sulle quest che ha creato).
export const getActiveQuestsByManager = (managerId) =>
  quest().filter((q) => q.createdById === managerId && q.status === 'in_corso' && !q.rejected);

export const getExpiringQuestsByManager = (managerId) =>
  quest().filter(
    (q) =>
      q.createdById === managerId &&
      (q.status === 'scaduta' ||
        (q.status === 'in_corso' && q.deadline && new Date(q.deadline).getTime() - Date.now() <= MS_48H))
  );

export const getQuestsToApproveByManager = (managerId) =>
  quest().filter((q) => q.createdById === managerId && q.status === 'da_approvare');

export const getTemplatesByManager = (managerId) =>
  quest().filter((q) => q.createdById === managerId && q.status === 'template');

// Side Quest attive create da un manager senza destinatario: prendibili in carico
// dai dipendenti dalla "Bacheca Team".
export const getAvailableQuestsByManager = (managerId) =>
  quest().filter(
    (q) =>
      q.createdById === managerId &&
      q.status === 'in_corso' &&
      !q.rejected &&
      (q.assigneeType == null || q.assigneeId == null)
  );

// Quest rifiutate da un dipendente (restano in_corso ma con flag rejected).
export const getRejectedQuestsByManager = (managerId) =>
  quest().filter((q) => q.createdById === managerId && q.rejected === true);

// "My Quest": quest del manager gia valutate (approvate o rifiutate).
export const getDecidedQuestsByManager = (managerId) =>
  quest().filter((q) => q.createdById === managerId && (q.status === 'approvata' || q.status === 'rifiutata'));

let questSeq = 0;
export function addQuest(quest) {
  questSeq += 1;
  // L'esperienza non si scrive piu' sulla quest: la dice la ricompensa in
  // crediti. Se qualcuno prova a passarla, si scarta qui — un campo che
  // nessuno legge ma che qualcuno scrive e' il modo in cui i dati si
  // sporcano in silenzio.
  const created = { id: `q-new-${Date.now()}-${questSeq}`, ...quest };
  delete created.xp;
  db.quests.unshift(created);
  save();
  return created;
}

export function updateQuest(id, patch) {
  const q = db.quests.find((x) => x.id === id);
  if (!q) return null;
  Object.assign(q, patch);
  delete q.xp;
  save();
  return q;
}

export function deleteQuest(id) {
  const before = db.quests.length;
  db.quests = db.quests.filter((q) => q.id !== id);
  if (db.quests.length !== before) save();
}

/**
 * Il dipendente segnala una quest come finita: passa in attesa di
 * approvazione e resta scritto quando.
 *
 * La puntualita' si decide qui, non all'approvazione: e' il momento in cui
 * il lavoro e' stato consegnato che conta, non quando il manager ha avuto
 * tempo di guardarlo. Senza scadenza non c'e' ritardo possibile.
 */
export function completeQuest(id, daId) {
  const q = db.quests.find((x) => x.id === id);
  if (!q || q.status === 'da_approvare' || q.status === 'approvata') return q || null;
  q.status = 'da_approvare';
  q.completedAt = new Date().toISOString();
  q.late = Boolean(q.deadline) && new Date(q.completedAt) > new Date(q.deadline);
  // Chi consegna, se lo sappiamo: su una quest personale e' l'incaricato,
  // su una di gruppo lo sa solo la schermata da cui e' partito il gesto.
  const chi = daId
    || ((q.assigneeType === 'employee' || q.assigneeType === 'manager') ? q.assigneeId : null);
  if (chi) segnaAttivita(chi, 'ha consegnato una quest');
  save();
  return q;
}

/**
 * L'esperienza di una quest e' la sua ricompensa in crediti.
 *
 * Erano due numeri scollegati, e chi creava una quest doveva sceglierli tutti
 * e due: la stessa fatica poteva valere 100 di esperienza e 10 di crediti o
 * il contrario, senza che niente lo impedisse. Adesso il valore di un lavoro
 * e' uno solo — i crediti — e l'esperienza lo segue: chi guadagna cento
 * crediti sale di cento punti.
 *
 * Si legge qui invece di stare scritto sulla quest, cosi' non ci sono due
 * copie dello stesso numero che possono divergere.
 */
export const xpDiQuest = (q) => Math.max(0, Math.round(Number(q?.credits) || 0));

// Accredita XP a un utente, gestendo eventuali passaggi di livello.
function awardXp(u, xp) {
  if (!u || !xp) return;
  u.xp = (u.xp || 0) + xp;
  let threshold = xpForNextLevel(u.level);
  while (u.xp >= threshold) {
    u.xp -= threshold;
    u.level += 1;
    threshold = xpForNextLevel(u.level);
  }
}

/**
 * Accredita crediti a una persona, e con essi l'esperienza.
 *
 * Ogni credito *guadagnato* vale un punto esperienza: una quest approvata,
 * la ricompensa di un achievement. Passa tutto di qui perche' non ci sia un
 * solo posto in cui i crediti guadagnati si muovono senza che l'esperienza
 * li segua.
 *
 * Guadagnati, non ricevuti. A dire quali lo sono e' la causale del
 * movimento (`crediti.js`, campo `esperienza`), e la si legge dalla riga
 * appena scritta nel registro invece che dall'argomento: quello che il
 * registro dice e quello per cui si sale di livello sono la stessa cosa, e
 * non possono divergere. Crediti comprati con del denaro, dotazioni
 * dell'abbonamento, versamenti dalla cassa e rimborsi si muovono di qui
 * senza portare un punto — e chi un giorno collegherà il servizio di
 * pagamento non deve ricordarsi di niente perche' succeda.
 *
 * Spendere non toglie esperienza: i crediti si consumano, quello che si e'
 * imparato no.
 *
 * `movimento` e' la ragione da scrivere nel registro: la causale e l'id
 * della cosa che l'ha causata. Ha un valore di partenza perche' il caso di
 * gran lunga piu' frequente e' una quest approvata, ma la causale si passa
 * sempre quando si sa: un registro pieno di righe che dicono "quest" senza
 * che lo fossero e' peggio di nessun registro.
 */
export function accredita(u, crediti, movimento = {}) {
  const somma = Math.max(0, Math.round(Number(crediti) || 0));
  if (!u || !somma) return;
  // L'admin non guadagna crediti: e' quello che li mette in circolo, e un
  // proprietario che si paga da solo non e' una ricompensa, e' un travaso.
  // I suoi crediti entrano da una parte sola, l'acquisto. Il controllo sta
  // qui e non nei chiamanti perche' qui passano tutti — quest approvate,
  // ricompense degli achievement, qualunque cosa venga dopo.
  if (u.role === 'admin') return;
  const riga = muoviCrediti({ causale: 'quest', ...movimento, userId: u.id, quanti: somma });
  // Se la persona non e' nel deposito il movimento non si fa, e allora non
  // si fa nemmeno l'esperienza: le due cose stanno insieme o non stanno.
  if (!riga) return;
  if (daEsperienza(riga.causale)) awardXp(u, somma);
}

/**
 * Chi incassa la ricompensa di una quest.
 *
 * Una quest personale la incassa chi ce l'ha; una di gruppo — un progetto,
 * un dipartimento, un'istanza — la incassano tutti quelli che ci hanno
 * lavorato. L'admin non incassa mai, nemmeno quando lavora dentro un team o
 * un progetto: la ricompensa si divide fra gli altri.
 */
export function beneficiariDi(quest) {
  if (!quest) return [];
  let persone = [];
  if (quest.assigneeType === 'employee' || quest.assigneeType === 'manager') {
    const uno = getUserById(quest.assigneeId);
    persone = uno ? [uno] : [];
  } else if (quest.assigneeType === 'project') {
    persone = (getProjectById(quest.assigneeId)?.memberIds ?? [])
      .map((id) => getUserById(id))
      .filter(Boolean);
  } else if (quest.assigneeType === 'department') {
    persone = db.users.filter((u) => u.department === quest.assigneeId);
  }
  return persone.filter((u) => u.role !== 'admin');
}

/**
 * Quanto tocca a ciascuno: la ricompensa divisa in parti uguali fra chi la
 * incassa. Il resto della divisione — quei due o tre crediti che non si
 * spartiscono — va ai primi in ordine di id: da qualche parte deve andare, e
 * cosi' e' sempre lo stesso e non dipende da com'erano ordinati i dati.
 */
export function quoteDi(quest) {
  const persone = beneficiariDi(quest).sort((a, b) => a.id.localeCompare(b.id));
  const totale = Math.max(0, Math.round(Number(quest?.credits) || 0));
  if (persone.length === 0) return [];
  const base = Math.floor(totale / persone.length);
  const resto = totale - base * persone.length;
  return persone.map((persona, i) => ({ persona, crediti: base + (i < resto ? 1 : 0) }));
}

/** La parte di una persona su una quest: zero se non le tocca niente. */
export const quotaDi = (quest, userId) =>
  quoteDi(quest).find((q) => q.persona.id === userId)?.crediti ?? 0;

/** Quanto esce davvero dalla quest: la somma delle parti pagate. */
export const creditiPagatiDi = (quest) =>
  quoteDi(quest).reduce((somma, q) => somma + q.crediti, 0);

// Approva una quest e accredita crediti ed esperienza a chi l'ha portata a
// termine (una sola volta).
// Chiedere aiuto non costa crediti: la ricompensa resta intera a chi aveva la
// quest, anche quando un collega gli ha dato una mano.
//
// `feedback` e' il commento che il manager puo' lasciare approvando: viene
// salvato sulla quest con chi l'ha scritto e quando, e il dipendente lo
// ritrova aprendo la quest fra quelle concluse. Senza testo non si salva
// nulla, cosi' una quest senza commento non porta un feedback vuoto.
export function approveQuest(id, feedback) {
  const q = db.quests.find((x) => x.id === id);
  if (!q || q.status === 'approvata') return q;
  q.status = 'approvata';

  const testo = (feedback?.text || '').trim();
  if (testo) {
    q.feedback = { text: testo, byId: feedback.byId ?? null, at: new Date().toISOString() };
  }
  // Serve alle analytics per filtrare per periodo: senza questa data
  // il selettore 1 settimana / 1 mese / 3 mesi non avrebbe su cosa lavorare.
  q.approvedAt = new Date().toISOString();
  // Rete di sicurezza per le quest chiuse prima che esistesse completedAt:
  // senza un giudizio sulla puntualita' il Deadline Master non saprebbe che
  // farsene di questa quest.
  if (q.late == null) {
    const consegna = q.completedAt || q.approvedAt;
    q.late = Boolean(q.deadline) && new Date(consegna) > new Date(q.deadline);
  }
  // Una sola riga per tutti i casi: chi la incassa e quanto lo dice
  // `quoteDi`, che sa dividere fra i membri di un gruppo e sa che l'admin
  // resta fuori.
  for (const { persona, crediti } of quoteDi(q)) {
    accredita(persona, crediti, { causale: 'quest', riferimento: q.id, daId: feedback?.byId ?? null });
  }
  if (feedback?.byId) segnaAttivita(feedback.byId, 'ha approvato una quest');
  save();
  annuncia({ tipo: 'QuestApprovata', questId: q.id, userId: q.assigneeId ?? null });
  return q;
}

/* Le quest di un progetto sono quest, non progetti: stanno di qua, e cosi'
   i due domini si guardano da una parte sola. */
export const getQuestsByProject = (projectId) =>
  quest().filter((q) => q.projectId === projectId);
