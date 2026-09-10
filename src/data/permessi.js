/**
 * Ruoli e permessi.
 *
 * La regola che tiene in piedi tutto: il ruolo dice *come si chiama* una
 * persona nell'organizzazione, i permessi dicono *che cosa puo' fare*. In
 * nessun punto dell'app si scrive piu' «se sei manager allora puoi creare
 * una quest»: si scrive «se hai il permesso di creare quest». Il giorno in
 * cui un'azienda inventa un "Capo turno" che crea quest ma non vede i dati,
 * non c'e' niente da riscrivere: si crea il ruolo e si spuntano i permessi.
 *
 * Tre cose che non sono permessi, e non devono diventarlo:
 *
 *   L'admin.        Ha tutto, sempre, e non si puo' limitare: un'azienda
 *                   che si toglie da sola l'accesso alla propria
 *                   organizzazione non ha nessuno a cui chiedere aiuto.
 *                   I co-admin sono admin uguali: stessi identici poteri.
 *
 *   Le proprie cose. Guardare le proprie quest, le proprie competenze, i
 *                   propri achievement non e' un permesso: e' l'app.
 *
 *   Il negozio.     Vive fuori dalle organizzazioni, con un accesso suo e
 *                   una dashboard sua: catalogo e ordini, non un profilo.
 *                   Non ha ruolo (`ruoloDi` -> null), non ha permessi
 *                   (`puo` -> false), e la sua area e' `shop`. Quello che
 *                   si aggiunge ai profili non lo riguarda, salvo che sia
 *                   detto per lui.
 *
 *   L'osservatorio. Stessa storia, altro mestiere: guarda il mercato delle
 *                   competenze da sopra, aggregato, senza appartenere a
 *                   nessuna organizzazione e senza poter aprire nessuna
 *                   schermata che ne riguardi una. Gli accessi si
 *                   consegnano a mano (vedi `RUOLI_APERTI` in `db.js`).
 */

import {
  addDipartimento, addRuolo, deleteDipartimento, deleteRuolo, getDipartimenti,
  getRuoli, getUserById, getUsers, getUsersByOrg, updateDipartimento, updateRuolo,
  updateUser, membroDi, aggiornaMembro, proprietarioOrg, registraOrganizzazione,
  osservatorioDiOrg,
} from './db';

/* ─── I permessi ─────────────────────────────────────────────
   Ventisette, in sei famiglie. Ognuno accende o spegne qualcosa che
   nell'app esiste davvero: un permesso che non comanda niente e' una
   promessa che prima o poi qualcuno crede. */

