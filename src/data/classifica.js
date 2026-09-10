/**
 * La classifica fra organizzazioni: chi ci sta, con che numero si misura,
 * e come si assegnano le posizioni.
 *
 * ── Chi ci sta ──────────────────────────────────────────────────────────
 * Solo le organizzazioni con l'abbonamento premium. Non e' una scelta di
 * comodo: mettere in vetrina i numeri di chi non ha chiesto di starci
 * sarebbe pubblicare i suoi dati senza motivo.
 *
 * ── Con che numero ──────────────────────────────────────────────────────
 * Niente crediti, mai — ne' come punteggio ne' come cifra scritta: quanto
 * un'azienda paga i suoi non e' materia da classifica pubblica. Quello che
 * si confronta e' quanto lavoro si muove, con che puntualita', quanto ci si
 * aiuta, quanto si riconosce, quanto si e' presenti: le stesse misure che
 * l'organizzazione vede gia' nel proprio profilo.
 *
 * Le medaglie ripetibili sono quelle dei traguardi dell'organizzazione, e
 * qui si contano dai dati e non dalle istanze scritte: un'azienda ha le
 * medaglie che i suoi numeri dicono, che il suo admin abbia aperto l'app o
 * no.
 *
 * ── Le posizioni ────────────────────────────────────────────────────────
 * A parimerito si sale insieme: due prime sono due prime, e la posizione
 * dopo salta. Chi arriva primo, secondo o terzo prende la medaglia del
 * parametro nel suo metallo — oro, argento, bronzo; da li' in giu' la
 * stessa medaglia in metallo neutro dentro un anello inciso: TOP 25, TOP
 * 50, TOP 100, TOP 500.
 */

import {
  getUsers, getAchievementInstances, creditiPagatiDi, proprietarioOrg, orgPersonalizzata, orgPremium as premiumDellOrg,
} from './db';
import { MISURE_ORG, personeDi, questDi, nascitaOrg } from './organizzazione';

const GIORNO = 86400000;

/* ─── Che cosa conta, e che cosa no ──────────────────────────────────────

   Una classifica si falsifica facilmente: bastano cento quest da niente,
   scritte e approvate fra sé e sé, per scalare qualunque colonna. Quindi
   qui conta una quest sola: quella portata a termine che ha davvero pagato
   almeno dieci crediti a qualcuno.

   "Davvero" e' la parola: si guarda quello che e' uscito — la ricompensa
   divisa fra chi ci ha lavorato, senza la parte che sarebbe toccata a un
   admin, che non incassa mai. Una quest da mille crediti assegnata a se
   stessi paga zero, e non conta. */

const SOGLIA_CREDITI = 10;

const dentroDa = (v, da) => {
  if (da == null) return true;
  const t = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(t) && t >= da;
};

/**
 * I numeri di un'organizzazione dentro una stagione, calcolati una volta
 * sola: tutti i parametri si leggono da qui.
 */
export function baseDi(orgId, giorni) {
  const da = giorni ? Date.now() - giorni * GIORNO : null;

  const valide = questDi(orgId).filter(
    (q) => q.status === 'approvata'
      && dentroDa(q.approvedAt, da)
      && creditiPagatiDi(q) >= SOGLIA_CREDITI
  );
  const inTempo = valide.filter((q) => q.late !== true).length;
  const crediti = valide.reduce((somma, q) => somma + creditiPagatiDi(q), 0);
  const membri = MISURE_ORG.membri(orgId);

  // Anche i riconoscimenti passano dalla stessa porta: vale "Go the Extra
  // Mile" dato su una quest che ha pagato davvero, non quello appeso a una
  // quest di comodo.
  const suoi = new Set(personeDi(orgId).map((p) => p.id));
  const questValide = new Set(valide.map((q) => q.id));
  const extraMile = getAchievementInstances().filter(
    (i) => i.achievementId === 'extra-mile'
      && suoi.has(i.userId)
      && questValide.has(i.questId)
      && dentroDa(i.ottenutoIl, da)
  ).length;

  return {
    membri,
    valide: valide.length,
    inTempo,
    crediti,
    extraMile,
    // Sotto le cinquanta quest una percentuale dice piu' del caso che
    // dell'organizzazione: due consegne su due non sono il 100%.
    puntualita: valide.length >= 50 ? Math.round((inTempo / valide.length) * 100) : 0,
    perQuest: valide.length > 0 ? Math.round(crediti / valide.length) : 0,
    perMembro: membri > 0 ? Math.round(crediti / membri) : 0,
  };
}

