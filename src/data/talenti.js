/**
 * I profili che si sono resi trovabili.
 *
 * E' la parte dell'osservatorio che guarda le persone e non il mercato, e
 * proprio per questo e' quella con piu' vincoli addosso. Tre, e non sono
 * scrupoli: sono le condizioni perche' questo elenco possa esistere.
 *
 *   Solo chi ha detto di si'.  Non basta essere senza lavoro: bisogna aver
 *                              accettato i termini, e la revoca toglie il
 *                              profilo dall'elenco nello stesso istante.
 *                              Nessuno ci finisce dentro per inerzia.
 *
 *   Mai un nome.               Da qui esce il numero Achivia e nient'altro.
 *                              Non il nome, non il cognome, non l'email,
 *                              non il nickname, non l'avatar. Chi cerca
 *                              vede un profilo professionale e scrive a un
 *                              numero; il nome lo dara' la persona, se
 *                              vorra' rispondere.
 *
 *   Niente che faccia male.    Percentuale di quest riuscite, assenze,
 *                              ritardi, crediti: restano fuori dalla
 *                              scheda. Un profilo si presenta con quello
 *                              che ha fatto, non con quello che gli e'
 *                              andato storto — e un dato che puo'
 *                              danneggiare chi lo ha dato in buona fede
 *                              non e' un dato che si mostra.
 *
 * La percentuale di successo si puo' pero' *cercare*, ed e' una differenza
 * che regge: un filtro "almeno l'ottanta per cento" non rivela mai una
 * cifra bassa, perche' chi sta sotto semplicemente non compare. Rivela un
 * pavimento, non un numero.
 *
 * E vale solo quello che e' stato ottenuto in un'organizzazione che pagava,
 * nel momento in cui pagava. Il resto e' gia' stato cancellato quando la
 * persona e' uscita: qui non c'e' niente da filtrare, c'e' solo da
 * ricordarsi perche'.
 */

import {
  getUsers, getCertificazioniDi, getAchievementStorico, getStorico, getQuests,
  eraPremium, orgPersonalizzata, nomeOrgDi, consensoScaduto, giorniAllaScadenza,
  inAzienda,
} from './db';
import { SKILLS_STANDARD } from './skillsCatalog';
import { achievementById } from './achievementsCatalog';
import { zonaCopre, centroZona } from './geografia';
import { distanzaKm, fasciaDi, RAGGIO_MINIMO_KM } from './posizione';

/* ─── Chi c'e' dentro ────────────────────────────────────────────────────*/

/**
 * Chi si puo' trovare: ha accettato, non ha revocato, e adesso non e' in
 * un'organizzazione.
 *
 * L'ultima condizione e' la piu' importante e la meno ovvia. Una persona
 * che lavora puo' benissimo aver acceso "fatti trovare" — magari guardandosi
 * intorno — ma finche' e' dentro un'azienda il suo profilo non compare a
 * nessuno. Comparire mentre si ha un lavoro vorrebbe dire che chiunque
 * abbia accesso a questa dashboard puo' sapere che ci si sta guardando
 * intorno, e nessuno accenderebbe piu' quell'interruttore.
 *
 * "Dentro un'azienda", non dentro un'organizzazione qualunque: un gruppo,
 * una famiglia, una squadra non sono un datore di lavoro, e chi sta li'
 * dentro cerca lavoro come chiunque altro. Contarli avrebbe voluto dire
 * togliere l'elenco a qualcuno perche' ha una chat di famiglia.
 */
export const trovabile = (u) => Boolean(
  u && u.trovabilita?.attiva && !u.trovabilita?.revocatoIl && !inAzienda(u.id)
  // Un consenso vecchio di un anno non e' piu' un consenso: e' un'abitudine
  // che nessuno ha piu' confermato. Il profilo non sparisce — smette solo
  // di comparire, finche' la persona non dice che sta ancora cercando.
  && !consensoScaduto(u.trovabilita)
);

export const profiliTrovabili = () => getUsers().filter(trovabile);

/* ─── Che cosa si sa di loro ─────────────────────────────────────────────*/

