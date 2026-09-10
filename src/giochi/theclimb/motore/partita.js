/**
 * The Climb: il motore. Nessun DOM, nessuna rete, nessun orologio.
 *
 * Chi disegna chiama `creaPartita`, poi ogni settimana `giocaSettimana` con
 * un piano — o senza, e allora vale la routine. Quando il giocatore cambia
 * routine, `impostaRoutine`: e' una decisione, e finisce nel log come le
 * altre.
 *
 * IL PATTO DEL DETERMINISMO. Dato `(seme, background, percorso, log)` la
 * partita e' sempre la stessa. Non c'e' un `Math.random` in tutto il
 * modulo — c'e' `caso.js`, che nasce dal seme. Serve a rigiocare un
 * difetto, al simulatore, alla verifica di un punteggio, e a «E se fossi
 * nato altrove?», che e' questa stessa partita rigiocata con un altro
 * background.
 *
 * IL LOG E' LA FONTE DI VERITA'. Ogni scelta e' una riga
 * `{ s: settimana, tipo, ... }`. Il replay legge quelle righe e le rifa';
 * se una scelta in quel background non esiste, quella settimana si gioca
 * con la routine che il giocatore aveva allora — che e' a sua volta nel
 * log — e il replay conta quante volte e' successo.
 *
 * GLI IMPORT CON L'ESTENSIONE, come in The Boss: cosi' il motore gira anche
 * in `node` cosi' com'e', e il simulatore e' un comando.
 */

import { nuovoStato, nuovoLavoro, VERSIONE_MOTORE } from './stato.js';
import { creaCaso } from './caso.js';
import {
  risolvi, controllaPiano, attivitaDisponibili, tempoDisponibile, energiaDisponibile, oreObbligatorie,
  COLONNE_STORICO,
} from './settimana.js';
import { percorsoById } from '../contenuti/percorsi.js';
import { livelloN } from '../contenuti/livelli.js';
import { aziendaById } from '../contenuti/aziende.js';
import { mediaDi } from './competenze.js';
import { PARTITA, NOIA, COLLOQUIO, PROMOZIONE } from '../contenuti/bilancio.js';
const PROMOZIONE_OGNI = PROMOZIONE.ogniSettimane;
import {
  porteDi, faiColloquio, accettaOfferta, rifiutaOfferta, schedaAzienda, stipendioDi, punteggioCompetenze,
} from './carriera.js';

import { agisci as agisciSu, schedaPersona, personeVicine } from './persone.js';
import { rispondiEvento, rispondiConLaRoutine, schedaEvento, richiamoOccasioni } from './eventi.js';
import { scorrettezzeDi, bara, macchiaDi } from './etica.js';
import { fermati, molla, puoFermarsi, puoMollare, epilogo } from './finali.js';

import { schedeSbloccate } from './enciclopedia.js';

export { rispondiEvento, rispondiConLaRoutine, scorrettezzeDi, bara, fermati, molla, epilogo, schedeSbloccate };

export { porteDi, faiColloquio, accettaOfferta, rifiutaOfferta, schedaAzienda, stipendioDi, punteggioCompetenze };

/**
 * Una mossa con una persona. «Vattene» e' lasciare il lavoro, e passa
 * da qui perche' sia una riga sola nel log.
 */
export function agisci(stato, personaId, azione) {
  const r = agisciSu(stato, personaId, azione);
  if (r.ok && r.lascia) lasciaLavoro(stato);
  return r;
}

export { VERSIONE_MOTORE, COLONNE_STORICO, attivitaDisponibili, tempoDisponibile, energiaDisponibile, oreObbligatorie, controllaPiano };
export { energiaChiesta } from './settimana.js';

/* ─── Nascita ─── */

export function creaPartita(opzioni = {}) {
  const stato = nuovoStato(opzioni);
  /* `eventi: false` e' per le prove che vogliono un mondo fermo: niente
     scatta. Una partita vera non lo usa, e il replay nemmeno. */
  if (opzioni.eventi === false) stato.senzaEventi = true;
  return stato;
}