export const PERMESSI = [
  // Quest
  { id: 'quest.create',  gruppo: 'Quest', nome: 'Create Quests', nota: 'Creare nuove quest.' },
  { id: 'quest.edit',    gruppo: 'Quest', nome: 'Edit Quests', nota: 'Modificare quest esistenti.' },
  { id: 'quest.delete',  gruppo: 'Quest', nome: 'Delete/Cancel Quests', nota: 'Eliminare o annullare quest.' },
  { id: 'quest.assign',  gruppo: 'Quest', nome: 'Assign Quest', nota: 'Assegnare quest a persone, reparti o progetti.' },
  { id: 'quest.credits', gruppo: 'Quest', nome: 'Assign Credits to Quests', nota: 'Decidere la ricompensa in crediti.' },
  { id: 'quest.approve', gruppo: 'Quest', nome: 'Approve Quest Completion', nota: 'Confermare che una quest e’ stata completata.' },
  { id: 'quest.reject',  gruppo: 'Quest', nome: 'Reject Quest Completion', nota: 'Rifiutare una richiesta di completamento.' },
  { id: 'quest.team',    gruppo: 'Quest', nome: 'Manage Team Quests', nota: 'Mettere mano anche alle quest create da altri del team.' },

  // Analytics
  { id: 'analytics.personal', gruppo: 'Analytics', nome: 'View Personal Analytics', nota: 'Vedere le proprie statistiche.' },
  { id: 'analytics.team',     gruppo: 'Analytics', nome: 'View Team Analytics', nota: 'Vedere le statistiche del proprio team.' },
  { id: 'analytics.org',      gruppo: 'Analytics', nome: 'View Organization Analytics', nota: 'Vedere le statistiche di tutta l’organizzazione.' },
  { id: 'analytics.export',   gruppo: 'Analytics', nome: 'Export Analytics', nota: 'Esportare dati e report. L’esportazione arrivera’: il permesso e’ gia’ pronto.' },
  /* L'assistente. Legge i dati di una persona e dice come sta andando e su
     cosa farla crescere: e' uno strumento di chi guida, e leggerlo su
     qualcuno e' una cosa che non si fa per curiosita'. L'admin e i manager
     ce l'hanno; a chiunque altro si da' creandogli un ruolo con questo
     permesso, e ogni domanda scala il tetto mensile dell'organizzazione. */
  { id: 'ai.usa', gruppo: 'Analytics', nome: 'Use AI Tool', nota: 'Chiedere all’assistente un’analisi delle performance di una persona.' },

  // Competenze
  { id: 'skills.create',  gruppo: 'Competenze', nome: 'Create Skills', nota: 'Creare e modificare le competenze del catalogo.' },
  { id: 'skills.certify', gruppo: 'Competenze', nome: 'Certify Skills', nota: 'Certificare una competenza, o alzarne il livello.' },
  { id: 'skills.revoke',  gruppo: 'Competenze', nome: 'Revoke Certifications', nota: 'Togliere una certificazione gia’ data.' },

  // Performance review
  { id: 'review.write',     gruppo: 'Performance review', nome: 'Write Performance Reviews', nota: 'Scrivere una valutazione.' },
  { id: 'review.templates', gruppo: 'Performance review', nome: 'Manage Review Templates', nota: 'Creare e togliere i modelli di valutazione.' },
  { id: 'review.team',      gruppo: 'Performance review', nome: 'View Team Reviews', nota: 'Leggere le valutazioni scritte da altri sul proprio team.' },

  // Persone e team
  { id: 'people.team',         gruppo: 'Persone', nome: 'View Team', nota: 'Vedere le persone del proprio team e le loro schede.' },
  { id: 'people.teams',        gruppo: 'Persone', nome: 'Manage Teams', nota: 'Creare e modificare team e membri.' },
  { id: 'people.attendance',   gruppo: 'Persone', nome: 'Record Attendance', nota: 'Registrare ritardi e assenze.' },
  { id: 'people.achievements', gruppo: 'Persone', nome: 'Assign Achievements', nota: 'Assegnare a mano l’Extra Mile.' },

  // Organizzazione
  { id: 'org.users',   gruppo: 'Organizzazione', nome: 'Manage Users', nota: 'Invitare, disattivare, assegnare ruoli e dipartimenti.' },
  { id: 'org.roles',   gruppo: 'Organizzazione', nome: 'Manage Roles', nota: 'Creare e modificare i ruoli e i loro permessi.' },
  /* Quanto vale "Go the Extra Mile" non passa piu' di qui: e' una cosa
     dell'admin e dei co-admin, e un ruolo su misura non la puo' ricevere.
     Questo permesso per un anno non ha comandato niente, perche' i crediti
     dell'organizzazione non esistevano. Adesso esiste la cassa, e comanda
     lei: chi ce l'ha puo' dare a una persona i crediti che il piano ha
     messo dentro. */
  { id: 'org.credits', gruppo: 'Organizzazione', nome: 'Manage Org Credits', nota: 'Dare alle persone i crediti della cassa dell’organizzazione.' },
  /* Chi decide chi entra. Come gli altri permessi di questo gruppo non sta
     in nessun ruolo preimpostato: l'admin e i co-admin ce l'hanno perche'
     sono admin, e per darlo a qualcun altro bisogna creargli un ruolo
     apposta. Non e' una dimenticanza — decidere chi entra e' la porta di
     casa, e non deve capitare a qualcuno perche' e' stato messo "manager". */
  { id: 'org.ingressi', gruppo: 'Organizzazione', nome: 'Approve Members', nota: 'Approvare le richieste di ingresso e invitare persone nell’organizzazione.' },
];

export const GRUPPI = [...new Set(PERMESSI.map((p) => p.gruppo))];

