/**
 * Il replay: la stessa partita, rigiocata.
 *
 * Con seme, percorso e log si rigioca tutto. Serve a tre cose:
 *
 *  - **verificare** una partita (`verificaPartita`): si rigioca sullo
 *    stesso background e si confronta il riassunto con quello dichiarato.
 *    E' il pezzo pensato per un server; gira anche qui, senza server, con
 *    i limiti detti in `deposito/theclimb.js`;
 *  - **«E se fossi nato altrove?»** (`confronto`): le stesse identiche
 *    scelte su tutti e cinque i background, e dove si sarebbe arrivati;
 *  - rigiocare un difetto.
 *
 * La regola del replay su un altro background, decisa nel piano: **non ci
 * sono ripieghi**. Quando una scelta non e' disponibile — un'offerta che
 * non c'e', una persona che non si e' incontrata, un colloquio con la
 * porta chiusa — la si salta e la settimana va con la routine che il
 * giocatore aveva allora; quando un evento non arriva, non arriva; quando
 * arriva un evento che nella partita originale non c'era, risponde la
 * predefinita. Il confronto conta le tre cose separatamente, cosi' il
 * giocatore sa quanto del suo percorso quell'altra vita avrebbe potuto
 * fare davvero.
 */

import {
  creaPartita, scegliPercorso, impostaRoutine, giocaSettimana, prendiLavoro, lasciaLavoro,
  faiColloquio, accettaOfferta, rifiutaOfferta, agisci, rispondiEvento, rispondiConLaRoutine, bara, fermati, molla,
  riassunto,
} from './partita.js';
import { BACKGROUND } from '../contenuti/background.js';
import { livelloN } from '../contenuti/livelli.js';
import { finaleDi } from '../contenuti/storia.js';

/** Le righe del log che sono decisioni: le altre sono esiti scritti per memoria. */
const DECISIONI = new Set(['percorso', 'routine', 'lavoro', 'dimissioni', 'colloquio', 'rifiuto_offerta', 'persona', 'evento', 'scorrettezza', 'fermato', 'mollato', 'piano']);

/**
 * Rigioca. Torna lo stato finale e i contatori:
 *   saltate           scelte che in questa vita non si potevano fare
 *   nonArrivate       eventi a cui si era risposto, e qui non sono arrivati
 *   nonPreviste       eventi arrivati qui e non nella partita originale (ha risposto la routine)
 *   settimaneRoutine  settimane in cui il piano non ci stava, e si e' andati con la routine
 */
export function rigioca({ seme, background, log, opzioni = {} }) {
  const s = creaPartita({ seme, background, ...opzioni });
  const conta = { saltate: 0, nonArrivate: 0, nonPreviste: 0, settimaneRoutine: 0, fatte: 0 };
  const righe = (log ?? []).filter((r) => DECISIONI.has(r.tipo));
  let i = 0;
  while (i < righe.length && s.fase !== 'finita') {
    const r = righe[i];
    i += 1;
    if (r.s < s.settimana) continue;                       // una scelta di una settimana gia' passata: qui non c'e' piu'
    while (r.s > s.settimana && s.fase !== 'finita') {     // settimane senza righe: si va con la routine
      conta.nonPreviste += s.eventi.length;
      const x = giocaSettimana(s);
      if (!x.ok) break;
    }
    if (s.fase === 'finita') break;
    const esito = applica(s, r, conta);
    if (esito === 'ok') conta.fatte += 1;
    else if (esito === 'saltata') conta.saltate += 1;
    else if (esito === 'nonArrivata') conta.nonArrivate += 1;
  }
  /* il log e' finito ma la vita no: si va con la routine fino alla fine, o
     fino a dove arrivava la partita originale */
  const ultima = righe.length ? righe[righe.length - 1].s : 0;
  while (s.fase !== 'finita' && s.settimana <= ultima) {
    conta.nonPreviste += s.eventi.length;
    const x = giocaSettimana(s);
    if (!x.ok) break;
  }
  return { stato: s, conta };
}

