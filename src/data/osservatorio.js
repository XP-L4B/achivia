/**
 * L'osservatorio: il mercato delle competenze visto da sopra.
 *
 * Achivia sa una cosa che quasi nessuno sa. Non che cosa le aziende
 * *dichiarano* di cercare — quello lo dicono gli annunci di lavoro, ed e'
 * un desiderio — ma che cosa hanno davvero certificato, a chi, e quando.
 * Una certificazione e' un fatto, con una data e un nome sopra. Da qui si
 * guardano quei fatti tutti insieme.
 *
 * Tre regole, e non sono dettagli: sono il prodotto.
 *
 *   Solo le premium.  Chi non paga non finisce nei dati che si vendono. Il
 *                     perimetro e' lo stesso della lega.
 *
 *   Mai una sola.     Nessun numero qui dentro puo' essere ricondotto a
 *                     un'azienda. Ogni riga si porta dietro da quante
 *                     organizzazioni e da quante persone e' fatta, e sotto
 *                     le soglie non esce un numero piu' piccolo: non esce
 *                     niente. Vale anche per i filtri — chi stringe il
 *                     perimetro finche' resta una sola azienda non ottiene
 *                     i suoi dati, ottiene il silenzio.
 *
 *   Sempre due tempi. Un numero da solo non dice se sale o scende. Ogni
 *                     misura si accompagna alla stessa misura nel periodo
 *                     precedente di pari durata: la variazione e' quella.
 *
 * Il vocabolario. Una lingua sola: il catalogo standard, e nient'altro.
 * Le competenze che un'organizzazione si crea in casa restano in casa —
 * sul profilo di chi le ha ottenute, dentro l'azienda che se le e' fatte —
 * e da qui non passano. Confrontare fra loro parole che ognuno scrive come
 * vuole non e' misurare il mercato: e' misurare come ogni azienda chiama le
 * cose, che e' il dato che l'osservatorio non deve vendere.
 */

import {
  getUsers, getCertifications, getCarriera, getDipartimenti,
} from './db';
import { SKILLS_STANDARD, SKILL_CATEGORIES, SKILL_LEVELS } from './skillsCatalog';
import { aziendePremium, schedaOrg, DIMENSIONI, ANZIANITA } from './classifica';
import { ruoliDi, gestisce } from './permessi';

const GIORNO = 86400000;

/* ─── Il tempo ───────────────────────────────────────────────────────────*/

export const PERIODI = [
  { id: 'mese',      nome: 'Ultimo mese',     giorni: 30 },
  { id: 'trimestre', nome: 'Ultimo trimestre', giorni: 90 },
  { id: 'semestre',  nome: 'Ultimo semestre',  giorni: 180 },
  { id: 'anno',      nome: 'Ultimo anno',      giorni: 365 },
  { id: 'biennio',   nome: 'Ultimi due anni',  giorni: 730 },
];

export const PERIODO_PREDEFINITO = 'anno';

export const giorniDi = (id) => (PERIODI.find((p) => p.id === id) || PERIODI[3]).giorni;

/**
 * Le due finestre di un periodo: quella in corso e quella prima, lunghe
 * uguali. Confrontare l'ultimo trimestre con l'anno intero direbbe soltanto
 * che un anno e' piu' lungo di tre mesi.
 */
export function finestre(giorni, adesso = Date.now()) {
  return {
    ora: { da: adesso - giorni * GIORNO, a: adesso },
    prima: { da: adesso - 2 * giorni * GIORNO, a: adesso - giorni * GIORNO },
  };
}

const dentro = (quando, { da, a }) => {
  if (!quando) return false;
  const t = new Date(quando).getTime();
  return t >= da && t < a;
};

/* ─── Chi entra nei conti ────────────────────────────────────────────────*/

/* Quante organizzazioni e quante persone servono perche' un numero possa
   uscire. Sono le soglie sotto cui un dato "aggregato" smette di esserlo:
   con due aziende, chi ne conosce una ricava l'altra per differenza.
   Andranno alzate quando le organizzazioni saranno tante — cinque e
   cinquanta sono i valori a cui si arriva di solito — ma il posto e'
   questo, ed e' uno solo. */
export const SOGLIA_ORG = 3;
export const SOGLIA_PERSONE = 10;

export const diffondibile = (organizzazioni, persone) =>
  organizzazioni >= SOGLIA_ORG && persone >= SOGLIA_PERSONE;

export const FILTRI_VUOTI = { dimensione: 'tutte', anzianita: 'tutte' };

/**
 * Le organizzazioni che rientrano nel perimetro: aziende con l'abbonamento,
 * e che passano i filtri. Torna gli id, perche' e' su quelli che tutto il
 * resto lavora.
 *
 * Il filtro per tipo non c'e' piu' perche' di tipi ne e' rimasto uno.
 * Un'organizzazione personalizzata — un gruppo, un clan — non produce dati
 * di mercato: le sue competenze se le e' inventate lei per se
 * stessa, i suoi achievement pure, e quando qualcuno esce non ne resta
 * niente. Contarle qui dentro avrebbe voluto dire vendere come "mercato del
 * lavoro" anche i compiti di una famiglia.
 */
