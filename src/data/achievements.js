/**
 * Il motore degli achievement.
 *
 * ── Come funziona, e perche' cosi' ──────────────────────────────────────
 *
 * Il progresso non viene incrementato a colpi di "+1": viene *ricavato* dai
 * dati che l'app gia' tiene. Quante quest ha approvato quella persona, quante
 * competenze le sono state certificate, quante volte ha risposto a una
 * richiesta di aiuto. Da quel totale discendono sia le volte in cui
 * l'obiettivo e' stato raggiunto — parte intera di totale/target — sia il
 * punto del ciclo in corso, il resto.
 *
 * E' questa scelta a dare l'idempotenza chiesta dai requisiti, e a darla per
 * costruzione invece che a forza di controlli: processare due volte la stessa
 * quest non puo' contarla due volte, perche' nessuno conta — si guarda quante
 * quest ci sono. Un doppio clic, una riesecuzione, due eventi gemelli
 * arrivano tutti alla stessa risposta.
 *
 * Quello che invece va scritto e non ricalcolato e' l'*istanza*: la volta in
 * cui l'obiettivo e' stato raggiunto, con la sua data, la sua ricompensa e il
 * suo posto nella storia della persona. Le istanze non si toccano mai piu' e
 * portano un id costruito — `ach-<persona>-<achievement>-<ciclo>` — che fa da
 * vincolo di unicita': creare due volte il ciclo 3 e' impossibile, e con esso
 * e' impossibile accreditare due volte i crediti, che si muovono dentro la
 * stessa creazione.
 *
 * Conseguenza da tenere a mente: i totali possono anche scendere (una
 * certificazione revocata, una quest cancellata). Le istanze gia' scritte
 * restano — quello che si e' meritato non si toglie — e il ciclo in corso si
 * limita a zero finche' il totale non risale.
 *
 * ── Da dove arrivano i fatti ────────────────────────────────────────────
 *
 * Il database annuncia i pochi fatti che contano (`onEventoDominio`) e qui si
 * ascolta: nessun controllo periodico, nessun timer. Gli eventi dicono *chi*
 * guardare, non *quanto* aggiungere: il quanto lo dicono sempre i dati.
 */

import {
  getUserById, getUsersByOrg, getQuestsForUser, getQuestById, getHelpRequestsByHelper, puoGuidare,
  getCertificationsForEmployee, getCertifications, getSkillsCreate,
  getAchievementInstancesForUser, getAchievementInstances,
  addAchievementInstance, getAchievementCredits, setAchievementCredits,
  getAchievementSync, markAchievementSync, addNotification, onEventoDominio,
  orgPersonalizzata, getAchievementsCreati, achievementCreatoById,
} from './db';
import {
  ACHIEVEMENTS, ACHIEVEMENTS_AUTOMATICI, achievementById, TIPO_MANUALE,
} from './achievementsCatalog';
// La serie di giorni senza assenze la sa contare il registro delle presenze:
// qui non se ne riscrive una seconda copia.
import { serieImmortal } from './presenze';
import { puo } from './permessi';
// La famiglia di una competenza: le standard la portano nel catalogo, le
// altre se la sono scelta alla creazione. Si guarda qui e non in skills.js
// per non far dipendere il motore degli achievement dalle schermate delle
// competenze — che a loro volta guardano qui.
import { SKILLS_STANDARD } from './skillsCatalog';

/* ─── Quali medaglie esistono, e per chi ────────────────────────────────
   Nelle aziende sono le tredici standard: parlano di quest, di scadenze, di
   competenze certificate, e vogliono dire la stessa cosa dappertutto.

   In un'organizzazione personalizzata no. "Deadline Master" a chi gamifica i
   compiti di casa o gli allenamenti non dice niente, e il vocabolario
   comune non serve a nessuno: li' dentro non ci si confronta con altre
   organizzazioni. Quindi le medaglie se le inventa chi comanda, e sono
   tutte manuali — un achievement automatico ha bisogno di una misura, e le
   misure sono codice.

   Da qui in avanti nessuna funzione di questo file guarda `ACHIEVEMENTS`
   direttamente: chiede quali sono le medaglie di quell'organizzazione. */

