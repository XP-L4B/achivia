/**
 * Chi bussa oggi, e con che cosa.
 *
 * Il pescaggio e' deterministico: stesso seme e stesse decisioni, stessa
 * fila alla porta. Non e' un vezzo — serve a rigiocare una partita per
 * ricontrollare un punteggio, e serve al simulatore che ne gioca
 * diecimila.
 *
 * Tre regole lo governano.
 *
 * **L'escalation.** Il livello di quello che ti chiedono viene
 * dall'indulgenza: piu' hai detto di si', piu' in alto si pesca. Un
 * archetipo esce solo ai livelli che dichiara, quindi il diritto di veto
 * sulle assunzioni non puo' arrivare il primo giorno per sfortuna: arriva
 * quando te lo sei meritato.
 *
 * **I rimandati tornano.** Quello che hai rimandato rientra in fila dopo
 * qualche giorno, con un livello in piu' e un moltiplicatore sul costo. E'
 * il modo in cui il gioco dice che rimandare non e' una terza via.
 *
 * **Nessuna ripetizione.** Dentro la stessa partita lo stesso archetipo non
 * torna dalla stessa persona, e i testi (che arriveranno dalla banca) non
 * si ripetono mai. Se il filtro non trova niente si allarga invece di
 * lasciare la giornata a meta': il gioco non resta mai senza contenuto.
 */

import { richiesteDelGiorno, managerDelGiorno, INDULGENZA } from '../contenuti/bilancio.js';
import { ARCHETIPI } from '../contenuti/archetipi.js';
import { dipendentiAttivi, managerAttivi } from './persone.js';
import { scegliTesto } from './testi.js';

/** Il livello di escalation di adesso: da uno a quattro, secondo l'indulgenza. */
export function livelloDi(indulgenza) {
  let livello = 1;
  for (const soglia of INDULGENZA.soglie) if (indulgenza >= soglia) livello += 1;
  return livello;
}

const puoUscire = (a, livello) => livello >= a.livelli[0] && livello <= a.livelli[1];

/** Gli archetipi che possono uscire adesso, per quel tipo di autore. */
function candidati(autoreTipo, livello) {
  const perTipo = ARCHETIPI.filter((a) => (autoreTipo === 'assistant_manager'
    ? a.autore === 'manager' || a.autore === 'entrambi'
    : a.autore === 'dipendente' || a.autore === 'entrambi'));
  const inLivello = perTipo.filter((a) => puoUscire(a, livello));
  /* Se a questo livello non c'e' niente, si scende: meglio una richiesta
     facile che una giornata vuota. */
  return inLivello.length ? inLivello : perTipo;
}

/**
 * La fila della giornata. `stato` non viene modificato: torna l'elenco, e
 * chi chiama decide che farne.
 */
export function pescaGiornata(stato) {
  const giorno = stato.giorno;
  const quante = richiesteDelGiorno(giorno);
  const { massimo, minimo } = managerDelGiorno(giorno);
  const livello = livelloDi(stato.azienda.indulgenza);
  const caso = stato.caso;

  /* Quanti manager oggi: fra il minimo e il massimo, mai piu' dei dipendenti. */
  const quantiManager = massimo <= minimo ? minimo : minimo + caso.intero(massimo - minimo + 1);

  const fila = [];

  /* 1. Prima i rimandati che tornano: hanno un appuntamento, e lo mantengono. */
  const tornano = stato.rimandate.filter((r) => r.torna <= giorno);
  for (const r of tornano) {
    fila.push({
      id: `g${giorno}-r${fila.length}`,
      archetipo: r.archetipo,
      autoreId: r.autoreId,
      autoreTipo: r.autoreTipo,
      livello: Math.min(4, r.livello + 1),
      scala: r.scala * (1 + INDULGENZA.rincaro),
      tornata: true,
      rimandataIl: r.rimandataIl,
    });
  }
  stato.rimandate = stato.rimandate.filter((r) => r.torna > giorno);

  /* 2. Poi le nuove: i manager, e tutto il resto dipendenti. */
  const gente = dipendentiAttivi(stato.persone);
  const capi = managerAttivi(stato.persone);
  const restano = Math.max(0, quante - fila.length);
  const daManager = Math.min(quantiManager, restano, capi.length);

  for (let i = 0; i < restano; i += 1) {
    const daCapo = i < daManager && capi.length > 0;
    const gruppo = daCapo ? capi : gente;
    if (gruppo.length === 0) continue;
    const autore = gruppo[caso.intero(gruppo.length)];
    const tipo = daCapo ? 'assistant_manager' : 'dipendente';
    const possibili = candidati(tipo, livello);
    /* Niente due volte lo stesso archetipo dalla stessa persona, nella
       stessa partita: e' il ricordo che rende credibile chi parla. */
    const visti = stato.gia[autore.id] || (stato.gia[autore.id] = new Set());
    const liberi = possibili.filter((a) => !visti.has(a.id));
    const scelto = (liberi.length ? liberi : possibili)[caso.intero((liberi.length ? liberi : possibili).length)];
    visti.add(scelto.id);
    fila.push({
      id: `g${giorno}-${i}`,
      archetipo: scelto.id,
      autoreId: autore.id,
      autoreTipo: tipo,
      livello: Math.max(scelto.livelli[0], Math.min(livello, scelto.livelli[1])),
      scala: 1,
      tornata: false,
      rimandataIl: 0,
    });
  }

  /* Mescolare: i manager non devono stare tutti in cima, se no il giocatore
     impara a riconoscerli dalla posizione invece che da quello che dicono. */
  for (let i = fila.length - 1; i > 0; i -= 1) {
    const j = caso.intero(i + 1);
    [fila[i], fila[j]] = [fila[j], fila[i]];
  }
  const finale = fila.slice(0, quante);
  /* Il testo si sceglie adesso, con il caso della partita, e solo se una
     banca c'e': il motore gira anche senza — le prove e il simulatore non
     hanno bisogno di leggere niente, e caricare duecento testi per
     giocare diecimila partite sarebbe tempo buttato. */
  for (const r of finale) {
    const voce = scegliTesto(stato.banca, r, caso, stato.testiUsati);
    r.testo = voce ? voce.id : null;
    r.voce = voce;
  }
  return finale;
}
