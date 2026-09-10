/**
 * Catalogo delle competenze standard Achivia.
 *
 * Le soft skill qui elencate valgono per tutte le organizzazioni e nessun
 * manager puo' modificarle o cancellarle: sono il vocabolario comune su cui
 * si potranno poi confrontare persone e team fra aziende diverse. Le
 * competenze tecniche invece nascono vuote e le crea ogni organizzazione,
 * perche' "Salesforce" o "Figma" hanno senso solo dove si usano.
 *
 * Il catalogo e' dati, non codice: aggiungere una soft skill standard
 * significa aggiungere una riga qui.
 */

/** Le due famiglie in cui si divide una competenza. */
export const SKILL_TYPES = [
  { id: 'soft',      label: 'Soft skill',      descrizione: 'Come una persona lavora e sta con gli altri.' },
  { id: 'technical', label: 'Competenza tecnica', descrizione: 'Strumenti e discipline del mestiere.' },
];

/**
 * I quattro livelli di padronanza. L'id numerico serve a ordinarli e a
 * confrontarli ("almeno intermedio"); l'etichetta e' quella che si legge.
 */
export const SKILL_LEVELS = [
  { id: 1, key: 'beginner',     label: 'Beginner',     descrizione: 'Conosce le basi e lavora con supervisione.' },
  { id: 2, key: 'intermediate', label: 'Intermediate', descrizione: 'Lavora in autonomia sui casi ordinari.' },
  { id: 3, key: 'advanced',     label: 'Advanced',     descrizione: 'Gestisce casi complessi e guida gli altri.' },
  { id: 4, key: 'expert',       label: 'Expert',       descrizione: 'Riferimento riconosciuto, definisce il metodo.' },
];

export const livelloById = (id) => SKILL_LEVELS.find((l) => l.id === Number(id)) || null;

/**
 * Categorie in cui raggruppare le competenze nello Skill Tree. Le soft skill
 * standard sono gia' assegnate; le tecniche scelgono la loro alla creazione.
 * Il colore serve a distinguere i rami della mappa, non a dire "quanto vale".
 */
export const SKILL_CATEGORIES = [
  { id: 'relazione',   label: 'Relazione',    colore: '#2f91b2', descrizione: 'Stare con gli altri e farsi capire.' },
  { id: 'esecuzione',  label: 'Esecuzione',   colore: '#4fb9b0', descrizione: 'Portare a termine il lavoro.' },
  { id: 'pensiero',    label: 'Pensiero',     colore: '#6a52ad', descrizione: 'Capire, valutare, decidere.' },
  { id: 'guida',       label: 'Guida',        colore: '#c98a2e', descrizione: 'Prendersi la responsabilità e guidare.' },
  // Quattro rami del mestiere invece di uno. "Tecnica" era il ramo unico in
  // cui finiva tutto, e con quaranta competenze dentro non sarebbe piu'
  // stato un ramo: sarebbe stato un elenco. Adesso "Tecnica" e' l'officina —
  // il mestiere che si fa con le mani e con le macchine — e le altre tre
  // dividono quello che si fa con uno schermo, con un cliente e con dei
  // conti. Chi crea una competenza sua sceglie fra tutte.
  { id: 'digitale',    label: 'Digitale e dati', colore: '#3f6fd0', descrizione: 'Programmare, analizzare, automatizzare.' },
  { id: 'tecnica',     label: 'Tecnica',      colore: '#8d7bd6', descrizione: 'Officina, impianti, produzione.' },
  { id: 'commerciale', label: 'Commerciale',  colore: '#cf3f78', descrizione: 'Vendere, farsi trovare, tenersi i clienti.' },
  { id: 'amministrazione', label: 'Amministrazione', colore: '#6f9c3a', descrizione: 'Conti, contratti, adempimenti.' },
  { id: 'organizzazione',  label: 'Organizzazione',  colore: '#2fa06a', descrizione: 'Progetti, metodi, persone da scegliere.' },
  // Una lingua non e' "relazione": si studia, si certifica e si dimentica
  // come qualunque altra disciplina. Ha un ramo suo perche' in un annuncio
  // di lavoro e' una richiesta a se', mai un modo di lavorare.
  { id: 'lingue',      label: 'Lingue',       colore: '#a84fbe', descrizione: 'Lavorare in un’altra lingua.' },
  // Quattro mestieri che non stavano da nessuna parte. Sono lavoro come gli
  // altri — piu' di mezzo mercato sta qui dentro — e infilarli in "Tecnica"
  // avrebbe voluto dire chiamare officina una cucina.
  { id: 'cura',        label: 'Cura e salute', colore: '#d14a3f', descrizione: 'Prendersi cura delle persone.' },
  { id: 'creativa',    label: 'Creatività e media', colore: '#9b4fd6', descrizione: 'Immagini, testi, suono, racconto.' },
  { id: 'ospitalita',  label: 'Ospitalità',   colore: '#c94fa5', descrizione: 'Accogliere, servire, far stare bene.' },
  { id: 'ambiente',    label: 'Ambiente ed energia', colore: '#93a326', descrizione: 'Terra, risorse, impatto.' },
];

export const categoriaById = (id) => SKILL_CATEGORIES.find((c) => c.id === id) || null;

