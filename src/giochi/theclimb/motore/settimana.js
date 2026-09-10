/**
 * Una settimana: si pianifica, si risolve, si legge com'e' andata.
 *
 * L'ordine e' fisso e ha un perche':
 *
 *  1. si controlla il piano — che il tempo ci stia, che le attivita'
 *     esistano per questa vita, che il lavoro obbligatorio ci sia;
 *  2. si conta l'energia: quella che salute e sonno permettono contro
 *     quella che il piano chiede. Lo sforo si paga in salute e sonno;
 *  3. ogni attivita' fa il suo, unita' per unita';
 *  4. la vita fa il suo: lo stress delle condizioni, la deriva, la ruggine;
 *  5. a fine mese i conti; a fine trimestre la valutazione (fase tre); a
 *     fine anno un anno in piu';
 *  6. si guarda se e' finita.
 *
 * Tutto quello che si muove finisce nel **riepilogo**, con il perche':
 * il gioco non nasconde i numeri, e la trasparenza e' la meccanica
 * didattica.
 */

import {
  TEMPO, ENERGIA, DERIVA, STRESS, NOIA, SOLDI, LAVORO, FINE, PASSO, PARTITA,
  BACKGROUND as NUMERI, PERCORSO, PROMOZIONE, COLLOQUIO,
} from '../contenuti/bilancio.js';
import { LIVELLI } from '../contenuti/livelli.js';
import { ATTIVITA, attivitaById } from '../contenuti/attivita.js';
import { backgroundById } from '../contenuti/background.js';
import { percorsoById } from '../contenuti/percorsi.js';
import { aziendaById } from '../contenuti/aziende.js';
import { eHard } from '../contenuti/competenze.js';
import { cresci, arrugginisci } from './competenze.js';
import { numeriAzienda, stipendioDi, valutazione, scadenzeOfferte } from './carriera.js';
import { settimanaPersone, trimestrePersone } from './persone.js';
import { pesca, scadenzeDifferite, schedaEvento } from './eventi.js';
import { settimanaEtica } from './etica.js';
import { consiglio, trimestreImpresa } from './finali.js';

const stretto = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));
const tondo = (v) => Math.round(v * 10) / 10;

/* ─── Quello che si ha ─── */

/** Il tempo di questa vita, meno quello che un evento ha portato via (mai sotto le ore del lavoro piu' dieci). */
export const tempoDisponibile = (stato) => Math.max(oreObbligatorie(stato) + 10, NUMERI[stato.background].tempo - (stato.malusTempo ?? 0));

/** L'energia che salute e sonno permettono questa settimana. */
export function energiaDisponibile(stato) {
  const { salute, sonno } = stato.corpo;
  return ENERGIA.base
    * (salute / 100) ** ENERGIA.esponenteSalute
    * (1 - sonno / 100) ** ENERGIA.esponenteSonno;
}

/** I punti di tempo che il lavoro pretende, se c'e'. */
export function oreObbligatorie(stato) {
  if (!stato.lavoro) return 0;
  return numeriAzienda(stato.lavoro.aziendaId)?.ore ?? LAVORO.oreBase;
}

/**
 * Le attivita' che questa vita puo' fare, con quelle che non puo' segnate
 * come invisibili e il perche': il giocatore deve vedere la porta chiusa.
 */
export function attivitaDisponibili(stato) {
  const bg = backgroundById(stato.background);
  return ATTIVITA.map((a) => {
    const invisibile = bg.invisibili.includes(a.id);
    const obbligo = a.id === 'lavoro' ? oreObbligatorie(stato) : 0;
    return {
      ...a,
      invisibile,
      perche: invisibile ? 'Per chi parte da qui questa porta non c’è.' : null,
      minimo: Math.max(a.tempo[0], obbligo),
      massimo: a.tempo[1],
    };
  });
}