export const achievementsDi = (orgId) =>
  (orgPersonalizzata(orgId) ? getAchievementsCreati(orgId) : ACHIEVEMENTS);

/** Le automatiche di quell'organizzazione: nelle personalizzate non ce ne sono. */
const automaticiDi = (orgId) => (orgPersonalizzata(orgId) ? [] : ACHIEVEMENTS_AUTOMATICI);

/**
 * La definizione dietro un'istanza. Prima bastava il catalogo standard;
 * adesso un'istanza puo' venire da una medaglia che un'organizzazione si e'
 * inventata, e va cercata anche li'.
 */
export const definizioneAchievement = (id) =>
  achievementById(id) || achievementCreatoById(id);

/* Il gradino piu' alto della scala di padronanza. */
const LIVELLO_ESPERTO = 4;

function famigliaDi(skillId) {
  const standard = SKILLS_STANDARD.find((s) => s.id === skillId);
  if (standard) return standard.categoria || null;
  return getSkillsCreate().find((s) => s.id === skillId)?.categoria || null;
}

/* ─── Che cosa e' una quest di gruppo, una side quest, un aiuto ───────────
   Le definizioni non se le inventa questo file: sono quelle del modello che
   c'e' gia'. Una quest e' di gruppo quando e' un'istanza o quando e'
   assegnata a un progetto o a un dipartimento — cioe' a piu' persone; e' una
   side quest quando il suo tipo lo dice. */

const conclusa = (q) => q.status === 'approvata';

/**
 * Le istanze delle persone: i traguardi dell'organizzazione sono altra cosa,
 * e un admin di medaglie personali non ne ha — se qualcuna gli e' rimasta
 * addosso da prima, qui non risulta piu'.
 */
const personali = (istanze) => istanze.filter(
  (i) => i.ambito !== 'org' && getUserById(i.userId)?.role !== 'admin'
);
const diGruppo = (q) =>
  q.type === 'istanza' || q.assigneeType === 'project' || q.assigneeType === 'department';
const sideQuest = (q) => q.type === 'side';

/* ─── Le misure ──────────────────────────────────────────────────────────
   Ogni misura risponde a una domanda sola, sui dati di adesso. Aggiungere un
   achievement nuovo vuol dire aggiungere una voce qui, se la sua domanda non
   c'e' gia'. */

const MISURE = {
  quest_completate: (u) => questeDi(u).filter(conclusa).length,

  quest_gruppo: (u) => questeDi(u).filter((q) => conclusa(q) && diGruppo(q)).length,

  // Una side quest conta solo se e' stata presa in carico e poi portata a
  // termine: guardata, rifiutata o scaduta non vale.
  side_quest: (u) => questeDi(u).filter((q) => conclusa(q) && sideQuest(q) && q.accepted === true).length,

  // Solo le richieste a cui la persona ha risposto davvero: essere indicati
  // come possibile aiutante non e' aver aiutato.
  aiuti_dati: (u) => getHelpRequestsByHelper(u.id).filter((h) => h.acceptedAt).length,

  // Ogni gradino della scala vale uno: la prima certificazione e ogni
  // passaggio di livello successivo. Ricertificare allo stesso livello no.
  passi_competenza: (u) =>
    getCertificationsForEmployee(u.id, u.orgId).reduce((n, c) => n + (c.storia?.length || 1), 0),

  // Competenze diverse toccate almeno una volta: salire di livello su una
  // che si ha gia' non e' una competenza nuova.
  competenze_nuove: (u) => new Set(getCertificationsForEmployee(u.id, u.orgId).map((c) => c.skillId)).size,

  // In quante delle cinque famiglie ha almeno una competenza valida. Dice
  // se il profilo e' largo, che e' una cosa diversa dall'essere pieno.
  famiglie_competenza: (u) => new Set(
    getCertificationsForEmployee(u.id, u.orgId)
      .filter((c) => c.status === 'certified')
      .map((c) => famigliaDi(c.skillId))
      .filter(Boolean)
  ).size,

  // Quante competenze ha portato fino in fondo alla scala. E' il contrario
  // della precedente: non quanto e' largo, quanto e' profondo.
  competenze_expert: (u) => getCertificationsForEmployee(u.id, u.orgId)
    .filter((c) => c.status === 'certified' && Number(c.level) >= LIVELLO_ESPERTO).length,

  // A quante persone diverse ha certificato qualcosa. Certificare lo puo'
  // fare solo chi guida, e farlo a dieci persone diverse non e'
  // un'attivita': e' un mestiere.
  persone_certificate: (u) => new Set(
    getCertifications()
      .filter((c) => c.certifiedBy === u.id && c.employeeId !== u.id)
      .map((c) => c.employeeId)
  ).size,

  // In quanti mesi distinti ha chiuso almeno una quest. Un totale alto puo'
  // essere un mese solo di corsa; questo conta le volte in cui c'era.
  mesi_con_quest: (u) => new Set(
    questeDi(u).filter(conclusa).map((q) => String(q.approvedAt || q.completedAt || '').slice(0, 7))
  ).size,
};