/* ─── I parametri ────────────────────────────────────────────────────────*/

/**
 * Ogni parametro dice come si misura, come si scrive e con che medaglia si
 * premia. La famiglia e' quella del traguardo che parla della stessa cosa —
 * il cronometro per la puntualita', il salvadanaio per i crediti — cosi' la
 * medaglia della classifica e quella dell'organizzazione si riconoscono
 * come parenti.
 */
export const PARAMETRI = [
  {
    id: 'membri',
    nome: 'Membri',
    nota: 'Quante persone lavorano dentro l’organizzazione.',
    unita: 'persone',
    famiglia: 'custom-32',
    da: (b) => b.membri,
    formato: (v) => String(v),
  },
  {
    id: 'puntualita',
    nome: '% quest completate in tempo',
    nota: 'La percentuale di quest valide chiuse entro la scadenza. Si misura da cinquanta quest in su: sotto, una percentuale racconta il caso.',
    unita: '%',
    famiglia: 'custom-34',
    da: (b) => b.puntualita,
    formato: (v) => `${v}%`,
  },
  {
    id: 'completate',
    nome: 'Quest completate',
    nota: 'Quante quest hanno pagato davvero almeno dieci crediti a chi le ha portate a termine.',
    unita: 'quest',
    famiglia: 'custom-36',
    da: (b) => b.valide,
    formato: (v) => String(v),
  },
  {
    id: 'crediti-quest',
    nome: 'Crediti medi per quest',
    nota: 'Quanto vale, in media, una quest di questa organizzazione: i crediti usciti divisi per le quest che li hanno pagati.',
    unita: 'crediti',
    famiglia: 'custom-38',
    da: (b) => b.perQuest,
    formato: (v) => `◉ ${v}`,
  },
  {
    id: 'crediti-membro',
    nome: 'Crediti medi per membro',
    nota: 'Quanto e’ arrivato in media a ciascuno: i crediti usciti divisi per le persone dell’organizzazione.',
    unita: 'crediti',
    famiglia: 'custom-31',
    da: (b) => b.perMembro,
    formato: (v) => `◉ ${v}`,
  },
  {
    id: 'org-puntuali',
    nome: 'Consegne puntuali',
    nota: 'Una medaglia ogni cento quest valide consegnate entro la scadenza.',
    unita: 'medaglie',
    famiglia: 'custom-35',
    medaglia: true,
    da: (b) => Math.floor(b.inTempo / 100),
    formato: (v) => `×${v}`,
  },
  {
    id: 'org-extra-mile',
    nome: 'Extra Mile',
    nota: 'Una medaglia ogni venticinque riconoscimenti dati su quest che hanno pagato davvero.',
    unita: 'medaglie',
    famiglia: 'custom-21',
    medaglia: true,
    da: (b) => Math.floor(b.extraMile / 25),
    formato: (v) => `×${v}`,
  },
];

export const parametroById = (id) => PARAMETRI.find((p) => p.id === id) || PARAMETRI[0];

/* ─── I premi: podio e anelli ────────────────────────────────────────────*/

/** Le fasce sotto il podio. L'anello porta inciso il numero della fascia. */
export const FASCE = [
  { id: 'top25',  fino: 25,  nome: 'TOP 25',  colore: '#00bf63' },
  { id: 'top50',  fino: 50,  nome: 'TOP 50',  colore: '#5ec8e0' },
  { id: 'top100', fino: 100, nome: 'TOP 100', colore: '#c06cd8' },
  { id: 'top500', fino: 500, nome: 'TOP 500', colore: '#95999e' },
];

export const NOMI_PODIO = ['Oro', 'Argento', 'Bronzo'];