export const permessoById = (id) => PERMESSI.find((p) => p.id === id) ?? null;

const TUTTI = PERMESSI.map((p) => p.id);

/** I permessi che riguardano la gestione: chi ne ha almeno uno guida qualcuno. */
export const PERMESSI_DI_GESTIONE = TUTTI.filter(
  (id) => !id.startsWith('analytics.personal'),
);

/* ─── I ruoli preimpostati ───────────────────────────────────
   Manager e Dipendente sono quelli che l'app ha sempre avuto, scritti
   in permessi. Non si modificano e non si cancellano — ci sta sopra
   meta' organizzazione — ma si duplicano: e' da li' che nasce un ruolo
   su misura. */

const MANAGER = [
  'quest.create', 'quest.edit', 'quest.delete', 'quest.assign', 'quest.credits',
  'quest.approve', 'quest.reject', 'quest.team',
  'analytics.personal', 'analytics.team', 'ai.usa',
  'skills.create', 'skills.certify', 'skills.revoke',
  'review.write', 'review.templates', 'review.team',
  'people.team', 'people.teams', 'people.attendance', 'people.achievements',
];

export const RUOLI_PREIMPOSTATI = [
  {
    id: 'preset-manager',
    nome: 'Manager',
    descrizione: 'Guida un team: assegna quest, certifica competenze, guarda i dati dei suoi.',
    permessi: MANAGER,
    preimpostato: true,
  },
  {
    id: 'preset-employee',
    nome: 'Dipendente',
    descrizione: 'Porta avanti le proprie quest e guarda i propri dati.',
    permessi: ['analytics.personal'],
    preimpostato: true,
  },
];

/* ─── Leggere ────────────────────────────────────────────── */

/** Tutti i ruoli di un'organizzazione: i due preimpostati e quelli suoi. */
export const ruoliDi = (orgId) => [
  ...RUOLI_PREIMPOSTATI,
  ...getRuoli().filter((r) => r.orgId === orgId),
];

export const ruoloById = (orgId, id) => ruoliDi(orgId).find((r) => r.id === id) ?? null;

/**
 * Il ruolo di una persona.
 *
 * Chi non ne ha uno scelto ricade sul preimpostato che gli corrisponde:
 * l'app ha vissuto anni con tre ruoli soli, e le persone di allora non
 * devono restare senza.
 */
export function ruoloDi(persona) {
  if (!persona) return null;
  if (persona.role === 'admin') return null;      // l'admin non passa dai ruoli
  // E nemmeno il negozio, l'osservatorio e il Castello: non sono persone
  // dentro un'organizzazione, e un ruolo li' non vorrebbe dire niente.
  if (AREE_FUORI_DALLE_ORG.includes(persona.role)) return null;
  const suo = persona.roleId ? ruoloById(persona.orgId, persona.roleId) : null;
  if (suo) return suo;
  return RUOLI_PREIMPOSTATI.find(
    (r) => r.id === (persona.role === 'manager' ? 'preset-manager' : 'preset-employee'),
  );
}

/**
 * Se una persona puo' fare una cosa.
 *
 * E' l'unica domanda che il resto dell'app deve farsi. Non «che ruolo hai»:
 * «puoi fare questo».
 */
export function puo(persona, permesso) {
  if (!persona) return false;
  if (persona.role === 'admin') return true;
  return Boolean(ruoloDi(persona)?.permessi?.includes(permesso));
}

/** Se ha almeno uno dei permessi passati. */
export const puoQualcosa = (persona, permessi) => permessi.some((p) => puo(persona, p));

/**
 * Chi decide chi entra: l'admin, i co-admin, e chi ha un ruolo su misura a
 * cui e' stato dato il permesso apposta.
 *
 * Un'organizzazione non si apre a chi ha il codice: il codice dice quale
 * organizzazione, non che ci si puo' entrare. Qualcuno di dentro deve dire
 * di si', e questa riga dice chi puo' essere quel qualcuno.
 */
export const puoApprovareIngressi = (persona) =>
  persona?.role === 'admin' || puo(persona, 'org.ingressi');

