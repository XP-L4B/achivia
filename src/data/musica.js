/**
 * La musica di sottofondo.
 *
 * Sei brani che girano in tondo, uno alla volta, con il volume che decide
 * chi ascolta. Non c'e' nessuna libreria: un solo elemento audio, creato
 * quando serve, che il resto dell'app non vede mai — si parla con lui da
 * qui, come si parla col database da `db.js`.
 *
 * Tre cose vanno dette, perche' spiegano quasi tutto il codice qui sotto:
 *
 *   1. Il browser non lascia partire un suono prima che qualcuno abbia
 *      toccato la pagina. Non e' un errore da aggirare: e' la regola, ed
 *      e' giusta. Quindi si prova, e se la prova viene respinta si aspetta
 *      il primo clic o il primo tasto e si riprova una volta sola.
 *
 *   2. I brani non si scaricano finche' non servono (`preload = 'none'`) e
 *      si scarica solo quello che suona: sono file da tre a sette
 *      megabyte, e chi tiene la musica spenta non ne deve scaricare
 *      nemmeno uno.
 *
 *   3. Il volume non salta mai da zero al suo valore: sale e scende in
 *      sette decimi di secondo. Una musica che parte di colpo fa
 *      sobbalzare; una che sfuma sembra che ci fosse gia'.
 *
 *   4. Su iPhone e iPad il volume di un elemento audio non si puo'
 *      scrivere: il sistema lo tiene per se' e lo lascia ai tasti del
 *      telefono. Si scrive, non cambia niente, e non arriva nessun
 *      errore — la manopola si muoveva e il volume restava dov'era.
 *      Dove succede, il suono passa da un rubinetto di Web Audio, che
 *      invece si puo' girare (vedi `poni`).
 */

const files = import.meta.glob('../assets/musica/*.mp3', { eager: true, import: 'default' });

// I titoli come li ha scritti chi li ha fatti: dal nome del file si
// ricaverebbero, ma con le maiuscole sbagliate e senza apostrofi.
const TITOLI = {
  'achivias-dream': 'Achivia’s Dream',
  'beneath-the-waking-peaks': 'Beneath the Waking Peaks',
  'druids-path': 'Druid’s Path',
  'finally-home': 'Finally Home',
  'jobless-dream': 'Jobless Dream',
  'no-kings': 'No Kings',
  sirio: 'Sirio',
  'tavern-at-dusk': 'A Tavern at Dusk',
};

const idFile = (percorso) => percorso.split('/').pop().replace('.mp3', '');

export const BRANI = Object.entries(files)
  .map(([percorso, url]) => {
    const id = idFile(percorso);
    return { id, titolo: TITOLI[id] ?? id, url };
  })
  .sort((a, b) => a.titolo.localeCompare(b.titolo, 'it'));

const CHIAVE = 'achivia_musica';
const VOLUME_DI_PARTENZA = 0.35;
const DISSOLVENZA = 700;   // ms per accendere o spegnere il volume

/** Le preferenze salvate, o quelle di partenza se non ce ne sono. */
function leggi() {
  try {
    const salvato = JSON.parse(localStorage.getItem(CHIAVE));
    if (salvato && typeof salvato === 'object') {
      return {
        accesa: salvato.accesa !== false,
        volume: Math.min(1, Math.max(0, Number(salvato.volume ?? VOLUME_DI_PARTENZA))),
      };
    }
  } catch {
    /* niente da leggere, o dati storti: si riparte dalle preferenze di casa */
  }
  return { accesa: true, volume: VOLUME_DI_PARTENZA };
}

let stato = leggi();

function salva() {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(stato));
  } catch {
    /* se non si puo' salvare, la musica funziona lo stesso per questa volta */
  }
}

/* ─── Chi guarda ─────────────────────────────────────────────
   Le schermate che mostrano i comandi si iscrivono e si ridisegnano
   quando qualcosa cambia: e' lo stesso giro di `db.js`. */
const ascoltatori = new Set();
export const iscriviti = (fn) => {
  ascoltatori.add(fn);
  return () => ascoltatori.delete(fn);
};
const annuncia = () => ascoltatori.forEach((fn) => fn());

/* ─── L'ordine dei brani ─────────────────────────────────────
   Mescolati a ogni apertura: sei brani in fila sempre uguale si
   riconoscono dopo due giorni, e la musica di sottofondo smette di
   stare sotto. L'ordine non si salva, e non deve. */
const scaletta = BRANI.map((b) => b).sort(() => Math.random() - 0.5);
let indice = 0;