/**
 * Che premio spetta a una posizione.
 *
 * Le prime tre sono podio: la medaglia del parametro nel suo metallo.
 * Dalla quarta in giu' e' una fascia: la stessa medaglia in metallo neutro
 * dentro un anello inciso col numero. Oltre la cinquecentesima, niente.
 */
export function premioDi(posizione) {
  if (!posizione || posizione < 1) return null;
  if (posizione <= 3) {
    // Il metallo segue il podio: 1° oro (3), 2° argento (2), 3° bronzo (1).
    return { tipo: 'podio', posizione, metallo: 4 - posizione, nome: NOMI_PODIO[posizione - 1] };
  }
  const fascia = FASCE.find((f) => posizione <= f.fino);
  return fascia ? { tipo: 'fascia', posizione, fascia } : null;
}

/* ─── Chi partecipa ──────────────────────────────────────────────────────*/

/** L'admin proprietario di un'organizzazione: e' li' che stanno i suoi dati.
    Lo sa il deposito, che e' l'unico posto in cui questa domanda si fa. */
export const proprietarioDiOrg = proprietarioOrg;

/* Il premium e' dell'organizzazione, e sta scritto nel suo registro: era
   sul proprietario, e li' dava la risposta sbagliata appena uno ne
   possedeva due, una che paga e una no. */
export const orgPremium = (orgId) => premiumDellOrg(orgId);

/**
 * Le aziende con l'abbonamento: e' il perimetro della lega e
 * dell'osservatorio, ed e' lo stesso per tutte e due.
 *
 * Le organizzazioni personalizzate restano fuori, abbonate o no. Non e' una
 * dimenticanza ne' una punizione: un gruppo o un clan non sono un'azienda, e metterle in una classifica di aziende — o contarle
 * nei numeri che l'osservatorio vende come mercato del lavoro — vorrebbe
 * dire misurare due cose diverse con lo stesso metro. Quello che succede
 * dentro una personalizzata resta dentro la personalizzata.
 */
export function aziendePremium() {
  const viste = new Set();
  const fuori = [];
  for (const u of getUsers()) {
    if (!u.orgId || viste.has(u.orgId)) continue;
    viste.add(u.orgId);
    if (orgPremium(u.orgId) && !orgPersonalizzata(u.orgId)) fuori.push(u.orgId);
  }
  return fuori;
}

/* ─── I filtri ───────────────────────────────────────────────────────────*/

export const DIMENSIONI = [
  { id: 'tutte',  nome: 'Tutte',    min: 0,   max: Infinity },
  { id: 'piccole', nome: '1-9',     min: 1,   max: 9 },
  { id: 'medie',  nome: '10-49',    min: 10,  max: 49 },
  { id: 'grandi', nome: '50-199',   min: 50,  max: 199 },
  { id: 'enormi', nome: '200+',     min: 200, max: Infinity },
];

/**
 * Le stagioni della classifica. "Sempre" non c'e': in una lega, chi si e'
 * iscritto tre anni fa vincerebbe per anzianita' e non per come lavora, e
 * una classifica che non si puo' piu' rimontare smette di essere una gara.
 */
export const PERIODI = [
  { id: 'trimestre', nome: 'Ultimo trimestre', giorni: 90 },
  { id: 'semestre',  nome: 'Ultimo semestre', giorni: 180 },
  { id: 'anno',      nome: 'Ultimo anno', giorni: 365 },
];

/** La stagione con cui la pagina si apre: l'anno, la piu' larga delle tre. */
export const PERIODO_PREDEFINITO = 'anno';

export const giorniDi = (periodo) =>
  PERIODI.find((p) => p.id === periodo)?.giorni ?? PERIODI[PERIODI.length - 1].giorni;

export const ANZIANITA = [
  { id: 'tutte', nome: 'Tutte' },
  { id: 'nuove', nome: 'Nuove (< 1 anno)' },
  { id: 'consolidate', nome: 'Consolidate' },
];

/** Giorni entro cui un'organizzazione si considera viva. */
const GIORNI_ATTIVITA = 90;

/* ─── I dati di un'organizzazione ────────────────────────────────────────*/

