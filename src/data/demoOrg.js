/**
 * Le organizzazioni di prova della classifica.
 *
 * La leaderboard mette a confronto aziende, e con una sola organizzazione
 * nel database non si vedrebbe niente di quello che fa: le fasce di
 * dimensione, il podio, le medaglie, i parimerito. Queste esistono per
 * quello.
 *
 * Sette pagano l'abbonamento, una no. Quella che non paga serve a far
 * vedere il confine: e' un'organizzazione viva come le altre — ha persone,
 * quest, competenze, movimenti di carriera — ma non compare in classifica
 * e non entra nei conti dell'osservatorio. Senza di lei le due regole
 * varrebbero lo stesso, ma non si vedrebbero.
 *
 * Non sono numeri finti scritti a mano su una riga di classifica: sono
 * organizzazioni vere quanto quella di prova — hanno persone, quest chiuse
 * in tempo o in ritardo, richieste d'aiuto raccolte, assenze registrate,
 * riconoscimenti dati. Le misure che le mettono in fila sono le stesse che
 * l'app usa su chiunque, e questo e' il punto: se la classifica sbaglia un
 * conto, qui si vede.
 *
 * I dati si generano da una descrizione compatta (quante persone, quante
 * quest, con che puntualita') e da un caso riproducibile: lo stesso seme
 * da sempre gli stessi numeri, cosi' le prove sono ripetibili e la
 * classifica non balla a ogni ricarica.
 */

import { centroZona } from './geografia';
import { aggancia } from './posizione';

const GIORNO = 86400000;

/**
 * Il vocabolario tecnico del mercato.
 *
 * Serve all'osservatorio, e non poteva nascere per caso: se ogni
 * organizzazione inventasse nomi suoi, nessuna competenza risulterebbe mai
 * adottata da piu' di una, e la domanda "quale competenza sta crescendo"
 * non avrebbe risposta. Qui invece c'e' un vocabolario condiviso, come
 * succede in un mercato vero: le stesse parole ricompaiono in aziende
 * diverse, e a distanza di mesi.
 *
 *   debutto  quanti giorni fa la competenza e' comparsa per la prima
 *            volta. Prima di allora nessuno la crea: e' cosi' che si
 *            riconosce una competenza emergente.
 *   slancio  quanto pesa il tempo recente. Sopra uno le certificazioni si
 *            addensano negli ultimi mesi (competenza in crescita), sotto
 *            uno negli anni passati (in calo).
 *
 * I tre gruppi sono scelti per raccontare qualcosa di leggibile: mestieri
 * che stanno nascendo, mestieri che tengono, mestieri che se ne vanno.
 */
const MESTIERI = [
  // Che stanno nascendo
  { nome: 'Prompt engineering', categoria: 'tecnica', debutto: 300, slancio: 3.4 },
  { nome: 'Analisi dei dati', categoria: 'pensiero', debutto: 640, slancio: 2.3 },
  { nome: 'Automazione dei processi', categoria: 'esecuzione', debutto: 520, slancio: 2.1 },
  { nome: 'Cybersicurezza', categoria: 'tecnica', debutto: 700, slancio: 1.9 },
  { nome: 'Sostenibilita e rendicontazione', categoria: 'pensiero', debutto: 430, slancio: 2.6 },
  { nome: 'Progettazione di servizi', categoria: 'pensiero', debutto: 560, slancio: 1.7 },
  { nome: 'Accessibilita digitale', categoria: 'tecnica', debutto: 380, slancio: 2.2 },
  { nome: 'Gestione del cambiamento', categoria: 'guida', debutto: 610, slancio: 1.6 },
  { nome: 'Infrastruttura cloud', categoria: 'tecnica', debutto: 730, slancio: 1.5 },

  // Che tengono
  { nome: 'Project management', categoria: 'guida', debutto: 730, slancio: 1.0 },
  { nome: 'Analisi finanziaria', categoria: 'pensiero', debutto: 730, slancio: 1.0 },
  { nome: 'Vendita consulenziale', categoria: 'relazione', debutto: 730, slancio: 1.1 },
  { nome: 'Gestione fornitori', categoria: 'esecuzione', debutto: 730, slancio: 0.95 },
  { nome: 'Controllo qualita', categoria: 'esecuzione', debutto: 730, slancio: 1.0 },
  { nome: 'Logistica di magazzino', categoria: 'esecuzione', debutto: 730, slancio: 0.9 },
  { nome: 'Formazione interna', categoria: 'guida', debutto: 730, slancio: 1.1 },

  // Che se ne vanno
  { nome: 'Inserimento dati', categoria: 'esecuzione', debutto: 730, slancio: 0.35 },
  { nome: 'Centralino', categoria: 'relazione', debutto: 730, slancio: 0.3 },
  { nome: 'Archiviazione cartacea', categoria: 'esecuzione', debutto: 730, slancio: 0.25 },
  { nome: 'Server in sede', categoria: 'tecnica', debutto: 730, slancio: 0.4 },
  { nome: 'Fatturazione manuale', categoria: 'esecuzione', debutto: 730, slancio: 0.45 },
];

/* Le soft skill su cui si certifica: sono le standard del catalogo, e
   restano scritte qui per non far dipendere i dati di prova da un file che
   parla d'altro. Se il catalogo cambia, questi id restano validi finche'
   esistono — e se uno sparisce, sparisce una riga dai conti, non l'app. */
const SOFT = [
  'communication', 'teamwork', 'collaboration', 'time-management', 'adaptability',
  'resilience', 'learning-agility', 'problem-solving', 'critical-thinking',
  'decision-making', 'ownership', 'leadership',
];