/* Solo il catalogo standard. Le competenze che un'organizzazione si crea in
   casa non escono di li': valgono dentro quell'azienda, che sa che cosa
   voleva dire quando le ha scritte, e da fuori sono un nome senza garanzia
   — chi guarda un profilo qui non ha modo di sapere se "Saldatura TIG
   avanzata" e' un mestiere o l'ultimo corso interno di qualcuno. */
const standard = (skillId) => SKILLS_STANDARD.find((s) => s.id === skillId) || null;
const nomeSkill = (skillId) => standard(skillId)?.name || skillId;
const famigliaSkill = (skillId) => standard(skillId)?.categoria || null;

/**
 * Le competenze certificate che valgono: quelle del catalogo standard,
 * prese in un'organizzazione mentre pagava. Una competenza riconosciuta da
 * due datori di lavoro diversi compare due volte, con due date — ed e'
 * giusto cosi': sono due riconoscimenti, non uno ripetuto.
 *
 * Quelle che un'azienda si e' create in casa restano in casa. Dentro
 * quell'organizzazione vogliono dire qualcosa perche' chi le ha scritte sa
 * che cosa intendeva; da fuori sono un nome senza garanzia, e metterle nel
 * curriculum che l'osservatorio mostra vorrebbe dire farle passare per una
 * qualifica riconosciuta.
 */
export function competenzeDi(userId) {
  return getCertificazioniDi(userId)
    /* Solo quello che un'azienda con l'abbonamento ha riconosciuto. Le
       personalizzate restano fuori due volte: quando la persona esce, quello che
       aveva li' dentro viene cancellato, e finche' e' dentro un'org non si
       fa comunque trovare. Il controllo c'e' lo stesso perche' una regola
       che si regge su due altre regole prima o poi cade con una delle
       due. */
    .filter((c) => c.status === 'certified'
      && standard(c.skillId)
      && !orgPersonalizzata(c.orgId) && eraPremium(c.orgId, c.certifiedAt))
    .map((c) => ({
      id: c.id,
      skillId: c.skillId,
      nome: nomeSkill(c.skillId),
      categoria: famigliaSkill(c.skillId),
      livello: Number(c.level) || 1,
      certificatoIl: c.certifiedAt,
      orgId: c.orgId,
      // Il nome dell'organizzazione si mostra: e' il curriculum della
      // persona, e chi l'ha scritto ha accettato che si veda.
      organizzazione: nomeOrgDi(c.orgId),
    }))
    .sort((a, b) => new Date(b.certificatoIl) - new Date(a.certificatoIl));
}

/** Gli achievement che valgono, con quante volte sono stati presi. */
export function achievementDi(userId) {
  const conti = new Map();
  for (const i of getAchievementStorico(userId)) {
    if (orgPersonalizzata(i.orgId) || !eraPremium(i.orgId, i.ottenutoIl)) continue;
    const def = achievementById(i.achievementId);
    if (!def) continue;
    const riga = conti.get(i.achievementId)
      || { id: i.achievementId, nome: def.nome, descrizione: def.descrizione, quante: 0, ultimo: null };
    riga.quante += 1;
    if (!riga.ultimo || i.ottenutoIl > riga.ultimo) riga.ultimo = i.ottenutoIl;
    conti.set(i.achievementId, riga);
  }
  return [...conti.values()].sort((a, b) => b.quante - a.quante);
}

/** I passaggi in organizzazioni che pagavano: e' il curriculum. */
export const percorsoDi = (userId) => getStorico()
  .filter((s) => s.userId === userId)
  .sort((a, b) => new Date(b.a) - new Date(a.a));

/**
 * La percentuale di quest riuscite. Si calcola, si puo' cercare, e non si
 * mostra: sta qui e non nella scheda apposta.
 */
export function successoDi(userId) {
  const sue = getQuests().filter((q) => q.assigneeId === userId
    && ['approvata', 'rifiutata', 'scaduta'].includes(q.status));
  if (!sue.length) return null;
  const bene = sue.filter((q) => q.status === 'approvata').length;
  return Math.round((bene / sue.length) * 100);
}

