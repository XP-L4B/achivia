/**
 * Il negozio: il catalogo, i prezzi, le offerte e gli ordini.
 *
 * `db.js` tiene le due collezioni; qui ci sono le regole, che sono di tre
 * tipi e conviene tenerle separate in testa:
 *
 *   chi puo'   la dashboard e' di chi ha un accesso al negozio, e basta
 *   quanto     il prezzo vero di un articolo, offerta compresa
 *   che cosa   che cosa succede comprando, e che cosa annullando
 *
 * La regola che conta piu' di tutte: i crediti sono soldi. Un ordine li
 * toglie davvero dal conto di chi compra, e un ordine annullato li rimette
 * dov'erano. Non c'e' nessun punto in cui si vende qualcosa senza che
 * qualcuno paghi.
 */

import {
  addArticolo, addCategoria, addOrdine, deleteArticolo, deleteCategoria,
  getArticoli, getArticoloById, getCategoriaById, getCategorie, getOrdini,
  getOrdiniForUser, getSpedizione, getUserById, rimborsaCrediti, scartaSeOrfana, segnaAttivita,
  setSpedizione, spendiCrediti, updateArticolo, updateCategoria, updateOrdine,
} from './db';

/* ─── Chi puo' ───────────────────────────────────────────── */

/**
 * Chi gestisce il negozio.
 *
 * E' un ruolo a parte, e non un permesso in piu' dato a un admin: chi
 * tiene il negozio non ha niente a che fare con le organizzazioni che
 * usano Achivia — non vede le loro persone, le loro quest, i loro dati —
 * e viceversa nessun admin di un'organizzazione mette mano al catalogo.
 * Gli accessi si consegnano a mano (vedi `RUOLI_APERTI` in `db.js`): da
 * dentro l'app un account cosi' non si crea.
 */
export const puoGestireNegozio = (persona) => persona?.role === 'shop';

/* ─── Quanto ─────────────────────────────────────────────── */

export const oggiIso = () => new Date().toISOString().slice(0, 10);

/**
 * Il prezzo di un articolo: quello pieno, quello che si paga davvero e
 * quanto si risparmia.
 *
 * L'offerta e' uno sconto in percentuale, con una data di fine
 * facoltativa. Passata quella data l'offerta smette da sola, senza che
 * nessuno debba ricordarsene: le offerte che restano appese perche'
 * qualcuno si e' dimenticato di toglierle sono il modo piu' comune in cui
 * un listino diventa falso.
 */
export function prezzoDi(articolo, oggi = oggiIso()) {
  const pieno = Math.max(0, Math.round(Number(articolo?.crediti) || 0));
  const sconto = Math.min(90, Math.max(0, Math.round(Number(articolo?.sconto) || 0)));
  const scaduta = Boolean(articolo?.offertaFino) && articolo.offertaFino < oggi;
  const attiva = sconto > 0 && !scaduta;
  const finale = attiva ? Math.max(1, Math.round((pieno * (100 - sconto)) / 100)) : pieno;
  return { pieno, finale, sconto: attiva ? sconto : 0, inOfferta: attiva, risparmio: pieno - finale };
}

/** Se un articolo si puo' comprare adesso: pubblicato, e non finito. */
export const disponibile = (articolo) =>
  Boolean(articolo?.attivo) && (articolo.scorta === null || Number(articolo.scorta) > 0);

/** Il catalogo come lo vede chi compra: solo quello che e' davvero in vendita. */
export const catalogo = () => getArticoli().filter(disponibile);

/* ─── Le categorie ───────────────────────────────────────
   Un modo per mettere ordine fra gli articoli, e nient'altro: un
   articolo puo' non averne, e togliere una categoria non toglie
   niente dal catalogo. */

export const categorie = () => getCategorie();

export const categoriaDi = (articolo) =>
  (articolo?.categoriaId ? getCategoriaById(articolo.categoriaId) : null);

