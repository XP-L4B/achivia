/**
 * I suoni del gioco: la porta e la macchina da scrivere.
 *
 * **Non sono file.** Sono sintetizzati con Web Audio, tre oscillatori e un
 * po' di rumore, e questo risolve in un colpo solo i due problemi che
 * altrimenti resterebbero: nessuna licenza da rispettare — non c'e' niente
 * da attribuire, perche' non c'e' niente di preso da nessuno — e nessun
 * kilobyte da scaricare. Un effetto di porta decente in mp3 pesa piu' di
 * tutto il codice di questo file.
 *
 * L'INTERRUTTORE E' QUELLO DELLA MUSICA. Chi ha spento la musica di
 * Achivia ha gia' detto che non vuole sentire niente: chiedergli una
 * seconda volta con un secondo interruttore sarebbe non aver capito la
 * risposta. Si legge `statoMusica().accesa` e basta.
 *
 * IL BROWSER NON LASCIA SUONARE PRIMA DI UN TOCCO. Non e' un errore da
 * aggirare, e' la regola. Quindi il contesto audio nasce alla prima
 * chiamata — che avviene sempre dopo un clic, perche' per giocare bisogna
 * premere «Apri la porta» — e se nasce sospeso si prova a svegliarlo.
 *
 * Tutto quello che c'e' qui dentro e' avvolto in un `try`: un suono che non
 * parte non deve fermare una partita.
 */

import { statoMusica } from '../../data/musica';

/** Quanto forte, in scala da zero a uno. Piano: si gioca leggendo. */
const VOLUME = { porta: 0.16, tasto: 0.05, campanello: 0.10 };

let ctx = null;

function contesto() {
  try {
    if (!ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return null;
      ctx = new Audio();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

const acceso = () => {
  try { return statoMusica().accesa; } catch { return false; }
};

/** Un rumore bianco breve, per i suoni che non hanno un'altezza. */
function rumore(c, durata) {
  const campioni = Math.max(1, Math.floor(c.sampleRate * durata));
  const buffer = c.createBuffer(1, campioni, c.sampleRate);
  const dati = buffer.getChannelData(0);
  for (let i = 0; i < campioni; i += 1) dati[i] = Math.random() * 2 - 1;
  const sorgente = c.createBufferSource();
  sorgente.buffer = buffer;
  return sorgente;
}

/**
 * La porta che si apre: un cigolio che sale, e il legno che batte.
 *
 * Il cigolio e' un'onda a dente di sega che sale di un'ottava scarsa
 * mentre un filtro passa-banda si sposta con lei — e' quello che
 * trasforma un fischio in un cardine. Il colpo finale e' rumore bianco
 * spento in fretta da un filtro basso: un tonfo di legno, non un tamburo.
 */
export function porta() {
  if (!acceso()) return;
  const c = contesto();
  if (!c) return;
  try {
    const t = c.currentTime;
    /* il cigolio */
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(330, t + 0.26);
    const banda = c.createBiquadFilter();
    banda.type = 'bandpass';
    banda.Q.value = 9;
    banda.frequency.setValueAtTime(700, t);
    banda.frequency.exponentialRampToValueAtTime(1500, t + 0.26);
    const vol = c.createGain();
    vol.gain.setValueAtTime(0.0001, t);
    vol.gain.exponentialRampToValueAtTime(VOLUME.porta, t + 0.05);
    vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.30);
    osc.connect(banda).connect(vol).connect(c.destination);
    osc.start(t); osc.stop(t + 0.32);

    /* il legno che batte, un attimo dopo */
    const tonfo = rumore(c, 0.12);
    const basso = c.createBiquadFilter();
    basso.type = 'lowpass';
    basso.frequency.value = 320;
    const volTonfo = c.createGain();
    volTonfo.gain.setValueAtTime(VOLUME.porta * 1.1, t + 0.30);
    volTonfo.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    tonfo.connect(basso).connect(volTonfo).connect(c.destination);
    tonfo.start(t + 0.30);
  } catch { /* un suono che non parte non ferma niente */ }
}

/**
 * Il tasto della macchina da scrivere: un clic secco, quindici millesimi.
 *
 * L'altezza cambia di poco a ogni battuta, a caso: due tasti identici in
 * fila suonano finti, e una macchina da scrivere non e' un metronomo.
 */
export function tasto() {
  if (!acceso()) return;
  const c = contesto();
  if (!c) return;
  try {
    const t = c.currentTime;
    const n = rumore(c, 0.02);
    const alto = c.createBiquadFilter();
    alto.type = 'bandpass';
    alto.Q.value = 2.2;
    alto.frequency.value = 1900 + Math.random() * 700;
    const vol = c.createGain();
    vol.gain.setValueAtTime(VOLUME.tasto, t);
    vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
    n.connect(alto).connect(vol).connect(c.destination);
    n.start(t);
  } catch { /* idem */ }
}

/** La campanella di fine riga: chiude la frase, e si sente che ha finito. */
export function campanello() {
  if (!acceso()) return;
  const c = contesto();
  if (!c) return;
  try {
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1760, t);
    const vol = c.createGain();
    vol.gain.setValueAtTime(VOLUME.campanello, t);
    vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(vol).connect(c.destination);
    osc.start(t); osc.stop(t + 0.36);
  } catch { /* idem */ }
}

/** Da chiamare quando si esce: il contesto audio non deve restare aperto. */
export function chiudiSuoni() {
  try { if (ctx) { ctx.close(); ctx = null; } } catch { ctx = null; }
}