const REPARTI = ['Operazioni', 'Commerciale', 'Tecnologia', 'Amministrazione', 'Persone'];

/** Caso riproducibile: stesso seme, stessa sequenza. */
function caso(seme) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (t) => new Date(t).toISOString();
const giornoIso = (t) => iso(t).slice(0, 10);

/**
 * Le otto. Sono scelte per coprire i casi che la classifica deve saper
 * distinguere: una grande e puntuale, una piccola quasi perfetta, una
 * grande ma lenta, due che si equivalgono (il parimerito), una nuova di
 * pochi mesi, due personalizzate in mezzo alle aziende. E una senza abbonamento,
 * che nessuna delle due schermate deve contare.
 */
export const DEMO = [
  {
    id: 'org-nordvento', nome: 'Nordvento Logistica', tipo: 'azienda',
    membri: 34, quest: 300, puntualita: 93, scadute: 6, anzianita: 900,
    aiuti: 96, extraMile: 62, mesiSporchi: 3, seme: 101,
  },
  {
    id: 'org-ferrovia', nome: 'Ferrovia Sud', tipo: 'azienda',
    membri: 212, quest: 520, puntualita: 84, scadute: 30, anzianita: 1400,
    aiuti: 210, extraMile: 155, mesiSporchi: 11, seme: 202,
    // Ottanta quest da pochi crediti: la classifica non le deve contare.
    questVuote: 80,
  },
  {
    id: 'org-radice', nome: 'Cooperativa Radice', tipo: 'azienda',
    membri: 61, quest: 380, puntualita: 90, scadute: 12, anzianita: 700,
    aiuti: 140, extraMile: 90, mesiSporchi: 5, seme: 303,
  },
  {
    // Le organizzazioni personalizzate non comprano l'abbonamento: non
    // comprerebbero niente. Restano qui come esempio di quel tipo, fuori
    // dalla lega e fuori dall'osservatorio.
    id: 'org-delta', nome: 'Squadra Delta', tipo: 'personalizzata',
    membri: 22, quest: 180, puntualita: 79, scadute: 18, anzianita: 500,
    aiuti: 58, extraMile: 40, mesiSporchi: 7, seme: 404,
    questVuote: 60, premium: false,
  },
  {
    id: 'org-merlino', nome: 'Studio Merlino', tipo: 'azienda',
    // Stessa puntualita' di Nordvento: e' il parimerito, che deve dare a
    // tutte e due la stessa medaglia.
    membri: 8, quest: 130, puntualita: 93, scadute: 2, anzianita: 400,
    aiuti: 26, extraMile: 21, mesiSporchi: 1, seme: 505,
  },
  {
    id: 'org-vespri', nome: 'Atelier Vespri', tipo: 'azienda',
    membri: 12, quest: 140, puntualita: 97, scadute: 1, anzianita: 150,
    aiuti: 30, extraMile: 26, mesiSporchi: 0, seme: 606,
  },
  {
    id: 'org-baroni', nome: 'Clan Baroni', tipo: 'personalizzata',
    membri: 5, quest: 60, puntualita: 96, scadute: 0, anzianita: 200,
    aiuti: 12, extraMile: 8, mesiSporchi: 0, seme: 707, premium: false,
  },
  {
    // Questa usa Achivia gratis. E' fatta come le altre — anzi, e' fra le
    // piu' puntuali — proprio perche' il motivo per cui resta fuori dalla
    // classifica e dall'osservatorio sia uno solo: non paga.
    id: 'org-corvino', nome: 'Officina Corvino', tipo: 'azienda',
    membri: 19, quest: 170, puntualita: 95, scadute: 3, anzianita: 600,
    aiuti: 44, extraMile: 33, mesiSporchi: 1, seme: 808,
    premium: false,
  },
];

const NOMI = ['Anna', 'Bruno', 'Carla', 'Dario', 'Elena', 'Fabio', 'Gaia', 'Ivan', 'Lara', 'Marco',
  'Nadia', 'Omar', 'Paola', 'Quirino', 'Rita', 'Simone', 'Tea', 'Ugo', 'Vera', 'Zeno'];
const COGNOMI = ['Alberti', 'Bonomi', 'Caruso', 'De Santis', 'Esposito', 'Ferrari', 'Greco',
  'Iodice', 'Lombardi', 'Marchetti', 'Neri', 'Orlando', 'Pagano', 'Rizzo', 'Sartori', 'Turco'];

const TITOLI = ['Consegna del report', 'Revisione del turno', 'Controllo qualita’', 'Preparazione ordine',
  'Manutenzione programmata', 'Formazione interna', 'Riordino magazzino', 'Chiusura pratica',
  'Verifica fornitore', 'Aggiornamento listino'];

/**
 * Da una descrizione a un'organizzazione intera: persone, quest, aiuti,
 * presenze, riconoscimenti. Tutto datato all'indietro a partire da oggi,
 * dentro la sua anzianita'.
 */
