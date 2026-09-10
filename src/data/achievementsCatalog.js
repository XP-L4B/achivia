/**
 * Le definizioni degli achievement: cosa si puo' ottenere, non chi l'ha
 * ottenuto. Le volte in cui una persona raggiunge un obiettivo sono le
 * istanze, e stanno nel database (src/data/db.js).
 *
 * Una definizione dichiara *quale* misura guarda (`metrica`) e *quanto* ne
 * serve (`target`). Il motore in src/data/achievements.js sa calcolare le
 * misure: aggiungere un achievement nuovo vuol dire aggiungere una voce qui
 * e, se la misura non c'e' ancora, una funzione la' — non riscrivere niente.
 *
 * Le medaglie non si disegnano: `badgeImage` tiene il nome del file che
 * arrivera' in src/assets/achievements/, e finche' non c'e' il componente
 * mostra un segnaposto che si vede essere tale.
 *
 * Le ricompense in crediti: uno solo le porta, "Go the Extra Mile"
 * (`ricompensabile: true`), e quanto vale lo decide l'admin — o un
 * co-admin — dell'organizzazione. Gli altri sono automatici: si prendono
 * facendo il proprio lavoro, e quel lavoro i suoi crediti li ha gia' dati
 * con le quest. Pagarli due volte sarebbe pagare due volte la stessa cosa;
 * l'unico che premia qualcosa che nessuna quest aveva chiesto e' appunto
 * quello che si assegna a mano.
 */

import { badgePerNome } from './skillBadges';

export const TIPO_AUTOMATICO = 'automatic';
export const TIPO_MANUALE = 'manual';

export const ACHIEVEMENTS = [
  {
    id: 'deadline-master',
    nome: 'Deadline Master',
    descrizione: 'Completa 20 quest consecutive entro la loro scadenza.',
    metrica: 'streak_in_tempo',
    target: 20,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'quest',
  },
  {
    id: 'immortal',
    nome: 'Immortal',
    descrizione: 'Sta 365 giorni di fila senza un\u2019assenza registrata.',
    metrica: 'presence_streak',
    target: 365,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    // La stessa medaglia della Presence Streak — l'orologio nella corona —
    // con addosso una maschera di smeraldo (vedi `ach-badge.is-smeraldo`).
    // Non un disegno nuovo: e' quel traguardo li', portato all'estremo.
    badgeImage: badgePerNome('custom-44-3'),
    mascheraSmeraldo: true,
    unita: 'giorni',
  },
  {
    id: 'closer',
    nome: 'Closer',
    descrizione: 'Completa 30 quest.',
    metrica: 'quest_completate',
    target: 30,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'quest',
  },
  {
    id: 'team-player',
    nome: 'Team Player',
    descrizione: 'Completa 10 quest o istanze di gruppo.',
    metrica: 'quest_gruppo',
    target: 10,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'quest di gruppo',
  },
  {
    id: 'helping-hand',
    nome: 'Helping Hand',
    descrizione: 'Aiuta 10 colleghi rispondendo alle richieste della bacheca.',
    metrica: 'aiuti_dati',
    target: 10,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'aiuti',
  },
  {
    id: 'skill-king',
    nome: 'Skill King',
    descrizione: 'Ricevi 10 competenze certificate o passaggi di livello.',
    metrica: 'passi_competenza',
    target: 10,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'certificazioni',
  },
  {
    id: 'outstanding',
    nome: 'Outstanding',
    descrizione: 'Accetta e completa 10 Side Quest.',
    metrica: 'side_quest',
    target: 10,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'side quest',
  },
  {
    id: 'skill-builder',
    nome: 'Skill Builder',
    descrizione: 'Sviluppa 5 competenze che non avevi.',
    metrica: 'competenze_nuove',
    target: 5,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'competenze',
  },
  /* I quattro che seguono guardano la stessa persona con l'occhio di chi
     la sta cercando da fuori, non di chi la gestisce da dentro. Non dicono
     "ha lavorato tanto" — quello lo dicono gia' gli altri — ma che forma ha
     quello che sa fare: se e' larga o profonda, se sa far crescere
     qualcuno, se ha tenuto nel tempo. Sono le domande di un'agenzia per il
     lavoro, ed e' per questo che esistono. */
  {
    id: 'versatile',
    nome: 'Versatile',
    descrizione: 'Ha competenze certificate in almeno 4 famiglie su 5.',
    metrica: 'famiglie_competenza',
    target: 4,
    tipo: TIPO_AUTOMATICO,
    // Non si ripete: le famiglie sono cinque, e oltre la quinta non c'e'
    // niente da contare una seconda volta.
    ripetibile: false,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'famiglie',
  },
  {
    id: 'specialista',
    nome: 'Specialista',
    descrizione: 'Ha portato almeno una competenza fino al livello Expert.',
    metrica: 'competenze_expert',
    target: 1,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'competenze',
  },
  {
    id: 'mentore',
    nome: 'Mentore',
    descrizione: 'Ha certificato competenze a 10 persone diverse.',
    metrica: 'persone_certificate',
    target: 10,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'persone',
  },
  {
    id: 'costante',
    nome: 'Costante',
    descrizione: 'Ha chiuso quest in 12 mesi diversi.',
    // Mesi, non quest: un totale alto puo' essere un mese solo di corsa.
    // Questo conta le volte in cui c'era, ed e' l'unica misura qui dentro
    // che un picco non sa comprare.
    metrica: 'mesi_con_quest',
    target: 12,
    tipo: TIPO_AUTOMATICO,
    ripetibile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'mesi',
  },
  {
    id: 'extra-mile',
    nome: 'Go the Extra Mile',
    descrizione: 'Ha fatto un lavoro ben oltre quanto chiedeva la quest.',
    // Nessuna misura: lo assegna il manager mentre verifica una quest
    // completata, con una motivazione scritta. Fuori da quel momento no.
    metrica: null,
    target: 1,
    tipo: TIPO_MANUALE,
    ripetibile: true,
    // L'unico con una ricompensa in crediti, e la cifra la mette l'admin.
    ricompensabile: true,
    creditiDefault: 0,
    badgeImage: null,
    unita: 'assegnazioni',
  },
];

export const achievementById = (id) => ACHIEVEMENTS.find((a) => a.id === id) || null;

export const ACHIEVEMENTS_AUTOMATICI = ACHIEVEMENTS.filter((a) => a.tipo === TIPO_AUTOMATICO);

/* Testi degli stati vuoti: stanno qui perche' sono parte della feature, non
   della singola pagina, e le pagine che li mostrano sono tre. */
export const VUOTO_PROFILO = {
  titolo: 'Il tuo percorso comincia qui.',
  testo: 'Completa quest, collabora con il team e sviluppa nuove competenze per sbloccare il primo achievement.',
};
export const VUOTO_RECENTI = 'Nessun achievement sbloccato per ora.';
