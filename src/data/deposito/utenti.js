/**
 * Le persone.
 *
 * Le organizzazioni stavano qui, scritte sui campi del loro proprietario.
 * Adesso hanno un registro loro (`organizzazioni.js`) e un registro di chi
 * ci sta dentro (`membri.js`), perche' una persona puo' stare in piu'
 * organizzazioni e possederne piu' d'una: un campo `premium` su un account
 * non sa a quale delle due si riferisce.
 *
 * Sul record di una persona resta quello che e' suo ovunque — nome,
 * numero, XP, crediti — piu' la proiezione del canale che ha aperto
 * adesso. Le funzioni che le schermate chiamavano si chiamano ancora
 * uguale e rispondono ancora alla stessa domanda: cambia solo da dove
 * leggono.
 */

import {
  db, ensureAchievements, ensureCarriera, ensureLavoro, ensureMembri, ensureNotifications,
  ensureSkills, generaAchiviaId, nuovoId, save,
} from './nucleo';
import { segnaCarriera } from './carriera';
import {
  getOrganizzazione, salvaOrganizzazione, nomeOrg, tipoOrg, orgPremium,
  orgPersonalizzata,
} from './organizzazioni';
import {
  entraNellOrg, aggiornaMembro, chiudiMembro, membroDi, membriDiOrg,
  orgDiPersona, personaIn,
} from './membri';
import { collegaInvitiA } from './ingressi';
import { creditiInCassa, muoviCassa, muoviCrediti, rigaMovimento } from './crediti';
import { limitiDiOrg } from './listino';
// Le cascate del cambio d'organizzazione vivono qui perche' partono da qui:
// e' `updateUser` l'unico punto in cui una persona cambia azienda. Quello
// che sanno fare — chiudere un passaggio, aprire o chiudere un abbonamento,
// togliere l'elenco — lo sa il dominio del lavoro, e si chiede a lui.
import { eraPremium, segnaAbbonamento, sospendiTrovabilita } from './lavoro';

/* ─── Utenti ─────────────────────────────────────────────── */
export const getUsers = () => db.users;

let userSeq = 0;
/**
 * I ruoli che si possono creare da dentro l'app. `shop` e `osservatorio`
 * non ci sono, e non e' una dimenticanza.
 *
 * Non sono ruoli dentro un'organizzazione e non si comprano abbonandone
 * una: sono due account a parte, che consegniamo noi. Il negozio e'
 * una postazione di vendita, l'osservatorio una dashboard di mercato; ne'
 * l'uno ne' l'altra stanno dentro un'azienda o un gruppo, e nessun
 * abbonamento ci da' accesso.
 *
 * Chi si registra diventa quindi admin della propria organizzazione o
 * membro di una che esiste gia', e nient'altro — anche se qualcuno
 * riuscisse a far arrivare qui un ruolo diverso, qui si ferma. E' l'unica
 * porta da cui nascono account, quindi e' l'unico posto in cui questa
 * regola deve stare scritta.
 */
const RUOLI_APERTI = ['admin', 'manager', 'employee'];

/**
 * Registra un'organizzazione, o completa quella che c'e' gia'.
 *
 * Si chiama da `addUser` quando nasce insieme al suo proprietario e dai
 * moduli di creazione quando si attacca a un account che esiste gia'.
 * Scrive solo i campi che le arrivano davvero: un ingresso per codice
 * passa di qui col solo `orgId`, e non deve cancellare il nome
 * dell'azienda in cui sta entrando.
 */
export function registraOrganizzazione(orgId, dati = {}) {
  if (!orgId) return null;
  const gia = getOrganizzazione(orgId);
  const patch = {};
  if (dati.nome !== undefined) patch.nome = dati.nome;
  if (dati.codice !== undefined) patch.codice = dati.codice;
  if (dati.tipo !== undefined) patch.tipo = dati.tipo === 'personalizzata' ? 'personalizzata' : 'azienda';
  if (dati.proprietarioId !== undefined) patch.proprietarioId = dati.proprietarioId;
  if (dati.creataIl !== undefined) patch.creataIl = dati.creataIl;
  if (!gia && patch.creataIl === undefined) patch.creataIl = new Date().toISOString();
  if (!gia && patch.tipo === undefined) patch.tipo = 'azienda';

  /* L'abbonamento adesso si accende anche su una personalizzata: i gruppi
     hanno un listino loro — quattro piani che comprano una cosa sola,
     quante persone ci stanno, e il silenzio dalla pubblicita' salendo. Fino
     a ieri questa riga lo impediva, perche' non c'era niente da vendergli.
     Adesso c'e', e la riga se ne va. */
  if (dati.premium !== undefined) patch.premium = Boolean(dati.premium);

  const dopo = salvaOrganizzazione(orgId, patch);
  /* Il periodo di abbonamento va scritto quando cambia, altrimenti fra un
     anno nessuno sa piu' se un risultato di oggi era stato ottenuto mentre
     l'organizzazione pagava — ed e' la domanda da cui dipende se quel
     risultato resta alla persona o sparisce quando esce. */
  if (patch.premium !== undefined && Boolean(gia?.premium) !== Boolean(patch.premium)) {
    /* Un'organizzazione che nasce gia' abbonata apre il periodo dal giorno
       in cui e' nata. Un abbonamento acceso o spento dopo vale da adesso —
       e chiuderlo alla data di nascita, come faceva questa riga, cancellava
       tutto il periodo in cui l'organizzazione aveva pagato davvero: i
       risultati ottenuti in quegli anni sarebbero spariti all'uscita come
       se fossero stati presi in freemium. */
    const nasceAbbonata = !gia && patch.premium;
    segnaAbbonamento(orgId, patch.premium, nasceAbbonata ? (patch.creataIl ?? undefined) : undefined);
  }
  return dopo;
}