/**
 * Chi puo' chiedere all'assistente.
 *
 * L'admin, i manager, e chi ha un ruolo su misura con il permesso apposta.
 * Non tutti: l'assistente legge i dati di una persona e dice come sta
 * andando, ed e' uno strumento di chi guida — leggerlo su un collega non e'
 * una funzione che manca a chi non ce l'ha, e' una cosa che non gli
 * compete. E ogni domanda costa: il tetto e' dell'organizzazione, e chi
 * non lo consuma sono quelli che non hanno ragione di consumarlo.
 */
export const puoUsareAi = (persona) => persona?.role === 'admin' || puo(persona, 'ai.usa');

/** Se guida qualcuno: serve a decidere dove atterra dopo l'accesso. */
export const gestisce = (persona) => persona?.role === 'admin'
  || puoQualcosa(persona, PERMESSI_DI_GESTIONE);

/**
 * L'area dell'app in cui una persona vive.
 *
 * Non la decide il nome del ruolo: la decidono i permessi. Un "Capo turno"
 * che puo' creare quest atterra dove si creano le quest, comunque si
 * chiami; chi non gestisce niente sta fra le sue quest.
 */
/**
 * Le aree che vivono fuori dalle organizzazioni.
 *
 * Il negozio, l'osservatorio e il Castello. Non sono profili di persone:
 * non hanno un ruolo, non hanno permessi, non appartengono a nessuna
 * insegna e non ne aprono nessuna. I loro accessi si consegnano a mano.
 *
 * Stanno in un elenco solo perche' cinque punti dell'applicazione devono
 * sapere chi sta qui dentro — la barra, le due guardie, la pagina che manda
 * a casa dopo l'accesso — e finche' erano due nomi scritti a mano in ogni
 * punto, aggiungerne un terzo voleva dire trovarne quattro su cinque.
 */
export const AREE_FUORI_DALLE_ORG = ['shop', 'osservatorio', 'castle'];

export const fuoriDalleOrg = (area) => AREE_FUORI_DALLE_ORG.includes(area);

export const areaDi = (persona) => {
  if (!persona) return 'auth';
  if (persona.role === 'admin') return 'admin';
  // Le aree fuori dalle organizzazioni prima di tutto il resto: non hanno
  // permessi da consultare, e senza queste righe finirebbero fra i
  // dipendenti — con un profilo, le quest e lo Skill Tree di cui non sanno
  // che farsene.
  if (AREE_FUORI_DALLE_ORG.includes(persona.role)) return persona.role;
  return gestisce(persona) ? 'manager' : 'employee';
};

/* ─── L'osservatorio ─────────────────────────────────────────
   Ci si arriva da due porte diverse e non e' la stessa cosa.

   La prima e' l'account dell'osservatorio: una dashboard a parte, con un
   accesso che consegniamo noi, che guarda il mercato e non appartiene a
   nessuna organizzazione. Quella non si compra abbonandosi, e non e'
   cambiato niente.

   La seconda l'ha aperta il listino: dal Gold in poi un piano apre una
   parte dell'osservatorio a chi amministra l'organizzazione che paga. Il
   Gold una pagina sola — i profili di chi cerca lavoro, che e' quello che
   serve a un'azienda che assume — il Diamond tutte.

   Solo a chi amministra, e non e' una dimenticanza: e' un servizio comprato
   dall'organizzazione, e chi non decide gli acquisti non ha ragione di
   guardare il mercato del lavoro da dentro l'applicazione. */

/** Le tavole dell'osservatorio, come le nomina il percorso. */
export const TAVOLE_OSSERVATORIO = ['mercato', 'competenze', 'profili', 'mobilita', 'annunci'];

/**
 * Che accesso all'osservatorio ha una persona: 'completo', 'profili', 'no'.
 *
 * L'account dell'osservatorio vede tutto per definizione. Per tutti gli
 * altri la risposta la da' il piano, e solo se amministrano.
 */
export function accessoOsservatorio(persona) {
  if (!persona) return 'no';
  if (persona.role === 'osservatorio') return 'completo';
  if (persona.role !== 'admin' || !persona.orgId) return 'no';
  return osservatorioDiOrg(persona.orgId);
}