export function perimetro({ dimensione = 'tutte', anzianita = 'tutte' } = {}) {
  const fascia = DIMENSIONI.find((d) => d.id === dimensione) || DIMENSIONI[0];
  const eta = ANZIANITA.find((a) => a.id === anzianita) || ANZIANITA[0];
  return aziendePremium().filter((orgId) => {
    const scheda = schedaOrg(orgId);
    if (scheda.membri < fascia.min || scheda.membri > fascia.max) return false;
    if (eta.min !== undefined && scheda.anzianita < eta.min) return false;
    if (eta.max !== undefined && scheda.anzianita > eta.max) return false;
    return true;
  });
}

/** Le persone del perimetro, l'admin compreso: e' gente che lavora anche lui. */
export function personeDi(orgIds) {
  const dentroIl = new Set(orgIds);
  return getUsers().filter((u) => u.orgId && dentroIl.has(u.orgId));
}

/* ─── Il vocabolario ─────────────────────────────────────────────────────*/

/**
 * Il dizionario delle competenze che l'osservatorio misura: solo quelle del
 * catalogo standard, presenti e future.
 *
 * Fino a ieri qui entravano anche le competenze che un'azienda si crea da
 * sola, unite per nome: due organizzazioni che scrivevano "Saldatura TIG"
 * diventavano una voce sola, e quella voce era un fatto di mercato. L'idea
 * reggeva finche' i nomi si somigliavano, e non si somigliano: "Saldatura
 * TIG", "saldatura tig avanzata", "TIG" e "Saldature speciali" sono quattro
 * voci diverse per la stessa cosa, e nessuna normalizzazione le mette
 * insieme senza inventarsi che siano uguali. Il risultato era un
 * vocabolario che sembrava misurare il mercato e misurava come ogni azienda
 * chiama le cose in casa propria — che e' esattamente il dato che
 * l'osservatorio non deve vendere.
 *
 * Il catalogo standard invece e' una lingua sola, scritta una volta: se una
 * competenza conta abbastanza da essere misurata, entra li' dentro e da
 * quel giorno la misurano tutti allo stesso modo. Le competenze di casa
 * restano dove servono — dentro l'organizzazione che se le e' create, sul
 * profilo di chi le ha ottenute — e da qui non passano.
 *
 * `orgIds` non serve piu' a niente e resta nella firma perche' la chiamano
 * in sei punti: il perimetro decideva quali vocabolari privati entrassero,
 * e adesso il vocabolario e' uno solo per tutti.
 */
export function vocabolario() {
  const voci = new Map();
  const perId = new Map();

  for (const s of SKILLS_STANDARD) {
    const voce = {
      // Il tipo lo dice la competenza: le standard non sono piu' tutte
      // soft, e scriverlo a mano avrebbe fatto passare quaranta competenze
      // del mestiere per soft skill in ogni tavola dell'osservatorio.
      chiave: s.id, nome: s.name, tipo: s.type, categoria: s.categoria,
    };
    voci.set(voce.chiave, voce);
    perId.set(s.id, voce);
  }

  return { voci, perId };
}

/* ─── Le competenze ──────────────────────────────────────────────────────*/

const media = (numeri) => (numeri.length ? numeri.reduce((s, n) => s + n, 0) / numeri.length : 0);
const variazione = (ora, prima) => (prima > 0 ? Math.round(((ora - prima) / prima) * 100) : null);

/**
 * Quali competenze si certificano, quante volte, in quante organizzazioni,
 * a che livello, e se stanno salendo o scendendo.
 *
 * E' la tavola centrale dell'osservatorio: da qui escono "le piu'
 * certificate", "quelle in aumento", "quelle che nessuno certifica piu'".
 */
export function competenze({ giorni, ...filtri } = {}) {
  const orgIds = perimetro(filtri);
  const { perId } = vocabolario();
  const persone = new Map(personeDi(orgIds).map((u) => [u.id, u]));
  const { ora, prima } = finestre(giorni);

  const righe = new Map();
  const prendi = (voce) => {
    if (!righe.has(voce.chiave)) {
      righe.set(voce.chiave, {
        chiave: voce.chiave, nome: voce.nome, tipo: voce.tipo, categoria: voce.categoria,
        // La prima volta che questa competenza e' stata certificata dentro
        // il perimetro. Non e' la data in cui e' nata la parola — quella la
        // decide il catalogo, e le parole del catalogo esistono da prima —
        // ma la data in cui il mercato ha cominciato a usarla, che e' la
        // sola comparsa che si possa misurare.
        prima: null,
        certificazioni: 0, precedenti: 0, livelli: [],
        organizzazioni: new Set(), persone: new Set(),
      });
    }
    return righe.get(voce.chiave);
  };

  for (const c of getCertifications()) {
    const persona = persone.get(c.employeeId);
    if (!persona) continue;
    const voce = perId.get(c.skillId);
    if (!voce) continue;
    const riga = prendi(voce);
    if (c.certifiedAt && (!riga.prima || c.certifiedAt < riga.prima)) riga.prima = c.certifiedAt;
    if (dentro(c.certifiedAt, ora)) {
      riga.certificazioni += 1;
      riga.livelli.push(Number(c.level) || 1);
      riga.organizzazioni.add(persona.orgId);
      riga.persone.add(persona.id);
    } else if (dentro(c.certifiedAt, prima)) {
      riga.precedenti += 1;
    }
  }

  return [...righe.values()]
    .map((r) => ({
      chiave: r.chiave,
      nome: r.nome,
      tipo: r.tipo,
      categoria: r.categoria,
      prima: r.prima,
      certificazioni: r.certificazioni,
      precedenti: r.precedenti,
      variazione: variazione(r.certificazioni, r.precedenti),
      livelloMedio: Number(media(r.livelli).toFixed(2)),
      organizzazioni: r.organizzazioni.size,
      persone: r.persone.size,
      diffuso: diffondibile(r.organizzazioni.size, r.persone.size),
    }))
    .filter((r) => r.certificazioni > 0 || r.precedenti > 0)
    .sort((a, b) => b.certificazioni - a.certificazioni);
}

