/**
 * Il listino: che cosa si vende, a che prezzo, e con quali offerte.
 *
 * Fino a ieri il commercio di Achivia stava scritto dentro il codice, in
 * quattro numeri sparsi in due file: cinque posti nel freemium, un annuncio
 * senza abbonamento e cinque con, tre prezzi per il risalto. Cambiarne uno
 * voleva dire aprire un file, ricompilare e ripubblicare — cioe' non
 * cambiarlo mai, perche' nessuno ripubblica un'applicazione per provare uno
 * sconto. Ed era anche un modo di dire che di prodotto ce n'e' uno solo:
 * "premium" era un interruttore, e un interruttore non ha piani.
 *
 * Qui il listino diventa dei dati. Tre collezioni:
 *
 *  - i **piani**, che sono l'abbonamento: un nome, un prezzo in euro, una
 *    periodicita' e i limiti che quel piano concede — posti, annunci,
 *    assistente, crediti mensili. Il freemium e' un piano come gli altri,
 *    con prezzo zero: e' l'unico modo di non avere due sistemi, uno per
 *    quello che si paga e uno per quello che non si paga.
 *
 *  - i **pacchetti** di crediti, che si comprano con del denaro. Il cambio
 *    e' fisso e dichiarato: un centesimo, un credito. Il prezzo pieno di un
 *    pacchetto quindi non si sceglie, si calcola; quello che si sceglie e'
 *    lo sconto. Un prezzo fuori parita' si puo' comunque scrivere — a volte
 *    serve — ma si vede che e' fuori parita', invece di nascondersi.
 *
 *  - le **offerte**, che sono uno sconto con una finestra di validita' e,
 *    se si vuole, un tetto di attivazioni e un codice. Valgono su un piano,
 *    su un pacchetto o su tutto.
 *
 * Nessuno di questi tre oggetti sa chi puo' toccarlo: questo e' il
 * deposito. I permessi stanno un piano sopra, come per tutto il resto.
 */

import { db, ensureListino, nuovoId, save } from './nucleo';
import { orgPremium, tipoOrg } from './organizzazioni';

/* ─── Il denaro ──────────────────────────────────────────────
   I prezzi si tengono in centesimi di euro, interi. Un prezzo in virgola
   mobile e' un prezzo che prima o poi vale 9.989999999999999, e non e' una
   cosa che si possa mettere in una fattura. */

/** Da centesimi a come si scrive: `1250` diventa `12,50 €`. */
export const euro = (centesimi) =>
  `${((Number(centesimi) || 0) / 100).toFixed(2).replace('.', ',')} €`;

/**
 * Il cambio fra denaro e crediti: un centesimo vale un credito.
 *
 * Non si mostra a nessuno, e non e' una furbizia — e' che non aiuta
 * nessuno. Chi compra vuole sapere quanti crediti prende con cinquanta
 * euro, non a che cambio: "cinquemiladuecento crediti per cinquanta euro"
 * si legge da solo, "1 centesimo = 1 credito" fa fare un conto per
 * arrivare allo stesso posto. Serve qui dentro, a calcolare quanto un
 * pacchetto grande dia in piu' di uno piccolo, e resta qui dentro.
 *
 * Non e' negoziabile: se cambiasse, cambierebbe il significato di ogni
 * prezzo mai fatto. Sta scritto una volta e si sa dove guardare.
 */
export const CENTESIMI_PER_CREDITO = 1;

/** Quanti centesimi valgono, al cambio, tanti crediti. Uso interno. */
export const prezzoDiParita = (crediti) =>
  Math.max(0, Math.round(Number(crediti) || 0)) * CENTESIMI_PER_CREDITO;

/* ─── I piani ────────────────────────────────────────────────*/

