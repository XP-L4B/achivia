import {
  getQuestsForUser,
  getHelpRequestsByRequester,
  getHelpRequestsByHelper,
  getOrdiniForUser,
  getCertificationsForEmployee,
  getCertifications,
  getOrdini,
  quotaDi,
  creditiPagatiDi,
} from './db';
import { ASSENZA, RITARDO, eventiDi } from './presenze';
import { questDi, personeDi } from './organizzazione';

/**
 * Serie storiche per la vista a grafico di "Dati personali" e "Dati dei
 * dipendenti".
 *
 * Ogni punto della spezzata è un mese (un anno, quando il periodo scelto è
 * così lungo che i mesi non ci starebbero). Il valore del punto è il dato
 * aggregato su quel mese: per le percentuali è la media del mese — la
 * percentuale calcolata sulle quest concluse in quel mese e non la media
 * delle percentuali dei giorni — per i conteggi e i crediti è il totale del
 * mese, che è l'unico aggregato che abbia senso per una quantità che si
 * accumula.
 *
 * Solo i dati con una data possono finire qui: le quest approvate portano
 * `approvedAt`, quelle scadute la `deadline`, le richieste di aiuto e gli
 * acquisti la loro data di creazione. Voci come "crediti attuali" o
 * "Presence Streak" sono fotografie dell'oggi, senza storico: restano
 * nella vista a valori e non compaiono fra le metriche del grafico.
 */

export const METRICHE = [
  { id: 'completate',    label: 'Completate in tempo', gruppo: 'Performance', unita: '' },
  { id: 'assegnate',     label: 'Quest assegnate', gruppo: 'Performance', unita: '' },
  { id: 'pct_tempo',     label: '% completate in tempo', gruppo: 'Performance', unita: '%' },
  { id: 'fallite',       label: 'Quest fallite', gruppo: 'Performance', unita: '' },
  { id: 'pct_fallite',   label: '% quest fallite', gruppo: 'Performance', unita: '%' },
  { id: 'ritardo',       label: 'Consegnate in ritardo', gruppo: 'Performance', unita: '' },
  { id: 'pct_ritardo',   label: '% in ritardo', gruppo: 'Performance', unita: '%' },
  { id: 'aiuti_dati',    label: 'Aiuti forniti', gruppo: 'Performance', unita: '' },
  { id: 'aiuti_chiesti', label: 'Aiuti richiesti', gruppo: 'Performance', unita: '' },
  { id: 'guadagnati',    label: 'Crediti guadagnati', gruppo: 'Crediti', unita: '' },
  { id: 'spesi',         label: 'Crediti spesi', gruppo: 'Crediti', unita: '' },
  { id: 'assenze',       label: 'Assenze', gruppo: 'Presenze', unita: '' },
  { id: 'ritardi',       label: 'Ritardi in ingresso', gruppo: 'Presenze', unita: '' },
  { id: 'minuti_ritardo', label: 'Minuti di ritardo', gruppo: 'Presenze', unita: '' },
  { id: 'certificazioni', label: 'Competenze certificate', gruppo: 'Competenze', unita: '' },
];

/** I gruppi del menu, nell'ordine in cui compaiono qui sopra. */
export const GRUPPI = [...new Set(METRICHE.map((m) => m.gruppo))];

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

/** Soglia oltre la quale i punti diventano anni: 24 mesi di etichette non ci stanno. */
const MAX_MESI = 24;

const ms = (v) => (v ? new Date(v).getTime() : NaN);

/**
 * Intervalli in cui dividere il periodo. Con `perAnno` ogni intervallo è un
 * anno solare, altrimenti un mese solare; il primo e l'ultimo sono comunque
 * limitati agli estremi scelti dall'utente.
 */