/**
 * Le competenze comparse nel periodo: parole che sul mercato prima non si
 * certificavano.
 *
 * "Comparsa" e' cambiata di significato, e in meglio. Prima era la data in
 * cui un'azienda si era creata quella competenza: una tavola che misurava
 * quando qualcuno aveva scritto una parola nel proprio catalogo, non quando
 * il mercato aveva cominciato a usarla. Adesso e' la prima certificazione
 * dentro il perimetro — il momento in cui una competenza del catalogo
 * standard smette di essere una voce in elenco e diventa qualcosa che
 * qualcuno riconosce a qualcun altro.
 *
 * Si ordinano per quante organizzazioni le hanno adottate, non per quante
 * volte sono state certificate: una parola nuova che in sei mesi e'
 * arrivata in otto aziende dice di piu' di una che in una sola azienda ha
 * fatto cento certificazioni.
 */
export function emergenti({ giorni, ...filtri } = {}) {
  const { ora } = finestre(giorni);
  return competenze({ giorni, ...filtri })
    .filter((r) => dentro(r.prima, ora))
    .map((r) => ({
      chiave: r.chiave,
      nome: r.nome,
      categoria: r.categoria,
      tipo: r.tipo,
      prima: r.prima,
      certificazioni: r.certificazioni,
      organizzazioni: r.organizzazioni,
      persone: r.persone,
      diffuso: r.diffuso,
    }))
    .sort((a, b) => b.organizzazioni - a.organizzazioni || b.certificazioni - a.certificazioni);
}

/** Come si distribuisce il lavoro di certificazione fra le cinque famiglie. */
export function categorie({ giorni, ...filtri } = {}) {
  const righe = competenze({ giorni, ...filtri });
  return SKILL_CATEGORIES.map((cat) => {
    const sue = righe.filter((r) => r.categoria === cat.id);
    const certificazioni = sue.reduce((s, r) => s + r.certificazioni, 0);
    const precedenti = sue.reduce((s, r) => s + r.precedenti, 0);
    const organizzazioni = new Set();
    let persone = 0;
    for (const r of sue) { persone += r.persone; if (r.organizzazioni) organizzazioni.add(r.chiave); }
    const quanteOrg = Math.max(...sue.map((r) => r.organizzazioni), 0);
    return {
      chiave: cat.id,
      nome: cat.label,
      colore: cat.colore,
      certificazioni,
      precedenti,
      variazione: variazione(certificazioni, precedenti),
      competenzeDistinte: sue.filter((r) => r.certificazioni > 0).length,
      organizzazioni: quanteOrg,
      persone,
      diffuso: diffondibile(quanteOrg, persone),
    };
  }).sort((a, b) => b.certificazioni - a.certificazioni);
}

/* ─── La mobilita' ───────────────────────────────────────────────────────*/

/**
 * Chi entra, chi viene promosso, chi cambia reparto.
 *
 * Il registro che alimenta questa tavola non serviva a nessuna schermata
 * dell'app: un profilo mostra il ruolo di adesso. E' stato aggiunto per
 * qui, perche' un movimento che nessuno scrive quando succede non si
 * ricostruisce piu' dopo.
 *
 * Le uscite si contano da quando esiste un modo di uscire: cambiare
 * organizzazione, o vedersi cancellare l'account da chi la amministra. Sono
 * la stessa cosa per questi conti — da fuori, chi se ne va e chi viene
 * mandato via lasciano lo stesso buco — e l'applicazione non sa dire quale
 * dei due sia stato, quindi non lo dice.
 *
 * E avendo tutte e due le direzioni si puo' finalmente scrivere il saldo,
 * che e' la riga per cui un'agenzia per il lavoro guarda questa tavola:
 * non quanta gente si muove, ma da che parte.
 */
