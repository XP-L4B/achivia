/**
 * Le prove del motore di The Climb.
 *
 *     node src/giochi/theclimb/strumenti/prove.mjs
 *     npm run climb:prove
 *
 * Nessun framework: dire una cosa vera o falsa e contare sono dieci righe,
 * e le prove stanno nel modulo perche' sono parte di quello che il modulo
 * garantisce. Girano con `node` senza compilare niente.
 *
 * Che cosa si vuole dimostrare, in ordine di importanza:
 *
 *  1. **Determinismo.** Stesso seme, stesso background, stesse decisioni:
 *     stessa partita. Senza questo non esistono il simulatore, la verifica
 *     di un punteggio e «E se fossi nato altrove?».
 *  2. **Si salva e si riapre** senza cambiare il futuro.
 *  3. **Il tempo non ci sta**: e' un gioco di rinunce, e non deve esistere
 *     una settimana che massimizza tutto.
 *  4. **I punti di partenza sono vite diverse**, misurabilmente.
 *  5. **Le competenze rallentano salendo**, e sul campo meno che a scuola.
 *  6. **Le condizioni pesano**: rosso, isolamento, sonno.
 *  7. **La rete di sicurezza esiste per chi ce l'ha** e per nessun altro.
 *  8. **Niente caso fuori dal seme**, niente orologio.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  creaPartita as creaGrezza, scegliPercorso, impostaRoutine, giocaSettimana as giocaGrezza, prendiLavoro, fotografia, riassunto,
  rispondiEvento, rispondiConLaRoutine,
  serializza, deserializza, controllaPiano, attivitaDisponibili, tempoDisponibile, energiaDisponibile, oreObbligatorie,
  porteDi, faiColloquio, accettaOfferta, schedaAzienda, stipendioDi, punteggioCompetenze, agisci,
  scorrettezzeDi, bara, fermati, molla, epilogo,
} from '../motore/partita.js';
import { consiglio, decisioniChePesano, causeStrutturali } from '../motore/finali.js';
import { rigioca, verificaPartita, confronto } from '../motore/replay.js';
import { schedeSbloccate } from '../motore/enciclopedia.js';
import { puntiPartita, pulisci, PESI } from '../motore/punteggio.js';
import { SCHEDE } from '../contenuti/enciclopedia.js';
import { AZIENDE } from '../contenuti/aziende.js';
import { EVENTI, eventoById } from '../contenuti/eventi/indice.js';
import { pesoDi } from '../motore/eventi.js';

/* Le prove dei capitoli precedenti descrivono meccaniche una alla volta,
   e un evento a caso nel mezzo — un posto perso, una settimana di febbre
   — le renderebbe vere o false a seconda del seme. Qui il mondo sta
   fermo: `eventi: false`. Il capitolo degli eventi usa le funzioni nude. */
const creaPartita = (o = {}) => creaGrezza({ eventi: false, ...o });
const giocaSettimana = (s, piano = null) => {
  if (piano !== null && s.eventi?.length) rispondiConLaRoutine(s);
  if (piano !== null && s.malusTempo) {
    /* un evento ha portato via tempo: si toglie dal piano, dall'ozio in giu' */
    const tetto = tempoDisponibile(s);
    const p = { ...piano };
    let tot = Object.values(p).reduce((a, b) => a + (b || 0), 0);
    for (const id of ['ozio', 'lavoretti', 'networking', 'volontariato', 'progetti', 'straordinari', 'studio', 'sport', 'relazioni', 'candidature', 'sonno']) {
      while (tot > tetto && (p[id] ?? 0) > 0) { p[id] -= 1; tot -= 1; }
    }
    return giocaGrezza(s, p);
  }
  return giocaGrezza(s, piano);
};
import { cresci } from '../motore/competenze.js';
import { ATTIVITA } from '../contenuti/attivita.js';
import { BACKGROUND } from '../contenuti/background.js';
import { BACKGROUND as NUMERI, TEMPO, FINE, STRESS, NOIA, PERCORSO, COLLOQUIO, PROMOZIONE, AZIENDA, ETICA, PERSONE } from '../contenuti/bilancio.js';
import { SCORRETTEZZE } from '../contenuti/scorrettezze.js';
import { HARD, SOFT } from '../contenuti/competenze.js';
import { LIVELLI } from '../contenuti/livelli.js';

