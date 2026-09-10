/**
 * Il periodo delle griglie di analytics: quali sono, come si scrivono, come
 * diventano una finestra di due estremi.
 *
 * Sta in un file suo e non accanto ai componenti perche' non e' un
 * componente: mescolarlo agli altri export rompe il ricaricamento a caldo.
 * E sta in un file solo perche' le griglie che lo usano sono due — i dati di
 * una persona e quelli dell'organizzazione — e un periodo che si chiama "1
 * MESE" di qua e "30 GIORNI" di la' sarebbe due cose diverse per sbaglio.
 */

// Periodi del selettore, in giorni. `null` = tutto lo storico.
// Al posto della settimana c'e' il calendario: una settimana e' un caso
// particolare di una finestra scelta a mano, e su queste griglie era anche il
// periodo che piu' spesso restava vuoto.
export const PERIODI = [
  { id: '30',  label: '1 MESE', giorni: 30 },
  { id: '90',  label: '3 MESI', giorni: 90 },
  { id: 'all', label: 'SEMPRE', giorni: null },
];

export const giornoIso = (t) => new Date(t).toISOString().slice(0, 10);
export const inizioDi = (iso) => new Date(`${iso}T00:00:00`).getTime();
export const fineDi = (iso) => new Date(`${iso}T23:59:59.999`).getTime();
export const breve = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });

/** Una sola forma per tutti i periodi: due estremi, o niente per "sempre". */
export function finestraDi(periodo, intervallo, adesso) {
  if (periodo === 'scelta' && intervallo) {
    return { da: inizioDi(intervallo.da), a: fineDi(intervallo.a) };
  }
  const giorni = PERIODI.find((p) => p.id === periodo)?.giorni ?? null;
  return giorni ? { da: adesso - giorni * 86400000, a: adesso } : null;
}

/**
 * Il periodo scritto nell'intestazione del pannello: senza, la stessa
 * griglia con due periodi diversi sembra la stessa griglia.
 */
export function etichettaPeriodo(periodo, intervallo) {
  if (periodo === 'scelta' && intervallo) return `${breve(intervallo.da)}–${breve(intervallo.a)}`;
  return PERIODI.find((p) => p.id === periodo)?.label ?? '';
}