export function mobilita({ giorni, ...filtri } = {}) {
  const orgIds = perimetro(filtri);
  const dentroIl = new Set(orgIds);
  const persone = personeDi(orgIds);
  const { ora, prima } = finestre(giorni);

  const conta = (tipo, finestra) => getCarriera()
    .filter((e) => dentroIl.has(e.orgId) && e.tipo === tipo && dentro(e.il, finestra)).length;

  const ogniCento = (n) => (persone.length ? Number(((n / persone.length) * 100).toFixed(1)) : 0);

  const voci = [
    { chiave: 'ingresso', nome: 'Ingressi', nota: 'Persone entrate in un’organizzazione.' },
    { chiave: 'ruolo', nome: 'Promozioni', nota: 'Chi e’ passato a un ruolo che guida.' },
    { chiave: 'reparto', nome: 'Cambi di reparto', nota: 'Mobilità interna, senza cambiare azienda.' },
    { chiave: 'uscita', nome: 'Uscite', nota: 'Chi ha lasciato un’organizzazione o ne è stato tolto.' },
  ].map((v) => {
    const adesso = conta(v.chiave, ora);
    const prec = conta(v.chiave, prima);
    return {
      ...v,
      quanti: adesso,
      precedenti: prec,
      variazione: variazione(adesso, prec),
      // Ogni cento persone del perimetro.
      ogniCento: ogniCento(adesso),
    };
  });

  /* Il saldo: quanta gente e' entrata in piu' di quanta ne e' uscita. E' la
     riga che le altre quattro servivano a poter scrivere — il ricambio vero,
     che finche' mancavano le uscite non si poteva misurare.

     Non ha una variazione percentuale, e non e' una dimenticanza: e' un
     numero con il segno che puo' attraversare lo zero, e la percentuale fra
     due numeri cosi' non vuol dire niente. Da meno cinque a piu' tre e'
     "piu' centosessanta per cento", che e' vero in aritmetica e falso in
     italiano. Il periodo precedente c'e' e si legge da solo: e' quello il
     confronto. */
  const entrati = voci.find((v) => v.chiave === 'ingresso');
  const usciti = voci.find((v) => v.chiave === 'uscita');
  const saldo = entrati.quanti - usciti.quanti;
  const saldoPrima = entrati.precedenti - usciti.precedenti;
  voci.push({
    chiave: 'saldo',
    nome: 'Saldo netto',
    nota: 'Ingressi meno uscite: quanto cresce o cala la popolazione del perimetro.',
    conSegno: true,
    quanti: saldo,
    precedenti: saldoPrima,
    variazione: null,
    ogniCento: ogniCento(saldo),
  });

  const organizzazioni = new Set(
    getCarriera().filter((e) => dentroIl.has(e.orgId) && dentro(e.il, ora)).map((e) => e.orgId)
  ).size;

  return {
    voci,
    organizzazioni,
    persone: persone.length,
    diffuso: diffondibile(organizzazioni, persone.length),
  };
}

/* ─── La struttura ───────────────────────────────────────────────────────*/

/**
 * Come sono fatte dentro le organizzazioni: quanto sono grandi, quanta
 * gente guida, quanti reparti si danno, quanti ruoli si inventano oltre ai
 * due che l'app fornisce. Quest'ultimo e' il numero piu' interessante per
 * chi studia il lavoro: un ruolo su misura e' un mestiere che nasce e che
 * non aveva ancora un nome.
 */
export function struttura(filtri = {}) {
  const orgIds = perimetro(filtri);
  const persone = personeDi(orgIds);
  const reparti = getDipartimenti();

  const perOrg = orgIds.map((orgId) => {
    const sue = persone.filter((u) => u.orgId === orgId);
    const guida = sue.filter((u) => u.role !== 'admin' && gestisce(u)).length;
    const suMisura = ruoliDi(orgId).filter((r) => !r.preimpostato).length;
    return {
      membri: sue.length,
      quotaGuida: sue.length ? (guida / sue.length) * 100 : 0,
      reparti: reparti.filter((d) => d.orgId === orgId).length,
      ruoliSuMisura: suMisura,
    };
  });

  const voci = [
    { chiave: 'membri', nome: 'Persone per organizzazione', valore: Math.round(media(perOrg.map((o) => o.membri))) },
    { chiave: 'guida', nome: 'Quota di chi guida', valore: Number(media(perOrg.map((o) => o.quotaGuida)).toFixed(1)), unita: '%' },
    { chiave: 'reparti', nome: 'Reparti per organizzazione', valore: Number(media(perOrg.map((o) => o.reparti)).toFixed(1)) },
    { chiave: 'ruoli', nome: 'Ruoli su misura creati', valore: Number(media(perOrg.map((o) => o.ruoliSuMisura)).toFixed(1)) },
  ];

  return {
    voci,
    organizzazioni: orgIds.length,
    persone: persone.length,
    diffuso: diffondibile(orgIds.length, persone.length),
  };
}

/* ─── Il colpo d'occhio ──────────────────────────────────────────────────*/

export function riepilogo({ giorni, ...filtri } = {}) {
  const orgIds = perimetro(filtri);
  const persone = personeDi(orgIds);
  const righe = competenze({ giorni, ...filtri });
  const certificazioni = righe.reduce((s, r) => s + r.certificazioni, 0);
  const precedenti = righe.reduce((s, r) => s + r.precedenti, 0);

  return {
    organizzazioni: orgIds.length,
    persone: persone.length,
    competenzeDistinte: righe.filter((r) => r.certificazioni > 0).length,
    certificazioni,
    variazione: variazione(certificazioni, precedenti),
    diffuso: diffondibile(orgIds.length, persone.length),
  };
}

/* ─── Il dettaglio di una competenza ─────────────────────────────────────*/

