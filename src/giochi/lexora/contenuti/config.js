/**
 * Lexora, tutto in numeri.
 *
 * Ogni valore che decide come si gioca sta qui e solo qui: quante parole
 * ha una partita, quanti tentativi si hanno per indovinarne una, quanto
 * dura un turno, quanto paga trovarla al secondo colpo invece che al
 * quinto. Bilanciare il gioco vuol dire aprire questo file, e nessun
 * altro.
 *
 * I valori delle lettere non stanno qui ma nella lingua
 * (`contenuti/lingue`): quanto e' frequente una lettera e' una proprieta'
 * di quella lingua, non una regola del gioco.
 */

export const CONFIG = {
  /* ─── La partita ───
     Una partita e' fatta di parole segrete. Per ognuna, tutti e due i
     giocatori hanno la stessa parola da indovinare e i loro tentativi:
     cosi' i punteggi si possono confrontare, che e' l'unico modo di
     vincere un duello a indovinelli senza che conti la fortuna. */
  partita: {
    parole: 2,            // quante parole segrete in una partita
    tentativi: 8,         // quanti tentativi per parola, a testa
  },

  /* ─── La parola segreta ───
     Corta e comune: una parola di dieci lettere non si indovina in otto
     tentativi, e una parola rarissima non si indovina affatto. La rarita'
     massima tiene fuori le voci curate, che sono li' per essere scoperte
     giocando e non per essere azzeccate al buio. */
  parola: {
    minimo: 5,
    massimo: 7,
    /* La rarita' e' anche una stima della lunghezza — una parola di sette
       lettere che nessuno ha annotato a mano risulta rara solo perche' e'
       lunga — quindi con il tetto a due le parole da sette non uscivano
       mai, e un traguardo chiedeva una cosa impossibile. A tre entrano, e
       restano fuori solo le voci curate come rare davvero. */
    raritaMassima: 3,
  },

  /* ─── Il tempo ───
     Questo e' il turno del multiplayer, dove i due giocatori hanno la
     stessa parola e lo stesso tempo. Nella prova in solitario il tempo lo
     decide il livello: e' li' che sta la difficolta'. */
  turno: {
    secondi: 150,         // quanto dura un tentativo: due minuti e mezzo per pensarci
    /* Quanto ci si mette davvero, non quanto si potrebbe: serve solo a
       dire a chi guarda l'elenco dei giochi se ha tempo di farsi una
       partita. Il caso peggiore — tutti i tentativi presi per intero — e'
       una mezz'ora che non succede mai. */
    tipici: 25,
    /* Quanto si perdona a chi conferma sul filo: il tempo lo misura chi
       chiama passando `adesso`, e fra il dito e il motore c'e' sempre
       qualche decimo. Rifiutare un tentativo arrivato a 150,04 secondi
       sarebbe giusto e insopportabile. */
    tolleranzaMs: 700,
  },

  /* ─── Il punteggio ───
     Il conto si legge in una frase: indovinarla vale, indovinarla presto
     vale di piu', e una parola lunga o rara vale piu' di una corta e
     comune. Chi non la indovina non esce con zero: le lettere verdi del
     suo tentativo migliore contano qualcosa, perche' arrivare vicino non
     e' come non aver capito niente. */
  punti: {
    indovinata: 50,
    perTentativoRisparmiato: 12,   // ogni tentativo non usato
    lunghezza: { 4: 0, 5: 4, 6: 9, 7: 15 },
    rarita: [0, 0, 3, 7, 12],      // indice = rarita' 0..4
    perVerde: 2,                   // consolazione: le verdi del tentativo migliore
    /* Il premio del tempo. Vale solo nella prova in solitario, dove il
       livello dice entro quanti secondi una parola e' «veloce»: ogni
       secondo risparmiato su quel tetto vale un punto. E' il pezzo che
       lega il punteggio all'orologio invece che ai soli tentativi — due
       parole indovinate al quinto colpo con calma non devono valere
       quanto due indovinate al quinto colpo di corsa. */
    perSecondoRisparmiato: 1,
  },

  /* ─── La scoperta ───
     Da questa rarita' in su la parola indovinata si mostra con la sua
     scheda: definizione e traduzioni. */
  scoperta: { rarita: 3 },

  /* ─── Il bot ───
     Non lo usa piu' nessuno: la prova in solitario si gioca contro se
     stessi, non contro il computer. Resta perche' nel deposito di chi ha
     gia' giocato ci sono partite con un bot dentro, e quelle devono poter
     essere riaperte e rilette.
     `sbaglia` e' la probabilita' che a un certo turno non giochi la
     parola migliore che conosce: e' cosi' che si fa un avversario
     battibile senza fargli fare mosse assurde. `pensaMs` non serve al
     motore, serve a chi guarda — una risposta istantanea non sembra una
     partita. */
  bot: {
    facile: { sbaglia: 0.55, pensaMs: 2200 },
    medio: { sbaglia: 0.25, pensaMs: 1500 },
    difficile: { sbaglia: 0, pensaMs: 900 },
  },
};