export function addUser(user) {
  userSeq += 1;
  const {
    orgId = null, org, orgCode, orgTipo, orgOwner, orgCreatedAt, premium,
    roleId = null, departmentIds, managerId = null, ...persona
  } = user || {};

  // Di default ogni utente parte da livello 1, 0 XP e 0 crediti. Il numero
  // Achivia nasce insieme all'account e resta suo: se chi chiama ne passa
  // uno gia' preso, vince quello libero.
  const created = {
    id: `u-new-${Date.now()}-${userSeq}`,
    level: 1, xp: 0, credits: 0,
    /* Il giorno in cui l'account e' nato. Manca dall'inizio, e la mancanza
       non si vedeva finche' nessuno chiedeva "quanti account sono nati
       questa settimana": senza questa data la domanda non ha risposta, e
       non e' una risposta che si possa ricostruire dopo. Chi la passa —
       i dati di partenza, le organizzazioni di prova — tiene la sua. */
    creatoIl: new Date().toISOString(),
    ...persona,
    achiviaId: persona.achiviaId && !db.users.some((u) => u.achiviaId === persona.achiviaId)
      ? persona.achiviaId
      : generaAchiviaId(),
    // La proiezione del canale aperto. Nasce con quello in cui la persona
    // entra adesso, che e' anche l'unico che ha.
    orgId,
    roleId,
    departmentIds: departmentIds || [],
    managerId,
    orgOwner: Boolean(orgOwner),
  };
  if (!RUOLI_APERTI.includes(created.role)) created.role = 'employee';
  db.users.push(created);

  /* Gli inviti mandati a questo indirizzo quando ancora non esisteva un
     account adesso hanno un destinatario. E' l'unica strada per far entrare
     qualcuno che su Achivia non c'era: senza questa riga resterebbero li'
     a nome di nessuno. */
  collegaInvitiA(created);

  if (orgId) {
    /* Un proprietario nasce insieme alla sua organizzazione: e' l'unico
       momento in cui il tipo e il nome arrivano da chi crea l'account e
       non dal registro, perche' il registro non ce l'ha ancora. */
    if (orgOwner || org !== undefined || orgTipo !== undefined) {
      registraOrganizzazione(orgId, {
        nome: org,
        codice: orgCode,
        tipo: orgTipo,
        premium,
        creataIl: orgCreatedAt,
        proprietarioId: orgOwner ? created.id : undefined,
      });
    }
    entraNellOrg(created.id, orgId, {
      role: created.role,
      roleId,
      departmentIds: created.departmentIds,
      managerId,
      proprietario: Boolean(orgOwner),
      entratoIl: orgCreatedAt,
    });
    segnaCarriera(created, 'ingresso', null, created.role);
  }
  save();
  return created;
}

/* ─── Le organizzazioni, viste da qui ────────────────────────
   Le risposte arrivano dal registro (`organizzazioni.js`). Questi nomi
   restano perche' li chiamano settanta schermate e perche' dicono bene
   quello che chiedono: "di quale organizzazione", non "quale riga". */

/**
 * Il proprietario di un'organizzazione.
 *
 * Prima era il contrario — era lui a *essere* l'organizzazione, e il nome,
 * il tipo e l'abbonamento stavano scritti su di lui. Adesso l'
 * organizzazione sa di chi e', e questa funzione va a prendere la persona.
 * Se il registro non lo dice si ripiega su chi ci sta dentro con la
 * proprieta' segnata, e in ultimo sul primo admin: dati vecchi o scritti a
 * mano non devono restare senza proprietario.
 */
export const proprietarioOrg = (orgId) => {
  if (!orgId) return null;
  const o = getOrganizzazione(orgId);
  const dal = o?.proprietarioId ? getUserById(o.proprietarioId) : null;
  if (dal) return dal;
  const dentro = membriDiOrg(orgId);
  const m = dentro.find((x) => x.proprietario) || dentro.find((x) => x.role === 'admin');
  return m ? getUserById(m.userId) : null;
};

/* I due nomi storici. Chiedono la stessa cosa e la chiedono al registro:
   restano perche' li chiamano decine di schermate, e perche' "di quale
   organizzazione" si legge meglio di "quale riga". */
export const nomeOrgDi = nomeOrg;
export const tipoOrgDi = tipoOrg;

/* ─── I canali di una persona ────────────────────────────────
   Si chiedono per se stessi. L'elenco delle organizzazioni di qualcun
   altro non esce da nessuna funzione di questo file: non e' nascosto in
   una schermata, non c'e' proprio. */

/**
 * Le organizzazioni di cui una persona fa parte, con quello che serve per
 * disegnarne l'elenco: il nome, il tipo, il ruolo che ha li' dentro.
 */