/**
 * I limiti che un piano concede: sono le sei cose che l'abbonamento paga.
 *
 *   posti          quante persone stanno dentro, admin e co-admin compresi.
 *                  `null` vuol dire senza limite — non `Infinity`, che in
 *                  JSON diventa `null` da solo: meglio scriverlo apposta che
 *                  scoprirlo.
 *   annunci        quanti annunci di lavoro si tengono aperti insieme.
 *   azioniAi       quante domande al mese si possono fare all'assistente,
 *                  per organizzazione. Zero vuol dire niente assistente.
 *   creditiMensili quanti crediti il piano mette a disposizione ogni trenta
 *                  giorni. Escono solo dopo un pagamento: vedi `pagamenti`.
 *   osservatorio   'no', 'profili' (solo chi cerca lavoro) o 'completo'.
 *   pubblicita     'tutta'  banner e uno spot a ogni quest assegnata
 *                  'banner' solo i banner
 *                  'no'     niente, nemmeno i banner
 */
const LIMITI_VUOTI = {
  posti: 5,
  annunci: 1,
  azioniAi: 0,
  creditiMensili: 0,
  osservatorio: 'no',
  pubblicita: 'tutta',
};

export const LIVELLI_OSSERVATORIO = [
  { id: 'no', nome: 'Nessun accesso' },
  { id: 'profili', nome: 'Solo i profili che cercano lavoro' },
  { id: 'completo', nome: 'Tutto l’osservatorio' },
];

export const LIVELLI_PUBBLICITA = [
  { id: 'tutta', nome: 'Banner e spot a ogni quest assegnata' },
  { id: 'banner', nome: 'Solo i banner' },
  { id: 'no', nome: 'Nessuna pubblicita’' },
];

/**
 * I quattro piani.
 *
 * Standard e' il punto di partenza di tutti e costa zero: e' un piano come
 * gli altri, non un'eccezione, ed e' l'unico modo di non avere due sistemi
 * — uno per quello che si paga e uno per quello che non si paga. Si
 * mantiene con la pubblicita', che e' l'altra faccia dello stesso patto:
 * chi non paga in denaro paga in attenzione, e chi paga se la toglie.
 *
 * Salendo, ogni gradino aggiunge quattro cose insieme — piu' persone, piu'
 * annunci, piu' assistente, piu' crediti — e ne toglie una: la pubblicita'.
 * Silver toglie lo spot e lascia i banner; Gold toglie anche quelli.
 * L'osservatorio entra da Gold in poi, prima una pagina sola e poi tutto.
 *
 * Restano qui dentro anche dopo essere stati copiati nel deposito, e
 * servono da rete: se il listino e' vuoto o un'organizzazione punta a un
 * piano che non c'e' piu', l'applicazione risponde lo stesso invece di
 * lasciare un'azienda senza posti.
 */
