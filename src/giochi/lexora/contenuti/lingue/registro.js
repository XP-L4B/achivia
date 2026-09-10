/**
 * Le lingue di Lexora: il registro.
 *
 * Una lingua e' un file in questa cartella e una riga qui. Il motore non
 * la conosce: le chiede l'alfabeto, il dizionario e le sue regole, e va
 * avanti. Aggiungerne una — portoghese, olandese, polacco — vuol dire
 * scrivere il suo file e aggiungerlo a questo elenco. Il motore non si
 * tocca.
 *
 * Il dizionario si indicizza la prima volta che serve e poi resta: una
 * `Map` da parola normalizzata alla sua scheda, cosi' "questa parola
 * esiste?" e' una lettura sola, non una scansione.
 */

import { it } from './it';
import { en } from './en';
import { fr } from './fr';
import { es } from './es';
import { de } from './de';
import { normalizza } from '../../motore/normalizza';

export const LINGUE = [it, en, fr, es, de];

export const LINGUA_PREDEFINITA = 'it';

const per = new Map(LINGUE.map((l) => [l.id, l]));

/** La scheda di una lingua; quella predefinita se l'id non esiste. */
export const linguaById = (id) => per.get(id) || per.get(LINGUA_PREDEFINITA);

/** L'elenco per chi deve farla scegliere: id e nome, niente altro. */
export const elencoLingue = () => LINGUE.map((l) => ({ id: l.id, nome: l.nome }));

/* Gli indici, uno per lingua, costruiti alla prima domanda. */
const indici = new Map();

/**
 * L'indice di una lingua: parola normalizzata → scheda completa.
 *
 * La scheda che esce ha sempre tutti i campi del modello, anche quelli che
 * la voce non aveva: chi la legge non deve chiedersi se `translations`
 * esiste. `allowedInGame: false` resta nell'indice ma non si puo' giocare:
 * serve a poter disattivare una parola senza cancellarla, che e' quello
 * che vorra' fare un domani chi amministra.
 */
export function indiceDi(linguaId) {
  const lingua = linguaById(linguaId);
  const gia = indici.get(lingua.id);
  if (gia) return gia;
  const mappa = new Map();
  const curate = new Set();
  for (const { voce, curata } of vociDi(lingua)) {
    const scheda = schedaParola(voce, lingua);
    if (!scheda.normalizedWord) continue;
    // Due parole che normalizzano uguale: resta la prima, e non e' un caso
    // da nascondere — l'elenco della lingua non dovrebbe averle. L'unica
    // che passa sopra e' la voce curata: QUARZO sta anche fra i materiali,
    // ma quella con la definizione e la rarita' scritta a mano e' l'altra,
    // e deve vincere lei. Fra due curate, resta comunque la prima.
    const gia = mappa.has(scheda.normalizedWord);
    if (gia && (!curata || curate.has(scheda.normalizedWord))) continue;
    mappa.set(scheda.normalizedWord, scheda);
    if (curata) curate.add(scheda.normalizedWord);
  }
  indici.set(lingua.id, mappa);
  return mappa;
}

/**
 * Le voci di una lingua, da tutte e due i modi di scriverle.
 *
 * `gruppi` e' l'elenco per categoria — il grosso del dizionario, dove
 * quello che conta e' che la parola esista e a che famiglia appartenga.
 * `parole` sono le voci scritte per esteso: quelle che hanno una
 * definizione, delle traduzioni, una rarita' decisa a mano. Le seconde
 * vincono sulle prime, cosi' una parola che sta in un gruppo e ha anche
 * la sua scheda esce con la scheda.
 */
function vociDi(lingua) {
  const fuori = [];
  for (const categoria of Object.keys(lingua.gruppi || {})) {
    for (const w of lingua.gruppi[categoria]) fuori.push({ voce: { word: w, category: categoria }, curata: false });
  }
  for (const v of lingua.parole || []) fuori.push({ voce: typeof v === 'string' ? { word: v } : v, curata: true });
  return fuori;
}

/**
 * Quanto e' rara una parola, quando non lo dice la sua scheda: dalla
 * lunghezza. Non e' la verita' — la rarita' vera e' una proprieta' della
 * lingua e la scrive chi cura il dizionario — e' una stima che serve a
 * dare piu' punti a una parola lunga senza doverle annotare tutte.
 */
export function raritaDaLunghezza(n) {
  if (n <= 4) return 1;
  if (n <= 6) return 2;
  if (n <= 8) return 3;
  return 4;
}

/** Una voce del dizionario nella forma completa del modello. */
export function schedaParola(voce, lingua) {
  const word = typeof voce === 'string' ? voce : voce.word;
  const normalizedWord = normalizza(word, lingua);
  return {
    word,
    language: lingua.id,
    normalizedWord,
    definition: voce.definition ?? '',
    translations: voce.translations ?? {},
    category: voce.category ?? 'generale',
    difficulty: voce.difficulty ?? Math.min(4, Math.ceil(normalizedWord.length / 3)),
    rarity: voce.rarity ?? raritaDaLunghezza(normalizedWord.length),
    grammaticalType: voce.grammaticalType ?? 'noun',
    allowedInGame: voce.allowedInGame !== false,
    tags: voce.tags ?? [],
  };
}

/** La scheda di una parola, o `null` se in questa lingua non esiste. */
export function cerca(parola, linguaId) {
  const lingua = linguaById(linguaId);
  return indiceDi(lingua.id).get(normalizza(parola, lingua)) ?? null;
}

/** Tutte le categorie che una lingua usa davvero: le legge dal suo dizionario. */
export function categorieDi(linguaId) {
  const lingua = linguaById(linguaId);
  const viste = new Map();
  for (const s of indiceDi(lingua.id).values()) {
    if (!s.allowedInGame) continue;
    viste.set(s.category, (viste.get(s.category) || 0) + 1);
  }
  return [...viste.entries()]
    .map(([id, quante]) => ({ id, nome: lingua.categorie?.[id] ?? id, quante }))
    .sort((a, b) => b.quante - a.quante);
}
