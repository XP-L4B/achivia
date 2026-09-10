/**
 * La carriera: i colloqui e le promozioni.
 *
 * Due momenti in cui qualcuno decide di te. Al **colloquio** decide
 * un'azienda se farti entrare; alla **valutazione** — ogni trimestre —
 * decide se farti salire. Tutte e due guardano le stesse cose, pesate
 * diversamente: le competenze (pesate per fascia, che e' la regola che
 * regge il gioco), la performance, la visibilita', la reputazione, la
 * rete, l'anzianita'; dalla fascia media in su lo **sponsor**, e da
 * sempre un po' di **caso** — un posto che c'e' o non c'e'.
 *
 * Tutte e due producono un **perche'**: la lista delle voci con il valore,
 * la richiesta e se basta. Non e' un dettaglio: e' il requisito assoluto
 * del gioco. Chi non viene promosso deve leggere che cosa e' mancato, e
 * quando manca lo sponsor deve leggere che cosa e' uno sponsor.
 *
 * I numeri stanno in `bilancio.js` (`AZIENDA`, `COLLOQUIO`, `PROMOZIONE`).
 */

import {
  AZIENDA, SOPRAVVIVENZA, STIPENDIO_LIVELLO, ACHIVIA_RICHIEDE, COLLOQUIO, PROMOZIONE, PERCORSO, NOIA,
} from '../contenuti/bilancio.js';
import { AZIENDE, aziendaById } from '../contenuti/aziende.js';
import { HARD, SOFT, PESO_PER_LIVELLO } from '../contenuti/competenze.js';
import { LIVELLI, livelloN, SERVE_SPONSOR_DA } from '../contenuti/livelli.js';
import { nuovoLavoro } from './stato.js';
import { nasceIlCast, pesoDelPassato } from './persone.js';
import { ETICA } from '../contenuti/bilancio.js';

const stretto = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

/* ─── Che cosa si porta ─── */

/** I numeri di un'azienda, di sopravvivenza o vera. */
export const numeriAzienda = (id) => SOPRAVVIVENZA[id] ?? AZIENDA[id] ?? null;

/** Lo stipendio al mese di questo lavoro. */
export function stipendioDi(lavoro) {
  if (!lavoro) return 0;
  if (SOPRAVVIVENZA[lavoro.aziendaId]) return SOPRAVVIVENZA[lavoro.aziendaId].stipendio;
  const n = AZIENDA[lavoro.aziendaId];
  return n ? Math.round(STIPENDIO_LIVELLO[lavoro.livello] * n.paga) : 0;
}

/** La media della meta' migliore: premia chi si specializza, ma chiede un po' di larghezza. */
function mediaMetaMigliore(casa, ids) {
  const v = ids.map((id) => casa[id] ?? 0).sort((a, b) => b - a);
  const meta = v.slice(0, Math.ceil(v.length / 2));
  return meta.reduce((s, x) => s + x, 0) / Math.max(1, meta.length);
}

/**
 * Il punteggio delle competenze per una fascia: hard e soft pesate come
 * dice `PESO_PER_LIVELLO`. Torna anche le due parti, per il perche'.
 */
export function punteggioCompetenze(stato, fascia) {
  const peso = PESO_PER_LIVELLO[fascia] ?? PESO_PER_LIVELLO.basso;
  const hard = mediaMetaMigliore(stato.hard, HARD.map((c) => c.id));
  const soft = mediaMetaMigliore(stato.soft, SOFT.map((c) => c.id));
  return { totale: hard * peso.hard + soft * peso.soft, hard, soft, peso };
}

/** La credenziale piu' alta che si ha in mano: quella dei titoli presi. */
export function credenzialeDi(stato) {
  return Math.max(0, ...stato.titoli.map((p) => PERCORSO[p]?.credenziale ?? 0));
}

/* ─── La scheda: quello che il giocatore vede ─── */

/**
 * Com'e' un'azienda vista da fuori, o da dentro. Da fuori vale quello che
 * dice di se' (`dice`); da dentro — dopo `COLLOQUIO.scoperta` settimane —
 * la verita', con accanto quello che diceva.
 */
