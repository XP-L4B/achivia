/**
 * Che ora e' nel cielo di Achivia.
 *
 * L'app ha quattro sfondi — alba, giorno, tramonto, notte — e l'ora vera di
 * chi guarda. Questo file mette insieme le due cose e risponde a una
 * domanda sola: adesso, per questa persona, che cielo si vede.
 *
 * Non risponde con una fase soltanto. Quattro immagini che si danno il
 * cambio a orari fissi sarebbero quattro scatti, e alle 19:00 in punto il
 * mondo cambierebbe di colpo. Risponde invece con due fasi e quanto pesa
 * la seconda: alle 18:00 e' giorno al 40% e tramonto al 60%, e chi guarda
 * vede una cosa sola, il tramonto che sta arrivando. Le vie di mezzo non
 * sono altri file: sono le stesse due immagini, una sopra l'altra.
 *
 * L'ora e' quella locale del browser — `new Date()` — quindi non c'e'
 * nessun fuso da gestire e nessun permesso da chiedere. Chi lavora a
 * Tokyo vede la sua alba, non la nostra.
 *
 * Sole e luna non girano in tondo per conto loro: stanno dove li mette
 * l'orologio. Alle 14 il sole e' alto, alle 3 c'e' la luna alta. E' lento
 * — dodici ore per attraversare il cielo — ed e' giusto che lo sia: non e'
 * un'animazione da guardare, e' un cielo che sta passando.
 *
 * Il cielo non e' piu' un'immagine. Il disegno adesso arriva ritagliato —
 * castello, borghi e montagne, col cielo trasparente — e il cielo sta
 * sotto, disegnato da qui: una sfumatura di nove tappe, i cui colori si
 * mescolano fra le due fasi in corso. Non e' una raffinatezza: e' quello
 * che permette al sole e alla luna di sorgere e tramontare *dietro* le
 * montagne, e alle stelle di stare ovunque nel cielo senza doversi
 * guardare dalle vette.
 */

/* ─── Le ore ─────────────────────────────────────────────────
   Ogni riga dice: a quest'ora si vede questa fase, pura. Fra due righe si
   mescolano le due fasi. Sono ore fisse, non l'alba astronomica: quella
   cambia col mese e con la latitudine, e per saperla servirebbe la
   posizione di chi guarda — che non chiediamo per uno sfondo. */
export const MOMENTI = [
  { ora: 1.0,  fase: 'notte' },
  { ora: 5.5,  fase: 'notte' },
  { ora: 7.5,  fase: 'alba' },
  { ora: 9.5,  fase: 'giorno' },
  { ora: 17.0, fase: 'giorno' },
  { ora: 19.5, fase: 'tramonto' },
  { ora: 21.5, fase: 'notte' },
];

export const FASI = ['alba', 'giorno', 'tramonto', 'notte'];

/* ─── Il colore del cielo ────────────────────────────────────
   Nove tappe dall'alto in basso, per ognuna delle quattro ore. Non sono
   inventate: sono state prese dai disegni con il cielo, campionando solo
   dove il cielo si vedeva davvero — il ritaglio dice esattamente dove,
   perche' li' e' trasparente.

   Due tavolozze, non una: il disegno da scrivania non e' il disegno
   quadrato con piu' bordi, e' un altro quadro, con un'altra alba. Le
   ultime tappe si ripetono perche' li' sotto c'e' terra: si vedono solo
   nelle valli, dove il profilo scende.

   Il giorno pero' e' lo stesso in tutte e due, e non per risparmio: viene
   da un disegno solo — quello del telefono — perche' il cielo di mezzogiorno
   e' la stessa aria sopra lo stesso castello, e vederla azzurra su un
   formato e grigia sull'altro faceva sembrare due posti diversi. Le altre
   tre fasi restano quelle dei rispettivi disegni, che sono davvero diversi.

   Il cielo si vede solo dove i ritagli sono trasparenti, ed e' trasparente
   tutto il quarto superiore: sopra le montagne non c'e' nessun pixel
   disegnato, quindi cambiare questa tavolozza cambia davvero il colore del
   cielo e non ci litiga contro. */