/**
 * Le soft skill standard. `isStandard` le rende immodificabili: la stessa
 * "Communication" deve voler dire la stessa cosa ovunque.
 *
 * `prerequisites` disegna il percorso: dice da dove di solito si arriva a
 * una competenza. Non e' uno sbarramento — ogni competenza si puo'
 * certificare quando la persona la merita, anche saltando i passaggi.
 */
export const SOFT_SKILLS_STANDARD = [
  {
    id: 'communication', name: 'Communication', categoria: 'relazione',
    description: 'Comunicare in modo chiaro, efficace e adeguato al contesto.',
    prerequisites: [],
  },
  {
    id: 'teamwork', name: 'Teamwork', categoria: 'relazione',
    description: 'Collaborare, condividere informazioni e contribuire agli obiettivi del team.',
    prerequisites: ['communication'],
  },
  {
    id: 'collaboration', name: 'Collaboration', categoria: 'relazione',
    description: 'Lavorare efficacemente con persone, funzioni e competenze differenti.',
    prerequisites: ['teamwork'],
  },
  {
    id: 'conflict-management', name: 'Conflict Management', categoria: 'relazione',
    description: 'Gestire disaccordi e conflitti in modo costruttivo.',
    prerequisites: ['communication', 'emotional-intelligence'],
  },
  {
    id: 'emotional-intelligence', name: 'Emotional Intelligence', categoria: 'relazione',
    description: 'Riconoscere e gestire le proprie emozioni e comprendere quelle degli altri.',
    prerequisites: [],
  },

  {
    id: 'time-management', name: 'Time Management', categoria: 'esecuzione',
    description: 'Organizzare attività, priorità e tempo in funzione degli obiettivi.',
    prerequisites: [],
  },
  {
    id: 'adaptability', name: 'Adaptability', categoria: 'esecuzione',
    description: 'Adattarsi a cambiamenti, nuovi contesti e nuove modalità di lavoro.',
    prerequisites: [],
  },
  {
    id: 'resilience', name: 'Resilience', categoria: 'esecuzione',
    description: 'Mantenere efficacia e continuità di performance davanti a difficoltà, errori o cambiamenti.',
    prerequisites: ['adaptability'],
  },
  {
    id: 'learning-agility', name: 'Learning Agility', categoria: 'esecuzione',
    description: 'Apprendere rapidamente, applicare ciò che si è imparato e adattarsi a nuove situazioni.',
    prerequisites: ['adaptability'],
  },

  {
    id: 'problem-solving', name: 'Problem Solving', categoria: 'pensiero',
    description: 'Analizzare problemi e individuare soluzioni efficaci.',
    prerequisites: [],
  },
  {
    id: 'critical-thinking', name: 'Critical Thinking', categoria: 'pensiero',
    description: 'Analizzare informazioni, valutare alternative e mettere in discussione le assunzioni.',
    prerequisites: ['problem-solving'],
  },
  {
    id: 'creativity', name: 'Creativity', categoria: 'pensiero',
    description: 'Generare idee e approcci nuovi e utili.',
    prerequisites: [],
  },
  {
    id: 'decision-making', name: 'Decision Making', categoria: 'pensiero',
    description: 'Decidere con efficacia anche con informazioni incomplete o sotto pressione.',
    prerequisites: ['critical-thinking'],
  },

  {
    id: 'ownership', name: 'Ownership', categoria: 'guida',
    description: 'Assumersi la responsabilità dei risultati e portare avanti il lavoro senza supervisione costante.',
    prerequisites: [],
  },
  {
    id: 'accountability', name: 'Accountability', categoria: 'guida',
    description: 'Rispondere delle proprie decisioni, azioni e risultati.',
    prerequisites: ['ownership'],
  },
  {
    id: 'leadership', name: 'Leadership', categoria: 'guida',
    description: 'Guidare, motivare e responsabilizzare altre persone.',
    prerequisites: ['communication', 'ownership'],
  },
].map((s) => ({
  ...s,
  type: 'soft',
  isStandard: true,
  hasLevels: true,      // ogni competenza cresce per gradi: quattro, sempre
  badgeImage: null,     // gli asset arrivano da src/assets/skills (vedi skillBadges.js)
  createdById: null,
  createdAt: null,
}));


/**
 * Le competenze del mestiere, standard come le soft skill.
 *
 * Sono nate altrove: erano l'elenco chiuso fra cui un'organizzazione sceglie
 * che cosa chiede in un annuncio di lavoro. Vivevano in un file loro, con
 * dei nomi loro, e non volevano dire niente per il resto dell'applicazione —
 * un'azienda poteva chiedere "Saldatura" in bacheca e certificare
 * "Saldatura" ai suoi, e le due parole restavano due parole diverse.
 *
 * Adesso sono le stesse. Un annuncio chiede quello che si puo' certificare,
 * l'osservatorio conta le due cose con lo stesso vocabolario, e chi ha la
 * medaglia di una competenza la ritrova scritta uguale negli annunci che la
 * chiedono.
 *
 * Sono cento, in tredici rami. Sono `technical` quasi tutte, perche' si
 * studiano: uno strumento, una disciplina, una lingua. Le tre che non lo
 * sono — negoziare, insegnare, organizzarsi — stanno nei rami di sempre,
 * accanto alle soft skill a cui somigliano.
 *
 * La medaglia la prendono dalle centoventi famiglie di
 * `assets/skills/custom/`, scelta guardando il disegno: il server col
 * lucchetto alla sicurezza informatica, la gru al cantiere, l'abaco alla
 * contabilita'. Dove due competenze sono davvero la stessa cosa fatta due
 * volte la medaglia e' la stessa — le otto lingue portano tutte le
 * bandiere, la linea automatica vale per il CNC e per il PLC — e dove non
 * lo sono e' diversa. Quarantadue disegni restano liberi: sono quelli fra
 * cui sceglie chi crea una competenza sua.
 *
 * I prerequisiti disegnano il percorso e non sbarrano niente, come per le
 * soft: si arriva all'analisi dei dati dai fogli di calcolo, alla macchina a
 * controllo numerico dal disegno tecnico, alla saldatura dalla sicurezza. Chi
 * e' gia' capace si fa certificare e basta.
 */