export const PIANI_DI_PARTENZA = [
  {
    id: 'piano-standard',
    nome: 'Standard',
    descrizione: 'Da qui parte chiunque. Cinque persone, un annuncio, e la pubblicita’ a pagare il conto.',
    prezzo: 0,
    periodicita: 'mensile',
    perTipo: 'azienda',
    ordine: 0,
    attivo: true,
    limiti: {
      posti: 5, annunci: 1, azioniAi: 0, creditiMensili: 0,
      osservatorio: 'no', pubblicita: 'tutta',
    },
  },
  {
    id: 'piano-silver',
    nome: 'Silver',
    descrizione: 'Per micro imprese e piccole organizzazioni: dieci persone, tre annunci, e l’assistente che legge i dati.',
    prezzo: 1500,
    periodicita: 'mensile',
    perTipo: 'azienda',
    ordine: 1,
    attivo: true,
    limiti: {
      posti: 10, annunci: 3, azioniAi: 20, creditiMensili: 800,
      osservatorio: 'no', pubblicita: 'banner',
    },
  },
  {
    id: 'piano-gold',
    nome: 'Gold',
    descrizione: 'Per piccole imprese: venticinque persone, cinque annunci, nessuna pubblicita’ e i profili di chi cerca lavoro.',
    prezzo: 2500,
    periodicita: 'mensile',
    perTipo: 'azienda',
    ordine: 2,
    attivo: true,
    limiti: {
      posti: 25, annunci: 5, azioniAi: 50, creditiMensili: 1800,
      osservatorio: 'profili', pubblicita: 'no',
    },
  },
  {
    id: 'piano-diamond',
    nome: 'Diamond',
    descrizione: 'Per medie aziende: centocinquanta persone, venti annunci, e tutto l’osservatorio.',
    prezzo: 10000,
    periodicita: 'mensile',
    perTipo: 'azienda',
    ordine: 3,
    attivo: true,
    limiti: {
      posti: 150, annunci: 20, azioniAi: 350, creditiMensili: 6000,
      osservatorio: 'completo', pubblicita: 'no',
    },
  },

  /* I piani dei gruppi.
     Stessi quattro nomi e un prodotto completamente diverso: qui si compra
     una cosa sola, quante persone ci stanno, piu' il silenzio dalla
     pubblicita' salendo. Niente annunci di lavoro, niente assistente,
     niente osservatorio, niente crediti mensili — un gruppo non assume, non
     ha performance da far leggere a nessuno, non finisce nei conti del
     mercato e i crediti se li compra quando gli servono.
     I prezzi sono un terzo abbondante di quelli delle aziende, ed e'
     giusto cosi': una famiglia di otto persone e una squadra di
     venticinque non stanno comprando quello che compra un'impresa. */
  {
    id: 'gruppo-standard',
    nome: 'Standard',
    descrizione: 'Da qui parte ogni gruppo. Cinque persone, e la pubblicita’ a pagare il conto.',
    prezzo: 0,
    periodicita: 'mensile',
    perTipo: 'personalizzata',
    ordine: 0,
    attivo: true,
    limiti: {
      posti: 5, annunci: 0, azioniAi: 0, creditiMensili: 0,
      osservatorio: 'no', pubblicita: 'tutta',
    },
  },
  {
    id: 'gruppo-silver',
    nome: 'Silver',
    descrizione: 'Per gruppi piccoli: dieci persone, e niente piu’ pubblicita’ quando si assegna una quest.',
    prezzo: 500,
    periodicita: 'mensile',
    perTipo: 'personalizzata',
    ordine: 1,
    attivo: true,
    limiti: {
      posti: 10, annunci: 0, azioniAi: 0, creditiMensili: 0,
      osservatorio: 'no', pubblicita: 'banner',
    },
  },
  {
    id: 'gruppo-gold',
    nome: 'Gold',
    descrizione: 'Per gruppi di media misura: venticinque persone e nessuna pubblicita’.',
    prezzo: 1000,
    periodicita: 'mensile',
    perTipo: 'personalizzata',
    ordine: 2,
    attivo: true,
    limiti: {
      posti: 25, annunci: 0, azioniAi: 0, creditiMensili: 0,
      osservatorio: 'no', pubblicita: 'no',
    },
  },
  {
    id: 'gruppo-diamond',
    nome: 'Diamond',
    descrizione: 'Per gruppi grandi: centocinquanta persone e nessuna pubblicita’, nemmeno i banner.',
    prezzo: 2000,
    periodicita: 'mensile',
    perTipo: 'personalizzata',
    ordine: 3,
    attivo: true,
    limiti: {
      posti: 150, annunci: 0, azioniAi: 0, creditiMensili: 0,
      osservatorio: 'no', pubblicita: 'no',
    },
  },
];

/**
 * Dove mandare chi non ci sta in nessuno dei quattro.
 *
 * Sopra i centocinquanta il piano si fa a mano, e non e' una mancanza: una
 * media azienda che ne ha cinquecento vuole parlare con qualcuno prima di
 * mettere una carta, e un quinto pulsante non le avrebbe risposto.
 */
export const EMAIL_SU_MISURA = 'info@xpl4b.com';

const numero = (v, minimo = 0) => Math.max(minimo, Math.round(Number(v) || 0));

/* Un piano scritto a mano, o rimasto da una versione precedente, passa di
   qui prima di essere letto: i campi che mancano prendono il valore di
   partenza, quelli scritti male tornano nell'insieme dei valori possibili.
   `assistente` era un si'/no ed e' diventato un numero di azioni: chi ce
   l'ha ancora si legge come venti, che e' il piano piu' piccolo che
   l'assistente ce l'ha. */
