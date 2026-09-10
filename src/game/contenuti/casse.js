/**
 * Le casse: la configurazione, tutta qui.
 *
 * Una cassa e' una meccanica di gioco e basta: appare nell'arena, si
 * raccoglie passandoci sopra, e contiene un effetto solo, pescato coi
 * pesi della sua rarita'. Niente si compra, niente si scommette, niente
 * si paga: i numeri di questo file sono l'unico posto dove si decide
 * quanto spesso, quanto forte e per quanto.
 *
 *   nascita     quando appaiono: la prima dopo `prima` secondi, poi ogni
 *               `ogni` (piu' o meno `varia`), mai piu' di `inCampo` chiuse
 *               insieme; a una distanza dal giocatore fra le due di
 *               `distanza`, mai piu' vicino di `lontanoDalGiocatore` a lui
 *               ne' di `lontanoDalBoss` a un boss, e dentro il mondo con
 *               `margine`; `tentativi` prima di rinunciare a quel giro
 *   caduta      la cassa che lasciano cadere i nemici grossi quando muoiono:
 *               la rarita' per il boss e per il miniboss, e `elite: 'pesca'`
 *               per l'elite, che ne pesca una coi pesi normali. Le elite
 *               sono tante, nel tardo gioco piu' di una al secondo: fra una
 *               loro cassa e la successiva passano almeno `eliteOgni`
 *               secondi, se no la partita diventa una pioggia di effetti
 *   apertura    `raggio` e' quanto ci si deve avvicinare; `animazione` i
 *               secondi fra l'arrivo e il contenuto; `indugio` quanto la
 *               cassa aperta resta a terra prima di sparire
 *   pesi        per ogni rarita', il peso di ogni effetto. Un effetto che
 *               manca in una rarita' non esce da quella cassa
 *   effetti     i numeri di ogni effetto: la potenza, e `durata` per quelli
 *               temporanei. Le rarita' allungano la durata (`durata` sulla
 *               rarita', un moltiplicatore)
 *
 * Gli effetti stessi — che cosa fanno — stanno in `game/effetti.js`, uno
 * per voce, e si aggiungono la' senza toccare le casse.
 */

export const RARITA = [
  { id: 'comune',   nome: 'Comune',   peso: 55, colore: '#c9a06a', luce: '#f0d9a8', durata: 1,    aura: 0, particelle: 10, onda: 26, scuote: false },
  { id: 'insolita', nome: 'Insolita', peso: 28, colore: '#8fd06a', luce: '#d6ffb0', durata: 1.15, aura: 0, particelle: 14, onda: 34, scuote: false },
  { id: 'rara',     nome: 'Rara',     peso: 13, colore: '#4ad9ff', luce: '#d6f4ff', durata: 1.3,  aura: 1, particelle: 20, onda: 46, scuote: false },
  { id: 'epica',    nome: 'Epica',    peso: 4,  colore: '#c58cff', luce: '#ffe08a', durata: 1.5,  aura: 2, particelle: 30, onda: 70, scuote: true },
];

export const raritaById = (id) => RARITA.find((r) => r.id === id) || RARITA[0];

export const CONFIG_CASSE = {
  nascita: {
    prima: 20, ogni: 42, varia: 10, inCampo: 2,
    distanza: [70, 240], lontanoDalGiocatore: 48, lontanoDalBoss: 80, margine: 24, tentativi: 10,
  },
  apertura: { raggio: 12, animazione: 0.55, indugio: 1.0 },
  caduta: { boss: 'epica', capo: 'rara', elite: 'pesca', eliteOgni: 45 },
  massimoInVasca: 6,
  pesi: {
    comune:   { ristoro: 30, magnete: 25, furia: 15, sovraccarico: 15, potenzia: 10, doppiaXp: 5 },
    insolita: { ristoro: 15, magnete: 15, furia: 15, sovraccarico: 15, potenzia: 15, barriera: 10, supermagnete: 10, doppiaXp: 5 },
    rara:     { barriera: 15, supermagnete: 10, rallenta: 15, fantasma: 12, precisione: 12, devastazione: 12, doppiaXp: 12, potenzia: 12 },
    epica:    { devastazione: 20, tempesta: 25, berserker: 15, rallenta: 10, barriera: 10, potenzia: 10, doppiaXp: 10 },
  },
  effetti: {
    ristoro:      { cura: 0.3 },
    magnete:      { velocita: 1500 },
    devastazione: { danno: 160 },
    potenzia:     {},
    furia:        { durata: 10, danno: 0.5 },
    sovraccarico: { durata: 10, cadenza: 0.35 },
    barriera:     { durata: 6 },
    supermagnete: { durata: 8, raccolta: 8 },
    rallenta:     { durata: 7, nemici: 0.45 },
    fantasma:     { durata: 6 },
    precisione:   { durata: 10, critico: 0.35 },
    tempesta:     { durata: 6, ogni: 0.35, raggio: 46, danno: 90, distanza: [40, 220], preavviso: 0.7 },
    doppiaXp:     { durata: 20, xp: 2 },
    berserker:    { durata: 12, dannoMassimo: 1.5 },
  },
};

/**
 * I moltiplicatori che gli effetti temporanei mettono sul giocatore, a
 * riposo. Si ricalcolano a ogni passo dagli effetti attivi: finito
 * l'effetto, tornano esattamente questi.
 */
export const BONUS_NEUTRO = Object.freeze({
  danno: 1, cadenza: 1, raccolta: 1, xp: 1, nemici: 1, critico: 0, barriera: false, fantasma: false,
});

/** Una pesca a pesi da un elenco di { id, peso }. */
function pesca(caso, voci) {
  let totale = 0;
  for (let i = 0; i < voci.length; i += 1) totale += voci[i].peso;
  if (totale <= 0) return null;
  let r = caso.numero() * totale;
  for (let i = 0; i < voci.length; i += 1) { r -= voci[i].peso; if (r <= 0) return voci[i].id; }
  return voci[voci.length - 1].id;
}

const vociRarita = RARITA.map((r) => ({ id: r.id, peso: r.peso }));

/** La rarita' di una cassa nuova. */
export const scegliRarita = (caso) => raritaById(pesca(caso, vociRarita));

/**
 * L'effetto di una cassa di quella rarita': uno solo, coi pesi della
 * rarita', fra quelli che `valido(id)` accetta adesso. Se un effetto non
 * vale (nessun'arma da potenziare), il suo peso non conta: esce un altro.
 */
export function scegliEffetto(caso, raritaId, valido = () => true) {
  const tabella = CONFIG_CASSE.pesi[raritaId] || {};
  const voci = [];
  for (const id of Object.keys(tabella)) if (tabella[id] > 0 && valido(id)) voci.push({ id, peso: tabella[id] });
  return pesca(caso, voci);
}
