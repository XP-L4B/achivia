/**
 * L'insegna dell'organizzazione: il logo dell'azienda, o uno stemma
 * disegnato qui dentro.
 *
 * Due strade, perche' due sono i casi veri. Un'azienda un logo ce l'ha gia' e
 * vuole quello: si carica il file, che viene rimpicciolito nel browser come
 * le immagini del negozio. Un'organizzazione che un logo non ce l'ha —
 * una famiglia, una squadra, un reparto — non deve andare da un grafico per
 * avere qualcosa di suo: sceglie forma, colori e simbolo, e lo stemma esce
 * di li'.
 *
 * Lo stemma non si salva come immagine ma come ricetta: quattro parole
 * (`forma`, `sfondo`, `accento`, `simbolo`) che pesano niente e si
 * ridisegnano nitide a qualunque misura — a ventiquattro pixel nella barra
 * in alto come a centoventi nel profilo. Un PNG, a quelle due misure,
 * sarebbe sfocato da una parte o sprecato dall'altra.
 *
 * L'insegna e' della societa', non di chi la guida: sta appesa all'orgId, e
 * la mettono l'admin e i co-admin.
 */

import { getOrgProfilo, salvaOrgProfilo, getImmagineDati, scartaSeOrfana } from './db';
import { caricaImmagine } from './articoliImmagini';

export const FORME = [
  { id: 'scudo',   nome: 'Scudo' },
  { id: 'cerchio', nome: 'Cerchio' },
  { id: 'esagono', nome: 'Esagono' },
  { id: 'rombo',   nome: 'Rombo' },
];

/* I colori sono quelli dell'app: un'insegna verde acido accanto a questa
   interfaccia sarebbe una macchia, non un marchio. */
export const SFONDI = [
  { id: 'notte',   nome: 'Notte',    colore: '#16223a' },
  { id: 'ardesia', nome: 'Ardesia',  colore: '#2b3242' },
  { id: 'vino',    nome: 'Vino',     colore: '#5c1f26' },
  { id: 'bosco',   nome: 'Bosco',    colore: '#1e3b2c' },
  { id: 'indaco',  nome: 'Indaco',   colore: '#2a2350' },
  { id: 'ruggine', nome: 'Ruggine',  colore: '#5a3212' },
  { id: 'pietra',  nome: 'Pietra',   colore: '#3d3f45' },
  { id: 'inchiostro', nome: 'Inchiostro', colore: '#101318' },
];

export const ACCENTI = [
  { id: 'oro',     nome: 'Oro',      colore: '#ffc233' },
  { id: 'argento', nome: 'Argento',  colore: '#d7dbe2' },
  { id: 'rame',    nome: 'Rame',     colore: '#e08a4a' },
  { id: 'smeraldo', nome: 'Smeraldo', colore: '#00bf63' },
  { id: 'ghiaccio', nome: 'Ghiaccio', colore: '#5ec8e0' },
  { id: 'porpora', nome: 'Porpora',  colore: '#c06cd8' },
];

/**
 * I simboli. Sono disegni semplici, di quelli che si riconoscono anche
 * piccolissimi: a ventiquattro pixel un disegno dettagliato diventa una
 * macchia. Le coordinate stanno in un quadrato 64×64 centrato sul 32.
 *
 * Uno che c'era non c'e' piu': l'ingranaggio. Chi l'aveva scelto ricade
 * sulle iniziali da solo — `simboloDi` non trova l'id e torna al primo
 * della lista — senza che nessuno debba andare a sistemare niente.
 */
export const SIMBOLI = [
  { id: 'iniziali', nome: 'Iniziali', path: null },
  { id: 'torre',    nome: 'Torre',    path: 'M24 46V26h-3v-6h5v-4h4v4h4v-4h4v4h5v6h-3v20z' },
  { id: 'corona',   nome: 'Corona',   path: 'M18 44l-3-22 10 8 7-12 7 12 10-8-3 22z' },
  { id: 'spada',    nome: 'Spada',    path: 'M30 46V36h-6l8-22 8 22h-6v10z' },
  { id: 'fulmine',  nome: 'Fulmine',  path: 'M34 14l-14 20h9l-3 16 15-21h-9z' },
  { id: 'foglia',   nome: 'Foglia',   path: 'M32 14c10 6 14 14 12 22-2 8-10 12-18 10 2-10 6-18 12-24-8 4-13 11-15 20-4-8-1-20 9-28z' },
  { id: 'stella',   nome: 'Stella',   path: 'M32 14l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z' },
  { id: 'ancora',   nome: 'Ancora',   path: 'M30 20a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm-8 8h20v4h-8v14c5-1 8-4 9-9h4c-1 9-7 14-15 14s-14-5-15-14h4c1 5 4 8 9 9V32h-8z' },
  { id: 'martello', nome: 'Martello', path: 'M18 22h20v10H30l-4 18h-6l4-18h-6z' },
  { id: 'occhio',   nome: 'Occhio',   path: 'M32 20c11 0 18 12 18 12s-7 12-18 12-18-12-18-12 7-12 18-12zm0 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z' },
  { id: 'libro',    nome: 'Libro',    path: 'M14 18h14c2 0 4 1 4 3v25c0-2-2-3-4-3H14zm36 0H36c-2 0-4 1-4 3v25c0-2 2-3 4-3h14z' },
];

