/**
 * Il bot: uno che indovina.
 *
 * Ragiona come si ragiona davvero. Tiene l'elenco delle parole che
 * potrebbero ancora essere la segreta e, dopo ogni tentativo, butta via
 * quelle che con quei colori non tornerebbero: se la segreta fosse CANE,
 * il tentativo appena fatto avrebbe dato quei colori li'? No? Allora non
 * e' CANE. E' il filtro esatto — non una regola approssimata — e da solo
 * fa un avversario forte.
 *
 * Fra quelle che restano sceglie la parola fatta delle lettere piu'
 * frequenti fra le candidate: e' il modo piu' corto per farsi dire
 * qualcosa da un tentativo invece di sperare.
 *
 * La difficolta' non lo rende piu' stupido nel ragionamento, gli fa
 * scegliere peggio: con `sbaglia` alto prende una candidata a caso invece
 * della migliore. Un bot che sbaglia il filtro giocherebbe parole
 * impossibili, e si vedrebbe che bara al contrario.
 */

import { CONFIG } from '../contenuti/config';
import { candidateDi } from './segreta';
import { confronta } from './esito';

/** Le parole che, viste le righe gia' giocate, potrebbero ancora essere la segreta. */
function restano(stato, chi) {
  const per = candidateDi(stato.linguaId, stato.config);
  const quante = stato.segreta.lettere.length;
  const tutte = per.get(quante) || [];
  const righe = chi.righe.filter((r) => !r.persa && r.lettere?.length === quante);
  const gia = new Set(righe.map((r) => r.normalizzata));
  return tutte.filter((s) => {
    if (gia.has(s.normalizedWord)) return false;
    const lettere = [...s.normalizedWord];
    for (const r of righe) {
      const prova = confronta(lettere, r.lettere);
      for (let i = 0; i < prova.length; i += 1) if (prova[i] !== r.esito[i]) return false;
    }
    return true;
  });
}

/** La candidata fatta delle lettere piu' comuni fra quelle rimaste. */
function migliore(candidate) {
  const conto = new Map();
  for (const s of candidate) {
    for (const l of new Set(s.normalizedWord)) conto.set(l, (conto.get(l) || 0) + 1);
  }
  let vinta = null;
  let meglio = -1;
  for (const s of candidate) {
    let punti = 0;
    for (const l of new Set(s.normalizedWord)) punti += conto.get(l) || 0;
    if (punti > meglio) { meglio = punti; vinta = s; }
  }
  return vinta;
}

/**
 * La mossa del bot: un tentativo, o `null` se non gli resta niente da
 * provare — nel qual caso chi lo chiama lo fa passare.
 */
export function mossaBot(stato, livello = 'medio') {
  const cfg = CONFIG.bot[livello] ?? CONFIG.bot.medio;
  const chi = stato.giocatori[stato.diChi];
  if (!chi || chi.finito) return null;
  const candidate = restano(stato, chi);
  if (candidate.length === 0) return null;
  const scelta = stato.caso.numero() < cfg.sbaglia
    ? candidate[Math.floor(stato.caso.numero() * candidate.length)]
    : migliore(candidate);
  return { tipo: 'tentativo', parola: scelta.word };
}

/** Quanto ci mette a rispondere: non serve al motore, serve a chi guarda. */
export const pausaBot = (livello = 'medio') => (CONFIG.bot[livello] ?? CONFIG.bot.medio).pensaMs;