/**
 * Tutto quello che si puo' dire di una competenza sola.
 *
 * La tavola delle competenze risponde a "quanto" e "dove va". Questa
 * risponde alle domande che vengono dopo, e sono quelle che un'universita'
 * o un'agenzia per il lavoro fa davvero:
 *
 *   A che profondita'?   Cento certificazioni tutte da principiante e cento
 *                        con dentro venti esperti sono due mercati diversi.
 *                        La distribuzione dei livelli lo dice, la media no.
 *   Quanto e' diffusa?   Quante persone del perimetro la tengono, e quanto
 *                        e' concentrata: una competenza per cui una sola
 *                        azienda fa il novanta per cento delle
 *                        certificazioni non e' una tendenza di mercato, e'
 *                        il progetto di quell'azienda.
 *   Dove attecchisce?    Nelle grandi o nelle piccole, nelle aziende o
 *                        nelle personalizzate. Una competenza che parte dalle
 *                        piccole e sale e' un segnale precoce.
 *   Chi la certifica?    Chi guida o chi esegue, e in quanti reparti
 *                        diversi. Una competenza che sta in un reparto solo
 *                        e' una specializzazione, una che sta in cinque e'
 *                        diventata un requisito di base.
 *   Con che cosa viene?  Le competenze che le stesse persone tengono
 *                        insieme a questa. E' la domanda piu' utile per chi
 *                        progetta un corso: nessuno assume una competenza
 *                        sola.
 *   Con che curva?       Il mese per mese, non una percentuale sola. Una
 *                        crescita costante e un picco in un mese fanno la
 *                        stessa variazione e vogliono dire il contrario.
 *
 * Le suddivisioni interne rispettano la stessa regola di tutto il resto:
 * una fetta che viene da meno organizzazioni della soglia non esce come
 * numero piu' piccolo, esce vuota. Le distribuzioni (livelli, ruolo) si
 * danno in percentuale su una base che e' gia' sopra la soglia delle
 * persone, e non si possono ricondurre a nessuno.
 */

const mese = (iso) => String(iso || '').slice(0, 7);

/** Tutti i mesi coperti da una finestra, anche quelli vuoti. */
function mesiDi({ da, a }) {
  const fuori = [];
  const passo = new Date(da);
  passo.setUTCDate(1);
  while (passo.getTime() <= a) {
    fuori.push(passo.toISOString().slice(0, 7));
    passo.setUTCMonth(passo.getUTCMonth() + 1);
  }
  return fuori;
}

const quota = (parte, tutto) => (tutto > 0 ? Number(((parte / tutto) * 100).toFixed(1)) : 0);

/** Una fetta di un totale, con dentro la sua prova di diffondibilita'. */
const fetta = (nome, certificazioni, org, gente) => (
  diffondibile(org.size, gente.size)
    ? { nome, certificazioni, organizzazioni: org.size, persone: gente.size, diffuso: true }
    : { nome, certificazioni: null, organizzazioni: null, persone: null, diffuso: false }
);

