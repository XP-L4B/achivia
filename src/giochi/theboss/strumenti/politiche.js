/**
 * Sei modi di giocare, per il simulatore.
 *
 * Servono a rispondere a una domanda sola: **il gioco e' vincibile solo
 * tenendo l'equilibrio?** Se «accetta sempre» o «rifiuta sempre» vincessero
 * anche solo una volta su venti, il gioco starebbe dicendo che una delle
 * due strade estreme funziona, e non e' quello che vuole dire.
 *
 * `equilibrata` e' il sostituto di un giocatore capace: non e' un giocatore
 * perfetto — non conosce il futuro, non sa se l'assistant manager sta
 * mentendo — ma guarda la cassa, guarda il morale, e sa che certe cose
 * (la sicurezza, lo strumento rotto, l'aumento a chi lo merita) si pagano
 * di piu' a rifiutarle che ad accettarle. E' la politica su cui si taglia
 * il bilanciamento.
 *
 * Ogni politica riceve la richiesta, l'archetipo e la fotografia, e torna
 * una delle tre risposte. Non vede indulgenza e rancore: non li vede
 * nemmeno chi gioca.
 */

import { archetipoById } from '../contenuti/archetipi.js';

/** Quanto costa, in gradini di cassa, dire di si'. Positivo vuol dire che entra. */
const costo = (arch) => -(arch.accetta?.cassa || 0);
const dona = (arch, leva) => arch.accetta?.[leva] || 0;

export const POLITICHE = {
  'accetta-sempre': () => 'accetta',
  'rifiuta-sempre': () => 'rifiuta',
  'rimanda-sempre': () => 'rimanda',

  casuale: (r, arch, foto, caso) => ['accetta', 'rifiuta', 'rimanda'][caso.intero(3)],

  /** Guarda solo la cassa: dice di si' a quello che frutta, no a quello che costa. */
  cassa: (r, arch) => (costo(arch) > 0 ? 'rifiuta' : 'accetta'),

  /**
   * Il giocatore capace. Le regole, in ordine:
   *
   *  1. Quello che si paga caro a rifiutarlo si accetta, se la cassa regge:
   *     la sicurezza, lo strumento rotto, l'aumento meritato. Sono le
   *     richieste in cui il no ha una conseguenza differita peggiore del si'.
   *  2. Con la cassa a terra si dice no a tutto quello che costa, e si dice
   *     si' solo a quello che non costa niente e alza il morale.
   *  3. Col morale a terra si compra morale: e' l'unica cosa che tiene su
   *     la produttivita', ed e' la produttivita' che fa il fatturato.
   *  4. Le proposte dei manager si giudicano dal segno: si investe quando
   *     c'e' cassa, si taglia solo quando serve davvero, e non si taglia
   *     mai sulle persone quando il morale e' gia' basso.
   *  5. Le assurdita' care si rifiutano sempre. Le assurdita' che costano
   *     poco si accettano quando il morale e' basso: costano poco e fanno
   *     ridere.
   *  6. Rimandare solo quando la cassa e' sul filo e la cosa non e' urgente:
   *     e' un modo per guadagnare un giorno, non per non decidere.
   */
  equilibrata: (r, arch, foto) => {
    /* Le soglie della cassa si contano in **giornate**, non in monete.
       Erano scritte in monete — «sotto quattromilacinquecento e' poca» — e
       una soglia in monete e' vera solo finche' non si tocca l'economia:
       cambiato il fatturato, il giocatore di riferimento diventava un
       giocatore che non investe mai, e il bilanciamento veniva tarato su
       di lui. Contate in giornate di incasso valgono a qualunque scala,
       ed e' anche il modo in cui la guarda chi gioca: non «ho seimila
       monete», ma «con quello che ho ci arrivo a fine settimana». */
    const giornata = Math.max(2000, foto.fatturato);
    const cassaScarsa = foto.cassa < giornata;
    const cassaGrave = foto.cassa < giornata * 0.35;
    const moraleBasso = foto.morale < 48;
    const moraleGrave = foto.morale < 35;
    const prod = foto.produttivita;

    /* 1. quelle che il no fa pagare piu' del si' */
    const daNonRifiutare = ['SICUREZZA_SUL_LAVORO', 'STRUMENTO_ROTTO', 'AUMENTO_MERITATO', 'CONFLITTO_TRA_COLLEGHI'];
    if (daNonRifiutare.includes(arch.id)) {
      if (cassaGrave && costo(arch) >= 2) return 'rimanda';
      return 'accetta';
    }

    /* 4. i manager */
    if (r.autoreTipo === 'assistant_manager') {
      if (arch.id === 'PROPOSTA_INVESTIMENTO' || arch.id === 'PROPOSTA_MARKETING' || arch.id === 'PROPOSTA_ASSUNZIONE') {
        return foto.cassa > giornata * 1.55 ? 'accetta' : 'rifiuta';
      }
      if (arch.id === 'PROPOSTA_LICENZIAMENTO' || arch.id === 'PROPOSTA_TAGLIO_WELFARE') {
        return (cassaGrave || (foto.saldo < -1200 && foto.giorno > 20)) && !moraleGrave ? 'accetta' : 'rifiuta';
      }
      if (arch.id === 'PROPOSTA_AUMENTO_RITMI') return prod < 55 && !moraleBasso ? 'accetta' : 'rifiuta';
      /* I tagli sono l'unica leva che cambia il conto di **ogni** sera
         invece del saldo di oggi, e per questo si giudicano sul saldo:
         finche' la giornata chiude in attivo tagliare e' solo un danno al
         morale, quando chiude in passivo e' l'unica cosa che riporta la
         macchina dentro i suoi mezzi. Il simulatore lo dice chiaro: chi
         taglia dal primo giorno vince meno di chi non taglia mai, chi
         taglia quando il regno rincara vince piu' di tutti. */
      const inPerdita = foto.saldo < 0;
      if (arch.id === 'PROPOSTA_TAGLIO_COSTI' || arch.id === 'PROPOSTA_OUTSOURCING') {
        return (inPerdita || cassaScarsa) && !moraleBasso ? 'accetta' : 'rifiuta';
      }
      if (arch.id === 'PROPOSTA_RIORGANIZZAZIONE') return inPerdita && !moraleBasso ? 'accetta' : 'rifiuta';
      return foto.cassa > giornata * 2 ? 'accetta' : 'rifiuta';
    }

    /* 5. le assurdita' */
    if (arch.id === 'RICHIESTA_ASSURDA_ALTO_COSTO') return 'rifiuta';
    if (arch.id === 'RICHIESTA_ASSURDA_BASSO_COSTO') return moraleBasso && !cassaGrave ? 'accetta' : 'rifiuta';

    /* 2. cassa a terra */
    if (cassaGrave) return costo(arch) > 0 ? 'rifiuta' : 'accetta';

    /* 3. morale a terra: si compra morale, se non costa un patrimonio */
    if (moraleBasso && dona(arch, 'morale') >= 2 && costo(arch) <= 2) return 'accetta';

    /* 6. il filo */
    if (cassaScarsa && costo(arch) >= 2) return prod < 60 ? 'rimanda' : 'rifiuta';

    /* il resto: si accetta quello che costa poco e da' qualcosa */
    if (costo(arch) <= 1 && (dona(arch, 'morale') > 0 || dona(arch, 'produttivita') > 0)) return 'accetta';
    return 'rifiuta';
  },
};

export const nomiPolitiche = Object.keys(POLITICHE);

/** L'archetipo di una richiesta, per chi scrive una politica. */
export const archDi = (richiesta) => archetipoById(richiesta.archetipo);