/** Le categorie che hanno almeno un articolo in vendita, per chi compra. */
export function categorieInVetrina() {
  const vivi = new Set(catalogo().map((a) => a.categoriaId).filter(Boolean));
  return getCategorie().filter((c) => vivi.has(c.id));
}

export function salvaCategoria(me, { id, nome }) {
  if (!puoGestireNegozio(me)) return { ok: false, errore: 'Non hai accesso al negozio.' };
  const pulito = testo(nome);
  if (!pulito) return { ok: false, errore: 'La categoria vuole un nome.' };
  // Due categorie con lo stesso nome sono due modi di dire la stessa cosa,
  // e chi le usa non sa mai in quale mettere le cose.
  const gemella = getCategorie().find(
    (c) => c.id !== id && c.nome.toLowerCase() === pulito.toLowerCase(),
  );
  if (gemella) return { ok: false, errore: 'Questa categoria c’e’ gia’.' };
  const categoria = id ? updateCategoria(id, { nome: pulito }) : addCategoria({ nome: pulito });
  return categoria ? { ok: true, categoria } : { ok: false, errore: 'Categoria non trovata.' };
}

export function eliminaCategoria(me, id) {
  if (!puoGestireNegozio(me)) return { ok: false, errore: 'Non hai accesso al negozio.' };
  return deleteCategoria(id)
    ? { ok: true }
    : { ok: false, errore: 'Categoria non trovata.' };
}

/** Quanti articoli stanno in una categoria: si dice prima di cancellarla. */
export const quantiIn = (categoriaId) =>
  getArticoli().filter((a) => a.categoriaId === categoriaId).length;

/* ─── Il catalogo, dalla parte di chi lo tiene ───────────── */

const testo = (v) => String(v ?? '').trim();

/**
 * Controlla un articolo prima di salvarlo. Torna la lista di quello che
 * non va: vuota vuol dire che si puo' salvare.
 */
export function erroriArticolo(dati) {
  const errori = [];
  if (!testo(dati.nome)) errori.push('Il nome non puo’ restare vuoto.');
  const crediti = Number(dati.crediti);
  if (!Number.isFinite(crediti) || crediti < 1) errori.push('Il prezzo dev’essere di almeno 1 credito.');
  const sconto = Number(dati.sconto ?? 0);
  if (!Number.isFinite(sconto) || sconto < 0 || sconto > 90) errori.push('Lo sconto va da 0 a 90 per cento.');
  if (dati.scorta !== null && dati.scorta !== undefined && dati.scorta !== '') {
    const scorta = Number(dati.scorta);
    if (!Number.isFinite(scorta) || scorta < 0) errori.push('La scorta non puo’ essere negativa.');
  }
  if (sconto > 0 && dati.offertaFino && dati.offertaFino < oggiIso()) {
    errori.push('La data di fine offerta e’ gia’ passata.');
  }
  return errori;
}

/** Il pezzo di articolo pulito e pronto da scrivere. */
const normalizza = (dati) => ({
  nome: testo(dati.nome),
  descrizione: testo(dati.descrizione),
  crediti: Math.round(Number(dati.crediti)),
  sconto: Math.round(Number(dati.sconto ?? 0)) || 0,
  offertaFino: Number(dati.sconto) > 0 && dati.offertaFino ? dati.offertaFino : null,
  // Scorta vuota vuol dire "quante ne servono": e' diverso da zero, che
  // vuol dire "finito".
  scorta: dati.scorta === '' || dati.scorta === null || dati.scorta === undefined
    ? null
    : Math.round(Number(dati.scorta)),
  immagine: testo(dati.immagine) || null,
  pixelata: Boolean(dati.pixelata),
  categoriaId: testo(dati.categoriaId) || null,
  attivo: dati.attivo !== false,
});

/**
 * Crea o aggiorna un articolo. `dati.id` decide quale delle due: c'e' una
 * porta sola per entrambe le cose, cosi' i controlli non possono valere in
 * un caso e non nell'altro.
 */
