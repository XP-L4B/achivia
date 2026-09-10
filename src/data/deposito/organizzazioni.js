/**
 * Le organizzazioni, finalmente come cosa a se'.
 *
 * Fino a ieri un'organizzazione non esisteva: esisteva il suo proprietario,
 * e nome, codice, tipo e abbonamento stavano scritti addosso a lui. Finche'
 * una persona stava in un posto solo la scorciatoia reggeva. Da quando puo'
 * starne in due — e possederne due — non regge piu': un campo `premium` sul
 * record di una persona non sa dire a quale delle sue organizzazioni si
 * riferisce, e la risposta sbagliata regala o toglie un abbonamento.
 *
 * Quindi l'abbonamento e' dell'organizzazione, non dell'account. Lo stesso
 * admin puo' avere un'azienda che paga e un gruppo che non paga, ed e'
 * esattamente quello che deve poter fare.
 *
 * La collezione c'era gia' — teneva il logo e lo stemma, le uniche due cose
 * che erano riuscite a staccarsi dal proprietario — ed e' li' che si
 * aggiunge il resto invece di aprirne una seconda accanto.
 */

import { db, ensureOrganizzazioni, save } from './nucleo';

/** Tutte le organizzazioni, come righe. L'id sta dentro la riga. */
export function getOrganizzazioni() {
  ensureOrganizzazioni();
  return Object.entries(db.organizzazioni).map(([id, o]) => ({ id, ...o }));
}

/** Una sola, per id. `null` se non esiste. */
export function getOrganizzazione(orgId) {
  ensureOrganizzazioni();
  if (!orgId) return null;
  const o = db.organizzazioni[orgId];
  return o ? { id: orgId, ...o } : null;
}

/**
 * Scrive i campi passati e lascia stare gli altri.
 *
 * Non salva mai un'organizzazione a meta': se `localStorage` e' pieno il
 * deposito torna com'era e la funzione dice di no, come fa il resto del
 * deposito da quando le immagini degli articoli hanno reso lo spazio un
 * limite vero.
 */
export function salvaOrganizzazione(orgId, patch) {
  ensureOrganizzazioni();
  if (!orgId) return null;
  const prima = db.organizzazioni[orgId];
  db.organizzazioni[orgId] = { ...(prima || {}), ...patch };
  if (!save()) {
    if (prima) db.organizzazioni[orgId] = prima;
    else delete db.organizzazioni[orgId];
    return null;
  }
  return getOrganizzazione(orgId);
}

/* ─── Le domande che si fanno da fuori ───────────────────────
   Sono le stesse di prima e si chiamano come prima: quello che cambia e'
   da dove leggono. Le schermate non hanno dovuto imparare niente. */

/** Il nome dell'insegna. Stringa vuota se l'organizzazione non c'e'. */
export const nomeOrg = (orgId) => getOrganizzazione(orgId)?.nome || '';

/** Il codice da condividere per farsi raggiungere. */
export const codiceOrg = (orgId) => getOrganizzazione(orgId)?.codice || '';

/**
 * Azienda o personalizzata, e non e' una sfumatura: sono due prodotti.
 *
 * Il valore scritto e' quello che comanda, e in mancanza si legge azienda:
 * e' il prodotto che c'era per primo, ed e' l'unico default che non regala a
 * un gruppo la classifica, le competenze standard e il finire nei conti del
 * mercato.
 */
export const tipoOrg = (orgId) =>
  (getOrganizzazione(orgId)?.tipo === 'personalizzata' ? 'personalizzata' : 'azienda');

export const orgPersonalizzata = (orgId) => tipoOrg(orgId) === 'personalizzata';

/** L'abbonamento e' dell'organizzazione. Vedi l'intestazione del file. */
export const orgPremium = (orgId) => Boolean(getOrganizzazione(orgId)?.premium);

/**
 * Chi puo' comprare un abbonamento: chiunque abbia un'organizzazione.
 *
 * Per un anno la risposta e' stata "le aziende si', i gruppi no", e la
 * ragione era vera finche' e' durata: quello che il premium vendeva — la
 * classifica, gli annunci, i risultati che restano a chi esce — una
 * personalizzata non lo usa per come e' fatta, e non si vende a qualcuno
 * qualcosa che non gli serve.
 *
 * Poi i piani sono diventati due listini. Alle aziende si vende quello che
 * gli e' sempre servito; ai gruppi si vende la sola cosa che gli serviva
 * davvero e che nessuno gli aveva mai offerto: stare in piu' di cinque, e
 * togliersi la pubblicita'. Una famiglia di otto persone nei cinque posti
 * del gratuito non ci stava, ed era il modo piu' silenzioso di dirle di
 * andare altrove.
 *
 * Che cosa paga l'abbonamento, per un'azienda: quante persone ci stanno
 * dentro (`getOrgSeats`), quanti annunci si tengono aperti
 * (`tettoAnnunci`), quante domande si fanno all'assistente, i crediti che
 * arrivano ogni mese, che parte dell'osservatorio si apre, e quanta
 * pubblicita' si vede. Per un gruppo: le persone e la pubblicita', e
 * basta — non assume, non ha performance da far leggere a nessuno, non
 * finisce nei conti del mercato.
 *
 * L'osservatorio come dashboard non e' in nessuno dei due elenchi: quello
 * non si compra abbonando un'organizzazione, e' un account a parte che si
 * consegna. Quello che un piano apre e' una sua pagina o tutte le sue
 * pagine, che e' un'altra cosa e si legge da `osservatorioDiOrg`.
 */
export const puoAbbonarsi = (orgId) => Boolean(orgId);

/** Un'organizzazione chiusa dal suo proprietario: non ci si entra piu'. */
export const orgChiusa = (orgId) => Boolean(getOrganizzazione(orgId)?.chiusaIl);

/**
 * Trova l'organizzazione da un codice; `null` se il codice non esiste.
 *
 * Una chiusa non risponde piu' al suo codice: il codice e' un invito, e un
 * invito a un posto che non c'e' piu' e' peggio di nessun invito.
 */
export function getOrgByCode(code) {
  const c = String(code ?? '').trim().toUpperCase();
  if (!c) return null;
  const trovata = getOrganizzazioni()
    .find((o) => !o.chiusaIl && (o.codice || '').toUpperCase() === c);
  return trovata ? { orgId: trovata.id, org: trovata.nome } : null;
}

/** Codice organizzazione condivisibile (6 caratteri). */
export const genOrgCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
