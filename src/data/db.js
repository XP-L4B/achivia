/**
 * Il deposito, dalla porta principale.
 *
 * Questo file era duemilaseicento righe e teneva quattordici domini: utenti,
 * quest, aiuti, competenze, achievement, negozio, ordini, presenze,
 * carriera, abbonamenti, storico, messaggi, blocchi, tetti. Non era un
 * problema di leggibilita' — era che nessuno poteva leggere il vicino prima
 * di scrivere, e le convenzioni si perdevano per strada: le notifiche
 * dell'osservatorio sono nate parlando una lingua diversa da quelle di
 * tutto il resto proprio per questo, e uscivano vuote.
 *
 * Adesso ogni dominio sta nel suo file dentro `deposito/`, e questo resta
 * la porta: chi importa da `./db` continua a trovare tutto dov'era. Nessuna
 * delle settanta schermate ha dovuto cambiare una riga, ed e' il punto —
 * una riorganizzazione che obbliga a toccare tutto il resto non la fa
 * nessuno, e il file continua a crescere.
 *
 * Le dipendenze vanno in un verso solo:
 *
 *     nucleo  ←  utenti  ←  quest  ←  aiuti
 *        ↑         ↑         ↑
 *        └── avvisi, carriera, lavoro, catalogo, progetti,
 *            valutazioni, competenze, traguardi, presenze
 *
 * `nucleo` tiene il deposito, gli eventi e tutte le funzioni che assicurano
 * l'esistenza di una collezione. Sono li' apposta: chiamarle e' l'unica cosa
 * che un dominio deve poter fare sulla roba di un altro, e tenerle insieme
 * evita che i moduli si importino a vicenda solo per questo.
 */

export * from './deposito/nucleo';
export * from './deposito/organizzazioni';
export * from './deposito/membri';
export * from './deposito/ingressi';
export * from './deposito/utenti';
export * from './deposito/avvisi';
export * from './deposito/quest';
export * from './deposito/aiuti';
export * from './deposito/carriera';
export * from './deposito/lavoro';
export * from './deposito/crediti';
export * from './deposito/listino';
export * from './deposito/assistente';
export * from './deposito/pubblicita';
export * from './deposito/pagamenti';
export * from './deposito/catalogo';
export * from './deposito/progetti';
export * from './deposito/valutazioni';
export * from './deposito/competenze';
export * from './deposito/traguardi';
export * from './deposito/traguardiCreati';
export * from './deposito/annunci';
export * from './deposito/presenze';
export * from './deposito/arena';
/* Il deposito di Lexora non passa da qui: chi lo vuole lo importa da
   `deposito/lexora.js` (lo fa `data/lexora.js`, che e' l'unico). Un
   `export *` lo attaccherebbe a db.js, che importano tutte le schermate,
   e con lui il motore e i dizionari delle cinque lingue — nel pacchetto
   che si scarica aprendo Achivia, anche per chi non gioca. */

/* La normalizzazione va in fondo e non nel nucleo: si appoggia a cose dei
   domini — il registro degli abbonamenti, la sospensione dell'elenco — e
   chiamarla prima vorrebbe dire usarle mentre non esistono ancora. Qui
   tutto e' al suo posto, ed e' l'ultima cosa che succede al caricamento. */
import { avvia } from './deposito/avvio';

avvia();