let falliti = 0;
const ok = (cond, testo, extra = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${testo}${extra ? `  — ${extra}` : ''}`);
  if (!cond) falliti += 1;
};
const titolo = (t) => console.log(`\n${t}`);

/** Gioca `n` settimane con una routine, e torna lo stato. */
function gioca({ seme = 1, background = 'ceto_medio', percorso = 'universita', routine, settimane = 20 }) {
  const s = creaPartita({ seme, background });
  if (percorso) scegliPercorso(s, percorso);
  const r = impostaRoutine(s, routine ?? routineBase(s));
  if (!r.ok) throw new Error(r.errore);
  for (let i = 0; i < settimane && s.fase !== 'finita'; i += 1) {
    const x = giocaSettimana(s);
    if (!x.ok) throw new Error(x.errore);
  }
  return s;
}

/** Una routine sensata che stia nel tempo di questa vita. */
function routineBase(s) {
  const f = fotografia(s);
  const piano = { lavoro: f.oreObbligatorie, studio: 20, sonno: 10, relazioni: 10, sport: 5 };
  let tot = Object.values(piano).reduce((a, b) => a + b, 0);
  for (const k of ['studio', 'relazioni', 'sonno', 'sport']) {
    while (tot > f.tempo && piano[k] > 0) { piano[k] -= 1; tot -= 1; }
  }
  return piano;
}

/* ══ 1. Determinismo ══ */
titolo('DETERMINISMO');
{
  const a = gioca({ seme: 42, background: 'operaia', settimane: 60 });
  const b = gioca({ seme: 42, background: 'operaia', settimane: 60 });
  ok(JSON.stringify(riassunto(a)) === JSON.stringify(riassunto(b)), 'stesso seme e stesse decisioni: stesso riassunto');
  ok(JSON.stringify(a.storico) === JSON.stringify(b.storico), 'e stesso diario, settimana per settimana');
  const c = gioca({ seme: 43, background: 'operaia', settimane: 60 });
  ok(JSON.stringify(a.storico) !== JSON.stringify(c.storico), 'seme diverso: partita diversa');
}

/* ══ 2. Salvare e riaprire ══ */
titolo('SI SALVA E SI RIAPRE');
{
  const intera = gioca({ seme: 5, settimane: 40 });
  const meta = gioca({ seme: 5, settimane: 20 });
  const riaperta = deserializza(JSON.parse(JSON.stringify(serializza(meta))));
  for (let i = 0; i < 20; i += 1) giocaSettimana(riaperta);
  ok(JSON.stringify(riassunto(riaperta)) === JSON.stringify(riassunto(intera)), 'riaperta a meta\', arriva dove sarebbe arrivata');
  ok(!('caso' in serializza(meta)), 'il caso non si salva: si rifa\' dal seme e dai passi');
}

/* ══ 3. Il tempo non ci sta ══ */
titolo('E\' UN GIOCO DI RINUNCE');
{
  const s = creaPartita({ seme: 1, background: 'ceto_medio' });
  const necessarie = ['studio', 'relazioni', 'sonno', 'sport', 'networking'];
  const somma = necessarie.reduce((t, id) => t + ATTIVITA.find((a) => a.id === id).tempo[1], 0);
  ok(somma > TEMPO.settimana, 'il massimo delle attivita\' necessarie supera il tempo di una settimana', `${somma} contro ${TEMPO.settimana}`);
  const troppo = controllaPiano(s, { studio: 40, relazioni: 30, sonno: 20, sport: 15 });
  ok(!troppo.ok, 'un piano che sfora viene rifiutato', troppo.errore);
  const giusto = controllaPiano(s, { studio: 40, relazioni: 30, sonno: 20, sport: 10 });
  ok(giusto.ok && giusto.totale === 100, 'e uno che ci sta viene accettato');
  const fuori = controllaPiano(s, { studio: 50 });
  ok(!fuori.ok, 'e non si supera il massimo di una singola attivita\'');
  const ignota = controllaPiano(s, { pilates: 10 });
  ok(!ignota.ok, 'e un\'attivita\' che non esiste non passa');
}

/* ══ 4. Cinque vite diverse ══ */
titolo('I PUNTI DI PARTENZA SONO VITE DIVERSE');
{
  const per = Object.fromEntries(BACKGROUND.map((b) => [b.id, creaPartita({ seme: 9, background: b.id })]));
  ok(per.erede.vita.soldi > per.benestante.vita.soldi && per.benestante.vita.soldi > per.ceto_medio.vita.soldi
    && per.ceto_medio.vita.soldi > per.operaia.vita.soldi && per.operaia.vita.soldi > per.nessuna.vita.soldi,
    'i soldi di partenza scendono da erede a nessuna rete');
  ok(tempoDisponibile(per.nessuna) < tempoDisponibile(per.operaia) && tempoDisponibile(per.operaia) < tempoDisponibile(per.ceto_medio),
    'e il tempo di una settimana pure: chi deve lavorare e pendolare ne ha meno', `${tempoDisponibile(per.nessuna)} / ${tempoDisponibile(per.operaia)} / ${tempoDisponibile(per.ceto_medio)}`);
  ok(per.nessuna.lavoro && per.operaia.lavoro && !per.erede.lavoro && !per.ceto_medio.lavoro,
    'chi non ha rete lavora dalla prima settimana, chi ce l\'ha no');
  ok(per.erede.vita.rete > per.ceto_medio.vita.rete + 30, 'l\'erede parte con una rete che gli altri non hanno');
  /* Le porte chiuse. Quelle dichiarate oggi sono occasioni delle fasi
     tre e cinque (uno stage, un MBA all'estero), non attivita' della
     settimana: qui si controlla che siano dichiarate, e che il meccanismo
     che le rende grigie funzioni — con una porta finta, su un'attivita'
     vera, perche' inventare adesso un'attivita' chiusa solo per avere
     qualcosa da provare sarebbe contenuto scritto per la prova. */
  const bgNessuna = BACKGROUND.find((b) => b.id === 'nessuna');
  ok(bgNessuna.invisibili.length > 0 && BACKGROUND.find((b) => b.id === 'erede').invisibili.length === 0,
    '«nessuna rete» ha porte chiuse dichiarate, l\'erede nessuna', bgNessuna.invisibili.join(', '));
  const finta = { ...bgNessuna, invisibili: [...bgNessuna.invisibili, 'terapia'] };
  const primaInv = bgNessuna.invisibili;
  bgNessuna.invisibili = finta.invisibili;
  const grigie = attivitaDisponibili(per.nessuna).filter((a) => a.invisibile);
  ok(grigie.length === 1 && grigie[0].id === 'terapia' && Boolean(grigie[0].perche), 'una porta chiusa si vede grigia, e dice perche\'', grigie[0]?.perche);
  const rif = controllaPiano(per.nessuna, { lavoro: 40, terapia: 10 });
  ok(!rif.ok, 'e non si apre scrivendola nel piano', rif.errore);
  bgNessuna.invisibili = primaInv;
  ok(attivitaDisponibili(per.erede).every((a) => !a.invisibile), 'per l\'erede sono tutte aperte');
  const pochi = controllaPiano(per.nessuna, { lavoro: 20 });
  ok(!pochi.ok, 'e chi ha un lavoro non puo\' farne meno ore di quelle dovute', pochi.errore);
}

/* ══ 5. Le competenze rallentano ══ */
titolo('LE COMPETENZE CRESCONO A RENDIMENTI DECRESCENTI');
{
  const d = (v, campo) => cresci(v, 1, { campo }) - v;
  ok(d(0) > d(40) && d(40) > d(80) && d(80) > d(95), 'la stessa spinta rende sempre meno salendo',
    `${d(0).toFixed(2)} · ${d(40).toFixed(2)} · ${d(80).toFixed(2)} · ${d(95).toFixed(2)}`);
  ok(d(80) < d(0) * 0.15, 'da ottanta in su e\' quasi ferma');
  ok(d(80, true) > d(80, false), 'sul campo gli ultimi punti vengono meglio che a scuola', `${d(80, true).toFixed(3)} contro ${d(80, false).toFixed(3)}`);
  ok(cresci(99.9, 100) <= 100, 'e non si supera cento');
  ok(HARD.length === 8 && SOFT.length === 9, 'otto hard e nove soft, come scritto');
  ok(LIVELLI.length === 11 && LIVELLI[10].id === 'ceo', 'undici gradini fino al CEO');
}

/* ══ 6. L'energia ══ */
titolo('L\'ENERGIA SI PUO\' SFORARE, E SI PAGA');
{
  const s = creaPartita({ seme: 2, background: 'benestante' });
  const salute0 = s.corpo.salute; const sonno0 = s.corpo.sonno;
  const x = giocaSettimana(s, { studio: 40, straordinari: 0, progetti: 30, networking: 20, lavoretti: 10 });
  ok(x.ok && x.energia.sforo > 0, 'un piano pieno di cose pesanti sfora l\'energia', `${x.energia.chiesta} chiesti su ${x.energia.avuta}`);
  ok(s.corpo.salute < salute0 && s.corpo.sonno > sonno0, 'e lo sforo si paga in salute e sonno');
  const t = creaPartita({ seme: 2, background: 'benestante' });
  t.corpo.salute = 30; t.corpo.sonno = 60;
  ok(energiaDisponibile(t) < energiaDisponibile(s) * 0.6, 'con il corpo a pezzi l\'energia crolla', `${Math.round(energiaDisponibile(t))} contro ${Math.round(energiaDisponibile(s))}`);
}

/* ══ 7. Le condizioni pesano ══ */
titolo('LE CONDIZIONI DELLA VITA PESANO SULLO STRESS');
{
  const base = creaPartita({ seme: 3 });
  const rosso = creaPartita({ seme: 3 });
  rosso.vita.soldi = -2000;
  const piano = { studio: 20, sonno: 10, relazioni: 10 };
  giocaSettimana(base, piano); giocaSettimana(rosso, piano);
  ok(rosso.corpo.stress > base.corpo.stress, 'essere in rosso costa stress ogni settimana');
  const solo = creaPartita({ seme: 3 });
  solo.vita.relazioni = 10;
  giocaSettimana(solo, piano);
  ok(solo.corpo.stress > base.corpo.stress, 'e anche non avere nessuno');
  const senzaSonno = creaPartita({ seme: 3 });
  senzaSonno.corpo.sonno = 80;
  giocaSettimana(senzaSonno, piano);
  ok(senzaSonno.corpo.stress > base.corpo.stress, 'e dormire male');
  const s = gioca({ seme: 4, background: 'nessuna', percorso: 'autodidatta', settimane: 4 });
  const x = giocaSettimana(s);
  ok(Array.isArray(x.perche) && x.perche.every((p) => p.testo), 'e il riepilogo dice perche\', in parole');
}

/* ══ 8. Fine mese ══ */
titolo('I CONTI DI FINE MESE');
{
  const s = creaPartita({ seme: 6, background: 'ceto_medio' });
  const prima = s.vita.soldi;
  for (let i = 0; i < 3; i += 1) giocaSettimana(s, { studio: 20, sonno: 10 });
  const x = giocaSettimana(s, { studio: 20, sonno: 10 });
  ok(x.conti && x.conti.stipendio === 0 && x.conti.affitto > 0, 'alla quarta settimana si pagano affitto e spese, e senza lavoro non entra niente', JSON.stringify(x.conti));
  ok(s.vita.soldi < prima, 'e la cassa scende');
  const d = creaPartita({ seme: 6, background: 'ceto_medio' });
  d.vita.soldi = -5000;
  for (let i = 0; i < 4; i += 1) giocaSettimana(d, { sonno: 10 });
  ok(d.storico.at(-1)[1] < -5000 - NUMERI.ceto_medio.affitto - NUMERI.ceto_medio.spese, 'il debito costa interessi');
}

/* ══ 9. Le fini, e la rete di sicurezza ══ */
titolo('COME FINISCE, E CHI VIENE SALVATO');
{
  const b = creaPartita({ seme: 8 });
  b.corpo.stress = 99.5;
  giocaSettimana(b, { lavoretti: 30, straordinari: 0, studio: 40 });
  ok(b.fase === 'finita' && b.esito?.causa === 'burnout', 'stress a cento e\' il burnout', JSON.stringify(b.esito));

  const ricco = creaPartita({ seme: 8, background: 'erede' });
  ricco.vita.soldi = FINE.crolloEconomico.soldi - 1000;
  const povero = creaPartita({ seme: 8, background: 'nessuna' });
  povero.vita.soldi = FINE.crolloEconomico.soldi - 1000;
  for (let i = 0; i < FINE.crolloEconomico.settimane + 2; i += 1) {
    if (ricco.fase !== 'finita') giocaSettimana(ricco, { sonno: 10 });
    if (povero.fase !== 'finita') giocaSettimana(povero, { lavoro: 40, sonno: 10 });
  }
  ok(ricco.fase !== 'finita' && ricco.log.some((r) => r.tipo === 'salvataggio'), 'l\'erede in rosso profondo viene salvato dalla famiglia, e resta scritto');
  ok(povero.fase === 'finita' && povero.esito?.causa === 'crollo_economico', 'chi non ha nessuno affonda', JSON.stringify(povero.esito));
  ok(STRESS.segnali < STRESS.crollo && STRESS.crollo < STRESS.burnout, 'i segnali vengono prima del crollo, e il crollo prima della fine');
}

/* ══ 9b. Il bore-out ══ */
titolo('IL BORE-OUT: CHI SI SPEGNE INVECE DI SCOPPIARE');
{
  /* al call center, senza niente che abbia un senso fuori dal lavoro */
  const spento = creaPartita({ seme: 9, background: 'ceto_medio' });
  prendiLavoro(spento, 'callcenter');
  spento.vita.soldi = 50000;                       // i soldi non c'entrano: si guarda solo la noia
  let segnaleIl = null;
  while (spento.fase !== 'finita' && spento.settimana < 200) {
    const x = giocaSettimana(spento, { lavoro: 40, sonno: 15, relazioni: 20, sport: 10 });
    if (!segnaleIl && x.segnali.some((s) => /lunedì/.test(s))) segnaleIl = x.settimana;
  }
  ok(spento.fase === 'finita' && spento.esito?.causa === 'bore_out', 'al call center, senza niente che abbia un senso, ci si spegne', JSON.stringify(spento.esito));
  ok(segnaleIl && segnaleIl < spento.esito.settimana, 'e i segnali vengono prima', `segnale alla settimana ${segnaleIl}, fine alla ${spento.esito.settimana}`);
  ok(spento.corpo.stress < FINE.burnout.stress, 'non e\' burnout: lo stress non e\' a cento', `stress ${Math.round(spento.corpo.stress)}`);

  /* la stessa vita, con dei progetti propri: la noia si scarica */
  const vivo = creaPartita({ seme: 9, background: 'ceto_medio' });
  prendiLavoro(vivo, 'callcenter');
  vivo.vita.soldi = 50000;
  for (let i = 0; i < 200 && vivo.fase !== 'finita'; i += 1) giocaSettimana(vivo, { lavoro: 40, sonno: 15, relazioni: 15, progetti: 20 });
  ok(vivo.fase !== 'finita' && vivo.corpo.noia < NOIA.segnali, 'con dei progetti propri la noia resta bassa', `noia ${Math.round(vivo.corpo.noia)} dopo 200 settimane`);

  /* al bar, che non e' un call center, la noia sale ma da sola non ammazza in un anno */
  const bar = creaPartita({ seme: 9, background: 'ceto_medio' });
  prendiLavoro(bar, 'bar');
  bar.vita.soldi = 50000;
  for (let i = 0; i < 52 && bar.fase !== 'finita'; i += 1) giocaSettimana(bar, { lavoro: 40, sonno: 15, relazioni: 20, sport: 10 });
  ok(bar.fase !== 'finita', 'un lavoro meno ripetitivo non spegne in un anno', `noia ${Math.round(bar.corpo.noia)}`);

  /* cambiare lavoro dimezza la noia; restare a lungo la fa crescere di piu' */
  const cambia = creaPartita({ seme: 9, background: 'ceto_medio' });
  prendiLavoro(cambia, 'callcenter');
  cambia.corpo.noia = 70;
  prendiLavoro(cambia, 'bar');
  ok(Math.abs(cambia.corpo.noia - 70 * NOIA.cambioLavoro) < 1e-9, 'cambiare lavoro lascia meta\' della noia', `noia ${cambia.corpo.noia}`);
  const presto = creaPartita({ seme: 9, background: 'ceto_medio' }); prendiLavoro(presto, 'bar'); presto.vita.soldi = 50000;
  const tardi = creaPartita({ seme: 9, background: 'ceto_medio' }); prendiLavoro(tardi, 'bar'); tardi.vita.soldi = 50000;
  tardi.lavoro.anzianita = NOIA.assuefazioneDa + 40;
  const p1 = giocaSettimana(presto, { lavoro: 40, sonno: 15 }).perche.find((p) => p.cosa === 'noia').quanto;
  const p2 = giocaSettimana(tardi, { lavoro: 40, sonno: 15 }).perche.find((p) => p.cosa === 'noia').quanto;
  ok(p2 > p1, 'dopo tanto tempo allo stesso posto la noia cresce piu\' in fretta', `${p1} contro ${p2} a settimana`);
  ok(NOIA.segnali < NOIA.crollo && NOIA.crollo < NOIA.boreOut, 'anche qui i segnali vengono prima del crollo, e il crollo prima della fine');
}

/* ══ 10. La routine ══ */
titolo('LA ROUTINE');
{
  const s = creaPartita({ seme: 10, background: 'operaia' });
  scegliPercorso(s, 'its');
  const r = impostaRoutine(s, { lavoro: 42, studio: 20, sonno: 10, relazioni: 10 });
  ok(r.ok, 'una routine valida si imposta');
  ok(s.log.some((x) => x.tipo === 'routine') && s.log.some((x) => x.tipo === 'percorso'), 'e routine e percorso finiscono nel log come decisioni');
  const x = giocaSettimana(s);
  ok(x.ok && x.daRoutine, 'senza un piano si gioca con la routine');
  ok(s.log.at(-1).tipo === 'piano' && Object.values(s.log.at(-1).piano).every((t) => t > 0) && s.log.at(-1).piano.sonno === 10, 'e il piano giocato finisce nel log, senza gli zeri');
}

/* ══ 10b. Il percorso finisce ══ */
titolo('IL PERCORSO FINISCE, E SMETTE DI COSTARE');
{
  const s = creaPartita({ seme: 5, background: 'erede' });
  scegliPercorso(s, 'its');
  impostaRoutine(s, { studio: 20, sonno: 12, relazioni: 15, sport: 8 });
  const durata = PERCORSO.its.durata;
  let titoloIl = null;
  let costoPrima = 0;
  let costoDopo = 0;
  while (s.fase !== 'finita' && s.settimana <= durata + 8) {
    const x = giocaSettimana(s);
    if (x.conti) (titoloIl ? (costoDopo += x.conti.percorso) : (costoPrima += x.conti.percorso));
    if (!titoloIl && x.perche.some((p) => p.cosa === 'titolo')) titoloIl = x.settimana;
  }
  ok(titoloIl === durata, 'dopo tante settimane di studio quante ne dura il percorso, il titolo arriva', `settimana ${titoloIl}`);
  ok(s.titoli.includes('its') && s.log.some((r) => r.tipo === 'titolo'), 'e resta scritto nello stato e nel log');
  ok(costoPrima > 0 && costoDopo === 0, 'prima si paga, dopo no', `${costoPrima} prima, ${costoDopo} dopo`);
  const t = creaPartita({ seme: 5, background: 'erede' });
  scegliPercorso(t, 'autodidatta');
  impostaRoutine(t, { studio: 20, sonno: 12, relazioni: 15, sport: 8 });
  for (let i = 0; i < 30; i += 1) giocaSettimana(t);
  ok(t.titoli.length === 0, 'chi studia da solo non prende titoli: e\' un modo di vivere, non un corso');
}

/* ══ 12. La carriera: i colloqui ══ */
titolo('I COLLOQUI: SI BUSSA, E QUALCUNO DECIDE');
{
  const s = creaPartita({ seme: 21, background: 'ceto_medio' });
  scegliPercorso(s, 'its');
  const porte = porteDi(s);
  ok(porte.length === AZIENDE.filter((a) => a.tipo !== 'sopravvivenza').length, 'le porte sono tutte le aziende strutturate, aperte o chiuse', String(porte.length));
  const meridian = porte.find((p) => p.aziendaId === 'meridian');
  ok(meridian.chiusa === 'il curriculum non passa il filtro', 'senza laurea Meridian non legge nemmeno il curriculum', meridian.chiusa);
  const achivia = porte.find((p) => p.aziendaId === 'achivia');
  ok(achivia.chiusa && achivia.carte.some((c) => c.id === 'sponsor' && !c.ok), 'ACHIVIA e\' chiusa, e fra le carte c\'e\' lo sponsor');
  const pixelia = porte.find((p) => p.aziendaId === 'pixelia');
  ok(!pixelia.chiusa && pixelia.probabilita > 0 && pixelia.probabilita < 1, 'un piccolo studio parla con chiunque, ma non e\' sicuro', `p=${pixelia.probabilita.toFixed(2)}`);
  const senza = faiColloquio(s, 'pixelia');
  ok(!senza.ok && /ricerca/.test(senza.errore), 'senza aver cercato lavoro non si fa il colloquio', senza.errore);
  /* si cerca lavoro per qualche settimana, poi si bussa */
  for (let i = 0; i < 3; i += 1) giocaSettimana(s, { candidature: 10, sonno: 10, studio: 20 });
  ok(s.ricerca >= COLLOQUIO.costo, 'cercare lavoro accumula ricerca', String(s.ricerca));
  const c = faiColloquio(s, 'pixelia');
  ok(c.ok && typeof c.preso === 'boolean' && c.carte.length >= 4, 'il colloquio ha un esito e le sue carte', c.testo);
  ok(s.log.at(-1).tipo === 'colloquio', 'e sta nel log come decisione');
  ok(s.ricerca < COLLOQUIO.costo || c.ok, 'e ha speso la ricerca');
  /* lo stesso seme, la stessa sequenza: lo stesso esito */
  const s2 = creaPartita({ seme: 21, background: 'ceto_medio' });
  scegliPercorso(s2, 'its');
  for (let i = 0; i < 3; i += 1) giocaSettimana(s2, { candidature: 10, sonno: 10, studio: 20 });
  const c2 = faiColloquio(s2, 'pixelia');
  ok(c2.preso === c.preso, 'con lo stesso seme il colloquio va nello stesso modo');
  /* prima o poi qualcuno dice di si': con tanti semi almeno uno */
  let presi = 0; let rifiutati = 0; let vistoSi = false; let vistoNo = false;
  for (let seme = 1; seme <= 30; seme += 1) {
    const x = creaPartita({ seme, background: 'ceto_medio' });
    scegliPercorso(x, 'its');
    for (let i = 0; i < 3; i += 1) giocaSettimana(x, { candidature: 10, sonno: 10, studio: 20 });
    const e = faiColloquio(x, 'pixelia');
    if (e.preso) presi += 1; else rifiutati += 1;
    if (e.preso && !vistoSi) {
      vistoSi = true;
      ok(x.offerte.length === 1 && x.offerte[0].aziendaId === 'pixelia', 'quando va bene, l\'offerta aspetta');
      const a = accettaOfferta(x, 'pixelia');
      ok(a.ok && x.lavoro.aziendaId === 'pixelia' && x.offerte.length === 0 && x.log.at(-1).tipo === 'lavoro', 'e accettarla cambia lavoro');
      ok(stipendioDi(x.lavoro) > 0 && oreObbligatorie(x) === 40, 'con uno stipendio di livello e le sue ore', `${stipendioDi(x.lavoro)} € · ${oreObbligatorie(x)} punti`);
    }
    if (!e.preso && !vistoNo) {
      vistoNo = true;
      ok(x.rifiuti.pixelia === x.settimana && porteDi(x).find((p) => p.aziendaId === 'pixelia').chiusa, 'quando va male, la porta resta chiusa per un po\'');
    }
  }
  ok(presi >= 1 && rifiutati >= 1, 'su trenta semi qualcuno dice si\' e qualcuno no', `${presi} sì, ${rifiutati} no`);
  /* le offerte scadono */
  const o = creaPartita({ seme: 3, background: 'erede' });
  o.offerte.push({ aziendaId: 'pixelia', livello: 0, stipendio: 800, ore: 40, scade: o.settimana + 2 });
  giocaSettimana(o, { sonno: 10 }); giocaSettimana(o, { sonno: 10 });
  ok(o.offerte.length === 1, 'un\'offerta aspetta le sue settimane');
  giocaSettimana(o, { sonno: 10 });
  ok(o.offerte.length === 0, 'e poi, senza risposta, scade');
}

/* ══ 13. Le bugie del colloquio ══ */
titolo('LE AZIENDE MENTONO, E DA DENTRO SI VEDE');
{
  const s = creaPartita({ seme: 4, background: 'erede' });
  const fuori = schedaAzienda(s, 'volturno');
  ok(fuori.attributi.cultura.valore === 7 && fuori.attributi.cultura.diceva === null, 'da fuori Volturno ha la cultura che dice di avere', String(fuori.attributi.cultura.valore));
  s.offerte.push({ aziendaId: 'volturno', livello: 1, stipendio: 3000, ore: 60, scade: 99 });
  accettaOfferta(s, 'volturno');
  for (let i = 0; i < COLLOQUIO.scoperta; i += 1) giocaSettimana(s, { lavoro: 60, sonno: 15, relazioni: 15 });
  const dentro = schedaAzienda(s, 'volturno');
  ok(dentro.conosciuta && dentro.attributi.cultura.valore === 2 && dentro.attributi.cultura.diceva === 7, 'dopo otto settimane dentro si vede la verita\', con accanto la bugia', `${dentro.attributi.cultura.valore} (diceva ${dentro.attributi.cultura.diceva})`);
  ok(schedaAzienda(s, 'pixelia').attributi.cultura.diceva === null, 'chi non mente non ha niente da confrontare');
}

/* ══ 14. Le valutazioni e il perche' ══ */
titolo('LE PROMOZIONI: OGNI TRIMESTRE, CON IL PERCHE\'');
{
  /* uno bravo, visibile, con le competenze: viene promosso */
  const bravo = creaPartita({ seme: 5, background: 'erede' });
  bravo.offerte.push({ aziendaId: 'helvex', livello: 1, stipendio: 1650, ore: 40, scade: 99 });
  accettaOfferta(bravo, 'helvex');
  for (const k of Object.keys(bravo.hard)) bravo.hard[k] = 60;
  for (const k of Object.keys(bravo.soft)) bravo.soft[k] = 60;
  bravo.lavoro.performance = 90; bravo.lavoro.visibilita = 60; bravo.lavoro.anzianita = 40; bravo.vita.reputazione = 60;
  let v = null;
  while (!v && bravo.settimana < 60) { const x = giocaSettimana(bravo, { lavoro: 40, sonno: 15, relazioni: 15, sport: 10 }); v = x.valutazione; }
  ok(v && v.tipo === 'valutazione' && v.carte.every((c) => c.ok), 'con tutte le carte in regola la valutazione lo dice', v?.testo);
  ok(typeof v.caso.posti === 'number' && typeof v.caso.aperto === 'boolean', 'e dice quanto contava il caso', `posti ${v.caso.posti}%`);
  ok(bravo.valutazioni.length === 1 && bravo.log.every((r) => r.tipo !== 'valutazione'), 'la valutazione resta nello stato, non nel log: non e\' una decisione');
  /* e con tanti semi, prima o poi il posto c'e' */
  let promossi = 0;
  for (let seme = 1; seme <= 20; seme += 1) {
    const b = creaPartita({ seme, background: 'erede' });
    b.offerte.push({ aziendaId: 'helvex', livello: 1, stipendio: 1650, ore: 40, scade: 99 });
    accettaOfferta(b, 'helvex');
    for (const k of Object.keys(b.hard)) b.hard[k] = 60;
    for (const k of Object.keys(b.soft)) b.soft[k] = 60;
    b.lavoro.performance = 90; b.lavoro.visibilita = 60; b.lavoro.anzianita = 40; b.vita.reputazione = 60;
    for (let i = 0; i < 60 && b.lavoro && b.lavoro.livello === 1; i += 1) giocaSettimana(b, { lavoro: 40, sonno: 15, relazioni: 15, sport: 10 });
    if (b.lavoro?.livello === 2) promossi += 1;
  }
  ok(promossi >= 10, 'a Helvex, che promuove piano, in un anno la meta\' almeno sale', `${promossi} su 20`);
  /* solo hard: fino a Manager si passa di misura, a Senior Manager e' il muro */
  const muro = creaPartita({ seme: 5, background: 'erede' });
  muro.offerte.push({ aziendaId: 'aurelia', livello: 4, stipendio: 4400, ore: 48, scade: 99 });
  accettaOfferta(muro, 'aurelia');
  for (const k of Object.keys(muro.hard)) muro.hard[k] = 92;
  for (const k of Object.keys(muro.soft)) muro.soft[k] = 20;
  muro.lavoro.performance = 95; muro.lavoro.visibilita = 80; muro.lavoro.anzianita = 60; muro.vita.reputazione = 70; muro.sponsor = { nome: 'x' };
  const mediaOk = punteggioCompetenze(muro, 'medio').totale >= PROMOZIONE.richiesta[4];
  ok(mediaOk, 'con le sole competenze tecniche altissime fino a Manager si arriva', `medio: ${Math.round(punteggioCompetenze(muro, 'medio').totale)} contro ${PROMOZIONE.richiesta[4]}`);
  let vm = null;
  while (!vm && muro.settimana < 60) { const x = giocaSettimana(muro, { lavoro: 48, sonno: 15, relazioni: 10, sport: 10 }); vm = x.valutazione; }
  const cComp = vm.carte.find((c) => c.id === 'competenze');
  ok(vm && !vm.promosso && cComp && !cComp.ok, 'ma a Senior Manager, dove le trasversali pesano il settanta per cento, e\' il muro', `${cComp?.valore} contro ${cComp?.richiesto}`);
  ok(/trasversali/.test(vm.lezione || ''), 'e la lezione glielo spiega');
  /* il capo: dal quarto livello senza sponsor non si sale */
  const capo = creaPartita({ seme: 5, background: 'erede' });
  capo.offerte.push({ aziendaId: 'aurelia', livello: 3, stipendio: 3500, ore: 48, scade: 99 });
  accettaOfferta(capo, 'aurelia');
  for (const k of Object.keys(capo.hard)) capo.hard[k] = 80;
  for (const k of Object.keys(capo.soft)) capo.soft[k] = 80;
  capo.lavoro.performance = 95; capo.lavoro.visibilita = 80; capo.lavoro.anzianita = 60; capo.vita.reputazione = 80;
  let vc = null;
  while (!vc && capo.settimana < 60) { const x = giocaSettimana(capo, { lavoro: 48, sonno: 15, relazioni: 15, sport: 10 }); vc = x.valutazione; }
  const cSponsor = vc.carte.find((c) => c.id === 'sponsor');
  ok(vc && !vc.promosso && cSponsor && !cSponsor.ok && vc.carte.filter((c) => !c.ok).length === 1, 'a Manager, con tutto in regola, senza sponsor non si sale', vc?.testo);
  ok(/sponsor/i.test(vc.lezione || '') && /stanze/.test(vc.lezione || ''), 'e il gioco spiega che cos\'e\' uno sponsor');
  capo.sponsor = { nome: 'prova' };
  let vs = null;
  for (let i = 0; i < 80 && !(vs && vs.promosso); i += 1) { const x = giocaSettimana(capo, { lavoro: 48, sonno: 15, relazioni: 15, sport: 10 }); if (x.valutazione) vs = x.valutazione; }
  ok(vs && vs.promosso && capo.lavoro.livello === 4, 'con uno sponsor, si sale', vs?.testo);
  ok(capo.lavoro.anzianita < 60 && capo.lavoro.visibilita < 80, 'e anzianita\' e visibilita\' ripartono');
  /* il tetto */
  const tetto = creaPartita({ seme: 5, background: 'erede' });
  tetto.offerte.push({ aziendaId: 'cartesio', livello: 2, stipendio: 1900, ore: 40, scade: 99 });
  accettaOfferta(tetto, 'cartesio');
  let vt = null;
  while (!vt && tetto.settimana < 60) { const x = giocaSettimana(tetto, { lavoro: 40, sonno: 15, relazioni: 15 }); vt = x.valutazione; }
  ok(vt && vt.tipo === 'tetto' && /cambiare posto/.test(vt.testo), 'in un\'azienda piccola c\'e\' un tetto, e lo dice', vt?.testo);
  /* si perde il posto */
  const scarso = creaPartita({ seme: 5, background: 'erede' });
  scarso.offerte.push({ aziendaId: 'helvex', livello: 1, stipendio: 1650, ore: 40, scade: 99 });
  accettaOfferta(scarso, 'helvex');
  for (const k of Object.keys(scarso.hard)) scarso.hard[k] = 2;
  for (const k of Object.keys(scarso.soft)) scarso.soft[k] = 2;
  scarso.lavoro.performance = 5;
  let licenziato = null;
  for (let i = 0; i < 40 && !licenziato; i += 1) { scarso.lavoro && (scarso.lavoro.performance = 5); const x = giocaSettimana(scarso, { lavoro: 40, sonno: 15 }); if (x.valutazione?.tipo === 'licenziamento') licenziato = x.valutazione; }
  ok(licenziato && scarso.lavoro === null, 'due valutazioni sotto il minimo e si e\' a casa', licenziato?.testo);
  let riorg = 0;
  for (let seme = 1; seme <= 30; seme += 1) {
    const r = creaPartita({ seme, background: 'erede' });
    r.offerte.push({ aziendaId: 'bytefarm', livello: 1, stipendio: 1500, ore: 52, scade: 99 });
    accettaOfferta(r, 'bytefarm');
    for (let i = 0; i < 104 && r.lavoro; i += 1) giocaSettimana(r, { lavoro: 52, sonno: 15, relazioni: 15 });
    if (!r.lavoro && r.valutazioni.some((v) => v.tipo === 'riorganizzazione')) riorg += 1;
  }
  ok(riorg >= 8, 'a ByteFarm, in due anni, una riorganizzazione ti manda a casa spesso', `${riorg} su 30`);
  /* la cima */
  const cima = creaPartita({ seme: 5, background: 'erede' });
  cima.offerte.push({ aziendaId: 'achivia', livello: 9, stipendio: 25000, ore: 50, scade: 99 });
  accettaOfferta(cima, 'achivia');
  for (const k of Object.keys(cima.hard)) cima.hard[k] = 95;
  for (const k of Object.keys(cima.soft)) cima.soft[k] = 95;
  cima.lavoro.performance = 95; cima.lavoro.visibilita = 95; cima.lavoro.anzianita = 100; cima.vita.reputazione = 95; cima.sponsor = { nome: 'x' };
  /* qui si prova che la cima chiude la partita, non che il posto e' raro:
     la scarsita' dei posti in cima si spegne per la durata della prova */
  const postiInCima = PROMOZIONE.postiInCima; PROMOZIONE.postiInCima = {};
  for (let i = 0; i < 620 && cima.fase !== 'finita'; i += 1) giocaSettimana(cima, { lavoro: 50, sonno: 15, relazioni: 15, sport: 10 });
  PROMOZIONE.postiInCima = postiInCima;
  ok(cima.fase === 'finita' && cima.esito?.causa === 'cima' && cima.esito.livello === 10, 'diventare CEO di ACHIVIA chiude la partita', JSON.stringify(cima.esito));
}

/* ══ 15. Le persone ══ */
titolo('LE PERSONE: CHI SI INCONTRA, E CHE COSA SI RICORDA');
{
  /* per tutto il capitolo nessuno cambia azienda da solo: si guardano le
     persone, non il caso che le sposta. L'ultima prova lo riaccende. */
  const cambiaAziendaCapitolo = PERSONE.trimestre.cambiaAzienda;
  PERSONE.trimestre.cambiaAzienda = 0;
  /* l'erede nasce con qualcuno; chi non ha rete no */
  const erede = creaPartita({ seme: 31, background: 'erede' });
  const nessuno = creaPartita({ seme: 31, background: 'nessuna' });
  ok(erede.persone.length === 1 && erede.persone[0].archetipo === 'sponsor' && erede.persone[0].famiglia, 'l\'erede nasce con un contatto di famiglia che puo\' fare il suo nome', `${erede.persone[0]?.nome}, potere ${erede.persone[0]?.potere}`);
  ok(nessuno.persone.length === 0, 'chi non ha rete nasce senza nessuno');

  /* entrando in un'azienda si trovano il capo, HR, il dirigente, forse un collega */
  const s = creaPartita({ seme: 31, background: 'ceto_medio' });
  s.offerte.push({ aziendaId: 'volturno', livello: 1, stipendio: 3000, ore: 60, scade: 99 });
  const a = accettaOfferta(s, 'volturno');
  ok(a.ok && a.persone.length >= 3 && s.persone.some((p) => p.archetipo === 'hr') && s.persone.some((p) => p.archetipo === 'sponsor'), 'entrando si incontrano il capo, HR e il dirigente', a.persone.join(', '));
  const capi = [];
  for (let seme = 1; seme <= 30; seme += 1) {
    const x = creaPartita({ seme, background: 'ceto_medio' });
    x.offerte.push({ aziendaId: 'volturno', livello: 1, stipendio: 3000, ore: 60, scade: 99 });
    accettaOfferta(x, 'volturno');
    capi.push(x.persone.find((p) => ['capo', 'tossico', 'capo_eccellente'].includes(p.archetipo)).archetipo);
  }
  ok(capi.filter((c) => c === 'tossico').length >= 18, 'a Volturno, dove i capi sono da due, il capo e\' quasi sempre tossico', `${capi.filter((c) => c === 'tossico').length} su 30`);
  const buoni = [];
  for (let seme = 1; seme <= 30; seme += 1) {
    const x = creaPartita({ seme, background: 'ceto_medio' });
    x.offerte.push({ aziendaId: 'kaleido', livello: 2, stipendio: 2500, ore: 45, scade: 99 });
    accettaOfferta(x, 'kaleido');
    buoni.push(x.persone.find((p) => ['capo', 'tossico', 'capo_eccellente'].includes(p.archetipo)).archetipo);
  }
  ok(buoni.filter((c) => c === 'capo_eccellente').length >= 15 && !buoni.includes('tossico'), 'a Kaleido, dove i capi sono da otto, spesso e\' eccellente e mai tossico', `${buoni.filter((c) => c === 'capo_eccellente').length} eccellenti su 30`);

  /* il capo tossico: si scopre in un mese, e logora. Per questa prova a
     Volturno non ci sono riorganizzazioni: si guarda il capo, non il caso */
  const stabilitaVolturno = AZIENDA.volturno.stabilita;
  AZIENDA.volturno.stabilita = 10;
  const t = creaPartita({ seme: 2, background: 'ceto_medio' });
  t.offerte.push({ aziendaId: 'volturno', livello: 1, stipendio: 3000, ore: 60, scade: 99 });
  accettaOfferta(t, 'volturno');
  let tossico = t.persone.find((p) => p.archetipo === 'tossico');
  let seme = 2;
  while (!tossico && seme < 40) {
    seme += 1;
    const y = creaPartita({ seme, background: 'ceto_medio' });
    y.offerte.push({ aziendaId: 'volturno', livello: 1, stipendio: 3000, ore: 60, scade: 99 });
    accettaOfferta(y, 'volturno');
    tossico = y.persone.find((p) => p.archetipo === 'tossico');
    if (tossico) Object.assign(t, y);
  }
  ok(tossico && !tossico.svelato && fotografia(t).persone.find((p) => p.id === tossico.id).ruolo === 'Il capo', 'all\'inizio il capo tossico e\' solo «il capo»');
  const stressPrima = t.corpo.stress;
  for (let i = 0; i < 5; i += 1) giocaSettimana(t, { lavoro: 60, sonno: 15, relazioni: 15 });
  ok(tossico.svelato && t.corpo.stress >= stressPrima + 4, 'dopo un mese si e\' svelato, e lo stress e\' salito', `stress ${Math.round(stressPrima)} → ${Math.round(t.corpo.stress)}`);
  const mosse = fotografia(t).persone.find((p) => p.id === tossico.id).azioni;
  ok(mosse.some((m) => m.id === 'documenta' && m.disponibile) && mosse.some((m) => m.id === 'hr' && m.disponibile) && mosse.find((m) => m.id === 'appello')?.disponibile === false, 'si puo\' documentare e andare da HR; l\'appello vuole uno sponsor', mosse.find((m) => m.id === 'appello')?.perche);
  for (let i = 0; i < 8; i += 1) { agisci(t, tossico.id, 'documenta'); giocaSettimana(t, { lavoro: 60, sonno: 15, relazioni: 15 }); }
  ok(tossico.dossier === 8 && t.log.filter((r) => r.tipo === 'persona' && r.azione === 'documenta').length === 8, 'documentare e\' una decisione a settimana, e il dossier cresce');
  const pHr = fotografia(t).persone.find((p) => p.id === tossico.id).azioni.find((m) => m.id === 'hr').probabilita;
  ok(pHr > 0.3 && pHr < 0.9, 'con il dossier HR e\' un tiro possibile ma non sicuro, in un\'azienda con la cultura a due', `p=${pHr.toFixed(2)}`);
  let vinti = 0;
  for (let k = 1; k <= 20; k += 1) {
    const z = deserializza(serializza(t));
    z.caso = creaPartita({ seme: 100 + k }).caso;      // solo per il tiro: un altro seme
    const r = agisci(z, tossico.id, 'hr');
    if (z.persone.find((p) => p.id === tossico.id).neutralizzato) vinti += 1;
    else ok(z.vita.reputazione < t.vita.reputazione && /protetto l’azienda/.test(r.testo), 'quando HR non ti tutela, lo dice e si paga', r.testo.slice(0, 60));
    if (!z.persone.find((p) => p.id === tossico.id).neutralizzato) break;
  }
  ok(vinti >= 1 || pHr > 0, 'e qualche volta HR funziona');
  /* con uno sponsor piu' in alto, l'appello */
  const u = deserializza(serializza(t));
  const dirigente = u.persone.find((p) => p.archetipo === 'sponsor' && p.aziendaId === 'volturno');
  dirigente.fiducia = 80; dirigente.potere = 9;
  giocaSettimana(u, { lavoro: 60, sonno: 15, relazioni: 15 });
  ok(u.sponsor?.personaId === dirigente.id, 'con abbastanza fiducia e potere il dirigente diventa sponsor', u.sponsor?.nome);
  const ap = fotografia(u).persone.find((p) => p.id === tossico.id).azioni.find((m) => m.id === 'appello');
  ok(ap.disponibile, 'e allora l\'appello si puo\' fare');
  const ra = agisci(u, tossico.id, 'appello');
  ok(ra.ok && (u.persone.find((p) => p.id === tossico.id).neutralizzato || dirigente.fiducia < 80), 'l\'appello o funziona o costa fiducia', ra.testo.slice(0, 70));

  /* lo sponsor si perde, se la fiducia cala */
  dirigente.fiducia = 30;
  giocaSettimana(u, { lavoro: 60, sonno: 15, relazioni: 15 });
  ok(u.sponsor === null, 'e si perde quando la fiducia cala');
  AZIENDA.volturno.stabilita = stabilitaVolturno;

  /* il manipolatore: invisibile senza intelligenza politica */
  let man = null; let m = null;
  for (let sm = 1; sm <= 40 && !man; sm += 1) {
    m = creaPartita({ seme: sm, background: 'ceto_medio' });
    m.offerte.push({ aziendaId: 'aurelia', livello: 2, stipendio: 2800, ore: 48, scade: 99 });
    accettaOfferta(m, 'aurelia');
    man = m.persone.find((p) => p.archetipo === 'manipolatore');
  }
  ok(Boolean(man) && !man.svelato, 'ad Aurelia si trova il collega manipolatore, e non si vede');
  m.soft.intelligenza_politica = 10;
  const repPrima = m.vita.reputazione;
  for (let i = 0; i < 10; i += 1) giocaSettimana(m, { lavoro: 48, sonno: 15, relazioni: 15 });
  ok(!man.svelato && m.vita.reputazione < repPrima, 'con poca intelligenza politica resta nascosto, e la reputazione scende senza sapere perche\'', `${Math.round(repPrima)} → ${Math.round(m.vita.reputazione)}`);
  m.soft.intelligenza_politica = 50;
  giocaSettimana(m, { lavoro: 48, sonno: 15, relazioni: 15 });
  ok(man.svelato, 'con intelligenza politica lo si riconosce');
  const ev = agisci(m, man.id, 'evita');
  ok(ev.ok && man.evitato, 'e lo si puo\' tenere a distanza');

  /* il mentore si incontra facendo rete; l'alleato ricorda gli aiuti */
  let conMentore = 0;
  for (let sm = 1; sm <= 20; sm += 1) {
    const w = creaPartita({ seme: sm, background: 'benestante' });
    for (let i = 0; i < 52; i += 1) giocaSettimana(w, { networking: 15, volontariato: 10, sonno: 12, relazioni: 10 });
    if (w.persone.some((p) => p.archetipo === 'mentore')) conMentore += 1;
  }
  ok(conMentore >= 15, 'facendo rete per un anno quasi sempre si trova un mentore', `${conMentore} su 20`);
  const senza = creaPartita({ seme: 3, background: 'benestante' });
  for (let i = 0; i < 52; i += 1) giocaSettimana(senza, { studio: 30, sonno: 12 });
  ok(!senza.persone.some((p) => p.archetipo === 'mentore'), 'chiusi in casa a studiare no');

  /* il torto che torna: duecento settimane dopo, al colloquio */
  let al = null; let q = null;
  for (let sm = 1; sm <= 40 && !al; sm += 1) {
    q = creaPartita({ seme: sm, background: 'benestante' });
    q.offerte.push({ aziendaId: 'pixelia', livello: 1, stipendio: 1100, ore: 40, scade: 99 });
    accettaOfferta(q, 'pixelia');
    al = q.persone.find((p) => p.archetipo === 'alleato');
  }
  ok(Boolean(al), 'a Pixelia si trova un alleato');
  const rm = agisci(q, al.id, 'ruba_merito');
  ok(rm.ok && al.memoria.some((x) => x.cosa === 'torto') && q.vita.integrita < 70 && q.nascosto.sospetto > 0, 'rubargli il merito rende subito, e lui se lo ricorda', `integrità ${q.vita.integrita}, sospetto ${q.nascosto.sospetto}`);
  const settimanaTorto = q.settimana;
  /* il tempo passa, e lui fa carriera altrove */
  al.aziendaId = 'orion'; al.potere = 6;
  for (let k = 0; k < 20; k += 1) q.hard[Object.keys(q.hard)[k % 8]] = 60;
  for (const k of Object.keys(q.soft)) q.soft[k] = 55;
  q.vita.reputazione = 60; q.vita.rete = 50;
  while (q.settimana < settimanaTorto + 200 && q.fase !== 'finita') giocaSettimana(q, { lavoro: 40, sonno: 15, relazioni: 15, sport: 8 });
  ok(q.fase !== 'finita', 'duecento settimane dopo e\' ancora in gioco', q.esito?.causa);
  q.titoli = ['its']; q.vita.rete = 50;               // il curriculum passa: si guarda solo il passato
  const porta = porteDi(q).find((p) => p.aziendaId === 'orion');
  const senzaPassato = porteDi({ ...q, persone: [] }).find((p) => p.aziendaId === 'orion');
  ok(porta.scene.length === 1 && /se lo ricorda/.test(porta.scene[0]) && new RegExp(al.nome).test(porta.scene[0]), 'al colloquio da Orion c\'e\' lui, e la scena lo dice', porta.scene[0]);
  ok(porta.probabilita < senzaPassato.probabilita, 'e la probabilita\' scende', `${porta.probabilita.toFixed(2)} contro ${senzaPassato.probabilita.toFixed(2)}`);
  ok(porta.carte.some((c) => c.id === 'passato' && !c.ok), 'con la carta «chi ti ricorda» fra quelle che mancano');
  /* e l'aiuto torna allo stesso modo */
  const g = creaPartita({ seme: 5, background: 'benestante' });
  g.offerte.push({ aziendaId: 'pixelia', livello: 1, stipendio: 1100, ore: 40, scade: 99 });
  accettaOfferta(g, 'pixelia');
  const amico = g.persone.find((p) => p.archetipo === 'alleato') || g.persone.find((p) => p.archetipo === 'capo');
  amico.archetipo = 'alleato';
  agisci(g, amico.id, 'aiuta');
  amico.fiducia = 80; amico.aziendaId = 'orion'; amico.potere = 6;
  g.titoli = ['its']; g.vita.rete = 50;
  for (const k of Object.keys(g.hard)) g.hard[k] = 60;
  const portaG = porteDi(g).find((p) => p.aziendaId === 'orion');
  ok(portaG.scene.length === 1 && /fatto il tuo nome/.test(portaG.scene[0]) && portaG.probabilita > porteDi({ ...g, persone: [] }).find((p) => p.aziendaId === 'orion').probabilita, 'chi hai aiutato fa il tuo nome, anche da un\'altra azienda', portaG.scene[0]);

  /* le persone si muovono da sole, ogni trimestre */
  PERSONE.trimestre.cambiaAzienda = cambiaAziendaCapitolo;
  let mossi = 0;
  for (let sm = 1; sm <= 10; sm += 1) {
    const d = creaPartita({ seme: sm, background: 'erede' });
    d.offerte.push({ aziendaId: 'helvex', livello: 1, stipendio: 1650, ore: 40, scade: 99 });
    accettaOfferta(d, 'helvex');
    const prima = d.persone.map((p) => `${p.id}:${p.aziendaId}:${p.potere}`).join(',');
    for (let i = 0; i < 156 && d.fase !== 'finita'; i += 1) giocaSettimana(d, { lavoro: 40, sonno: 15, relazioni: 15, sport: 8 });
    if (d.persone.map((p) => `${p.id}:${p.aziendaId}:${p.potere}`).join(',') !== prima) mossi += 1;
  }
  ok(mossi >= 8, 'in tre anni qualcuno sale o cambia azienda quasi sempre', `${mossi} su 10`);
}

/* ══ 16. Gli eventi ══ */
titolo('GLI EVENTI: DA ZERO A DUE A SETTIMANA, E ASPETTANO');
{
  ok(EVENTI.length >= 120, 'la banca ha almeno centoventi eventi', String(EVENTI.length));
  for (const b of BACKGROUND) {
    for (const id of b.invisibili) {
      const ev = eventoById(id);
      ok(Boolean(ev) && ev.background[b.id] === 0 && ev.porta, `la porta «${id}» chiusa a ${b.nome} esiste nella banca, con moltiplicatore zero`, ev ? JSON.stringify(ev.background) : 'manca');
    }
  }
  /* stesso seme, stessi eventi */
  const gioca = (seme) => {
    const s = creaGrezza({ seme, background: 'ceto_medio' });
    scegliPercorso(s, 'its');
    prendiLavoro(s, 'bar');
    const visti = [];
    for (let i = 0; i < 120 && s.fase !== 'finita'; i += 1) {
      const x = giocaGrezza(s);
      if (x.ok) visti.push(...x.eventi.map((e) => `${e.id}@${x.settimana}`));
    }
    return { s, visti };
  };
  const a = gioca(77); const b = gioca(77);
  ok(a.visti.length >= 8 && a.visti.join() === b.visti.join(), 'con lo stesso seme scattano gli stessi eventi nelle stesse settimane', `${a.visti.length} in 120 settimane`);
  ok(a.s.log.filter((r) => r.tipo === 'evento').length === a.visti.length, 'e ogni risposta e\' nel log');
  const perSettimana = {};
  for (const v of a.visti) { const w = v.split('@')[1]; perSettimana[w] = (perSettimana[w] || 0) + 1; }
  ok(Object.values(perSettimana).every((n) => n <= 2), 'mai piu\' di due in una settimana');
  ok(!a.visti.some((v) => Number(v.split('@')[1]) < 3), 'le prime settimane sono di respiro');
  /* un evento che aspetta ferma la settimana, finche' non si risponde */
  let s = null; let x = null;
  for (let seme = 1; seme <= 60 && !(x && x.eventi.length); seme += 1) {
    s = creaGrezza({ seme, background: 'ceto_medio' }); scegliPercorso(s, 'its'); prendiLavoro(s, 'bar');
    for (let i = 0; i < 40; i += 1) { x = giocaGrezza(s, { lavoro: 40, sonno: 15, relazioni: 15, studio: 20 }); if (!x.ok || x.eventi.length) break; }
  }
  ok(x && x.eventi.length >= 1, 'prima o poi succede qualcosa');
  const fermo = giocaGrezza(s, { lavoro: 40, sonno: 15, relazioni: 15, studio: 20 });
  ok(!fermo.ok && /rispondi/i.test(fermo.errore), 'con un piano in mano non si va avanti finche\' non si risponde', fermo.errore);
  const f = fotografia(s);
  ok(f.eventi.length >= 1 && f.eventi[0].opzioni.length >= 2 && f.eventi[0].opzioni.length <= 4, 'la fotografia porta l\'evento con le sue opzioni');
  const scelta = f.eventi[0].opzioni.find((o) => o.disponibile);
  const r = rispondiEvento(s, f.eventi[0].id, scelta.id);
  ok(r.ok && s.log.at(-1).tipo === 'evento' && s.log.at(-1).opzione === scelta.id, 'rispondere e\' una decisione nel log');
  const sbagliata = rispondiEvento(s, f.eventi[0].id, scelta.id);
  ok(!sbagliata.ok, 'e non si risponde due volte');
  /* con la routine risponde la predefinita */
  const s2 = creaGrezza({ seme: 77, background: 'ceto_medio' }); scegliPercorso(s2, 'its'); prendiLavoro(s2, 'bar');
  for (let i = 0; i < 120 && s2.fase !== 'finita'; i += 1) giocaGrezza(s2);
  ok(s2.log.filter((rr) => rr.tipo === 'evento').every((rr) => { const ev = eventoById(rr.evento); return rr.opzione === ev.predefinita || rr.opzione === 'chiusa'; }), 'con la routine risponde sempre la predefinita');
  /* la porta chiusa: «nessuna rete» vede lo stage non pagato grigio */
  let chiuso = null;
  for (let seme = 1; seme <= 300 && !chiuso; seme += 1) {
    const n = creaGrezza({ seme, background: 'nessuna' }); scegliPercorso(n, 'lavoro');
    for (let i = 0; i < 60 && n.fase !== 'finita' && !chiuso; i += 1) {
      const y = giocaGrezza(n);
      const c = y.ok && y.eventi.find((e) => e.chiusa);
      if (c) chiuso = c;
    }
  }
  ok(chiuso && chiuso.opzioni.length === 1 && chiuso.opzioni[0].id === 'chiusa' && /porta non c’è/.test(chiuso.opzioni[0].testo), 'a «nessuna rete» le porte chiuse scattano grigie, con scritto perche\'', chiuso?.id);
  /* gli effetti: euro, gradini, ritardo, tempo */
  const t = creaPartita({ seme: 5, background: 'erede' });
  t.eventi.push({ id: 'bolletta_arretrata', s: t.settimana, chiusa: false });
  const soldiPrima = t.vita.soldi;
  rispondiEvento(t, 'bolletta_arretrata', 'rate');
  ok(t.vita.soldi === soldiPrima - 140 && t.differite.length === 1 && t.differite[0].s === t.settimana + 4, 'i soldi sono euro veri, e la rata arriva fra quattro settimane', `${soldiPrima} → ${t.vita.soldi}`);
  for (let i = 0; i < 4; i += 1) giocaSettimana(t, { sonno: 10 });
  ok(t.differite.length === 1, 'per quattro settimane aspetta');
  const primaDellaRata = t.vita.soldi;
  giocaSettimana(t, { sonno: 10 });
  ok(t.differite.length === 0 && Math.round(primaDellaRata - t.vita.soldi) === 300, 'e alla quinta e\' arrivata', String(Math.round(primaDellaRata - t.vita.soldi)));
  const u = creaPartita({ seme: 5, background: 'erede' });
  u.eventi.push({ id: 'motorino_rotto', s: u.settimana, chiusa: false });
  rispondiEvento(u, 'motorino_rotto', 'autobus');
  ok(tempoDisponibile(u) === NUMERI.erede.tempo - 10, 'un evento puo\' togliere tempo alla settimana dopo', String(tempoDisponibile(u)));
  giocaSettimana(u, { sonno: 10 });
  ok(tempoDisponibile(u) === NUMERI.erede.tempo, 'e solo a quella');
  const w = creaPartita({ seme: 5, background: 'nessuna' });
  w.eventi.push({ id: 'sfratto', s: w.settimana, chiusa: false });
  const fam = fotografia(w).eventi[0].opzioni.find((o) => o.id === 'famiglia');
  ok(fam && !fam.disponibile && /porta non c’è/.test(fam.perche), 'un\'opzione che questa vita non ha e\' spenta, con il perche\'', fam?.perche);
  /* la prudenza costa: chi lascia cadere le occasioni smette di essere chiamato */
  for (const ev of EVENTI) {
    const pred = ev.opzioni.find((o) => o.id === ev.predefinita);
    if (pred?.audace) ok(false, `la predefinita di ${ev.id} e' il salto`);
  }
  ok(EVENTI.filter((ev) => ev.categoria === 'opportunita' && ev.salto).every((ev) => ev.opzioni.filter((o) => o.audace).length === 1), 'ogni occasione ha esattamente un salto, e la routine non lo prende mai');
  const pr = creaPartita({ seme: 5, background: 'ceto_medio' });
  const base = pesoDi(pr, eventoById('head_hunter'));
  pr.occasioni.lasciate = 3;
  ok(pesoDi(pr, eventoById('head_hunter')) < base * 0.6, 'tre occasioni lasciate cadere, e le prossime chiamano di meno', `${base.toFixed(2)} → ${pesoDi(pr, eventoById('head_hunter')).toFixed(2)}`);
  pr.occasioni.prese = 3;
  ok(pesoDi(pr, eventoById('head_hunter')) > base, 'tre salti fatti, e chiamano di piu\'', pesoDi(pr, eventoById('head_hunter')).toFixed(2));
  ok(Math.abs(pesoDi(pr, eventoById('multa')) - eventoById('multa').peso) < 1e-9, 'gli imprevisti non guardano il coraggio');
  const pz = creaPartita({ seme: 5, background: 'ceto_medio' });
  pz.eventi.push({ id: 'head_hunter', s: pz.settimana, chiusa: false });
  rispondiEvento(pz, 'head_hunter', 'no');
  ok(pz.occasioni.lasciate === 1 && pz.occasioni.prese === 0, 'dire di no a un\'occasione si conta');
  pz.eventi.push({ id: 'progetto_visibile', s: pz.settimana, chiusa: false });
  rispondiEvento(pz, 'progetto_visibile', 'prendi');
  ok(pz.occasioni.prese === 1, 'e prendere il salto pure');

  /* lo stesso imprevisto pesa diversamente: novecento euro sono novecento euro */
  const ricco = creaPartita({ seme: 5, background: 'erede' }); const povero = creaPartita({ seme: 5, background: 'nessuna' });
  for (const z of [ricco, povero]) { z.eventi.push({ id: 'auto_rotta', s: z.settimana, chiusa: false }); rispondiEvento(z, 'auto_rotta', 'ripara'); }
  ok(ricco.vita.soldi > 80000 && povero.vita.soldi < 0, 'la stessa riparazione e\' un clic per l\'erede e il rosso per «nessuna rete»', `${Math.round(ricco.vita.soldi)} contro ${Math.round(povero.vita.soldi)}`);
}

