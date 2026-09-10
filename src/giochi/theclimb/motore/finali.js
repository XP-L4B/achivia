/**
 * Come finisce: i finali che non sono sconfitte, il consiglio di
 * amministrazione, e l'epilogo che spiega.
 *
 * Fermarsi e mollare sono decisioni: nel log, con una riga sola. Il
 * consiglio arriva quando si e' promossi a CEO: chiede oltre alle carte
 * della promozione — integrita', reputazione, competenze trasversali,
 * niente macchie — e fa domande basate su come si e' giocato davvero: le
 * scorrettezze, le persone fregate, i licenziamenti. Se dice di no, si
 * resta C-Level e si riprova al trimestre dopo.
 *
 * L'epilogo e' quello che si legge alla fine, qualunque fine: le cause
 * strutturali di un burnout (non e' colpa tua, ed ecco perche'), le
 * decisioni che hanno pesato di piu' — calcolate dal log e dallo storico,
 * non scelte a mano — e la linea della carriera.
 */

import { FINALI, ETICA } from '../contenuti/bilancio.js';
import { livelloN } from '../contenuti/livelli.js';
import { aziendaById } from '../contenuti/aziende.js';
import { eventoById } from '../contenuti/eventi/indice.js';
import { scorrettezzaById } from '../contenuti/scorrettezze.js';
import { AZIONI } from '../contenuti/persone.js';
import { punteggioCompetenze } from './carriera.js';
import { numeriAzienda } from './carriera.js';

/* ─── Le decisioni di chiudere ─── */

export function puoFermarsi(stato) {
  if (stato.fase === 'finita') return { ok: false, perche: 'è già finita' };
  if (stato.settimana < FINALI.fermarsiDaSettimana) return { ok: false, perche: `si può dopo ${FINALI.fermarsiDaSettimana / 52} anni` };
  if ((stato.lavoro?.livello ?? 0) < FINALI.fermarsiDaLivello) return { ok: false, perche: `serve un posto in azienda almeno da ${livelloN(FINALI.fermarsiDaLivello).nome}` };
  return { ok: true, perche: null };
}
export function puoMollare(stato) {
  if (stato.fase === 'finita') return { ok: false, perche: 'è già finita' };
  if (stato.settimana < FINALI.mollareDaSettimana) return { ok: false, perche: 'si può dopo il primo anno' };
  return { ok: true, perche: null };
}

/** Fermarsi dove si e', con una buona vita. */
export function fermati(stato) {
  const p = puoFermarsi(stato);
  if (!p.ok) return { ok: false, errore: `Adesso no: ${p.perche}.` };
  stato.log.push({ s: stato.settimana, tipo: 'fermato' });
  chiudi(stato, 'fermato');
  return { ok: true };
}

/** Mollare tutto e fare altro. */
export function molla(stato) {
  const p = puoMollare(stato);
  if (!p.ok) return { ok: false, errore: `Adesso no: ${p.perche}.` };
  stato.log.push({ s: stato.settimana, tipo: 'mollato' });
  chiudi(stato, 'mollato');
  return { ok: true };
}

export function chiudi(stato, causa) {
  stato.fase = 'finita';
  stato.esito = { causa, settimana: stato.settimana, livello: stato.lavoro?.livello ?? 0 };
}

/* ─── L'impresa ─── */

/**
 * Ogni trimestre un'impresa in piedi puo' chiudere: e' il rischio alto
 * del brief, e dipende dal capitale — chi ha soldi in cassa regge un
 * trimestre storto, chi non ne ha affonda. Il tiro si fa sempre, cosi' il
 * caso consuma lo stesso passo con o senza impresa.
 */
export function trimestreImpresa(stato, perche) {
  const tiro = stato.caso.numero();
  if (!stato.impresa) return null;
  const decine = Math.max(0, Math.floor(stato.vita.soldi / 10000));
  const p = Math.max(FINALI.impresaChiudeMinimo, FINALI.impresaChiudeBase - FINALI.impresaPerDiecimila * decine);
  if (tiro >= p) return null;
  stato.impresa = null;
  stato.vita.soldi += FINALI.impresaChiudeSoldi;
  perche.push({ cosa: 'carriera', quanto: null, testo: `La tua impresa ha chiuso: un trimestre storto, e non c’era abbastanza in cassa per reggerlo (${Math.round(p * 100)} probabilità su cento, con quello che avevi).` });
  return { chiusa: true, p };
}

