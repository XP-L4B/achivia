/**
 * Gli eventi: da zero a due a settimana, dal seme.
 *
 * La banca sta in `contenuti/eventi/` ed e' fatta di schede: condizioni,
 * testo, due o quattro opzioni con gli effetti. Qui c'e' come si leggono
 * — che cosa vuol dire ogni parola del vocabolario — e come si pesca.
 *
 * Il pescaggio consuma passi del caso, quindi due partite con lo stesso
 * seme e le stesse decisioni vedono gli stessi eventi; la risposta e' una
 * decisione e sta nel log. Un evento pescato **aspetta**: la settimana
 * dopo non si gioca finche' non si e' risposto (o finche' non risponde
 * la routine, con l'opzione predefinita — e' quello che fa «avanza», ed
 * e' quello che fa il replay quando la scelta non c'e').
 *
 * Le porte chiuse: un evento con moltiplicatore zero per questa vita e
 * `porta: true` scatta lo stesso, grigio, con scritto perche' — il
 * giocatore deve vedere la porta che per lui non c'e'.
 */

import { EVENTI, eventoById, CHIAVI_QUANDO } from '../contenuti/eventi/indice.js';
import { EVENTI as NUMERI, PASSO, AZIENDA, SOPRAVVIVENZA, PERCORSO } from '../contenuti/bilancio.js';
import { livelloN } from '../contenuti/livelli.js';
import { aziendaById } from '../contenuti/aziende.js';
import { cresci } from './competenze.js';
import { aggiungiPersona, sponsorDi } from './persone.js';
import { impresaRetta } from './finali.js';

const stretto = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

/* ─── Il vocabolario delle condizioni ─── */

const vero = (stato) => stato.lavoro && !SOPRAVVIVENZA[stato.lavoro.aziendaId];
const azienda = (stato) => (stato.lavoro ? (SOPRAVVIVENZA[stato.lavoro.aziendaId] ?? AZIENDA[stato.lavoro.aziendaId]) : null);
const personaAccanto = (stato, arch) => stato.persone.some((p) => p.archetipo === arch && !p.andato && !p.neutralizzato && (p.aziendaId === null || (stato.lavoro && p.aziendaId === stato.lavoro.aziendaId)));

const CONDIZIONI = {
  lavoro: (s, v) => (v === true ? Boolean(s.lavoro) : v === false ? !s.lavoro : v === 'vero' ? Boolean(vero(s)) : Boolean(s.lavoro && SOPRAVVIVENZA[s.lavoro.aziendaId])),
  livelloMin: (s, v) => (s.lavoro?.livello ?? 0) >= v,
  livelloMax: (s, v) => (s.lavoro?.livello ?? 0) <= v,
  settimanaMin: (s, v) => s.settimana >= v,
  settimanaMax: (s, v) => s.settimana <= v,
  etaMin: (s, v) => s.eta >= v,
  etaMax: (s, v) => s.eta <= v,
  soldiMin: (s, v) => s.vita.soldi >= v,
  soldiMax: (s, v) => s.vita.soldi <= v,
  stressMin: (s, v) => s.corpo.stress >= v,
  stressMax: (s, v) => s.corpo.stress <= v,
  saluteMax: (s, v) => s.corpo.salute <= v,
  saluteMin: (s, v) => s.corpo.salute >= v,
  sonnoMin: (s, v) => s.corpo.sonno >= v,
  noiaMin: (s, v) => s.corpo.noia >= v,
  felicitaMax: (s, v) => s.corpo.felicita <= v,
  felicitaMin: (s, v) => s.corpo.felicita >= v,
  relazioniMin: (s, v) => s.vita.relazioni >= v,
  relazioniMax: (s, v) => s.vita.relazioni <= v,
  reteMin: (s, v) => s.vita.rete >= v,
  reteMax: (s, v) => s.vita.rete <= v,
  reputazioneMin: (s, v) => s.vita.reputazione >= v,
  integritaMax: (s, v) => s.vita.integrita <= v,
  integritaMin: (s, v) => s.vita.integrita >= v,
  performanceMin: (s, v) => (s.lavoro?.performance ?? 0) >= v,
  performanceMax: (s, v) => (s.lavoro?.performance ?? 0) <= v,
  visibilitaMin: (s, v) => (s.lavoro?.visibilita ?? 0) >= v,
  percorso: (s, v) => v.includes(s.percorso),
  background: (s, v) => v.includes(s.background),
  nonBackground: (s, v) => !v.includes(s.background),
  sponsor: (s, v) => Boolean(s.sponsor) === v,
  titolo: (s, v) => (s.titoli.length > 0) === v,
  capo: (s, v) => (v === 'qualsiasi' ? Boolean(vero(s)) : personaAccanto(s, v)),
  alleato: (s, v) => stato_alleato(s) === v,
  mentore: (s, v) => s.persone.some((p) => p.archetipo === 'mentore' && !p.andato) === v,
  offerte: (s, v) => (s.offerte.length > 0) === v,
  studia: (s, v) => Boolean(s.percorso && PERCORSO[s.percorso]?.durata && !s.titoli.includes(s.percorso)) === v,
  portfolioMin: (s, v) => s.portfolio >= v,
  aziendaTipo: (s, v) => (v === 'vera' ? Boolean(vero(s)) : Boolean(s.lavoro && SOPRAVVIVENZA[s.lavoro.aziendaId])),
  stabilitaMax: (s, v) => (azienda(s)?.stabilita ?? 99) <= v,
  culturaMax: (s, v) => (azienda(s)?.cultura ?? 99) <= v,
  inRosso: (s, v) => (s.vita.soldi < 0) === v,
  impresa: (s, v) => impresaRetta(s) === v,
  macchia: (s, v) => Boolean(s.macchia) === v,
};
const stato_alleato = (s) => s.persone.some((p) => p.archetipo === 'alleato' && !p.andato && p.fiducia >= 40);