export function mieOrganizzazioni(userId) {
  return orgDiPersona(userId).map((m) => ({
    orgId: m.orgId,
    nome: nomeOrg(m.orgId) || 'Organizzazione',
    tipo: tipoOrg(m.orgId),
    premium: orgPremium(m.orgId),
    role: m.role,
    proprietario: Boolean(m.proprietario),
    entratoIl: m.entratoIl,
  }));
}

/**
 * Apre un canale: la persona torna a essere quello che e' dentro
 * quell'organizzazione.
 *
 * Prima di cambiare, quello che c'era scritto addosso torna nella riga da
 * cui era uscito. Non e' una precauzione: e' che le schermate scrivono sul
 * record della persona — un reparto assegnato, un ruolo cambiato — e senza
 * questo passaggio quelle modifiche resterebbero appiccicate al canale
 * sbagliato.
 */
export function apriCanale(userId, orgId) {
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  if (u.orgId && u.orgId !== orgId) riponiCanale(u);
  const m = orgId ? membroDi(userId, orgId) : null;
  if (orgId && !m) return null;
  Object.assign(u, m
    ? {
      orgId,
      role: m.role,
      roleId: m.roleId ?? null,
      departmentIds: m.departmentIds ?? [],
      managerId: m.managerId ?? null,
      orgOwner: Boolean(m.proprietario),
    }
    : {
      orgId: null, role: u.role === 'admin' ? 'employee' : u.role,
      roleId: null, departmentIds: [], managerId: null, orgOwner: false,
    });
  // Aprire un canale e' anche il gesto che si fa ricaricando la pagina: e'
  // il segnale piu' onesto che questa persona sta usando l'applicazione
  // adesso, e vale piu' dell'accesso con la password, che qui capita una
  // volta ogni tanto.
  u.ultimoAccesso = new Date().toISOString();
  save();
  return u;
}

/** Chiude il canale aperto senza aprirne un altro: si torna all'elenco. */
export function riponiCanale(u) {
  if (!u?.orgId) return;
  aggiornaMembro(u.id, u.orgId, {
    role: u.role,
    roleId: u.roleId ?? null,
    departmentIds: u.departmentIds ?? [],
    managerId: u.managerId ?? null,
    proprietario: Boolean(u.orgOwner),
  });
}

/**
 * Da quanti giorni non si fa vedere. `null` se non lo si e' mai visto.
 *
 * Vale come misura dell'essere attivo: le finestre che interessano — due
 * giorni, una settimana, quindici giorni, un mese — sono confronti su
 * questo numero.
 */
export function giorniDaUltimoAccesso(u, adesso = Date.now()) {
  const quando = u?.ultimaAttivita || u?.ultimoAccesso;
  if (!quando) return null;
  const q = new Date(quando).getTime();
  if (Number.isNaN(q)) return null;
  return Math.max(0, Math.floor((adesso - q) / 86400000));
}

/** Chi si e' fatto vedere negli ultimi `giorni` giorni. */
export const attiviNegliUltimi = (giorni, adesso = Date.now()) =>
  db.users.filter((u) => {
    const d = giorniDaUltimoAccesso(u, adesso);
    return d !== null && d < giorni;
  });

// XP necessari per passare dal livello indicato a quello successivo (incrementale).
export const xpForNextLevel = (level) => level * 500;