/** ACHIVIA guarda un'impresa solo dopo che ha retto abbastanza. */
export const impresaRetta = (stato) => Boolean(stato.impresa) && stato.settimana - stato.impresa.da >= FINALI.impresaRettaDa;

/* ─── Il consiglio di amministrazione ─── */

/**
 * Promosso a CEO: il consiglio chiede. Le carte, e le domande che
 * vengono da come si e' giocato. Torna la valutazione da mettere nel
 * riepilogo; se passa, la partita finisce — in cima, piena o vuota.
 */
export function consiglio(stato) {
  const c = stato.corpo; const v = stato.vita;
  const comp = punteggioCompetenze(stato, 'altissimo');
  const carte = [
    { id: 'integrita', nome: 'Integrità', valore: Math.round(v.integrita), richiesto: ETICA.integritaPerAchivia, ok: v.integrita >= ETICA.integritaPerAchivia },
    { id: 'macchia', nome: 'Nessuno scandalo alle spalle', valore: stato.macchia ? 'ce n’è uno' : 'nessuno', richiesto: 'nessuno', ok: !stato.macchia },
    { id: 'reputazione', nome: 'Reputazione', valore: Math.round(v.reputazione), richiesto: FINALI.consiglioReputazione, ok: v.reputazione >= FINALI.consiglioReputazione },
    { id: 'soft', nome: 'Competenze trasversali', valore: Math.round(comp.soft), richiesto: FINALI.consiglioSoft, ok: comp.soft >= FINALI.consiglioSoft },
    { id: 'sponsor', nome: 'Sponsor ai massimi livelli', valore: stato.sponsor ? 'sì' : 'nessuno', richiesto: 'sì', ok: Boolean(stato.sponsor) },
  ];
  const domande = domandeDalLog(stato);
  const passa = carte.every((x) => x.ok);
  const vuota = passa && (v.relazioni < FINALI.vuotaRelazioni || c.salute < FINALI.vuotaSalute || c.felicita < FINALI.vuotaFelicita);
  const testo = passa
    ? (vuota ? 'Il consiglio ha detto sì. Sei CEO di ACHIVIA SPA. Guardati intorno.' : 'Il consiglio ha detto sì. Sei CEO di ACHIVIA SPA.')
    : `Il consiglio ha detto no: ${carte.filter((x) => !x.ok).map((x) => x.nome.toLowerCase()).join(', ')}. Resti C-Level; si riprova al prossimo trimestre.`;
  const lezione = !passa && carte.find((x) => x.id === 'integrita' && !x.ok)
    ? 'Avevi tutto il resto. È il modo peggiore di scoprirlo: sotto trenta di integrità ACHIVIA non ti fa CEO, per quanto tu sia bravo. C’è una strada per ripararla — lunga, e costa.'
    : null;
  const val = { s: stato.settimana, tipo: 'consiglio', aziendaId: 'achivia', livelloA: 10, promosso: passa, carte, domande, testo, lezione };
  stato.valutazioni.push(val);
  if (stato.valutazioni.length > 12) stato.valutazioni.shift();
  if (passa) chiudi(stato, vuota ? 'cima_vuota' : 'cima');
  else if (stato.lavoro) stato.lavoro.livello = 9;
  return val;
}

