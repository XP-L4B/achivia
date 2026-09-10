/**
 * Le regole dell'arena: chi gioca con che cosa, e che cosa una partita lascia.
 *
 * L'arena e' una cosa della persona, non dell'organizzazione: non dipende
 * dal piano di nessuno e non produce dati di mercato. Quello che invece la
 * lega ad Achivia e' il livello dell'account — quello che si guadagna
 * lavorando, non giocando:
 *
 *   · ogni livello, mezzo punto percentuale di statistiche sul personaggio;
 *   · ogni dieci livelli, un modulo gratis in piu' all'inizio di ogni partita;
 *   · ogni dieci livelli, fino al cinquanta, un personaggio nuovo.
 *
 * I numeri di sblocco stanno sulle schede dei personaggi, in
 * `game/contenuti/personaggi.js`: qui si leggono, non si ripetono.
 *
 * Nessuna ricompensa che valga qualcosa: niente crediti, niente esperienza
 * dell'account. Un deposito in localStorage non puo' custodire un punteggio
 * che si trasforma in denaro, e l'arena non deve mettere nella stessa
 * classifica chi lavora e chi gioca.
 */

import {
  getUserById, registraPartitaArena, primatiArena, getPartiteArena, segnaAttivita, traguardiArena,
  classificaArena, chiaveLega, periodoLega, orgDiUtente, nomeOrg, LEGHE, PUNTI,
} from './db';
import { PERSONAGGI, personaggioById, bonusDiLivello, BONUS_PER_LIVELLO } from '../game/contenuti/personaggi';
import { valuta, CATEGORIE } from '../game/contenuti/traguardi';

/* I primati si leggono dal deposito; qui passano perche' le schermate
   dell'arena importano da un posto solo. */
export { primatiArena };

export const LIVELLI_PER_MODULO = 10;
export const LIVELLO_ULTIMO_SBLOCCO = 50;

const livelloDi = (persona) => Math.max(1, Number(persona?.level) || 1);

export { BONUS_PER_LIVELLO };

/** Quanto il livello dell'account potenzia le statistiche del personaggio: 0 al livello 1. */
export const bonusLivelloDi = (persona) => bonusDiLivello(livelloDi(persona));

/** Lo stesso bonus come si legge: "+9,5%", "+5%", "nessuno". */
export function bonusLeggibile(persona) {
  const b = bonusLivelloDi(persona);
  if (b <= 0) return 'nessuno';
  const pct = Math.round(b * 1000) / 10;
  return `+${String(pct).replace('.', ',')}%`;
}

/** Quanti moduli si scelgono gratis all'inizio: uno ogni dieci livelli dell'account. */
export const moduliGratisDi = (persona) =>
  Math.min(LIVELLO_ULTIMO_SBLOCCO / LIVELLI_PER_MODULO, Math.floor(livelloDi(persona) / LIVELLI_PER_MODULO));

/** I personaggi, con lo stato di sblocco per questa persona. */
export function personaggiDi(persona) {
  const livello = livelloDi(persona);
  return PERSONAGGI.map((p) => ({
    ...p,
    sbloccato: livello >= p.sblocco,
    mancano: Math.max(0, p.sblocco - livello),
  }));
}

/** Se questa persona puo' entrare con quel personaggio. */
export const puoUsare = (persona, personaggioId) =>
  livelloDi(persona) >= personaggioById(personaggioId).sblocco;

/** Il prossimo personaggio che si sblocca, o `null` se sono tutti aperti. */
export function prossimoSblocco(persona) {
  const livello = livelloDi(persona);
  return PERSONAGGI.find((p) => p.sblocco > livello) || null;
}

/** A quale livello arriva il prossimo modulo gratis. */
export const prossimoModuloAl = (persona) =>
  (Math.floor(livelloDi(persona) / LIVELLI_PER_MODULO) + 1) * LIVELLI_PER_MODULO;

/** I primati e le ultime partite di una persona. */
export function schedaArena(userId) {
  return {
    primati: primatiArena(userId),
    ultime: getPartiteArena(userId).slice(-5).reverse(),
  };
}

/**
 * I traguardi dell'arena di una persona, pronti per la schermata: la
 * lista con valore, progresso e stato, quanti sono sbloccati, e le
 * categorie nell'ordine in cui si mostrano. Un profilo a parte: niente
 * di questo entra negli achievement di Achivia.
 */