export function salvaArticolo(me, dati) {
  if (!puoGestireNegozio(me)) return { ok: false, errore: 'Non hai accesso al negozio.' };
  const errori = erroriArticolo(dati);
  if (errori.length) return { ok: false, errore: errori[0], errori };
  const pulito = normalizza(dati);
  const prima = dati.id ? getArticoloById(dati.id)?.immagine : null;
  const articolo = dati.id ? updateArticolo(dati.id, pulito) : addArticolo(pulito);
  if (!articolo) {
    // `updateArticolo` e `addArticolo` tornano niente per due motivi soli:
    // l'articolo non c'e', oppure non c'e' stato spazio per scriverlo.
    return dati.id && !getArticoloById(dati.id)
      ? { ok: false, errore: 'Articolo non trovato.' }
      : { ok: false, errore: 'Non c’e’ piu’ spazio nel browser per salvare.' };
  }
  // Cambiando immagine, quella di prima resta li' a occupare posto se non
  // la nomina piu' nessuno.
  if (prima && prima !== articolo.immagine) scartaSeOrfana(prima);
  return { ok: true, articolo };
}

export function eliminaArticolo(me, id) {
  if (!puoGestireNegozio(me)) return { ok: false, errore: 'Non hai accesso al negozio.' };
  return deleteArticolo(id)
    ? { ok: true }
    : { ok: false, errore: 'Articolo non trovato.' };
}

/** Mettere e togliere dalla vetrina senza passare dal modulo. */
export function pubblica(me, id, attivo) {
  if (!puoGestireNegozio(me)) return { ok: false, errore: 'Non hai accesso al negozio.' };
  const articolo = updateArticolo(id, { attivo: Boolean(attivo) });
  return articolo ? { ok: true, articolo } : { ok: false, errore: 'Articolo non trovato.' };
}

/* ─── La spedizione ──────────────────────────────────────────
   Due zone e basta, perche' sono le due che cambiano davvero il costo:
   dentro l'Italia, o nel resto dell'Unione Europea. Il prezzo e' in
   crediti come tutto il resto del negozio — mescolare crediti ed euro
   nella stessa riga di totale sarebbe il modo piu' rapido di non farsi
   capire — e sopra una certa spesa la spedizione non si paga, che e' la
   leva con cui un negozio fa salire il carrello.

   La spedizione si paga sulla merce scontata, non su quella di listino:
   si paga quello che si spende davvero. */

export const ZONE = [
  { id: 'italia', label: 'Italia' },
  { id: 'ue', label: 'Unione Europea' },
];

export const etichettaZona = (id) => ZONE.find((z) => z.id === id)?.label ?? id;

/** Le spese come sono impostate adesso, con i numeri sempre a posto. */
export function spedizione() {
  const s = getSpedizione() || {};
  const n = (v) => Math.max(0, Math.round(Number(v) || 0));
  const soglia = s.gratisDa === null || s.gratisDa === undefined || s.gratisDa === ''
    ? null
    : Math.max(1, Math.round(Number(s.gratisDa) || 0));
  return { italia: n(s.italia), ue: n(s.ue), gratisDa: soglia };
}

/**
 * Quanto costa spedire un ordine da tanti crediti di merce.
 *
 * Torna anche il perche': `gratis` dice che la soglia e' stata raggiunta,
 * `manca` quanto ci vorrebbe ancora per arrivarci — e' quello che si
 * scrive a chi compra, e senza il numero la soglia non serve a niente.
 */
export function costoSpedizione(zona, merce = 0) {
  const s = spedizione();
  const pieno = zona === 'ue' ? s.ue : s.italia;
  if (pieno === 0) return { crediti: 0, pieno: 0, gratis: true, manca: 0, soglia: s.gratisDa };
  if (s.gratisDa !== null && merce >= s.gratisDa) {
    return { crediti: 0, pieno, gratis: true, manca: 0, soglia: s.gratisDa };
  }
  return {
    crediti: pieno,
    pieno,
    gratis: false,
    manca: s.gratisDa === null ? 0 : Math.max(0, s.gratisDa - merce),
    soglia: s.gratisDa,
  };
}