export const STEMMA_PREDEFINITO = {
  forma: 'scudo',
  sfondo: 'notte',
  accento: 'oro',
  simbolo: 'iniziali',
};

const trovato = (elenco, id, primo) => elenco.find((x) => x.id === id) || primo;

export const formaDi = (s) => trovato(FORME, s?.forma, FORME[0]);
export const sfondoDi = (s) => trovato(SFONDI, s?.sfondo, SFONDI[0]).colore;
export const accentoDi = (s) => trovato(ACCENTI, s?.accento, ACCENTI[0]).colore;
export const simboloDi = (s) => trovato(SIMBOLI, s?.simbolo, SIMBOLI[0]);

/** Le iniziali che finiscono dentro lo stemma: al massimo due lettere. */
export function inizialiDi(nomeOrg) {
  const parole = String(nomeOrg || 'Achivia').trim().split(/\s+/).filter(Boolean);
  if (parole.length === 0) return 'A';
  if (parole.length === 1) return parole[0].slice(0, 2).toUpperCase();
  return (parole[0][0] + parole[1][0]).toUpperCase();
}

/* ─── Che insegna ha un'organizzazione ───────────────────────────────────*/

/**
 * L'insegna di un'organizzazione, o `null` se non ne ha ancora una.
 * `{ tipo: 'logo', dati }` per un file caricato, `{ tipo: 'stemma', stemma }`
 * per uno disegnato qui.
 */
export function emblemaDi(orgId) {
  const profilo = getOrgProfilo(orgId);
  if (!profilo) return null;
  if (profilo.logo) {
    const dati = getImmagineDati(profilo.logo);
    if (dati) return { tipo: 'logo', chiave: profilo.logo, dati };
  }
  if (profilo.stemma) return { tipo: 'stemma', stemma: profilo.stemma };
  return null;
}

/** L'insegna la mettono l'admin e i co-admin: e' la faccia della societa'. */
export const puoCambiareEmblema = (persona, orgId) =>
  persona?.role === 'admin' && persona?.orgId === orgId;

/** Carica un file come logo. Toglie di mezzo quello di prima, se c'era. */
export async function caricaLogo(persona, orgId, file) {
  if (!puoCambiareEmblema(persona, orgId)) return { ok: false, errore: 'Non puoi cambiare l’insegna di questa organizzazione.' };
  const esito = await caricaImmagine(file);
  if (!esito.ok) return esito;

  const vecchia = getOrgProfilo(orgId)?.logo;
  // Il logo vince sullo stemma finche' c'e': averli tutti e due significa
  // avere due insegne, e un'organizzazione ne ha una.
  const salvato = salvaOrgProfilo(orgId, { logo: esito.chiave });
  if (!salvato) return { ok: false, errore: 'Non c’e’ piu’ spazio nel browser per salvare l’insegna.' };
  if (vecchia && vecchia !== esito.chiave) scartaSeOrfana(vecchia);
  return { ok: true, chiave: esito.chiave };
}

/** Salva lo stemma disegnato. Il logo caricato, se c'era, viene messo via. */
export function salvaStemma(persona, orgId, stemma) {
  if (!puoCambiareEmblema(persona, orgId)) return null;
  const pulito = {
    forma: formaDi(stemma).id,
    sfondo: trovato(SFONDI, stemma?.sfondo, SFONDI[0]).id,
    accento: trovato(ACCENTI, stemma?.accento, ACCENTI[0]).id,
    simbolo: simboloDi(stemma).id,
  };
  const vecchia = getOrgProfilo(orgId)?.logo;
  const salvato = salvaOrgProfilo(orgId, { stemma: pulito, logo: null });
  if (salvato && vecchia) scartaSeOrfana(vecchia);
  return salvato;
}

/** Toglie l'insegna: si torna a non averne una. */
export function rimuoviEmblema(persona, orgId) {
  if (!puoCambiareEmblema(persona, orgId)) return null;
  const vecchia = getOrgProfilo(orgId)?.logo;
  const salvato = salvaOrgProfilo(orgId, { stemma: null, logo: null });
  if (salvato && vecchia) scartaSeOrfana(vecchia);
  return salvato;
}
