/**
 * Il registro dei crediti: ogni movimento, con la sua causale.
 *
 * Fino a ieri i crediti si muovevano in tre posti — `accredita` quando una
 * quest veniva approvata, `spendiCrediti` quando si comprava qualcosa,
 * `rimborsaCrediti` quando un ordine tornava indietro — e nessuno dei tre
 * lasciava traccia. Il saldo era scritto sulla persona e basta: sapevi
 * quanti crediti aveva, non da dove le erano arrivati ne' dove erano
 * finiti. Una riga di registro esisteva solo per le ricompense dei
 * traguardi, scritta a mano dentro `traguardi.js`, ed era l'eccezione.
 *
 * Un saldo senza registro non e' un conto, e' un numero. Non risponde alla
 * domanda piu' semplice che si possa fare a un'economia — quanti crediti
 * sono entrati e quanti ne sono usciti in questo mese — e non risponde
 * nemmeno a quella che conta di piu' il giorno in cui i crediti si comprano
 * con del denaro: questi crediti, chi li ha pagati.
 *
 * Quindi da qui in poi il saldo non si tocca a mano da nessuna parte. Si
 * chiama `muoviCrediti`, che sposta il numero e scrive la riga nella stessa
 * mossa: o succedono tutte e due le cose o non ne succede nessuna. Le tre
 * funzioni di prima restano dove stanno e con il nome che avevano — le
 * chiamano le schermate — ma dentro passano tutte di qui.
 */

import { db, ensureCrediti, ensureOrganizzazioni, nuovoId } from './nucleo';

/**
 * Le causali: perche' dei crediti si sono mossi.
 *
 * Non e' un elenco decorativo. E' l'unica cosa che rende leggibile il
 * registro a distanza di mesi, ed e' quello che si guarda per capire se
 * un'economia sta in piedi: se le entrate sono quasi tutte `traguardo` e le
 * uscite quasi tutte `risalto`, il negozio non lo usa nessuno e va saputo.
 *
 * `verso` dice da che parte va di solito il movimento. Non e' un vincolo —
 * una rettifica va nei due sensi — serve a raggruppare senza dover guardare
 * il segno di ogni riga.
 *
 * ─── `esperienza`: quali crediti fanno salire di livello ─────────────────
 *
 * L'esperienza segue i crediti *guadagnati lavorando*, e nient'altro: una
 * quest approvata, una medaglia. Non i crediti comprati con del denaro, non
 * quelli che l'abbonamento mette in cassa, non quelli che chi amministra
 * versa a qualcuno, non un rimborso che restituisce quello che era gia'
 * stato speso.
 *
 * La ragione e' che il livello dice quanto una persona ha fatto. Se si
 * comprasse, direbbe quanto ha speso, e sarebbe la stessa parola per due
 * cose diverse: chi guarda una classifica non saprebbe piu' che cosa sta
 * leggendo, e chi ha lavorato sei mesi si vedrebbe passare davanti da chi
 * ha pagato una volta. Un'azienda che compra crediti per premiare i suoi
 * non sta salendo di livello: sta mettendo carburante in un motore che
 * qualcun altro dovra' far girare.
 *
 * Sta scritto qui, sulla causale, e non nel codice che accredita, perche'
 * qui e' l'unico posto dove le ragioni di un movimento sono elencate tutte
 * insieme: chi ne aggiunge una deve rispondere a questa domanda nello
 * stesso momento in cui la scrive, e non puo' dimenticarsene.
 */
export const CAUSALI = [
  { id: 'quest', verso: 'entrata', esperienza: true, nome: 'Quest approvata', nota: 'La ricompensa di una quest portata a termine.' },
  { id: 'traguardo', verso: 'entrata', esperienza: true, nome: 'Traguardo raggiunto', nota: 'I crediti attaccati a una medaglia.' },
  { id: 'acquisto', verso: 'entrata', esperienza: false, nome: 'Pacchetto comprato', nota: 'Crediti comprati con del denaro. Non danno esperienza.' },
  { id: 'dotazione', verso: 'entrata', esperienza: false, nome: 'Dotazione dell’abbonamento', nota: 'I crediti che il piano mette nella cassa dell’organizzazione.' },
  { id: 'versamento', verso: 'doppio', esperienza: false, nome: 'Versamento dalla cassa', nota: 'Crediti passati dalla cassa dell’organizzazione a una persona.' },
  { id: 'rimborso', verso: 'entrata', esperienza: false, nome: 'Ordine annullato', nota: 'Crediti tornati indietro da un ordine che non si e’ fatto.' },
  { id: 'ordine', verso: 'uscita', esperienza: false, nome: 'Acquisto nel negozio', nota: 'Crediti spesi per un articolo.' },
  { id: 'spedizione', verso: 'uscita', esperienza: false, nome: 'Spedizione', nota: 'Crediti spesi per il trasporto di un ordine. Sta su una riga sua per poter rispondere alla domanda «quanto ho incassato di trasporti».' },
  { id: 'risalto', verso: 'uscita', esperienza: false, nome: 'Annuncio in risalto', nota: 'Crediti spesi per far vedere di piu’ un annuncio.' },
  { id: 'rettifica', verso: 'doppio', esperienza: false, nome: 'Correzione a mano', nota: 'Una rettifica decisa da chi amministra l’applicazione.' },
];

