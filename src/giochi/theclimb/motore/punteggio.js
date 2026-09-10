/**
 * Il punteggio della classifica. E' la formula del brief (§15), con i
 * moltiplicatori per vita di `bilancio.js`: arrivare in cima partendo dal
 * basso vale di piu', che e' esattamente il messaggio del gioco.
 *
 *   base        livello massimo × 1000
 *   cima        15000 se CEO di ACHIVIA SPA
 *   qualita     integrita' × 15 + salute × 10 + relazioni × 10 + felicita' × 8
 *   efficienza  max(0, 8000 − settimane × 10)
 *   malus       esplosioni × 3000
 *   punti       (base + cima + qualita' + efficienza − malus) × moltiplicatore
 *
 * E' puro: gira in node per le prove, e girerebbe identico su un server.
 */

import { BACKGROUND as NUMERI } from '../contenuti/bilancio.js';
import { VITTORIE } from '../contenuti/storia.js';

export const PESI = {
  livello: 1000,
  cima: 15000,
  integrita: 15, salute: 10, relazioni: 10, felicita: 8,
  efficienzaBase: 8000, efficienzaPerSettimana: 10,
  scandalo: 3000,
};

const intero = (v, tetto, minimo = 0) => Math.min(tetto, Math.max(minimo, Math.round(Number(v) || 0)));

/** Quello che accettiamo di salvare: numeri stretti nei loro bordi. */
export function pulisci(r) {
  return {
    versioneMotore: intero(r.versioneMotore, 999),
    seme: Number.isFinite(Number(r.seme)) ? Number(r.seme) : 0,
    background: NUMERI[r.background] ? r.background : 'ceto_medio',
    percorso: typeof r.percorso === 'string' ? r.percorso : null,
    settimane: intero(r.settimane, 700),
    eta: intero(r.eta, 40),
    esito: r.esito && typeof r.esito.causa === 'string' ? { causa: r.esito.causa, settimana: intero(r.esito.settimana, 700), livello: intero(r.esito.livello, 10) } : null,
    livello: intero(r.livello, 10),
    livelloMassimo: intero(r.livelloMassimo, 10),
    soldi: Math.max(-1e6, Math.min(1e7, Math.round(Number(r.soldi) || 0))),
    salute: intero(r.salute, 100),
    stress: intero(r.stress, 100),
    noia: intero(r.noia, 100),
    felicita: intero(r.felicita, 100),
    relazioni: intero(r.relazioni, 100),
    rete: intero(r.rete, 100),
    reputazione: intero(r.reputazione, 100),
    integrita: intero(r.integrita, 100),
    mediaHard: intero(r.mediaHard, 100),
    mediaSoft: intero(r.mediaSoft, 100),
    scorrettezze: intero(r.scorrettezze, 999),
    esplosioni: intero(r.esplosioni, 99),
    salti: intero(r.salti, 999),
    titoli: Array.isArray(r.titoli) ? r.titoli.filter((x) => typeof x === 'string') : [],
    aziende: Array.isArray(r.aziende) ? r.aziende.filter((x) => typeof x === 'string') : [],
    decisioni: intero(r.decisioni, 99999),
  };
}

export const eVittoria = (r) => Boolean(r?.esito?.causa) && VITTORIE.has(r.esito.causa);

export function puntiPartita(r) {
  const base = r.livelloMassimo * PESI.livello;
  const cima = r.esito?.causa === 'cima' || r.esito?.causa === 'cima_vuota' ? PESI.cima : 0;
  const qualita = r.integrita * PESI.integrita + r.salute * PESI.salute + r.relazioni * PESI.relazioni + r.felicita * PESI.felicita;
  const efficienza = Math.max(0, PESI.efficienzaBase - r.settimane * PESI.efficienzaPerSettimana);
  const malus = r.esplosioni * PESI.scandalo;
  const moltiplicatore = NUMERI[r.background]?.moltiplicatore ?? 1;
  return Math.max(0, Math.round((base + cima + qualita + efficienza - malus) * moltiplicatore));
}

/** L'equilibrio di una vita: salute + relazioni + felicita'. Per la classifica tematica. */
export const equilibrioDi = (r) => r.salute + r.relazioni + r.felicita;
