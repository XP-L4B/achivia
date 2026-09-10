/**
 * Le scelte: che cosa si offre quando si sale di livello.
 *
 * Tre carte, pescate da un mazzo che ha tre famiglie:
 *
 *   arma      un'arma nuova, se c'e' posto (quattro al massimo)
 *   potenzia  un'arma che si ha, un livello in piu' — o la sua evoluzione
 *             quando e' al massimo e ne ha una
 *   modulo    una statistica: danno, cadenza, gittata, velocita', vita, raccolta
 *
 * Ogni carta e' un oggetto con `id`, `tipo`, `nome`, `descrizione`, `icona`
 * ed `etichetta`: la schermata mostra quello e non sa che cosa ci sia
 * dietro. L'id dice a `applicaScelta` che cosa fare: `arma:sigillo`,
 * `potenzia:sigillo`, `evolvi:sigillo`, `modulo:danno`.
 *
 * I pesi tengono il mazzo vario: un'arma nuova vale un po' meno di un
 * potenziamento, perche' chi ha gia' due armi di solito preferisce farle
 * crescere; ma finche' si ha un'arma sola, l'arma nuova pesa il doppio.
 */

import { ARMI, armaById, numeriDi, descriviLivello, LIVELLO_MASSIMO, ARMI_MASSIME } from './armi';
import { MODULI, moduloById } from './moduli';
import { sinergieAttive } from './sinergie';

/**
 * Le rarita' delle carte, e quanto pesano nel mazzo. Un'arma nuova e'
 * insolita, un livello in piu' e' comune, un'evoluzione e' epica; i
 * moduli portano la loro. Nessuna rarita' si compra: e' solo quanto spesso
 * esce.
 */
export const RARITA_CARTE = {
  comune:   { nome: 'Comune',   peso: 1 },
  insolita: { nome: 'Insolita', peso: 0.6 },
  rara:     { nome: 'Rara',     peso: 0.3 },
  epica:    { nome: 'Epica',    peso: 0.12 },
};
const pesoRarita = (r) => RARITA_CARTE[r]?.peso ?? 1;

function cartaArma(arma) {
  return {
    id: `arma:${arma.id}`, tipo: 'arma', nome: arma.nome, descrizione: arma.descrizione,
    icona: arma.icona, etichetta: 'Arma nuova', livello: 1, rarita: 'insolita',
  };
}

function cartaPotenzia(arma, livello) {
  const cosa = descriviLivello(arma, livello);
  return {
    id: `potenzia:${arma.id}`, tipo: 'potenzia', nome: arma.nome,
    descrizione: cosa ? `Livello ${livello}: ${cosa}.` : `Livello ${livello}.`,
    icona: arma.icona, etichetta: `Livello ${livello}`, livello, rarita: 'comune',
  };
}

function cartaEvolvi(arma) {
  return {
    id: `evolvi:${arma.id}`, tipo: 'evoluzione', nome: arma.evoluzione.nome,
    descrizione: arma.evoluzione.descrizione, icona: arma.icona, etichetta: 'Evoluzione', livello: LIVELLO_MASSIMO, rarita: 'epica',
  };
}

function cartaModulo(m) {
  return { id: `modulo:${m.id}`, tipo: 'modulo', nome: m.nome, descrizione: m.descrizione, icona: m.icona, etichetta: `Modulo · ${RARITA_CARTE[m.rarita]?.nome ?? m.rarita}`, rarita: m.rarita };
}

