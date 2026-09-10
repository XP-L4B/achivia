/**
 * Il punteggio: un conto solo, in un posto solo.
 *
 * Si legge come una frase: averla indovinata vale, averla indovinata
 * presto vale di piu', e una parola lunga o rara vale piu' di una corta e
 * comune.
 *
 *   totale = indovinata
 *          + tentativi risparmiati × quanto vale ognuno
 *          + il premio della lunghezza
 *          + il premio della rarita'
 *          + i secondi risparmiati (solo nella prova in solitario)
 *
 * Chi non la indovina non esce con zero: le lettere verdi del suo
 * tentativo migliore contano qualcosa. Arrivare a una lettera dalla
 * soluzione non e' come non aver capito niente, e un gioco che desse zero
 * a tutti e due i casi insegnerebbe a mollare invece che a ragionare.
 *
 * Il conto torna sempre le sue parti, non solo il totale: la fine della
 * partita le mostra, e una prova che sa perche' un numero e' quello vale
 * piu' di una che sa soltanto che e' cambiato.
 */

import { CONFIG, puntiLunghezza } from '../contenuti/config';

/**
 * Il punteggio di una parola segreta, per un giocatore.
 *
 *   segreta      la scheda della parola (per la rarita' e la lunghezza)
 *   tentativi    quanti ne ha usati
 *   indovinata   se l'ha trovata
 *   verdiMigliori quante lettere giuste al posto giusto nel tentativo
 *                 migliore (conta solo se non l'ha indovinata)
 */
export function calcola({ segreta, tentativi, indovinata, verdiMigliori = 0, secondiUsati = null, config = CONFIG }) {
  const p = config.punti;
  const massimo = config.partita.tentativi;
  const lettere = segreta?.normalizedWord?.length ?? 0;

  if (!indovinata) {
    const consolazione = Math.max(0, verdiMigliori) * p.perVerde;
    return {
      totale: consolazione,
      parti: { indovinata: 0, velocita: 0, lunghezza: 0, rarita: 0, tempo: 0, verdi: consolazione },
      tentativi,
    };
  }

  const risparmiati = Math.max(0, massimo - tentativi);
  const velocita = risparmiati * p.perTentativoRisparmiato;
  const lunghezza = puntiLunghezza(lettere);
  const rarita = p.rarita[Math.max(0, Math.min(p.rarita.length - 1, segreta?.rarity ?? 1))] ?? 0;

  /* Il premio del tempo: un punto per ogni secondo risparmiato sul tetto
     del livello. C'e' solo dove qualcuno lo passa — la prova in solitario
     — perche' e' li' che il tempo e' la difficolta'. Nella sfida
     `secondiUsati` e' `null` e questo pezzo non esiste. */
  const tetto = config.livello?.tempoBuono ?? 0;
  const tempo = secondiUsati === null || !tetto
    ? 0
    : Math.max(0, Math.round(tetto - secondiUsati)) * (p.perSecondoRisparmiato ?? 0);

  return {
    totale: p.indovinata + velocita + lunghezza + rarita + tempo,
    parti: { indovinata: p.indovinata, velocita, lunghezza, rarita, tempo, verdi: 0 },
    tentativi,
  };
}

/** Il massimo che una parola puo' pagare: serve a spiegare, non a contare. */
export function massimoPossibile(segreta, config = CONFIG) {
  return calcola({ segreta, tentativi: 1, indovinata: true, config }).totale;
}