export function schedaAzienda(stato, aziendaId) {
  const az = aziendaById(aziendaId);
  const n = numeriAzienda(aziendaId);
  if (!az || !n) return null;
  const conosciuta = stato.conosciute.includes(aziendaId);
  const dice = az.dice ?? {};
  const attributi = {};
  for (const k of ['prestigio', 'cultura', 'management', 'formazione', 'equilibrio', 'stabilita']) {
    if (n[k] === undefined) continue;
    attributi[k] = { valore: conosciuta || dice[k] === undefined ? n[k] : dice[k], diceva: conosciuta && dice[k] !== undefined ? dice[k] : null };
  }
  return {
    id: az.id, nome: az.nome, tipo: az.tipo, racconto: az.racconto, insegna: az.insegna,
    ore: n.ore, conosciuta, attributi,
    stipendio: az.tipo === 'sopravvivenza' ? n.stipendio : null,
    entrata: n.entrata ?? [0, 0], tetto: n.tetto ?? 0,
  };
}

/* ─── I colloqui ─── */

/**
 * A che livello un'azienda parlerebbe con questa persona, e a che
 * condizioni. Non e' un tiro: e' la lista delle porte, con scritto quale
 * e' aperta e quale no e perche'. Il giocatore la vede prima di bussare.
 */