/* ─── Le decisioni ─── */

/** Sceglie o cambia percorso. E' una decisione: va nel log. */
export function scegliPercorso(stato, percorso) {
  if (stato.fase === 'finita') return { ok: false, errore: 'La partita è finita.' };
  if (!percorsoById(percorso)) return { ok: false, errore: `Percorso sconosciuto: ${percorso}.` };
  if (stato.percorso !== percorso) stato.settimaneStudio = 0;
  stato.percorso = percorso;
  stato.log.push({ s: stato.settimana, tipo: 'percorso', percorso });
  return { ok: true };
}

/**
 * Prendere un lavoro. Nella fase uno si possono prendere solo i lavori di
 * sopravvivenza, e si prendono e basta: la fase tre mette in mezzo le
 * aziende strutturate, i colloqui e i filtri sul curriculum. Ma il fatto di
 * *avere* un lavoro deve esistere da subito, se no chi non nasce con uno
 * stipendio non ha modo di guadagnarlo — e nel simulatore il ceto medio
 * moriva di fame in trentacinque settimane in ogni routine.
 */
export function prendiLavoro(stato, aziendaId) {
  if (stato.fase === 'finita') return { ok: false, errore: 'La partita è finita.' };
  const az = aziendaById(aziendaId);
  if (!az) return { ok: false, errore: `Azienda sconosciuta: ${aziendaId}.` };
  if (az.tipo !== 'sopravvivenza') return { ok: false, errore: 'Per questo lavoro serve un colloquio.' };
  stato.lavoro = nuovoLavoro(az.id);
  stato.valutazioniBasse = 0;
  /* un posto nuovo e' nuovo anche per la testa: la noia si dimezza, non
     sparisce — chi era gia' spento ci mette un po' a riaccendersi */
  stato.corpo.noia *= NOIA.cambioLavoro;
  stato.log.push({ s: stato.settimana, tipo: 'lavoro', azienda: az.id });
  return { ok: true };
}

/** Lasciarlo. Si torna senza stipendio, e con le ore libere. */
export function lasciaLavoro(stato) {
  if (stato.fase === 'finita') return { ok: false, errore: 'La partita è finita.' };
  if (!stato.lavoro) return { ok: false, errore: 'Non hai un lavoro da lasciare.' };
  stato.log.push({ s: stato.settimana, tipo: 'dimissioni', azienda: stato.lavoro.aziendaId });
  stato.lavoro = null;
  return { ok: true };
}

/**
 * La routine: quello che si fa quando non si decide niente di speciale.
 * Deve essere un piano valido oggi; se domani non lo fosse piu' (un lavoro
 * nuovo con piu' ore), `giocaSettimana` la aggiusta e lo dice.
 */
export function impostaRoutine(stato, piano) {
  if (stato.fase === 'finita') return { ok: false, errore: 'La partita è finita.' };
  const c = controllaPiano(stato, piano);
  if (!c.ok) return c;
  stato.routine = { ...stato.routine, ...Object.fromEntries(Object.keys(stato.routine).map((k) => [k, 0])), ...piano };
  stato.log.push({ s: stato.settimana, tipo: 'routine', piano: Object.fromEntries(Object.entries(piano).filter(([, t]) => t > 0)) });
  return { ok: true };
}

/**
 * Gioca una settimana. Con un piano, quello; senza, la routine. Torna il
 * riepilogo, che dice che cosa e' cambiato e perche'.
 */
export function giocaSettimana(stato, piano = null) {
  if (stato.fase === 'finita') return { ok: false, errore: 'La partita è finita.' };
  /* quello che e' successo aspetta una risposta: con un piano in mano si
     risponde prima; con la routine risponde la routine, cioe' la
     predefinita — e' la stessa regola del replay */
  if (stato.eventi.length) {
    if (piano !== null) return { ok: false, errore: 'Prima rispondi a quello che è successo.' };
    rispondiConLaRoutine(stato);
  }
  const scelto = piano ?? aggiustata(stato, stato.routine);
  const c = controllaPiano(stato, scelto);
  if (!c.ok) return c;
  const riepilogo = risolvi(stato, scelto);
  return { ok: true, ...riepilogo, daRoutine: piano === null };
}