export function dettaglio({ giorni, ...filtri } = {}) {
  const orgIds = perimetro(filtri);
  const { perId } = vocabolario();
  const persone = new Map(personeDi(orgIds).map((u) => [u.id, u]));
  const { ora, prima } = finestre(giorni);
  // Una scheda per organizzazione, calcolata una volta: dice dimensione e
  // tipo, e costa un giro sui dati che non va ripetuto per ogni riga.
  const schede = new Map(orgIds.map((o) => [o, schedaOrg(o)]));
  const fasce = DIMENSIONI.filter((d) => d.id !== 'tutte');
  const calendario = mesiDi(ora);

  // Un giro solo sulle certificazioni, e da li' esce tutto.
  const tenute = new Map();
  const conti = new Map();
  const prendi = (voce) => {
    if (!conti.has(voce.chiave)) {
      conti.set(voce.chiave, {
        voce,
        certificazioni: 0,
        precedenti: 0,
        livelli: new Map(),
        organizzazioni: new Map(),
        persone: new Set(),
        tenutaDa: new Set(),
        guida: 0,
        reparti: new Set(),
        mesi: new Map(),
        fasce: new Map(),
      });
    }
    return conti.get(voce.chiave);
  };

  for (const cert of getCertifications()) {
    const chi = persone.get(cert.employeeId);
    if (!chi) continue;
    const voce = perId.get(cert.skillId);
    if (!voce) continue;

    // Quello che una persona tiene non scade con la finestra: una
    // competenza certificata due anni fa ce l'ha ancora. La co-occorrenza
    // e' l'unica misura qui dentro che guarda tutto lo storico, ed e'
    // giusto cosi' — la domanda e' "chi ha questa, che altro sa fare", non
    // "che cosa ha certificato negli stessi dodici mesi".
    if (!tenute.has(chi.id)) tenute.set(chi.id, { orgId: chi.orgId, quali: new Set() });
    tenute.get(chi.id).quali.add(voce.chiave);
    prendi(voce).tenutaDa.add(chi.id);

    if (dentro(cert.certifiedAt, prima)) { prendi(voce).precedenti += 1; continue; }
    if (!dentro(cert.certifiedAt, ora)) continue;

    const riga = prendi(voce);
    const scheda = schede.get(chi.orgId);
    const livello = Number(cert.level) || 1;
    const fascia = fasce.find((f) => scheda.membri >= f.min && scheda.membri <= f.max);

    riga.certificazioni += 1;
    riga.livelli.set(livello, (riga.livelli.get(livello) || 0) + 1);
    riga.persone.add(chi.id);
    if (chi.role !== 'admin' && gestisce(chi)) riga.guida += 1;
    for (const d of chi.departmentIds || []) riga.reparti.add(d);
    riga.mesi.set(mese(cert.certifiedAt), (riga.mesi.get(mese(cert.certifiedAt)) || 0) + 1);

    const perOrg = riga.organizzazioni.get(chi.orgId) || 0;
    riga.organizzazioni.set(chi.orgId, perOrg + 1);
    /* La ripartizione per tipo di organizzazione non c'e' piu': nel
       perimetro le personalizzate non entrano, e una torta con una fetta sola non
       e' una ripartizione. Resta quella per dimensione, che invece
       distingue davvero. */
    const chiaveFascia = fascia?.id || 'piccole';
    if (!riga.fasce.has(chiaveFascia)) {
      riga.fasce.set(chiaveFascia, { nome: fascia?.nome || '—', quante: 0, org: new Set(), gente: new Set() });
    }
    const b = riga.fasce.get(chiaveFascia);
    b.quante += 1;
    b.org.add(chi.orgId);
    b.gente.add(chi.id);
  }

  // Che cosa tengono insieme le stesse persone. Si contano le coppie una
  // volta sola, e si guarda in quante organizzazioni quella coppia esiste:
  // due competenze che viaggiano insieme dentro un'azienda sola non sono un
  // fatto di mercato, sono l'organigramma di quell'azienda.
  const coppie = new Map();
  for (const [personaId, { orgId, quali }] of tenute) {
    const elenco = [...quali].sort();
    for (let i = 0; i < elenco.length; i += 1) {
      for (let j = i + 1; j < elenco.length; j += 1) {
        const id = `${elenco[i]}||${elenco[j]}`;
        if (!coppie.has(id)) coppie.set(id, { gente: new Set(), org: new Set() });
        coppie.get(id).gente.add(personaId);
        coppie.get(id).org.add(orgId);
      }
    }
  }
  const accanto = new Map();
  for (const [id, { gente, org }] of coppie) {
    if (!diffondibile(org.size, gente.size)) continue;
    const [a, b] = id.split('||');
    for (const [uno, altro] of [[a, b], [b, a]]) {
      if (!accanto.has(uno)) accanto.set(uno, []);
      accanto.get(uno).push({ chiave: altro, persone: gente.size, organizzazioni: org.size });
    }
  }

  const quantePersone = persone.size;

  return [...conti.values()]
    .filter((r) => r.certificazioni > 0)
    .map((r) => {
      const gente = r.persone.size;
      const org = r.organizzazioni.size;
      const puoUscire = diffondibile(org, gente);
      const massima = Math.max(0, ...r.organizzazioni.values());
      const alti = [...r.livelli.entries()]
        .filter(([id]) => id >= 3)
        .reduce((s, [, n]) => s + n, 0);

      return {
        chiave: r.voce.chiave,
        nome: r.voce.nome,
        tipo: r.voce.tipo,
        categoria: r.voce.categoria,

        certificazioni: r.certificazioni,
        precedenti: r.precedenti,
        variazione: variazione(r.certificazioni, r.precedenti),
        organizzazioni: org,
        persone: gente,
        // Quante la tengono in tutto, contando anche chi l'ha ottenuta
        // prima del periodo: e' la base su cui si leggono le coppie.
        tenutaDa: r.tenutaDa.size,
        diffuso: puoUscire,

        // A che profondita'.
        livelloMedio: Number(
          ([...r.livelli.entries()].reduce((s, [id, n]) => s + id * n, 0) / (r.certificazioni || 1)).toFixed(2)
        ),
        livelli: SKILL_LEVELS.map((l) => ({
          id: l.id,
          nome: l.label,
          quante: r.livelli.get(l.id) || 0,
          quota: quota(r.livelli.get(l.id) || 0, r.certificazioni),
        })),
        padronanza: quota(alti, r.certificazioni),

        // Quanto e' diffusa, e quanto e' concentrata.
        penetrazione: quota(gente, quantePersone),
        concentrazione: quota(massima, r.certificazioni),

        // Dove attecchisce.
        perDimensione: fasce.map((f) => {
          const b = r.fasce.get(f.id);
          return b ? fetta(f.nome, b.quante, b.org, b.gente) : fetta(f.nome, 0, new Set(), new Set());
        }),

        // Chi la certifica.
        quotaGuida: quota(r.guida, r.certificazioni),
        reparti: r.reparti.size,

        // Con che curva.
        mesi: calendario.map((m) => ({ mese: m, quante: r.mesi.get(m) || 0 })),

        // Con che cosa viene.
        insieme: (accanto.get(r.voce.chiave) || [])
          .sort((a, b) => b.persone - a.persone)
          .slice(0, 5)
          .map((v) => ({
            chiave: v.chiave,
            nome: conti.get(v.chiave)?.voce.nome ?? v.chiave,
            persone: v.persone,
            quota: quota(v.persone, r.tenutaDa.size),
          })),
      };
    })
    .sort((a, b) => b.certificazioni - a.certificazioni);
}

/** Una competenza sola, presa per chiave. */
export const schedaCompetenza = (chiave, chiaveFinestra) =>
  dettaglio(chiaveFinestra).find((r) => r.chiave === chiave) || null;

/* ─── Portarsi via i dati ────────────────────────────────────────────────*/

/**
 * Una tavola in CSV.
 *
 * CSV e non un formato di foglio di calcolo vero: lo aprono tutti — Excel,
 * Numbers, Fogli Google, R, Python — senza che l'app debba portarsi dietro
 * una libreria per scriverne uno. Il punto e virgola perche' e' quello che
 * Excel si aspetta in Italia, e il BOM davanti perche' senza si mangia gli
 * accenti.
 *
 * Le righe non diffondibili non ci sono. Un file che esce dall'app non ha
 * piu' nessuno che lo protegga: se un numero non si puo' mostrare, tanto
 * meno si puo' scaricare.
 */