const questeDi = (u) => getQuestsForUser(u).filter((q) => q.status !== 'template');

/* Le misure che non sono un totale ma una serie: quante volte si e' arrivati
   in fondo e a che punto e' il giro in corso. Il motore le tratta a parte
   perche' una serie si azzera, e un totale no. */
const SERIE = {
  streak_in_tempo: serieInTempo,
  presence_streak: serieImmortal,
};

/**
 * Deadline Master non e' un totale ma una serie: conta quante quest di fila
 * sono state chiuse in tempo, e riparte da zero appena una salta.
 *
 * Che cosa spezza la serie: una quest consegnata dopo la scadenza e una quest
 * scaduta senza essere completata. La seconda e' una scelta, e questa e' la
 * ragione: nel modello "scaduta" vuol dire che la scadenza e' passata mentre
 * la quest era in mano alla persona, cioe' esattamente il fallimento che
 * l'achievement premia di evitare. Non spezza invece una quest mai accettata
 * (rifiutata all'assegnazione): non e' mai stata lavoro in corso.
 *
 * Le quest si mettono in fila per la data in cui si sono chiuse — approvazione
 * per quelle riuscite, scadenza per quelle fallite — cosi' la serie e' la
 * stessa qualunque sia l'ordine in cui i dati arrivano.
 */
function serieInTempo(u, target) {
  const chiusure = questeDi(u)
    .filter((q) => (conclusa(q) || q.status === 'scaduta') && !(q.rejected && q.status !== 'approvata'))
    .map((q) => ({
      quando: new Date(q.approvedAt || q.completedAt || q.deadline || 0).getTime(),
      inTempo: conclusa(q) && q.late !== true,
    }))
    .sort((a, b) => a.quando - b.quando);

  let cicli = 0;
  let serie = 0;
  for (const c of chiusure) {
    if (!c.inTempo) { serie = 0; continue; }
    serie += 1;
    if (serie >= target) { cicli += 1; serie = 0; }
  }
  return { cicli, serie };
}

/**
 * A che punto e' una persona su un achievement.
 *
 * `volte` sono le istanze gia' scritte, `progresso` e' il ciclo in corso: due
 * numeri diversi che i requisiti chiedono di non confondere. Chi ha chiuso
 * quattro volte Closer e sta a 17 ha 4 volte e 17/30, non 137.
 */