const NOMI = Object.fromEntries(CAUSALI.map((c) => [c.id, c.nome]));
const CON_ESPERIENZA = new Set(CAUSALI.filter((c) => c.esperienza).map((c) => c.id));

/** Il nome per esteso di una causale; l'id stesso se non la conosciamo. */
export const nomeCausale = (id) => NOMI[id] || id || '—';

/**
 * Se dei crediti mossi con questa causale portano anche esperienza.
 *
 * Una causale che non conosciamo non ne porta: il livello si alza solo per
 * una ragione scritta qui sopra, e "non lo so" non e' una di quelle.
 */
export const daEsperienza = (id) => CON_ESPERIENZA.has(id);

/* I nomi che avevano le righe scritte prima che questo file esistesse. Le
   vecchie righe non si riscrivono — un registro non si riscrive — si
   leggono con il vocabolario di allora. */
const CAUSALI_DI_PRIMA = { achievement_reward: 'traguardo' };

/**
 * Una riga come la legge chi la guarda, da qualunque epoca arrivi.
 *
 * Le righe vecchie hanno i campi in inglese e non hanno il saldo: nascono
 * da un tempo in cui il registro serviva a una cosa sola. Qui prendono la
 * forma di adesso senza essere toccate nel deposito.
 */
export function rigaMovimento(t) {
  if (!t) return null;
  const quanti = Number(t.quanti ?? t.amount ?? 0);
  return {
    id: t.id,
    userId: t.userId ?? null,
    orgId: t.orgId ?? null,
    quanti,
    causale: t.causale ?? CAUSALI_DI_PRIMA[t.source] ?? t.source ?? 'rettifica',
    riferimento: t.riferimento ?? t.achievementInstanceId ?? t.achievementId ?? null,
    daId: t.daId ?? null,
    // Un movimento della cassa dell'organizzazione invece che del
    // portafoglio di una persona. Si dichiara invece di dedursi da
    // `userId === null`: quel caso capita anche a una riga rimasta senza
    // nome perche' la persona ha cancellato l'account, ed e' un'altra cosa.
    cassa: Boolean(t.cassa),
    nota: t.nota || '',
    // Il saldo dopo il movimento. Le righe di prima non ce l'hanno e non si
    // puo' inventare: `null` dice "non si sa", che e' l'unica cosa vera.
    saldo: t.saldo ?? null,
    creatoIl: t.creatoIl ?? t.createdAt ?? null,
  };
}

/**
 * Sposta dei crediti e ne scrive la ragione.
 *
 * `quanti` e' firmato: positivo entra, negativo esce. Un'uscita piu' grande
 * del saldo non si fa — nessuno va sotto zero — e la funzione dice di no
 * senza aver toccato niente.
 *
 * Non salva: salva chi chiama, che di solito sta facendo altre cose nella
 * stessa mossa e deve poterle salvare tutte insieme. Le poche volte in cui
 * il movimento e' tutto quello che succede, chi chiama fa `save()` e basta.
 */
export function muoviCrediti({ userId, quanti, causale, orgId, riferimento, daId, nota }) {
  ensureCrediti();
  const somma = Math.round(Number(quanti) || 0);
  if (!somma) return null;
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  const prima = Number(u.credits) || 0;
  if (prima + somma < 0) return null;

  u.credits = prima + somma;
  const riga = {
    id: nuovoId('mv'),
    userId,
    // Dove e' successo. Il canale aperto di chi riceve e' la risposta
    // giusta quando nessuno ne passa una migliore: i crediti si guadagnano
    // dentro un'organizzazione, e un movimento senza posto non si sa poi a
    // chi attribuirlo.
    orgId: orgId !== undefined ? orgId : (u.orgId ?? null),
    quanti: somma,
    causale: causale || 'rettifica',
    riferimento: riferimento ?? null,
    daId: daId ?? null,
    nota: nota || '',
    saldo: u.credits,
    creatoIl: new Date().toISOString(),
  };
  db.creditTransactions.unshift(riga);
  return riga;
}