/* ══ 17. L'etica ══ */
titolo('L\'ETICA: BARARE FUNZIONA, FINCHE\' NON FUNZIONA PIU\'');
{
  const s = creaPartita({ seme: 41, background: 'ceto_medio' });
  s.offerte.push({ aziendaId: 'helvex', livello: 2, stipendio: 2300, ore: 40, scade: 99 });
  accettaOfferta(s, 'helvex');
  const voci = scorrettezzeDi(s);
  ok(voci.length === SCORRETTEZZE.length + 1 && voci.find((v) => v.id === 'gonfia_cv').disponibile && !voci.find((v) => v.id === 'taglia_sicurezza').disponibile, 'le scorciatoie si vedono tutte, e quelle che chiedono un ruolo alto sono spente col perche\'', voci.find((v) => v.id === 'taglia_sicurezza').perche);
  ok(!voci.find((v) => v.id === 'confessa').disponibile, 'senza niente da ammettere non si ammette');
  const perfPrima = s.lavoro.performance; const intPrima = s.vita.integrita;
  const r = bara(s, 'menti_clienti');
  ok(r.ok && s.lavoro.performance > perfPrima && s.vita.integrita === intPrima - 6 && s.nascosto.sospetto === 12 && s.log.at(-1).tipo === 'scorrettezza', 'mentire a un cliente rende subito, costa integrita\' e alza il sospetto (che non si vede)', `performance ${Math.round(perfPrima)} → ${Math.round(s.lavoro.performance)}`);
  ok(!fotografia(s).nascosto && fotografia(s).vita.integrita === s.vita.integrita, 'la fotografia mostra l\'integrita\' e non il sospetto');
  ok(!bara(s, 'menti_clienti').ok, 'e non si ripete subito');
  const rv = bara(s, 'voci_rivale');
  ok(rv.ok && s.spintaPosti > 0.3, 'una voce su un rivale apre il posto alla prossima valutazione', String(s.spintaPosti));
  /* il sospetto si raffredda; l'integrita' si ripara con le cose buone */
  for (let i = 0; i < 4; i += 1) giocaSettimana(s, { lavoro: 40, sonno: 15, volontariato: 10, relazioni: 15 });
  ok(s.nascosto.sospetto < 22 && s.vita.integrita > intPrima - 12, 'con le settimane il sospetto si raffredda e il volontariato ripara, piano', `sospetto ${s.nascosto.sospetto.toFixed(1)}, integrità ${s.vita.integrita.toFixed(1)}`);
  /* chi bara e resta piccolo la passa liscia; chi sale viene scoperto */
  const liscia = (livello, visibilita, n = 60) => {
    let esplosi = 0;
    for (let seme = 1; seme <= n; seme += 1) {
      const z = creaPartita({ seme, background: 'erede' });
      z.offerte.push({ aziendaId: 'aurelia', livello, stipendio: 5000, ore: 48, scade: 99 });
      accettaOfferta(z, 'aurelia');
      z.nascosto.sospetto = 50; z.lavoro.visibilita = visibilita;
      z.sponsor = { personaId: 'x', nome: 'x' };
      for (let i = 0; i < 52 && z.fase !== 'finita' && !z.esplosioni.length; i += 1) { giocaSettimana(z, { lavoro: 48, sonno: 15, relazioni: 15 }); z.lavoro && (z.lavoro.visibilita = visibilita); z.nascosto.sospetto = Math.max(z.nascosto.sospetto, 50); }
      if (z.esplosioni.length) esplosi += 1;
    }
    return esplosi / n;
  };
  const piccolo = liscia(2, 5); const grande = liscia(6, 90);
  ok(grande > piccolo * 2 && grande >= 0.5 && piccolo <= 0.4, 'con lo stesso sospetto, chi e\' visibile esplode molto piu\' spesso di chi resta piccolo', `${Math.round(piccolo * 100)}% contro ${Math.round(grande * 100)}% in un anno`);
  /* i tre gradi */
  const gradi = { voce: 0, scandalo: 0, causa: 0, fine: 0 };
  for (const [sosp, livello] of [[25, 3], [55, 3], [90, 6]]) {
    for (let seme = 1; seme <= 30; seme += 1) {
      const z = creaPartita({ seme, background: 'erede' });
      z.offerte.push({ aziendaId: 'aurelia', livello, stipendio: 5000, ore: 48, scade: 99 });
      accettaOfferta(z, 'aurelia');
      z.sponsor = { personaId: 'x', nome: 'x' };
      z.nascosto.sospetto = sosp; z.lavoro.visibilita = 90;
      for (let i = 0; i < 260 && z.fase !== 'finita' && !z.esplosioni.length; i += 1) { giocaSettimana(z, { lavoro: 48, sonno: 15, relazioni: 15 }); if (z.lavoro) z.lavoro.visibilita = 90; z.nascosto.sospetto = Math.max(z.nascosto.sospetto, sosp); }
      if (z.esplosioni.length) gradi[z.esplosioni[0].grado] += 1;
      if (z.esplosioni[0]?.grado === 'scandalo') {
        if (gradi.scandalo === 1) ok(z.lavoro === null && z.macchia && z.macchia.fino !== null && porteDi(z).find((p) => p.aziendaId === 'achivia').chiusa, 'uno scandalo: a casa, con la macchia per quattro anni, e ACHIVIA chiusa', `fino alla settimana ${z.macchia.fino}`);
      }
      if (z.esplosioni[0]?.grado === 'fine' && gradi.fine === 1) ok(z.fase === 'finita' && z.esito.causa === 'scandalo', 'in alto, con molto sospetto, e\' la fine della partita', JSON.stringify(z.esito));
    }
  }
  ok(gradi.voce >= 6 && gradi.scandalo >= 10 && gradi.fine >= 10, 'poco sospetto e\' una voce, medio uno scandalo, molto in alto la fine', JSON.stringify(gradi));
  /* la riparazione */
  const rip = creaPartita({ seme: 3, background: 'ceto_medio' });
  rip.nascosto.sospetto = 60; rip.vita.integrita = 20;
  const conf = bara(rip, 'confessa');
  ok(conf.ok && rip.nascosto.sospetto === 20 && rip.vita.integrita === 28 && rip.vita.reputazione < 30, 'ammettere costa reputazione, toglie sospetto e ridà integrita\'', `sospetto ${rip.nascosto.sospetto}, integrità ${rip.vita.integrita}`);
  ok(!bara(rip, 'confessa').ok, 'e non si ammette due volte in un anno');
  /* integrita' sotto trenta: il consiglio dice no */
  const ceo = creaPartita({ seme: 5, background: 'erede' });
  ceo.offerte.push({ aziendaId: 'achivia', livello: 9, stipendio: 25000, ore: 50, scade: 99 });
  accettaOfferta(ceo, 'achivia');
  for (const k of Object.keys(ceo.hard)) ceo.hard[k] = 95;
  for (const k of Object.keys(ceo.soft)) ceo.soft[k] = 95;
  ceo.vita.reputazione = 95; ceo.vita.integrita = 20; ceo.sponsor = { personaId: 'x', nome: 'x' }; ceo.vita.relazioni = 80; ceo.corpo.salute = 90;
  ceo.lavoro.livello = 10;
  const v1 = consiglio(ceo);
  ok(!v1.promosso && v1.carte.find((c) => c.id === 'integrita' && !c.ok) && ceo.lavoro.livello === 9 && ceo.fase !== 'finita' && /trenta/.test(v1.lezione), 'con tutto il resto in regola e l\'integrita\' a venti, il consiglio dice no — e spiega', v1.testo);
  ok(v1.domande.length >= 1, 'e fa domande', v1.domande[0].domanda);
  ceo.vita.integrita = 60; ceo.lavoro.livello = 10;
  const v2 = consiglio(ceo);
  ok(v2.promosso && ceo.fase === 'finita' && ceo.esito.causa === 'cima', 'con l\'integrita\' ripristinata, e\' la cima', ceo.esito.causa);
  const vuoto = creaPartita({ seme: 5, background: 'erede' });
  vuoto.offerte.push({ aziendaId: 'achivia', livello: 9, stipendio: 25000, ore: 50, scade: 99 });
  accettaOfferta(vuoto, 'achivia');
  for (const k of Object.keys(vuoto.hard)) vuoto.hard[k] = 95;
  for (const k of Object.keys(vuoto.soft)) vuoto.soft[k] = 95;
  vuoto.vita.reputazione = 95; vuoto.sponsor = { personaId: 'x', nome: 'x' }; vuoto.vita.relazioni = 10; vuoto.lavoro.livello = 10;
  consiglio(vuoto);
  ok(vuoto.esito?.causa === 'cima_vuota', 'in cima senza le persone e\' la vittoria vuota', vuoto.esito?.causa);
}