/** La routine com'e' oggi, gia' resa valida: da qui parte il piano della settimana. */
export const pianoDiRoutine = (stato) => aggiustata(stato, stato.routine);

/**
 * La routine, resa valida per oggi: se il lavoro chiede piu' ore di quelle
 * che la routine gli dava, gliele si danno togliendole altrove, dall'ozio
 * in giu'. Torna un piano nuovo, non tocca la routine.
 */
function aggiustata(stato, routine) {
  const piano = { ...routine };
  const disponibili = attivitaDisponibili(stato);
  for (const a of disponibili) {
    if (a.invisibile) piano[a.id] = 0;
    if ((piano[a.id] ?? 0) < a.minimo) piano[a.id] = a.minimo;
    if ((piano[a.id] ?? 0) > a.massimo) piano[a.id] = a.massimo;
  }
  const tetto = tempoDisponibile(stato);
  const cedibili = ['ozio', 'lavoretti', 'networking', 'progetti', 'volontariato', 'candidature', 'studio', 'sport', 'relazioni', 'sonno', 'straordinari'];
  let totale = Object.values(piano).reduce((s, t) => s + t, 0);
  for (const id of cedibili) {
    if (totale <= tetto) break;
    const via = Math.min(piano[id] ?? 0, totale - tetto);
    piano[id] -= via;
    totale -= via;
  }
  return piano;
}

/* ─── Quello che si legge ─── */

/** Lo stato per chi disegna: niente caso, niente nascosti. */
export function fotografia(stato) {
  return {
    versione: stato.versioneMotore,
    fase: stato.fase,
    settimana: stato.settimana,
    settimaneMassime: PARTITA.settimaneMassime,
    eta: stato.eta,
    background: stato.background,
    percorso: stato.percorso,
    titoli: [...stato.titoli],
    settimaneStudio: stato.settimaneStudio,
    corpo: { ...stato.corpo },
    vita: { ...stato.vita },
    lavoro: stato.lavoro ? {
      ...stato.lavoro,
      livelloNome: livelloN(stato.lavoro.livello).nome,
      stipendio: stipendioDi(stato.lavoro),
      azienda: schedaAzienda(stato, stato.lavoro.aziendaId),
      prossimaValutazione: stato.lavoro && !schedaAzienda(stato, stato.lavoro.aziendaId)?.stipendio
        ? PROMOZIONE_OGNI - (stato.settimana % PROMOZIONE_OGNI || PROMOZIONE_OGNI) + 1
        : null,
    } : null,
    /* la carriera: dove si puo' bussare, le offerte che aspettano, gli
       ultimi colloqui, le valutazioni, e quanta ricerca si ha in mano */
    porte: porteDi(stato),
    offerte: stato.offerte.map((o) => ({ ...o, nome: aziendaById(o.aziendaId)?.nome, livelloNome: livelloN(o.livello).nome, scheda: schedaAzienda(stato, o.aziendaId) })),
    colloqui: [...stato.colloqui],
    valutazioni: [...stato.valutazioni],
    ricerca: Math.floor(stato.ricerca),
    costoColloquio: COLLOQUIO.costo,
    sponsor: stato.sponsor,
    persone: personeVicine(stato).map((p) => schedaPersona(stato, p)),
    eventi: stato.eventi.map((p) => schedaEvento(stato, p)).filter(Boolean),
    differite: stato.differite.map((d) => ({ fra: d.s - stato.settimana, testo: d.testo })),
    occasioni: { ...stato.occasioni, richiamo: richiamoOccasioni(stato) },
    /* l'etica come la vede il giocatore: l'integrita' (che c'e' gia' in
       `vita`), la macchia, le scorciatoie possibili, e le due porte per
       chiudere. Il sospetto no: e' nascosto per costruzione */
    macchia: macchiaDi(stato),
    scorrettezze: scorrettezzeDi(stato),
    esplosioni: [...stato.esplosioni],
    impresa: stato.impresa,
    fermarsi: puoFermarsi(stato),
    mollare: puoMollare(stato),
    schede: schedeSbloccate(stato),
    hard: { ...stato.hard },
    soft: { ...stato.soft },
    mediaHard: Math.round(mediaDi(stato.hard)),
    mediaSoft: Math.round(mediaDi(stato.soft)),
    portfolio: stato.portfolio,
    tempo: tempoDisponibile(stato),
    energia: Math.round(energiaDisponibile(stato)),
    oreObbligatorie: oreObbligatorie(stato),
    attivita: attivitaDisponibili(stato),
    routine: { ...stato.routine },
    esito: stato.esito,
  };
}

