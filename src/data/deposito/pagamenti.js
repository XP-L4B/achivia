/**
 * I pagamenti, e i crediti che ne escono.
 *
 * La regola e' una e non si aggira: **i crediti del piano si distribuiscono
 * solo dopo il pagamento**. Non alla scadenza, non all'apertura
 * dell'abbonamento, non perche' sono passati trenta giorni — dopo un
 * pagamento incassato. Un'applicazione che regala la dotazione di un mese
 * non pagato regala esattamente quello che vende.
 *
 * Il pagamento non arriva ancora da un servizio esterno: nessuno l'ha
 * collegato. Lo registra a mano chi tiene il Castello, ed e' il modo giusto
 * di farlo funzionare oggi invece di rimandare tutto: il giorno in cui il
 * servizio arriva, chiamera' `registraPagamento` al posto suo e il resto —
 * il periodo che si apre, la dotazione che esce, la riga che resta — e' gia'
 * scritto e gia' provato.
 *
 * Dove vanno i crediti. Nella cassa dell'organizzazione, che e' il secondo
 * portafoglio di questa applicazione ed e' nato per questo. Metterli sul
 * conto del proprietario avrebbe funzionato per un'organizzazione con un
 * capo solo e sarebbe stato falso per tutte le altre: quei crediti sono
 * dell'azienda, non suoi, e quando cambia proprietario non se li porta via.
 * Dalla cassa li distribuisce chi ne ha il permesso — vedi `cassa.js`.
 */

import { db, ensurePagamenti, nuovoId, save } from './nucleo';
import { getOrganizzazione, salvaOrganizzazione } from './organizzazioni';
import { pianoDiOrg, getPiano } from './listino';
import { segnaAbbonamento, eraPremium } from './lavoro';
import { muoviCassa, movimenti } from './crediti';

/* Ogni quanto esce la dotazione. Trenta giorni, non "un mese": un mese dura
   fra ventotto e trentuno giorni e la differenza, su un anno, e' quasi una
   dotazione intera. */
export const GIORNI_DOTAZIONE = 30;

/** I pagamenti registrati, dal piu' recente. */
export function getPagamenti({ orgId } = {}) {
  ensurePagamenti();
  return db.pagamenti
    .filter((p) => !orgId || p.orgId === orgId)
    .sort((a, b) => String(b.quando).localeCompare(String(a.quando)));
}

/** L'ultimo pagamento di un'organizzazione. `null` se non ne ha mai fatti. */
export const ultimoPagamento = (orgId) => getPagamenti({ orgId })[0] || null;

/**
 * Il periodo in corso di un'organizzazione: da quando a quando.
 *
 * E' l'unico calendario che questa applicazione riconosce, e non e' il
 * calendario. Un tetto mensile che riparte il primo del mese e un
 * abbonamento che riparte il giorno del pagamento sono due orologi diversi
 * sullo stesso muro: chi paga il 20 si ritroverebbe dieci giorni di
 * assistente per la prima quota, e non lo capirebbe. Quindi tutto quello
 * che si conta "al mese" — le domande all'assistente, i crediti del piano —
 * si conta a trenta giorni dall'ultimo pagamento.
 *
 * Senza pagamenti registrati resta una finestra mobile sugli ultimi trenta
 * giorni: un conto deve pur partire da qualche parte, e un'organizzazione
 * che non ha ancora pagato non e' un'organizzazione senza diritti — e'
 * un'organizzazione a cui non abbiamo ancora segnato l'incasso.
 */
export function periodoDelPiano(orgId, adesso = Date.now()) {
  const pagato = ultimoPagamento(orgId);
  const durata = GIORNI_DOTAZIONE * 86400000;
  if (!pagato) {
    return { da: new Date(adesso - durata).toISOString(), a: new Date(adesso).toISOString(), quale: 0 };
  }
  const inizio = new Date(pagato.quando).getTime();
  // Quanti periodi interi sono passati dal pagamento: si conta quello in
  // corso, non il primo. Un abbonamento annuale ne attraversa dodici, e
  // ognuno ha il suo tetto.
  const quale = Math.max(0, Math.floor((adesso - inizio) / durata));
  const da = inizio + quale * durata;
  return { da: new Date(da).toISOString(), a: new Date(da + durata).toISOString(), quale };
}

