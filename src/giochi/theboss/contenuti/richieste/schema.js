/**
 * Come si scrive una richiesta, e perche' cosi'.
 *
 * Una voce della banca contiene **solo la parte narrativa**: chi parla,
 * che cosa dice, e come la prende. La meccanica non sta qui — sta
 * nell'archetipo, che e' un nome preso da una lista chiusa
 * (`contenuti/archetipi.js`). Mille testi diversi possono puntare allo
 * stesso archetipo: e' quello che permette una banca grande senza mille
 * regole.
 *
 * **Nessun numero.** Se un testo cita una cifra — «quattromila monete di
 * corso» — quella cifra e' racconto e non tocca il calcolo: il costo vero
 * lo decide l'archetipo, moltiplicato per l'escalation del momento. Il
 * validatore scarta ogni voce che provi a dichiarare effetti propri.
 *
 * I campi, nell'ordine in cui si scrivono:
 *
 *   id        breve e stabile: entra nel salvataggio delle partite
 *   arch      l'archetipo, dalla lista chiusa
 *   tono      realistica | sarcastica | demenziale
 *   liv       a che livello di escalation ha senso (1-4)
 *   titolo    tre o quattro parole, quello che si legge per primo
 *   testo     quello che dice, al massimo 280 caratteri
 *   acc       la sua battuta se accetti
 *   rif       se rifiuti
 *   rim       se rimandi
 *   ctx       (facoltativo) quando ha senso che esca: tratti di chi parla,
 *             eventi attivi, stato dell'azienda
 *
 * IL CRITERIO DI QUALITA', che vale piu' di tutti i campi: ogni richiesta
 * deve avere **tensione decisionale vera** — un motivo serio per dire di
 * si' e un motivo serio per dire di no. Se la risposta e' ovvia, la voce
 * non va nella banca.
 */

/** Costruisce una voce. I file dei lotti chiamano solo questa. */
export const r = (id, arch, tono, liv, titolo, testo, acc, rif, rim, ctx = null) => ({
  id, arch, tono, liv, titolo, testo, acc, rif, rim, ...(ctx ? { ctx } : {}),
});

export const TONI = ['realistica', 'sarcastica', 'demenziale'];

/**
 * Le quote di tono che la banca deve rispettare, piu' o meno.
 *
 * Il tono demenziale e' quello che si ricorda, ed e' anche quello che
 * stanca: un quinto di richieste sul cane che compie gli anni e il gioco
 * diventa una raccolta di barzellette in cui non si capisce piu' che cosa
 * si sta decidendo. Il grosso e' realistico apposta — il monitor rotto, il
 * permesso per la visita, l'aumento a chi e' sottopagato da tre anni — e
 * l'assurdo arriva quando serve a far vedere fin dove e' arrivata
 * l'indulgenza.
 */
export const QUOTE_TONO = { realistica: 0.60, sarcastica: 0.25, demenziale: 0.15 };

/** La versione della banca. Si alza quando si aggiungono o si cambiano voci. */
export const VERSIONE_BANCA = 2;