/** Tutte le condizioni valgono? Una chiave sconosciuta e' falsa: il validatore la ferma prima. */
export function condizioneVale(stato, quando) {
  for (const [k, v] of Object.entries(quando ?? {})) {
    const f = CONDIZIONI[k];
    if (!f || !CHIAVI_QUANDO.has(k)) return false;
    if (!f(stato, v)) return false;
  }
  return true;
}

/**
 * Il peso di un evento per questa vita: zero e' la porta chiusa. Le
 * occasioni pesano anche quello che si e' fatto delle precedenti: chi le
 * lascia cadere viene chiamato di meno, chi si lancia di piu'. Essere
 * troppo prudenti blocca la crescita, e il gioco lo fa con i numeri.
 */
export function pesoDi(stato, ev) {
  let peso = ev.peso * (ev.background[stato.background] ?? 1);
  if (ev.categoria === 'opportunita' && peso > 0) {
    const o = stato.occasioni ?? { prese: 0, lasciate: 0 };
    const lasciate = Math.min(NUMERI.occasioniLasciateMassime, Math.max(0, o.lasciate - o.prese));
    const prese = Math.min(NUMERI.saltiMassimi, o.prese);
    peso *= (1 - NUMERI.perOccasioneLasciata * lasciate) * (1 + NUMERI.perSaltoFatto * prese);
  }
  return peso;
}

/** Quanto le occasioni chiamano adesso, rispetto al normale: per il cruscotto. */
export function richiamoOccasioni(stato) {
  const o = stato.occasioni ?? { prese: 0, lasciate: 0 };
  const lasciate = Math.min(NUMERI.occasioniLasciateMassime, Math.max(0, o.lasciate - o.prese));
  const prese = Math.min(NUMERI.saltiMassimi, o.prese);
  return (1 - NUMERI.perOccasioneLasciata * lasciate) * (1 + NUMERI.perSaltoFatto * prese);
}

/* ─── Il pescaggio ─── */

function candidati(stato) {
  const s = stato.settimana;
  return EVENTI.filter((ev) => {
    if (stato.eventi.some((p) => p.id === ev.id)) return false;
    const visto = stato.eventiVisti[ev.id];
    if (visto !== undefined && (ev.unaVolta || s - visto < NUMERI.ripetiDopo)) return false;
    if (!condizioneVale(stato, ev.quando)) return false;
    const peso = pesoDi(stato, ev);
    return peso > 0 || ev.porta;
  });
}

function pescaUno(stato, lista) {
  const pesi = lista.map((ev) => { const p = pesoDi(stato, ev); return p > 0 ? p : NUMERI.pesoPortaChiusa; });
  const totale = pesi.reduce((a, b) => a + b, 0);
  let x = stato.caso.numero() * totale;
  for (let i = 0; i < lista.length; i += 1) { x -= pesi[i]; if (x <= 0) return lista[i]; }
  return lista[lista.length - 1];
}