export function porteDi(stato) {
  const s = stato.settimana;
  return AZIENDE.filter((a) => a.tipo !== 'sopravvivenza').map((az) => {
    const n = AZIENDA[az.id];
    const attuale = stato.lavoro?.aziendaId === az.id;
    const [dal, al] = n.entrata;
    /* il livello a cui si entra: quello che si ha, mai sotto quello che
       l'azienda apre. Un gradino in piu' solo se nel ruolo di adesso si e'
       stati abbastanza da averlo dimostrato e le competenze ci arrivano
       senza sconto: cambiare azienda accelera, non salta. Se no la scala
       si farebbe a colloqui, un gradino ogni offerta. */
    const vero = stato.lavoro && !SOPRAVVIVENZA[stato.lavoro.aziendaId];
    const base = Math.max(dal, vero ? stato.lavoro.livello : 0);
    let livello = Math.min(al, base);
    const su = base + 1;
    if (su <= al && vero && stato.lavoro.anzianita >= PROMOZIONE.anzianita[su] / 2
      && punteggioCompetenze(stato, livelloN(su).fascia).totale >= PROMOZIONE.richiesta[su]) {
      livello = su;
    }
    const fascia = livelloN(livello).fascia;
    const competenze = punteggioCompetenze(stato, fascia);
    const credenziale = credenzialeDi(stato);
    const aggirato = stato.vita.rete >= COLLOQUIO.reteAggiraTitolo || stato.portfolio >= COLLOQUIO.portfolioAggiraTitolo;
    const rifiutoIl = stato.rifiuti[az.id];
    const carte = [
      { id: 'competenze', nome: 'Competenze per il livello', valore: Math.round(competenze.totale), richiesto: PROMOZIONE.richiesta[livello] - COLLOQUIO.tolleranza, ok: competenze.totale >= PROMOZIONE.richiesta[livello] - COLLOQUIO.tolleranza },
      { id: 'titolo', nome: 'Il filtro del curriculum', valore: credenziale >= n.titolo ? 'passa' : aggirato ? 'aggirato' : 'non passa', richiesto: n.titolo >= 1 ? 'laurea' : n.titolo > 0 ? 'un titolo tecnico' : 'nessuno', ok: credenziale >= n.titolo || aggirato },
      { id: 'reputazione', nome: 'Reputazione', valore: Math.round(stato.vita.reputazione), richiesto: PROMOZIONE.reputazione[fascia], ok: stato.vita.reputazione >= PROMOZIONE.reputazione[fascia] },
      { id: 'rete', nome: 'Rete', valore: Math.round(stato.vita.rete), richiesto: Math.round(n.prestigio * 4), ok: stato.vita.rete >= n.prestigio * 4 },
    ];
    /* dalla fascia media in su nessuno ti assume sulla parola: serve
       qualcuno che faccia il tuo nome — e' la stessa regola delle
       promozioni, se no la si aggirerebbe cambiando azienda */
    if (livello >= SERVE_SPONSOR_DA) {
      carte.push({ id: 'sponsor', nome: 'Qualcuno che faccia il tuo nome', valore: stato.sponsor ? 'sì' : 'nessuno', richiesto: 'sì', ok: Boolean(stato.sponsor) });
    }
    if (az.id === 'achivia') {
      carte.push(
        { id: 'reputazione_achivia', nome: 'Reputazione per ACHIVIA', valore: Math.round(stato.vita.reputazione), richiesto: ACHIVIA_RICHIEDE.reputazione, ok: stato.vita.reputazione >= ACHIVIA_RICHIEDE.reputazione },
        { id: 'rete_achivia', nome: 'Rete per ACHIVIA', valore: Math.round(stato.vita.rete), richiesto: ACHIVIA_RICHIEDE.rete, ok: stato.vita.rete >= ACHIVIA_RICHIEDE.rete },
        { id: 'soft_achivia', nome: 'Competenze trasversali', valore: Math.round(competenze.soft), richiesto: ACHIVIA_RICHIEDE.soft, ok: competenze.soft >= ACHIVIA_RICHIEDE.soft },
        { id: 'macchia_achivia', nome: 'Nessuno scandalo alle spalle', valore: stato.macchia ? 'ce n’è uno' : 'nessuno', richiesto: 'nessuno', ok: !stato.macchia },
        { id: 'integrita_achivia', nome: 'Integrità', valore: Math.round(stato.vita.integrita), richiesto: ETICA.integritaPerAchivia, ok: stato.vita.integrita >= ETICA.integritaPerAchivia },
      );
    }
    /* chi ci lavora e si ricorda di te */
    const passato = pesoDelPassato(stato, az.id);
    if (passato.scene.length) {
      carte.push({ id: 'passato', nome: 'Chi ti ricorda, lì dentro', valore: passato.delta > 0 ? 'bene' : 'male', richiesto: null, ok: passato.delta > 0, dettaglio: passato.scene.join(' ') });
    }
    const sponsorManca = carte.some((c) => c.id === 'sponsor' && !c.ok);
    /* la macchia di uno scandalo: chi ti cerca la trova */
    if (stato.macchia) carte.push({ id: 'macchia', nome: 'Lo scandalo', valore: stato.macchia.fino === null ? 'per sempre' : `ancora ${Math.max(0, stato.macchia.fino - s)} settimane`, richiesto: null, ok: false });
    const achiviaManca = az.id === 'achivia' && (!carte.filter((c) => c.id.endsWith('_achivia')).every((c) => c.ok) || stato.vita.integrita < ETICA.integritaPerAchivia);
    const chiusa = attuale ? 'ci lavori già'
      : rifiutoIl !== undefined && s - rifiutoIl < COLLOQUIO.memoriaRifiuto ? `ti hanno detto di no ${s - rifiutoIl} settimane fa: si riprova fra ${COLLOQUIO.memoriaRifiuto - (s - rifiutoIl)}`
      : !carte[1].ok ? 'il curriculum non passa il filtro'
      : sponsorManca ? `a ${livelloN(livello).nome} non si entra senza qualcuno che faccia il tuo nome`
      : achiviaManca ? 'non ancora'
      : null;
    return {
      aziendaId: az.id, nome: az.nome, livello, livelloNome: livelloN(livello).nome,
      stipendio: Math.round(STIPENDIO_LIVELLO[livello] * n.paga), ore: n.ore,
      carte, chiusa, probabilita: chiusa ? 0 : probabilitaColloquio(carte, n, passato.delta),
      scene: passato.scene,
    };
  });
}

function probabilitaColloquio(carte, n, passato = 0) {
  const inRegola = carte.filter((c) => c.ok && c.id !== 'passato' && c.id !== 'macchia').length;
  const macchia = carte.some((c) => c.id === 'macchia') ? 0.5 : 1;
  return stretto((COLLOQUIO.base + COLLOQUIO.perCarta * inRegola - (n.difficile ?? 0) + passato) * macchia, 0.03, 0.95, 0);
}

/**
 * Bussare: costa ricerca, e il caso decide. Torna l'esito con il perche';
 * se e' andata bene, l'offerta aspetta fra `stato.offerte`. E' una
 * decisione: sta nel log, e il replay la rifa' con lo stesso tiro.
 */