/** Se una persona puo' aprire una certa tavola dell'osservatorio. */
export function puoVedereTavola(persona, tavola) {
  const accesso = accessoOsservatorio(persona);
  if (accesso === 'completo') return true;
  if (accesso === 'profili') return tavola === 'profili';
  return false;
}

/**
 * Dove mandare chi entra nell'osservatorio: la prima tavola che puo'
 * aprire. `null` se non ne puo' aprire nessuna.
 */
export function primaTavola(persona) {
  const accesso = accessoOsservatorio(persona);
  if (accesso === 'completo') return '/osservatorio';
  if (accesso === 'profili') return '/osservatorio/profili';
  return null;
}

/** Quante persone hanno questo ruolo. */
export function quantiCon(orgId, ruoloId) {
  const preimpostato = RUOLI_PREIMPOSTATI.find((r) => r.id === ruoloId);
  return getUsersByOrg(orgId).filter((u) => {
    if (u.role === 'admin') return false;
    if (u.roleId) return u.roleId === ruoloId;
    if (!preimpostato) return false;
    return preimpostato.id === (u.role === 'manager' ? 'preset-manager' : 'preset-employee');
  }).length;
}

/* ─── Scrivere ───────────────────────────────────────────── */

const testo = (v) => String(v ?? '').trim();

const nonPuoi = { ok: false, errore: 'Non hai il permesso di gestire i ruoli.' };

/** Controlla un ruolo prima di salvarlo. */
export function erroriRuolo(orgId, { id, nome, permessi }) {
  const errori = [];
  const pulito = testo(nome);
  if (!pulito) errori.push('Il ruolo vuole un nome.');
  if (ruoliDi(orgId).some((r) => r.id !== id && r.nome.toLowerCase() === pulito.toLowerCase())) {
    errori.push('C’e’ gia’ un ruolo con questo nome.');
  }
  if (!Array.isArray(permessi) || permessi.length === 0) {
    errori.push('Un ruolo senza permessi non serve a niente: scegline almeno uno.');
  }
  if ((permessi || []).some((p) => !permessoById(p))) errori.push('Permesso sconosciuto.');
  return errori;
}

export function salvaRuolo(me, dati) {
  if (!puo(me, 'org.roles')) return nonPuoi;
  if (dati.id && RUOLI_PREIMPOSTATI.some((r) => r.id === dati.id)) {
    return { ok: false, errore: 'I ruoli preimpostati non si modificano: duplicane uno.' };
  }
  const errori = erroriRuolo(me.orgId, dati);
  if (errori.length) return { ok: false, errore: errori[0], errori };
  const pulito = {
    orgId: me.orgId,
    nome: testo(dati.nome),
    descrizione: testo(dati.descrizione),
    permessi: [...new Set(dati.permessi)],
  };
  const ruolo = dati.id ? updateRuolo(dati.id, pulito) : addRuolo(pulito);
  return ruolo ? { ok: true, ruolo } : { ok: false, errore: 'Ruolo non trovato.' };
}

/** Duplica un ruolo, anche preimpostato: e' il modo di partire da qualcosa. */
export function duplicaRuolo(me, ruoloId) {
  if (!puo(me, 'org.roles')) return nonPuoi;
  const sorgente = ruoloById(me.orgId, ruoloId);
  if (!sorgente) return { ok: false, errore: 'Ruolo non trovato.' };
  let nome = `${sorgente.nome} (copia)`;
  let n = 2;
  while (ruoliDi(me.orgId).some((r) => r.nome.toLowerCase() === nome.toLowerCase())) {
    nome = `${sorgente.nome} (copia ${n})`;
    n += 1;
  }
  return salvaRuolo(me, { nome, descrizione: sorgente.descrizione, permessi: sorgente.permessi });
}

/**
 * Elimina un ruolo. Chi ce l'ha resta senza, quindi prima va spostato:
 * un ruolo che sparisce sotto i piedi di qualcuno lo lascia senza
 * permessi e senza sapere perche'.
 */
