/**
 * Le leghe: settimana, mese, sempre. Sono le stesse per tutti i giochi
 * con una classifica, e la chiave di una lega e' la stessa parola per
 * tutti: `sett:2026-W37`, `mese:2026-09`, `sempre`.
 *
 * Sta qui, da solo, perche' The Boss e The Climb la usano tutti e due e
 * nessuno dei due deve importare il deposito dell'altro — con il motore
 * dell'altro dietro.
 */

export const LEGHE = [
  { id: 'sett', nome: 'Settimana' },
  { id: 'mese', nome: 'Mese' },
  { id: 'sempre', nome: 'Di sempre' },
];
export const LEGHE_TENUTE = 4;
const giorno = 24 * 3600 * 1000;

function settimanaIso(t) {
  const d = new Date(t); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const anno = d.getFullYear();
  const primo = new Date(anno, 0, 4);
  return { anno, n: 1 + Math.round(((d - primo) / giorno - 3 + ((primo.getDay() + 6) % 7)) / 7) };
}

export function chiaveLega(lega, adesso = Date.now()) {
  if (lega === 'sempre') return 'sempre';
  const d = new Date(adesso);
  if (lega === 'mese') return `mese:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const { anno, n } = settimanaIso(adesso);
  return `sett:${anno}-W${String(n).padStart(2, '0')}`;
}

/** Le tavole delle leghe passate si tengono a rotazione. */
export function potaLeghe(tavole) {
  for (const prefisso of ['sett:', 'mese:']) {
    const chiavi = Object.keys(tavole).filter((k) => k.startsWith(prefisso)).sort();
    while (chiavi.length > LEGHE_TENUTE + 1) delete tavole[chiavi.shift()];
  }
}