export function updateUser(id, patch) {
  const u = db.users.find((x) => x.id === id);
  if (!u) return null;

  /* I campi dell'organizzazione non stanno piu' sulla persona: chi li passa
     qui — un modulo di creazione, una schermata che accende l'abbonamento —
     sta parlando dell'organizzazione, e li si mandano. Il proprietario si
     scrive solo quando arriva insieme alla proprieta': un aggiornamento
     qualunque non deve cambiare di chi e' un'azienda. */
  const { org, orgCode, orgTipo, premium, orgCreatedAt, ...resto } = patch || {};
  const orgTocca = org !== undefined || orgCode !== undefined
    || orgTipo !== undefined || premium !== undefined || orgCreatedAt !== undefined;
  const orgBersaglio = 'orgId' in resto ? resto.orgId : u.orgId;
  const diventaProprietario = resto.orgOwner === true || (u.orgOwner && !('orgOwner' in resto));
  if (orgTocca && orgBersaglio) {
    registraOrganizzazione(orgBersaglio, {
      nome: org,
      codice: orgCode,
      tipo: orgTipo,
      premium,
      creataIl: orgCreatedAt,
      proprietarioId: diventaProprietario ? u.id : undefined,
    });
  }

  // Prima di scrivere: se cambia ruolo o reparto, resta scritto anche il
  // movimento. Un profilo mostra dove si e' adesso; l'osservatorio deve
  // poter dire da dove si veniva.
  if (u.orgId) {
    if ('role' in resto && resto.role !== u.role) segnaCarriera(u, 'ruolo', u.role, resto.role);
    if ('roleId' in resto && resto.roleId !== u.roleId) segnaCarriera(u, 'ruoloOrg', u.roleId, resto.roleId);
    const prima = (u.departmentIds || []).join(',');
    const dopo = ('departmentIds' in resto ? resto.departmentIds || [] : u.departmentIds || []).join(',');
    if (prima !== dopo) segnaCarriera(u, 'reparto', prima || null, dopo || null);
  }

  const esce = 'orgId' in resto && (resto.orgId ?? null) !== (u.orgId ?? null);

  if (esce && u.orgId) chiudiPassaggio(u, u.orgId);
  /* Entrando in un'azienda si esce dall'elenco, subito. Uscendone non ci si
     rientra da soli: bisogna dirlo di nuovo, da liberi. Entrare in una
     personalizzata non toglie niente — quel posto non e' un lavoro. */
  if (esce && resto.orgId && !orgPersonalizzata(resto.orgId)) {
    sospendiTrovabilita(u, resto.orgId);
  }

  Object.assign(u, resto);
  if (esce) {
    // Quello che riparte da zero e' quello che descriveva il lavoro dentro
    // quell'organizzazione: reparto e ruolo su misura, che fuori non
    // vogliono dire niente.
    //
    // XP, livello e crediti no, e per la stessa ragione: non sono una
    // misura di quanto vali, sono un saldo. Gli XP fanno salire di livello
    // e il livello e' legato ai crediti — che si spendono in un negozio
    // fuori dalle organizzazioni e in parte si comprano. Azzerarli sarebbe
    // togliere alla persona una cosa che aveva. E' anche il motivo per cui
    // non interessano a chi cerca profili: dicono quanto si e' giocato, non
    // quanto si e' bravi, e infatti da questa parte non escono.
    if (!('departmentIds' in resto)) u.departmentIds = [];
    if (!('roleId' in resto)) u.roleId = null;
    if (u.orgId) {
      entraNellOrg(u.id, u.orgId, {
        role: u.role,
        roleId: u.roleId,
        departmentIds: u.departmentIds,
        managerId: u.managerId ?? null,
        proprietario: Boolean(u.orgOwner),
      });
      segnaCarriera(u, 'ingresso', null, u.role);
    }
  } else if (u.orgId) {
    /* Quello che si e' appena scritto sulla persona descrive il lavoro
       dentro il canale aperto, e la' dentro deve restare: senza questa
       riga un ruolo cambiato oggi si perderebbe al primo cambio di canale,
       oppure — peggio — si ritroverebbe appiccicato a un'altra
       organizzazione. */
    riponiCanale(u);
  }
  save();
  return u;
}

/**
 * Chiude un'organizzazione. La puo' chiudere solo chi la possiede.
 *
 * Serve perche' altrimenti chi ne crea una ci resta dentro per sempre: la
 * proprieta' si passa solo a un co-admin, e chi ha fatto un gruppo per la
 * propria famiglia un co-admin non ce l'ha. Senza questa porta, quel canale
 * gli resterebbe nell'elenco a vita.
 *
 * Chiudere non e' cancellare. Quello che restava in cassa va al
 * proprietario, per intero: quei crediti li ha pagati lui, e farli sparire
 * sarebbe il modo piu' rapido di farsi detestare da un cliente che sta gia'
 * chiudendo. A ognuno che c'era dentro si applicano le regole d'uscita di
 * sempre — quello che si e' guadagnato mentre l'azienda
 * pagava resta, quello di un gruppo no — e la riga dell'organizzazione
 * resta con la sua data di chiusura: senza, le certificazioni sopravvissute
 * punterebbero a un'organizzazione che non esiste, e non si potrebbe piu'
 * dire se al tempo pagava. Il codice pero' smette di funzionare, e
 * l'organizzazione sparisce dall'elenco di tutti.
 */
export function chiudiOrganizzazione(orgId, byId) {
  if (!orgId) return { ok: false, errore: 'Organizzazione non trovata.' };
  const chi = byId ? db.users.find((x) => x.id === byId) : null;
  const suo = chi ? membroDi(chi.id, orgId) : null;
  if (!suo?.proprietario) {
    return { ok: false, errore: 'Solo il proprietario puo’ chiudere l’organizzazione.' };
  }

  /* Prima escono tutti, uno per uno e con le stesse regole di chi se ne va
     da solo: e' l'unico modo perche' nessuno perda per la chiusura quello
     che non avrebbe perso uscendo. Il proprietario esce per ultimo, cosi'
     finche' si lavora l'organizzazione ha ancora qualcuno che la possiede. */
  const dentro = membriDiOrg(orgId).filter((m) => m.userId !== chi.id);
  for (const m of dentro) {
    const persona = db.users.find((x) => x.id === m.userId);
    if (persona) rimuoviDaOrg(persona.id, orgId);
  }
  rimuoviDaOrg(chi.id, orgId);

  // L'abbonamento si chiude adesso: da qui in avanti non paga piu' nessuno.
  if (orgPremium(orgId)) segnaAbbonamento(orgId, false);

  /* E la cassa passa a chi possedeva l'organizzazione, per intero.
     Non ai co-admin e non divisa fra i membri: e' il proprietario che
     l'ha pagata, e quando l'insegna chiude quei crediti tornano da lui.
     L'alternativa — azzerarla — voleva dire far sparire dei crediti
     comprati con del denaro, che e' il modo piu' rapido di farsi
     detestare da un cliente che sta gia' chiudendo. */
  const rimasti = creditiInCassa(orgId);
  if (rimasti > 0) {
    const uscita = muoviCassa({
      orgId,
      quanti: -rimasti,
      causale: 'versamento',
      riferimento: chi.id,
      daId: chi.id,
      nota: 'organizzazione chiusa',
    });
    if (uscita) {
      muoviCrediti({
        userId: chi.id,
        quanti: rimasti,
        causale: 'versamento',
        orgId,
        riferimento: uscita.id,
        nota: 'organizzazione chiusa',
      });
    }
  }

  salvaOrganizzazione(orgId, { premium: false, chiusaIl: new Date().toISOString() });
  save();
  return { ok: true };
}