function generaOrg(spec, indice) {
  const r = caso(spec.seme);
  const ora = Date.now();
  const nascita = ora - spec.anzianita * GIORNO;
  const numero = (n) => String(20000000 + indice * 1000 + n);

  const users = [];
  const capo = {
    id: `${spec.id}-admin`,
    achiviaId: numero(0),
    orgId: spec.id,
    role: 'admin',
    orgOwner: true,
    // L'abbonamento sta sul proprietario: e' li' che lo cerca chi decide
    // se un'organizzazione entra in classifica e nei conti del mercato.
    premium: spec.premium !== false,
    orgTipo: spec.tipo,
    orgCreatedAt: iso(nascita),
    org: spec.nome,
    orgCode: spec.id.slice(4, 10).toUpperCase(),
    name: `Admin ${spec.nome}`,
    email: `admin@${spec.id.slice(4)}.test`,
    password: 'demo',
    level: 1, xp: 0, credits: 0, departmentIds: [],
  };
  users.push(capo);

  for (let i = 1; i < spec.membri; i += 1) {
    const nome = `${NOMI[Math.floor(r() * NOMI.length)]} ${COGNOMI[Math.floor(r() * COGNOMI.length)]}`;
    // Un responsabile ogni otto persone: serve a far vedere che le
    // organizzazioni grandi hanno una struttura, non solo una folla.
    const capoSquadra = i % 8 === 0;
    users.push({
      id: `${spec.id}-u${i}`,
      achiviaId: numero(i),
      orgId: spec.id,
      role: capoSquadra ? 'manager' : 'employee',
      name: nome,
      email: `${spec.id}-${i}@demo.test`,
      password: 'demo',
      level: 1 + Math.floor(r() * 6),
      xp: Math.floor(r() * 400),
      credits: Math.floor(r() * 300),
      managerId: capoSquadra ? null : `${spec.id}-u${Math.max(1, Math.floor(i / 8) * 8)}`,
      departmentIds: [],
    });
  }

  const esecutori = users.filter((u) => u.role !== 'admin');
  const unoQualsiasi = () => esecutori[Math.floor(r() * esecutori.length)] || users[0];
  // Le date si spalmano sulla vita dell'organizzazione, ma non oltre due
  // anni indietro: piu' in la' nessun grafico dell'app guarda.
  const arco = Math.min(spec.anzianita, 730);
  const quando = () => ora - Math.floor(r() * arco) * GIORNO;

  const quests = [];
  const inRitardo = Math.round(spec.quest * (1 - spec.puntualita / 100));
  for (let i = 0; i < spec.quest; i += 1) {
    const chiusa = quando();
    const tardi = i < inRitardo;
    const persona = unoQualsiasi();
    // I campi sono i pochi che servono alle misure: ogni riga in piu' e'
    // spazio tolto al deposito del browser, e queste righe sono migliaia.
    quests.push({
      id: `${spec.id}-q${i}`,
      title: TITOLI[Math.floor(r() * TITOLI.length)],
      type: 'principale',
      assigneeType: persona.role === 'manager' ? 'manager' : 'employee',
      assigneeId: persona.id,
      createdById: capo.id,
      credits: 10 + Math.floor(r() * 40),
      status: 'approvata',
      late: tardi,
      approvedAt: iso(chiusa),
      deadline: iso(chiusa + (tardi ? -2 : 2) * GIORNO),
    });
  }
  // Le quest da niente: chiuse e approvate come le altre, ma pagano meno di
  // dieci crediti. Servono a far vedere che la classifica le ignora.
  for (let i = 0; i < (spec.questVuote || 0); i += 1) {
    const persona = unoQualsiasi();
    const chiusa = quando();
    quests.push({
      id: `${spec.id}-v${i}`,
      title: TITOLI[Math.floor(r() * TITOLI.length)],
      type: 'principale',
      assigneeType: persona.role === 'manager' ? 'manager' : 'employee',
      assigneeId: persona.id,
      createdById: capo.id,
      credits: Math.floor(r() * 6),
      status: 'approvata',
      late: false,
      approvedAt: iso(chiusa),
      deadline: iso(chiusa + 2 * GIORNO),
    });
  }
  for (let i = 0; i < spec.scadute; i += 1) {
    const persona = unoQualsiasi();
    quests.push({
      id: `${spec.id}-s${i}`,
      title: TITOLI[Math.floor(r() * TITOLI.length)],
      type: 'principale',
      assigneeType: persona.role === 'manager' ? 'manager' : 'employee',
      assigneeId: persona.id,
      createdById: capo.id,
      credits: 10 + Math.floor(r() * 30),
      status: 'scaduta',
      deadline: iso(quando()),
    });
  }

  const helpRequests = [];
  for (let i = 0; i < spec.aiuti; i += 1) {
    const chi = unoQualsiasi();
    const aiutante = unoQualsiasi();
    const nato = quando();
    helpRequests.push({
      id: `${spec.id}-h${i}`,
      requesterId: chi.id,
      helperId: aiutante.id === chi.id ? capo.id : aiutante.id,
      createdAt: iso(nato),
      acceptedAt: iso(nato + 3 * 3600000),
    });
  }

  // Un riconoscimento sta sempre appeso a una quest vera: e' cosi' che si
  // assegna nell'app, ed e' quello che la classifica pretende di vedere.
  const pagate = quests.filter((q) => q.status === 'approvata' && q.credits >= 10);
  const achievementInstances = [];
  // Una quest sola non premia due volte: e' la regola dell'app, e vale
  // anche per i dati di prova — altrimenti il numero sarebbe gonfio.
  const premiate = new Set();
  for (let i = 0; i < spec.extraMile; i += 1) {
    let quest = null;
    for (let tentativi = 0; tentativi < 12 && !quest; tentativi += 1) {
      const candidata = pagate[Math.floor(r() * pagate.length)];
      if (candidata && !premiate.has(candidata.id)) quest = candidata;
    }
    if (!quest) break;
    premiate.add(quest.id);
    achievementInstances.push({
      id: `${spec.id}-em${i}`,
      userId: quest.assigneeId,
      achievementId: 'extra-mile',
      questId: quest.id,
      ciclo: i + 1,
      progresso: 1,
      target: 1,
      crediti: 0,
      fonte: 'manual',
      ottenutoIl: iso(quando()),
      pregressa: true,
    });
  }

  // Le assenze: una per ognuno dei mesi "sporchi", cosi' i mesi puliti
  // sono quelli che restano. Piu' una registrazione vecchia che fa da
  // inizio del tracciamento, altrimenti l'organizzazione non avrebbe
  // nessun mese misurabile.
  const attendance = [{
    id: `${spec.id}-pr-inizio`,
    employeeId: esecutori[0]?.id || capo.id,
    orgId: spec.id,
    giorno: giornoIso(ora - Math.min(spec.anzianita, 730) * GIORNO),
    tipo: 'ritardo',
    minuti: 5,
    giustificata: true,
    nota: 'inizio registro',
    daId: capo.id,
  }];
  for (let i = 0; i < spec.mesiSporchi; i += 1) {
    const mese = new Date(ora);
    mese.setMonth(mese.getMonth() - (i * 2 + 1));
    mese.setDate(5 + Math.floor(r() * 20));
    attendance.push({
      id: `${spec.id}-pr${i}`,
      employeeId: unoQualsiasi().id,
      orgId: spec.id,
      giorno: giornoIso(mese.getTime()),
      tipo: 'assenza',
      minuti: 0,
      giustificata: r() > 0.5,
      nota: '',
      daId: capo.id,
    });
  }

  /* ─── I reparti ───
     Le persone vanno divise prima di poterle vedere spostare: senza
     reparti, la mobilita' interna non ha ne' un "da" ne' un "verso". */
  const dipartimenti = REPARTI.slice(0, Math.max(2, Math.min(REPARTI.length, Math.ceil(spec.membri / 12))))
    .map((nome, i) => ({ id: `${spec.id}-dip${i}`, orgId: spec.id, nome }));
  for (const u of esecutori) {
    u.departmentIds = [dipartimenti[Math.floor(r() * dipartimenti.length)].id];
  }

  /* ─── Le competenze tecniche che l'organizzazione si crea ───
     Non a caso: si pesca dal vocabolario condiviso, e una competenza si
     puo' creare solo dopo che e' comparsa sul mercato. E' cosi' che
     l'osservatorio puo' dire "questa e' nata l'anno scorso ed e' gia' in
     nove aziende su ventidue". */
  const skills = [];
  const quante = Math.max(3, Math.min(MESTIERI.length, 4 + Math.round(spec.membri / 12)));
  const scelti = [];
  // Si passa il vocabolario finche' non se ne sono scelte abbastanza: chi
  // ha slancio viene adottato piu' spesso, ed e' il mercato che sceglie.
  // Nessuna competenza e' preclusa a un'organizzazione giovane — a
  // impedirle di crearla prima che esistesse ci pensa la data, sotto.
  for (let giro = 0; giro < 4 && scelti.length < quante; giro += 1) {
    for (const mestiere of MESTIERI) {
      if (scelti.length >= quante) break;
      if (scelti.includes(mestiere)) continue;
      if (r() < Math.min(0.9, 0.3 * mestiere.slancio)) scelti.push(mestiere);
    }
  }
  scelti.forEach((mestiere, i) => {
    // Creata dopo il suo debutto e dopo la nascita dell'organizzazione:
    // nessuno crea una competenza prima di esistere.
    const primaData = Math.max(nascita, ora - mestiere.debutto * GIORNO);
    const nata = primaData + Math.floor(r() * Math.max(1, ora - primaData));
    skills.push({
      id: `${spec.id}-sk${i}`,
      orgId: spec.id,
      name: mestiere.nome,
      description: '',
      categoria: mestiere.categoria,
      type: 'technical',
      isStandard: false,
      hasLevels: true,
      badgeImage: null,
      prerequisites: [],
      createdById: capo.id,
      createdAt: iso(nata),
      slancio: mestiere.slancio,
    });
  });

  /* ─── Le certificazioni ───
     Ognuna e' una persona, una competenza, un livello e una data. La data
     non e' distribuita a caso: le competenze con slancio si addensano
     verso oggi, quelle in calo verso il passato. E' quella differenza che
     l'osservatorio legge come "in aumento" o "in diminuzione". */
  const certifications = [];
  let certN = 0;
  const dataPesata = (slancio, minimo) => {
    // Con slancio 1 la data e' piatta sull'arco; sopra 1 si schiaccia sul
    // recente, sotto 1 sul lontano.
    const t = r() ** (slancio > 1 ? 1 / slancio : 2 - slancio);
    const inizio = Math.max(nascita, minimo);
    return inizio + Math.floor(t * Math.max(1, ora - inizio));
  };
  /* Il livello non e' un dado a quattro facce. Una competenza comparsa da
     poco la sanno quasi tutti da principianti, perche' non c'e' stato il
     tempo di diventarci esperti; una che esiste da anni ce l'hanno in mano
     anche i veterani. E' questa differenza che rende la distribuzione dei
     livelli un'informazione, e non rumore: senza, ogni competenza avrebbe
     la stessa forma e guardarla non servirebbe a niente. */
  const livelloPesato = (maturita) => {
    const pesi = [
      3 - maturita * 2,       // Beginner: da tre parti a una
      2 + maturita * 0.5,     // Intermediate: quasi stabile
      0.6 + maturita * 1.8,   // Advanced
      0.2 + maturita * 1.6,   // Expert
    ];
    let tirata = r() * pesi.reduce((sm, pe) => sm + pe, 0);
    for (let i = 0; i < pesi.length; i += 1) {
      tirata -= pesi[i];
      if (tirata <= 0) return i + 1;
    }
    return 4;
  };
  const maturitaDi = (creata) => Math.min(1, Math.max(0, (ora - creata) / (730 * GIORNO)));
  for (const persona of esecutori) {
    const soft = 1 + Math.floor(r() * 3);
    for (let i = 0; i < soft; i += 1) {
      const skillId = SOFT[Math.floor(r() * SOFT.length)];
      if (certifications.some((c) => c.employeeId === persona.id && c.skillId === skillId)) continue;
      certN += 1;
      const quandoCert = dataPesata(1, nascita);
      certifications.push({
        id: `${spec.id}-c${certN}`,
        employeeId: persona.id,
        skillId,
        // Le soft skill esistono da sempre: quello che cambia e' quanto e'
        // avanti chi le ha, e per quelle il tempo lo porta la persona.
        level: livelloPesato(Math.min(1, ((persona.level || 1) - 1) / 5)),
        status: 'certified',
        certifiedBy: capo.id,
        certifiedAt: iso(quandoCert),
      });
    }
    const tecniche = Math.floor(r() * 3);
    for (let i = 0; i < tecniche && skills.length; i += 1) {
      const skill = skills[Math.floor(r() * skills.length)];
      if (certifications.some((c) => c.employeeId === persona.id && c.skillId === skill.id)) continue;
      certN += 1;
      certifications.push({
        id: `${spec.id}-c${certN}`,
        employeeId: persona.id,
        skillId: skill.id,
        level: livelloPesato(maturitaDi(new Date(skill.createdAt).getTime())),
        status: 'certified',
        certifiedBy: capo.id,
        certifiedAt: iso(dataPesata(skill.slancio, new Date(skill.createdAt).getTime())),
      });
    }
  }
  // Lo slancio serviva solo a distribuire le date: non e' un campo che
  // l'app conosce, e nel deposito sarebbe peso morto.
  for (const s of skills) delete s.slancio;

  /* ─── La carriera ───
     L'ingresso di ognuno, e per qualcuno un cambio di ruolo o di reparto.
     Senza questo registro l'osservatorio vedrebbe solo com'e' oggi il
     mercato, mai come ci si e' arrivati. */
  const carriera = [];
  let carN = 0;
  const segna = (persona, tipo, da, a, quandoIso) => {
    carN += 1;
    carriera.push({
      id: `${spec.id}-car${carN}`, userId: persona.id, orgId: spec.id,
      tipo, da: da ?? null, a: a ?? null, il: quandoIso,
    });
  };
  for (const persona of esecutori) {
    const entrato = nascita + Math.floor(r() * Math.max(1, ora - nascita));
    segna(persona, 'ingresso', null, persona.role, iso(entrato));
    // Una persona su nove viene promossa, una su sette cambia reparto.
    if (persona.role === 'manager' && r() < 0.6) {
      segna(persona, 'ruolo', 'employee', 'manager', iso(entrato + Math.floor((ora - entrato) * 0.6)));
    }
    if (r() < 0.14 && dipartimenti.length > 1) {
      const altro = dipartimenti[Math.floor(r() * dipartimenti.length)];
      if (altro.id !== persona.departmentIds[0]) {
        segna(persona, 'reparto', persona.departmentIds[0], altro.id, iso(entrato + Math.floor((ora - entrato) * 0.5)));
      }
    }
  }

  return { users, quests, helpRequests, achievementInstances, attendance, skills, certifications, carriera, dipartimenti };
}