/** Da zero a due eventi per questa settimana. Scrive in `stato.eventi`. */
export function pesca(stato) {
  const nati = [];
  if (stato.fase === 'finita' || stato.senzaEventi || stato.settimana < NUMERI.respiro) return nati;
  let lista = candidati(stato);
  for (const p of [NUMERI.probabilitaPrimo, NUMERI.probabilitaSecondo]) {
    /* il tiro si fa sempre, cosi' il caso consuma gli stessi passi
       qualunque sia la lista: il replay non deve dipendere dai candidati */
    const tira = stato.caso.numero() < p;
    if (!tira || !lista.length) continue;
    const ev = pescaUno(stato, lista);
    const chiusa = pesoDi(stato, ev) <= 0;
    stato.eventi.push({ id: ev.id, s: stato.settimana, chiusa });
    nati.push(ev.id);
    lista = lista.filter((x) => x.id !== ev.id && x.categoria !== ev.categoria);
  }
  return nati;
}

/* ─── Quello che il giocatore vede ─── */

function opzioneDisponibile(stato, opz) {
  if (!opz.richiede) return { disponibile: true, perche: null };
  const ok = condizioneVale(stato, opz.richiede);
  return { disponibile: ok, perche: ok ? null : perchéManca(opz.richiede) };
}

const PERCHE = {
  soldiMin: (v) => `servono almeno ${v.toLocaleString('it-IT')} €`,
  relazioniMin: (v) => `servono relazioni almeno a ${v}`,
  sponsor: () => 'serve uno sponsor',
  nonBackground: () => 'per chi parte da qui questa porta non c’è',
  reteMin: (v) => `serve una rete almeno a ${v}`,
};
const perchéManca = (richiede) => Object.entries(richiede).map(([k, v]) => (PERCHE[k] ? PERCHE[k](v) : `serve ${k}`)).join(', ');

/** La scheda di un evento in attesa, con le opzioni valutate adesso. */
export function schedaEvento(stato, pendente) {
  const ev = eventoById(pendente.id);
  if (!ev) return null;
  const opzioni = pendente.chiusa
    ? [{ id: 'chiusa', testo: 'Per chi parte da qui questa porta non c’è.', disponibile: true, perche: null, effetti: {} }]
    : ev.opzioni.map((opz) => ({ ...opz, ...opzioneDisponibile(stato, opz) }));
  return {
    id: ev.id, categoria: ev.categoria, titolo: ev.titolo, testo: ev.testo, lezione: ev.lezione,
    chiusa: pendente.chiusa, s: pendente.s,
    opzioni,
    predefinita: pendente.chiusa ? 'chiusa' : ev.predefinita,
    salto: ev.salto,
  };
}

/* ─── Rispondere ─── */

/**
 * Applica gli effetti di un'opzione, o di una conseguenza in ritardo.
 * Torna le righe del perche'.
 */