/**
 * La scheda di un profilo, come la vede chi cerca.
 *
 * Il nome non c'e', e non e' che sia omesso da chi disegna la schermata:
 * non esce proprio da questa funzione. Una regola che vive in un componente
 * si perde al primo componente nuovo; qui invece non c'e' niente da
 * dimenticare, perche' il dato non arriva.
 *
 * E non c'e' nemmeno il nome delle organizzazioni da cui si viene. Le
 * competenze certificate e gli achievement escono tutti, con le loro date e
 * i loro livelli: quello che una persona sa fare e' il motivo per cui
 * questa pagina esiste. Chi gliel'ha riconosciuto no. Un profilo anonimo
 * accanto a "Officina Corvino, 2019-2024" non e' anonimo: sono due domande
 * a un ex collega, e la persona che aveva chiesto di non essere nominata si
 * ritrova nominata lo stesso.
 *
 * Del percorso restano le durate, che sono un fatto sulla persona — quanto
 * si ferma nei posti — e non un'informazione su dove sia stata.
 */
/**
 * Da dove si misura la distanza di un profilo.
 *
 * Chi ha dato il permesso porta la sua cella di cinque chilometri; chi non
 * l'ha dato porta il centro della prima zona che ha dichiarato. Nessuno
 * resta fuori dalla ricerca per distanza solo perche' non ha voluto dare la
 * posizione — cambia quanto e' precisa, e la scheda lo scrive.
 */
export function posizioneDi(u) {
  const data = u.trovabilita?.posizione;
  if (data && Number.isFinite(data.lat) && Number.isFinite(data.lon)) return data;
  const prima = (u.trovabilita?.zone || [])[0];
  return prima ? centroZona(prima) : null;
}

export function scheda(u) {
  /* Le competenze escono senza il nome di chi le ha certificate, e il
     percorso senza il nome delle organizzazioni: e' qui che si toglie, una
     volta sola, perche' e' da qui che passa tutto quello che l'osservatorio
     vede. La stessa funzione che le costruisce serve anche allo storico
     della persona, dove i nomi ci sono e ci devono essere: e' il suo. */
  const competenze = competenzeDi(u.id).map((c) => ({
    id: c.id,
    skillId: c.skillId,
    nome: c.nome,
    categoria: c.categoria,
    livello: c.livello,
    certificatoIl: c.certificatoIl,
  }));
  const percorso = percorsoDi(u.id).map((p, i) => ({
    ordine: i + 1,
    da: p.da,
    a: p.a,
    questChiuse: p.questChiuse ?? 0,
  }));
  return {
    // L'unico modo di chiamarlo.
    id: u.id,
    achiviaId: u.achiviaId,
    lettera: u.trovabilita?.lettera || '',
    zone: u.trovabilita?.zone || [],
    lingue: u.trovabilita?.lingue || [],
    disponibileDa: u.trovabilita?.accettatoIl || null,
    // Che cosa sta cercando adesso, se ha voluto dirlo. Le competenze
    // raccontano il passato; questo e' l'unico campo che parla del futuro,
    // ed e' anche l'unico che la persona scrive su di se' invece di
    // vederselo calcolare addosso.
    cerca: u.trovabilita?.cerca || null,
    // La posizione che esce di qui e' gia' una cella di cinque chilometri
    // o il centro di una zona: la coordinata esatta non e' mai stata
    // salvata, quindi non c'e' niente da nascondere.
    posizione: posizioneDi(u),
    competenze,
    famiglie: [...new Set(competenze.map((c) => c.categoria).filter(Boolean))],
    achievement: achievementDi(u.id),
    percorso,
    organizzazioni: percorso.length,
    questChiuse: percorso.reduce((s, p) => s + (p.questChiuse || 0), 0),
    /* Niente totale di anni di esperienza. Sommare i giorni passati nelle
       organizzazioni che stanno qui misura da quanto una persona usa
       Achivia, non da quanto fa il suo mestiere — e sbaglia proprio sui
       profili piu' esperti, quelli arrivati da una vita di lavoro altrove.
       Il percorso con le sue date resta: sono fatti, e chi cerca li legge
       da solo invece di ricevere una somma che non vuol dire quello che
       sembra. */
  };
}