export function eliminaRuolo(me, ruoloId) {
  if (!puo(me, 'org.roles')) return nonPuoi;
  if (RUOLI_PREIMPOSTATI.some((r) => r.id === ruoloId)) {
    return { ok: false, errore: 'I ruoli preimpostati non si eliminano.' };
  }
  const quanti = quantiCon(me.orgId, ruoloId);
  if (quanti > 0) {
    return {
      ok: false,
      errore: `${quanti} ${quanti === 1 ? 'persona ha' : 'persone hanno'} questo ruolo: spostale prima su un altro.`,
    };
  }
  return deleteRuolo(ruoloId) ? { ok: true } : { ok: false, errore: 'Ruolo non trovato.' };
}

/** Da' un ruolo a una persona. */
export function assegnaRuolo(me, personaId, ruoloId) {
  if (!puo(me, 'org.users')) return { ok: false, errore: 'Non hai il permesso di gestire le persone.' };
  const persona = getUserById(personaId);
  if (!persona || !membroDi(personaId, me.orgId)) return { ok: false, errore: 'Persona non trovata.' };
  if (persona.role === 'admin') return { ok: false, errore: 'Gli admin hanno tutti i permessi: non passano dai ruoli.' };
  const ruolo = ruoloById(me.orgId, ruoloId);
  if (!ruolo) return { ok: false, errore: 'Ruolo non trovato.' };
  // `role` resta il vecchio nome dell'area — serve alle schermate che non
  // sono ancora passate ai permessi — e segue il ruolo: chi gestisce
  // qualcosa e' un manager, chi non gestisce niente e' un dipendente.
  const gestisceQualcosa = ruolo.permessi.some((p) => PERMESSI_DI_GESTIONE.includes(p));
  updateUser(personaId, { roleId: ruolo.id, role: gestisceQualcosa ? 'manager' : 'employee' });
  return { ok: true, ruolo };
}

/* ─── I dipartimenti ─────────────────────────────────────────
   Dove una persona atterra. Non e' il ruolo a dirlo — un "Capo turno"
   puo' stare in produzione o in magazzino — ma il dipartimento che
   l'admin le assegna. Se ne puo' assegnare piu' d'uno: c'e' chi tiene
   due reparti. */

export const dipartimentiDi = (orgId) => getDipartimenti().filter((d) => d.orgId === orgId);

export const dipartimentoById = (id) => getDipartimenti().find((d) => d.id === id) ?? null;

/** I dipartimenti di una persona, come oggetti. */
export const dipartimentiDellaPersona = (persona) =>
  (persona?.departmentIds ?? []).map(dipartimentoById).filter(Boolean);

/** Se due persone condividono almeno un dipartimento. */
export const stessoDipartimento = (a, b) => {
  const suoi = new Set(a?.departmentIds ?? []);
  return (b?.departmentIds ?? []).some((id) => suoi.has(id));
};

export function salvaDipartimento(me, { id, nome }) {
  if (!puo(me, 'org.users')) return { ok: false, errore: 'Non hai il permesso di gestire le persone.' };
  const pulito = testo(nome);
  if (!pulito) return { ok: false, errore: 'Il dipartimento vuole un nome.' };
  if (dipartimentiDi(me.orgId).some((d) => d.id !== id && d.nome.toLowerCase() === pulito.toLowerCase())) {
    return { ok: false, errore: 'C’e’ gia’ un dipartimento con questo nome.' };
  }
  const dip = id
    ? updateDipartimento(id, { nome: pulito })
    : addDipartimento({ orgId: me.orgId, nome: pulito });
  return dip ? { ok: true, dipartimento: dip } : { ok: false, errore: 'Dipartimento non trovato.' };
}

export function eliminaDipartimento(me, id) {
  if (!puo(me, 'org.users')) return { ok: false, errore: 'Non hai il permesso di gestire le persone.' };
  const quante = getUsers().filter((u) => (u.departmentIds ?? []).includes(id)).length;
  if (quante > 0) {
    return {
      ok: false,
      errore: `${quante} ${quante === 1 ? 'persona sta' : 'persone stanno'} in questo dipartimento: spostale prima.`,
    };
  }
  return deleteDipartimento(id) ? { ok: true } : { ok: false, errore: 'Dipartimento non trovato.' };
}