export function applicaEffetti(stato, effetti, perche = [], origine = '') {
  const c = stato.corpo; const v = stato.vita; const l = stato.lavoro;
  for (const [k, val] of Object.entries(effetti ?? {})) {
    if (k in c) { c[k] = stretto(c[k] + val * PASSO[k]); continue; }
    if (k === 'soldi') { v.soldi += val; continue; }
    if (k === 'relazioni' || k === 'rete' || k === 'reputazione' || k === 'integrita') { v[k] = stretto(v[k] + val * PASSO[k]); continue; }
    if (k === 'sospetto') { stato.nascosto.sospetto = stretto(stato.nascosto.sospetto + val * PASSO.sospetto); continue; }
    if ((k === 'performance' || k === 'visibilita') && l) { l[k] = stretto(l[k] + val * PASSO[k]); continue; }
    if (k === 'ricerca') { stato.ricerca += val; continue; }
    if (k === 'portfolio') { stato.portfolio += val; continue; }
    if (k === 'tempo') { stato.malusTempo -= val; continue; }
    if (k === 'lavoro' && val === 'perdi' && stato.lavoro) {
      perche.push({ cosa: 'carriera', quanto: null, testo: `${origine ? `${origine}: ` : ''}hai perso il posto a ${aziendaById(stato.lavoro.aziendaId)?.nome}.` });
      stato.lavoro = null;
      continue;
    }
    if (k === 'offerta') {
      const n = AZIENDA[val];
      if (n && stato.lavoro?.aziendaId !== val && !stato.offerte.some((o) => o.aziendaId === val)) {
        const livello = Math.min(n.entrata[1], Math.max(n.entrata[0], stato.lavoro?.livello ?? 0));
        stato.offerte.push({ aziendaId: val, livello, stipendio: Math.round(n.paga * [1100, 1500, 2100, 2700, 3400, 4300, 5600, 7500, 10000, 14000, 22000][livello]), ore: n.ore, scade: stato.settimana + 4 });
        perche.push({ cosa: 'carriera', quanto: null, testo: `${aziendaById(val)?.nome} ti fa un’offerta: ${livelloN(livello).nome}. Aspetta quattro settimane.` });
      }
      continue;
    }
    if (k === 'persona') { const p = aggiungiPersona(stato, val.archetipo, { fiducia: val.fiducia ?? 40, potere: val.potere ?? (stato.lavoro?.livello ?? 0) }); if (p) perche.push({ cosa: 'persone', quanto: null, testo: `Hai conosciuto ${p.nome}.` }); continue; }
    if (k === 'competenze') {
      for (const [id, g] of Object.entries(val)) {
        const casa = id in stato.hard ? stato.hard : id in stato.soft ? stato.soft : null;
        if (casa) casa[id] = g > 0 ? cresci(casa[id], g, { campo: true, scala: 1 }) : stretto(casa[id] + g * PASSO.competenza);
      }
      continue;
    }
    if (k === 'sponsorFiducia') {
      const sp = sponsorDi(stato) || stato.persone.filter((p) => p.archetipo === 'sponsor' && !p.andato).sort((a, b) => b.fiducia - a.fiducia)[0];
      if (sp) sp.fiducia = stretto(sp.fiducia + val);
      continue;
    }
    if (k === 'titolo') { if (!stato.titoli.includes(val)) stato.titoli.push(val); continue; }
    if (k === 'ritardo') { stato.differite.push({ s: stato.settimana + val.settimane, effetti: val.effetti, testo: val.testo }); continue; }
    if (k === 'impresa') { stato.impresa = { da: stato.settimana }; continue; }
    if (k === 'posti') { stato.spintaPosti = (stato.spintaPosti ?? 0) + val; continue; }
    if (k === 'fine') { stato.fase = 'finita'; stato.esito = { causa: val, settimana: stato.settimana, livello: stato.lavoro?.livello ?? 0 }; continue; }
  }
  return perche;
}

/** Le conseguenze in ritardo che scadono questa settimana. */
export function scadenzeDifferite(stato, perche) {
  const adesso = stato.differite.filter((d) => d.s <= stato.settimana);
  stato.differite = stato.differite.filter((d) => d.s > stato.settimana);
  for (const d of adesso) {
    perche.push({ cosa: 'evento', quanto: null, testo: d.testo });
    applicaEffetti(stato, d.effetti, perche, d.testo);
  }
  return adesso.length;
}

/** Rispondere. E' una decisione: nel log. */
export function rispondiEvento(stato, eventoId, opzioneId) {
  if (stato.fase === 'finita') return { ok: false, errore: 'La partita è finita.' };
  const i = stato.eventi.findIndex((p) => p.id === eventoId);
  if (i < 0) return { ok: false, errore: 'Questo evento non ti aspetta.' };
  const scheda = schedaEvento(stato, stato.eventi[i]);
  const opz = scheda.opzioni.find((x) => x.id === opzioneId);
  if (!opz) return { ok: false, errore: 'Opzione sconosciuta.' };
  if (!opz.disponibile) return { ok: false, errore: `Adesso no: ${opz.perche}.` };
  stato.eventi.splice(i, 1);
  stato.eventiVisti[eventoId] = stato.settimana;
  stato.log.push({ s: stato.settimana, tipo: 'evento', evento: eventoId, opzione: opzioneId });
  /* il conto delle occasioni: un salto preso, o un'occasione lasciata cadere */
  const ev = eventoById(eventoId);
  if (ev.categoria === 'opportunita' && ev.salto && !scheda.chiusa) {
    if (opz.audace) stato.occasioni.prese += 1; else stato.occasioni.lasciate += 1;
  }
  const perche = applicaEffetti(stato, opz.effetti, [], scheda.titolo);
  return { ok: true, evento: eventoId, opzione: opzioneId, titolo: scheda.titolo, lezione: opz.lezione ?? scheda.lezione ?? null, perche };
}

/** Rispondere con la predefinita a tutto quello che aspetta: e' la routine. */
export function rispondiConLaRoutine(stato) {
  const risposte = [];
  while (stato.eventi.length) {
    const scheda = schedaEvento(stato, stato.eventi[0]);
    const pred = scheda.opzioni.find((x) => x.id === scheda.predefinita && x.disponibile) || scheda.opzioni.find((x) => x.disponibile);
    const r = rispondiEvento(stato, scheda.id, pred.id);
    risposte.push(r);
  }
  return risposte;
}
