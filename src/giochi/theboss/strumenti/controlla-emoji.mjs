/**
 * Le emoji stanno sopra la testa dei dipendenti, e da nessun'altra parte.
 *
 * E' una regola di gioco: l'umore di chi hai appena accontentato o
 * mandato via si legge da una faccina sopra la sua testa, e proprio perche'
 * e' l'unico posto in cui compaiono, quella faccina si nota. Se le emoji
 * finissero anche nei pulsanti, nei testi delle richieste, nei report e
 * nelle classifiche, smetterebbero di voler dire qualcosa.
 *
 * Una regola scritta in un documento la rispetta chi se la ricorda. Questa
 * invece si controlla: il comando scandaglia tutto il modulo e fallisce se
 * trova un'emoji fuori dai file autorizzati.
 *
 *     node src/giochi/theboss/strumenti/controlla-emoji.mjs
 *     npm run boss:emoji
 *
 * Chi ha bisogno di un umore nuovo lo aggiunge in `contenuti/umori.js`, che
 * e' l'elenco autorizzato: e' un elenco di quindici righe, e passare da li'
 * costringe a chiedersi se serve davvero un'emoji nuova o basta una di
 * quelle che ci sono.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const MODULO = new URL('../', import.meta.url).pathname;

/** Gli unici file in cui un'emoji ha diritto di stare. */
const AUTORIZZATI = [
  'contenuti/umori.js',              // l'elenco degli umori: emoji e nome
  'strumenti/controlla-emoji.mjs',   // questo file, che le deve pur nominare
];

/**
 * Che cos'e' un'emoji, per questo controllo.
 *
 * Non "qualunque carattere strano": l'italiano ha le accentate, i testi
 * hanno le virgolette curve e i trattini lunghi, e il codice ha le frecce
 * dei commenti. Si guardano le proprieta' Unicode che identificano davvero
 * i pittogrammi — piu' i simboli che nel testo diventano emoji con la
 * variante grafica.
 */
const EMOJI = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|️/u;

function* fileDelModulo(dir = MODULO) {
  for (const voce of readdirSync(dir)) {
    const percorso = join(dir, voce);
    if (statSync(percorso).isDirectory()) {
      if (voce === 'assets') continue;          // i disegni non sono testo
      yield* fileDelModulo(percorso);
      continue;
    }
    if (/\.(js|jsx|mjs|md|json)$/.test(voce)) yield percorso;
  }
}

const colpevoli = [];
for (const percorso of fileDelModulo()) {
  const rel = relative(MODULO, percorso).replaceAll('\\', '/');
  if (AUTORIZZATI.includes(rel)) continue;
  const righe = readFileSync(percorso, 'utf8').split('\n');
  righe.forEach((riga, i) => {
    const trovata = [...riga].find((c) => EMOJI.test(c));
    if (trovata) colpevoli.push({ rel, riga: i + 1, trovata, testo: riga.trim().slice(0, 70) });
  });
}

if (colpevoli.length === 0) {
  console.log('[the boss] nessuna emoji fuori posto.');
  process.exit(0);
}

console.error(`[the boss] ${colpevoli.length} emoji fuori dal componente dell'umore:\n`);
for (const c of colpevoli) console.error(`  ${c.rel}:${c.riga}  ${c.trovata}  ${c.testo}`);
console.error('\nLe emoji stanno solo sopra la testa dei dipendenti. Gli umori si');
console.error('aggiungono in contenuti/umori.js; altrove si usa una parola.');
process.exit(1);