/**
 * Sposta crediti nella cassa di un'organizzazione, e ne scrive la ragione.
 *
 * La cassa e' il secondo portafoglio di questa applicazione, e per un anno
 * non e' esistito apposta: i crediti erano di una persona e basta, che e'
 * la cosa piu' semplice che regga. Poi i piani hanno cominciato a dare
 * crediti "da distribuire", e distribuire vuol dire averli da qualche parte
 * prima di darli. Metterli sul conto del proprietario avrebbe funzionato
 * per un'organizzazione con un capo solo e sarebbe stato falso per tutte le
 * altre: quei crediti sono dell'azienda, non suoi, e quando cambia
 * proprietario non se li porta via.
 *
 * Come il portafoglio di una persona: non va sotto zero, e ogni movimento
 * lascia la riga.
 */
export function muoviCassa({ orgId, quanti, causale, riferimento, daId, nota }) {
  ensureCrediti();
  ensureOrganizzazioni();
  const somma = Math.round(Number(quanti) || 0);
  if (!somma || !orgId) return null;
  const org = db.organizzazioni[orgId];
  if (!org) return null;
  const prima = Number(org.cassa) || 0;
  if (prima + somma < 0) return null;

  org.cassa = prima + somma;
  const riga = {
    id: nuovoId('mv'),
    userId: null,
    cassa: true,
    orgId,
    quanti: somma,
    causale: causale || 'rettifica',
    riferimento: riferimento ?? null,
    daId: daId ?? null,
    nota: nota || '',
    saldo: org.cassa,
    creatoIl: new Date().toISOString(),
  };
  db.creditTransactions.unshift(riga);
  return riga;
}

/** Quanti crediti ha in cassa un'organizzazione. */
export function creditiInCassa(orgId) {
  ensureOrganizzazioni();
  return Number(db.organizzazioni[orgId]?.cassa) || 0;
}

/** Quanti ce ne sono in tutte le casse messe insieme. */
export const casseTotali = () => {
  ensureOrganizzazioni();
  return Object.values(db.organizzazioni).reduce((s, o) => s + (Number(o.cassa) || 0), 0);
};

/**
 * Le righe del registro, dalla piu' recente.
 *
 * Tutti i filtri sono facoltativi e si sommano. `da` e `a` sono due date —
 * stringhe ISO o oggetti `Date` — e delimitano la finestra: `a` compreso,
 * perche' chi scrive "fino al 31" intende il 31.
 */
export function movimenti({ userId, orgId, causale, cassa, da, a } = {}) {
  ensureCrediti();
  const dopo = da ? new Date(da).getTime() : null;
  const prima = a ? new Date(a).getTime() : null;
  return db.creditTransactions
    .map(rigaMovimento)
    .filter((r) => {
      if (userId && r.userId !== userId) return false;
      if (orgId && r.orgId !== orgId) return false;
      if (causale && r.causale !== causale) return false;
      // `cassa: true` solo i movimenti della cassa, `false` solo quelli
      // delle persone, assente tutti e due.
      if (cassa !== undefined && r.cassa !== Boolean(cassa)) return false;
      if (!dopo && !prima) return true;
      const q = r.creatoIl ? new Date(r.creatoIl).getTime() : NaN;
      if (Number.isNaN(q)) return false;
      return (dopo === null || q >= dopo) && (prima === null || q <= prima);
    })
    .sort((x, y) => String(y.creatoIl ?? '').localeCompare(String(x.creatoIl ?? '')));
}

/**
 * Quanto e' entrato, quanto e' uscito, e come si divide per causale.
 *
 * E' il conto che serve a chi guarda l'economia dall'alto: in questa
 * finestra di tempo sono nati tanti crediti e ne sono stati consumati
 * tanti, e la differenza dice se il magazzino si sta gonfiando o
 * svuotando. `perCausale` e' lo stesso conto voce per voce, che e' dove si
 * capisce il perche'.
 */
export function contoMovimenti(filtro = {}) {
  const righe = movimenti(filtro);
  const perCausale = {};
  let entrate = 0;
  let uscite = 0;
  for (const r of righe) {
    if (r.quanti > 0) entrate += r.quanti; else uscite -= r.quanti;
    const voce = (perCausale[r.causale] ||= { causale: r.causale, nome: nomeCausale(r.causale), quanti: 0, righe: 0 });
    voce.quanti += r.quanti;
    voce.righe += 1;
  }
  return {
    righe,
    quante: righe.length,
    entrate,
    uscite,
    saldo: entrate - uscite,
    perCausale: Object.values(perCausale).sort((x, y) => Math.abs(y.quanti) - Math.abs(x.quanti)),
  };
}

/* Il nome con cui il registro si e' chiamato finche' conteneva solo le
   ricompense dei traguardi. Resta perche' resta comodo — "dammi i movimenti
   di questa persona" — e adesso li restituisce tutti, non piu' quelli soli. */
export const getCreditTransactions = (userId) => movimenti(userId ? { userId } : {});

/** I crediti fermi nei portafogli di tutti, adesso. */
export const creditiInCircolo = () =>
  db.users.reduce((somma, u) => somma + (Number(u.credits) || 0), 0);