/* ─── Che lavoro si cerca ────────────────────────────────────────────────
   Quattro domande, tutte facoltative. Le competenze certificate dicono che
   cosa uno ha fatto; queste dicono che cosa vuole fare adesso, ed e' l'unica
   parte del profilo che guarda avanti. Sono anche il dato piu' pulito che
   ci sia qui dentro: la persona lo scrive su di se', nessuno lo deduce dal
   suo comportamento. */

export const DISPONIBILITA = [
  { id: 'subito', nome: 'Subito' },
  { id: 'un-mese', nome: 'Entro un mese' },
  { id: 'tre-mesi', nome: 'Entro tre mesi' },
  { id: 'guardo', nome: 'Sto solo guardando' },
];

export const CONTRATTI = [
  { id: 'indeterminato', nome: 'Indeterminato' },
  { id: 'determinato', nome: 'A termine' },
  { id: 'partita-iva', nome: 'Partita IVA' },
  { id: 'tirocinio', nome: 'Tirocinio' },
];

export const ORARI = [
  { id: 'pieno', nome: 'Tempo pieno' },
  { id: 'parziale', nome: 'Tempo parziale' },
];

export const MODI_REMOTO = [
  { id: 'sede', nome: 'In sede' },
  { id: 'ibrido', nome: 'Ibrido' },
  { id: 'remoto', nome: 'Da remoto' },
];

const nomeIn = (elenco, id) => elenco.find((x) => x.id === id)?.nome || null;

/** Che cosa cerca, scritto come si legge. Vuoto se non l'ha detto. */
export function cercaALettere(cerca) {
  if (!cerca) return [];
  return [
    cerca.mestiere && { label: 'Ruolo che cerca', valore: cerca.mestiere },
    nomeIn(DISPONIBILITA, cerca.disponibilita) && { label: 'Disponibile', valore: nomeIn(DISPONIBILITA, cerca.disponibilita) },
    nomeIn(CONTRATTI, cerca.contratto) && { label: 'Contratto', valore: nomeIn(CONTRATTI, cerca.contratto) },
    nomeIn(ORARI, cerca.orario) && { label: 'Orario', valore: nomeIn(ORARI, cerca.orario) },
    nomeIn(MODI_REMOTO, cerca.remoto) && { label: 'Dove', valore: nomeIn(MODI_REMOTO, cerca.remoto) },
  ].filter(Boolean);
}

/* ─── La ricerca ─────────────────────────────────────────────────────────*/

export const FILTRI_TALENTI = {
  zona: { continente: '', paese: '', area: '' },
  competenze: [],
  lingue: [],
  achievement: [],
  questMinime: 0,
  successoMinimo: 0,
  livelloMinimo: 0,
  disponibilita: '',
  contratto: '',
  orario: '',
  remoto: '',
  // Il centro da cui si misura la distanza, e il raggio. Senza centro il
  // filtro non si applica affatto: la distanza e' una domanda che ha senso
  // solo se si dice "da dove".
  centro: null,
  raggioKm: 0,
};

export const ORDINI_TALENTI = [
  { id: 'competenze', nome: 'Più competenze' },
  { id: 'vicinanza', nome: 'Più vicini' },
  { id: 'recenti', nome: 'Disponibili da poco' },
  { id: 'quest', nome: 'Più quest chiuse' },
];

/**
 * I profili che passano i filtri.
 *
 * Le competenze si cercano per nome normalizzato e non per identificativo:
 * chi cerca "project management" lo cerca sul mercato, non nel catalogo di
 * un'azienda, e due organizzazioni che hanno creato quella competenza
 * separatamente devono contare come la stessa cosa. E' la stessa regola che
 * l'osservatorio usa per le tavole del mercato.
 */