export function progressoDi(persona, def) {
  const definizione = typeof def === 'string' ? definizioneAchievement(def) : def;
  if (!persona || !definizione) return null;

  const istanze = personali(getAchievementInstancesForUser(persona.id, persona.orgId))
    .filter((i) => i.achievementId === definizione.id);
  const volte = istanze.length;
  const target = definizione.target;

  let progresso;
  if (definizione.tipo === TIPO_MANUALE) {
    // Non c'e' un ciclo da riempire: lo assegna una persona, quando accade.
    progresso = 0;
  } else if (SERIE[definizione.metrica]) {
    progresso = SERIE[definizione.metrica](persona, target).serie;
  } else {
    const totale = MISURE[definizione.metrica]?.(persona) ?? 0;
    // Le istanze non si tolgono mai: se il totale scende sotto quello gia'
    // premiato, il ciclo in corso e' semplicemente vuoto.
    progresso = Math.max(0, Math.min(target, totale - target * volte));
  }

  return {
    definizione,
    volte,
    istanze,
    progresso,
    target,
    mancanti: Math.max(0, target - progresso),
    percentuale: Math.min(100, Math.round((progresso / target) * 100)),
    ciclo: volte + 1,
    ultima: istanze[0] || null,
  };
}

/** Il quadro completo di una persona, un elemento per definizione. */
export const progressiDi = (persona) =>
  achievementsDi(persona?.orgId).map((def) => progressoDi(persona, def)).filter(Boolean);

/* ─── Sincronizzazione ───────────────────────────────────────────────────*/

const idIstanza = (userId, achievementId, ciclo) => `ach-${userId}-${achievementId}-${ciclo}`;

/**
 * Allinea le istanze di una persona ai suoi dati, creando quelle che mancano.
 *
 * Chiamarla mille volte di fila e chiamarla una volta sola fanno lo stesso
 * effetto. Restituisce solo le istanze nate adesso, che sono quelle da
 * annunciare.
 *
 * Alla primissima sincronizzazione la storia gia' presente viene trascritta
 * in silenzio: chi ha alle spalle trecento quest si troverebbe altrimenti
 * trenta notifiche in un colpo, e una pioggia di crediti mai promessi. Quelle
 * istanze restano marcate come pregresse e non pagano ricompensa; da li' in
 * avanti ogni sblocco e' vero, con crediti e notifica.
 */
export function sincronizza(userId) {
  const persona = getUserById(userId);
  if (!persona) return [];
  // L'admin sta fuori dal gioco personale: non esegue quest, non si fa
  // certificare, e quindi non colleziona le medaglie che collezionano gli
  // altri. Le sue sono quelle dell'organizzazione (traguardiOrg.js), che
  // parlano di come va l'azienda e non di come va lui.
  if (persona.role === 'admin') return [];

  const primaVolta = !getAchievementSync(userId);
  const nate = [];

  for (const def of automaticiDi(persona.orgId)) {
    const gia = getAchievementInstancesForUser(userId, persona.orgId)
      .filter((i) => i.achievementId === def.id).length;

    const attese = SERIE[def.metrica]
      ? SERIE[def.metrica](persona, def.target).cicli
      : Math.floor((MISURE[def.metrica]?.(persona) ?? 0) / def.target);

    for (let ciclo = gia + 1; ciclo <= attese; ciclo += 1) {
      const crediti = primaVolta ? 0 : creditiDi(persona.orgId, def);
      const { istanza, creata } = addAchievementInstance({
        id: idIstanza(userId, def.id, ciclo),
        userId,
        achievementId: def.id,
        ciclo,
        progresso: def.target,
        target: def.target,
        crediti,
        fonte: 'automatic',
        pregressa: primaVolta,
      });
      if (creata && !primaVolta) nate.push(istanza);
    }
  }

  if (primaVolta) markAchievementSync(userId);

  nate.forEach((i) => {
    const def = definizioneAchievement(i.achievementId);
    addNotification({
      userId,
      kind: 'achievement',
      text: i.crediti > 0
        ? `Achievement sbloccato: ${def.nome} (+${i.crediti} crediti)`
        : `Achievement sbloccato: ${def.nome}`,
      achievementInstanceId: i.id,
    });
  });

  return nate;
}

/* ─── Assegnazione manuale ───────────────────────────────────────────────*/

