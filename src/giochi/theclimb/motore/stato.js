/**
 * Lo stato di una partita: che cosa c'e' dentro, e come nasce.
 *
 * E' un oggetto semplice, senza metodi: lo cambiano solo le funzioni di
 * `settimana.js` e `partita.js`, e lo si puo' serializzare cosi' com'e'
 * (tranne il caso, che si rifa' dal seme e dai passi).
 */

import { creaCaso } from './caso.js';
import { contattiIniziali } from './persone.js';
import { PARTITA, PARTENZA, BACKGROUND as NUMERI, SOPRAVVIVENZA } from '../contenuti/bilancio.js';
import { backgroundById } from '../contenuti/background.js';
import { percorsoById } from '../contenuti/percorsi.js';
import { COMPETENZE, eHard } from '../contenuti/competenze.js';
import { ATTIVITA } from '../contenuti/attivita.js';

export const VERSIONE_MOTORE = 1;

/**
 * Una partita nuova.
 *
 *   seme        due partite con lo stesso seme, lo stesso background e le
 *               stesse decisioni sono la stessa partita
 *   background  uno dei cinque id di `background.js`
 *   percorso    uno dei cinque id di `percorsi.js`, o null (si sceglie dopo)
 */
export function nuovoStato({ seme = 1, background = 'ceto_medio', percorso = null } = {}) {
  const bg = backgroundById(background);
  if (!bg) throw new Error(`background sconosciuto: ${background}`);
  if (percorso && !percorsoById(percorso)) throw new Error(`percorso sconosciuto: ${percorso}`);
  const n = NUMERI[bg.id];
  const caso = creaCaso(seme);

  /* Le competenze di partenza: basse, e un po' diverse fra loro. Sono
     pescate dal caso — quindi dal seme — cosi' due partite con seme diverso
     partono da persone diverse, e due con lo stesso seme dalla stessa. */
  const hard = {};
  const soft = {};
  for (const c of COMPETENZE) {
    const v = Math.round(caso.fra(4, 16));
    if (eHard(c.id)) hard[c.id] = v; else soft[c.id] = v;
  }

  /* Chi deve lavorare dalla prima settimana comincia da un lavoro di
     sopravvivenza, pescato fra i quattro. */
  let lavoro = null;
  if (bg.lavoraSubito) {
    const id = caso.scelta(Object.keys(SOPRAVVIVENZA));
    lavoro = nuovoLavoro(id);
  }

  const routine = Object.fromEntries(ATTIVITA.map((a) => [a.id, 0]));

  const stato = {
    versioneMotore: VERSIONE_MOTORE,
    seme,
    caso,
    background: bg.id,
    percorso,
    settimana: 1,
    eta: PARTITA.etaIniziale,
    corpo: { salute: PARTENZA.salute, sonno: PARTENZA.sonno, stress: PARTENZA.stress, felicita: PARTENZA.felicita, noia: PARTENZA.noia },
    vita: {
      soldi: n.soldi,
      relazioni: PARTENZA.relazioni,
      rete: PARTENZA.rete + n.rete,
      reputazione: PARTENZA.reputazione,
      integrita: PARTENZA.integrita,
    },
    nascosto: { sospetto: PARTENZA.sospetto },
    lavoro,
    hard,
    soft,
    portfolio: 0,
    ricerca: 0,
    /* quello che si fa quando non si decide niente: serve ad «avanza
       velocemente» e al replay su un altro background */
    routine,
    studiatoQuestoMese: false,
    /* le settimane di studio fatte sul percorso: quando arrivano alla sua
       durata il titolo e' preso, e il percorso smette di costare */
    settimaneStudio: 0,
    titoli: [],
    settimaneInRosso: 0,
    trimestri: 0,
    /* la carriera: le offerte che aspettano, gli ultimi colloqui, le
       aziende che hanno detto di no (e quando), le valutazioni, le
       aziende viste da dentro. Lo sponsor lo mettono le persone (fase 4). */
    offerte: [],
    colloqui: [],
    rifiuti: {},
    valutazioni: [],
    valutazioniBasse: 0,
    conosciute: [],
    sponsor: null,
    /* le persone: chi si e' incontrato, con fiducia, potere e memoria */
    persone: [],
    contatore: 0,
    /* gli eventi che aspettano una risposta, quelli gia' visti (quando),
       le conseguenze in ritardo, e il tempo in meno (o in piu') che un
       evento lascia alla settimana dopo */
    eventi: [],
    eventiVisti: {},
    differite: [],
    malusTempo: 0,
    /* le occasioni prese e quelle lasciate cadere: chi dice sempre no smette
       di essere chiamato, chi si lancia viene chiamato di piu' */
    occasioni: { prese: 0, lasciate: 0 },
    /* l'etica: quando si e' fatta ogni scorrettezza, quante, le esplosioni,
       la macchia di uno scandalo, l'impresa in piedi */
    scorrettezze: {},
    contaScorrettezze: { fatte: 0, esplosioni: 0, riparazioni: 0 },
    esplosioni: [],
    macchia: null,
    impresa: null,
    spintaPosti: 0,
    /* quello che la carriera ha toccato: per il riassunto e per il simulatore */
    carriera: { livelloMassimo: 0, primoLavoroVero: null, aziende: [], esperienza: {} },
    log: [],
    storico: [],
    fase: 'pianifica',
    esito: null,
  };
  /* i contatti con cui si nasce: la famiglia, per chi ce l'ha. E' la
     disuguaglianza piu' concreta del gioco: l'erede ha gia' qualcuno
     che puo' fare il suo nome */
  contattiIniziali(stato, bg);
  return stato;
}

/** Un lavoro appena preso. La performance parte a meta', la visibilita' da zero. */
export function nuovoLavoro(aziendaId, livello = 0) {
  return { aziendaId, livello, performance: 50, visibilita: 5, anzianita: 0 };
}
