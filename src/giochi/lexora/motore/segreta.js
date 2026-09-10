/**
 * La scelta della parola segreta.
 *
 * Non una parola qualunque del dizionario: una che si possa indovinare nei
 * tentativi che ci sono. Quindi corta e comune
 * — la rarita' massima tiene fuori le voci curate, che stanno li' per
 * essere scoperte giocando e non per essere azzeccate al buio.
 *
 * La pesca passa dal caso della partita, quindi due partite con lo stesso
 * seme hanno le stesse parole segrete: e' quello che rende una partita
 * rigiocabile e una prova ripetibile.
 */

import { indiceDi, linguaById } from '../contenuti/lingue/registro';
import { inLettere } from './normalizza';

/* Le parole candidate di una lingua si calcolano una volta e restano: e'
   una scansione del dizionario, e farla a ogni parola segreta vorrebbe
   dire rifare lo stesso lavoro dodici volte per partita. */
const candidate = new Map();

/** Le parole che possono essere segrete in questa lingua, per lunghezza. */
export function candidateDi(linguaId, config) {
  const chiave = `${linguaId}:${config.parola.minimo}-${config.parola.massimo}:${config.parola.raritaMassima}`;
  const gia = candidate.get(chiave);
  if (gia) return gia;
  const lingua = linguaById(linguaId);
  const indice = indiceDi(linguaId);
  const per = new Map();
  for (const scheda of indice.values()) {
    if (!scheda.allowedInGame) continue;
    if (scheda.rarity > config.parola.raritaMassima) continue;
    const n = scheda.normalizedWord.length;
    if (n < config.parola.minimo || n > config.parola.massimo) continue;
    if (derivata(scheda.normalizedWord, lingua, indice, scheda)) continue;
    if (!per.has(n)) per.set(n, []);
    per.get(n).push(scheda);
  }
  candidate.set(chiave, per);
  return per;
}

/**
 * Se una parola e' la forma di un'altra, e non una parola a se'.
 *
 * Da indovinare si danno le parole del vocabolario, non le loro forme:
 * GATTI e' il plurale di GATTO, PARLO e' una voce di PARLARE, e chi ha in
 * mente la parola giusta ma non la desinenza giusta ha perso per un
 * motivo che col gioco non c'entra.
 *
 * Come si riconosce: non indovinandolo. La lingua dice da quali forme una
 * parola potrebbe derivare — sono regole sue, stanno nel suo file — e qui
 * si guarda se una di quelle esiste davvero nel dizionario. GATTI si
 * scarta perche' GATTO c'e'; CANE resta perche' CANA non c'e'.
 *
 * Qualche parola buona ci va di mezzo: SOLE si scarta perche' esiste SOLA,
 * di cui e' anche il plurale. E' il verso giusto in cui sbagliare — meglio
 * una parola in meno da indovinare che un plurale da indovinare.
 */
function derivata(parola, lingua, indice, scheda) {
  /* I verbi: dalla loro categoria passa solo l'infinito. Le forme
     regolari le prende gia' la regola sopra — CORRI viene da CORRERE, che
     c'e' — ma le irregolari no, e VANNO o SARANNO come parole segrete
     sono peggio di un plurale. L'inglese non ha un infinito che si
     riconosca dalla desinenza, e infatti non dichiara niente: li' passano
     tutte, e MADE puo' capitare. */
  const v = lingua.verbi;
  if (v && scheda?.category === v.categoria && !v.infinito.test(parola)) return true;
  const forme = lingua.formeBase ? lingua.formeBase(parola, scheda?.category) : [];
  for (const b of forme) {
    if (b.length < 2 || b === parola) continue;
    if (indice.has(b)) return true;
  }
  return false;
}

/**
 * Una parola segreta per il turno `indice` di una partita.
 *
 * Le lunghezze crescono: la prima parola e' piu' corta dell'ultima. Non e'
 * una difficolta' che sale a caso — indovinare cinque lettere e' un altro
 * gioco rispetto a indovinarne sette — ed e' il modo piu' semplice per
 * far sentire che la partita va da qualche parte.
 */
export function pescaSegreta(stato, indice = 0) {
  const config = stato.config;
  const per = candidateDi(stato.linguaId, config);
  const lunghezze = [...per.keys()].sort((a, b) => a - b);
  if (lunghezze.length === 0) return null;
  /* La difficolta' sale, ma non su un binario.
     La prima parola non e' mai la piu' lunga e l'ultima non e' mai la piu'
     corta: si comincia in discesa e si finisce in salita. Fra quelle che
     restano si pesca a caso, se no due partite di fila sarebbero la stessa
     partita — con la regola di prima, che distribuiva le lunghezze in
     ordine, con due parole uscivano sempre una da cinque e una da sette e
     quelle da sei non le vedeva nessuno. */
  const quante = config.partita.parole;
  const primo = indice === 0;
  const ultimo = indice >= quante - 1;
  let ammesse = lunghezze;
  if (primo && lunghezze.length > 1) ammesse = lunghezze.slice(0, -1);
  else if (ultimo && lunghezze.length > 1) ammesse = lunghezze.slice(1);
  const lunghezza = ammesse[Math.floor(stato.caso.numero() * ammesse.length)];
  const scelte = per.get(lunghezza) || [];
  if (scelte.length === 0) return null;
  const scheda = scelte[Math.floor(stato.caso.numero() * scelte.length)];
  return {
    scheda,
    parola: scheda.word,
    normalizzata: scheda.normalizedWord,
    lettere: inLettere(scheda.normalizedWord, stato.lingua),
  };
}