/**
 * Il manager assegna "Go the Extra Mile" verificando una quest completata.
 *
 * E' l'unico momento in cui si puo' assegnare, e non e' una comodita': questo
 * achievement premia un lavoro fatto ben oltre quanto chiesto, e "oltre
 * quanto chiesto" ha senso solo davanti al lavoro in questione. Fuori da
 * quella verifica diventerebbe una simpatia, quindi qui si pretende la quest:
 * dev'essere approvata, dev'essere di quella persona, e a darla dev'essere
 * chi quella quest l'ha assegnata.
 *
 * La motivazione e' obbligatoria. Ogni assegnazione e' una istanza nuova — la
 * terza non cancella la seconda — e resta scritto chi l'ha data e quando; una
 * quest sola pero' non puo' premiare due volte, ed e' l'id costruito sulla
 * quest a impedirlo, non un controllo che ci si puo' dimenticare.
 */
export function assegnaExtraMile({ employeeId, byId, motivo, questId = null }) {
  const persona = getUserById(employeeId);
  const testo = (motivo || '').trim();
  const chiAssegna = byId ? getUserById(byId) : null;
  if (!persona) return { errore: 'Persona non trovata.' };
  if (!puoAssegnareExtraMile(chiAssegna, persona)) return { errore: 'Non puoi assegnare questo achievement.' };
  if (!testo) return { errore: 'La motivazione è obbligatoria.' };

  const quest = questId ? getQuestById(questId) : null;
  if (!quest) return { errore: 'Si assegna solo verificando una quest completata.' };
  if (quest.assigneeId !== employeeId) return { errore: 'La quest non è di questa persona.' };
  if (quest.status !== 'approvata') return { errore: 'La quest non è ancora stata approvata.' };
  if (quest.createdById && chiAssegna.role !== 'admin' && quest.createdById !== byId) {
    return { errore: 'Solo chi ha assegnato la quest può premiarla.' };
  }

  // Come sopra: la medaglia porta la firma dell'organizzazione di chi la da'.
  const orgId = chiAssegna?.orgId ?? null;
  const def = achievementById('extra-mile');
  const gia = getAchievementInstancesForUser(employeeId, orgId).filter((i) => i.achievementId === def.id);
  if (gia.some((i) => i.questId === questId)) {
    return { errore: 'Questa quest ha già il suo achievement.' };
  }

  const { istanza } = addAchievementInstance({
    // Costruito sulla quest, non sul numero d'ordine: e' il vincolo che rende
    // impossibile premiare due volte lo stesso lavoro, doppio clic compreso.
    id: `ach-${employeeId}-${def.id}-${questId}`,
    userId: employeeId,
    achievementId: def.id,
    orgId,
    ciclo: gia.length + 1,
    progresso: def.target,
    target: def.target,
    crediti: creditiDi(orgId, def),
    fonte: 'manual',
    assegnatoDaId: byId ?? null,
    motivo: testo,
    questId,
  });

  addNotification({
    userId: employeeId,
    kind: 'achievement',
    text: istanza.crediti > 0
      ? `Hai ricevuto "${def.nome}" (+${istanza.crediti} crediti)`
      : `Hai ricevuto "${def.nome}"`,
    achievementInstanceId: istanza.id,
  });

  return { istanza };
}

/**
 * Consegna una medaglia che l'organizzazione si e' inventata.
 *
 * Non passa da una quest, e non e' una svista: in un gruppo o in un clan
 * il motivo per premiare qualcuno spesso non e' un compito assegnato — e'
 * una cosa che e' successa. Quello che resta
 * obbligatorio e' la motivazione scritta: una medaglia senza un perche' non
 * dice niente a chi la riceve, e fra un mese non lo ricorda nemmeno chi
 * l'ha data.
 *
 * Si consegna solo su una definizione della propria organizzazione: quelle
 * di un'altra non si vedono e non si assegnano.
 */