export function intervalli(da, a) {
  const inizio = new Date(da);
  const fine = new Date(a);
  const mesi =
    (fine.getFullYear() - inizio.getFullYear()) * 12 + (fine.getMonth() - inizio.getMonth()) + 1;
  const perAnno = mesi > MAX_MESI;

  const out = [];
  if (perAnno) {
    for (let anno = inizio.getFullYear(); anno <= fine.getFullYear(); anno += 1) {
      out.push({
        chiave: String(anno),
        etichetta: String(anno),
        inizio: new Date(anno, 0, 1).getTime(),
        fine: new Date(anno + 1, 0, 1).getTime(),
      });
    }
    return { punti: out, perAnno };
  }

  const cursore = new Date(inizio.getFullYear(), inizio.getMonth(), 1);
  while (cursore <= fine) {
    const anno = cursore.getFullYear();
    const mese = cursore.getMonth();
    out.push({
      chiave: `${anno}-${String(mese + 1).padStart(2, '0')}`,
      etichetta: MESI[mese],
      anno,
      inizio: new Date(anno, mese, 1).getTime(),
      fine: new Date(anno, mese + 1, 1).getTime(),
    });
    cursore.setMonth(mese + 1);
  }
  return { punti: out, perAnno };
}

/* ─── I fatti da mettere in fila ─────────────────────────────────────────
   Le due serie — quella di una persona e quella dell'organizzazione —
   guardano gli stessi fatti su insiemi diversi. Invece di due funzioni
   gemelle che invecchiano ognuna per conto suo, ognuna raccoglie i suoi
   fatti e li riduce alla stessa forma: un istante e i pochi campi che
   servono. Il conto intervallo per intervallo e' scritto una volta sola.

   Il registro delle presenze porta il giorno, non l'istante: si guarda a
   mezzogiorno, cosi' nessun fuso lo sposta al giorno prima o dopo. */

const giornoMs = (g) => new Date(`${g}T12:00:00`).getTime();

function raccogli({ quests, aiutiDati, aiutiChiesti, acquisti, presenze, certificazioni, incasso }) {
  return {
    approvate: quests
      .filter((q) => q.status === 'approvata' && q.approvedAt)
      // Non la ricompensa scritta sulla quest ma quella che e' arrivata
      // davvero: una quest di gruppo si divide, e all'admin non arriva
      // niente.
      .map((q) => ({ t: ms(q.approvedAt), crediti: incasso(q), tardi: q.late === true })),
    scadute: quests
      .filter((q) => q.status === 'scaduta' && q.deadline)
      .map((q) => ({ t: ms(q.deadline) })),
    assegnate: quests.map((q) => ({ t: ms(q.createdAt) })),
    aiutiDati: aiutiDati.map((h) => ({ t: ms(h.createdAt) })),
    aiutiChiesti: aiutiChiesti.map((h) => ({ t: ms(h.createdAt) })),
    acquisti: acquisti.map((o) => ({ t: ms(o.creatoIl), crediti: o.crediti || 0 })),
    presenze: presenze.map((e) => ({ t: giornoMs(e.giorno), tipo: e.tipo, minuti: e.minuti || 0 })),
    certificazioni: certificazioni.map((c) => ({ t: ms(c.certifiedAt) })),
    // Serve a distinguere "nessun dato" da "tutti zero": con lo storico vuoto
    // la spezzata sarebbe una riga piatta sullo zero, che non significa nulla.
    vuota: quests.length === 0 && aiutiDati.length === 0 && aiutiChiesti.length === 0
      && acquisti.length === 0 && presenze.length === 0 && certificazioni.length === 0,
  };
}

const fattiDiPersona = (user) => raccogli({
  quests: getQuestsForUser(user).filter((q) => q.status !== 'template'),
  aiutiDati: getHelpRequestsByHelper(user.id),
  aiutiChiesti: getHelpRequestsByRequester(user.id),
  // Un ordine annullato e' stato rimborsato: quei crediti non sono usciti,
  // e nel conto di quanto si e' speso non ci vanno.
  acquisti: getOrdiniForUser(user.id).filter((o) => o.stato !== 'annullato'),
  presenze: eventiDi(user.id),
  certificazioni: getCertificationsForEmployee(user.id, user.orgId).filter((c) => c.status === 'certified'),
  incasso: (q) => quotaDi(q, user.id),
});

