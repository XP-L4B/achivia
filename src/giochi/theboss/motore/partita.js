/**
 * The Boss: il motore. Nessun DOM, nessuna rete, nessun orologio.
 *
 * Chi disegna chiama `creaPartita`, `iniziaGiornata`, `decidi` una volta
 * per richiesta e `chiudiGiornata`; il tempo che scorre e' un problema
 * dell'interfaccia, e quando scade dice `decidi(stato, 'scaduta')`. Il
 * motore non sa che ora e', e per questo una partita si puo' rigiocare.
 *
 * IL PATTO DEL DETERMINISMO. Dato `(seme, sequenza di risposte)` la partita
 * e' sempre la stessa: stessa fila alla porta, stessi eventi, stesso
 * punteggio. Non c'e' un `Math.random` in tutto il modulo — c'e' `caso.js`,
 * che nasce dal seme. Serve a tre cose: rigiocare un difetto, far girare il
 * simulatore su diecimila partite, e permettere un giorno a un server di
 * ricontrollare un punteggio rifacendo la partita invece di fidarsi.
 *
 * GLI IMPORT CON L'ESTENSIONE. Nel resto di Achivia si scrive
 * `from './persone'`, e Vite completa da solo. Qui dentro no: con
 * l'estensione scritta, il motore lo esegue anche `node` cosi' com'e',
 * senza compilare niente — ed e' quello che permette al simulatore Monte
 * Carlo di essere un comando invece che una procedura.
 *
 * LE TRE RISPOSTE, E LA QUARTA. Accetta, rifiuta, rimanda. La quarta e' non
 * rispondere, e non e' una risposta: chi resta senza risposta si sente
 * ignorato, il rancore sale piu' che con un no, e la sua memoria se lo
 * segna doppio. Il gioco vuole che sia chiaro che non decidere costa piu'
 * che decidere male.
 */

import {
  PARTITA, INDULGENZA, RANCORE, SCADUTA, DIFFERITE, SCONFITTA, PASSO, LIMITI,
} from '../contenuti/bilancio.js';
import { archetipoById } from '../contenuti/archetipi.js';
import { assumiTutti, dipendentiAttivi, ricorda, umoreDopo, aziendaDiPartenza, ha } from './persone.js';
import { applicaGradini, applicaAPersona, arrotonda } from './leve.js';
import { pescaGiornata, livelloDi } from './pescaggio.js';
import { chiudi, programma, capovolto } from './giornata.js';
import { creaCaso } from './caso.js';

export const VERSIONE_MOTORE = 1;
export const AZIONI = ['accetta', 'rifiuta', 'rimanda', 'scaduta'];

/* ─── Nascita ─── */

export function creaPartita({ seme = 1, banca = null } = {}) {
  const caso = creaCaso(seme);
  const stato = {
    seme,
    versioneMotore: VERSIONE_MOTORE,
    versioneContenuti: banca?.versione ?? 0,
    banca,
    /* i testi gia' usati in questa partita: nessuno si ripete */
    testiUsati: new Set(),
    caso,
    giorno: 1,
    fase: 'briefing',
    azienda: aziendaDiPartenza(),
    persone: assumiTutti(caso),
    coda: [],
    indice: 0,
    /* quello che tornera' indietro, e quello che e' stato rimandato */
    differite: [],
    differiteMinimo: DIFFERITE.minimo,
    differiteMassimo: DIFFERITE.massimo,
    rimandate: [],
    /* la memoria del pescaggio: chi ha gia' chiesto che cosa */
    gia: {},
    eventiAttivi: [],
    eventiFatti: {},
    usciti: [],
    /* il diario: serve al rapporto, al punteggio e a rigiocare */
    decisioni: [],
    rapporti: [],
    storicoFatturato: [],
    storicoProduttivita: [],
    storicoNascosto: [],
    giorniCassaNegativa: 0,
    giorniProduttivitaBassa: 0,
    esito: null,
  };
  return stato;
}

/* ─── La giornata ─── */

export function iniziaGiornata(stato) {
  if (stato.fase === 'finita') return stato;
  stato.coda = pescaGiornata(stato);
  stato.indice = 0;
  stato.fase = 'richieste';
  /* Com'era l'azienda stamattina: il rapporto della sera confronta con
     questo, non con com'era mezz'ora fa. Chi legge vuole sapere che cosa ha
     fatto la sua giornata, non che cosa ha fatto la chiusura dei conti. */
  stato.mattina = { ...stato.azienda };
  return stato;
}

export const richiestaCorrente = (stato) => (stato.fase === 'richieste' ? stato.coda[stato.indice] || null : null);
export const richiesteRimaste = (stato) => Math.max(0, stato.coda.length - stato.indice);

/** La persona che sta parlando adesso. */
export const autoreDi = (stato, richiesta) => stato.persone.find((p) => p.id === richiesta?.autoreId) || null;