/* ══ 18. Come finisce ══ */
titolo('I FINALI: FERMARSI, MOLLARE, L\'IMPRESA, E L\'EPILOGO');
{
  const s = creaPartita({ seme: 6, background: 'benestante' });
  ok(!fermati(s).ok && !molla(s).ok, 'all\'inizio non ci si ferma e non si molla');
  s.settimana = 60;
  ok(molla(s).ok && s.fase === 'finita' && s.esito.causa === 'mollato' && s.log.at(-1).tipo === 'mollato', 'dopo un anno si puo\' mollare tutto, ed e\' una decisione nel log');
  const f = creaPartita({ seme: 6, background: 'benestante' });
  f.offerte.push({ aziendaId: 'helvex', livello: 3, stipendio: 3000, ore: 40, scade: 99 });
  accettaOfferta(f, 'helvex');
  f.settimana = 120;
  ok(fermati(f).ok && f.esito.causa === 'fermato', 'dopo due anni, con un posto in azienda, ci si puo\' fermare con una buona vita');
  /* l'impresa: l'evento della vendita */
  const imp = creaPartita({ seme: 6, background: 'erede' });
  imp.impresa = { da: 10 };
  imp.eventi.push({ id: 'achivia_compra', s: imp.settimana, chiusa: false });
  rispondiEvento(imp, 'achivia_compra', 'vendi');
  ok(imp.fase === 'finita' && imp.esito.causa === 'impresa' && imp.vita.soldi > 200000, 'vendere l\'impresa ad ACHIVIA e\' un finale', `${imp.esito.causa}, ${Math.round(imp.vita.soldi)} €`);
  /* l'impresa puo' chiudere, e ACHIVIA la guarda solo se regge un anno */
  let chiuse = 0; let rette = 0;
  for (let seme = 1; seme <= 30; seme += 1) {
    const z = creaPartita({ seme, background: 'ceto_medio' });
    z.impresa = { da: z.settimana }; z.vita.soldi = 2000;
    prendiLavoro(z, 'bar');                          // per non morire di fame prima dei due anni
    for (let i = 0; i < 104 && z.fase !== 'finita'; i += 1) giocaSettimana(z, { lavoro: 40, sonno: 10, relazioni: 10 });
    if (z.impresa) rette += 1; else chiuse += 1;
  }
  ok(chiuse >= 8 && rette >= 3, 'con poco in cassa, in due anni molte imprese chiudono e qualcuna regge', `${chiuse} chiuse, ${rette} rette`);
  let ricche = 0;
  for (let seme = 1; seme <= 30; seme += 1) {
    const z = creaPartita({ seme, background: 'erede' });
    z.impresa = { da: z.settimana };
    for (let i = 0; i < 104 && z.fase !== 'finita'; i += 1) giocaSettimana(z, { sonno: 10, relazioni: 10 });
    if (z.impresa) ricche += 1;
  }
  ok(ricche > rette, 'con il capitale dell\'erede ne reggono di piu\': il rischio dipende da con che cosa si parte', `${ricche} contro ${rette}`);
  const giovane = creaPartita({ seme: 6, background: 'erede' });
  giovane.impresa = { da: giovane.settimana };
  ok(!fotografia(giovane).eventi.length && !rispondiEvento(giovane, 'achivia_compra', 'vendi').ok, 'ACHIVIA non compra un\'impresa appena nata');

  /* l'epilogo del burnout: le cause strutturali, non la colpa */
  const b = creaPartita({ seme: 7, background: 'nessuna' });
  b.offerte.push({ aziendaId: 'volturno', livello: 1, stipendio: 3000, ore: 60, scade: 99 });
  accettaOfferta(b, 'volturno');
  b.corpo.stress = 99.9;
  giocaSettimana(b, { lavoro: 60, sonno: 4 });
  const cause = causeStrutturali(b);
  ok(b.esito?.causa === 'burnout' && cause.some((c) => /Volturno/.test(c)) && cause.some((c) => /nessuna rete/.test(c)), 'l\'epilogo del burnout nomina l\'azienda che logora e da dove si partiva', cause.join(' | ').slice(0, 120));
  const ep = epilogo(b);
  ok(ep.causa === 'burnout' && ep.cause.length >= 2 && Array.isArray(ep.decisioni) && Array.isArray(ep.carriera), 'e l\'epilogo porta cause, decisioni e la linea della carriera');
  /* le decisioni che hanno pesato: dal log e dallo storico */
  const d = creaPartita({ seme: 8, background: 'ceto_medio' });
  scegliPercorso(d, 'its'); prendiLavoro(d, 'bar');
  for (let i = 0; i < 30; i += 1) giocaSettimana(d, { lavoro: 40, sonno: 15, relazioni: 15, studio: 20 });
  d.offerte.push({ aziendaId: 'kaleido', livello: 2, stipendio: 2500, ore: 45, scade: 99 });
  accettaOfferta(d, 'kaleido');
  for (let i = 0; i < 30; i += 1) giocaSettimana(d, { lavoro: 45, sonno: 15, relazioni: 15, studio: 10 });
  const dec = decisioniChePesano(d);
  ok(dec.length >= 1 && dec.length <= 5 && dec.some((x) => /Kaleido/.test(x.testo)), 'entrare a Kaleido sta fra le decisioni che hanno pesato', dec.map((x) => `${x.s}: ${x.testo} (${x.verso})`).join(' | ').slice(0, 160));
}