/** Il mazzo del momento: tutte le carte possibili, ognuna col suo peso. */
export function mazzo(giocatore) {
  const carte = [];
  const armi = giocatore.armi;
  const possedute = new Set(armi.map((a) => a.id));
  // "arma nuova" e' una famiglia che pesa 2 finche' si ha un'arma sola, poi 1: il peso e'
  // diviso fra le quattordici armi, cosi' l'insieme non soffoca i moduli
  const pesoNuova = (armi.length <= 1 ? 2 : 1) / ARMI.length;
  if (armi.length < ARMI_MASSIME) {
    for (const a of ARMI) if (!possedute.has(a.id)) carte.push({ carta: cartaArma(a), peso: pesoNuova });
  }
  for (const posseduta of armi) {
    const a = armaById(posseduta.id);
    if (!a) continue;
    if (posseduta.livello < LIVELLO_MASSIMO) carte.push({ carta: cartaPotenzia(a, posseduta.livello + 1), peso: 1.4 });
    else if (a.evoluzione && !posseduta.evoluta) carte.push({ carta: cartaEvolvi(a), peso: 1.6 });
  }
  // i moduli: il peso e' quello della rarita', diviso fra i moduli di quella rarita'
  // cosi' "un modulo comune" pesa come una famiglia, non come dieci carte
  const perRarita = {};
  for (const m of MODULI) perRarita[m.rarita] = (perRarita[m.rarita] || 0) + 1;
  for (const m of MODULI) {
    if ((giocatore.prese[m.id] || 0) < m.tetto) carte.push({ carta: cartaModulo(m), peso: (pesoRarita(m.rarita) * 4) / perRarita[m.rarita] });
  }
  return carte;
}

/** Tre carte diverse dal mazzo, pescate coi pesi. Meno di tre se il mazzo e' corto. */
export function offriScelte(caso, giocatore) {
  const m = mazzo(giocatore);
  const scelte = [];
  while (scelte.length < 3 && m.length > 0) {
    let totale = 0;
    for (let i = 0; i < m.length; i += 1) totale += m[i].peso;
    let r = caso.numero() * totale;
    let k = 0;
    for (; k < m.length; k += 1) { r -= m[k].peso; if (r <= 0) break; }
    if (k >= m.length) k = m.length - 1;
    scelte.push(m[k].carta);
    m.splice(k, 1);
  }
  return scelte;
}

/**
 * Applica una carta al giocatore. Torna `true` se l'ha riconosciuta.
 * Le statistiche si toccano solo qui e in `moduli.js`; le armi solo qui.
 */
export function applicaScelta(giocatore, id) {
  const [tipo, cosa] = String(id).split(':');
  if (tipo === 'modulo') {
    const m = moduloById(cosa);
    if (!m) return false;
    giocatore.prese[m.id] = (giocatore.prese[m.id] || 0) + 1;
    const prima = giocatore.stats.vitaMax;
    m.applica(giocatore.stats);
    if (giocatore.stats.vitaMax > prima) giocatore.vita += giocatore.stats.vitaMax - prima;
    if (giocatore.stats.cura) {
      giocatore.vita = Math.min(giocatore.stats.vitaMax, giocatore.vita + giocatore.stats.vitaMax * giocatore.stats.cura);
      giocatore.stats.cura = 0;
    }
    giocatore.vita = Math.min(giocatore.vita, giocatore.stats.vitaMax);
    giocatore.sinergie = sinergieAttive(giocatore);
    return true;
  }
  const arma = armaById(cosa);
  if (!arma) return false;
  const posseduta = giocatore.armi.find((a) => a.id === arma.id);
  if (tipo === 'arma') {
    if (posseduta || giocatore.armi.length >= ARMI_MASSIME) return false;
    giocatore.armi.push(nuovaArma(arma.id));
    giocatore.sinergie = sinergieAttive(giocatore);
    return true;
  }
  if (tipo === 'potenzia') {
    if (!posseduta || posseduta.livello >= LIVELLO_MASSIMO) return false;
    posseduta.livello += 1;
    return true;
  }
  if (tipo === 'evolvi') {
    if (!posseduta || posseduta.livello < LIVELLO_MASSIMO || !arma.evoluzione || posseduta.evoluta) return false;
    posseduta.evoluta = true;
    return true;
  }
  return false;
}

/** Lo stato di un'arma appena presa: il livello, e i contatori che il combattimento usa. */
export function nuovaArma(id) {
  return { id, livello: 1, evoluta: false, ricarica: 0.4, angolo: 0, tick: 0 };
}

/** I numeri correnti di un'arma posseduta. */
export const numeriArma = (posseduta) => numeriDi(armaById(posseduta.id), posseduta.livello, posseduta.evoluta);