/**
 * La soglia e' la stessa a tutti i livelli, e non e' una pigrizia: e' la
 * cosa che rende la scala una scala.
 *
 * Se salisse con il livello, salirebbero due cose insieme — quanto devi
 * fare e quanto poco tempo hai per farlo — e non si capirebbe piu' quale
 * delle due ti ha fermato. Ferma il numero e stringi il tempo: **lo stesso
 * punteggio, con meno secondi per arrivarci**. Al primo livello duecento-
 * quaranta punti li fai anche con calma; all'ultimo li fai solo se la
 * parola ti viene in mente subito.
 */
const SOGLIA = 240;

/**
 * La prova in solitario: sei livelli, e la difficolta' e' il tempo.
 *
 * Prima il «giocatore singolo» era una corsa contro un computer che
 * sbagliava apposta, e la difficolta' era quanto sbagliava. Ma un
 * indovinello non e' una gara: la parola la sai o non la sai, e avere
 * accanto qualcuno che la sa prima di te non rende il gioco piu'
 * difficile, lo rende piu' corto. Adesso si gioca contro se stessi, e
 * quello che stringe e' l'orologio.
 *
 * Ogni livello dice quattro cose:
 *
 *  - `secondi` — quanto dura un tentativo. E' la difficolta': da due
 *    minuti e mezzo a quarantacinque secondi.
 *  - `tempoBuono` — entro quanti secondi una parola conta come veloce.
 *    Ogni secondo risparmiato su questo tetto e' un punto. E' un numero
 *    di secondi veri, non una frazione del turno: se scendesse in
 *    proporzione al turno, chi e' sempre altrettanto veloce *in
 *    percentuale* passerebbe tutti i livelli uguale, e la scala non
 *    salirebbe. Scende piu' in fretta del turno apposta.
 *  - `parola` — quanto e' lunga e quanto rara. Sale piano: al primo
 *    livello cinque lettere comuni, all'ultimo sette anche rare.
 *  - `soglia` — i punti che servono per passare, uguali per tutti i
 *    livelli (vedi sopra). Non bastano da soli: **vanno indovinate tutte
 *    e due le parole**. La soglia dice quanto in fretta.
 *
 * Chi passa un livello apre il successivo, e il livello aperto resta
 * aperto: si puo' sempre tornare a rifare uno gia' fatto.
 */
export const LIVELLI = [
  { n: 1, nome: 'Principiante', secondi: 150, tempoBuono: 220, parola: { minimo: 5, massimo: 5, raritaMassima: 2 }, soglia: SOGLIA },
  { n: 2, nome: 'Apprendista',  secondi: 120, tempoBuono: 180, parola: { minimo: 5, massimo: 6, raritaMassima: 2 }, soglia: SOGLIA },
  { n: 3, nome: 'Copista',      secondi: 95,  tempoBuono: 150, parola: { minimo: 5, massimo: 6, raritaMassima: 3 }, soglia: SOGLIA },
  { n: 4, nome: 'Scriba',       secondi: 75,  tempoBuono: 125, parola: { minimo: 6, massimo: 7, raritaMassima: 3 }, soglia: SOGLIA },
  { n: 5, nome: 'Lessicografo', secondi: 60,  tempoBuono: 112, parola: { minimo: 6, massimo: 7, raritaMassima: 3 }, soglia: SOGLIA },
  { n: 6, nome: 'Oracolo',      secondi: 48,  tempoBuono: 90,  parola: { minimo: 6, massimo: 7, raritaMassima: 4 }, soglia: SOGLIA },
];

/** Il livello `n`, o il primo se `n` non esiste. */
export const livelloDi = (n) => LIVELLI.find((l) => l.n === n) || LIVELLI[0];

/** L'ultimo livello della scala: chi lo passa ha finito la prova. */
export const ULTIMO_LIVELLO = LIVELLI[LIVELLI.length - 1].n;

/**
 * La configurazione di un livello: la base, con dentro il suo tempo e le
 * sue parole. Passandola al motore, tutto il resto — la pesca della
 * segreta, la scadenza del turno, il punteggio — legge i valori giusti
 * senza sapere che esistono i livelli.
 */
export function configDiLivello(n) {
  const l = livelloDi(n);
  return {
    ...CONFIG,
    parola: { ...CONFIG.parola, ...l.parola },
    turno: { ...CONFIG.turno, secondi: l.secondi },
    livello: l,
  };
}

/** Il premio della lunghezza: quello che dice la tabella, o il massimo. */
export function puntiLunghezza(n) {
  const t = CONFIG.punti.lunghezza;
  const chiavi = Object.keys(t).map(Number).sort((a, b) => a - b);
  let fuori = 0;
  for (const k of chiavi) if (n >= k) fuori = t[k];
  return fuori;
}