/** L'ultima dotazione entrata nella cassa di un'organizzazione. */
export const ultimaDotazione = (orgId) =>
  movimenti({ orgId, causale: 'dotazione', cassa: true })[0] || null;

/**
 * Se all'organizzazione tocca la dotazione, e perche' no quando no.
 *
 * Tre condizioni, tutte necessarie: il piano deve prevederne, l'abbonamento
 * deve essere aperto adesso ("fintanto che attivo"), e devono essere passati
 * trenta giorni dall'ultima. La prima volta basta un pagamento.
 */
export function dotazioneDovuta(orgId, adesso = Date.now()) {
  const piano = pianoDiOrg(orgId);
  const quanti = piano.limiti.creditiMensili;
  /* `perche'` e' un codice e non il testo: chi decide qualcosa in base al
     motivo lo fa su quello, non su una frase che un giorno si riscrive. */
  if (!quanti) {
    return { dovuta: false, perche: 'senza-crediti', motivo: 'Il piano non prevede crediti mensili.', quanti: 0 };
  }
  if (!eraPremium(orgId, new Date(adesso).toISOString())) {
    return { dovuta: false, perche: 'non-abbonata', motivo: 'L’abbonamento non è attivo.', quanti };
  }
  if (!ultimoPagamento(orgId)) {
    return { dovuta: false, perche: 'mai-pagato', motivo: 'Nessun pagamento registrato.', quanti };
  }
  /* La dotazione e' una per periodo, e il periodo e' quello del piano: se
     in quello in corso e' gia' uscita, non ne esce un'altra. Prima il conto
     si faceva sui trenta giorni dall'ultima dotazione, che e' quasi sempre
     la stessa cosa e ogni tanto no — una dotazione data in ritardo
     spostava in avanti tutte quelle dopo, e in un anno si perdeva un mese. */
  const periodo = periodoDelPiano(orgId, adesso);
  const ultima = ultimaDotazione(orgId);
  if (!ultima) return { dovuta: true, perche: '', motivo: '', quanti, periodo };
  const quando = new Date(ultima.creatoIl).getTime();
  if (quando >= new Date(periodo.da).getTime()) {
    const giorni = Math.max(0, Math.ceil((new Date(periodo.a).getTime() - adesso) / 86400000));
    return {
      dovuta: false,
      perche: 'gia-data',
      quanti,
      periodo,
      motivo: `Mancano ${giorni} giorni alla prossima.`,
    };
  }
  return { dovuta: true, perche: '', motivo: '', quanti, periodo };
}

/**
 * Fa uscire la dotazione del periodo, una volta sola.
 *
 * `forza` serve al momento del pagamento: li' i trenta giorni non contano —
 * si e' appena pagato — mentre restano le altre due condizioni, che il piano
 * ne preveda e che l'abbonamento sia aperto. Fuori da quel caso non si
 * forza: sarebbe il modo di dare due dotazioni nello stesso mese senza
 * accorgersene.
 */
export function distribuisciDotazione(orgId, { forza = false, adesso = Date.now() } = {}) {
  const stato = dotazioneDovuta(orgId, adesso);
  /* `forza` salta un ostacolo solo, ed e' quello dei trenta giorni: si e'
     appena pagato, quindi il periodo e' nuovo. Le altre due condizioni —
     che il piano preveda crediti e che l'abbonamento sia aperto — restano,
     perche' saltarle vorrebbe dire dare crediti che nessuno ha comprato. */
  const saltabile = stato.perche === 'gia-data' || stato.perche === 'mai-pagato';
  if (!stato.dovuta && !(forza && saltabile)) {
    return { ok: false, errore: stato.motivo || 'Non tocca adesso.' };
  }
  /* I crediti del piano vanno nella cassa dell'organizzazione, non sul
     conto di una persona. Sono dell'azienda: chi la amministra li
     distribuisce, e quando cambia proprietario non se li porta via. */
  const riga = muoviCassa({
    orgId,
    quanti: stato.quanti,
    causale: 'dotazione',
    riferimento: pianoDiOrg(orgId).id,
  });
  if (!riga) return { ok: false, errore: 'Non è stato possibile mettere i crediti in cassa.' };
  save();
  return { ok: true, crediti: stato.quanti, movimento: riga.id, cassa: riga.saldo };
}