/** Cambiare le spese: solo chi tiene il negozio. */
export function impostaSpedizione(me, patch) {
  if (!puoGestireNegozio(me)) return { ok: false, errore: 'Non hai accesso al negozio.' };
  const n = (v) => Math.max(0, Math.round(Number(v) || 0));
  const dati = {};
  if (patch.italia !== undefined) dati.italia = n(patch.italia);
  if (patch.ue !== undefined) dati.ue = n(patch.ue);
  if (patch.gratisDa !== undefined) {
    dati.gratisDa = patch.gratisDa === null || patch.gratisDa === '' ? null : Math.max(1, n(patch.gratisDa));
  }
  const fatto = setSpedizione(dati);
  return fatto ? { ok: true, spedizione: spedizione() } : { ok: false, errore: 'Non c’e’ stato spazio per salvare.' };
}

/* ─── Gli ordini ─────────────────────────────────────────── */

export const STATI = [
  { id: 'nuovo',        label: 'Nuovo',           tono: '' },
  { id: 'preparazione', label: 'In preparazione', tono: 'attesa' },
  { id: 'consegnato',   label: 'Consegnato',      tono: 'testo' },
  { id: 'annullato',    label: 'Annullato',       tono: 'spento' },
];

export const etichettaStato = (id) => STATI.find((s) => s.id === id)?.label ?? id;

// Un ordine va avanti, o si annulla. Indietro non torna: uno stato che si
// puo' disfare non e' piu' un resoconto di quello che e' successo.
const DOPO = { nuovo: 'preparazione', preparazione: 'consegnato' };
export const statoDopo = (stato) => DOPO[stato] ?? null;
export const annullabile = (ordine) => ordine?.stato === 'nuovo' || ordine?.stato === 'preparazione';

/**
 * Compra un articolo.
 *
 * L'ordine si porta dietro nome, immagine e prezzo pagato: se domani
 * l'articolo cambia prezzo, o sparisce dal catalogo, quello che e' stato
 * comprato resta quello che era. Un ordine e' un fatto, non una finestra
 * sul listino di adesso.
 */
export function compra(persona, articoloId, zona = 'italia') {
  const articolo = getArticoloById(articoloId);
  if (!articolo) return { ok: false, errore: 'Questo articolo non esiste piu’.' };
  if (!disponibile(articolo)) return { ok: false, errore: 'Questo articolo non e’ in vendita.' };
  if (!ZONE.some((z) => z.id === zona)) return { ok: false, errore: 'Questa destinazione non esiste.' };

  const { finale, pieno, sconto } = prezzoDi(articolo);
  const spese = costoSpedizione(zona, finale);
  const totale = finale + spese.crediti;
  const chi = getUserById(persona?.id);
  if (!chi) return { ok: false, errore: 'Utente non trovato.' };
  if ((chi.credits || 0) < totale) {
    return { ok: false, errore: `Ti mancano ${totale - (chi.credits || 0)} crediti.` };
  }
  /* Merce e spedizione sono due righe nel registro dei crediti, non una:
     nel conto di chi tiene il negozio devono restare separate, se no la
     domanda «quanto ho incassato di trasporti» non ha risposta. */
  if (!spendiCrediti(chi.id, finale, { causale: 'ordine', riferimento: articolo.id })) {
    return { ok: false, errore: 'Crediti non sufficienti.' };
  }
  if (spese.crediti > 0 && !spendiCrediti(chi.id, spese.crediti, { causale: 'spedizione', riferimento: articolo.id })) {
    // La merce e' gia' stata pagata: si torna indietro invece di consegnare
    // un ordine mezzo pagato.
    rimborsaCrediti(chi.id, finale, { causale: 'rimborso', riferimento: articolo.id });
    return { ok: false, errore: 'Crediti non sufficienti.' };
  }

  if (articolo.scorta !== null) {
    updateArticolo(articolo.id, { scorta: Math.max(0, Number(articolo.scorta) - 1) });
  }

  const ordine = addOrdine({
    userId: chi.id,
    articoloId: articolo.id,
    nome: articolo.nome,
    immagine: articolo.immagine,
    pixelata: Boolean(articolo.pixelata),
    crediti: finale,
    creditiPieni: pieno,
    sconto,
    zona,
    spedizione: spese.crediti,
    totale,
    stato: 'nuovo',
  });
  segnaAttivita(chi.id, 'ha comprato nel negozio');
  return { ok: true, ordine };
}