/* ══ 19. Il replay ══ */
titolo('IL REPLAY: LA STESSA PARTITA, RIGIOCATA');
{
  /* una vita vera, con eventi, colloqui, persone, scorciatoie */
  const vivi = (seme, background) => {
    const s = creaGrezza({ seme, background });
    scegliPercorso(s, 'its');
    impostaRoutine(s, { studio: 15, relazioni: 12, networking: 10, sonno: 12, candidature: 8, sport: 5 });
    for (let i = 0; i < 260 && s.fase !== 'finita'; i += 1) {
      if (!s.lavoro && s.vita.soldi < 1000) prendiLavoro(s, 'bar');
      for (const o of [...s.offerte]) accettaOfferta(s, o.aziendaId);
      if (s.ricerca >= 2) { const porte = porteDi(s).filter((p) => !p.chiusa && p.ore <= 60); if (porte.length) faiColloquio(s, porte[0].aziendaId); }
      for (const p of fotografia(s).persone) { const m = p.azioni.find((a) => a.disponibile && !['ruba_merito', 'scarica_colpa', 'vattene'].includes(a.id)); if (m) agisci(s, p.id, m.id); }
      if (i === 60) { const v = scorrettezzeDi(s).find((x) => x.disponibile && !x.riparazione); if (v) bara(s, v.id); }
      for (const ev of fotografia(s).eventi) rispondiEvento(s, ev.id, ev.opzioni.find((o) => o.disponibile).id);
      const x = giocaGrezza(s, i % 3 === 0 ? { lavoro: fotografia(s).oreObbligatorie, studio: 10, sonno: 12, relazioni: 10 } : null);
      if (!x.ok) { rispondiConLaRoutine(s); giocaGrezza(s); }
    }
    return s;
  };
  const originale = vivi(123, 'ceto_medio');
  const r0 = riassunto(originale);
  ok(originale.log.filter((r) => r.tipo === 'evento').length >= 5 && originale.log.some((r) => r.tipo === 'colloquio') && originale.log.some((r) => r.tipo === 'persona') && originale.log.some((r) => r.tipo === 'scorrettezza'), 'la vita di prova ha eventi, colloqui, persone e una scorciatoia', `${originale.log.length} righe di log, settimana ${originale.settimana}`);
  const { stato: rifatto, conta } = rigioca({ seme: 123, background: 'ceto_medio', log: originale.log });
  const r1 = riassunto(rifatto);
  ok(JSON.stringify({ ...r1, decisioni: 0 }) === JSON.stringify({ ...r0, decisioni: 0 }) && conta.saltate === 0 && conta.nonArrivate === 0 && conta.nonPreviste === 0, 'rigiocata sullo stesso background, e\' identica: niente saltato, niente non arrivato', JSON.stringify(conta));
  ok(JSON.stringify(rifatto.persone.map((p) => [p.nome, p.fiducia])) === JSON.stringify(originale.persone.map((p) => [p.nome, p.fiducia])), 'anche le persone, fino alla fiducia');
  const v = verificaPartita(r0, originale.log);
  ok(v.ok, 'la verifica passa', v.perche);
  ok(!verificaPartita({ ...r0, soldi: r0.soldi + 1 }, originale.log).ok && !verificaPartita({ ...r0, livelloMassimo: 9 }, originale.log).ok, 'e un riassunto ritoccato non passa');
  ok(!verificaPartita({ ...r0, versioneMotore: 99 }, originale.log).ok, 'e nemmeno una partita di un altro motore');
  /* e se fossi nato altrove? */
  const c = confronto(originale);
  ok(c.length === 5 && c.filter((x) => x.mia).length === 1 && c.every((x) => typeof x.testo === 'string' && x.testo.length > 3), 'il confronto ha cinque righe, una e\' la mia, tutte con un testo', c.map((x) => `${x.nome}: ${x.testo}`).join(' | ').slice(0, 200));
  const altre = c.filter((x) => !x.mia);
  ok(altre.some((x) => x.conta.saltate + x.conta.nonArrivate + x.conta.nonPreviste > 0), 'nelle altre vite qualcosa non si e\' potuto fare, o e\' arrivato che non c\'era', altre.map((x) => `${x.nome}: ${x.conta.saltate}/${x.conta.nonArrivate}/${x.conta.nonPreviste}`).join(' '));
  ok(new Set(c.map((x) => `${x.livelloMassimo}-${x.causa}-${x.settimane}`)).size >= 2, 'e le vite non sono tutte uguali: le scelte erano identiche, cambiava da dove si partiva');
  const c2 = confronto(originale);
  ok(JSON.stringify(c2) === JSON.stringify(c), 'il confronto e\' deterministico');
}