const CIELI = {
  quadro: {
    alba:     ['#5f58a6', '#9a84c1', '#c6afd0', '#bfdce4', '#f4d7cb', '#f4d7cb', '#f4d7cb', '#f4d7cb', '#f4d7cb'],
    giorno:   ['#98ddec', '#aae6ea', '#b7ebe7', '#c2efe5', '#c2efe5', '#c2efe5', '#c2efe5', '#c2efe5', '#c2efe5'],
    tramonto: ['#91657c', '#b87673', '#d8896e', '#eca867', '#e6ac71', '#e6ac71', '#e6ac71', '#e6ac71', '#e6ac71'],
    notte:    ['#181a36', '#222545', '#2a2e50', '#2c3558', '#313657', '#313657', '#313657', '#313657', '#313657'],
  },
  scrivania: {
    alba:     ['#364a93', '#5b6ac1', '#8781de', '#a8b5ea', '#aaefef', '#aaefef', '#aaefef', '#aaefef', '#aaefef'],
    giorno:   ['#98ddec', '#aae6ea', '#b7ebe7', '#c2efe5', '#c2efe5', '#c2efe5', '#c2efe5', '#c2efe5', '#c2efe5'],
    tramonto: ['#80536f', '#ac5a68', '#d46758', '#fc8d4d', '#fcc259', '#fcc259', '#fcc259', '#fcc259', '#fcc259'],
    notte:    ['#11152d', '#191e3e', '#21254a', '#282f54', '#2b375b', '#2b375b', '#2b375b', '#2b375b', '#2b375b'],
  },
};

const daEsa = (esa) => [1, 3, 5].map((i) => parseInt(esa.slice(i, i + 2), 16));

/* Quanto velo scuro serve sopra ogni fase perche' i pannelli restino
   leggibili. Tutta l'interfaccia e' nata su un cielo notturno — testo
   chiaro su pannelli scuri — e un mezzogiorno luminoso se la mangia: il
   velo e' il prezzo del giorno. Di notte non serve, l'immagine e' gia'
   scura di suo. */
const VELO = { notte: 0, alba: 0.16, giorno: 0.34, tramonto: 0.18 };

/* Quante stelle si vedono in ogni fase, da 0 a 1. Non e' un interruttore
   fra notte e giorno: un quarto di cielo e' gia' acceso quando il sole e'
   appena andato giu', e lo e' ancora quando sta per tornare. Le prime a
   comparire la sera sono le stesse ultime a sparire la mattina — le piu'
   luminose — e chi decide quale sia quale e' `SfondoVivo`, che le ha in
   mano con la loro luminosita'. */
const STELLE = { notte: 1, alba: 0.25, giorno: 0, tramonto: 0.25 };

/* Il sole sta in cielo fra queste due ore, la luna nelle altre. */
export const SOLE_SORGE = 6.5;
export const SOLE_TRAMONTA = 19.5;

/** L'ora come numero con la virgola: le 14:30 sono 14.5. */
export const oraDi = (data = new Date()) =>
  data.getHours() + data.getMinutes() / 60 + data.getSeconds() / 3600;

/** Da 0 a 1 lungo un tratto, fermandosi agli estremi. */
const tratto = (v, da, a) => (a === da ? 0 : Math.min(1, Math.max(0, (v - da) / (a - da))));

/**
 * Le due fasi fra cui sta un'ora, e quanto pesa la seconda.
 *
 * L'elenco e' un cerchio: dopo l'ultima riga si torna alla prima del
 * giorno dopo. Il tratto piu' lungo e' proprio quello — dalle 21:30 alle
 * 1:00 — ed e' notte da tutte e due le parti, quindi non mescola niente:
 * e' semplicemente notte.
 */
export function fasiA(ora) {
  const giro = MOMENTI.length;
  for (let i = 0; i < giro; i += 1) {
    const qui = MOMENTI[i];
    const poi = MOMENTI[(i + 1) % giro];
    const fine = poi.ora > qui.ora ? poi.ora : poi.ora + 24;
    // L'ora prima della prima riga appartiene all'ultimo tratto, che
    // arriva li' passando per la mezzanotte.
    const adesso = ora >= qui.ora ? ora : ora + 24;
    if (adesso >= qui.ora && adesso <= fine) {
      return { fase: qui.fase, prossima: poi.fase, mescola: tratto(adesso, qui.ora, fine) };
    }
  }
  return { fase: 'notte', prossima: 'notte', mescola: 0 };
}