/** Il passo successivo dell'ordine, deciso da chi tiene il negozio. */
export function avanza(me, ordineId) {
  if (!puoGestireNegozio(me)) return { ok: false, errore: 'Non hai accesso al negozio.' };
  const ordine = getOrdini().find((o) => o.id === ordineId);
  if (!ordine) return { ok: false, errore: 'Ordine non trovato.' };
  const stato = statoDopo(ordine.stato);
  if (!stato) return { ok: false, errore: 'Questo ordine e’ gia’ arrivato in fondo.' };
  return { ok: true, ordine: updateOrdine(ordineId, { stato }) };
}

/**
 * Annulla un ordine: i crediti tornano a chi li aveva spesi e, se
 * l'articolo teneva una scorta, il pezzo torna disponibile.
 *
 * Solo prima della consegna: dopo, quello che e' uscito e' uscito, e un
 * rimborso lo si decide fuori da qui.
 */
export function annulla(me, ordineId) {
  if (!puoGestireNegozio(me)) return { ok: false, errore: 'Non hai accesso al negozio.' };
  const ordine = getOrdini().find((o) => o.id === ordineId);
  if (!ordine) return { ok: false, errore: 'Ordine non trovato.' };
  if (!annullabile(ordine)) return { ok: false, errore: 'Un ordine consegnato non si annulla.' };

  /* Si rimborsa quello che e' stato pagato, spedizione compresa: se la
     merce non parte, il trasporto non si e' fatto. Gli ordini nati prima
     che la spedizione esistesse non hanno quel campo, e valgono zero. */
  rimborsaCrediti(ordine.userId, totaleOrdine(ordine), { causale: 'rimborso', riferimento: ordine.id, daId: me.id });
  const articolo = getArticoloById(ordine.articoloId);
  if (articolo && articolo.scorta !== null) {
    updateArticolo(articolo.id, { scorta: Number(articolo.scorta) + 1 });
  }
  return { ok: true, ordine: updateOrdine(ordineId, { stato: 'annullato' }) };
}

/**
 * Quanto e' costato un ordine in tutto.
 *
 * Un ordine nato prima che la spedizione esistesse porta solo `crediti`:
 * per lui il trasporto e' zero, ed e' la verita' — allora non si pagava.
 */
export const totaleOrdine = (ordine) =>
  (Number(ordine?.crediti) || 0) + (Number(ordine?.spedizione) || 0);

/** Gli ordini di una persona, come li vede lei. */
export const ordiniDi = (userId) => getOrdiniForUser(userId);

/** Chi ha fatto un ordine, per la dashboard. */
export const clienteDi = (ordine) => getUserById(ordine?.userId);

/* ─── La cassa ───────────────────────────────────────────────
   Il negozio non e' solo una vetrina: e' un'attivita' che incassa, e chi
   la tiene deve poter rispondere a «com'e' andata oggi» senza contare a
   mano gli ordini. Qui ci sono i conti, e sono conti sugli ordini: gli
   ordini sono il fatto — nome, prezzo pagato, giorno — e restano quelli
   anche se domani cambia il listino.

   Un ordine annullato non ha incassato niente: esce dai totali e rientra
   nella riga dei rimborsi, che e' un numero che si guarda per conto suo.
   Merce e spedizione stanno sempre separate: sono due mestieri diversi e
   si leggono male sommati. */