export const SKILLS_MESTIERE_STANDARD = [
  /* ── Digitale e dati ── */
  {
    id: 'fogli-calcolo', name: 'Excel e fogli di calcolo', categoria: 'digitale',
    type: 'technical', badgeImage: 'mestiere-68',
    description: 'Costruire e mantenere fogli di calcolo che reggono: formule, tabelle pivot, controlli sui dati.',
    prerequisites: [],
  },
  {
    id: 'analisi-dati', name: 'Analisi dei dati', categoria: 'digitale',
    type: 'technical', badgeImage: 'mestiere-25',
    description: 'Leggere dei dati e ricavarne una risposta, sapendo che cosa non dicono.',
    prerequisites: ['fogli-calcolo'],
  },
  {
    id: 'sql', name: 'SQL e basi di dati', categoria: 'digitale',
    type: 'technical', badgeImage: 'custom-08',
    description: 'Interrogare e organizzare basi di dati relazionali.',
    prerequisites: ['analisi-dati'],
  },
  {
    id: 'business-intelligence', name: 'Business intelligence e reportistica', categoria: 'digitale',
    type: 'technical', badgeImage: 'custom-04',
    description: 'Trasformare i dati in cruscotti e report che qualcun altro sa leggere da solo.',
    prerequisites: ['analisi-dati'],
  },
  {
    id: 'python', name: 'Python', categoria: 'digitale',
    type: 'technical', badgeImage: 'mestiere-26',
    description: 'Scrivere programmi in Python: automazioni, elaborazione di dati, servizi.',
    prerequisites: [],
  },
  {
    id: 'javascript', name: 'JavaScript', categoria: 'digitale',
    type: 'technical', badgeImage: 'mestiere-26',
    description: 'Programmare in JavaScript, dal browser al server.',
    prerequisites: [],
  },
  {
    id: 'sviluppo-web', name: 'Sviluppo web front-end', categoria: 'digitale',
    type: 'technical', badgeImage: 'mestiere-65',
    description: 'Costruire interfacce web che funzionano su schermi diversi e per chi non vede.',
    prerequisites: ['javascript'],
  },
  {
    id: 'sviluppo-backend', name: 'Sviluppo back-end e API', categoria: 'digitale',
    type: 'technical', badgeImage: 'custom-08',
    description: 'Costruire i servizi dietro un’applicazione: dati, regole, interfacce fra programmi.',
    prerequisites: ['sql'],
  },
  {
    id: 'cloud', name: 'Cloud (AWS, Azure, GCP)', categoria: 'digitale',
    type: 'technical', badgeImage: 'custom-09',
    description: 'Far vivere applicazioni su infrastrutture in cloud, e tenerne il conto.',
    prerequisites: ['sviluppo-backend'],
  },
  {
    id: 'cybersecurity', name: 'Sicurezza informatica', categoria: 'digitale',
    type: 'technical', badgeImage: 'mestiere-49',
    description: 'Proteggere sistemi e dati, e riconoscere un attacco quando sta succedendo.',
    prerequisites: [],
  },
  {
    id: 'intelligenza-artificiale', name: 'Intelligenza artificiale e machine learning', categoria: 'digitale',
    type: 'technical', badgeImage: 'mestiere-23',
    description: 'Addestrare e mettere in produzione modelli, sapendo quando non servono.',
    prerequisites: ['python', 'analisi-dati'],
  },
  {
    id: 'automazione', name: 'Automazione dei processi', categoria: 'digitale',
    type: 'technical', badgeImage: 'mestiere-40',
    description: 'Togliere il lavoro ripetitivo di mezzo, con gli strumenti che ci sono.',
    prerequisites: [],
  },
  {
    id: 'reti-sistemi', name: 'Reti e sistemi', categoria: 'digitale',
    type: 'technical', badgeImage: 'custom-18',
    description: 'Progettare e tenere in piedi reti, server e postazioni.',
    prerequisites: [],
  },
  {
    id: 'devops', name: 'DevOps e rilascio continuo', categoria: 'digitale',
    type: 'technical', badgeImage: 'custom-42',
    description: 'Portare il codice in produzione spesso e senza paura: build, prove, rilasci.',
    prerequisites: ['cloud'],
  },
  {
    id: 'mobile', name: 'Sviluppo per dispositivi mobili', categoria: 'digitale',
    type: 'technical', badgeImage: 'custom-13',
    description: 'Costruire applicazioni per telefono e tablet, dove lo schermo è piccolo e la rete non c’è sempre.',
    prerequisites: ['javascript'],
  },
  {
    id: 'ux-ui', name: 'Progettazione UX e UI', categoria: 'digitale',
    type: 'technical', badgeImage: 'custom-24',
    description: 'Disegnare come si usa una cosa prima di come è fatta, e provarlo su chi la userà.',
    prerequisites: [],
  },
  {
    id: 'gestione-prodotto', name: 'Gestione di prodotto digitale', categoria: 'digitale',
    type: 'technical', badgeImage: 'custom-37',
    description: 'Decidere che cosa si costruisce e che cosa no, e rispondere di quella scelta.',
    prerequisites: ['project-management'],
  },
  {
    id: 'blockchain', name: 'Blockchain e contratti intelligenti', categoria: 'digitale',
    type: 'technical', badgeImage: 'custom-06',
    description: 'Costruire su registri distribuiti, sapendo quando non servono.',
    prerequisites: ['sviluppo-backend'],
  },
  {
    id: 'gis', name: 'Sistemi informativi geografici', categoria: 'digitale',
    type: 'technical', badgeImage: 'mestiere-54',
    description: 'Mettere i dati su una mappa e leggerli nello spazio.',
    prerequisites: ['analisi-dati'],
  },
  {
    id: 'supporto-informatico', name: 'Supporto informatico agli utenti', categoria: 'digitale',
    type: 'technical', badgeImage: 'mestiere-12',
    description: 'Rimettere in piedi la postazione di chi lavora, e spiegargli che cosa era successo.',
    prerequisites: [],
  },

  /* ── Tecnica e produzione ── */
  {
    id: 'sicurezza-lavoro', name: 'Sicurezza sul lavoro', categoria: 'tecnica',
    type: 'technical', badgeImage: 'mestiere-02',
    description: 'Conoscere e far rispettare le regole che tengono le persone intere.',
    prerequisites: [],
  },
  {
    id: 'manutenzione-meccanica', name: 'Manutenzione meccanica', categoria: 'tecnica',
    type: 'technical', badgeImage: 'custom-12',
    description: 'Diagnosticare, riparare e mantenere macchine e impianti meccanici.',
    prerequisites: ['sicurezza-lavoro'],
  },
  {
    id: 'manutenzione-elettrica', name: 'Manutenzione elettrica ed elettronica', categoria: 'tecnica',
    type: 'technical', badgeImage: 'mestiere-04',
    description: 'Intervenire su quadri, impianti e schede elettroniche.',
    prerequisites: ['sicurezza-lavoro'],
  },
  {
    id: 'saldatura', name: 'Saldatura', categoria: 'tecnica',
    type: 'technical', badgeImage: 'mestiere-08',
    description: 'Saldare con i procedimenti richiesti dal materiale e dal pezzo.',
    prerequisites: ['sicurezza-lavoro'],
  },
  {
    id: 'cad', name: 'Disegno tecnico e CAD', categoria: 'tecnica',
    type: 'technical', badgeImage: 'mestiere-33',
    description: 'Leggere e disegnare tavole tecniche, in due o tre dimensioni.',
    prerequisites: [],
  },
  {
    id: 'cnc', name: 'Macchine a controllo numerico', categoria: 'tecnica',
    type: 'technical', badgeImage: 'custom-10',
    description: 'Attrezzare e condurre macchine CNC, dal programma al pezzo finito.',
    prerequisites: ['cad'],
  },
  {
    id: 'automazione-industriale', name: 'Automazione industriale e PLC', categoria: 'tecnica',
    type: 'technical', badgeImage: 'custom-10',
    description: 'Programmare e mettere a punto le linee: PLC, sensori, azionamenti.',
    prerequisites: ['manutenzione-elettrica'],
  },
  {
    id: 'robotica', name: 'Robotica industriale', categoria: 'tecnica',
    type: 'technical', badgeImage: 'mestiere-24',
    description: 'Installare, programmare e far lavorare robot di linea accanto alle persone.',
    prerequisites: ['automazione-industriale'],
  },
  {
    id: 'controllo-qualita', name: 'Controllo qualità', categoria: 'tecnica',
    type: 'technical', badgeImage: 'custom-36',
    description: 'Verificare che quello che esce sia quello che era stato chiesto, e dirlo con dei numeri.',
    prerequisites: [],
  },
  {
    id: 'logistica', name: 'Logistica e magazzino', categoria: 'tecnica',
    type: 'technical', badgeImage: 'mestiere-53',
    description: 'Far arrivare le cose dove servono quando servono, sapendo dove sono.',
    prerequisites: [],
  },
  {
    id: 'idraulica', name: 'Impianti idraulici e termoidraulici', categoria: 'tecnica',
    type: 'technical', badgeImage: 'mestiere-14',
    description: 'Montare e riparare impianti d’acqua e di riscaldamento.',
    prerequisites: ['sicurezza-lavoro'],
  },
  {
    id: 'refrigerazione', name: 'Impianti di refrigerazione e climatizzazione', categoria: 'tecnica',
    type: 'technical', badgeImage: 'mestiere-36',
    description: 'Installare e mantenere il freddo e il clima, con i gas e le regole che li governano.',
    prerequisites: ['manutenzione-elettrica'],
  },
  {
    id: 'edilizia', name: 'Costruzioni e cantiere', categoria: 'tecnica',
    type: 'technical', badgeImage: 'mestiere-57',
    description: 'Costruire: lettura del progetto, materiali, tempi e squadre in cantiere.',
    prerequisites: ['sicurezza-lavoro'],
  },
  {
    id: 'carpenteria', name: 'Carpenteria e falegnameria', categoria: 'tecnica',
    type: 'technical', badgeImage: 'mestiere-15',
    description: 'Lavorare legno e metallo su misura, dal pezzo unico alla serie corta.',
    prerequisites: ['sicurezza-lavoro'],
  },
  {
    id: 'lean-produzione', name: 'Lean e miglioramento continuo', categoria: 'tecnica',
    type: 'technical', badgeImage: 'custom-34',
    description: 'Togliere sprechi dal processo insieme a chi ci lavora dentro, non al posto suo.',
    prerequisites: ['controllo-qualita'],
  },
  {
    id: 'stampa-3d', name: 'Stampa 3D e prototipazione', categoria: 'tecnica',
    type: 'technical', badgeImage: 'custom-05',
    description: 'Passare dal disegno al pezzo in poche ore, e sapere quando non regge.',
    prerequisites: ['cad'],
  },

  /* ── Commerciale e clienti ── */
  {
    id: 'vendita', name: 'Vendita e sviluppo commerciale', categoria: 'commerciale',
    type: 'technical', badgeImage: 'custom-20',
    description: 'Trovare clienti, capire di che cosa hanno bisogno e chiudere.',
    prerequisites: [],
  },
  {
    id: 'gestione-clienti', name: 'Gestione clienti e key account', categoria: 'commerciale',
    type: 'technical', badgeImage: 'custom-47',
    description: 'Tenere e far crescere i clienti che ci sono già.',
    prerequisites: ['vendita'],
  },
  {
    id: 'assistenza-clienti', name: 'Assistenza clienti', categoria: 'commerciale',
    type: 'technical', badgeImage: 'custom-30',
    description: 'Rispondere a chi ha un problema e risolverlo, o dire con chiarezza che non si può.',
    prerequisites: [],
  },
  {
    id: 'marketing-digitale', name: 'Marketing digitale', categoria: 'commerciale',
    type: 'technical', badgeImage: 'mestiere-27',
    description: 'Farsi trovare e farsi scegliere sui canali digitali, misurando che cosa funziona.',
    prerequisites: [],
  },
  {
    id: 'social-content', name: 'Social media e contenuti', categoria: 'commerciale',
    type: 'technical', badgeImage: 'mestiere-39',
    description: 'Scrivere e pubblicare contenuti che qualcuno legge davvero.',
    prerequisites: ['marketing-digitale'],
  },
  {
    id: 'seo-sem', name: 'SEO e campagne a pagamento', categoria: 'commerciale',
    type: 'technical', badgeImage: 'custom-28',
    description: 'Posizionarsi sui motori di ricerca e comprare traffico senza buttare i soldi.',
    prerequisites: ['marketing-digitale'],
  },
  {
    id: 'retail', name: 'Vendita al dettaglio e punto vendita', categoria: 'commerciale',
    type: 'technical', badgeImage: 'custom-25',
    description: 'Far funzionare un negozio: assortimento, cassa, vetrina, persone in sala.',
    prerequisites: ['vendita'],
  },
  {
    id: 'e-commerce', name: 'E-commerce e marketplace', categoria: 'commerciale',
    type: 'technical', badgeImage: 'mestiere-52',
    description: 'Vendere online: catalogo, spedizioni, resi, recensioni.',
    prerequisites: ['marketing-digitale'],
  },
  {
    id: 'crm', name: 'CRM e gestione della pipeline', categoria: 'commerciale',
    type: 'technical', badgeImage: 'custom-48',
    description: 'Tenere in ordine trattative e contatti, e sapere sempre a che punto sono.',
    prerequisites: ['vendita'],
  },
  {
    id: 'ricerche-mercato', name: 'Ricerche di mercato', categoria: 'commerciale',
    type: 'technical', badgeImage: 'mestiere-11',
    description: 'Andare a vedere che cosa vuole chi compra, invece di immaginarlo.',
    prerequisites: ['analisi-dati'],
  },
  {
    id: 'comunicazione-istituzionale', name: 'Comunicazione e ufficio stampa', categoria: 'commerciale',
    type: 'technical', badgeImage: 'mestiere-31',
    description: 'Parlare a nome dell’organizzazione: comunicati, giornalisti, crisi.',
    prerequisites: [],
  },
  {
    id: 'export', name: 'Commercio estero ed export', categoria: 'commerciale',
    type: 'technical', badgeImage: 'mestiere-46',
    description: 'Vendere fuori dai confini: dogane, incoterm, pagamenti internazionali.',
    prerequisites: ['vendita'],
  },
  {
    id: 'negoziazione', name: 'Negoziazione', categoria: 'relazione',
    type: 'soft', badgeImage: 'custom-26',
    description: 'Trattare cercando un accordo che regga anche domani, non solo la firma di oggi.',
    prerequisites: ['communication'],
  },

  /* ── Amministrazione e finanza ── */
  {
    id: 'contabilita', name: 'Contabilità generale', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'mestiere-28',
    description: 'Tenere la contabilità e chiudere i conti nei tempi.',
    prerequisites: [],
  },
  {
    id: 'fatturazione', name: 'Fatturazione e ciclo attivo/passivo', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'mestiere-28',
    description: 'Gestire fatture, scadenze e incassi dall’inizio alla fine.',
    prerequisites: ['contabilita'],
  },
  {
    id: 'controllo-gestione', name: 'Controllo di gestione', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'custom-04',
    description: 'Costi, budget e scostamenti: dire dove i soldi stanno andando davvero.',
    prerequisites: ['contabilita'],
  },
  {
    id: 'paghe', name: 'Amministrazione del personale e paghe', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'custom-32',
    description: 'Contratti, presenze e buste paga, con le regole che cambiano ogni anno.',
    prerequisites: [],
  },
  {
    id: 'acquisti', name: 'Acquisti e gestione fornitori', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'mestiere-53',
    description: 'Scegliere fornitori, trattare condizioni e tenere il rapporto.',
    prerequisites: [],
  },
  {
    id: 'compliance', name: 'Normativa e adempimenti', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'mestiere-38',
    description: 'Sapere che cosa la legge chiede al proprio mestiere, e farlo per tempo.',
    prerequisites: [],
  },
  {
    id: 'fiscale', name: 'Fiscalità e dichiarazioni', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'mestiere-66',
    description: 'Imposte, dichiarazioni e scadenze fiscali, senza sorprese a giugno.',
    prerequisites: ['contabilita'],
  },
  {
    id: 'tesoreria', name: 'Tesoreria e gestione della liquidità', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'custom-38',
    description: 'Sapere quanti soldi ci sono, quando arrivano e quando servono.',
    prerequisites: ['contabilita'],
  },
  {
    id: 'analisi-finanziaria', name: 'Analisi finanziaria e investimenti', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'mestiere-25',
    description: 'Leggere un bilancio e dire se un investimento sta in piedi.',
    prerequisites: ['contabilita'],
  },
  {
    id: 'revisione', name: 'Revisione e audit interno', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'custom-36',
    description: 'Controllare che i conti e le procedure siano quello che dicono di essere.',
    prerequisites: ['contabilita'],
  },
  {
    id: 'appalti', name: 'Gare e appalti', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'mestiere-35',
    description: 'Preparare e seguire una gara: requisiti, offerta, tempi, ricorsi.',
    prerequisites: [],
  },
  {
    id: 'privacy-dati', name: 'Protezione dei dati personali', categoria: 'amministrazione',
    type: 'technical', badgeImage: 'custom-16',
    description: 'Trattare i dati delle persone come chiede la legge, e saper dire perché.',
    prerequisites: ['compliance'],
  },

  /* ── Persone e organizzazione ── */
  {
    id: 'project-management', name: 'Project management', categoria: 'organizzazione',
    type: 'technical', badgeImage: 'custom-35',
    description: 'Portare a termine un progetto con dei tempi, dei costi e delle persone che non sono tue.',
    prerequisites: [],
  },
  {
    id: 'metodi-agili', name: 'Metodi agili (Scrum, Kanban)', categoria: 'organizzazione',
    type: 'technical', badgeImage: 'mestiere-62',
    description: 'Lavorare a cicli corti, con il lavoro visibile e le priorità riviste spesso.',
    prerequisites: ['project-management'],
  },
  {
    id: 'selezione', name: 'Selezione del personale', categoria: 'organizzazione',
    type: 'technical', badgeImage: 'mestiere-47',
    description: 'Cercare, valutare e scegliere le persone da assumere.',
    prerequisites: [],
  },
  {
    id: 'gestione-cambiamento', name: 'Gestione del cambiamento', categoria: 'organizzazione',
    type: 'technical', badgeImage: 'mestiere-37',
    description: 'Portare un’organizzazione da come lavora oggi a come lavorerà, senza perderla per strada.',
    prerequisites: ['communication'],
  },
  {
    id: 'relazioni-sindacali', name: 'Relazioni sindacali', categoria: 'organizzazione',
    type: 'technical', badgeImage: 'custom-26',
    description: 'Tenere il rapporto con le rappresentanze: accordi, vertenze, contratti.',
    prerequisites: ['negoziazione'],
  },
  {
    id: 'valutazione-performance', name: 'Valutazione delle prestazioni', categoria: 'organizzazione',
    type: 'technical', badgeImage: 'custom-44',
    description: 'Dire a una persona come sta andando, con dei fatti e in tempo utile.',
    prerequisites: [],
  },
  {
    id: 'organizzazione-eventi', name: 'Organizzazione di eventi', categoria: 'organizzazione',
    type: 'technical', badgeImage: 'mestiere-31',
    description: 'Far succedere una cosa in un giorno solo: fornitori, spazi, persone, imprevisti.',
    prerequisites: ['pianificazione'],
  },
  {
    id: 'gestione-rischi', name: 'Gestione dei rischi', categoria: 'organizzazione',
    type: 'technical', badgeImage: 'mestiere-02',
    description: 'Vedere che cosa può andare storto prima che vada storto, e prepararsi.',
    prerequisites: [],
  },
  {
    id: 'segreteria', name: 'Segreteria e supporto operativo', categoria: 'organizzazione',
    type: 'technical', badgeImage: 'mestiere-21',
    description: 'Tenere in ordine agende, documenti e richieste di chi non ha tempo di farlo.',
    prerequisites: [],
  },

  /* ── Nei rami di sempre: si imparano stando con gli altri,
       non studiando uno strumento ── */
  {
    id: 'formazione', name: 'Formazione e affiancamento', categoria: 'guida',
    type: 'soft', badgeImage: 'mestiere-20',
    description: 'Insegnare quello che si sa a chi arriva, e restargli accanto finché serve.',
    prerequisites: ['communication'],
  },
  {
    id: 'pianificazione', name: 'Pianificazione e organizzazione', categoria: 'esecuzione',
    type: 'soft', badgeImage: 'custom-35',
    description: 'Mettere in ordine attività, risorse e scadenze prima che diventino un’emergenza.',
    prerequisites: ['time-management'],
  },

  /* ── Lingue. Quattordici, fra le piu' parlate al mondo. Una medaglia
       sola per tutte — le bandiere — perche' sono la stessa cosa fatta in
       un'altra lingua, e dare a ognuna un disegno diverso avrebbe detto
       che sono mestieri diversi.

       "Hindi" e non "indiano": in India si parlano centinaia di lingue e
       ventidue sono ufficiali. L'hindi e' la piu' parlata, ed e' quella che
       si scrive in un annuncio di lavoro; chiamarla "indiano" sarebbe come
       chiamare "svizzero" il tedesco ── */
  {
    id: 'inglese', name: 'Inglese', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in inglese: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'tedesco', name: 'Tedesco', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in tedesco: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'francese', name: 'Francese', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in francese: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'spagnolo', name: 'Spagnolo', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in spagnolo: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'portoghese', name: 'Portoghese', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in portoghese: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'arabo', name: 'Arabo', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in arabo: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'cinese', name: 'Cinese', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in cinese: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'russo', name: 'Russo', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in russo: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'italiano', name: 'Italiano', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in italiano: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'olandese', name: 'Olandese', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in olandese: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'hindi', name: 'Hindi', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in hindi: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'bengalese', name: 'Bengalese', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in bengalese: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'indonesiano', name: 'Indonesiano', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in indonesiano: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },
  {
    id: 'giapponese', name: 'Giapponese', categoria: 'lingue',
    type: 'technical', badgeImage: 'mestiere-32',
    description: 'Lavorare in giapponese: parlarlo, scriverlo e capirlo al telefono.',
    prerequisites: [],
  },

  /* ── Cura e salute ── */
  {
    id: 'assistenza-sanitaria', name: 'Assistenza sanitaria e infermieristica', categoria: 'cura',
    type: 'technical', badgeImage: 'mestiere-58',
    description: 'Assistere le persone malate: terapie, medicazioni, parametri, urgenze.',
    prerequisites: [],
  },
  {
    id: 'primo-soccorso', name: 'Primo soccorso', categoria: 'cura',
    type: 'technical', badgeImage: 'custom-31',
    description: 'Sapere che cosa fare nei primi minuti, prima che arrivi chi ne sa di più.',
    prerequisites: [],
  },
  {
    id: 'assistenza-persona', name: 'Assistenza alla persona', categoria: 'cura',
    type: 'technical', badgeImage: 'mestiere-70',
    description: 'Stare accanto a chi non è autonomo, nella cura di ogni giorno.',
    prerequisites: [],
  },
  {
    id: 'riabilitazione', name: 'Riabilitazione e fisioterapia', categoria: 'cura',
    type: 'technical', badgeImage: 'mestiere-55',
    description: 'Rimettere in movimento un corpo dopo un danno, un intervento, una malattia.',
    prerequisites: ['assistenza-sanitaria'],
  },
  {
    id: 'farmacia', name: 'Attività di farmacia', categoria: 'cura',
    type: 'technical', badgeImage: 'custom-33',
    description: 'Dispensare farmaci, consigliare, tenere il magazzino e le ricette in regola.',
    prerequisites: [],
  },
  {
    id: 'laboratorio-analisi', name: 'Analisi di laboratorio', categoria: 'cura',
    type: 'technical', badgeImage: 'mestiere-50',
    description: 'Preparare campioni ed eseguire analisi, sapendo che un errore qui non si vede più.',
    prerequisites: [],
  },

  /* ── Creatività e media ── */
  {
    id: 'grafica', name: 'Grafica e visual design', categoria: 'creativa',
    type: 'technical', badgeImage: 'custom-45',
    description: 'Dare forma visiva a un messaggio: marchi, impaginati, materiali.',
    prerequisites: [],
  },
  {
    id: 'fotografia', name: 'Fotografia', categoria: 'creativa',
    type: 'technical', badgeImage: 'mestiere-51',
    description: 'Fare fotografie che dicono quello che dovevano dire, e saperle sviluppare.',
    prerequisites: [],
  },
  {
    id: 'video', name: 'Ripresa e montaggio video', categoria: 'creativa',
    type: 'technical', badgeImage: 'mestiere-19',
    description: 'Girare e montare: luce, suono, ritmo, e la storia che deve restare.',
    prerequisites: ['fotografia'],
  },
  {
    id: 'scrittura', name: 'Scrittura e redazione testi', categoria: 'creativa',
    type: 'technical', badgeImage: 'mestiere-21',
    description: 'Scrivere testi che si leggono fino in fondo e si capiscono al primo colpo.',
    prerequisites: [],
  },
  {
    id: 'illustrazione', name: 'Illustrazione e arte digitale', categoria: 'creativa',
    type: 'technical', badgeImage: 'custom-46',
    description: 'Disegnare quello che una fotografia non può mostrare.',
    prerequisites: ['grafica'],
  },
  {
    id: 'musica-produzione', name: 'Produzione musicale', categoria: 'creativa',
    type: 'technical', badgeImage: 'mestiere-59',
    description: 'Registrare, arrangiare e mixare, dallo strumento al file finito.',
    prerequisites: [],
  },

  /* ── Ospitalità e servizi ── */
  {
    id: 'cucina', name: 'Cucina professionale', categoria: 'ospitalita',
    type: 'technical', badgeImage: 'mestiere-60',
    description: 'Cucinare in servizio: tempi, quantità, costanza e igiene.',
    prerequisites: ['sicurezza-lavoro'],
  },
  {
    id: 'panificazione', name: 'Panificazione e pasticceria', categoria: 'ospitalita',
    type: 'technical', badgeImage: 'mestiere-60',
    description: 'Impasti, lievitazioni e cotture: un mestiere che si misura in grammi e in ore.',
    prerequisites: ['sicurezza-lavoro'],
  },
  {
    id: 'sala-bar', name: 'Sala e bar', categoria: 'ospitalita',
    type: 'technical', badgeImage: 'mestiere-64',
    description: 'Servizio in sala e al banco: accoglienza, ritmo, conti che tornano.',
    prerequisites: [],
  },
  {
    id: 'accoglienza', name: 'Accoglienza e front office', categoria: 'ospitalita',
    type: 'technical', badgeImage: 'custom-30',
    description: 'Ricevere chi arriva: prenotazioni, informazioni, problemi risolti sul posto.',
    prerequisites: [],
  },
  {
    id: 'turismo', name: 'Organizzazione di viaggi e turismo', categoria: 'ospitalita',
    type: 'technical', badgeImage: 'mestiere-22',
    description: 'Costruire e vendere viaggi: itinerari, fornitori, imprevisti a mille chilometri.',
    prerequisites: [],
  },

  /* ── Ambiente ed energia ── */
  {
    id: 'agricoltura', name: 'Agricoltura e coltivazioni', categoria: 'ambiente',
    type: 'technical', badgeImage: 'mestiere-10',
    description: 'Coltivare: terreno, stagioni, macchine e quello che il tempo decide.',
    prerequisites: [],
  },
  {
    id: 'sostenibilita', name: 'Sostenibilità ambientale', categoria: 'ambiente',
    type: 'technical', badgeImage: 'mestiere-41',
    description: 'Misurare e ridurre l’impatto di quello che l’organizzazione fa davvero.',
    prerequisites: [],
  },
  {
    id: 'energie-rinnovabili', name: 'Energie rinnovabili', categoria: 'ambiente',
    type: 'technical', badgeImage: 'mestiere-13',
    description: 'Impianti solari ed eolici: dimensionamento, installazione, manutenzione.',
    prerequisites: ['manutenzione-elettrica'],
  },
].map((s) => ({
  ...s,
  isStandard: true,
  hasLevels: true,
  createdById: null,
  createdAt: null,
}));