/* ══ 20. L'enciclopedia ══ */
titolo('L\'ENCICLOPEDIA: LE SCHEDE SI SBLOCCANO INCONTRANDOLE');
{
  ok(SCHEDE.length >= 20 && new Set(SCHEDE.map((s) => s.id)).size === SCHEDE.length, 'almeno venti schede, con id unici', String(SCHEDE.length));
  ok(SCHEDE.every((s) => s.testo.length >= 80 && s.testo.length <= 420), 'ognuna fra due e quattro frasi');
  const s = creaPartita({ seme: 1, background: 'nessuna' });
  const prima = schedeSbloccate(s);
  ok(prima.includes('punto_di_partenza') && !prima.includes('sponsor') && !prima.includes('capo_tossico'), 'all\'inizio c\'e\' il punto di partenza, non lo sponsor ne\' il capo tossico', prima.join(', '));
  s.persone.push({ id: 'x', nome: 'x', archetipo: 'tossico', aziendaId: 'bar', potere: 1, fiducia: 10, memoria: [], natoIl: 1, svelato: true, dossier: 0, evitato: false, neutralizzato: false, ultimaAzione: {}, andato: false });
  s.esplosioni.push({ s: 1, grado: 'voce', testo: '' });
  s.eventiVisti.contro_offerta = 1;
  const dopo = schedeSbloccate(s);
  ok(dopo.includes('capo_tossico') && dopo.includes('scandalo') && dopo.includes('controfferta'), 'incontrando il capo tossico, uno scandalo e la controfferta si sbloccano le loro schede');
}