const GIORNO = 86400000;

export const giornoDi = (iso) => (iso ? String(iso).slice(0, 10) : null);

/** Il lunedi' della settimana di una data: le settimane cominciano di lunedi'. */
export function lunediDi(quando) {
  const d = new Date(quando);
  d.setHours(0, 0, 0, 0);
  const g = (d.getDay() + 6) % 7;              // lunedi' = 0
  d.setDate(d.getDate() - g);
  return d;
}

const isoDi = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

/** Una riga di cassa vuota: serve anche ai giorni in cui non e' successo niente. */
const rigaVuota = (chiave, etichetta) => ({
  chiave, etichetta, ordini: 0, merce: 0, spedizioni: 0, totale: 0, pezzi: 0,
});

function sommaIn(riga, ordine) {
  riga.ordini += 1;
  riga.pezzi += 1;
  riga.merce += Number(ordine.crediti) || 0;
  riga.spedizioni += Number(ordine.spedizione) || 0;
  riga.totale += totaleOrdine(ordine);
  return riga;
}

/** Il conto di una lista di ordini: quanti, quanto di merce, quanto di trasporti. */
export function conta(ordini) {
  const r = rigaVuota('conto', 'Conto');
  for (const o of ordini) sommaIn(r, o);
  r.medio = r.ordini ? Math.round(r.totale / r.ordini) : 0;
  return r;
}

/**
 * Il registro di cassa, come lo legge chi tiene il negozio.
 *
 * `giorni` e `settimane` dicono quanto indietro guardare. I periodi in
 * cui non e' entrato niente ci sono lo stesso, a zero: una riga che manca
 * si legge come «non lo so», una riga a zero si legge come «zero», e sono
 * due cose diverse.
 */