/**
 * Il catalogo standard per intero: quello che ogni organizzazione trova gia'
 * pronto, senza aver creato niente. E' questo l'elenco a cui guardano lo
 * Skill Tree, l'osservatorio e la bacheca degli annunci — tre schermate che
 * prima leggevano tre elenchi diversi.
 */
export const SKILLS_STANDARD = [...SOFT_SKILLS_STANDARD, ...SKILLS_MESTIERE_STANDARD];

export const skillStandardById = (id) => SKILLS_STANDARD.find((s) => s.id === id) || null;

/**
 * Spunti per le competenze tecniche: non sono skill del catalogo, solo nomi
 * proposti nel modulo di creazione per far partire un'organizzazione senza
 * fissare il foglio bianco.
 *
 * Sono rimasti quelli che il catalogo non copre: proporre "SQL" o
 * "Accounting" adesso vorrebbe dire invitare a creare un doppione di una
 * competenza standard, e un doppione non si confronta con niente.
 */
export const TECHNICAL_SUGGESTIONS = [
  'Adobe Photoshop', 'Figma', 'Salesforce', 'HubSpot', 'Google Analytics',
  'Copywriting', 'Video Editing', 'Public Speaking', 'AutoCAD', 'SAP',
];

/**
 * Stati con cui una competenza si presenta a una persona. Nessuna e' mai
 * preclusa: o e' gia' riconosciuta, o si puo' ottenere.
 */
export const SKILL_STATES = {
  certified: { id: 'certified', label: 'Certificata', descrizione: 'Riconosciuta da un manager.' },
  available: { id: 'available', label: 'Da sviluppare', descrizione: 'Si può lavorare per ottenerla.' },
};