const campo = (v) => {
  const t = v === null || v === undefined ? '' : String(v);
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export function csv(colonne, righe) {
  const testa = colonne.map((c) => campo(c.nome)).join(';');
  const corpo = righe
    .filter((r) => r.diffuso !== false)
    .map((r) => colonne.map((c) => campo(c.valore(r))).join(';'));
  // Il segno d'ordine in testa (\uFEFF): senza, Excel apre il file come
  // se fosse latino-1 e si mangia gli accenti.
  return `\uFEFF${[testa, ...corpo].join('\r\n')}\r\n`;
}

/** Il nome del file: dice che cosa contiene, di che periodo, e di quando. */
export const nomeFile = (tavola, periodo) =>
  `achivia-osservatorio-${tavola}-${periodo}-${new Date().toISOString().slice(0, 10)}.csv`;

/* ─── Il fascicolo per una macchina ──────────────────────────────────────*/

/**
 * Tutte le competenze certificate, raggruppate, in un file solo — pensato
 * per essere dato in pasto a un modello.
 *
 * Un CSV va bene per un foglio di calcolo, ma perde tutto quello che non e'
 * una griglia: la distribuzione dei livelli, la curva mese per mese, le
 * competenze che viaggiano insieme. Qui il formato e' JSON, che quelle
 * cose le tiene.
 *
 * La differenza vera pero' non e' il formato: e' che il file si spiega da
 * solo. Un modello che riceve una tabella di numeri senza contesto inventa
 * il contesto — dira' "in calo del quaranta per cento" senza sapere che il
 * confronto e' con un periodo di pari durata, o parlera' di "tutte le
 * aziende" quando il perimetro sono solo quelle in abbonamento. Percio' il
 * fascicolo si porta dentro il metodo, il dizionario di ogni campo, il
 * perimetro esatto e — soprattutto — quello che i dati NON possono dire.
 * Le avvertenze sono la parte piu' importante del file.
 */

const DIZIONARIO = {
  nome: 'Il nome della competenza. Le soft skill vengono dal catalogo Achivia e hanno lo stesso nome ovunque; le tecniche le crea ogni organizzazione e qui sono raggruppate per nome, quindi una riga puo’ mettere insieme competenze create separatamente da aziende diverse.',
  tipo: 'La famiglia a cui la competenza appartiene nel catalogo standard: "soft" per quelle trasversali, "tecnica" per quelle del mestiere.',
  categoria: 'La famiglia: relazione, esecuzione, pensiero, guida, tecnica.',
  prima: 'La prima volta che questa competenza e’ stata certificata da qualcuno dentro il perimetro. Non e’ la data in cui la parola e’ nata — le competenze del catalogo esistono da prima — ma quella in cui il mercato ha cominciato a usarla.',
  certificazioni: 'Quante certificazioni sono state rilasciate nel periodo. Una persona puo’ avere una sola certificazione per competenza, quindi questo numero e’ anche il numero di persone che l’hanno ottenuta nel periodo.',
  precedenti: 'Lo stesso numero nel periodo immediatamente precedente, di pari durata.',
  variazione: 'Variazione percentuale fra periodo e precedente. Nulla quando il precedente e’ zero: non e’ una crescita infinita, e’ una competenza che prima non si certificava.',
  organizzazioni: 'Quante organizzazioni distinte hanno rilasciato queste certificazioni.',
  persone: 'Quante persone distinte le hanno ottenute nel periodo.',
  tenutaDa: 'Quante persone del perimetro la tengono in tutto, contando anche chi l’ha ottenuta prima del periodo. E’ la base su cui si leggono le percentuali del campo "insieme": una competenza non scade quando finisce la finestra.',
  livelloMedio: 'Media dei livelli di padronanza, da 1 (Beginner) a 4 (Expert).',
  livelli: 'Distribuzione delle certificazioni sui quattro livelli, in numero e in percentuale. Va guardata invece della media: cento certificazioni tutte da principiante e cento con dentro venti esperti danno medie simili e descrivono mercati diversi.',
  padronanza: 'Percentuale di certificazioni di livello Advanced o Expert. Alta = competenza matura, con dentro gente che la padroneggia. Bassa = competenza in fase di adozione.',
  penetrazione: 'Percentuale delle persone del perimetro che hanno ottenuto questa competenza nel periodo.',
  concentrazione: 'Percentuale delle certificazioni che viene dalla singola organizzazione piu’ attiva su questa competenza. Sopra il 50% la riga descrive soprattutto il progetto di un’azienda, non una tendenza di mercato: e’ il campo che evita di scambiare un caso isolato per un segnale.',
  perDimensione: 'Le stesse certificazioni divise per fascia di dimensione dell’organizzazione. Una competenza che cresce dalle piccole verso le grandi e’ un segnale precoce; il contrario e’ una pratica consolidata che scende.',
  quotaGuida: 'Percentuale delle certificazioni ottenute da persone con un ruolo che guida. Alta = competenza da responsabili; bassa = competenza operativa.',
  reparti: 'In quanti reparti distinti si certifica. Uno solo = specializzazione; molti = requisito trasversale.',
  mesi: 'Certificazioni mese per mese dentro il periodo. Serve a distinguere una crescita costante da un picco isolato: fanno la stessa "variazione" e vogliono dire il contrario.',
  insieme: 'Le competenze che le stesse persone tengono insieme a questa, con quante persone le hanno entrambe e su che percentuale di chi tiene questa (campo tenutaDa, non persone: le competenze non scadono con la finestra). Nessuno assume una competenza sola: e’ il campo piu’ utile per progettare un percorso formativo. Le coppie che esistono in meno organizzazioni della soglia non sono elencate.',
  diffuso: 'Se la riga rispetta le soglie di aggregazione. Nel file ci sono solo righe con diffuso=true: le altre sono state tolte, non ridotte.',
};

const LIMITI = [
  'Il perimetro sono solo le organizzazioni con abbonamento attivo che usano Achivia. Non e’ un campione rappresentativo del mercato del lavoro: e’ un censimento completo di questa popolazione. Non estendere le percentuali a "le aziende" in generale.',
  'Non ci sono le uscite: l’applicazione non ha modo di disattivare un account, quindi il ricambio del personale si misura solo per la meta’ in entrata. Non calcolare turnover netti.',
  'Non c’e’ il settore merceologico: l’applicazione non lo chiede a nessuno. Ogni analisi per settore sarebbe inventata.',
  'Una certificazione la rilascia il datore di lavoro, non un ente terzo. Misura che cosa un’organizzazione riconosce alle sue persone, che e’ un fatto — ma non e’ una certificazione di parte terza e non va trattata come tale.',
  'Le competenze tecniche sono raggruppate per nome. Due aziende che usano la stessa parola per cose diverse finiscono nella stessa riga, e due che usano parole diverse per la stessa cosa restano separate.',
  'Le righe sotto le soglie di aggregazione non sono nel file. Le somme delle colonne quindi non tornano con i totali del campione, ed e’ voluto: manca quello che non si poteva diffondere.',
];

/**
 * Il fascicolo completo. Si porta dietro il metodo e i limiti perche' chi
 * lo legge — persona o macchina — non deve andare a cercarli altrove.
 */
export function dossier({ giorni, ...filtri } = {}, periodo = PERIODO_PREDEFINITO) {
  const { ora, prima } = finestre(giorni);
  const chiave = { giorni, ...filtri };
  const testa = riepilogo(chiave);
  const righe = dettaglio(chiave).filter((r) => r.diffuso);
  const nuove = emergenti(chiave).filter((r) => r.diffuso);
  const fam = categorie(chiave).filter((r) => r.diffuso);
  const mob = mobilita(chiave);
  const str = struttura(filtri);
  const giorno = (t) => new Date(t).toISOString().slice(0, 10);

  return {
    documento: {
      cosa: 'Tutte le competenze certificate nelle organizzazioni Achivia con abbonamento attivo, raggruppate per competenza e descritte nel dettaglio.',
      origine: 'Achivia — Osservatorio del mercato delle competenze',
      generato: new Date().toISOString(),
      perChi: 'Questo file e’ pensato per essere letto da un modello linguistico. Le sezioni "metodo", "dizionario" e "limiti" non sono contorno: vincolano l’interpretazione dei numeri. Leggile prima di trarre conclusioni, e riporta i limiti a chi ti fa domande su questi dati.',
    },
    metodo: {
      perimetro: 'Solo le organizzazioni con abbonamento attivo, e solo quelle che passano i filtri riportati sotto. Le altre non sono nei conti in nessuna forma.',
      riservatezza: `Nessun numero puo’ essere ricondotto a una singola organizzazione. Una riga esce solo se e’ fatta di almeno ${SOGLIA_ORG} organizzazioni e ${SOGLIA_PERSONE} persone; sotto quelle soglie non viene ridotta o arrotondata, viene tolta. Vale anche per le suddivisioni dentro ogni riga.`,
      confronto: `Ogni misura e’ accompagnata dalla stessa misura nel periodo immediatamente precedente, di pari durata (${giorni} giorni). Le variazioni percentuali sono sempre fra questi due periodi, mai fra periodi di lunghezza diversa.`,
      vocabolario: 'Si misurano solo le competenze del catalogo standard di Achivia, che e’ lo stesso per tutte le organizzazioni. Le competenze che una singola organizzazione si crea in casa non entrano in nessun conto: sono nomi che ognuno sceglie per se’, e confrontarli fra loro misurerebbe il lessico interno delle aziende invece del mercato.',
    },
    finestra: {
      periodo,
      giorni,
      da: giorno(ora.da),
      a: giorno(ora.a),
      precedente: { da: giorno(prima.da), a: giorno(prima.a) },
    },
    filtri: {
      dimensione: filtri.dimensione ?? 'tutte',
      tipo: filtri.tipo ?? 'tutti',
      anzianita: filtri.anzianita ?? 'tutte',
    },
    campione: {
      organizzazioni: testa.organizzazioni,
      persone: testa.persone,
      competenzeDistinte: testa.competenzeDistinte,
      certificazioni: testa.certificazioni,
      variazione: testa.variazione,
      competenzeNelFile: righe.length,
      competenzeTolte: testa.competenzeDistinte - righe.length,
    },
    dizionario: DIZIONARIO,
    limiti: LIMITI,
    competenze: righe,
    emergenti: nuove,
    famiglie: fam,
    mobilita: mob.diffuso ? mob : null,
    struttura: str.diffuso ? str : null,
  };
}

/** Il fascicolo come testo, pronto da scaricare. */
export const testoDossier = (chiave, periodo) =>
  `${JSON.stringify(dossier(chiave, periodo), null, 2)}\n`;

export const nomeDossier = (periodo) =>
  `achivia-osservatorio-competenze-${periodo}-${new Date().toISOString().slice(0, 10)}.json`;
