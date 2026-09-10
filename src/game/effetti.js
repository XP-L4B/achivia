/**
 * Gli effetti delle casse: che cosa fa ognuno, e come si spegne.
 *
 * Un registro, `EFFETTI`, una voce per effetto. Ogni voce ha nome, icona,
 * colore, una descrizione per il cruscotto, e una di due forme:
 *
 *   istantaneo   `applica(stato, numeri)`: fa la sua cosa e torna la
 *                scritta che galleggia sulla cassa;
 *   temporaneo   `temporaneo: true`, con `bonus(b, numeri, stato)` che
 *                mette il suo moltiplicatore in `stato.bonus`, e a scelta
 *                `passo(stato, numeri, attivo, dt)` per chi fa qualcosa
 *                nel tempo (la tempesta).
 *
 * I temporanei stanno in `giocatore.attivi`, uno per effetto: riprenderlo
 * rinfresca la durata, non la somma. A ogni passo `aggiornaEffetti` fa un
 * giro solo: scala i tempi, toglie chi e' finito, azzera `stato.bonus` e
 * lo ricompone da chi resta. Le statistiche del giocatore non si toccano
 * mai: quando l'ultimo effetto finisce, i moltiplicatori sono di nuovo
 * quelli di `BONUS_NEUTRO`, esattamente.
 *
 * Tutto passa dalle porte che ci sono: il danno da `colpisci` (che sa di
 * critici, morti, gemme, boss), il livello delle armi da `applicaScelta`,
 * le gemme dal ciclo di raccolta della partita, il rallentamento da
 * `stato.molt.velocita` che i nemici gia' leggono. I numeri stanno in
 * `contenuti/casse.js`. Un effetto nuovo e' una voce in piu' qui e una
 * riga di numeri la': le casse non cambiano.
 */

import { CONFIG_CASSE, BONUS_NEUTRO } from './contenuti/casse';
import { LIVELLO_MASSIMO, armaById } from './contenuti/armi';
import { applicaScelta } from './contenuti/scelte';
import { colpisci, impatto } from './combattimento';

export const nuovoBonus = () => ({ ...BONUS_NEUTRO });

const numeriDi = (id) => CONFIG_CASSE.effetti[id] || {};
const pct = (v) => `${Math.round(v * 100)}%`;

export const EFFETTI = {
  ristoro: {
    nome: 'Ristoro', icona: 'ui.effetto.ristoro', colore: '#8fd06a',
    descrivi: (n) => `Recuperi il ${pct(n.cura)} della vita massima`,
    applica(stato, n) {
      const g = stato.giocatore;
      const prima = g.vita;
      g.vita = Math.min(g.stats.vitaMax, g.vita + g.stats.vitaMax * n.cura);
      return `+${Math.round(g.vita - prima)} VITA`;
    },
  },
  magnete: {
    nome: 'Magnete', icona: 'ui.effetto.magnete', colore: '#4ad9ff',
    descrivi: () => 'Tutte le gemme dell’arena volano da te',
    applica(stato, n) {
      const G = stato.gemme;
      for (let i = 0; i < G.n; i += 1) { G.lista[i].attratta = true; G.lista[i].tirata = n.velocita; }
      return `${G.n} GEMME`;
    },
  },
  devastazione: {
    nome: 'Devastazione', icona: 'ui.effetto.devastazione', colore: '#ff7a5c',
    descrivi: (n) => `${n.danno} danni a ogni nemico in campo`,
    applica(stato, n) {
      const N = stato.nemici; const g = stato.giocatore;
      let colpiti = 0;
      const danno = n.danno * g.stats.danno;
      for (let i = 0; i < N.n; i += 1) {
        const e = N.lista[i];
        if (e.morto) continue;
        colpisci(stato, e, danno);
        colpiti += 1;
      }
      stato.onda(stato, g.x, g.y, 260, '#ff7a5c', 0.6);
      return `${colpiti} COLPITI`;
    },
  },
  potenzia: {
    nome: 'Arma potenziata', icona: 'ui.effetto.potenzia', colore: '#ffc233',
    descrivi: () => 'Un’arma che hai sale di un livello',
    valido: (stato) => stato.giocatore.armi.some((a) => a.livello < LIVELLO_MASSIMO),
    applica(stato) {
      const g = stato.giocatore;
      const candidate = g.armi.filter((a) => a.livello < LIVELLO_MASSIMO);
      if (candidate.length === 0) return null;
      const scelta = candidate[Math.min(candidate.length - 1, Math.floor(stato.caso.numero() * candidate.length))];
      if (!applicaScelta(g, `potenzia:${scelta.id}`)) return null;
      return `${armaById(scelta.id).nome.toUpperCase()} LIV ${scelta.livello}`;
    },
  },
  furia: {
    nome: 'Furia', icona: 'ui.effetto.furia', colore: '#ff7a5c', temporaneo: true,
    descrivi: (n) => `Danno delle armi +${pct(n.danno)}`,
    bonus(b, n) { b.danno *= 1 + n.danno; },
  },
  sovraccarico: {
    nome: 'Sovraccarico', icona: 'ui.effetto.sovraccarico', colore: '#ffc233', temporaneo: true,
    descrivi: (n) => `Ricarica delle armi −${pct(n.cadenza)}`,
    bonus(b, n) { b.cadenza *= 1 - n.cadenza; },
  },
  barriera: {
    nome: 'Barriera', icona: 'ui.effetto.barriera', colore: '#4ad9ff', temporaneo: true,
    descrivi: () => 'Nessun danno ti tocca',
    bonus(b) { b.barriera = true; },
  },
  supermagnete: {
    nome: 'Super magnete', icona: 'ui.effetto.supermagnete', colore: '#4ad9ff', temporaneo: true,
    descrivi: (n) => `Raggio di raccolta ×${n.raccolta}`,
    bonus(b, n) { b.raccolta *= n.raccolta; },
  },
  rallenta: {
    nome: 'Tempo rallentato', icona: 'ui.effetto.rallenta', colore: '#9b7bd4', temporaneo: true,
    descrivi: (n) => `I nemici vanno al ${pct(n.nemici)}`,
    bonus(b, n) { b.nemici *= n.nemici; },
  },
  fantasma: {
    nome: 'Forma spettrale', icona: 'ui.effetto.fantasma', colore: '#d9c8ff', temporaneo: true,
    descrivi: () => 'Attraversi i nemici. Tiri e colpi dei boss fanno ancora male',
    bonus(b) { b.fantasma = true; },
  },
  precisione: {
    nome: 'Precisione letale', icona: 'ui.effetto.precisione', colore: '#ff5c5c', temporaneo: true,
    descrivi: (n) => `Colpi critici +${pct(n.critico)}`,
    bonus(b, n) { b.critico += n.critico; },
  },
  tempesta: {
    nome: 'Tempesta di meteore', icona: 'ui.effetto.tempesta', colore: '#ffc233', temporaneo: true,
    descrivi: (n) => `Un impatto ogni ${n.ogni} s intorno a te`,
    passo(stato, n, attivo, dt) {
      attivo.contatore -= dt;
      if (attivo.contatore > 0) return;
      attivo.contatore = n.ogni;
      const g = stato.giocatore; const m = stato.mondo;
      const a = stato.caso.fra(0, Math.PI * 2);
      const d = stato.caso.fra(n.distanza[0], n.distanza[1]);
      const x = Math.min(m.w - 16, Math.max(16, g.x + Math.cos(a) * d));
      const y = Math.min(m.h - 16, Math.max(16, g.y + Math.sin(a) * d));
      impatto(stato, x, y, n.raggio, n.danno * g.stats.danno, n.preavviso);
    },
  },
  doppiaXp: {
    nome: 'Esperienza doppia', icona: 'ui.effetto.doppiaXp', colore: '#8fd06a', temporaneo: true,
    descrivi: (n) => `Ogni gemma vale ×${n.xp}`,
    bonus(b, n) { b.xp *= n.xp; },
  },
  berserker: {
    nome: 'Berserker', icona: 'ui.effetto.berserker', colore: '#ff5c5c', temporaneo: true,
    descrivi: (n) => `Piu' vita ti manca, piu' fai male: fino a +${pct(n.dannoMassimo)}`,
    bonus(b, n, stato) {
      const g = stato.giocatore;
      const manca = Math.max(0, Math.min(1, 1 - g.vita / g.stats.vitaMax));
      b.danno *= 1 + n.dannoMassimo * manca;
    },
  },
};

