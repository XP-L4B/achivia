/**
 * La sera: si fanno i conti, succede qualcosa, e si scrive il rapporto.
 *
 * L'ordine non e' casuale. Prima tornano indietro le conseguenze differite
 * — quello che hai deciso giorni fa — perche' il rapporto deve poterle
 * **nominare**: «la produttivita' e' scesa perche' il banco tre si e' rotto
 * del tutto, e te l'avevano detto il giorno quattordici». Un gioco che
 * insegna qualcosa e' un gioco in cui la causa si puo' ricostruire; se il
 * rapporto dicesse solo «produttivita' -6» il giocatore imparerebbe che il
 * mondo e' arbitrario.
 *
 * Poi le due spirali fanno il loro giro, poi l'economia, poi il mondo
 * decide se ti succede qualcosa.
 */

import {
  ECONOMIA, rincaroDi, RITMO, INDULGENZA, RANCORE, RICAMBIO, EVENTI, SCONFITTA, PASSO, LIMITI,
} from '../contenuti/bilancio.js';
import { EVENTI_MONDO } from '../contenuti/eventi.js';
import { applicaGradini, arrotonda } from './leve.js';
import { dipendentiAttivi, costoDelPersonale } from './persone.js';

/* ─── L'economia ─── */

/** Il fatturato di oggi: teste, ritmo, reputazione, e quello che il mondo sta facendo. */
export function fatturatoDi(stato) {
  const a = stato.azienda;
  const teste = dipendentiAttivi(stato.persone).length;
  let resa = a.produttivita / 100;
  /* Sotto la soglia critica i clienti non aspettano: la caduta accelera. */
  if (a.produttivita < ECONOMIA.produttivitaCritica) {
    const quanto = (ECONOMIA.produttivitaCritica - a.produttivita) / ECONOMIA.produttivitaCritica;
    resa *= Math.max(0, 1 - quanto * ECONOMIA.cadutaSottoCritica);
  }
  /* Chi e' in rodaggio rende meno: e' il costo vero di aver perso qualcuno. */
  const rodaggio = dipendentiAttivi(stato.persone).filter((p) => p.rodaggio > 0).length;
  const perRodaggio = 1 - (rodaggio / Math.max(1, teste)) * (1 - RICAMBIO.resaRidotta);
  const perReputazione = 1 + ((a.reputazione - 50) / 50) * ECONOMIA.spintaReputazione;
  const perMondo = stato.eventiAttivi.reduce((m, e) => m * (e.ricavo ?? 1), 1);
  return Math.max(0, ECONOMIA.ricavoPerTesta * teste * resa * perRodaggio * perReputazione * perMondo);
}

export function costiDi(stato) {
  const perMondo = stato.eventiAttivi.reduce((m, e) => m * (e.costi ?? 1), 1);
  const rincaro = rincaroDi(stato.giorno);
  /* La struttura e' quello che le decisioni hanno fatto alla macchina:
     moltiplica tutto quanto, ogni sera, e non torna piu' indietro da sola. */
  return (costoDelPersonale(stato.persone) + ECONOMIA.costiFissi)
    * stato.azienda.struttura * perMondo * rincaro;
}

/* ─── Le conseguenze differite ─── */

/** Mette in agenda quello che tornera' indietro, e quando. */
export function programma(stato, effetto, causa, chi = null) {
  /* Fra il minimo e il massimo, estremi compresi. Prima era un `Math.round`
     su un numero fra tre e undici, che arrotondando finiva **all'undicesimo
     giorno** una volta ogni tanto: la finestra dichiarata e' tre-dieci, e
     una conseguenza fuori finestra e' una promessa non mantenuta al
     giocatore. L'ha trovato una prova, non un ragionamento. */
  const minimo = stato.differiteMinimo ?? 3;
  const massimo = stato.differiteMassimo ?? 10;
  const quando = stato.giorno + minimo + stato.caso.intero(massimo - minimo + 1);
  stato.differite.push({
    giorno: Math.min(quando, 999), effetto, causa, chi, deciso: stato.giorno,
  });
}

/** Quelle che scadono oggi: si applicano e finiscono nel rapporto, con la causa. */
function riscuotiDifferite(stato) {
  const oggi = stato.differite.filter((d) => d.giorno <= stato.giorno);
  stato.differite = stato.differite.filter((d) => d.giorno > stato.giorno);
  const righe = [];
  for (const d of oggi) {
    const cambiato = applicaGradini(stato.azienda, d.effetto);
    righe.push({ causa: d.causa, deciso: d.deciso, chi: d.chi, cambiato });
  }
  return righe;
}

