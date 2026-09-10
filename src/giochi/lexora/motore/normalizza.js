/**
 * La normalizzazione: da quello che una persona scrive a quello che il
 * motore confronta.
 *
 * E' il punto in cui una lingua entra nel gioco, e per questo qui non c'e'
 * una sola regola italiana. La regola generale vale per tutte le lingue
 * che si scrivono in alfabeto latino:
 *
 *   1. maiuscolo, secondo le regole della lingua (`toLocaleUpperCase`:
 *      la i turca diventa İ, non I, e in turco e' giusto cosi');
 *   2. via gli apostrofi e i trattini, in tutte le forme che hanno —
 *      l'apostrofo tipografico ’ e quello dritto ' sono lo stesso segno
 *      per chi gioca, e nessuno dei due e' una lettera;
 *   3. gli accenti si tolgono solo se la lingua lo chiede: in italiano
 *      PERCHÉ e PERCHE sono la stessa parola, mentre altrove SCHON e
 *      SCHÖN sono due parole diverse e appiattirle vorrebbe dire
 *      accettarne una per l'altra. La scelta e' della lingua, non di
 *      questo file: la porta nel suo `tieniAccenti`, e la spiega li';
 *   4. le sostituzioni della lingua (`sostituzioni` sulla scheda): il ß
 *      tedesco vale SS, e senza questa riga una parola scritta con ß non
 *      si troverebbe mai in un campo che di ß non ne ha.
 *
 * La lingua porta le sue regole, il motore le applica: aggiungere una
 * lingua non passa da questo file.
 */

/* Gli apostrofi e i trattini di tutte le tastiere del mondo. */
const SEGNI = /['’‘‛`´ʼʼ’\-–—­.\s]/g;

/** Toglie i segni diacritici: NFD e via tutto quello che non e' una lettera. */
const senzaAccenti = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * La forma con cui una parola si confronta con le altre.
 *
 * `lingua` e' la scheda della lingua; senza, si applica la regola
 * generale (maiuscolo, via i segni, via gli accenti).
 */
export function normalizza(parola, lingua = null) {
  if (typeof parola !== 'string') return '';
  const loc = lingua?.locale || undefined;
  let s = parola.normalize('NFC').toLocaleUpperCase(loc);
  const sost = lingua?.sostituzioni;
  if (sost) for (const da of Object.keys(sost)) s = s.split(da).join(sost[da]);
  s = s.replace(SEGNI, '');
  if (lingua?.tieniAccenti !== true) s = senzaAccenti(s);
  return s;
}

/**
 * Le lettere di una parola normalizzata, come tessere.
 *
 * Non e' `split('')`: una lingua puo' avere digrammi che valgono una
 * tessera sola — il QU italiano che sta su una casella, il CH o l'LL di
 * altre — e allora si spezza cercando prima quelli. La lingua li elenca in
 * `digrammi`; senza, ogni carattere e' una lettera.
 *
 * Si lavora per punti di codice (`[...s]`) e non per unita' UTF-16, cosi'
 * una lettera fuori dal piano base non si spezza a meta'.
 */
export function inLettere(normalizzata, lingua = null) {
  const digrammi = lingua?.digrammi || [];
  const fuori = [...normalizzata];
  const out = [];
  for (let i = 0; i < fuori.length; i += 1) {
    let preso = null;
    for (const d of digrammi) {
      const n = [...d].length;
      if (fuori.slice(i, i + n).join('') === d) { preso = d; i += n - 1; break; }
    }
    out.push(preso ?? fuori[i]);
  }
  return out;
}