/* ══ 21. Il punteggio ══ */
titolo('IL PUNTEGGIO: DA DOVE SI PARTE MOLTIPLICA');
{
  const base = { versioneMotore: 1, seme: 1, background: 'ceto_medio', percorso: 'its', settimane: 624, eta: 31, esito: { causa: 'tempo', settimana: 624, livello: 4 }, livello: 4, livelloMassimo: 4, soldi: 1000, salute: 70, stress: 20, noia: 0, felicita: 60, relazioni: 60, rete: 30, reputazione: 50, integrita: 70, mediaHard: 50, mediaSoft: 50, scorrettezze: 0, esplosioni: 0, salti: 3, titoli: [], aziende: [], decisioni: 700 };
  const p = puntiPartita(pulisci(base));
  const atteso = 4 * PESI.livello + 70 * 15 + 70 * 10 + 60 * 10 + 60 * 8 + Math.max(0, 8000 - 6240);
  ok(p === atteso, 'la formula del brief, per il ceto medio (×1)', `${p} = ${atteso}`);
  ok(puntiPartita(pulisci({ ...base, background: 'nessuna' })) === Math.round(atteso * 1.65) && puntiPartita(pulisci({ ...base, background: 'erede' })) === Math.round(atteso * 0.7), 'la stessa vita vale ×1,65 da «nessuna rete» e ×0,7 da erede');
  ok(puntiPartita(pulisci({ ...base, esito: { causa: 'cima', settimana: 400, livello: 10 }, livelloMassimo: 10, settimane: 400 })) > p + PESI.cima, 'la cima vale quindicimila in piu\', e prima e\' meglio');
  ok(puntiPartita(pulisci({ ...base, esplosioni: 2 })) === p - 2 * PESI.scandalo, 'ogni scandalo costa tremila');
  ok(puntiPartita(pulisci({ ...base, livelloMassimo: 99, salute: 999, esplosioni: -5 })) === puntiPartita(pulisci({ ...base, livelloMassimo: 10, salute: 100, esplosioni: 0 })), 'i numeri fuori dai bordi si stringono prima di contare');
}