/* ─── Chi si e' reso trovabile ───────────────────────────────────────────
   Persone uscite da un'organizzazione che pagava, che hanno acceso "fatti
   trovare" e adesso aspettano che qualcuno le cerchi. Senza di loro la
   schermata dei profili dell'osservatorio sarebbe una ricerca su un elenco
   vuoto, e non si vedrebbe niente di quello che fa.

   Portano addosso quello che il modello dice che devono portare: le
   certificazioni con l'organizzazione in cui sono nate, un passaggio nello
   storico, nessun orgId adesso. E nessuna viene da Officina Corvino, che
   non paga: quello che si fa li' dentro, uscendo, sparisce. */
const LETTERE = [
  'Vengo dalla logistica e negli ultimi due anni mi sono spostata sui dati: sono le stesse domande, ma con gli strumenti giusti. Cerco un posto dove questo passaggio sia il lavoro e non il tempo libero.',
  'Ho passato sei anni a far funzionare i processi di qualcun altro. Adesso vorrei costruirne uno da zero, anche piccolo, anche in un posto che non ha ancora capito bene che cosa gli serve.',
  'Tecnico, ma quello che mi diverte davvero e’ spiegare le cose. Nell’ultima azienda ho certificato mezza squadra e mi e’ piaciuto piu’ del codice.',
  'Vengo da un’azienda molto strutturata e cerco l’opposto: pochi, veloci, con la possibilita’ di sbagliare in fretta. Disponibile a spostarmi.',
  'Amministrazione e controllo, con la testa piu’ sulla previsione che sulla registrazione. Mi interessa lavorare dove i numeri servono a decidere.',
  'Ho iniziato dal magazzino e sono arrivata a coordinare tre reparti. Cerco un ruolo dove serva qualcuno che sa come si fa il lavoro, non solo come si organizza.',
  'Faccio sicurezza informatica da abbastanza tempo da sapere che il problema non e’ quasi mai tecnico. Cerco un’organizzazione che voglia sentirselo dire.',
  'Progettazione di servizi. Mi piacciono i posti in cui il cliente e’ una persona vera e non una riga in un foglio.',
  'Vengo dal commerciale ma la parte che so fare meglio e’ ascoltare. Cerco un ruolo dove valga.',
  'Due lingue, tre paesi, un mestiere solo: far arrivare le cose dove devono, quando devono. Disponibile a muovermi ancora.',
  'Sto passando dalla formazione interna alla progettazione dei percorsi. Cerco chi ha bisogno di costruire competenze e non sa da dove cominciare.',
  'Ho lavorato in un’azienda che e’ cresciuta troppo in fretta e ho visto cosa si rompe. Vorrei rendermi utile a qualcuno che sta per farlo.',
];