let audio = null;
let sbloccoArmato = false;
let dissolvenza = null;
// Il rubinetto, quando serve: sta fra l'elemento audio e gli altoparlanti.
let contesto = null;
let rubinetto = null;

/**
 * Se scrivere `audio.volume` cambia qualcosa davvero.
 *
 * Non si guarda che browser e': si prova. Un controllo sul nome del
 * browser sarebbe una lista da aggiornare per sempre, e sbagliata il
 * giorno dopo; questa e' la domanda vera, fatta a chi ha la risposta.
 */
function volumeSiPuoScrivere(a) {
  const prima = a.volume;
  const prova = prima === 0.5 ? 0.6 : 0.5;
  a.volume = prova;
  const risponde = Math.abs(a.volume - prova) < 0.01;
  a.volume = prima;
  return risponde;
}

/**
 * Manda il suono attraverso un rubinetto di Web Audio, che il volume lo
 * lascia girare. Torna `false` se non si puo' fare: allora si resta con
 * quello che c'e', che e' meglio di niente suono.
 */
function apriRubinetto(a) {
  const Contesto = typeof window !== 'undefined'
    && (window.AudioContext || window.webkitAudioContext);
  if (!Contesto) return false;
  try {
    contesto = new Contesto();
    const sorgente = contesto.createMediaElementSource(a);
    rubinetto = contesto.createGain();
    rubinetto.gain.value = 0;
    sorgente.connect(rubinetto);
    rubinetto.connect(contesto.destination);
    return true;
  } catch {
    contesto = null;
    rubinetto = null;
    return false;
  }
}

/** Il volume adesso, da dove lo tiene questo browser. */
const livello = () => (rubinetto ? rubinetto.gain.value : (audio?.volume ?? 0));

/* L'attenuazione: un moltiplicatore che sta sopra il volume scelto e non
   lo tocca. Serve all'arena, che vuole la musica bassa mentre si gioca e
   com'era dopo — senza scrivere niente nelle preferenze. */
let attenuazione = 1;

/** Il volume, scritto dove questo browser lo ascolta. */
function poni(v) {
  const x = Math.min(1, Math.max(0, v * attenuazione));
  if (rubinetto) rubinetto.gain.value = x;
  else if (audio) audio.volume = x;
}

/** L'elemento audio, creato la prima volta che serve davvero. */
function elemento() {
  if (audio || typeof Audio === 'undefined') return audio;
  audio = new Audio();
  audio.preload = 'none';
  audio.volume = 0;
  // Il rubinetto si apre solo dove serve: dove il volume dell'elemento
  // funziona, il suono continua ad andare dritto agli altoparlanti.
  if (!volumeSiPuoScrivere(audio)) apriRubinetto(audio);
  // Finito un brano si passa al successivo; finita la scaletta si
  // ricomincia. Non si usa `loop`: quello ripeterebbe lo stesso brano.
  audio.addEventListener('ended', () => {
    indice = (indice + 1) % scaletta.length;
    carica();
    prova();
  });
  // Un file che non si carica non deve fermare la musica: si passa oltre.
  audio.addEventListener('error', () => {
    if (!stato.accesa) return;
    indice = (indice + 1) % scaletta.length;
    carica();
    prova();
  });
  return audio;
}

function carica() {
  const a = elemento();
  if (!a) return;
  a.src = scaletta[indice].url;
  annuncia();
}

/** Porta il volume dove deve stare, senza salti. */
function porta(verso, poi) {
  const a = elemento();
  if (!a) return;
  if (dissolvenza) cancelAnimationFrame(dissolvenza);
  const da = livello();
  const inizio = performance.now();
  // Il tempo si legge sempre dallo stesso orologio: quello che il browser
  // passa al disegno di ogni fotogramma parte da un'altra origine, e basta
  // mescolare i due perche' una dissolvenza non finisca piu'.
  const passo = () => {
    const t = Math.min(1, (performance.now() - inizio) / DISSOLVENZA);
    poni(da + (verso - da) * t);
    if (t < 1) {
      dissolvenza = requestAnimationFrame(passo);
    } else {
      dissolvenza = null;
      if (poi) poi();
    }
  };
  dissolvenza = requestAnimationFrame(passo);
}

/**
 * Prova a suonare. Se il browser dice di no — e lo dice sempre, finche'
 * nessuno ha toccato la pagina — resta in attesa del primo gesto.
 */