/** Le domande del consiglio: vengono dal log, non da un elenco. */
export function domandeDalLog(stato) {
  const d = [];
  const sc = stato.log.filter((r) => r.tipo === 'scorrettezza' && r.quale !== 'confessa');
  if (sc.length) d.push({ domanda: `Risultano ${sc.length} episodi in cui ha tagliato gli angoli: ${[...new Set(sc.map((r) => scorrettazzaNome(r.quale)))].slice(0, 3).join(', ')}. Ce ne parla?`, peso: sc.length });
  const torti = stato.persone.filter((p) => p.memoria.some((m) => m.cosa === 'torto'));
  if (torti.length) d.push({ domanda: `${torti.map((p) => p.nome).slice(0, 2).join(' e ')} ${torti.length === 1 ? 'racconta' : 'raccontano'} una storia diversa dalla sua su chi ha fatto che cosa. Chi ha ragione?`, peso: torti.length });
  const spremi = stato.log.filter((r) => r.tipo === 'scorrettezza' && (r.quale === 'spremi' || r.quale === 'licenzia_per_proteggerti')).length;
  if (spremi) d.push({ domanda: 'Le persone che hanno lavorato sotto di lei: che cosa direbbero, se fossero qui?', peso: spremi });
  const aiuti = stato.persone.filter((p) => p.memoria.some((m) => m.cosa === 'aiuto')).length;
  if (aiuti) d.push({ domanda: `${aiuti} ${aiuti === 1 ? 'persona ha' : 'persone hanno'} scritto per lei senza che glielo chiedesse. Come si costruisce una cosa così?`, peso: 0 });
  if (stato.esplosioni.length) d.push({ domanda: 'Ci risulta uno scandalo. Che cosa ha imparato?', peso: 2 });
  if (stato.contaScorrettezze.riparazioni) d.push({ domanda: 'Ha ammesso un errore prima che venisse scoperto. Perché?', peso: 0 });
  if (!d.length) d.push({ domanda: 'Dodici anni senza un’ombra. Che cosa ha rinunciato a fare?', peso: 0 });
  return d;
}
const scorrettazzaNome = (id) => scorrettezzaById(id)?.nome.toLowerCase() ?? id;

/* ─── L'epilogo ─── */

/**
 * Le cause strutturali di un burnout (o di un crollo): quello che
 * nell'ambiente lo ha costruito. Si leggono dallo storico e dal log, non
 * si inventano. Per la schermata finale che non colpevolizza.
 */
export function causeStrutturali(stato) {
  const cause = [];
  const settimane = stato.storico.length || 1;
  const inRosso = stato.storico.filter((r) => r[1] < 0).length;
  if (inRosso >= 8) cause.push(`${inRosso} settimane in rosso: quando i soldi non ci sono, rallentare non è una scelta che esiste.`);
  const sonnoAlto = stato.storico.filter((r) => r[3] >= 40).length;
  if (sonnoAlto >= 8) cause.push(`${sonnoAlto} settimane con il sonno arretrato sopra quaranta: il corpo non ha mai recuperato.`);
  const posti = stato.log.filter((r) => r.tipo === 'lavoro').map((r) => r.azienda);
  const logoranti = [...new Set(posti)].map((id) => ({ id, n: numeriAzienda(id) })).filter((x) => x.n && (x.n.cultura <= 4 || x.n.ore >= 50));
  for (const x of logoranti) cause.push(`${aziendaById(x.id)?.nome}: ${x.n.cultura <= 4 ? `una cultura da ${x.n.cultura} su dieci` : ''}${x.n.cultura <= 4 && x.n.ore >= 50 ? ' e ' : ''}${x.n.ore >= 50 ? `${x.n.ore} punti di tempo a settimana` : ''}. Un posto così logora chiunque.`);
  const tossici = stato.persone.filter((p) => p.archetipo === 'tossico');
  for (const p of tossici) cause.push(`${p.nome}, un capo tossico${p.neutralizzato ? ', finché è durato' : ''}: stress ogni settimana, meriti presi, visibilità tolta.`);
  const isolato = stato.storico.filter((r) => r[7] < 30).length;
  if (isolato >= 12) cause.push(`${isolato} settimane con le relazioni sotto trenta: nessuno con cui parlarne, e ogni colpo arrivava pieno.`);
  const bg = stato.background;
  if (bg === 'nessuna' || bg === 'operaia') cause.push(`Da dove partivi (${bg === 'nessuna' ? 'nessuna rete' : 'famiglia operaia'}) la scelta di rallentare spesso non c’era: meno tempo, meno soldi, nessuno che coprisse un mese storto. Il burnout è più probabile per costruzione, ed è voluto che sia così.`);
  if (!cause.length) cause.push(`In ${settimane} settimane non c’è una causa sola che spicchi: è stata la somma, che è il modo più comune in cui succede.`);
  return cause;
}

/**
 * Le decisioni che hanno pesato di piu': per ogni decisione nel log si
 * guarda com'era la vita nelle otto settimane prima e nelle otto dopo,
 * e si tengono quelle con lo scarto piu' grande. Non e' un giudizio: e'
 * dove la curva ha cambiato pendenza.
 */