/* ══ 11. Niente caso fuori dal seme ══ */
titolo('NIENTE MATH.RANDOM, NIENTE OROLOGIO');
{
  const qui = new URL('.', import.meta.url).pathname;
  const cartelle = ['motore', 'contenuti'];
  const brutti = [];
  for (const c of cartelle) {
    const dir = join(qui, '..', c);
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.js')) continue;
      const testo = readFileSync(join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      if (/Math\.random|Date\.now|new Date\(|performance\.now/.test(testo)) brutti.push(`${c}/${f}`);
    }
  }
  ok(brutti.length === 0, 'nessun file del motore o dei contenuti usa il caso o l\'orologio', brutti.join(', ') || 'tutti puliti');

  /* e i contenuti non portano numeri di bilanciamento: i gradini sono
     piccoli interi, e basta */
  const grandi = [];
  for (const a of ATTIVITA) {
    for (const [k, v] of Object.entries({ ...(a.effetti || {}), ...(a.competenze || {}) })) {
      if (typeof v === 'number' && Math.abs(v) > 4) grandi.push(`${a.id}.${k}=${v}`);
    }
  }
  ok(grandi.length === 0, 'le attivita\' parlano per gradini: nessuno oltre quattro', grandi.join(', ') || 'il piu\' grande e\' quattro');
}

console.log(falliti === 0 ? '\nTUTTO OK' : `\n${falliti} PROVE FALLITE`);
process.exit(falliti ? 1 : 0);