function applica(s, r, conta) {
  switch (r.tipo) {
    case 'percorso': return scegliPercorso(s, r.percorso).ok ? 'ok' : 'saltata';
    case 'routine': return impostaRoutine(s, r.piano).ok ? 'ok' : 'saltata';
    case 'lavoro': {
      if (r.livello === undefined) return prendiLavoro(s, r.azienda).ok ? 'ok' : 'saltata';
      return accettaOfferta(s, r.azienda).ok ? 'ok' : 'saltata';
    }
    case 'dimissioni': return lasciaLavoro(s).ok ? 'ok' : 'saltata';
    case 'colloquio': return faiColloquio(s, r.azienda).ok ? 'ok' : 'saltata';
    case 'rifiuto_offerta': return rifiutaOfferta(s, r.azienda).ok ? 'ok' : 'saltata';
    case 'persona': return agisci(s, r.persona, r.azione).ok ? 'ok' : 'saltata';
    case 'evento': {
      const pendente = s.eventi.find((p) => p.id === r.evento);
      if (!pendente) return 'nonArrivata';
      const x = rispondiEvento(s, r.evento, r.opzione);
      if (x.ok) return 'ok';
      /* l'opzione qui non c'e' (una porta chiusa, i soldi che mancano): risponde la predefinita */
      rispondiConLaRoutine(s);
      return 'saltata';
    }
    case 'scorrettezza': return bara(s, r.quale).ok ? 'ok' : 'saltata';
    case 'fermato': return fermati(s).ok ? 'ok' : 'saltata';
    case 'mollato': return molla(s).ok ? 'ok' : 'saltata';
    case 'piano': {
      /* prima si risponde a quello che aspetta e a cui il log non ha risposto */
      conta.nonPreviste += s.eventi.length;
      if (s.eventi.length) rispondiConLaRoutine(s);
      const x = giocaSettimana(s, r.piano);
      if (x.ok) return 'ok';
      conta.settimaneRoutine += 1;
      giocaSettimana(s);
      return 'saltata';
    }
    default: return 'ok';
  }
}

/* ─── La verifica ─── */

/** Le voci del riassunto che devono combaciare. */
const CHIAVI_VERIFICA = ['settimane', 'livelloMassimo', 'soldi', 'integrita', 'scorrettezze'];

/**
 * Rigioca la partita sullo stesso background e dice se il riassunto
 * dichiarato e' quello che ne esce. Per la classifica: un punteggio
 * ritoccato nel deposito non passa; un motore cambiato sotto i piedi di
 * una partita salvata nemmeno, ed e' giusto che si veda.
 */
export function verificaPartita(dichiarato, log) {
  if (!dichiarato || !Array.isArray(log)) return { ok: false, perche: 'dati mancanti' };
  if (dichiarato.versioneMotore !== creaPartita({ seme: 0 }).versioneMotore) return { ok: false, perche: 'la partita viene da un altro motore' };
  const { stato } = rigioca({ seme: dichiarato.seme, background: dichiarato.background, log });
  const rifatto = riassunto(stato);
  for (const k of CHIAVI_VERIFICA) {
    if (String(rifatto[k]) !== String(dichiarato[k])) return { ok: false, perche: `non torna: ${k} dice ${dichiarato[k]}, rigiocando viene ${rifatto[k]}` };
  }
  if ((rifatto.esito?.causa ?? null) !== (dichiarato.esito?.causa ?? null)) return { ok: false, perche: `non torna: la fine dice ${dichiarato.esito?.causa}, rigiocando viene ${rifatto.esito?.causa}` };
  return { ok: true, riassunto: rifatto };
}

/* ─── E se fossi nato altrove? ─── */

/**
 * Le stesse scelte, cinque vite. Torna una riga per background, con dove
 * si e' arrivati e quanto del percorso quella vita ha potuto fare.
 */
export function confronto(stato) {
  const log = stato.log;
  return BACKGROUND.map((b) => {
    const mia = b.id === stato.background;
    const { stato: s, conta } = mia ? { stato, conta: { saltate: 0, nonArrivate: 0, nonPreviste: 0, settimaneRoutine: 0, fatte: 0 } } : rigioca({ seme: stato.seme, background: b.id, log });
    const r = riassunto(s);
    const causa = r.esito?.causa ?? null;
    const arrivo = livelloN(r.livelloMassimo).nome;
    let testo;
    if (causa === 'cima' || causa === 'cima_vuota') testo = `CEO di ACHIVIA SPA in ${r.settimane} settimane${causa === 'cima_vuota' ? ', da soli' : ''}`;
    else if (causa === 'impresa') testo = `la sua azienda, comprata da ACHIVIA alla settimana ${r.settimane}`;
    else if (causa === 'tempo' || causa === 'fermato' || causa === null) testo = `${arrivo}${causa === 'fermato' ? ', fermandosi lì' : ''}`;
    else testo = `${arrivo} — partita chiusa alla settimana ${r.settimane}: ${finaleDi(causa).titolo.toLowerCase()}`;
    return {
      background: b.id, nome: b.nome, mia,
      causa, settimane: r.settimane, livelloMassimo: r.livelloMassimo, livelloNome: arrivo, soldi: r.soldi, integrita: r.integrita,
      testo, conta,
    };
  });
}