export function decisioniChePesano(stato, quante = FINALI.decisioni) {
  const st = stato.storico;
  if (st.length < 4) return [];
  const indice = (r) => (r[1] / 1000) - r[4] + r[5] + r[7] * 0.5 + (r[12] >= 0 ? r[12] * 12 : 0) - r[6] * 0.5;
  const media = (da, a) => { const righe = st.slice(Math.max(0, da), Math.max(0, a)); return righe.length ? righe.reduce((s, r) => s + indice(r), 0) / righe.length : null; };
  const f = FINALI.finestra;
  const candidate = [];
  for (const r of stato.log) {
    if (r.tipo === 'piano' || r.tipo === 'routine') continue;
    const i = r.s - 1;
    const prima = media(i - f, i);
    const dopo = media(i + 1, i + 1 + f);
    if (prima === null || dopo === null) continue;
    candidate.push({ s: r.s, delta: dopo - prima, testo: descriviDecisione(stato, r) });
  }
  candidate.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const scelte = [];
  const viste = new Set();
  for (const c of candidate) {
    if (viste.has(c.s)) continue;
    viste.add(c.s);
    scelte.push({ s: c.s, verso: c.delta >= 0 ? 'meglio' : 'peggio', quanto: Math.round(Math.abs(c.delta)), testo: c.testo });
    if (scelte.length === quante) break;
  }
  return scelte.sort((a, b) => a.s - b.s);
}

function descriviDecisione(stato, r) {
  switch (r.tipo) {
    case 'percorso': return `hai scelto la strada «${r.percorso}»`;
    case 'lavoro': return `sei entrato a ${aziendaById(r.azienda)?.nome ?? r.azienda}${r.livello !== undefined ? ` come ${livelloN(r.livello).nome}` : ''}`;
    case 'dimissioni': return `hai lasciato ${aziendaById(r.azienda)?.nome ?? r.azienda}`;
    case 'colloquio': return `hai fatto un colloquio da ${aziendaById(r.azienda)?.nome ?? r.azienda}`;
    case 'rifiuto_offerta': return `hai lasciato cadere l’offerta di ${aziendaById(r.azienda)?.nome ?? r.azienda}`;
    case 'evento': { const ev = eventoById(r.evento); const o = ev?.opzioni.find((x) => x.id === r.opzione); return `«${ev?.titolo ?? r.evento}»: ${o?.testo?.toLowerCase() ?? r.opzione}`; }
    case 'persona': { const p = stato.persone.find((x) => x.id === r.persona); return `con ${p?.nome ?? 'qualcuno'}: ${AZIONI[r.azione]?.nome?.toLowerCase() ?? r.azione}`; }
    case 'scorrettezza': return scorrettezzaById(r.quale)?.nome.toLowerCase() ?? (r.quale === 'confessa' ? 'hai ammesso quello che avevi fatto' : r.quale);
    case 'titolo': return `hai finito «${r.percorso}»`;
    case 'salvataggio': return 'la famiglia ha coperto il debito';
    default: return r.tipo;
  }
}

/** La linea della carriera: dove si e' stati, e da che livello a che livello. */
export function lineaCarriera(stato) {
  const tappe = [];
  for (const r of stato.log) {
    if (r.tipo === 'lavoro') tappe.push({ s: r.s, testo: `${aziendaById(r.azienda)?.nome ?? r.azienda}${r.livello !== undefined ? ` · ${livelloN(r.livello).nome}` : ''}` });
  }
  for (const v of stato.valutazioni) {
    if (v.tipo === 'valutazione' && v.promosso) tappe.push({ s: v.s, testo: `promosso a ${livelloN(v.livelloA).nome}` });
    if (v.tipo === 'licenziamento' || v.tipo === 'riorganizzazione') tappe.push({ s: v.s, testo: `a casa da ${aziendaById(v.aziendaId)?.nome ?? ''}` });
  }
  return tappe.sort((a, b) => a.s - b.s);
}

/** Tutto quello che si legge alla fine. */
export function epilogo(stato) {
  const causa = stato.esito?.causa ?? null;
  return {
    causa,
    cause: causa === 'burnout' || causa === 'crollo_fisico' || causa === 'bore_out' ? causeStrutturali(stato) : [],
    decisioni: decisioniChePesano(stato),
    carriera: lineaCarriera(stato),
    consiglio: stato.valutazioni.filter((v) => v.tipo === 'consiglio').at(-1) ?? null,
    esplosioni: [...stato.esplosioni],
    scorrettezze: stato.contaScorrettezze.fatte,
    livelloMassimo: stato.carriera.livelloMassimo,
    vuota: causa === 'cima_vuota',
  };
}