const ZONE_DEMO = [
  [{ continente: 'europa', paese: 'it', area: 'Lombardia' }, { continente: 'europa', paese: 'it', area: 'Piemonte' }],
  [{ continente: 'europa', paese: 'it' }],
  [{ continente: 'europa' }],
  [{ continente: 'europa', paese: 'it', area: 'Lazio' }],
  [{ continente: 'europa', paese: 'it', area: 'Veneto' }, { continente: 'europa', paese: 'at' }],
  [{ continente: 'europa', paese: 'it', area: 'Emilia-Romagna' }],
  [{ continente: 'europa', paese: 'de' }, { continente: 'europa', paese: 'ch' }],
  [{ continente: 'europa', paese: 'it', area: 'Toscana' }],
  [{ continente: 'europa', paese: 'it', area: 'Campania' }],
  [{ continente: 'europa' }, { continente: 'nordamerica', paese: 'ca' }],
  [{ continente: 'europa', paese: 'it', area: 'Sicilia' }],
  [{ continente: 'europa', paese: 'es' }, { continente: 'europa', paese: 'pt' }],
];

const LINGUE_DEMO = [
  ['it', 'en'], ['it'], ['it', 'en', 'fr'], ['it', 'en'], ['it', 'de'], ['it', 'en'],
  ['it', 'en', 'de'], ['it', 'en'], ['it', 'es'], ['it', 'en', 'fr'], ['it'], ['it', 'es', 'pt'],
];