export function assegnaDipartimenti(me, personaId, ids) {
  if (!puo(me, 'org.users')) return { ok: false, errore: 'Non hai il permesso di gestire le persone.' };
  const persona = getUserById(personaId);
  if (!persona || !membroDi(personaId, me.orgId)) return { ok: false, errore: 'Persona non trovata.' };
  const validi = [...new Set(ids)].filter((id) => dipartimentoById(id)?.orgId === me.orgId);
  updateUser(personaId, { departmentIds: validi });
  return { ok: true };
}

/* ─── Admin, co-admin, proprieta' ────────────────────────────
   Un'organizzazione ha un proprietario e puo' avere altri admin, con gli
   stessi identici poteri. La proprieta' e' una cosa sola in piu': si
   passa a un co-admin, e serve a poter andarsene lasciando
   l'organizzazione a qualcun altro. */

export const proprietarioDi = (orgId) => proprietarioOrg(orgId);

export const eProprietario = (persona) => Boolean(persona?.orgOwner);

export function promuoviCoAdmin(me, personaId) {
  if (me?.role !== 'admin') return { ok: false, errore: 'Solo un admin puo’ nominare un altro admin.' };
  const persona = getUserById(personaId);
  if (!persona || !membroDi(personaId, me.orgId)) return { ok: false, errore: 'Persona non trovata.' };
  if (persona.role === 'admin') return { ok: false, errore: 'E’ gia’ un admin.' };
  updateUser(personaId, { role: 'admin', roleId: null });
  return { ok: true };
}

/**
 * Toglie l'admin a un co-admin. Il proprietario no: prima passa la
 * proprieta' a qualcun altro, se no l'organizzazione resta senza padrone.
 */
export function revocaCoAdmin(me, personaId, ruoloId = 'preset-manager') {
  if (me?.role !== 'admin') return { ok: false, errore: 'Solo un admin puo’ togliere l’accesso a un altro admin.' };
  const persona = getUserById(personaId);
  if (!persona || !membroDi(personaId, me.orgId)) return { ok: false, errore: 'Persona non trovata.' };
  if (persona.role !== 'admin') return { ok: false, errore: 'Non e’ un admin.' };
  if (persona.orgOwner) return { ok: false, errore: 'E’ il proprietario dell’organizzazione: prima deve passare la proprieta’.' };
  const ruolo = ruoloById(me.orgId, ruoloId) ?? RUOLI_PREIMPOSTATI[0];
  const gestisceQualcosa = ruolo.permessi.some((p) => PERMESSI_DI_GESTIONE.includes(p));
  updateUser(personaId, { role: gestisceQualcosa ? 'manager' : 'employee', roleId: ruolo.id });
  return { ok: true };
}

/**
 * Passa la proprieta' dell'organizzazione a un altro admin.
 *
 * Si passa solo a un co-admin: chi riceve un'organizzazione deve gia'
 * saperla tenere, e chi la lascia resta admin — cosi' il passaggio non e'
 * anche un'uscita, e se e' stato uno sbaglio si torna indietro.
 */
export function trasferisciProprieta(me, personaId) {
  if (!eProprietario(me)) return { ok: false, errore: 'Solo il proprietario puo’ passare l’organizzazione.' };
  const persona = getUserById(personaId);
  if (!persona || !membroDi(personaId, me.orgId)) return { ok: false, errore: 'Persona non trovata.' };
  if (persona.role !== 'admin') return { ok: false, errore: 'La proprieta’ si passa a un co-admin: nominalo prima admin.' };
  aggiornaMembro(me.id, me.orgId, { proprietario: false });
  aggiornaMembro(personaId, me.orgId, { proprietario: true });
  registraOrganizzazione(me.orgId, { proprietarioId: personaId });
  /* I canali aperti vanno riallineati subito, tutti e due. Chi lascia sta
     guardando lo schermo adesso e senza questa riga continuerebbe a vedersi
     proprietario; chi riceve, se ha aperto proprio questa organizzazione,
     deve vedersi proprietario adesso e non al prossimo cambio di canale.
     Chi invece in questo momento sta da un'altra parte non si tocca: la
     proprieta' e' gia' scritta nella sua appartenenza, ed e' li' che la
     ritrovera' rientrando. */
  updateUser(me.id, { orgOwner: false });
  if (persona.orgId === me.orgId) updateUser(personaId, { orgOwner: true });
  return { ok: true };
}