const normalizzaLimiti = (l = {}) => {
  const dai = { ...LIMITI_VUOTI, ...l };
  return {
    posti: dai.posti == null ? null : numero(dai.posti, 1),
    annunci: numero(dai.annunci),
    azioniAi: dai.azioniAi != null ? numero(dai.azioniAi) : (dai.assistente ? 20 : 0),
    creditiMensili: numero(dai.creditiMensili),
    osservatorio: LIVELLI_OSSERVATORIO.some((x) => x.id === dai.osservatorio) ? dai.osservatorio : 'no',
    pubblicita: LIVELLI_PUBBLICITA.some((x) => x.id === dai.pubblicita) ? dai.pubblicita : 'tutta',
  };
};

const normalizzaPiano = (p) => ({
  ...p,
  prezzo: Math.max(0, Math.round(Number(p.prezzo) || 0)),
  attivo: p.attivo !== false,
  ordine: Number(p.ordine) || 0,
  perTipo: ['azienda', 'personalizzata', 'tutti'].includes(p.perTipo) ? p.perTipo : 'tutti',
  periodicita: p.periodicita === 'annuale' ? 'annuale' : 'mensile',
  limiti: normalizzaLimiti(p.limiti),
});

/** Tutti i piani, in ordine di listino. */
export function getPiani() {
  ensureListino();
  const righe = db.piani.length ? db.piani : PIANI_DI_PARTENZA;
  return righe.map(normalizzaPiano).sort((a, b) => a.ordine - b.ordine || a.prezzo - b.prezzo);
}

/** Un piano per id, gia' normalizzato. `null` se non esiste. */
export const getPiano = (id) => getPiani().find((p) => p.id === id) || null;

/** I piani che un'organizzazione di questo tipo puo' comprare. */
export const pianiPer = (tipo) =>
  getPiani().filter((p) => p.attivo && (p.perTipo === 'tutti' || p.perTipo === tipo));

/**
 * Scrive un piano: lo crea se l'id non c'e', lo aggiorna se c'e'.
 *
 * Alla prima scrittura il listino si popola con i due piani di partenza
 * prima di ricevere il nuovo: senza, cambiare il prezzo del premium
 * cancellerebbe il free, che nel deposito non c'era mai stato.
 */
export function salvaPiano(patch) {
  ensureListino();
  if (!db.piani.length) db.piani = PIANI_DI_PARTENZA.map((p) => ({ ...p, limiti: { ...p.limiti } }));
  const id = patch?.id || nuovoId('piano');
  const i = db.piani.findIndex((p) => p.id === id);
  const prima = i >= 0 ? db.piani[i] : null;
  const riga = normalizzaPiano({
    ...(prima || { creatoIl: new Date().toISOString() }),
    ...patch,
    id,
    limiti: { ...LIMITI_VUOTI, ...(prima?.limiti || {}), ...(patch?.limiti || {}) },
    aggiornatoIl: new Date().toISOString(),
  });
  if (i >= 0) db.piani[i] = riga; else db.piani.push(riga);
  if (!save()) {
    if (i >= 0) db.piani[i] = prima; else db.piani.pop();
    return null;
  }
  return riga;
}

/**
 * Toglie un piano dal listino.
 *
 * Solo se non lo sta usando nessuno: un'organizzazione che punta a un piano
 * cancellato ricadrebbe sui limiti del freemium da un momento all'altro, e
 * un'azienda che paga non deve perdere i posti perche' qualcuno ha fatto
 * ordine nel listino. Chi non si vuole piu' vendere si spegne (`attivo`),
 * che lo toglie dalla vetrina e lascia in pace chi ce l'ha.
 */
export function eliminaPiano(id) {
  ensureListino();
  const usato = Object.values(db.organizzazioni || {}).some((o) => o.pianoId === id);
  if (usato) return { ok: false, errore: 'Questo piano e’ in uso: puoi spegnerlo, non cancellarlo.' };
  const prima = db.piani.length;
  db.piani = db.piani.filter((p) => p.id !== id);
  if (db.piani.length === prima) return { ok: false, errore: 'Piano non trovato.' };
  save();
  return { ok: true };
}