function fattiDiOrg(orgId) {
  const persone = personeDi(orgId);
  const suoi = new Set(persone.map((p) => p.id));
  const richieste = persone.flatMap((p) => getHelpRequestsByRequester(p.id));
  return raccogli({
    quests: questDi(orgId),
    // Per l'organizzazione "aiuti forniti" e "aiuti richiesti" sono lo stesso
    // fatto guardato da due lati: quelli raccolti da un collega e tutti
    // quelli chiesti.
    aiutiDati: richieste.filter((h) => h.acceptedAt),
    aiutiChiesti: richieste,
    acquisti: getOrdini().filter((o) => suoi.has(o.userId) && o.stato !== 'annullato'),
    presenze: persone.flatMap((p) => eventiDi(p.id)),
    certificazioni: getCertifications().filter((c) => suoi.has(c.employeeId) && c.status === 'certified'),
    incasso: creditiPagatiDi,
  });
}

/**
 * Un punto per intervallo, sempre: i mesi senza attivita' valgono zero,
 * altrimenti la spezzata salterebbe i buchi facendo sembrare continuo un
 * periodo fermo.
 */
function costruisci(fatti, metrica, da, a) {
  const { punti, perAnno } = intervalli(da, a);
  const info = METRICHE.find((m) => m.id === metrica) || METRICHE[0];
  const dentro = (t, p) => Number.isFinite(t) && t >= p.inizio && t < p.fine;

  const valori = punti.map((p) => {
    const nel = (elenco) => elenco.filter((x) => dentro(x.t, p));
    const app = nel(fatti.approvate);
    const sca = nel(fatti.scadute);
    const inTempo = app.filter((q) => !q.tardi);
    const tardi = app.filter((q) => q.tardi);
    const concluse = app.length + sca.length;
    const eventi = nel(fatti.presenze);
    const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

    switch (info.id) {
      case 'completate':    return inTempo.length;
      case 'assegnate':     return nel(fatti.assegnate).length;
      case 'pct_tempo':     return pct(inTempo.length, concluse);
      case 'fallite':       return sca.length;
      case 'pct_fallite':   return pct(sca.length, concluse);
      case 'ritardo':       return tardi.length;
      case 'pct_ritardo':   return pct(tardi.length, concluse);
      case 'aiuti_dati':    return nel(fatti.aiutiDati).length;
      case 'aiuti_chiesti': return nel(fatti.aiutiChiesti).length;
      case 'spesi':         return nel(fatti.acquisti).reduce((s, x) => s + x.crediti, 0);
      // Aiutare non sposta crediti: conta la ricompensa piena delle quest
      // chiuse nel mese.
      case 'guadagnati':    return app.reduce((s, q) => s + q.crediti, 0);
      case 'assenze':       return eventi.filter((e) => e.tipo === ASSENZA).length;
      case 'ritardi':       return eventi.filter((e) => e.tipo === RITARDO).length;
      case 'minuti_ritardo':
        return eventi.filter((e) => e.tipo === RITARDO).reduce((s, e) => s + e.minuti, 0);
      case 'certificazioni': return nel(fatti.certificazioni).length;
      default: return 0;
    }
  });

  return {
    unita: info.unita,
    etichetta: info.label,
    perAnno,
    punti: punti.map((p, i) => ({
      chiave: p.chiave,
      etichetta: p.etichetta,
      anno: p.anno,
      valore: valori[i],
    })),
    vuota: fatti.vuota,
  };
}

/** Serie storica di una metrica per una persona. */
export const serieStorica = ({ user, metrica, da, a }) =>
  costruisci(fattiDiPersona(user), metrica, da, a);

/** La stessa serie, per tutta l'organizzazione. */
export const serieStoricaOrg = ({ orgId, metrica, da, a }) =>
  costruisci(fattiDiOrg(orgId), metrica, da, a);