/**
 * Toglie una persona da un'organizzazione, senza toccare il suo account.
 *
 * E' quello che fa un admin quando qualcuno non lavora piu' li'. Prima
 * questo cancellava l'account, e finche' una persona stava in un posto solo
 * le due cose coincidevano. Adesso no: l'autorita' di un admin finisce alla
 * sua organizzazione, e cancellare un account vorrebbe dire portare via a
 * una persona anche il suo gruppo sportivo, i suoi XP e i suoi crediti —
 * che non sono suoi da portare via.
 *
 * Le regole d'uscita sono le stesse di sempre: quello che si e' guadagnato
 * mentre l'azienda pagava resta, il resto no. Le altre organizzazioni della
 * persona non si toccano.
 */
export function rimuoviDaOrg(userId, orgId) {
  const u = db.users.find((x) => x.id === userId);
  if (!u || !orgId || !membroDi(userId, orgId)) return false;

  chiudiPassaggio(u, orgId);
  if (u.orgId === orgId) {
    /* Se e' proprio il canale che ha aperto adesso, va anche svuotato:
       altrimenti continuerebbe a girare dentro un'organizzazione da cui e'
       stata appena tolta, fino al prossimo accesso. */
    Object.assign(u, {
      orgId: null, role: u.role === 'admin' ? 'employee' : u.role,
      roleId: null, departmentIds: [], managerId: null, orgOwner: false,
    });
  }
  save();
  return true;
}

/**
 * Una persona esce da un'organizzazione.
 *
 * Da una personalizzata non si porta via niente: quello che c'era dentro era di
 * quella organizzazione e finisce li'. Da un'azienda si decide che cosa si
 * porta via e che cosa perde, e la regola e' una sola: vale quello che ha
 * ottenuto mentre l'azienda pagava. Il resto —
 * quest, competenze, achievement presi mentre l'organizzazione era
 * freemium — sparisce del tutto, e non si recupera. Non e' una pulizia:
 * e' il patto su cui si regge il valore dell'abbonamento.
 *
 * Quello che resta non viene copiato da nessuna parte: le certificazioni e
 * gli achievement portano gia' addosso l'organizzazione in cui sono nati, e
 * basta guardarli per orgId. Nel passaggio si scrivono solo i numeri che
 * vivono sulla persona e che il ritorno a zero cancellerebbe — XP, livello,
 * quest chiuse — perche' quelli, se non li fotografa nessuno, dopo non ci
 * sono piu'.
 */