export function faiColloquio(stato, aziendaId) {
  if (stato.fase === 'finita') return { ok: false, errore: 'La partita è finita.' };
  const porta = porteDi(stato).find((p) => p.aziendaId === aziendaId);
  if (!porta) return { ok: false, errore: `Azienda sconosciuta: ${aziendaId}.` };
  if (porta.chiusa) return { ok: false, errore: `Porta chiusa: ${porta.chiusa}.` };
  if (stato.ricerca < COLLOQUIO.costo) return { ok: false, errore: `Per un colloquio servono ${COLLOQUIO.costo} unità di ricerca: ne hai ${Math.floor(stato.ricerca)}. Cerca lavoro qualche settimana.` };
  if (stato.offerte.some((o) => o.aziendaId === aziendaId)) return { ok: false, errore: 'Hai già un’offerta da loro: rispondi a quella.' };
  stato.ricerca -= COLLOQUIO.costo;
  const tiro = stato.caso.numero();
  const preso = tiro < porta.probabilita;
  stato.log.push({ s: stato.settimana, tipo: 'colloquio', azienda: aziendaId });
  const esito = {
    aziendaId, nome: porta.nome, livello: porta.livello, livelloNome: porta.livelloNome, preso,
    carte: porta.carte, probabilita: porta.probabilita, scene: porta.scene,
    testo: preso
      ? `${porta.nome} ti fa un’offerta: ${porta.livelloNome}, ${porta.stipendio} € al mese, ${porta.ore} punti di tempo a settimana.`
      : `${porta.nome} ha detto di no. Avevi ${Math.round(porta.probabilita * 100)} probabilità su cento: ${porta.carte.filter((c) => !c.ok).length ? 'guarda le carte che mancavano' : 'era tutto in regola, e non è bastato — succede'}.`,
  };
  if (preso) {
    stato.offerte.push({ aziendaId, livello: porta.livello, stipendio: porta.stipendio, ore: porta.ore, scade: stato.settimana + COLLOQUIO.scadenzaOfferta });
  } else {
    stato.rifiuti[aziendaId] = stato.settimana;
  }
  stato.colloqui.push({ s: stato.settimana, ...esito });
  if (stato.colloqui.length > 12) stato.colloqui.shift();
  return { ok: true, ...esito };
}

/** Accettare un'offerta: si cambia lavoro. Una decisione, nel log. */
export function accettaOfferta(stato, aziendaId) {
  if (stato.fase === 'finita') return { ok: false, errore: 'La partita è finita.' };
  const i = stato.offerte.findIndex((o) => o.aziendaId === aziendaId);
  if (i < 0) return { ok: false, errore: 'Non hai un’offerta da loro.' };
  const o = stato.offerte[i];
  stato.offerte.splice(i, 1);
  stato.lavoro = nuovoLavoro(o.aziendaId, o.livello);
  /* l'esperienza viaggia: a un livello gia' fatto non si riparte da zero */
  const esp = stato.carriera.esperienza ?? {};
  stato.lavoro.anzianita = Math.floor((esp[o.livello] ?? 0) * PROMOZIONE.esperienzaPortata);
  stato.corpo.noia *= NOIA.cambioLavoro;
  stato.valutazioniBasse = 0;
  segnaCarriera(stato);
  stato.log.push({ s: stato.settimana, tipo: 'lavoro', azienda: o.aziendaId, livello: o.livello });
  /* le persone che si trovano li' dentro: il capo, un collega, HR, il dirigente */
  const cast = nasceIlCast(stato, o.aziendaId);
  return { ok: true, lavoro: { ...stato.lavoro }, persone: cast.map((p) => p.nome) };
}

/** Lasciarla cadere. Anche questa e' una decisione. */
export function rifiutaOfferta(stato, aziendaId) {
  const i = stato.offerte.findIndex((o) => o.aziendaId === aziendaId);
  if (i < 0) return { ok: false, errore: 'Non hai un’offerta da loro.' };
  stato.offerte.splice(i, 1);
  stato.log.push({ s: stato.settimana, tipo: 'rifiuto_offerta', azienda: aziendaId });
  return { ok: true };
}

/** Le offerte scadono da sole. Lo chiama la settimana. */
export function scadenzeOfferte(stato) {
  const prima = stato.offerte.length;
  stato.offerte = stato.offerte.filter((o) => o.scade > stato.settimana);
  return prima - stato.offerte.length;
}

/* ─── Le valutazioni ─── */