export function assegnaMedaglia({ byId, employeeId, achievementId, motivo }) {
  const persona = getUserById(employeeId);
  const chiAssegna = byId ? getUserById(byId) : null;
  const testo = (motivo || '').trim();
  if (!persona) return { errore: 'Persona non trovata.' };
  if (!puoAssegnareExtraMile(chiAssegna, persona)) return { errore: 'Non puoi assegnare medaglie.' };
  if (!testo) return { errore: 'La motivazione è obbligatoria.' };

  /* Dove sta succedendo: nell'organizzazione di chi consegna la medaglia,
     non in quella in cui si trova adesso chi la riceve. Consegnare e' un
     atto che qualcuno compie stando dentro un'organizzazione, ed e' quella
     a metterci la firma — e a pagarne i crediti. */
  const orgId = chiAssegna?.orgId ?? null;
  const def = achievementCreatoById(achievementId);
  if (!def || def.orgId !== orgId) {
    return { errore: 'Questa medaglia non è della tua organizzazione.' };
  }

  const gia = getAchievementInstancesForUser(employeeId, orgId)
    .filter((i) => i.achievementId === def.id).length;

  const { istanza } = addAchievementInstance({
    id: `ach-${employeeId}-${def.id}-${gia + 1}`,
    userId: employeeId,
    achievementId: def.id,
    orgId,
    ciclo: gia + 1,
    progresso: def.target,
    target: def.target,
    crediti: creditiDi(orgId, def),
    fonte: 'manual',
    assegnatoDaId: byId ?? null,
    motivo: testo,
  });

  addNotification({
    userId: employeeId,
    kind: 'achievement',
    text: istanza.crediti > 0
      ? `Hai ricevuto "${def.nome}" (+${istanza.crediti} crediti)`
      : `Hai ricevuto "${def.nome}"`,
    achievementInstanceId: istanza.id,
  });

  return { istanza };
}

/* ─── Permessi ───────────────────────────────────────────────────────────
   Un dipendente guarda i propri achievement e basta: non se li assegna, non
   ne muove il progresso, non ne cambia i crediti. Il progresso automatico non
   lo puo' toccare nessuno, manager compresi: e' un calcolo sui dati, non un
   campo da riempire. */

export const puoVedereAchievementDi = (me, persona) => {
  if (!me || !persona) return false;
  // Un admin di medaglie personali non ne ha: non c'e' niente da guardare,
  // ne' a se' stesso ne' a un collega proprietario.
  if (persona.role === 'admin') return false;
  if (me.id === persona.id) return true;
  return puoGuidare(me, persona);
};

export const puoAssegnareExtraMile = (me, persona) =>
  puo(me, 'people.achievements') && persona?.role !== 'admin' && puoGuidare(me, persona);

/**
 * Le ricompense in crediti: una sola, e la mette una persona sola.
 *
 * Gli achievement automatici non portano crediti. Si prendono facendo il
 * proprio lavoro, e quel lavoro i crediti li ha gia' dati con le quest:
 * pagarli di nuovo sarebbe pagare due volte la stessa cosa, e trasformerebbe
 * ogni medaglia in un secondo stipendio deciso da chi ne configura il
 * valore. L'unico che premia qualcosa che nessuna quest aveva chiesto e'
 * "Go the Extra Mile", che infatti si assegna a mano guardando il lavoro.
 *
 * E la sua cifra la stabilisce l'admin — o un co-admin, che ha gli stessi
 * permessi — perche' sono crediti dell'organizzazione e devono valere
 * uguale per tutti: se ogni manager potesse ritoccarla, la stessa medaglia
 * varrebbe cifre diverse a seconda di chi ha messo mano per ultimo, e chi la
 * riceve non saprebbe perche'.
 */
export const ricompensabile = (def) => Boolean(def?.ricompensabile);

export const puoConfigurareCrediti = (me, def) =>
  ricompensabile(def) && me?.role === 'admin';

export function configuraCrediti(me, orgId, achievementId, crediti) {
  const def = definizioneAchievement(achievementId);
  if (!puoConfigurareCrediti(me, def)) return null;
  return setAchievementCredits(orgId, achievementId, crediti);
}

/**
 * Quanto vale una medaglia. Per tutte tranne una la risposta e' zero, e non
 * si legge nemmeno la configurazione: cosi' una cifra rimasta scritta da
 * prima non torna a galla da sola.
 */