function prova() {
  const a = elemento();
  if (!a || !stato.accesa) return;
  // Un contesto Web Audio nasce fermo: finche' non lo si sveglia, il
  // suono ci passa dentro e non esce.
  if (contesto && contesto.state === 'suspended') contesto.resume?.();
  const promessa = a.play();
  if (promessa && typeof promessa.catch === 'function') {
    promessa.then(() => porta(stato.volume)).catch(() => armaSblocco());
  }
}

/**
 * Se la musica puo' partire da sola al primo tocco.
 *
 * Il browser non lascia suonare niente prima che qualcuno abbia toccato la
 * pagina, quindi all'apertura si arma un ascoltatore e la musica parte al
 * primo clic — un clic qualunque, ovunque sia. Va benissimo dappertutto:
 * si e' aperta un'applicazione che ha una sua musica, e quella comincia.
 *
 * Non va bene entrando nell'arena. Li' quel clic e' "Entra", e chi lo
 * preme non sta chiedendo la musica: sta entrando in un gioco. La musica
 * gli parte addosso e sembra che sia stato il gioco ad accenderla.
 *
 * Quindi l'arena la sospende: quello che gia' suona continua a suonare —
 * entrare in una partita non zittisce niente — ma niente comincia da solo.
 * Accenderla a mano resta possibile, ed e' un'altra cosa: e' qualcuno che
 * la chiede.
 */
let partenzaDaSola = true;

function armaSblocco() {
  if (sbloccoArmato || !partenzaDaSola || typeof window === 'undefined') return;
  sbloccoArmato = true;
  const sblocca = () => {
    window.removeEventListener('pointerdown', sblocca);
    window.removeEventListener('keydown', sblocca);
    sbloccoArmato = false;
    if (stato.accesa && partenzaDaSola) prova();
  };
  window.addEventListener('pointerdown', sblocca, { once: true });
  window.addEventListener('keydown', sblocca, { once: true });
}

/* ─── Quello che si puo' chiedere alla musica ───────────────── */

/** Si accende all'avvio dell'app, e non fa niente se la musica e' spenta. */
export function avvia() {
  if (!stato.accesa) return;
  const a = elemento();
  if (!a) return;
  if (!a.src) carica();
  prova();
}

export function accendi(accesa) {
  stato = { ...stato, accesa };
  salva();
  const a = elemento();
  if (!a) { annuncia(); return; }
  if (accesa) {
    if (!a.src) carica();
    prova();
  } else {
    // Prima si abbassa, poi si ferma: staccare di netto e' uno schiaffo.
    porta(0, () => a.pause());
  }
  annuncia();
}

/**
 * Consente o sospende la partenza da sola. La chiama l'arena, che la
 * sospende entrando e la riconsente uscendo.
 *
 * Riconsentendola, se la musica e' accesa ma ferma — l'attesa del primo
 * tocco e' passata dentro l'arena senza poter far niente — si rimette in
 * attesa: chi esce dal gioco ritrova l'applicazione come l'aveva lasciata.
 */
export function consentiPartenzaDaSola(consentita) {
  partenzaDaSola = Boolean(consentita);
  if (partenzaDaSola && stato.accesa && audio && audio.paused) armaSblocco();
}

export function impostaVolume(volume) {
  const v = Math.min(1, Math.max(0, Number(volume) || 0));
  stato = { ...stato, volume: v };
  salva();
  // Mentre si trascina il cursore il volume segue subito: qui la
  // dissolvenza sarebbe un ritardo, non una gentilezza. E se una
  // dissolvenza e' in corso — la musica e' appena partita — si ferma: stava
  // andando verso il volume di prima, e continuando se lo riprenderebbe
  // dopo un attimo, davanti a chi ha appena scelto un altro valore.
  if (elemento() && stato.accesa) {
    if (dissolvenza) {
      cancelAnimationFrame(dissolvenza);
      dissolvenza = null;
    }
    poni(v);
  }
  annuncia();
}

/** Il brano dopo, per chi questo non lo vuole sentire adesso. */
export function prossimo() {
  indice = (indice + 1) % scaletta.length;
  carica();
  if (stato.accesa) prova();
}

/**
 * Abbassa (o rialza) la musica di un fattore, senza toccare il volume
 * scelto: `attenua(0.35)` entrando nell'arena, `attenua(1)` uscendo.
 */
export function attenua(fattore) {
  attenuazione = Math.min(1, Math.max(0, Number(fattore) || 0));
  if (elemento() && stato.accesa) {
    if (dissolvenza) { cancelAnimationFrame(dissolvenza); dissolvenza = null; }
    poni(stato.volume);
  }
}

export const statoMusica = () => ({
  accesa: stato.accesa,
  volume: stato.volume,
  brano: scaletta[indice],
  quanti: scaletta.length,
});