/** L'energia che un piano chiede. Le schermate la mostrano prima di giocare. */
export function energiaChiesta(stato, piano) {
  let chiesta = 0;
  for (const a of ATTIVITA) {
    const t = piano[a.id] ?? 0;
    if (!t) continue;
    let costo = a.energia;
    if (a.id === 'studio' && stato.percorso) costo *= PERCORSO[stato.percorso].energiaStudio;
    chiesta += (t / TEMPO.unita) * costo;
  }
  return chiesta;
}

/* ─── Il piano ─── */

const no = (errore) => ({ ok: false, errore });

/** Controlla un piano. Torna `{ ok, errore }`, e non tocca lo stato. */
export function controllaPiano(stato, piano) {
  if (!piano || typeof piano !== 'object') return no('Piano mancante.');
  const disponibili = attivitaDisponibili(stato);
  let totale = 0;
  for (const a of disponibili) {
    const t = Number(piano[a.id] ?? 0);
    if (!Number.isFinite(t) || t < 0) return no(`Tempo non valido per «${a.nome}».`);
    if (a.invisibile && t > 0) return no(`«${a.nome}» non è disponibile per te.`);
    if (t < a.minimo) return no(`«${a.nome}» chiede almeno ${a.minimo} punti.`);
    if (t > a.massimo) return no(`«${a.nome}» non può superare ${a.massimo} punti.`);
    totale += t;
  }
  for (const k of Object.keys(piano)) if (!attivitaById(k)) return no(`Attività sconosciuta: ${k}.`);
  const tetto = tempoDisponibile(stato);
  if (totale > tetto) return no(`Il piano vale ${totale} punti, ne hai ${tetto}.`);
  return { ok: true, totale, tetto };
}

/* ─── La risoluzione ─── */

/**
 * Risolve una settimana con questo piano. Chi chiama l'ha gia' controllato.
 * Torna il riepilogo; lo stato e' cambiato.
 */