/* ─── Le due spirali ─── */

/** L'indulgenza e il rancore sfiatano un po' ogni giorno: le offese meno. */
function sfiata(stato) {
  const a = stato.azienda;
  a.indulgenza = Math.max(0, a.indulgenza * (1 - INDULGENZA.sfiato));
  a.rancore = Math.max(0, a.rancore * (1 - RANCORE.sfiato));
}

/**
 * I guai del rancore. Ogni soglia superata apre un guaio nuovo e non chiude
 * i vecchi: si comincia col ritmo che cala e si finisce con la vertenza.
 */
function guaiDelRancore(stato) {
  const a = stato.azienda;
  const usciti = [];
  for (const g of RANCORE.gradini) {
    if (a.rancore < g.da) continue;
    if (!stato.caso.forse(g.probabilita)) continue;
    usciti.push(faiGuaio(stato, g.guaio));
  }
  return usciti.filter(Boolean);
}

function faiGuaio(stato, guaio) {
  const a = stato.azienda;
  if (guaio === 'ritmo') {
    applicaGradini(a, { produttivita: -1 });
    return { guaio, testo: 'Il ritmo è calato: si lavora, ma senza fretta.' };
  }
  if (guaio === 'bugie') {
    applicaGradini(a, { produttivita: -1, reputazione: -1 });
    return { guaio, testo: 'I rapporti di produzione non tornano con il magazzino.' };
  }
  if (guaio === 'furto') {
    applicaGradini(a, { cassa: -1, morale: -1 });
    return { guaio, testo: 'Manca della merce, e nessuno ha visto niente.' };
  }
  if (guaio === 'assenze') {
    applicaGradini(a, { produttivita: -2 });
    return { guaio, testo: 'Tre assenze in un giorno, tutte giustificate, tutte lo stesso giorno.' };
  }
  if (guaio === 'dimissioni') return dimissioni(stato);
  if (guaio === 'passaparola') {
    applicaGradini(a, { reputazione: -2 });
    return { guaio, testo: 'Alle taverne si dice che qui si sta male. Chi cerca lavoro lo sa.' };
  }
  if (guaio === 'vertenza') {
    applicaGradini(a, { cassa: -3, reputazione: -3, morale: -1 });
    return { guaio, testo: 'La Gilda ha aperto una vertenza. Ci sono spese, e ci sono i giornali.' };
  }
  return null;
}

/** Se ne va qualcuno: il piu' scontento, e costa ricerca, selezione e rodaggio. */
export function dimissioni(stato) {
  const gente = dipendentiAttivi(stato.persone);
  if (gente.length <= SCONFITTA.organicoMinimo) return null;
  const chi = gente.slice().sort((x, y) => (x.lealta + x.morale) - (y.lealta + y.morale))[0];
  chi.attivo = false;
  chi.uscitoIl = stato.giorno;
  const rincaro = 1 + ((50 - stato.azienda.reputazione) / 50) * RICAMBIO.rincaroPerReputazioneBassa;
  stato.azienda.cassa -= RICAMBIO.costo * Math.max(0.5, rincaro);
  applicaGradini(stato.azienda, { morale: -1, produttivita: -1 });
  stato.usciti.push({ id: chi.id, nome: chi.nome, giorno: stato.giorno });
  return { guaio: 'dimissioni', testo: `${chi.nome} (${chi.ruolo}) se n’è andato. Trovare un sostituto costa, e il sostituto renderà meno per un po’.`, chi: chi.id };
}

/* ─── Il mondo ─── */

function pescaEvento(stato) {
  const a = stato.azienda;
  const guai = (a.morale < 40 ? 1 : 0) + (a.produttivita < 45 ? 1 : 0) + (a.cassa < 3000 ? 1 : 0);
  const p = EVENTI.baseGiornaliera + stato.giorno * EVENTI.perGiorno + guai * EVENTI.spintaGuai;
  if (stato.eventiAttivi.length >= EVENTI.insieme) return null;
  if (!stato.caso.forse(p)) return null;
  const possibili = EVENTI_MONDO.filter((e) => stato.giorno >= (e.daGiorno || 0)
    && !stato.eventiAttivi.some((x) => x.id === e.id)
    && stato.giorno - (stato.eventiFatti[e.id] || -99) > EVENTI.riposo);
  if (!possibili.length) return null;
  const totale = possibili.reduce((s, e) => s + (e.peso || 1), 0);
  let r = stato.caso.numero() * totale;
  const scelto = possibili.find((e) => (r -= e.peso || 1) <= 0) || possibili[possibili.length - 1];
  const durata = Math.round(stato.caso.fra(scelto.durata[0], scelto.durata[1] + 1));
  const attivo = { ...scelto, finisce: stato.giorno + durata, cominciato: stato.giorno };
  stato.eventiAttivi.push(attivo);
  if (scelto.colpo) applicaGradini(stato.azienda, scelto.colpo);
  return attivo;
}