export function registroCassa({ giorni = 30, settimane = 12, adesso = Date.now() } = {}) {
  const tutti = getOrdini();
  const validi = tutti.filter((o) => o.stato !== 'annullato');
  const annullati = tutti.filter((o) => o.stato === 'annullato');

  const oggiIsoStr = isoDi(adesso);
  const lunedi = lunediDi(adesso);
  const primoDelMese = new Date(adesso);
  primoDelMese.setDate(1); primoDelMese.setHours(0, 0, 0, 0);

  const inFinestra = (o, da) => new Date(o.creatoIl).getTime() >= da;
  const periodi = {
    oggi: conta(validi.filter((o) => giornoDi(o.creatoIl) === oggiIsoStr)),
    settimana: conta(validi.filter((o) => inFinestra(o, lunedi.getTime()))),
    mese: conta(validi.filter((o) => inFinestra(o, primoDelMese.getTime()))),
    sempre: conta(validi),
  };

  /* Il giorno per giorno: una riga per ogni giorno della finestra, dalla
     piu' vecchia alla piu' recente, cosi' si legge come si legge il tempo. */
  const perGiorno = [];
  for (let i = giorni - 1; i >= 0; i -= 1) {
    const d = new Date(adesso - i * GIORNO);
    const chiave = isoDi(d);
    perGiorno.push(rigaVuota(chiave, d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })));
  }
  const indiceGiorni = new Map(perGiorno.map((r) => [r.chiave, r]));
  for (const o of validi) {
    const r = indiceGiorni.get(giornoDi(o.creatoIl));
    if (r) sommaIn(r, o);
  }

  /* La settimana per settimana: stessa idea, con l'etichetta che dice il
     lunedi' da cui parte. */
  const perSettimana = [];
  for (let i = settimane - 1; i >= 0; i -= 1) {
    const d = new Date(lunedi.getTime() - i * 7 * GIORNO);
    perSettimana.push(rigaVuota(isoDi(d), d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })));
  }
  const indiceSettimane = new Map(perSettimana.map((r) => [r.chiave, r]));
  for (const o of validi) {
    const r = indiceSettimane.get(isoDi(lunediDi(o.creatoIl)));
    if (r) sommaIn(r, o);
  }

  /* Che cosa si vende: per articolo, dal piu' venduto. E' la riga su cui
     si decide che cosa rifornire e che cosa togliere. */
  const perArticolo = new Map();
  for (const o of validi) {
    const id = o.articoloId || o.nome;
    const r = perArticolo.get(id) || { id, nome: o.nome, immagine: o.immagine, pixelata: o.pixelata, pezzi: 0, crediti: 0 };
    r.pezzi += 1;
    r.crediti += Number(o.crediti) || 0;
    perArticolo.set(id, r);
  }
  const articoli = [...perArticolo.values()].sort((a, b) => b.pezzi - a.pezzi || b.crediti - a.crediti);

  /* Dove si spedisce, e quanto rende ogni destinazione. */
  const perZona = ZONE.map((z) => {
    const suoi = validi.filter((o) => (o.zona || 'italia') === z.id);
    return { ...z, ordini: suoi.length, spedizioni: suoi.reduce((n, o) => n + (Number(o.spedizione) || 0), 0) };
  });

  /* Chi compra: quanti sono, e i migliori. Non e' una classifica da
     mostrare a loro — e' il negozio che sa chi torna. */
  const perCliente = new Map();
  for (const o of validi) {
    const r = perCliente.get(o.userId) || { userId: o.userId, ordini: 0, crediti: 0 };
    r.ordini += 1;
    r.crediti += totaleOrdine(o);
    perCliente.set(o.userId, r);
  }
  const clienti = [...perCliente.values()]
    .map((c) => ({ ...c, nome: getUserById(c.userId)?.name ?? 'Qualcuno' }))
    .sort((a, b) => b.crediti - a.crediti);

  const rimborsato = annullati.reduce((n, o) => n + totaleOrdine(o), 0);
  const giorniConIncasso = perGiorno.filter((r) => r.totale > 0).length;

  return {
    periodi,
    perGiorno,
    perSettimana,
    articoli,
    perZona,
    clienti,
    rimborsi: { ordini: annullati.length, crediti: rimborsato },
    /* Il giorno migliore della finestra, e quanti giorni hanno incassato:
       due numeri che dicono se il negozio vende tutti i giorni o a ondate. */
    giornoMigliore: perGiorno.reduce((max, r) => (r.totale > (max?.totale ?? -1) ? r : max), null),
    giorniConIncasso,
    giorniGuardati: giorni,
  };
}

/* ─── Il riepilogo ───────────────────────────────────────── */

/**
 * I numeri della prima schermata. Sono pochi di proposito: quelli che
 * dicono se c'e' del lavoro da fare adesso (ordini da preparare), e quelli
 * che dicono come sta andando il negozio.
 */
export function riepilogoNegozio() {
  const articoli = getArticoli();
  const ordini = getOrdini();
  const validi = ordini.filter((o) => o.stato !== 'annullato');
  const conta = (stato) => ordini.filter((o) => o.stato === stato).length;
  return {
    articoli: articoli.length,
    inVendita: articoli.filter(disponibile).length,
    inOfferta: articoli.filter((a) => prezzoDi(a).inOfferta).length,
    esauriti: articoli.filter((a) => a.scorta === 0).length,
    ordini: ordini.length,
    nuovi: conta('nuovo'),
    preparazione: conta('preparazione'),
    consegnati: conta('consegnato'),
    annullati: conta('annullato'),
    incassato: validi.reduce((somma, o) => somma + totaleOrdine(o), 0),
    incassatoMerce: validi.reduce((somma, o) => somma + (Number(o.crediti) || 0), 0),
    incassatoSpedizioni: validi.reduce((somma, o) => somma + (Number(o.spedizione) || 0), 0),
  };
}