/**
 * Una posizione plausibile dentro la zona dichiarata: si parte dal centro
 * dell'area e ci si sposta di qualche decina di chilometri a caso, poi si
 * aggancia alla griglia — esattamente quello che succede a una posizione
 * vera quando arriva dal browser.
 */
function posizioneDemo(zona, r) {
  const centro = centroZona(zona);
  if (!centro) return null;
  const cella = aggancia(centro.lat + (r() - 0.5) * 0.6, centro.lon + (r() - 0.5) * 0.8);
  return cella ? { ...cella, precisione: 'gps' } : null;
}

/**
 * Dodici profili liberi, costruiti sui dati delle organizzazioni gia'
 * generate: ognuno e' passato da una di quelle che pagano, e quello che ha
 * ottenuto li' se l'e' portato via.
 */
function generaTalenti(organizzazioni) {
  const r = caso(9090);
  const ora = Date.now();
  const paganti = DEMO.filter((d) => d.premium !== false);
  const users = [];
  const certifications = [];
  const achievementInstances = [];
  const carriera = [];
  const storico = [];

  for (let i = 0; i < LETTERE.length; i += 1) {
    const spec = paganti[i % paganti.length];
    const sue = organizzazioni.get(spec.id);
    const id = `talento-${i + 1}`;
    const uscito = ora - Math.floor(r() * 200 + 10) * GIORNO;
    const entrato = uscito - Math.floor(r() * 900 + 400) * GIORNO;

    users.push({
      id,
      achiviaId: String(30000000 + i * 137),
      // Il nome c'e' perche' la persona ce l'ha: e' l'osservatorio che non
      // lo riceve, non l'anagrafe che non lo scrive.
      name: `${NOMI[Math.floor(r() * NOMI.length)]} ${COGNOMI[Math.floor(r() * COGNOMI.length)]}`,
      email: `talento${i + 1}@demo.test`,
      password: 'demo',
      role: 'employee',
      orgId: null,
      // XP e livello non si azzerano quando si cambia azienda: chi e' uscito
      // se li e' portati dietro, ed e' giusto che si vedano sul suo profilo.
      level: 2 + Math.floor(r() * 5),
      xp: 400 + Math.floor(r() * 3600),
      credits: Math.floor(r() * 400),
      departmentIds: [],
      trovabilita: {
        attiva: true,
        lettera: LETTERE[i],
        zone: ZONE_DEMO[i],
        lingue: LINGUE_DEMO[i],
        // Circa la meta' ha dato anche la posizione: gli altri restano
        // cercabili per distanza col centro della zona che hanno
        // dichiarato, che e' esattamente il caso da far vedere.
        posizione: i % 2 === 0 ? posizioneDemo(ZONE_DEMO[i][0], r) : null,
        accettatoIl: iso(uscito + Math.floor(r() * 8) * GIORNO),
        revocatoIl: null,
      },
    });

    // Le competenze che si porta dietro: prese dal vocabolario tecnico
    // dell'organizzazione da cui viene, piu' qualche soft skill.
    const suePossibili = (sue?.skills || []);
    const quante = 3 + Math.floor(r() * 4);
    const prese = new Set();
    for (let k = 0; k < quante && suePossibili.length; k += 1) {
      const skill = suePossibili[Math.floor(r() * suePossibili.length)];
      if (prese.has(skill.id)) continue;
      prese.add(skill.id);
      certifications.push({
        id: `${id}-c${k}`,
        employeeId: id,
        orgId: spec.id,
        skillId: skill.id,
        level: 1 + Math.floor(r() * 4),
        status: 'certified',
        certifiedBy: `${spec.id}-admin`,
        certifiedAt: iso(entrato + Math.floor(r() * (uscito - entrato))),
        storia: [],
      });
    }
    const quanteSoft = 1 + Math.floor(r() * 3);
    for (let k = 0; k < quanteSoft; k += 1) {
      const skillId = SOFT[Math.floor(r() * SOFT.length)];
      if (prese.has(skillId)) continue;
      prese.add(skillId);
      certifications.push({
        id: `${id}-s${k}`,
        employeeId: id,
        orgId: spec.id,
        skillId,
        level: 1 + Math.floor(r() * 4),
        status: 'certified',
        certifiedBy: `${spec.id}-admin`,
        certifiedAt: iso(entrato + Math.floor(r() * (uscito - entrato))),
        storia: [],
      });
    }

    // Qualche achievement, fra quelli che si prendono lavorando.
    const presi = ['closer', 'deadline-master', 'team-player', 'helping-hand', 'extra-mile', 'costante'];
    const quantiAch = Math.floor(r() * 4);
    for (let k = 0; k < quantiAch; k += 1) {
      achievementInstances.push({
        id: `${id}-a${k}`,
        userId: id,
        orgId: spec.id,
        achievementId: presi[Math.floor(r() * presi.length)],
        ambito: 'personale',
        ottenutoIl: iso(entrato + Math.floor(r() * (uscito - entrato))),
        crediti: 0,
      });
    }

    carriera.push(
      { id: `${id}-car0`, userId: id, orgId: spec.id, tipo: 'ingresso', da: null, a: 'employee', il: iso(entrato) },
      // E l'uscita: e' il motivo per cui questi profili sono liberi, e senza
      // scriverla la tavola delle uscite resterebbe a zero pur avendo
      // davanti dodici persone che se ne sono andate.
      { id: `${id}-car1`, userId: id, orgId: spec.id, tipo: 'uscita', da: 'employee', a: null, il: iso(uscito) },
    );
    storico.push({
      id: `${id}-sto`,
      userId: id,
      orgId: spec.id,
      nomeOrg: spec.nome,
      ruolo: 'employee',
      da: iso(entrato),
      a: iso(uscito),
      questChiuse: 8 + Math.floor(r() * 90),
      aiuti: Math.floor(r() * 25),
    });
  }

  return { users, certifications, achievementInstances, carriera, storico };
}