export function risolvi(stato, piano) {
  const prima = fotografiaNumeri(stato);
  const perche = [];
  const bg = backgroundById(stato.background);
  const c = stato.corpo;
  const v = stato.vita;
  const usate = new Set();

  /* 2. L'energia. */
  const energia = energiaDisponibile(stato);
  const chiesta = energiaChiesta(stato, piano);
  const sforo = Math.max(0, chiesta - energia);
  if (sforo > 0) {
    c.salute -= sforo * ENERGIA.debitoSalute;
    c.sonno += sforo * ENERGIA.debitoSonno;
    perche.push({ cosa: 'energia', quanto: -tondo(sforo), testo: `Hai speso ${Math.round(sforo)} punti di energia più di quelli che avevi: li hai presi in prestito dalla salute e dal sonno.` });
  }

  /* 3. Le attivita', unita' per unita'. */
  const competenzeToccate = new Set();
  for (const a of ATTIVITA) {
    const t = piano[a.id] ?? 0;
    if (!t) continue;
    const unita = t / TEMPO.unita;
    usate.add(a.id);

    /* il networking rende in proporzione alla rete che gia' si ha, e
       costa: a tasche vuote si va a meno aperitivi */
    let scala = 1;
    if (a.scalaSullaRete) {
      scala = 0.35 + 0.65 * (v.rete / 100);
      if (v.soldi < 0) scala *= 0.5;
    }

    for (const [leva, gradini] of Object.entries(a.effetti ?? {})) {
      applica(stato, leva, gradini * unita * scala);
    }

    if (typeof a.costo === 'number') v.soldi += a.costo * PASSO.soldi * unita;
    if (a.portfolio) stato.portfolio += a.portfolio * unita;
    if (a.ricerca) stato.ricerca += a.ricerca * unita;

    /* le competenze: quelle scritte sull'attivita', quelle del percorso,
       quelle del lavoro */
    let insegna = null;
    let spinta = 1;
    let campo = Boolean(a.competenze?.campo);
    if (a.competenze?.dal === 'percorso') {
      const p = stato.percorso ? percorsoById(stato.percorso) : null;
      insegna = p?.insegna ?? null;
      spinta = stato.percorso ? PERCORSO[stato.percorso].spintaStudio : 0;
      if (insegna) {
        stato.studiatoQuestoMese = true;
        stato.settimaneStudio += 1;
        const durata = PERCORSO[stato.percorso].durata;
        if (durata && stato.settimaneStudio === durata && !stato.titoli.includes(stato.percorso)) {
          stato.titoli.push(stato.percorso);
          stato.log.push({ s: stato.settimana, tipo: 'titolo', percorso: stato.percorso });
          perche.push({ cosa: 'titolo', quanto: null, testo: `Hai finito: «${p.nome}». Da questo mese non costa più.` });
        }
        /* i compagni di corso: ogni trimestre passato dentro, finche' si
           e' dentro, un po' di rete — e' il vantaggio nascosto delle strade
           lunghe, quello che fra dieci anni fa la differenza */
        const compagni = PERCORSO[stato.percorso].reteCompagni;
        if (compagni && stato.settimaneStudio % PROMOZIONE.ogniSettimane === 0 && (!durata || stato.settimaneStudio <= durata)) {
          applica(stato, 'rete', compagni);
          perche.push({ cosa: 'rete', quanto: compagni * PASSO.rete, testo: `Compagni di corso: la rete cresce un po' anche stando fermi.` });
        }
      }
    } else if (a.competenze?.dal === 'lavoro') {
      insegna = stato.lavoro ? aziendaById(stato.lavoro.aziendaId)?.insegna ?? null : null;
      campo = true;
      /* quanto si impara sul campo dipende dal posto: la sua formazione,
         e un buon capo, che fa crescere quasi il doppio */
      const nz = stato.lavoro ? numeriAzienda(stato.lavoro.aziendaId) : null;
      if (nz) {
        spinta = 0.5 + LAVORO.crescitaPerFormazione * (nz.formazione ?? 2);
        if ((nz.management ?? 5) >= LAVORO.managementBuono) spinta *= LAVORO.crescitaBuonCapo;
      }
    } else if (a.competenze) {
      insegna = Object.fromEntries(Object.entries(a.competenze).filter(([k]) => k !== 'campo' && k !== 'dal'));
    }
    for (const [id, gradini] of Object.entries(insegna ?? {})) {
      const casa = eHard(id) ? stato.hard : stato.soft;
      if (!(id in casa)) continue;
      casa[id] = cresci(casa[id], gradini * unita, { campo, scala: spinta });
      competenzeToccate.add(id);
    }
  }

  /* Il lavoro: la performance si muove verso quella che le competenze e le
     ore sostengono, e la cultura del posto logora. */
  let valutata = null;
  if (stato.lavoro) {
    const l = stato.lavoro;
    const az = numeriAzienda(l.aziendaId);
    const oreFatte = (piano.lavoro ?? 0) + (piano.straordinari ?? 0);
    const quotaOre = stretto(oreFatte / Math.max(1, az?.ore ?? LAVORO.oreBase), 0, 1.5);
    const insegna = aziendaById(l.aziendaId)?.insegna ?? {};
    /* la performance sostenuta: le competenze che il posto chiede contro
       la richiesta del livello — lo stagista bravo e' bravo da stagista */
    const adeguatezza = stretto(100 * mediaCompetenze(stato, Object.keys(insegna)) / Math.max(20, PROMOZIONE.richiesta[l.livello] + 10));
    const sostenuta = 100 * (LAVORO.pesoCompetenze * (adeguatezza / 100) + (1 - LAVORO.pesoCompetenze) * Math.min(1, quotaOre));
    l.performance += (sostenuta - l.performance) * LAVORO.velocitaPerformance;
    if (c.stress >= STRESS.crollo) {
      l.performance *= 1 - STRESS.perditaPerformance;
      perche.push({ cosa: 'performance', quanto: null, testo: 'Con lo stress oltre ottanta il lavoro ne risente da solo: sbagli, dimentichi, rallenti.' });
    }
    l.visibilita = stretto(l.visibilita - LAVORO.visibilitaSfiato + LAVORO.visibilitaDaPerformance * Math.max(0, l.performance - 60) / 10);
    l.anzianita += 1;
    /* quello che si matura a un livello resta scritto: e' l'esperienza
       che ci si porta dietro al prossimo posto */
    const esp = (stato.carriera.esperienza ??= {});
    esp[l.livello] = Math.max(esp[l.livello] ?? 0, l.anzianita);
    if (az && az.stress) applica(stato, 'stress', az.stress);
    if (az && az.cultura < STRESS.sogliaCultura) {
      c.stress += STRESS.perLavoroSenzaSenso;
      perche.push({ cosa: 'stress', quanto: +STRESS.perLavoroSenzaSenso, testo: 'Un ambiente che non ti rispetta logora anche se lavori bene.' });
    }
    /* il capo cattivo come numero dell'azienda, solo finche' non ha una
       faccia: quando c'e' la persona tossica, il danno lo fa lei */
    const tossicoQui = stato.persone.some((p) => p.archetipo === 'tossico' && !p.andato && !p.neutralizzato && p.aziendaId === l.aziendaId);
    if (az && (az.management ?? 5) <= LAVORO.managementCattivo && !tossicoQui) {
      c.stress += LAVORO.stressCattivoCapo;
      perche.push({ cosa: 'stress', quanto: +LAVORO.stressCattivoCapo, testo: 'Un capo che non sa fare il capo si paga ogni settimana.' });
    }
    /* da dentro si vede com'e' davvero */
    if (l.anzianita >= COLLOQUIO.scoperta && !stato.conosciute.includes(l.aziendaId)) {
      stato.conosciute.push(l.aziendaId);
      const dice = aziendaById(l.aziendaId)?.dice ?? {};
      if (Object.keys(dice).length) perche.push({ cosa: 'azienda', quanto: null, testo: `Dopo ${COLLOQUIO.scoperta} settimane dentro vedi ${aziendaById(l.aziendaId).nome} com’è davvero: guarda la scheda, e confronta con quello che dicevano al colloquio.` });
    }
  }

  /* 3a. L'etica: il sospetto si raffredda, l'integrita' si ripara, e il caso tira. */
  settimanaEtica(stato, piano, perche);

  /* 3b. Le persone: quello che fanno da sole. Prima della valutazione,
     perche' il capo tossico ha gia' fatto il suo danno quando si viene
     giudicati. */
  settimanaPersone(stato, piano, perche);
  if (stato.settimana % PROMOZIONE.ogniSettimane === 0) { trimestrePersone(stato, perche); trimestreImpresa(stato, perche); }

  /* ogni trimestre, chi ha un posto in azienda viene valutato */
  if (stato.lavoro && stato.settimana % PROMOZIONE.ogniSettimane === 0) {
    valutata = valutazione(stato);
    if (valutata) perche.push({ cosa: 'carriera', quanto: null, testo: valutata.testo });
    /* promosso a CEO: non e' ancora la cima, e' il consiglio che chiede */
    if (stato.lavoro?.livello >= LIVELLI.length - 1) {
      valutata = consiglio(stato);
      perche.push({ cosa: 'carriera', quanto: null, testo: valutata.testo });
    }
  }

  if (stato.lavoro) {
    const l = stato.lavoro;
    const az = numeriAzienda(l.aziendaId);
    /* La noia del posto: i suoi gradini, piu' quello che aggiunge restare
       a lungo allo stesso livello senza che cambi niente. */
    if (az && az.noia) {
      const oltre = Math.max(0, l.anzianita - NOIA.assuefazioneDa);
      const assuefazione = Math.min(NOIA.perAnzianitaMassimo, oltre * NOIA.perSettimanaOltre);
      const q = az.noia * PASSO.noia + assuefazione;
      c.noia += q;
      perche.push({ cosa: 'noia', quanto: +tondo(q), testo: oltre > 0 ? 'Le stesse cose, da troppo tempo: ti stai spegnendo.' : 'Un lavoro ripetitivo svuota un po’ ogni settimana.' });
    }
  }

  /* La noia oltre i segnali mangia la felicita'; oltre il crollo mangia
     anche la resa e alimenta lo stress: e' lo spegnersi. */
  if (c.noia >= NOIA.segnali) {
    c.felicita -= NOIA.perditaFelicita;
    perche.push({ cosa: 'felicita', quanto: -NOIA.perditaFelicita, testo: 'Ti annoi, e la giornata non ha più niente che aspetti.' });
  }
  if (c.noia >= NOIA.crollo) {
    if (stato.lavoro) stato.lavoro.performance *= 1 - NOIA.perditaPerformance;
    c.stress += NOIA.stressOltreCrollo;
    perche.push({ cosa: 'performance', quanto: null, testo: 'Con la noia oltre ottanta lavori con il pilota automatico: sbagli per disattenzione, e fai il minimo.' });
  }

  /* 4. La vita fa il suo. */
  const spintaFelicita = 1 + STRESS.spintaFelicita * (0.5 - c.felicita / 100) * 2;
  let stressCondizioni = 0;
  if (c.sonno > STRESS.sogliaSonno) {
    const q = (c.sonno - STRESS.sogliaSonno) * STRESS.perSonnoAlto;
    stressCondizioni += q;
    perche.push({ cosa: 'stress', quanto: +tondo(q), testo: 'Dormi male da un po’, e si sente.' });
  }
  if (v.soldi < 0) {
    stressCondizioni += STRESS.perSoldiSottoZero;
    perche.push({ cosa: 'stress', quanto: +STRESS.perSoldiSottoZero, testo: 'Essere in rosso è una tassa fissa sulla testa.' });
  }
  if (v.relazioni < STRESS.sogliaIsolamento) {
    stressCondizioni += STRESS.perIsolamento;
    perche.push({ cosa: 'stress', quanto: +STRESS.perIsolamento, testo: 'Non hai nessuno con cui parlarne, e ogni colpo ti arriva pieno.' });
  }
  c.stress += stressCondizioni * spintaFelicita;

  c.stress -= DERIVA.stressSfiato;
  c.noia -= NOIA.sfiato;
  c.sonno -= DERIVA.sonnoRecupero;
  c.salute += DERIVA.saluteEta;
  if (c.stress >= STRESS.segnali) {
    c.salute -= DERIVA.saluteSottoStress;
    perche.push({ cosa: 'salute', quanto: -DERIVA.saluteSottoStress, testo: 'Lo stress che non scarichi lo paga il corpo.' });
  } else {
    c.salute += (DERIVA.saluteRiposo - c.salute) * DERIVA.saluteVersoRiposo;
  }
  c.felicita += (DERIVA.felicitaRiposo - c.felicita) * DERIVA.felicitaVersoNeutro;
  if (!usate.has('relazioni')) v.relazioni -= DERIVA.relazioniSfiato;
  if (!usate.has('networking') && !usate.has('volontariato')) v.rete -= DERIVA.reteSfiato;

  for (const casa of [stato.hard, stato.soft]) {
    for (const id of Object.keys(casa)) if (!competenzeToccate.has(id)) casa[id] = arrugginisci(casa[id]);
  }

  /* 5. Le scadenze. */
  const s = stato.settimana;
  const scadute = scadenzeOfferte(stato);
  if (scadute) perche.push({ cosa: 'carriera', quanto: null, testo: scadute === 1 ? 'Un’offerta è scaduta senza risposta.' : `${scadute} offerte sono scadute senza risposta.` });
  scadenzeDifferite(stato, perche);
  stato.malusTempo = 0;
  let conti = null;
  if (s % PARTITA.settimanePerMese === 0) conti = fineMese(stato, perche);
  if (s % PARTITA.settimanePerTrimestre === 0) stato.trimestri += 1;
  if (s % PARTITA.settimanePerAnno === 0) stato.eta += 1;

  /* i bordi: tutto fra 0 e 100 tranne i soldi */
  for (const k of Object.keys(c)) c[k] = stretto(c[k]);
  for (const k of ['relazioni', 'rete', 'reputazione', 'integrita']) v[k] = stretto(v[k]);
  stato.nascosto.sospetto = stretto(stato.nascosto.sospetto);
  if (stato.lavoro) stato.lavoro.performance = stretto(stato.lavoro.performance);

  /* 6. E' finita? */
  stato.settimaneInRosso = v.soldi < FINE.crolloEconomico.soldi ? stato.settimaneInRosso + 1 : 0;
  controllaFine(stato, bg);

  /* 7. Gli eventi: da zero a due, e aspettano una risposta. */
  const eventiNati = pesca(stato);

  /* il diario */
  stato.storico.push(rigaStorico(stato));
  stato.log.push({ s, tipo: 'piano', piano: compatta(piano) });

  const dopo = fotografiaNumeri(stato);
  const riepilogo = {
    settimana: s,
    energia: { avuta: Math.round(energia), chiesta: Math.round(chiesta), sforo: Math.round(sforo) },
    cambiato: differenze(prima, dopo),
    perche,
    conti,
    segnali: segnaliDiStress(stato),
    valutazione: valutata,
    eventi: eventiNati.map((id) => schedaEvento(stato, stato.eventi.find((p) => p.id === id))).filter(Boolean),
    fine: stato.esito,
  };

  if (stato.fase !== 'finita') stato.settimana += 1;
  return riepilogo;
}

