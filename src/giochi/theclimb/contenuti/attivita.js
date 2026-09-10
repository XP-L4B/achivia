/**
 * Le tredici attivita' di una settimana.
 *
 * Ogni settimana si hanno cento punti di tempo e li si distribuisce qui.
 * Il totale delle attivita' «necessarie» supera il tempo disponibile
 * apposta: e' un gioco di rinunce, non di ottimizzazione, e non deve mai
 * esistere una routine che massimizza tutto.
 *
 * Gli effetti sono **gradini per unita' di tempo** (dieci punti), e non
 * numeri: il numero lo mette `PASSO` in `bilancio.js`. Le competenze si
 * scrivono con il loro id; `campo: true` dice che la competenza cresce
 * come cresce sul lavoro — con un esponente piu' dolce — e non come a
 * scuola.
 *
 *   tempo        [minimo, massimo] in punti; il lavoro ha il minimo
 *                obbligatorio se si ha un lavoro
 *   energia      quanto costa un'unita', in punti di energia
 *   costo        gradini di soldi per unita' (negativo: si paga)
 *   effetti      gradini per unita' sulle statistiche
 *   competenze   gradini per unita' sulle competenze
 */
export const ATTIVITA = [
  {
    id: 'lavoro', nome: 'Lavorare', tempo: [0, 80], energia: 9,
    obbligatoria: 'se hai un lavoro',
    effetti: { performance: +2 },
    competenze: { campo: true, dal: 'lavoro' },   // quelle che il lavoro insegna
  },
  {
    id: 'straordinari', nome: 'Straordinari', tempo: [0, 30], energia: 12,
    effetti: { performance: +2, visibilita: +2, sonno: +1, relazioni: -1, stress: +1 },
  },
  {
    id: 'studio', nome: 'Studiare', tempo: [0, 40], energia: 10,
    costo: 'dal percorso',
    effetti: { stress: +1, noia: -1 },
    competenze: { dal: 'percorso' },              // quelle che il percorso insegna
  },
  {
    id: 'progetti', nome: 'Progetti personali', tempo: [0, 30], energia: 10,
    effetti: { felicita: +1, noia: -2 },
    competenze: { campo: true, tecnologia: +1, gestione_progetti: +1, creativita: +1 },
    portfolio: +1,
  },
  {
    id: 'networking', nome: 'Networking', tempo: [0, 20], energia: 8,
    costo: -1,
    effetti: { rete: +2, visibilita: +1 },
    competenze: { comunicazione: +1, intelligenza_politica: +1 },
    /* la rete si costruisce sulla rete: a rete zero un aperitivo rende poco */
    scalaSullaRete: true,
  },
  {
    id: 'relazioni', nome: 'Famiglia, amici, partner', tempo: [0, 30], energia: 5,
    effetti: { relazioni: +2, felicita: +2, stress: -1, noia: -1 },
    competenze: { campo: true, empatia: +1 },
  },
  {
    id: 'sport', nome: 'Sport e salute', tempo: [0, 15], energia: 6,
    effetti: { salute: +2, stress: -1 },
    competenze: { campo: true, resilienza: +1 },
  },
  {
    id: 'sonno', nome: 'Dormire bene', tempo: [0, 20], energia: 0,
    effetti: { sonno: -3, stress: -1 },
  },
  {
    id: 'ozio', nome: 'Ozio e hobby', tempo: [0, 20], energia: 3,
    effetti: { felicita: +2, stress: -1, noia: -1 },
    competenze: { creativita: +1 },
  },
  {
    id: 'lavoretti', nome: 'Turni extra', tempo: [0, 30], energia: 12,
    costo: +2,
    effetti: { stress: +1, sonno: +1, relazioni: -1, felicita: -1 },
  },
  {
    id: 'terapia', nome: 'Terapia e supporto', tempo: [0, 10], energia: 4,
    costo: -2,
    effetti: { stress: -4, felicita: +1 },
    competenze: { campo: true, resilienza: +2, pensiero_critico: +1 },
  },
  {
    id: 'candidature', nome: 'Cercare lavoro', tempo: [0, 20], energia: 7,
    effetti: { stress: +1 },
    ricerca: +1,                                    // quante porte si bussano: le apre la fase tre
  },
  {
    id: 'volontariato', nome: 'Volontariato', tempo: [0, 20], energia: 7,
    effetti: { reputazione: +1, rete: +1, felicita: +1, noia: -1 },
    competenze: { campo: true, empatia: +2, lavoro_di_squadra: +1, leadership: +1 },
  },
];

export const attivitaById = (id) => ATTIVITA.find((a) => a.id === id) || null;