/**
 * Il piano di un'organizzazione.
 *
 * L'abbonamento e' rimasto quello che era — un interruttore sul registro
 * delle organizzazioni — e qui si traduce in un piano: chi ne ha uno scritto
 * tiene quello, chi paga e non l'ha scritto sta sul premium, chi non paga
 * sul free. Cosi' le duecento righe dell'applicazione che chiedono
 * `orgPremium` continuano a funzionare, e intanto i limiti vengono da un
 * posto solo che si puo' cambiare da fuori.
 */
export function pianoDiOrg(orgId) {
  ensureListino();
  const scritto = orgId ? db.organizzazioni?.[orgId]?.pianoId : null;
  const suo = scritto ? getPiano(scritto) : null;
  if (suo) return suo;
  /* Chi paga e non dice quale piano finisce sul piu' alto del suo listino,
     chi non paga sullo Standard. E' la risposta per i dati nati quando
     l'abbonamento era un interruttore e i piani non c'erano: togliere posti
     a chi paga sarebbe il modo peggiore di sbagliare.
     I due listini sono separati: un gruppo non finisce su un piano da
     azienda nemmeno per ripiego, o si ritroverebbe annunci di lavoro e
     osservatorio che non gli servono e non gli spettano. */
  const gruppo = tipoOrg(orgId) === 'personalizzata';
  const quale = orgPremium(orgId)
    ? (gruppo ? 'gruppo-diamond' : 'piano-diamond')
    : (gruppo ? 'gruppo-standard' : 'piano-standard');
  return getPiano(quale) || normalizzaPiano(PIANI_DI_PARTENZA[0]);
}

/** I limiti in vigore per un'organizzazione, adesso. */
export const limitiDiOrg = (orgId) => pianoDiOrg(orgId).limiti;

/* ─── Le tre domande che le schermate fanno davvero ──────────
   Non "che piano ha", ma "puo' fare questo". Chi chiama non deve sapere
   come si chiamano i piani ne' quanti sono: il giorno in cui se ne aggiunge
   uno, queste tre righe restano quelle che sono. */

/**
 * Che pubblicita' vede questa organizzazione.
 *
 * Chi non paga in denaro paga in attenzione. Chi paga se la toglie: prima
 * lo spot che parte a ogni quest assegnata, che e' quello che da' piu'
 * fastidio perche' si mette in mezzo a un gesto di lavoro, e poi anche i
 * banner.
 */
export const pubblicitaDiOrg = (orgId) => limitiDiOrg(orgId).pubblicita;
export const vedeBanner = (orgId) => pubblicitaDiOrg(orgId) !== 'no';
export const vedeSpotSullaQuest = (orgId) => pubblicitaDiOrg(orgId) === 'tutta';

/** Quante domande al mese puo' fare all'assistente. Zero: non ce l'ha. */
export const azioniAiDiPiano = (orgId) => limitiDiOrg(orgId).azioniAi;

/** Che parte dell'osservatorio le e' aperta: 'no', 'profili' o 'completo'. */
export const osservatorioDiOrg = (orgId) => limitiDiOrg(orgId).osservatorio;

/** I crediti che il piano mette a disposizione ogni trenta giorni. */
export const creditiMensiliDiOrg = (orgId) => limitiDiOrg(orgId).creditiMensili;

/* ─── I pacchetti di crediti ─────────────────────────────────*/

/**
 * Un pacchetto come lo si vende: un prezzo e dei crediti.
 *
 * Tutti e due si scrivono, e non e' una ridondanza: e' il posto in cui si
 * decide quanto vale comprare in blocco. Sotto c'e' una parita' — un
 * centesimo, un credito — che non si mostra a nessuno e serve solo qui, a
 * calcolare quanti crediti sono in piu' rispetto al prezzo pagato.
 * `bonus` e' quel numero, ed e' l'unica cosa che si dice a chi compra:
 * "cinquemiladuecento crediti per cinquanta euro" si legge da solo, "1
 * centesimo = 1 credito" no.
 *
 * Le righe scritte prima avevano un prezzo calcolato da uno sconto in
 * percentuale. Continuano a leggersi cosi': il prezzo si ricava dallo
 * sconto solo quando non c'e' scritto.
 */