const normalizza = (nome) => String(nome || '')
  .trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function cercaTalenti(filtri = {}, ordine = 'competenze') {
  const f = { ...FILTRI_TALENTI, ...filtri };
  const cercate = (f.competenze || []).map(normalizza).filter(Boolean);

  const schede = profiliTrovabili().map(scheda).filter((s) => {
    if (f.zona && (f.zona.continente || f.zona.paese || f.zona.area)) {
      if (!s.zone.some((z) => zonaCopre(z, f.zona))) return false;
    }
    if (cercate.length) {
      const sue = new Set(s.competenze
        .filter((c) => c.livello >= (f.livelloMinimo || 0))
        .map((c) => normalizza(c.nome)));
      if (!cercate.every((n) => sue.has(n))) return false;
    }
    if ((f.lingue || []).length) {
      const sue = new Set(s.lingue);
      if (!f.lingue.every((l) => sue.has(l))) return false;
    }
    if ((f.achievement || []).length) {
      const suoi = new Set(s.achievement.map((a) => a.id));
      if (!f.achievement.every((a) => suoi.has(a))) return false;
    }
    // I filtri su quello che uno cerca non escludono chi non l'ha detto:
    // "non lo dico" non e' un no, e trattarlo da no punirebbe proprio chi e'
    // stato piu' prudente con i propri dati.
    for (const campo of ['disponibilita', 'contratto', 'orario', 'remoto']) {
      const voluto = f[campo];
      if (voluto && s.cerca?.[campo] && s.cerca[campo] !== voluto) return false;
    }
    if (f.questMinime > 0 && s.questChiuse < f.questMinime) return false;
    if (f.centro && f.raggioKm > 0) {
      if (!s.posizione) return false;
      const quanto = distanzaKm(f.centro, s.posizione);
      // Il raggio non scende mai sotto il minimo, nemmeno se chi chiama
      // prova a chiederlo: un cerchio piccolo su una posizione e' un dito
      // puntato, e la griglia da sola non basterebbe a scusarlo.
      if (quanto === null || quanto > Math.max(RAGGIO_MINIMO_KM, f.raggioKm)) return false;
    }
    if (f.successoMinimo > 0) {
      // Il pavimento, non il numero: chi sta sotto non compare, e di chi
      // compare non si sapra' mai di quanto sta sopra.
      const suo = successoDi(s.id);
      if (suo === null || suo < f.successoMinimo) return false;
    }
    return true;
  });

  const per = {
    competenze: (a, b) => b.competenze.length - a.competenze.length,
    recenti: (a, b) => new Date(b.disponibileDa) - new Date(a.disponibileDa),
    quest: (a, b) => b.questChiuse - a.questChiuse,
    // Con un centro si puo' anche ordinare per vicinanza. L'ordine e'
    // sull'esatto, ma quello che si vede resta la fascia: sapere chi e' piu'
    // vicino di chi non dice dove sia nessuno dei due.
    vicinanza: (a, b) => (distanzaKm(f.centro, a.posizione) ?? 1e9)
      - (distanzaKm(f.centro, b.posizione) ?? 1e9),
  };
  return schede.sort(per[ordine] || per.competenze);
}

/** Le competenze su cui ha senso cercare: quelle che qualcuno ha davvero. */
export function vocabolarioTalenti() {
  const nomi = new Map();
  for (const u of profiliTrovabili()) {
    for (const c of competenzeDi(u.id)) {
      const chiave = normalizza(c.nome);
      if (!nomi.has(chiave)) nomi.set(chiave, { nome: c.nome, quanti: 0 });
      nomi.get(chiave).quanti += 1;
    }
  }
  return [...nomi.values()].sort((a, b) => b.quanti - a.quanti || a.nome.localeCompare(b.nome));
}

/**
 * Quanto dista un profilo dal centro della ricerca, a fasce.
 *
 * Mai un numero: la cella e' larga cinque chilometri, quindi un "3,2 km"
 * sarebbe piu' preciso del dato che lo genera — cioe' falso — oltre che
 * piu' di quanto serva a decidere se chiamare qualcuno.
 */
export function distanzaDa(centro, s) {
  if (!centro || !s?.posizione) return null;
  return fasciaDi(distanzaKm(centro, s.posizione));
}

/* ─── Guardarsi con gli occhi di chi cerca ───────────────────────────────*/