/** Quanto pesa una fase nel miscuglio di adesso: da 0 a 1. */
export function pesoDi(nome, { fase, prossima, mescola }) {
  return (fase === nome ? 1 - mescola : 0) + (prossima === nome ? mescola : 0);
}

/**
 * Dove sta un astro nel suo arco, e quanto si vede.
 *
 * Entra da sinistra e esce a destra, alzandosi e riabbassandosi: un
 * mezzo giro di seno, che e' la strada che fa davvero. Sul filo
 * dell'orizzonte non compare di colpo — sfuma nell'ultimo decimo del
 * percorso — perche' un sole che si accende in cielo non l'ha mai visto
 * nessuno.
 */
function astro(quota) {
  if (quota < 0 || quota > 1) return { visibile: false, x: 0, y: 0 };
  return {
    visibile: true,
    // Da un bordo all'altro, con un margine: un astro tagliato a meta'
    // dal bordo dello schermo sembra un errore.
    x: 6 + quota * 88,
    // In alto e' zero. L'arco parte e finisce al 75% dell'altezza, che nei
    // disegni e' dentro il bosco: li' l'astro c'e' ma non si vede, perche'
    // il paesaggio gli sta davanti. E' cosi' che sorge — spuntando da
    // dietro una cresta — invece di accendersi a mezz'aria come faceva
    // quando lo sfondo era un'immagine sola e lui ci stava sopra.
    y: 75 - Math.sin(quota * Math.PI) * 67,
  };
}

/**
 * Il cielo di un momento: che immagini mostrare, quanto velo, dove stanno
 * sole e luna, quante stelle sono accese.
 *
 * `stelle` non e' un'opacita' ma una quota: quante ne stanno in cielo,
 * da nessuna a tutte. Farle sbiadire tutte insieme sarebbe un cielo che
 * si spegne; quello che succede davvero e' che se ne vanno una alla
 * volta, e le ultime a restare sono le piu' luminose.
 */
export function cieloA(ora, formato = 'quadro') {
  const fasi = fasiA(ora);
  const tavolozza = CIELI[formato] || CIELI.quadro;
  const velo = FASI.reduce((somma, nome) => somma + VELO[nome] * pesoDi(nome, fasi), 0);

  const giorno = SOLE_TRAMONTA - SOLE_SORGE;
  const sole = astro((ora - SOLE_SORGE) / giorno);
  // La luna fa il resto del giro: dal tramonto all'alba, passando per la
  // mezzanotte. Le ore piccole appartengono alla notte cominciata ieri.
  const notte = 24 - giorno;
  const daTramonto = ora >= SOLE_TRAMONTA ? ora - SOLE_TRAMONTA : ora + 24 - SOLE_TRAMONTA;
  const luna = astro(daTramonto / notte);

  const stelle = FASI.reduce((somma, nome) => somma + STELLE[nome] * pesoDi(nome, fasi), 0);

  // Le tappe del cielo: ognuna e' la miscela delle due fasi in corso. E'
  // qui che il cielo diventa continuo — non due immagini in dissolvenza,
  // ma il colore esatto delle 18:07.
  const da = tavolozza[fasi.fase].map(daEsa);
  const a = tavolozza[fasi.prossima].map(daEsa);
  const tappe = da.map((c, i) => `rgb(${c.map((v, k) => Math.round(v + (a[i][k] - v) * fasi.mescola)).join(' ')})`);

  return { ...fasi, velo, sole, luna, stelle, tappe };
}

/** Il cielo di adesso. */
export const cieloOra = (formato = 'quadro', data = new Date()) => cieloA(oraDi(data), formato);

/** Le tappe come le vuole il foglio di stile. */
export const sfumatura = (tappe) =>
  `linear-gradient(180deg, ${tappe.map((c, i) => `${c} ${((i / (tappe.length - 1)) * 100).toFixed(2)}%`).join(', ')})`;