export function rigaPacchetto(p) {
  if (!p) return null;
  const crediti = Math.max(0, Math.round(Number(p.crediti) || 0));
  const allaPari = prezzoDiParita(crediti);
  const sconto = Math.min(100, Math.max(0, Number(p.sconto) || 0));
  const prezzo = p.prezzo == null
    ? Math.round(allaPari * (1 - sconto / 100))
    : Math.max(0, Math.round(Number(p.prezzo)));
  // Quanti crediti si prendono in piu' di quelli che il prezzo, da solo,
  // pagherebbe. Zero su un pacchetto senza vantaggio, e non e' un errore:
  // il primo scalino di un listino di solito non ne ha.
  const bonus = Math.max(0, crediti - Math.round(prezzo / CENTESIMI_PER_CREDITO));
  return {
    id: p.id,
    nome: p.nome || '',
    crediti,
    prezzo,
    bonus,
    bonusPct: crediti > bonus && bonus > 0 ? Math.round((bonus / (crediti - bonus)) * 100) : 0,
    attivo: p.attivo !== false,
    ordine: Number(p.ordine) || 0,
    creatoIl: p.creatoIl ?? null,
    aggiornatoIl: p.aggiornatoIl ?? null,
  };
}

/**
 * I sei pacchetti di partenza.
 *
 * Il primo scalino e' alla pari, e da li' in su ogni scalino da' qualcosa
 * in piu': comprare in blocco conviene, e il vantaggio cresce con la
 * taglia. E' l'unica leva che spinge verso i tagli grandi senza toccare il
 * prezzo del piu' piccolo.
 */
export const PACCHETTI_DI_PARTENZA = [
  { id: 'pac-10', nome: '1.000 crediti', prezzo: 1000, crediti: 1000, ordine: 0, attivo: true },
  { id: 'pac-20', nome: '2.000 crediti', prezzo: 2000, crediti: 2000, ordine: 1, attivo: true },
  { id: 'pac-50', nome: '5.200 crediti', prezzo: 5000, crediti: 5200, ordine: 2, attivo: true },
  { id: 'pac-100', nome: '10.500 crediti', prezzo: 10000, crediti: 10500, ordine: 3, attivo: true },
  { id: 'pac-250', nome: '26.500 crediti', prezzo: 25000, crediti: 26500, ordine: 4, attivo: true },
  { id: 'pac-500', nome: '55.000 crediti', prezzo: 50000, crediti: 55000, ordine: 5, attivo: true },
];

/** Tutti i pacchetti, dal piu' piccolo. */
export function getPacchetti() {
  ensureListino();
  return db.pacchetti.map(rigaPacchetto).sort((a, b) => a.ordine - b.ordine || a.crediti - b.crediti);
}

export const getPacchetto = (id) => getPacchetti().find((p) => p.id === id) || null;

/** Quelli che si possono comprare adesso. */
export const pacchettiInVendita = () => getPacchetti().filter((p) => p.attivo && p.crediti > 0);

export function salvaPacchetto(patch) {
  ensureListino();
  const id = patch?.id || nuovoId('pac');
  const i = db.pacchetti.findIndex((p) => p.id === id);
  const prima = i >= 0 ? db.pacchetti[i] : null;
  const riga = {
    ...(prima || { creatoIl: new Date().toISOString() }),
    ...patch,
    id,
    aggiornatoIl: new Date().toISOString(),
  };
  if (i >= 0) db.pacchetti[i] = riga; else db.pacchetti.push(riga);
  if (!save()) {
    if (i >= 0) db.pacchetti[i] = prima; else db.pacchetti.pop();
    return null;
  }
  return rigaPacchetto(riga);
}

export function eliminaPacchetto(id) {
  ensureListino();
  const prima = db.pacchetti.length;
  db.pacchetti = db.pacchetti.filter((p) => p.id !== id);
  if (db.pacchetti.length === prima) return { ok: false, errore: 'Pacchetto non trovato.' };
  save();
  return { ok: true };
}

/* ─── Il risalto degli annunci ───────────────────────────────*/