/**
 * Registra un pagamento: apre o rinnova l'abbonamento e fa uscire la
 * dotazione.
 *
 * Le tre cose succedono insieme perche' sono la stessa cosa vista da tre
 * parti — il denaro entrato, il diritto acquistato, i crediti dovuti — e
 * separarle vorrebbe dire poter avere un abbonamento senza pagamento o una
 * dotazione senza abbonamento. Sono i due errori che costano.
 *
 * `pianoId` si passa quando il pagamento cambia piano: chi sale a Gold paga
 * e sale nello stesso gesto. Senza, si rinnova quello che c'e'.
 */
export function registraPagamento({ orgId, pianoId, importo, daId, nota, quando } = {}) {
  ensurePagamenti();
  if (!getOrganizzazione(orgId)) return { ok: false, errore: 'Organizzazione non trovata.' };
  const piano = pianoId ? getPiano(pianoId) : pianoDiOrg(orgId);
  if (!piano) return { ok: false, errore: 'Piano non trovato.' };

  const adesso = quando ? new Date(quando).toISOString() : new Date().toISOString();
  const giorni = piano.periodicita === 'annuale' ? 365 : GIORNI_DOTAZIONE;
  const fino = new Date(new Date(adesso).getTime() + giorni * 86400000).toISOString();

  /* Il piano si scrive prima della dotazione: la dotazione legge il piano,
     e chi sale a Gold pagando deve prendere i crediti del Gold e non quelli
     del piano da cui viene. `premium` resta il si'/no che il resto
     dell'applicazione continua a chiedere, e adesso e' un derivato: paga
     chi sta su un piano che costa. */
  salvaOrganizzazione(orgId, { pianoId: piano.id, premium: piano.prezzo > 0 });
  if (piano.prezzo > 0) segnaAbbonamento(orgId, true, adesso);

  /* La riga del pagamento si scrive prima della dotazione, non dopo: il
     periodo del piano si conta dall'ultimo pagamento, e distribuire prima
     di averlo registrato vorrebbe dire farlo dentro il periodo vecchio. Il
     numero dei crediti si aggiunge subito dopo, quando si sa. */
  const riga = {
    id: nuovoId('pag'),
    orgId,
    pianoId: piano.id,
    piano: piano.nome,
    importo: importo == null ? piano.prezzo : Math.max(0, Math.round(Number(importo))),
    quando: adesso,
    copreFinoAl: fino,
    daId: daId ?? null,
    nota: String(nota || '').trim(),
    creditiDati: 0,
  };
  db.pagamenti.unshift(riga);

  const dotazione = distribuisciDotazione(orgId, { forza: true, adesso: new Date(adesso).getTime() });
  riga.creditiDati = dotazione.ok ? dotazione.crediti : 0;

  if (!save()) { db.pagamenti.shift(); return { ok: false, errore: 'Non è stato possibile salvare.' }; }
  return { ok: true, pagamento: riga, dotazione };
}

/** Quando scade quello che e' stato pagato. `null` se non ha mai pagato. */
export const copertoFinoAl = (orgId) => ultimoPagamento(orgId)?.copreFinoAl ?? null;

/**
 * Chi e' in ritardo: ha un abbonamento aperto ma il pagato e' scaduto.
 *
 * E' l'elenco su cui si lavora, e per questo sta qui e non in una schermata:
 * un'organizzazione che risulta abbonata e non paga da due mesi e' un buco
 * nei conti che non si vede da nessun altro numero.
 */
export function daRinnovare(adesso = Date.now()) {
  const righe = [];
  for (const [orgId, o] of Object.entries(db.organizzazioni || {})) {
    if (o.chiusaIl) continue;
    const piano = pianoDiOrg(orgId);
    if (piano.prezzo === 0) continue;
    const fino = copertoFinoAl(orgId);
    if (fino && new Date(fino).getTime() > adesso) continue;
    righe.push({
      orgId,
      nome: o.nome || orgId,
      piano: piano.nome,
      importo: piano.prezzo,
      copertoFinoAl: fino,
      // Mai pagato e' diverso da scaduto: il primo e' un incasso che non e'
      // mai partito, il secondo uno che si e' fermato.
      maiPagato: !fino,
      giorniScoperti: fino ? Math.floor((adesso - new Date(fino).getTime()) / 86400000) : null,
    });
  }
  return righe.sort((a, b) => (b.giorniScoperti ?? 9999) - (a.giorniScoperti ?? 9999));
}
