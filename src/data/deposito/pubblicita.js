/**
 * La pubblicita': quello che vede chi non paga.
 *
 * E' l'altra faccia del piano Standard. Chi non paga in denaro paga in
 * attenzione, e il patto va detto per intero: due banner e uno spot che
 * parte a ogni quest assegnata. Salendo di piano sparisce prima lo spot —
 * quello che da' piu' fastidio, perche' si mette in mezzo a un gesto di
 * lavoro — e poi anche i banner.
 *
 * Chi la vede lo dice il listino (`vedeBanner`, `vedeSpotSullaQuest`), non
 * questo file: qui c'e' solo che cosa si mostra. Sono due domande diverse e
 * tenerle separate vuol dire che aggiungere un piano non tocca gli spazi, e
 * cambiare una reclame non tocca i piani.
 *
 * Quando non c'e' niente da mostrare lo spazio resta e si vede che e' uno
 * spazio. Non e' un ripiego: e' la scelta onesta. Un'organizzazione sul
 * piano con la pubblicita' deve vedere che c'e' la pubblicita' anche il
 * giorno in cui non e' stata venduta a nessuno — altrimenti il piano di
 * sopra sembra togliere qualcosa che non c'era.
 */

import { db, ensurePubblicita, nuovoId, save } from './nucleo';

/* Quanto dura lo spot prima che si possa chiudere.
   E' il numero che decide se il piano gratuito e' fastidioso o
   inaccettabile, e per questo non sta nel codice: si prova, si guarda
   quanta gente sale di piano e quanta se ne va, e si cambia. Cinque secondi
   e' il punto di partenza; il minimo e il massimo servono a impedire i due
   errori opposti — zero, che non e' uno spot, e trenta, che e' un ostaggio. */
export const SECONDI_SPOT_DI_PARTENZA = 5;
export const SECONDI_SPOT_MINIMO = 0;
export const SECONDI_SPOT_MASSIMO = 30;

/** Quanti secondi dura lo spot, adesso. */
export function secondiSpot() {
  ensurePubblicita();
  const scritto = db.impostazioniPubblicita?.secondiSpot;
  if (scritto == null) return SECONDI_SPOT_DI_PARTENZA;
  return Math.min(SECONDI_SPOT_MASSIMO, Math.max(SECONDI_SPOT_MINIMO, Math.round(Number(scritto) || 0)));
}

export function salvaSecondiSpot(secondi) {
  ensurePubblicita();
  const prima = db.impostazioniPubblicita.secondiSpot;
  db.impostazioniPubblicita.secondiSpot = Math.min(
    SECONDI_SPOT_MASSIMO,
    Math.max(SECONDI_SPOT_MINIMO, Math.round(Number(secondi) || 0)),
  );
  if (!save()) { db.impostazioniPubblicita.secondiSpot = prima; return null; }
  return secondiSpot();
}

/** Dove puo' comparire una reclame. */
export const POSIZIONI = [
  { id: 'banner', nome: 'Banner nelle schermate' },
  { id: 'spot', nome: 'Spot a ogni quest assegnata' },
  { id: 'entrambe', nome: 'Tutte e due' },
];

const normalizza = (r) => ({
  id: r.id,
  nome: r.nome || '',
  titolo: r.titolo || '',
  testo: r.testo || '',
  collegamento: r.collegamento || '',
  posizione: POSIZIONI.some((p) => p.id === r.posizione) ? r.posizione : 'banner',
  attiva: r.attiva !== false,
  da: r.da || null,
  a: r.a || null,
  peso: Math.max(1, Math.round(Number(r.peso) || 1)),
  creataIl: r.creataIl ?? null,
});

export function getPubblicita() {
  ensurePubblicita();
  return db.pubblicita.map(normalizza);
}

export const getReclame = (id) => getPubblicita().find((r) => r.id === id) || null;

/** Se una reclame va mostrata adesso: accesa e dentro la sua finestra. */
export function reclameValida(r, adesso = Date.now()) {
  if (!r?.attiva) return false;
  if (r.da && new Date(r.da).getTime() > adesso) return false;
  if (r.a && new Date(r.a).getTime() + 86399999 < adesso) return false;
  return Boolean(r.titolo || r.testo);
}

/**
 * Quello che va in un certo spazio, adesso.
 *
 * Con piu' reclami buoni si sceglie a caso, pesato: `peso` piu' alto vuol
 * dire comparire piu' spesso. A caso e non a turno perche' un turno vuole
 * uno stato da tenere, e uno stato tenuto in `localStorage` diventerebbe di
 * quel dispositivo — due persone della stessa azienda vedrebbero due giri
 * diversi credendo di vedere lo stesso.
 *
 * `null` quando non c'e' niente: lo spazio resta e si vede che e' vuoto.
 */
export function reclamePer(posizione, { adesso = Date.now(), caso = Math.random() } = {}) {
  const buone = getPubblicita().filter((r) => reclameValida(r, adesso)
    && (r.posizione === posizione || r.posizione === 'entrambe'));
  if (buone.length === 0) return null;
  const totale = buone.reduce((s, r) => s + r.peso, 0);
  let soglia = caso * totale;
  for (const r of buone) {
    soglia -= r.peso;
    if (soglia <= 0) return r;
  }
  return buone[buone.length - 1];
}

export function salvaReclame(patch) {
  ensurePubblicita();
  const id = patch?.id || nuovoId('pub');
  const i = db.pubblicita.findIndex((r) => r.id === id);
  const prima = i >= 0 ? db.pubblicita[i] : null;
  const riga = normalizza({ ...(prima || { creataIl: new Date().toISOString() }), ...patch, id });
  if (i >= 0) db.pubblicita[i] = riga; else db.pubblicita.push(riga);
  if (!save()) {
    if (i >= 0) db.pubblicita[i] = prima; else db.pubblicita.pop();
    return null;
  }
  return riga;
}

export function eliminaReclame(id) {
  ensurePubblicita();
  const prima = db.pubblicita.length;
  db.pubblicita = db.pubblicita.filter((r) => r.id !== id);
  if (db.pubblicita.length === prima) return { ok: false, errore: 'Reclame non trovata.' };
  save();
  return { ok: true };
}

/**
 * Segna che una reclame e' stata vista.
 *
 * Un contatore per reclame, non una riga per vista: le viste sono tante e
 * non c'e' niente da sapere sulla singola. E' l'opposto della scelta fatta
 * per le domande all'assistente, e la ragione e' la stessa vista al
 * contrario — li' ogni riga dice qualcosa, qui nessuna.
 */
export function segnaVista(id) {
  ensurePubblicita();
  if (!id) return null;
  db.visteAnnunci[id] = (db.visteAnnunci[id] || 0) + 1;
  save();
  return db.visteAnnunci[id];
}

export const visteDi = (id) => {
  ensurePubblicita();
  return db.visteAnnunci[id] || 0;
};