/* ─── I pezzi ─── */

function applica(stato, leva, gradini) {
  const passo = PASSO[leva];
  if (!passo) return;
  const delta = gradini * passo;
  if (leva in stato.corpo) stato.corpo[leva] += delta;
  else if (leva in stato.vita) stato.vita[leva] += delta;
  else if (leva === 'sospetto') stato.nascosto.sospetto += delta;
  else if (stato.lavoro && (leva === 'performance' || leva === 'visibilita')) stato.lavoro[leva] += delta;
}

function mediaCompetenze(stato, ids) {
  if (!ids.length) return 50;
  const v = ids.map((id) => stato.hard[id] ?? stato.soft[id] ?? 0);
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/**
 * Fine mese: entra lo stipendio, escono affitto, spese, rimesse e il
 * percorso. Il debito costa interessi. E' l'unico posto in cui i soldi
 * si muovono senza che il giocatore prema niente.
 */
function fineMese(stato, perche) {
  const n = NUMERI[stato.background];
  const v = stato.vita;
  const stipendio = stipendioDi(stato.lavoro);
  const concluso = stato.percorso && stato.titoli.includes(stato.percorso);
  const percorso = stato.percorso && stato.studiatoQuestoMese && !concluso ? PERCORSO[stato.percorso].costoMese : 0;
  const interessi = v.soldi < 0 ? Math.round(-v.soldi * SOLDI.interesseSettimanale * PARTITA.settimanePerMese) : 0;
  const uscite = n.affitto + n.spese + n.rimesse + percorso + interessi;
  v.soldi += stipendio - uscite;
  stato.studiatoQuestoMese = false;
  const conti = { stipendio, affitto: n.affitto, spese: n.spese, rimesse: n.rimesse, percorso, interessi, saldo: stipendio - uscite };
  perche.push({ cosa: 'soldi', quanto: conti.saldo, testo: `Fine mese: ${stipendio ? `entrano ${stipendio}` : 'nessuno stipendio'}, escono ${uscite}${interessi ? ` (di cui ${interessi} di interessi sul debito)` : ''}.` });
  return conti;
}

function controllaFine(stato, bg) {
  const c = stato.corpo;
  const v = stato.vita;
  if (stato.fase === 'finita') return;
  if (c.stress >= FINE.burnout.stress) { fine(stato, 'burnout'); return; }
  if (c.noia >= FINE.boreOut.noia) { fine(stato, 'bore_out'); return; }
  if (c.salute <= FINE.crolloFisico.salute) { fine(stato, 'crollo_fisico'); return; }
  if (stato.settimaneInRosso >= FINE.crolloEconomico.settimane) {
    /* la rete di sicurezza assorbe una parte del buco, una volta: e' la
       famiglia che paga. Chi non ce l'ha, affonda. */
    const n = NUMERI[bg.id];
    if (n.reteSicurezza > 0) {
      v.soldi += -v.soldi * n.reteSicurezza;
      stato.settimaneInRosso = 0;
      stato.log.push({ s: stato.settimana, tipo: 'salvataggio', quota: n.reteSicurezza });
      if (v.soldi >= FINE.crolloEconomico.soldi) return;
    }
    fine(stato, 'crollo_economico');
  }
  if (stato.fase !== 'finita' && stato.settimana >= PARTITA.settimaneMassime) fine(stato, 'tempo');
}

function fine(stato, causa) {
  stato.fase = 'finita';
  stato.esito = { causa, settimana: stato.settimana, livello: stato.lavoro?.livello ?? 0 };
}

/** I messaggi che si leggono quando lo stress sale: a sessanta i segnali, a ottanta il crollo. */
function segnaliDiStress(stato) {
  const s = stato.corpo.stress;
  const n = stato.corpo.noia;
  const segnali = [];
  if (s >= STRESS.crollo) segnali.push('Non ce la fai più a stare dietro alle cose. Le decisioni le prendi stanco.');
  else if (s >= STRESS.segnali) segnali.push('Dormi male da tre settimane.', 'Hai saltato di nuovo la cena con i tuoi.');
  if (n >= NOIA.crollo) segnali.push('Guardi l’orologio ogni dieci minuti. Non ricordi l’ultima volta che hai imparato qualcosa.');
  else if (n >= NOIA.segnali) segnali.push('Il lunedì pesa più del solito, e non sapresti dire perché.');
  return segnali;
}

/* ─── Il diario ─── */

/** Una riga compatta per settimana: numeri, non oggetti. Serve al grafico e all'analisi. */
function rigaStorico(stato) {
  const c = stato.corpo; const v = stato.vita;
  return [
    stato.settimana, Math.round(v.soldi),
    Math.round(c.salute), Math.round(c.sonno), Math.round(c.stress), Math.round(c.felicita), Math.round(c.noia),
    Math.round(v.relazioni), Math.round(v.rete), Math.round(v.reputazione), Math.round(v.integrita),
    stato.lavoro ? Math.round(stato.lavoro.performance) : -1,
    stato.lavoro ? stato.lavoro.livello : -1,
  ];
}
export const COLONNE_STORICO = ['settimana', 'soldi', 'salute', 'sonno', 'stress', 'felicita', 'noia', 'relazioni', 'rete', 'reputazione', 'integrita', 'performance', 'livello'];

/** Un piano senza gli zeri: il log ne tiene seicento. */
const compatta = (piano) => Object.fromEntries(Object.entries(piano).filter(([, t]) => t > 0));

function fotografiaNumeri(stato) {
  return {
    ...stato.corpo, ...stato.vita,
    performance: stato.lavoro?.performance ?? null,
    visibilita: stato.lavoro?.visibilita ?? null,
    hard: { ...stato.hard }, soft: { ...stato.soft },
  };
}

function differenze(prima, dopo) {
  const out = {};
  for (const k of Object.keys(dopo)) {
    if (k === 'hard' || k === 'soft') {
      for (const id of Object.keys(dopo[k])) {
        const d = tondo(dopo[k][id] - prima[k][id]);
        if (d) out[id] = d;
      }
    } else if (dopo[k] !== null && prima[k] !== null) {
      const d = tondo(dopo[k] - prima[k]);
      if (d) out[k] = d;
    }
  }
  return out;
}