/* ─── Gli annunci di prova ───────────────────────────────────────────────
   Una bacheca vuota non si capisce: non si vede che forma ha una scheda,
   non si prova un filtro, e non si vede che cosa cambia quando un annuncio
   e' in evidenza. Questi sono otto, sparsi per l'Italia, con mestieri
   diversi apposta — magazzino, officina, cura, ufficio — perche' la ricerca
   per parole abbia qualcosa da distinguere.

   Il tetto e' rispettato: le organizzazioni con abbonamento ne hanno due,
   quella senza ne ha uno solo. Una bacheca di esempio che contraddice le
   sue stesse regole e' peggio di una vuota.

   Gli indirizzi finiscono in `.test`, che e' un dominio riservato apposta e
   non esiste: un annuncio di prova con un indirizzo vero manderebbe
   candidature a qualcuno. */
const ANNUNCI = [
  {
    org: 'org-achivia', da: 'u-admin', giorniFa: 3, risaltoGiorni: 10,
    titolo: 'Sviluppatrice o sviluppatore front-end',
    competenze: ['javascript', 'sviluppo-web', 'problem-solving', 'teamwork'],
    email: 'lavoro@achivia.test',
    area: 'Lombardia', modalita: 'ibrido', unita: 'annuo', da_: 32000, a_: 42000,
    testo: 'Lavorerai sull’interfaccia di Achivia insieme a due persone: React, niente framework esotici, e molto tempo speso a togliere roba invece che ad aggiungerla. Ci interessa che tu sappia leggere il codice di qualcun altro prima di riscriverlo. Tre giorni in ufficio a Milano, due dove preferisci.',
  },
  {
    org: 'org-achivia', da: 'u-admin', giorniFa: 12,
    titolo: 'Assistenza clienti — organizzazioni',
    competenze: ['assistenza-clienti', 'communication', 'inglese'],
    email: 'lavoro@achivia.test',
    area: 'Lazio', modalita: 'remoto', unita: 'annuo', da_: 28000, a_: 34000,
    testo: 'Rispondi alle organizzazioni che usano Achivia: come si configura un ruolo, perché una quest non si chiude, che cosa vede un dipendente. Serve pazienza e la voglia di scrivere risposte che si capiscano al primo colpo. Tutto da remoto, con due incontri all’anno di persona.',
  },
  {
    org: 'org-nordvento', giorniFa: 5,
    titolo: 'Responsabile di magazzino, turno notte',
    competenze: ['logistica', 'leadership', 'sicurezza-lavoro', 'pianificazione'],
    email: 'selezione@nordvento.test',
    area: 'Emilia-Romagna', modalita: 'sede', unita: 'annuo', da_: 30000, a_: 36000,
    testo: 'Coordini otto persone dalle 22 alle 6: preparazione degli ordini, controllo dei carichi in partenza, chiusura dei documenti. Cerchiamo qualcuno che abbia già fatto turni di notte e sappia che cosa vuol dire tenere insieme una squadra alle quattro del mattino. Contratto a tempo indeterminato dopo sei mesi.',
  },
  {
    org: 'org-nordvento', giorniFa: 20,
    titolo: 'Autista patente CE',
    competenze: ['logistica', 'sicurezza-lavoro', 'ownership'],
    email: 'selezione@nordvento.test',
    area: 'Veneto', modalita: 'sede', unita: 'mensile', da_: 2000, a_: 2400,
    testo: 'Consegne regionali su mezzi di nostra proprietà, sempre rientro in giornata: niente notti fuori. Patente CE e CQC in corso di validità. Il mezzo è assegnato, non si cambia ogni mattina, e la manutenzione la facciamo noi. Straordinari pagati, mai imposti.',
  },
  {
    org: 'org-ferrovia', giorniFa: 8,
    titolo: 'Tecnico manutenzione rotabili',
    competenze: ['manutenzione-meccanica', 'manutenzione-elettrica', 'sicurezza-lavoro', 'controllo-qualita'],
    email: 'personale@ferroviasud.test',
    area: 'Piemonte', modalita: 'sede', unita: 'annuo', da_: 29000, a_: 35000,
    testo: 'Manutenzione programmata e riparazioni in officina su materiale rotabile: freni, carrelli, impianti di bordo. Si lavora in squadra da tre, su due turni, con la formazione a carico nostro per le abilitazioni che ti mancano. Preferiamo chi arriva dalla meccanica pesante anche se non ha mai visto un treno.',
  },
  {
    org: 'org-radice', giorniFa: 15,
    titolo: 'Educatrice o educatore professionale',
    competenze: ['communication', 'teamwork', 'adaptability', 'formazione'],
    email: 'assunzioni@cooperativaradice.test',
    area: 'Toscana', modalita: 'sede', unita: 'orario', da_: 14, a_: 18,
    testo: 'Servizio diurno per adulti con disabilità: laboratori, uscite sul territorio, rapporti con le famiglie. Trenta ore settimanali su cinque giorni, mai il fine settimana. Titolo di educatore professionale richiesto. Si entra affiancati per un mese, non si viene lasciati soli il primo giorno.',
  },
  {
    org: 'org-vespri', giorniFa: 30,
    titolo: 'Sarta o sarto modellista',
    competenze: ['cad', 'controllo-qualita', 'ownership'],
    email: 'atelier@vespri.test',
    area: 'Marche', modalita: 'sede', unita: 'mensile', da_: 1800, a_: 2200,
    testo: 'Sviluppo taglie e prototipi per capi su misura, dal cartamodello al primo campione. Laboratorio piccolo, otto persone, produzione tutta interna. Cerchiamo mano e occhio: il software lo impari qui, il mestiere no. Orario continuato, niente straordinari di stagione.',
  },
  {
    org: 'org-corvino', giorniFa: 6,
    titolo: 'Tornitore CNC',
    competenze: ['cnc', 'cad', 'controllo-qualita', 'sicurezza-lavoro'],
    email: 'officina@corvino.test',
    area: 'Lombardia', modalita: 'sede', unita: 'mensile', da_: 1900, a_: 2300,
    testo: 'Attrezzaggio e conduzione di torni a controllo numerico su lotti medi, lettura del disegno meccanico e controllo dimensionale dei pezzi. Officina di venti persone, commesse lunghe e clienti stabili. Turno unico dalle 8 alle 17, straordinario solo se lo chiedi tu.',
  },
];