/** Quello che il gioco sa e il giocatore no. Per le prove e il simulatore. */
export const dietroLeQuinte = (stato) => ({ sospetto: stato.nascosto.sospetto, passiCaso: stato.caso.passi() });

/** Il riassunto di fine partita: quello che si salva. */
export function riassunto(stato) {
  return {
    versioneMotore: stato.versioneMotore,
    seme: stato.seme,
    background: stato.background,
    percorso: stato.percorso,
    settimane: stato.settimana,
    eta: stato.eta,
    esito: stato.esito,
    titoli: [...stato.titoli],
    livello: stato.lavoro?.livello ?? 0,
    livelloMassimo: stato.carriera.livelloMassimo,
    sponsorAvuto: Boolean(stato.sponsor) || stato.persone.some((p) => p.archetipo === 'sponsor' && p.fiducia >= 60),
    integrita: Math.round(stato.vita.integrita),
    /* dove si era dopo tre anni: con un tetto uguale per tutti, e' il
       «quando» che distingue le vite, non il «dove» */
    livelloTreAnni: Math.max(0, ...stato.storico.slice(0, 3 * PARTITA.settimanePerAnno).map((r) => r[12])),
    livelloSeiAnni: Math.max(0, ...stato.storico.slice(0, 6 * PARTITA.settimanePerAnno).map((r) => r[12])),
    primoLavoroVero: stato.carriera.primoLavoroVero,
    aziende: [...stato.carriera.aziende],
    soldi: Math.round(stato.vita.soldi),
    salute: Math.round(stato.corpo.salute),
    stress: Math.round(stato.corpo.stress),
    noia: Math.round(stato.corpo.noia),
    felicita: Math.round(stato.corpo.felicita),
    relazioni: Math.round(stato.vita.relazioni),
    rete: Math.round(stato.vita.rete),
    reputazione: Math.round(stato.vita.reputazione),
    mediaHard: Math.round(mediaDi(stato.hard)),
    mediaSoft: Math.round(mediaDi(stato.soft)),
    decisioni: stato.log.length,
    eventiVisti: Object.keys(stato.eventiVisti).length,
    salti: stato.occasioni.prese,
    occasioniLasciate: stato.occasioni.lasciate,
    scorrettezze: stato.contaScorrettezze.fatte,
    esplosioni: stato.contaScorrettezze.esplosioni,
    epilogo: stato.fase === 'finita' ? epilogo(stato) : null,
  };
}

/* ─── Salvare e riaprire ─── */

/* Una copia profonda, non un ripasso di riferimenti: quello che si salva
   non deve muoversi con la partita che continua, e una partita riaperta
   da una salvata non deve condividerci le persone. */
const copia = (v) => JSON.parse(JSON.stringify(v));

export function serializza(stato) {
  const { caso, ...resto } = stato;
  return { ...copia(resto), passiCaso: caso.passi() };
}

export function deserializza(riga) {
  const caso = creaCaso(riga.seme);
  for (let i = 0; i < (riga.passiCaso ?? 0); i += 1) caso.numero();
  const { passiCaso, ...resto } = riga;
  void passiCaso;
  return { ...copia(resto), caso, versioneMotore: riga.versioneMotore ?? VERSIONE_MOTORE };
}