function chiudiPassaggio(u, quale, ruolo) {
  ensureLavoro();
  const adesso = new Date().toISOString();
  /* L'organizzazione si puo' passare: uscire non e' piu' per forza uscire
     dal canale aperto. Un admin che toglie qualcuno dalla sua azienda lo
     toglie da li', mentre quella persona magari sta guardando il suo
     gruppo sportivo — e le regole d'uscita vanno applicate all'azienda, non
     a quello che ha sotto gli occhi. */
  const orgId = quale ?? u.orgId;
  const ruoloLi = ruolo ?? membroDi(u.id, orgId)?.role ?? u.role;

  /* Le quest ancora aperte tornano in circolo, senza destinatario.
     Il lavoro che era stato chiesto va comunque fatto: lasciarle appese al
     nome di qualcuno che qui dentro non c'e' piu' vorrebbe dire che nessuno
     le prende e nessuno le vede, e sparirebbero senza che nessuno lo abbia
     deciso. Cosi' invece ricompaiono nella bacheca del team, dove qualcun
     altro se le puo' prendere.
     Solo quelle di questa organizzazione: si riconoscono da chi le ha
     scritte, perche' una quest l'organizzazione non ce l'ha addosso. */
  const diQui = new Set(membriDiOrg(orgId).map((m) => m.userId));
  for (const q of db.quests || []) {
    if (q.assigneeId !== u.id || q.assigneeType === 'department' || q.assigneeType === 'project') continue;
    if (q.status !== 'in_corso' && q.status !== 'da_approvare') continue;
    if (q.createdById && !diQui.has(q.createdById)) continue;
    Object.assign(q, {
      assigneeId: null,
      assigneeType: null,
      // Una quest gia' consegnata torna da fare: chi la prende riparte da
      // dove si riparte, non da un'approvazione che riguardava un altro.
      status: 'in_corso',
      rejected: false,
      completedAt: null,
    });
  }

  /* L'appartenenza si chiude, non si cancella: la riga con la sua data
     d'uscita e' quello che dice fino a quando la persona e' stata li'
     dentro, e serve a rispondere molto dopo alle domande sui risultati.
     Le altre organizzazioni non le tocca nessuno — uscire da una non vuol
     dire uscire dalle altre, ed e' tutta la differenza con prima. */
  chiudiMembro(u.id, orgId, adesso);

  /* Da un'organizzazione personalizzata non esce niente, e questa e' la riga che
     lo garantisce.
     Le competenze e le medaglie di una famiglia, di una squadra o di una
     classe se le e' inventate quella organizzazione per se stessa: fuori
     non vogliono dire niente, e mostrarle a un'azienda che guarda un
     profilo sarebbe peggio che non mostrare niente. Spariscono del tutto,
     e non si recuperano.
     Non si scrive nemmeno l'uscita nel registro dei movimenti: quel
     registro esiste per l'osservatorio, e l'osservatorio le personalizzate non le
     guarda. Un movimento contato la' dentro sarebbe un dato di mercato
     ricavato dai compiti di casa di qualcuno.
     Restano gli XP e i crediti, come per tutti: non sono un risultato
     dentro l'organizzazione, sono un saldo della persona — il livello si
     spende in un negozio che sta fuori da ogni organizzazione. */
  if (orgPersonalizzata(orgId)) {
    db.certifications = (db.certifications || [])
      .filter((c) => !(c.employeeId === u.id && c.orgId === orgId));
    db.achievementInstances = (db.achievementInstances || [])
      .filter((i) => !(i.userId === u.id && i.orgId === orgId));
    /* Solo i consigli su competenze di questa organizzazione: cancellarli
       tutti avrebbe portato via anche quelli ricevuti altrove, che non
       c'entrano niente con l'uscita da qui. */
    const sue = new Set((db.skills || []).filter((x) => x.orgId === orgId).map((x) => x.id));
    db.recommendations = (db.recommendations || [])
      .filter((r) => !(r.employeeId === u.id && sue.has(r.skillId)));
    return;
  }

  // L'uscita si scrive sempre, e prima di tutto il resto. Non dipende da
  // che cosa la persona si porta via: e' successa comunque, ed e' l'unico
  // modo per sapere quanta gente lascia un'organizzazione — un movimento
  // che nessuno registra quando avviene non si ricostruisce mai piu'.
  segnaCarriera({ ...u, orgId }, 'uscita', ruoloLi, null);

  // Ogni risultato si guarda alla sua data, uno per uno. Non conta se
  // l'organizzazione paga adesso: conta se pagava quel giorno. Un'azienda
  // che ha smesso ieri non puo' cancellare due anni di lavoro riconosciuto,
  // e una che ha cominciato ieri non puo' rendere validi due anni in cui
  // non pagava.
  const valida = (quando) => eraPremium(orgId, quando);
  const suo = (c) => c.employeeId === u.id && c.orgId === orgId;
  const suoAch = (i) => i.userId === u.id && i.orgId === orgId;

  const restano = (db.certifications || []).filter((c) => suo(c) && valida(c.certifiedAt));
  const restanoAch = (db.achievementInstances || []).filter((i) => suoAch(i) && valida(i.ottenutoIl));

  db.certifications = (db.certifications || []).filter((c) => !suo(c) || valida(c.certifiedAt));
  db.achievementInstances = (db.achievementInstances || [])
    .filter((i) => !suoAch(i) || valida(i.ottenutoIl));

  const chiuse = (db.quests || []).filter((q) => q.assigneeId === u.id
    && q.status === 'approvata' && valida(q.approvedAt));

  const entrata = (db.carriera || [])
    .filter((e) => e.userId === u.id && e.orgId === orgId && e.tipo === 'ingresso')
    .map((e) => e.il)
    .sort()[0] || null;

  // Se non e' rimasto niente, non resta nemmeno una riga: un periodo senza
  // un solo risultato valido non e' un pezzo di curriculum, e scriverlo
  // vorrebbe dire mostrare il nome di un'azienda accanto al vuoto.
  if (!restano.length && !restanoAch.length && !chiuse.length) return;

  db.storico.push({
    id: nuovoId('sto'),
    userId: u.id,
    orgId,
    nomeOrg: nomeOrgDi(orgId),
    ruolo: ruoloLi,
    da: entrata,
    a: adesso,
    // Niente XP e niente livello: adesso non si azzerano piu', quindi sono
    // un totale sulla persona e non una cosa successa qui dentro.
    // Fotografarli per organizzazione direbbe una cosa falsa — che quel
    // numero appartiene a quel periodo — e per giunta un numero che a chi
    // cerca profili non serve. Tutto quello che resta in questa riga si
    // puo' invece verificare data per data.
    questChiuse: chiuse.length,
    aiuti: (db.helpRequests || []).filter((h) => h.helperId === u.id && h.acceptedAt).length,
  });
}
export const getUserById = (id) => db.users.find((u) => u.id === id);
/** L'account con quel numero: e' l'altro modo di trovare una persona. */
export const getUserByAchiviaId = (achiviaId) =>
  db.users.find((u) => String(u.achiviaId) === String(achiviaId)) || null;

export const getUserByEmail = (email) =>
  db.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());

// Rimuove un utente dall'organizzazione.
/**
 * Che cosa sparisce e che cosa resta quando un account viene cancellato.
 *
 * Serve a due cose, e la seconda e' quella importante: cancella davvero, e
 * si puo' leggere prima di premere. Una schermata che dice "sei sicuro?" e
 * niente altro chiede una firma in bianco; questo elenco e' lo stesso che
 * la funzione esegue, quindi non puo' promettere una cosa e farne un'altra.
 */