/**
 * Quanto pesa questa richiesta: l'escalation la rincara, e chi l'ha gia'
 * rimandata una volta la ritrova ancora piu' cara.
 */
export function scalaDi(richiesta) {
  return (richiesta.scala || 1) * (1 + INDULGENZA.rincaro * (richiesta.livello - 1));
}

/**
 * La risposta. `azione` e' una delle quattro; torna che cosa e' successo,
 * compreso l'umore con cui chi ha chiesto esce dalla stanza.
 */
export function decidi(stato, azione) {
  const richiesta = richiestaCorrente(stato);
  if (!richiesta) return null;
  if (!AZIONI.includes(azione)) return null;
  const arch = archetipoById(richiesta.archetipo);
  const chi = autoreDi(stato, richiesta);
  const scala = scalaDi(richiesta);

  /* I gradini di questa risposta. Se un evento capovolge l'archetipo, il
     segno della produttivita' si rovescia: lavorare da casa, in tempo di
     peste, fa guadagnare invece che perdere. */
  let gradini = azione === 'scaduta'
    ? { rancore: SCADUTA.rancore, morale: SCADUTA.morale, produttivita: SCADUTA.produttivita }
    : { ...(arch[azione] || {}) };
  if (capovolto(stato, arch.id) && gradini.produttivita) {
    gradini = { ...gradini, produttivita: -gradini.produttivita };
  }
  /* Il rifiuto pesa doppio su chi e' fragile, e meno su chi non se ne accorge. */
  let scalaPersona = 1;
  if (chi && azione !== 'accetta') {
    if (ha(chi, 'fragile')) scalaPersona *= 1.5;
    if (ha(chi, 'invisibile')) scalaPersona *= 0.7;
    if (ha(chi, 'sindacalizzato')) scalaPersona *= 1.4;   // quello che gli succede lo sanno tutti
  }

  const cambiato = applicaGradini(stato.azienda, gradini, azione === 'accetta' ? scala : scalaPersona);

  /* Ogni si' alza l'asticella e ogni no lascia il segno, qualunque cosa
     dica l'archetipo: e' la regola generale sotto le due spirali, e sta
     qui e non nei contenuti proprio perche' vale per tutti. */
  const a = stato.azienda;
  if (azione === 'accetta') {
    a.indulgenza = Math.min(LIMITI.indulgenza[1], a.indulgenza + INDULGENZA.perSi);
    cambiato.indulgenza = (cambiato.indulgenza || 0) + INDULGENZA.perSi;
  } else if (azione === 'rifiuta' || azione === 'rimanda') {
    a.rancore = Math.min(LIMITI.rancore[1], a.rancore + RANCORE.perNo);
    cambiato.rancore = (cambiato.rancore || 0) + RANCORE.perNo;
  } else {
    /* Il silenzio: piu' del doppio di un no, perche' un no almeno e' una
       risposta. Se questo peso mancasse, rifiutare costerebbe piu' che
       ignorare — e il gioco direbbe l'opposto di quello che vuole dire. */
    a.rancore = Math.min(LIMITI.rancore[1], a.rancore + SCADUTA.rancorePiatto);
    cambiato.rancore = (cambiato.rancore || 0) + SCADUTA.rancorePiatto;
  }
  if (chi) {
    applicaAPersona(chi, gradini, scalaPersona);
    if (azione === 'scaduta') applicaAPersona(chi, { lealta: SCADUTA.lealta }, 1);
    ricorda(chi, azione, stato.giorno);
  }

  /* Le conseguenze differite: quello che torna indietro fra tre e dieci giorni. */
  let promessaMantenuta = null;
  if (arch.differita && arch.differita.se.includes(azione)) {
    if (richiesta.autoreTipo === 'assistant_manager' && azione === 'accetta') {
      /* Un assistant manager promette. La promessa vale quanto lui vale, e
         il giocatore non puo' saperlo prima: puo' solo ricordarsi com'e'
         andata le altre volte. Quando non si avvera, non e' che non succede
         niente — succede il contrario. */
      promessaMantenuta = stato.caso.forse(arch.attendibile ?? 0.6);
      const effetto = promessaMantenuta
        ? arch.differita.effetto
        : Object.fromEntries(Object.entries(arch.differita.effetto).map(([k, v]) => [k, -Math.abs(v) * 0.6]));
      const causa = promessaMantenuta
        ? arch.differita.causa
        : `quello che ${chi?.nome ?? 'il manager'} aveva promesso non è successo`;
      programma(stato, effetto, causa, chi?.id ?? null);
    } else {
      programma(stato, arch.differita.effetto, arch.differita.causa, chi?.id ?? null);
    }
  }

  /* Rimandare non e' una via d'uscita: la richiesta torna, di livello
     superiore e piu' cara. */
  if (azione === 'rimanda') {
    stato.rimandate.push({
      archetipo: arch.id,
      autoreId: richiesta.autoreId,
      autoreTipo: richiesta.autoreTipo,
      livello: richiesta.livello,
      scala: scala,
      torna: stato.giorno + 2 + stato.caso.intero(4),
      rimandataIl: stato.giorno,
    });
  }

  const umore = chi ? umoreDopo(chi, azione) : 'rassegnato';
  const riga = {
    giorno: stato.giorno,
    richiestaId: richiesta.id,
    archetipo: arch.id,
    autoreId: richiesta.autoreId,
    autoreTipo: richiesta.autoreTipo,
    livello: richiesta.livello,
    azione,
    umore,
    cambiato,
  };
  stato.decisioni.push(riga);
  stato.indice += 1;
  return { ...riga, promessaMantenuta };
}