/** Il ritratto di un'organizzazione per la classifica e per la sua scheda. */
export function schedaOrg(orgId, { giorni = giorniDi(PERIODO_PREDEFINITO) } = {}) {
  const proprietario = proprietarioDiOrg(orgId);
  const nascita = nascitaOrg(orgId);
  const anzianita = nascita ? Math.floor((Date.now() - nascita) / GIORNO) : 0;
  const ultimaChiusura = questDi(orgId)
    .filter((q) => q.status === 'approvata' && q.approvedAt)
    .reduce((max, q) => Math.max(max, new Date(q.approvedAt).getTime()), 0);

  // Un giro solo sui dati, e da quello escono tutti i parametri.
  const base = baseDi(orgId, giorni);

  return {
    orgId,
    nome: proprietario?.org || 'Organizzazione',
    tipo: proprietario?.orgTipo === 'personalizzata' ? 'personalizzata' : 'azienda',
    membri: base.membri,
    anzianita,
    attiva: ultimaChiusura > 0 && Date.now() - ultimaChiusura <= GIORNI_ATTIVITA * GIORNO,
    base,
    valori: Object.fromEntries(PARAMETRI.map((p) => [p.id, p.da(base)])),
  };
}

/* ─── La classifica ──────────────────────────────────────────────────────*/

/**
 * Le organizzazioni in ordine sul parametro scelto, gia' filtrate.
 *
 * Le posizioni si assegnano dopo i filtri: in una classifica per fascia di
 * dimensione, "primo" vuol dire primo fra i suoi pari, ed e' esattamente
 * quello che la fascia serve a ottenere. A parimerito si condivide la
 * posizione — e quindi la medaglia — e la posizione successiva salta.
 */
/**
 * Le schede di tutte le premium, calcolate una volta sola.
 *
 * Ogni scheda costa un giro sui dati dell'organizzazione, e la pagina ne
 * chiede otto classifiche di fila: senza questa sosta si rifarebbe lo
 * stesso conto sessantaquattro volte.
 */
export const schedeOrg = ({ giorni = giorniDi(PERIODO_PREDEFINITO) } = {}) =>
  aziendePremium().map((orgId) => schedaOrg(orgId, { giorni }));

export function classifica({
  parametro = PARAMETRI[0].id,
  dimensione = 'tutte',
  periodo = PERIODO_PREDEFINITO,
  anzianita = 'tutte',
  soloAttive = false,
  schede = null,
} = {}) {
  const par = parametroById(parametro);
  const giorni = giorniDi(periodo);
  const taglia = DIMENSIONI.find((d) => d.id === dimensione) || DIMENSIONI[0];

  const righe = (schede ?? schedeOrg({ giorni }))
    .filter((o) => o.membri >= taglia.min && o.membri <= taglia.max)
    .filter((o) => {
      if (anzianita === 'nuove') return o.anzianita < 365;
      if (anzianita === 'consolidate') return o.anzianita >= 365;
      return true;
    })
    .filter((o) => (soloAttive ? o.attiva : true))
    .map((o) => ({ ...o, valore: o.valori[par.id] }))
    .sort((a, b) => b.valore - a.valore || a.nome.localeCompare(b.nome));

  let posizione = 0;
  let precedente = null;
  return righe.map((riga, indice) => {
    if (precedente === null || riga.valore !== precedente) posizione = indice + 1;
    precedente = riga.valore;
    return { ...riga, posizione, premio: premioDi(posizione), parametro: par };
  });
}

/** Dove sta un'organizzazione su ogni parametro: e' la sua scheda pubblica. */
export function posizioniDi(orgId, filtri = {}) {
  const giorni = giorniDi(filtri.periodo || PERIODO_PREDEFINITO);
  const schede = schedeOrg({ giorni });
  return PARAMETRI.map((par) => {
    const righe = classifica({ ...filtri, parametro: par.id, schede });
    const mia = righe.find((r) => r.orgId === orgId);
    return {
      parametro: par,
      valore: mia?.valore ?? 0,
      posizione: mia?.posizione ?? null,
      premio: mia?.premio ?? null,
      su: righe.length,
    };
  });
}