export const COSA_SPARISCE = [
  'Il tuo profilo: nome, email, password, avatar, nickname, personalizzazioni, crediti e livello.',
  'Le competenze che ti sono state certificate e i tuoi achievement.',
  'Lo storico lavorativo e tutto quello che avevi scritto per farti trovare.',
  'I messaggi che hai ricevuto, gli avvisi e le competenze consigliate.',
];

export const COSA_RESTA = [
  'Che qualcuno è entrato e uscito da un’organizzazione, con la data e senza il tuo nome: serve a contare il ricambio del personale, e non è più riconducibile a te.',
  'Le quest che hai chiuso restano nei registri dell’azienda che te le aveva assegnata, che è la sua storia di lavoro. Al posto del nome comparirà un trattino.',
  'Se hai pagato qualcosa — un abbonamento, un pacchetto di crediti — resta la scrittura contabile di quel pagamento, con l’importo e la data ma senza il tuo nome. È un obbligo di legge a cui nessuno può rinunciare, tuo compreso, e vale per gli anni che la legge stabilisce.',
];

/**
 * Cancella un account e tutto quello che ne parla.
 *
 * Prima toglieva la riga dall'elenco degli utenti e basta: certificazioni,
 * achievement, messaggi, avvisi e storico restavano a puntare a una persona
 * che non c'era piu'. Non e' solo disordine — sono dati personali di
 * qualcuno che ha chiesto di sparire.
 */
export function deleteUser(id) {
  const u = db.users.find((x) => x.id === id);
  if (!u) return false;

  /* Cancellare l'account e' l'altro modo di uscire, e per i conti del
     ricambio vale quanto andarsene — da ognuna delle organizzazioni di cui
     si faceva parte, non solo da quella che si aveva aperta. */
  ensureMembri();
  for (const m of orgDiPersona(id)) {
    segnaCarriera({ ...u, orgId: m.orgId }, 'uscita', m.role, null);
  }

  db.users = db.users.filter((x) => x.id !== id);
  /* Le appartenenze se ne vanno con lui. Lasciarle non era solo disordine:
     i posti di un'organizzazione si contano da li', e un account cancellato
     avrebbe continuato a occuparne uno per sempre. */
  db.membri = db.membri.filter((m) => m.userId !== id);

  ensureCarriera();
  ensureSkills();
  ensureAchievements();
  ensureNotifications();
  ensureLavoro();

  // I movimenti restano, il nome no: tengono solo il fatto — in
  // quell'organizzazione, quel giorno, qualcuno e' entrato o uscito. E'
  // quello che serve ai conti, e non e' piu' di nessuno.
  for (const e of db.carriera) if (e.userId === id) e.userId = null;

  // Tutto il resto parla di lui, e se ne va con lui.
  db.certifications = db.certifications.filter((c) => c.employeeId !== id);
  db.recommendations = db.recommendations.filter((r) => r.employeeId !== id);
  db.achievementInstances = db.achievementInstances.filter((i) => i.userId !== id);
  /* I movimenti di crediti se ne vanno con la persona, tranne uno: quello
     con cui dei crediti sono stati comprati con del denaro. Quella non e'
     una riga di gioco, e' una scrittura contabile, e va tenuta per gli anni
     che la legge impone — a chi l'ha fatta non e' data la facolta' di
     cancellarla, e nemmeno a noi.
     Si tiene il fatto e si perde la persona: importo, data e causale
     restano, il nome no. E' il minimo che regge i conti senza tenersi i
     dati di qualcuno che ha chiesto di sparire. Se un giorno risultera' che
     su questi pagamenti pesa un obbligo di identificazione, l'identita' non
     tornera' qui dentro: andra' in un archivio suo, separato, che e' il
     solo modo di tenere insieme le due leggi. */
  db.creditTransactions = db.creditTransactions.filter((t) => {
    if (t.userId !== id) return true;
    if (rigaMovimento(t)?.causale !== 'acquisto') return false;
    t.userId = null;
    return true;
  });
  db.notifications = db.notifications.filter((n) => n.userId !== id);
  db.messaggi = db.messaggi.filter((m) => m.aId !== id && m.daId !== id);
  db.postaUscita = db.postaUscita.filter((p) => p.a !== u.email);
  db.comparse = db.comparse.filter((c) => c.userId !== id);
  db.blocchi = db.blocchi.filter((b) => b.userId !== id && b.versoId !== id);
  db.storico = db.storico.filter((sto) => sto.userId !== id);
  if (db.attendance) db.attendance = db.attendance.filter((a) => a.employeeId !== id);
  if (db.reviews) db.reviews = db.reviews.filter((r) => r.subjectId !== id);
  delete db.limitiContatto[id];

  // Le quest restano all'organizzazione che le ha assegnate: sono il suo
  // registro di lavoro, non il profilo di una persona. Al posto del nome
  // comparira' un trattino, che e' quello che l'app mostra gia' oggi
  // quando un incaricato non c'e' piu'.
  save();
  return true;
}