export const creditiDi = (orgId, def) =>
  (ricompensabile(def) ? getAchievementCredits(orgId, def.id, def.creditiDefault) : 0);

/* ─── Viste per le pagine ────────────────────────────────────────────────*/

/** Quante volte una persona ha preso ciascun achievement, dal piu' preso. */
export function conteggiDi(persona) {
  return progressiDi(persona)
    .filter((p) => p.volte > 0)
    .sort((a, b) => b.volte - a.volte);
}

/**
 * Lo storico di una persona: tutte le istanze, dalla piu' recente.
 *
 * I traguardi dell'organizzazione restano fuori: sono medaglie dell'azienda,
 * non della persona che si trova ad amministrarla. Le sue stanno qui, quelle
 * dell'azienda nel suo profilo di admin.
 */
export const storicoDi = (persona) =>
  personali(getAchievementInstancesForUser(persona.id, persona.orgId)).map((i) => ({
    istanza: i,
    definizione: definizioneAchievement(i.achievementId),
    assegnatoDa: i.assegnatoDaId ? getUserById(i.assegnatoDaId) : null,
  }));

/**
 * Il quadro dell'organizzazione per la pagina del manager: quante medaglie
 * sono state consegnate, quali piu' spesso, chi ne ha di piu'.
 */
export function riepilogoOrg(orgId) {
  const persone = getUsersByOrg(orgId);
  const suoi = new Set(persone.map((p) => p.id));
  const istanze = personali(getAchievementInstances().filter((i) => suoi.has(i.userId)));

  const perAchievement = achievementsDi(orgId).map((def) => ({
    definizione: def,
    volte: istanze.filter((i) => i.achievementId === def.id).length,
    crediti: creditiDi(orgId, def),
  }));

  const perPersona = persone
    .map((p) => ({ persona: p, volte: istanze.filter((i) => i.userId === p.id).length }))
    .filter((r) => r.volte > 0)
    .sort((a, b) => b.volte - a.volte);

  const recenti = [...istanze]
    .sort((a, b) => new Date(b.ottenutoIl) - new Date(a.ottenutoIl))
    .slice(0, 8)
    .map((i) => ({
      istanza: i,
      definizione: definizioneAchievement(i.achievementId),
      persona: getUserById(i.userId),
    }));

  const piuOttenuto = [...perAchievement].sort((a, b) => b.volte - a.volte)[0] || null;

  return {
    // "Sbloccati" sono gli achievement diversi che qualcuno ha preso almeno
    // una volta; le istanze sono tutte le volte in cui e' successo.
    sbloccati: perAchievement.filter((r) => r.volte > 0).length,
    istanze: istanze.length,
    piuOttenuto: piuOttenuto && piuOttenuto.volte > 0 ? piuOttenuto : null,
    perAchievement,
    perPersona,
    recenti,
  };
}

/* ─── Aggancio agli eventi del database ──────────────────────────────────
   I nomi dei fatti sono quelli del dominio; qui si traducono in "guarda di
   nuovo questa persona". Ogni gestore e' anche una funzione pubblica, cosi'
   una chiamata diretta e un evento fanno la stessa identica cosa. */

export const processQuestApprovata = ({ userId }) => (userId ? sincronizza(userId) : []);
export const processAiutoDato = ({ userId }) => (userId ? sincronizza(userId) : []);
export const processEventoCompetenza = ({ userId }) => (userId ? sincronizza(userId) : []);
// Una presenza registrata, corretta o tolta cambia la serie: e cambiarla puo'
// voler dire che un Immortal e' appena maturato — o che non lo e' piu', e in
// quel caso semplicemente non ne nasce uno nuovo.
export const processPresenza = ({ userId }) => (userId ? sincronizza(userId) : []);

const GESTORI = {
  QuestApprovata: processQuestApprovata,
  AiutoDato: processAiutoDato,
  CompetenzaCertificata: processEventoCompetenza,
  CompetenzaSalita: processEventoCompetenza,
  PresenzaRegistrata: processPresenza,
};

onEventoDominio((evento) => {
  GESTORI[evento.tipo]?.(evento);
});