/**
 * Quanto costa tenere un annuncio in cima, e per quanto.
 *
 * E' l'unica cosa che si compra con i crediti invece che con del denaro, e
 * l'unica che si vende anche a chi non ha l'abbonamento: e' il modo in cui
 * chi sta nel freemium puo' comunque spendere per farsi vedere. I numeri
 * erano scritti nel codice con la nota "provvisori, vanno decisi": stanno
 * qui perche' si possano decidere.
 */
export const RISALTO_DI_PARTENZA = [
  { settimane: 1, costo: 300 },
  { settimane: 2, costo: 500 },
  { settimane: 4, costo: 900 },
];

export function getRisalto() {
  ensureListino();
  const righe = db.risalto?.length ? db.risalto : RISALTO_DI_PARTENZA;
  return righe
    .map((r) => ({ settimane: Math.max(1, Math.round(Number(r.settimane) || 1)), costo: Math.max(0, Math.round(Number(r.costo) || 0)) }))
    .sort((a, b) => a.settimane - b.settimane);
}

/** Riscrive il tariffario del risalto, tutto insieme: sono tre righe. */
export function salvaRisalto(righe) {
  ensureListino();
  const prima = db.risalto;
  db.risalto = (righe || []).map((r) => ({ settimane: Number(r.settimane), costo: Number(r.costo) }));
  if (!save()) { db.risalto = prima; return null; }
  return getRisalto();
}

/* ─── Le offerte ─────────────────────────────────────────────*/

/**
 * Che cosa toglie un'offerta.
 *
 * `percentuale` e `importo` tolgono dal prezzo; `crediti_extra` non tocca
 * il prezzo e aggiunge crediti al pacchetto, che e' l'altro modo di fare
 * uno sconto e a volte quello che si legge meglio ("il doppio dei crediti"
 * suona diverso da "meta' prezzo", anche quando e' la stessa cosa).
 */
export const TIPI_OFFERTA = [
  { id: 'percentuale', nome: 'Sconto in percentuale', unita: '%' },
  { id: 'importo', nome: 'Sconto in euro', unita: '€' },
  { id: 'crediti_extra', nome: 'Crediti in piu’', unita: 'crediti' },
];

const normalizzaOfferta = (o) => ({
  ...o,
  su: ['piano', 'pacchetto', 'tutto'].includes(o.su) ? o.su : 'tutto',
  bersaglioId: o.bersaglioId ?? null,
  tipo: TIPI_OFFERTA.some((t) => t.id === o.tipo) ? o.tipo : 'percentuale',
  valore: Math.max(0, Number(o.valore) || 0),
  da: o.da || null,
  a: o.a || null,
  tetto: o.tetto == null ? null : Math.max(0, Math.round(Number(o.tetto))),
  usi: Math.max(0, Math.round(Number(o.usi) || 0)),
  codice: (o.codice || '').trim().toUpperCase() || null,
  attiva: o.attiva !== false,
});

export function getOfferte() {
  ensureListino();
  return db.offerte.map(normalizzaOfferta)
    .sort((a, b) => String(b.da || '').localeCompare(String(a.da || '')));
}

export const getOfferta = (id) => getOfferte().find((o) => o.id === id) || null;

/**
 * Se un'offerta vale adesso: accesa, dentro la finestra, e non esaurita.
 *
 * Una finestra aperta da un lato e' legittima: "da oggi in poi" e "fino a
 * fine mese" sono due offerte che si scrivono davvero.
 */
export function offertaValida(o, adesso = Date.now()) {
  if (!o?.attiva) return false;
  if (o.da && new Date(o.da).getTime() > adesso) return false;
  // La data di fine si intende compresa: chi scrive "fino al 31" intende il
  // 31 intero, non il 31 alle zero e zero.
  if (o.a && new Date(o.a).getTime() + 86399999 < adesso) return false;
  if (o.tetto != null && o.usi >= o.tetto) return false;
  return true;
}

/**
 * Le offerte in corso su una cosa. `codice` serve a far entrare anche
 * quelle che si attivano solo scrivendolo: senza, restano fuori.
 */