/**
 * Chiude la giornata. Quello che e' rimasto in fila scade — e scadere e' la
 * risposta peggiore — poi si fanno i conti.
 */
export function chiudiGiornata(stato) {
  if (stato.fase === 'finita') return null;
  while (richiestaCorrente(stato)) decidi(stato, 'scaduta');
  const rapporto = chiudi(stato);
  rapporto.scadute = stato.decisioni.filter((d) => d.giorno === stato.giorno && d.azione === 'scaduta').length;
  stato.rapporti.push(rapporto);
  stato.fase = 'rapporto';
  controllaFine(stato);
  return rapporto;
}

export function prossimoGiorno(stato) {
  if (stato.fase === 'finita') return stato;
  stato.giorno += 1;
  stato.fase = 'briefing';
  return stato;
}

/* ─── Come finisce ─── */

function controllaFine(stato) {
  if (stato.giorniCassaNegativa >= SCONFITTA.giorniCassaNegativa) return finisce(stato, false, 'cassa');
  if (stato.giorniProduttivitaBassa >= SCONFITTA.giorniProduttivitaBassa) return finisce(stato, false, 'produttivita');
  if (dipendentiAttivi(stato.persone).length < SCONFITTA.organicoMinimo) return finisce(stato, false, 'organico');
  if (stato.giorno >= PARTITA.giorni) return finisce(stato, true, 'arrivato');
  return null;
}

function finisce(stato, vinta, causa) {
  stato.fase = 'finita';
  stato.esito = { vinta, causa, giorno: stato.giorno };
  return stato.esito;
}

/* ─── Quello che si mostra ─── */

/** I numeri per il cruscotto: i cinque che si vedono, e mai i due nascosti. */
export function fotografia(stato) {
  const a = stato.azienda;
  return {
    giorno: stato.giorno,
    giorni: PARTITA.giorni,
    fase: stato.fase,
    cassa: Math.round(a.cassa),
    produttivita: arrotonda(a.produttivita),
    morale: arrotonda(a.morale),
    reputazione: arrotonda(a.reputazione),
    fatturato: Math.round(a.fatturato),
    costi: Math.round(a.costi),
    /* Il numero che spiega tutti gli altri. Prima non c'era, e chi giocava
       vedeva la cassa scendere senza sapere di quanto era sotto: la
       decisione «devo tagliare?» si prende su questo, non sull'umore. */
    saldo: Math.round(a.fatturato - a.costi),
    organico: dipendentiAttivi(stato.persone).length,
    rimaste: richiesteRimaste(stato),
    eventi: stato.eventiAttivi.map((e) => ({ id: e.id, nome: e.nome, racconto: e.racconto, finisce: e.finisce })),
    esito: stato.esito,
  };
}

/** Quello che il gioco sa e il giocatore no: serve alle prove e al simulatore. */
export const dietroLeQuinte = (stato) => ({
  indulgenza: arrotonda(stato.azienda.indulgenza),
  rancore: arrotonda(stato.azienda.rancore),
  livello: livelloDi(stato.azienda.indulgenza),
  differite: stato.differite.length,
  rimandate: stato.rimandate.length,
});

/** Il riassunto di fine partita: quello che si salva e quello che fa punteggio. */
export function riassunto(stato) {
  const f = stato.storicoFatturato;
  const p = stato.storicoProduttivita;
  const media = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0);
  const conta = (a) => stato.decisioni.filter((d) => d.azione === a).length;
  return {
    seme: stato.seme,
    versioneMotore: stato.versioneMotore,
    versioneContenuti: stato.versioneContenuti,
    giorni: stato.rapporti.length,
    vinta: Boolean(stato.esito?.vinta),
    causa: stato.esito?.causa || null,
    cassaFinale: Math.round(stato.azienda.cassa),
    produttivitaMedia: arrotonda(media(p)),
    fatturatoMedio: Math.round(media(f)),
    moraleFinale: arrotonda(stato.azienda.morale),
    reputazioneFinale: arrotonda(stato.azienda.reputazione),
    organicoFinale: dipendentiAttivi(stato.persone).length,
    usciti: stato.usciti.length,
    accettate: conta('accetta'),
    rifiutate: conta('rifiuta'),
    rimandate: conta('rimanda'),
    scadute: conta('scaduta'),
  };
}

export { PASSO };