export const effettoById = (id) => EFFETTI[id] || null;
export const ID_EFFETTI = Object.keys(EFFETTI);

/** Se l'effetto vale adesso (un'arma da potenziare ci deve essere). */
export function effettoValido(stato, id) {
  const f = EFFETTI[id];
  return Boolean(f) && (!f.valido || f.valido(stato));
}

/** La durata di un effetto temporaneo in una cassa di quella rarita'; zero per gli istantanei. */
export function durataEffetto(id, moltDurata = 1) {
  const f = EFFETTI[id];
  return f?.temporaneo ? (numeriDi(id).durata || 0) * moltDurata : 0;
}

/**
 * Accende un effetto temporaneo per `durata` secondi. Se e' gia' acceso
 * la durata riparte da capo: non si sommano e non si accumulano.
 */
export function attiva(stato, id, durata) {
  const attivi = stato.giocatore.attivi;
  for (let i = 0; i < attivi.length; i += 1) {
    if (attivi[i].id === id) { attivi[i].resta = durata; attivi[i].durata = durata; return attivi[i]; }
  }
  const a = { id, resta: durata, durata, contatore: 0 };
  attivi.push(a);
  stato.eventi.push('effetto');
  return a;
}

/**
 * Applica l'effetto `id` al giocatore: un istantaneo fa subito, un
 * temporaneo si accende. Torna la scritta da far galleggiare, o `null` se
 * non ha potuto (allora non e' successo niente).
 */
export function applicaEffetto(stato, id, moltDurata = 1) {
  const f = EFFETTI[id];
  if (!f) return null;
  const n = numeriDi(id);
  if (f.temporaneo) {
    const durata = durataEffetto(id, moltDurata);
    attiva(stato, id, durata);
    return `${f.nome.toUpperCase()} ${Math.round(durata)}s`;
  }
  return f.applica(stato, n);
}

/** Il giro unico degli effetti attivi: scala i tempi, toglie chi e' finito, ricompone `stato.bonus`. */
export function aggiornaEffetti(stato, dt) {
  const b = stato.bonus;
  b.danno = 1; b.cadenza = 1; b.raccolta = 1; b.xp = 1; b.nemici = 1; b.critico = 0; b.barriera = false; b.fantasma = false;
  const attivi = stato.giocatore.attivi;
  for (let i = attivi.length - 1; i >= 0; i -= 1) {
    const a = attivi[i];
    a.resta -= dt;
    if (a.resta <= 0) { attivi.splice(i, 1); stato.eventi.push('effetto-finito'); continue; }
    const f = EFFETTI[a.id];
    if (!f) { attivi.splice(i, 1); continue; }
    const n = numeriDi(a.id);
    if (f.bonus) f.bonus(b, n, stato);
    if (f.passo) f.passo(stato, n, a, dt);
  }
}