export function offerteAttivePer(su, bersaglioId, { adesso = Date.now(), codice } = {}) {
  const scritto = (codice || '').trim().toUpperCase();
  return getOfferte().filter((o) => {
    if (!offertaValida(o, adesso)) return false;
    if (o.su !== 'tutto' && o.su !== su) return false;
    if (o.bersaglioId && o.bersaglioId !== bersaglioId) return false;
    if (o.codice) return o.codice === scritto;
    return true;
  });
}

/**
 * Il prezzo di una cosa dopo le offerte.
 *
 * Non si sommano: si applica la migliore. Sommarle e' il modo piu' rapido
 * di regalare qualcosa senza essersene accorti, e due offerte contemporanee
 * sullo stesso prodotto capitano — una stagionale e un codice — senza che
 * nessuno abbia mai deciso che debbano cumularsi.
 */
export function prezzoConOfferte({ su, bersaglioId, prezzo, crediti = 0 }, opzioni = {}) {
  const pieno = Math.max(0, Math.round(Number(prezzo) || 0));
  let migliore = null;
  let finale = pieno;
  let creditiFinali = crediti;
  for (const o of offerteAttivePer(su, bersaglioId, opzioni)) {
    const p = o.tipo === 'percentuale' ? Math.round(pieno * (1 - o.valore / 100))
      : o.tipo === 'importo' ? Math.max(0, pieno - Math.round(o.valore))
        : pieno;
    const c = o.tipo === 'crediti_extra' ? crediti + Math.round(o.valore) : crediti;
    // "Migliore" e' quella che fa risparmiare di piu': fra uno sconto e dei
    // crediti in piu' si confronta quanto valgono, non che forma hanno.
    const vale = (pieno - p) + (c - crediti) * CENTESIMI_PER_CREDITO;
    const valeOra = (pieno - finale) + (creditiFinali - crediti) * CENTESIMI_PER_CREDITO;
    if (vale > valeOra) { migliore = o; finale = p; creditiFinali = c; }
  }
  return { pieno, finale, crediti: creditiFinali, risparmio: pieno - finale, offerta: migliore };
}

export function salvaOfferta(patch) {
  ensureListino();
  const id = patch?.id || nuovoId('off');
  const i = db.offerte.findIndex((o) => o.id === id);
  const prima = i >= 0 ? db.offerte[i] : null;
  const riga = normalizzaOfferta({
    ...(prima || { creataIl: new Date().toISOString(), usi: 0 }),
    ...patch,
    id,
  });
  if (i >= 0) db.offerte[i] = riga; else db.offerte.push(riga);
  if (!save()) {
    if (i >= 0) db.offerte[i] = prima; else db.offerte.pop();
    return null;
  }
  return riga;
}

export function eliminaOfferta(id) {
  ensureListino();
  const prima = db.offerte.length;
  db.offerte = db.offerte.filter((o) => o.id !== id);
  if (db.offerte.length === prima) return { ok: false, errore: 'Offerta non trovata.' };
  save();
  return { ok: true };
}

/** Segna che un'offerta e' stata usata una volta in piu'. */
export function segnaUsoOfferta(id) {
  ensureListino();
  const o = db.offerte.find((x) => x.id === id);
  if (!o) return null;
  o.usi = (Number(o.usi) || 0) + 1;
  save();
  return normalizzaOfferta(o);
}

/* ─── Il listino visto da chi compra ─────────────────────────*/

/** I piani che si possono comprare qui, con il prezzo di adesso. */
export const vetrinaPiani = (orgId, opzioni = {}) =>
  pianiPer(tipoOrg(orgId)).map((p) => ({
    ...p,
    ...prezzoConOfferte({ su: 'piano', bersaglioId: p.id, prezzo: p.prezzo }, opzioni),
    corrente: pianoDiOrg(orgId).id === p.id,
  }));

/** I pacchetti in vendita, con il prezzo e i crediti di adesso. */
export const vetrinaPacchetti = (opzioni = {}) =>
  pacchettiInVendita().map((p) => ({
    ...p,
    ...prezzoConOfferte({ su: 'pacchetto', bersaglioId: p.id, prezzo: p.prezzo, crediti: p.crediti }, opzioni),
  }));