// Reimposta la password con una temporanea (6 caratteri) e la restituisce.
/* La lunghezza minima di una password. Sta qui e non in una schermata
   perche' le schermate che la chiedono sono piu' d'una — il cambio, la
   registrazione, il ripristino dell'amministratore — e una regola che vive
   in tre posti si scorda in due. */
export const MIN_PASSWORD = 6;

export function resetUserPassword(id) {
  const pwd = Math.random().toString(36).slice(2, 8);
  updateUser(id, { password: pwd });
  return pwd;
}

/**
 * Chi sta dentro un'organizzazione, visto da dentro quell'organizzazione.
 *
 * Le persone tornano proiettate: ruolo, ruolo su misura e reparti sono
 * quelli che hanno *qui*, non quelli del canale che stanno guardando sul
 * loro telefono in questo momento. Senza la proiezione un elenco
 * dipendenti mostrerebbe il ruolo che uno ha da un'altra parte — e con
 * esso, di rimbalzo, il fatto che da un'altra parte ci sia.
 */
export const getUsersByOrg = (orgId) => {
  if (!orgId) return [];
  const dentro = membriDiOrg(orgId);
  return dentro
    .map((m) => {
      const u = db.users.find((x) => x.id === m.userId);
      return u ? personaIn(u, orgId) : null;
    })
    .filter(Boolean);
};

/**
 * Una persona vista da dentro un'organizzazione. `null` se li' dentro non
 * c'e'.
 *
 * E' la funzione da usare in ogni scheda che apre il profilo di qualcun
 * altro. `getUserById` torna il record cosi' com'e', cioe' con addosso la
 * proiezione del canale che *quella* persona ha aperto in questo momento:
 * mostrarla vorrebbe dire far vedere il ruolo che ha da un'altra parte, e
 * con esso il fatto che un'altra parte esista.
 */
export const getUserInOrg = (userId, orgId) => {
  if (!userId || !orgId) return null;
  const u = db.users.find((x) => x.id === userId);
  return u && membroDi(userId, orgId) ? personaIn(u, orgId) : null;
};

export const getEmployees = () => db.users.filter((u) => u.role === 'employee');
/**
 * Le persone di cui qualcuno risponde.
 *
 * Per un manager sono i suoi dipendenti. Per l'admin sono tutte le persone
 * dell'organizzazione, manager compresi: e' lui che li nomina e a lui che
 * rispondono, quindi in un elenco che serve a gestire le persone non possono
 * mancare. Restano fuori solo gli altri admin, che non si gestiscono fra
 * loro.
 */
export const getEmployeesOfManager = (managerId) => {
  const chi = getUserById(managerId);
  if (!chi) return [];
  return chi.role === 'admin'
    ? getUsersByOrg(chi.orgId).filter((u) => u.id !== chi.id && u.role !== 'admin')
    : getUsersByOrg(chi.orgId).filter((u) => u.role === 'employee' && u.managerId === managerId);
};

export const getDepartments = () =>
  [...new Set(db.users.filter((u) => u.department).map((u) => u.department))];

// Altri manager della stessa organizzazione (per assegnare quest tra manager).
export const getOtherManagers = (managerId) => {
  const me = getUserById(managerId);
  if (!me) return [];
  return getUsersByOrg(me.orgId).filter((u) => u.role === 'manager' && u.id !== managerId);
};

// Colleghi dipendenti della stessa organizzazione (escluso se stesso):
// possibili aiutanti per una richiesta di aiuto su una quest.
export const getOrgColleagues = (userId) => {
  const me = getUserById(userId);
  if (!me) return [];
  return getUsersByOrg(me.orgId).filter((u) => u.id !== userId && u.role === 'employee');
};


/* ─── L'insegna ──────────────────────────────────────────────
   Il logo e lo stemma erano le uniche due cose dell'organizzazione a
   essersi gia' staccate dal proprietario. Adesso ci sta accanto tutto il
   resto — nome, codice, tipo, abbonamento — nella stessa riga di registro:
   sono la stessa cosa vista da due schermate diverse. */


export const getOrgProfilo = (orgId) => getOrganizzazione(orgId);

export function salvaOrgProfilo(orgId, patch) {
  if (!orgId) return null;
  return salvaOrganizzazione(orgId, { ...patch, aggiornatoIl: new Date().toISOString() });
}


/* ─── Posti dell'organizzazione ──────────────────────────────
   La versione gratuita ne prevede 5 in tutto, admin compreso. */
/* Quanti posti dava il freemium quando i posti erano un numero scritto nel
   codice. Adesso li dice il piano — e il freemium e' un piano come gli
   altri — ma il nome resta esportato perche' e' il valore di partenza del
   piano Free e perche' era pubblico. */
export const FREE_SEATS = 5;

export const getOrgSeats = (orgId) => {
  const usati = membriDiOrg(orgId).length;
  // I posti li paga l'organizzazione, non chi la possiede: lo stesso admin
  // puo' avere un'azienda che paga e un gruppo che non paga. Quanti siano
  // lo dice il piano, che sta nel listino e si cambia da fuori: `null` nel
  // listino vuol dire senza limite, e qui diventa l'infinito che il resto
  // dell'applicazione si aspetta.
  const posti = limitiDiOrg(orgId).posti;
  const totali = posti == null ? Infinity : posti;
  return { usati, totali, liberi: totali === Infinity ? Infinity : Math.max(0, totali - usati) };
};