/**
 * La valutazione trimestrale, per chi ha un posto in azienda. Guarda ogni
 * carta, dice quale basta e quale no, e se bastano tutte tira il caso dei
 * posti. Torna il perche' e, se e' andata, promuove. Lo chiama la
 * settimana; non e' una decisione e non sta nel log — si rigioca da se'.
 */
export function valutazione(stato) {
  const l = stato.lavoro;
  if (!l || SOPRAVVIVENZA[l.aziendaId]) return null;
  const n = AZIENDA[l.aziendaId];
  const az = aziendaById(l.aziendaId);
  const s = stato.settimana;

  /* il posto si perde: due valutazioni sotto il minimo, o una riorganizzazione */
  if (l.performance < PROMOZIONE.performanceLicenziamento) {
    stato.valutazioniBasse += 1;
    if (stato.valutazioniBasse >= 2) {
      stato.lavoro = null;
      const v = { s, tipo: 'licenziamento', aziendaId: az.id, testo: `${az.nome} ti ha lasciato a casa: due valutazioni di fila con la performance sotto ${PROMOZIONE.performanceLicenziamento}.` };
      ricorda(stato, v);
      return v;
    }
  } else {
    stato.valutazioniBasse = 0;
  }
  const pRiorg = (10 - n.stabilita) * PROMOZIONE.riorganizzazione;
  if (stato.caso.numero() < pRiorg) {
    stato.lavoro = null;
    const v = { s, tipo: 'riorganizzazione', aziendaId: az.id, testo: `Riorganizzazione a ${az.nome}: il tuo posto non c’è più. Non c’entra come lavoravi — c’entra dove lavoravi (stabilità ${n.stabilita} su dieci).` };
    ricorda(stato, v);
    return v;
  }

  const a = l.livello + 1;
  if (a > n.tetto) {
    const v = { s, tipo: 'tetto', aziendaId: az.id, livelloA: a, promosso: false, carte: [], testo: `A ${az.nome} più in alto di ${livelloN(l.livello).nome} non si va: è un’azienda piccola per la tua strada. Per salire ancora bisogna cambiare posto.` };
    ricorda(stato, v);
    return v;
  }
  if (a >= LIVELLI.length) return null;
  const fascia = livelloN(a).fascia;
  const comp = punteggioCompetenze(stato, fascia);
  const carte = [
    { id: 'performance', nome: 'Performance', valore: Math.round(l.performance), richiesto: PROMOZIONE.performanceMinima, ok: l.performance >= PROMOZIONE.performanceMinima },
    { id: 'competenze', nome: `Competenze pesate (${Math.round(comp.peso.hard * 100)}% tecniche, ${Math.round(comp.peso.soft * 100)}% trasversali)`, valore: Math.round(comp.totale), richiesto: PROMOZIONE.richiesta[a], ok: comp.totale >= PROMOZIONE.richiesta[a], dettaglio: `tecniche ${Math.round(comp.hard)}, trasversali ${Math.round(comp.soft)}` },
    { id: 'visibilita', nome: 'Visibilità', valore: Math.round(l.visibilita), richiesto: PROMOZIONE.visibilita[a], ok: l.visibilita >= PROMOZIONE.visibilita[a] },
    { id: 'anzianita', nome: 'Anzianità nel ruolo', valore: l.anzianita, richiesto: PROMOZIONE.anzianita[a], ok: l.anzianita >= PROMOZIONE.anzianita[a] },
    { id: 'reputazione', nome: 'Reputazione', valore: Math.round(stato.vita.reputazione), richiesto: PROMOZIONE.reputazione[fascia], ok: stato.vita.reputazione >= PROMOZIONE.reputazione[fascia] },
  ];
  if (PROMOZIONE.sogliaLeadership[fascia] !== undefined) {
    carte.push({ id: 'leadership', nome: 'Leadership', valore: Math.round(stato.soft.leadership), richiesto: PROMOZIONE.sogliaLeadership[fascia], ok: stato.soft.leadership >= PROMOZIONE.sogliaLeadership[fascia] });
  }
  if (PROMOZIONE.sogliaPolitica[fascia] !== undefined) {
    carte.push({ id: 'politica', nome: 'Intelligenza politica', valore: Math.round(stato.soft.intelligenza_politica), richiesto: PROMOZIONE.sogliaPolitica[fascia], ok: stato.soft.intelligenza_politica >= PROMOZIONE.sogliaPolitica[fascia] });
  }
  if (a >= SERVE_SPONSOR_DA) {
    carte.push({ id: 'sponsor', nome: 'Sponsor', valore: stato.sponsor ? 'sì' : 'nessuno', richiesto: 'sì', ok: Boolean(stato.sponsor) });
  }
  if (stato.macchia && a >= 5) {
    carte.push({ id: 'macchia', nome: 'Nessuno scandalo alle spalle', valore: 'ce n’è uno', richiesto: 'nessuno', ok: false });
  }

  const tutte = carte.every((c) => c.ok);
  /* un rivale in meno — per una voce sparsa, per uno licenziato — apre il
     posto: e' il vantaggio veloce delle scorciatoie, e si consuma qui */
  const pPosti = stretto((n.posti * (1 + (n.management - 5) * PROMOZIONE.perManagement) + (stato.spintaPosti ?? 0)) * (PROMOZIONE.postiInCima[a] ?? 1), 0.02, 0.95, 0);
  stato.spintaPosti = 0;
  /* il tiro si fa comunque, cosi' il caso consuma lo stesso numero di
     passi qualunque sia l'esito: il replay non deve dipendere da questo */
  const tiro = stato.caso.numero();
  const posto = tiro < pPosti;
  const promosso = tutte && posto;
  const mancano = carte.filter((c) => !c.ok);

  let testo;
  if (promosso) testo = `Promosso a ${livelloN(a).nome}.`;
  else if (!tutte) testo = `Non promosso a ${livelloN(a).nome}: ${mancano.map((c) => c.nome.toLowerCase()).join(', ')}.`;
  else testo = `Non promosso a ${livelloN(a).nome}: avevi tutte le carte in regola, ma non c’era un posto (a ${az.nome} se ne apre uno ogni ${Math.round(1 / pPosti)} trimestri, in media). Ricapita.`;

  const lezione = mancano.find((c) => c.id === 'sponsor') && mancano.length === 1
    ? 'Nella vita reale succede spessissimo. Alle promozioni non decide chi lavora meglio, ma chi viene ritenuto pronto da chi ha potere di decidere. Uno sponsor è chi fa il tuo nome nelle stanze dove tu non sei: da qui in su, senza, non si sale — per quanto tu sia bravo. Farsi vedere e avere qualcuno che ti sostiene non è «leccare i piedi»: è una parte del lavoro che nessuno ti insegna.'
    : mancano.find((c) => c.id === 'competenze') && comp.hard > comp.soft + 20
      ? 'Le competenze tecniche ci sono, e non bastano più: da questa fascia in su contano di più quelle trasversali — stare con le persone, guidarle, capire le dinamiche. Non si allenano con i corsi: crescono con le persone, i progetti in squadra, il volontariato, i fallimenti superati.'
      : mancano.find((c) => c.id === 'visibilita') && carte.find((c) => c.id === 'performance')?.ok
        ? 'Performance alta e visibilità bassa è la combinazione più comune di chi non viene promosso: lavori benissimo e nessuno ai piani alti sa che esisti. Straordinari visibili, networking, progetti che si vedono.'
        : null;

  const v = { s, tipo: 'valutazione', aziendaId: az.id, livelloA: a, promosso, carte, caso: { posti: Math.round(pPosti * 100), aperto: posto }, testo, lezione };
  if (promosso) {
    l.livello = a;
    segnaCarriera(stato);
    l.anzianita = 0;
    l.visibilita = stretto(l.visibilita * 0.5);
    stato.corpo.noia *= NOIA.promozione;
    stato.corpo.felicita = stretto(stato.corpo.felicita + 5);
    stato.vita.reputazione = stretto(stato.vita.reputazione + 2);
  }
  ricorda(stato, v);
  return v;
}

function segnaCarriera(stato) {
  const c = stato.carriera;
  const l = stato.lavoro;
  if (!l) return;
  c.livelloMassimo = Math.max(c.livelloMassimo, l.livello);
  if (!SOPRAVVIVENZA[l.aziendaId]) {
    if (c.primoLavoroVero === null) c.primoLavoroVero = stato.settimana;
    if (!c.aziende.includes(l.aziendaId)) c.aziende.push(l.aziendaId);
  }
}

function ricorda(stato, v) {
  stato.valutazioni.push(v);
  if (stato.valutazioni.length > 12) stato.valutazioni.shift();
}