/** Gli annunci pronti da versare nel deposito, con le date rifatte a
    partire da oggi come per le quest: datate a mano invecchierebbero. */
function annunciDemo() {
  const ora = Date.now();
  return ANNUNCI.map((a, i) => {
    const zona = { continente: 'europa', paese: 'it', area: a.area };
    const centro = centroZona(zona);
    const nato = ora - a.giorniFa * GIORNO;
    return {
      id: `ann-demo-${i + 1}`,
      orgId: a.org,
      creatoDaId: a.da || `${a.org}-admin`,
      stato: 'pubblicato',
      titolo: a.titolo,
      zona,
      posizione: centro ? { lat: centro.lat, lon: centro.lon, precisione: centro.precisione } : null,
      modalita: a.modalita,
      unita: a.unita,
      ralDa: a.da_,
      ralA: a.a_,
      descrizione: a.testo,
      email: a.email,
      competenze: a.competenze,
      risaltoFinoAl: a.risaltoGiorni ? iso(ora + a.risaltoGiorni * GIORNO) : null,
      creatoIl: iso(nato),
      aggiornatoIl: iso(nato),
    };
  });
}

/** Tutte le organizzazioni di prova, pronte da versare nel database. */
export function datiDemo() {
  const fuori = {
    users: [], quests: [], helpRequests: [], achievementInstances: [], attendance: [],
    skills: [], certifications: [], carriera: [], dipartimenti: [], storico: [],
  };
  const perId = new Map();
  DEMO.forEach((spec, i) => {
    const org = generaOrg(spec, i + 1);
    perId.set(spec.id, org);
    for (const chiave of Object.keys(fuori)) fuori[chiave].push(...(org[chiave] || []));
  });

  // I profili liberi vengono dopo, perche' si costruiscono su quello che le
  // organizzazioni hanno gia' creato: le loro competenze sono quelle vere di
  // aziende vere, non nomi inventati per l'occasione.
  const talenti = generaTalenti(perId);
  for (const chiave of Object.keys(talenti)) fuori[chiave].push(...talenti[chiave]);

  // Le certificazioni delle persone dentro le organizzazioni non avevano
  // bisogno di dire dove erano nate finche' nessuno usciva. Adesso serve.
  const orgDi = new Map(fuori.users.map((u) => [u.id, u.orgId ?? null]));
  for (const c of fuori.certifications) {
    if (c.orgId === undefined) c.orgId = orgDi.get(c.employeeId) ?? null;
  }
  for (const a of fuori.achievementInstances) {
    if (a.orgId === undefined) a.orgId = orgDi.get(a.userId) ?? null;
  }

  // Gli annunci stanno fuori dal giro delle chiavi perche' non nascono da
  // una singola organizzazione: sono una lista scritta a mano, come le
  // otto descrizioni da cui viene tutto il resto.
  fuori.annunci = annunciDemo();

  return fuori;
}