export function traguardiDi(userId) {
  const t = traguardiArena(userId);
  const lista = valuta(t.misure, t.sbloccati);
  return {
    lista,
    categorie: CATEGORIE,
    sbloccati: lista.filter((v) => v.sbloccato).length,
    totale: lista.length,
  };
}

export { LEGHE, PUNTI };

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const giornoBreve = (t) => { const d = new Date(t); return `${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)}`; };

/** Il nome di una lega in corso: "Settimana 36 · 31 ago – 6 set", "Settembre 2026", "Di sempre". */
export function etichettaLega(lega, adesso = Date.now()) {
  if (lega === 'sempre') return 'Di sempre';
  const { inizio, fine } = periodoLega(lega, adesso);
  if (lega === 'mese') { const d = new Date(adesso); return `${MESI[d.getMonth()][0].toUpperCase()}${MESI[d.getMonth()].slice(1)} ${d.getFullYear()}`; }
  return `Settimana ${chiaveLega('sett', adesso).split('W')[1]} · ${giornoBreve(inizio)} – ${giornoBreve(fine - 1)}`;
}

/** Quanto manca alla fine di una lega, come si legge: "3 g 4 h", "2 h 10 min", "mai". */
export function scadenzaLeggibile(lega, adesso = Date.now()) {
  if (lega === 'sempre') return 'non si azzera';
  const resta = Math.max(0, periodoLega(lega, adesso).fine - adesso);
  const g = Math.floor(resta / 86400000); const h = Math.floor((resta % 86400000) / 3600000); const m = Math.floor((resta % 3600000) / 60000);
  if (g > 0) return `${g} g ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

const conPersona = (v) => ({ ...v, persona: getUserById(v.userId) || null });

/**
 * La classifica dell'arena come la vede una persona: la lega scelta,
 * l'ambito (tutti, o una delle sue organizzazioni), i primi dieci e lei
 * se sta piu' giu', la sua posizione con quanto le manca per salire, la
 * scadenza, e il podio della lega scorsa. Tutto letto dal deposito:
 * niente si ricalcola qui, niente si paga.
 */
export function classificaDi(userId, { lega = 'sett', ambito = 'tutti', adesso = Date.now() } = {}) {
  const voci = classificaArena({ lega, ambito, adesso });
  const mia = voci.find((v) => v.userId === userId) || null;
  const sopra = mia && mia.posizione > 1 ? voci[mia.posizione - 2] : null;
  const primi = voci.slice(0, 10).map(conPersona);
  if (mia && mia.posizione > 10) primi.push(conPersona(mia));
  const { precedente } = periodoLega(lega, adesso);
  const scorsa = precedente ? classificaArena({ lega, chiave: precedente, ambito, adesso }) : [];
  const ambiti = [{ id: 'tutti', nome: 'Tutti' }, ...orgDiUtente(userId).map((id) => ({ id, nome: nomeOrg(id) || 'La mia organizzazione' }))];
  return {
    lega, ambito, ambiti,
    etichetta: etichettaLega(lega, adesso),
    scadenza: scadenzaLeggibile(lega, adesso),
    partecipanti: voci.length,
    voci: primi,
    mia: mia ? { ...mia, mancano: sopra ? sopra.punti - mia.punti + 1 : 0, sopra: sopra ? conPersona(sopra) : null } : null,
    scorsa: { podio: scorsa.slice(0, 3).map(conPersona), mia: scorsa.find((v) => v.userId === userId) || null, partecipanti: scorsa.length },
  };
}

/**
 * Chiude una partita: la scrive nel deposito e segna che la persona ha
 * fatto qualcosa. Il motore le ha dato il riassunto; qui non si ricalcola
 * niente e non si paga niente. Torna la riga, con dentro gli id dei
 * traguardi dell'arena sbloccati da questa partita (`nuoviTraguardi`).
 */
export function chiudiPartita(userId, riassuntoPartita) {
  const persona = getUserById(userId);
  if (!persona) return null;
  const riga = registraPartitaArena(userId, riassuntoPartita);
  segnaAttivita(userId);
  return riga;
}

/** Il tempo di una partita come si legge: 1:23. */
export function tempoLeggibile(secondi) {
  const s = Math.max(0, Math.round(Number(secondi) || 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
