/**
 * I personaggi dell'arena: sei classi, una per ogni dieci livelli
 * dell'account Achivia.
 *
 * Il soldato e' di tutti. Gli altri si sbloccano salendo di livello
 * nell'applicazione — non nel gioco: e' il lavoro vero che apre l'arena,
 * non il contrario. Il livello di sblocco sta scritto qui, sulla scheda,
 * e `data/arena.js` lo legge: nessun altro file conosce i numeri.
 *
 * I numeri sono moltiplicatori della base, cosi' un modulo che dice "+25%
 * di danno" vale per tutti allo stesso modo. `animato` dice se il foglio
 * ha cammino, colpito e morte disegnati; senza, li fa il codice.
 */

import { CRITICO } from './armi';

export const BASE = {
  vita: 100,
  velocita: 88,       // pixel di mondo al secondo
  raccolta: 40,       // raggio entro cui le gemme vengono attirate
};

export const PERSONAGGI = [
  {
    id: 'soldato', nome: 'Soldato', classe: 'Guerriero', sblocco: 0, animato: true,
    descrizione: 'Equilibrato in tutto. Il personaggio con cui si impara l’arena.',
    vita: 1, velocita: 1, danno: 1, cadenza: 1, gittata: 1, raccolta: 1, proiettili: 1,
  },
  {
    id: 'orco', nome: 'Orco', classe: 'Berserker', sblocco: 10, animato: true,
    descrizione: 'Molta vita e colpi pesanti, ma lento a muoversi e a ricaricare.',
    vita: 1.5, velocita: 0.85, danno: 1.5, cadenza: 1.25, gittata: 0.85, raccolta: 1, proiettili: 1,
  },
  {
    id: 'furfante', nome: 'Furfante', classe: 'Rapido', sblocco: 20, animato: false,
    descrizione: 'Veloce e con la mano lesta. Poca vita: qui si schiva, non si incassa.',
    vita: 0.7, velocita: 1.3, danno: 0.8, cadenza: 0.65, gittata: 0.9, raccolta: 1.4, proiettili: 1,
  },
  {
    id: 'arciere', nome: 'Arciere', classe: 'Tiratore', sblocco: 30, animato: false,
    descrizione: 'Colpisce da lontano prima che i nemici arrivino a tiro.',
    vita: 0.85, velocita: 1, danno: 1.1, cadenza: 1, gittata: 1.6, raccolta: 1, proiettili: 1,
  },
  {
    id: 'occultista', nome: 'Occultista', classe: 'Evocatore', sblocco: 40, animato: false,
    descrizione: 'Due proiettili per colpo. Fragile, e per questo temuto.',
    vita: 0.75, velocita: 0.95, danno: 0.75, cadenza: 1, gittata: 1.15, raccolta: 1.2, proiettili: 2,
  },
  {
    id: 'gladiatore', nome: 'Gladiatore', classe: 'Baluardo', sblocco: 50, animato: false,
    descrizione: 'Incassa tutto e restituisce a poco a poco. Per chi vuole durare.',
    vita: 1.8, velocita: 0.9, danno: 1.2, cadenza: 1.1, gittata: 0.9, raccolta: 0.9, proiettili: 1,
  },
];

export const personaggioById = (id) => PERSONAGGI.find((p) => p.id === id) || PERSONAGGI[0];

/**
 * Quanto vale un livello dell'account, sulle statistiche del personaggio.
 *
 * Mezzo punto percentuale per ogni livello *salito*: al livello 1 — dove
 * cominciano tutti — il personaggio e' esattamente quello scritto sulla
 * sua scheda qui sopra, e da li' in poi ogni livello lo rende un filo piu'
 * forte. Al 20 sono +9,5%, al 50 +24,5%.
 *
 * Si conta dai livelli saliti e non dal numero del livello perche' un
 * bonus che c'e' gia' al primo non e' un bonus, e' un numero diverso
 * scritto in due posti: la scheda direbbe una cosa e il gioco ne farebbe
 * un'altra.
 */
export const BONUS_PER_LIVELLO = 0.005;
export const bonusDiLivello = (livello) =>
  Math.max(0, Math.round(Number(livello) || 1) - 1) * BONUS_PER_LIVELLO;

/**
 * Le statistiche di partenza di un personaggio, al livello di account `livello`.
 *
 * Le dieci statistiche della progressione. `vitaMax`, `velocita`,
 * `raccolta` e `armatura` sono valori (l'armatura toglie tanti punti a
 * ogni colpo subito). `danno`, `cadenza`, `gittata` e `velocitaProiettili`
 * sono moltiplicatori che valgono per tutte le armi: le armi portano i
 * loro numeri (`contenuti/armi.js`), il personaggio li scala, e i moduli
 * scalano ancora. `proiettiliExtra` e' quanti proiettili in piu' lanciano
 * le armi che ne lanciano; `critico` e' la probabilita' del colpo critico
 * e `criticoDanno` quante volte il danno vale quando succede.
 *
 * Il bonus del livello sale ogni statistica che parte da un numero, nel
 * verso che aiuta: la cadenza e' l'unica in cui aiutare vuol dire
 * scendere, perche' e' un'attesa. Le tre che partono da zero — critico,
 * armatura, proiettili in piu' — restano a zero: una percentuale di zero
 * e' zero, e fingere il contrario vorrebbe dire regalare mezzo proiettile.
 */
export function statistichePartenza(personaggio, livello = 1) {
  const p = personaggioById(personaggio?.id ?? personaggio);
  const b = bonusDiLivello(livello);
  const su = (v) => v * (1 + b);
  return {
    vitaMax: Math.round(BASE.vita * p.vita * (1 + b)),
    velocita: su(BASE.velocita * p.velocita),
    raccolta: su(BASE.raccolta * p.raccolta),
    danno: su(p.danno),
    // Un'attesa che scende: sotto un quarto di quella della scheda non va,
    // a qualunque livello si arrivi. Un'attesa negativa vorrebbe dire
    // un'arma che spara a ogni passo, cioe' sessanta volte al secondo.
    cadenza: p.cadenza * Math.max(0.25, 1 - b),
    gittata: su(p.gittata),
    velocitaProiettili: su(1),
    proiettiliExtra: Math.max(0, (p.proiettili || 1) - 1),
    critico: 0,                     // la probabilita' di critico: la alzano i moduli e gli effetti
    criticoDanno: su(CRITICO.molt), // quante volte il danno, quando e' critico
    armatura: 0,                    // punti tolti a ogni colpo subito
  };
}

/** L'asset della posa: chi e' animato ha un foglio per stato, gli altri uno solo. */
export function spriteDi(personaggio, stato) {
  const p = personaggioById(personaggio?.id ?? personaggio);
  return p.animato ? `personaggio.${p.id}.${stato}` : `personaggio.${p.id}.idle`;
}
