/**
 * Le domande all'assistente, contate.
 *
 * L'assistente c'era gia' e non lo pagava nessuno: un pannello in fondo al
 * profilo di ogni persona, due domande pronte e un campo libero, aperto a
 * chiunque gestisse qualcosa. Adesso e' uno dei quattro servizi che
 * l'abbonamento paga, e quello che si compra non e' l'accesso ma la
 * quantita': venti domande al mese con il Silver, cinquanta con il Gold,
 * trecentocinquanta con il Diamond, nessuna con lo Standard.
 *
 * Il tetto e' dell'organizzazione, non della persona: e' l'organizzazione
 * che paga, e chi la amministra si divide le domande come si divide ogni
 * altra cosa comprata insieme. Sono in due a guardare gli stessi profili, e
 * due contatori separati avrebbero voluto dire il doppio del piano.
 *
 * E il conto riparte trenta giorni dopo il pagamento, non il primo del
 * mese: l'abbonamento comincia il giorno in cui si paga, e tutto quello che
 * si conta "al mese" segue quel giorno.
 *
 * Ogni domanda lascia una riga invece di far crescere un numero. Costa
 * poco piu' — e' un elenco che nessuno legge tutto — e ripaga subito: si
 * puo' contare il mese scorso, si puo' sapere chi chiede e su che cosa, e
 * un mese che si azzera non cancella la storia di quello prima.
 */

import { db, ensureAzioniAi, nuovoId, save } from './nucleo';
import { limitiDiOrg } from './listino';
import { orgPersonalizzata } from './organizzazioni';
import { periodoDelPiano } from './pagamenti';

/**
 * Se in questa organizzazione l'assistente esiste come funzione.
 *
 * Nelle personalizzate no, e non e' "un piano che non lo comprende": non
 * c'e' proprio. L'assistente legge le performance delle persone e dice come
 * stanno andando, ed e' una cosa che si fa a dei dipendenti — in una
 * famiglia, in una squadra, in una classe non e' un servizio mancante, e'
 * un servizio fuori posto. Quindi il pannello non compare, e non compare
 * nemmeno l'invito a comprarlo.
 */
export const assistenteEsiste = (orgId) => Boolean(orgId) && !orgPersonalizzata(orgId);

/** Quante domande al mese concede il piano. Zero: l'assistente non c'e'. */
export const tettoAzioniAi = (orgId) =>
  (assistenteEsiste(orgId) ? limitiDiOrg(orgId).azioniAi : 0);

/**
 * Le domande fatte da un'organizzazione nel periodo in corso.
 *
 * "Al mese" qui vuol dire nei trenta giorni dall'ultimo pagamento, non nel
 * mese di calendario: l'abbonamento riparte il giorno in cui si paga, e due
 * orologi diversi sullo stesso muro confondono e basta — chi paga il venti
 * si ritroverebbe dieci giorni di assistente per la prima quota, e non lo
 * capirebbe. Il periodo lo dice `periodoDelPiano`, che e' lo stesso da cui
 * dipendono i crediti del piano.
 */
export function azioniAiDi(orgId, quando = Date.now()) {
  ensureAzioniAi();
  const { da, a } = periodoDelPiano(orgId, quando);
  const dopo = new Date(da).getTime();
  const prima = new Date(a).getTime();
  return db.azioniAi.filter((x) => {
    if (x.orgId !== orgId) return false;
    const t = new Date(x.quando).getTime();
    return t >= dopo && t < prima;
  });
}

/**
 * Il contatore: quante ne concede il piano, quante ne restano.
 *
 * `haAssistente` e' falso quando il piano non ne concede nessuna, ed e'
 * diverso da "le ha finite": nel primo caso si propone di salire di piano,
 * nel secondo si dice quando riparte il conto. Sono due frasi diverse da
 * dire, e senza questa distinzione ne verrebbe una sola, sbagliata per meta'
 * dei casi.
 */
export function contatoreAi(orgId, quando = Date.now()) {
  const tetto = tettoAzioniAi(orgId);
  const usate = azioniAiDi(orgId, quando).length;
  const periodo = periodoDelPiano(orgId, quando);
  return {
    tetto,
    usate,
    restano: Math.max(0, tetto - usate),
    haAssistente: tetto > 0,
    // Diverso da `!haAssistente`: qui l'assistente non esiste come
    // funzione, quindi non si mostra nemmeno la strada per comprarlo.
    esiste: assistenteEsiste(orgId),
    esaurito: tetto > 0 && usate >= tetto,
    // Quando riparte il conto: si scrive a chi ha finito le domande, ed e'
    // l'unica cosa che gli serve sapere in quel momento.
    riparteIl: periodo.a,
    periodo,
  };
}

/**
 * Consuma una domanda. Torna `null` se non ce n'erano.
 *
 * Si chiama prima di chiedere e non dopo aver risposto: una domanda partita
 * e' una domanda pagata, anche se l'assistente non risponde. Il contrario —
 * contare solo le risposte arrivate — vorrebbe dire che chi fa dieci
 * domande a un servizio che non va non ne ha consumata nessuna, e che il
 * costo se lo tiene chi offre il servizio.
 */
export function consumaAzioneAi({ orgId, userId, tipo, su }) {
  ensureAzioniAi();
  if (!orgId) return null;
  const { restano } = contatoreAi(orgId);
  if (restano <= 0) return null;
  const riga = {
    id: nuovoId('ai'),
    orgId,
    userId: userId ?? null,
    tipo: tipo || 'domanda',
    // Di chi si e' chiesto: serve a capire se l'assistente lo si usa sulle
    // persone o come chat generica, che sono due prodotti diversi.
    su: su ?? null,
    quando: new Date().toISOString(),
  };
  db.azioniAi.unshift(riga);
  save();
  return riga;
}