/**
 * La propria scheda, esattamente come la vede l'osservatorio.
 *
 * E' la stessa funzione che serve la ricerca, non una copia che le
 * assomiglia: se un giorno la scheda cambiasse, cambierebbe anche qui, e
 * non ci sarebbe modo di mostrare alla persona una cosa e all'azienda
 * un'altra. Vale anche per chi in questo momento non e' in elenco — sta
 * dentro un'organizzazione, o il consenso e' scaduto — perche' la domanda
 * "che cosa vedrebbero di me" ha senso soprattutto prima di dire di si'.
 */
export const miaScheda = (u) => (u?.trovabilita ? scheda(u) : null);

/**
 * Quello che di una persona NON esce mai da questa parte.
 *
 * E' un elenco scritto a mano, e va tenuto allineato a mano: e' il prezzo
 * di poterlo mostrare. Un elenco calcolato dai campi assenti direbbe
 * "questi campi non ci sono", che e' una tautologia; questo invece dice
 * "queste cose esistono, le abbiamo, e non le diamo" — che e' l'unica
 * frase che vale la pena leggere.
 */
export const FUORI_DALLA_SCHEDA = [
  { cosa: 'Nome e cognome', perche: 'Chi cerca vede solo il tuo numero Achivia. Il nome lo dai tu, se rispondi.' },
  { cosa: 'Email e nickname', perche: 'I messaggi passano dall’applicazione: nessuno riceve il tuo indirizzo.' },
  { cosa: 'Avatar e personalizzazioni', perche: 'Non dicono niente sul lavoro e ti renderebbero riconoscibile.' },
  { cosa: 'Crediti e acquisti', perche: 'Sono un saldo, non una misura di quanto vali.' },
  { cosa: 'XP e livello', perche: 'Dicono quanto hai giocato, non quanto sei bravo.' },
  { cosa: 'Percentuale di quest riuscite', perche: 'Si può usare come soglia minima in una ricerca, ma la cifra non viene mai mostrata.' },
  { cosa: 'Assenze, ritardi, presenze', perche: 'Non escono in nessuna forma, nemmeno come filtro.' },
  { cosa: 'Valutazioni e note dei manager', perche: 'Sono conversazioni interne all’azienda dove le hai avute.' },
  { cosa: 'Quest fallite o rifiutate', perche: 'Si conta solo quello che hai portato a termine.' },
  { cosa: 'La tua posizione esatta', perche: 'Se l’hai data, viene arrotondata a un quadrato di 5 km prima di essere salvata.' },
];

/**
 * Tutto quello che l'applicazione tiene su una persona a proposito del
 * lavoro, in un file che si legge senza bisogno di noi.
 */
export function dossierPersonale(u) {
  const t = u?.trovabilita || null;
  return {
    documento: {
      cosa: 'I tuoi dati su Achivia relativi alla ricerca di lavoro.',
      generato: new Date().toISOString(),
      perChi: 'Sei tu. Questo file contiene quello che l’applicazione tiene su di te e quello che mostra a chi cerca profili: le due cose sono segnate separatamente.',
    },
    chiSei: {
      numeroAchivia: u.achiviaId,
      nome: u.name,
      email: u.email,
      nota: 'Questa sezione NON viene mostrata a chi cerca profili. È qui perché è tua.',
    },
    consenso: t ? {
      inElenco: Boolean(t.attiva) && !t.revocatoIl && !consensoScaduto(t),
      accettatoIl: t.accettatoIl,
      scadeIl: t.scadeIl,
      giorniAllaScadenza: giorniAllaScadenza(t),
      revocatoIl: t.revocatoIl,
      posizioneData: Boolean(t.posizione),
    } : { inElenco: false, nota: 'Non ti sei mai messo in elenco.' },
    cosaVedeChiCerca: miaScheda(u),
    cosaNonVedeNessuno: FUORI_DALLA_SCHEDA,
  };
}

export const nomeDossierPersonale = (u) =>
  `achivia-i-miei-dati-${u?.achiviaId || 'profilo'}-${new Date().toISOString().slice(0, 10)}.json`;