function scadeEventi(stato) {
  const finiti = stato.eventiAttivi.filter((e) => e.finisce <= stato.giorno);
  for (const e of finiti) stato.eventiFatti[e.id] = stato.giorno;
  stato.eventiAttivi = stato.eventiAttivi.filter((e) => e.finisce > stato.giorno);
  return finiti;
}

/* ─── La chiusura ─── */

/**
 * Chiude la giornata e torna il rapporto: che cosa e' cambiato, e perche'.
 * E' l'unico posto in cui la cassa si muove per conto suo.
 */
export function chiudi(stato) {
  const a = stato.azienda;
  /* Il confronto e' con stamattina: dentro `cambiato` finisce quello che ha
     fatto la giornata intera, decisioni comprese, non solo la chiusura. */
  const prima = stato.mattina || { ...a };

  const differite = riscuotiDifferite(stato);
  const guai = guaiDelRancore(stato);

  /* Il morale tira la produttivita' verso il livello che sostiene. E' il
     passaggio che rende vera la tesi del gioco: se la gente sta male, si
     produce meno, e si vede sul fatturato senza che nessuno lo dica. */
  const sostenuta = RITMO.base + a.morale * RITMO.perMorale;
  a.produttivita = Math.min(LIMITI.produttivita[1], Math.max(
    LIMITI.produttivita[0],
    a.produttivita + (sostenuta - a.produttivita) * RITMO.velocita,
  ));

  /* chi era in rodaggio ci sta un giorno di meno */
  for (const p of stato.persone) if (p.rodaggio > 0) p.rodaggio -= 1;

  /* quello che il mondo fa ogni giorno, finche' dura */
  for (const e of stato.eventiAttivi) if (e.ogniGiorno) applicaGradini(a, e.ogniGiorno);

  const fatturato = fatturatoDi(stato);
  const costi = costiDi(stato);
  a.fatturato = fatturato;
  a.costi = costi;
  a.cassa += fatturato - costi;

  sfiata(stato);
  const finiti = scadeEventi(stato);
  const nuovo = pescaEvento(stato);

  /* i conti che decidono la sconfitta */
  stato.giorniCassaNegativa = a.cassa < 0 ? stato.giorniCassaNegativa + 1 : 0;
  stato.giorniProduttivitaBassa = a.produttivita < SCONFITTA.produttivitaMinima
    ? stato.giorniProduttivitaBassa + 1 : 0;

  stato.storicoFatturato.push(Math.round(fatturato));
  stato.storicoProduttivita.push(arrotonda(a.produttivita));
  /* I due nascosti, sera per sera. Non entrano nel rapporto — quello lo
     legge chi gioca, e indulgenza e rancore non si mostrano mai — ma
     servono a sapere **quando** sono saliti, che e' la sola cosa che
     distingue chi ha sbagliato da chi e' semplicemente arrivato in fondo.
     Li usano i consigli di fine partita. */
  stato.storicoNascosto.push({ rancore: arrotonda(a.rancore), indulgenza: arrotonda(a.indulgenza) });

  return {
    giorno: stato.giorno,
    fatturato: Math.round(fatturato),
    costi: Math.round(costi),
    saldo: Math.round(fatturato - costi),
    cassa: Math.round(a.cassa),
    differite,
    guai,
    eventoNuovo: nuovo ? { id: nuovo.id, nome: nuovo.nome, racconto: nuovo.racconto, finisce: nuovo.finisce } : null,
    eventiFiniti: finiti.map((e) => ({ id: e.id, nome: e.nome })),
    cambiato: {
      produttivita: arrotonda(a.produttivita - prima.produttivita),
      morale: arrotonda(a.morale - prima.morale),
      reputazione: arrotonda(a.reputazione - prima.reputazione),
    },
    organico: dipendentiAttivi(stato.persone).length,
  };
}

/** Se una regola del mondo capovolge questo archetipo, adesso. */
export const capovolto = (stato, archetipoId) => stato.eventiAttivi.some(
  (e) => Array.isArray(e.capovolge) && e.capovolge.includes(archetipoId),
);

export { PASSO };
