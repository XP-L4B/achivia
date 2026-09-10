/**
 * L'etica: barare funziona, finche' non funziona piu'.
 *
 * Ogni scorrettezza (`contenuti/scorrettezze.js`) da' un vantaggio subito,
 * abbassa l'**integrita'** — che il giocatore vede — e alza il
 * **sospetto** — che non vede. Ogni settimana il caso tira: la
 * probabilita' che esploda e' sospetto × visibilita' (`ETICA`), quindi
 * cresce salendo. Quando esplode, dipende da quanto sospetto c'e': una
 * voce, uno scandalo con il posto perso e una macchia, o — in alto — la
 * fine.
 *
 * E dall'altra parte: l'integrita' si ripara, piano, con le cose buone
 * (volontariato, le persone), e con un salto — ammettere — che costa
 * reputazione adesso. Sotto trenta di integrita' ACHIVIA non ti fa CEO,
 * e lo si scopre li'.
 */

import { ETICA, SOPRAVVIVENZA } from '../contenuti/bilancio.js';
import { SCORRETTEZZE, scorrettezzaById, RIPARAZIONE } from '../contenuti/scorrettezze.js';
import { aziendaById } from '../contenuti/aziende.js';
import { condizioneVale, applicaEffetti } from './eventi.js';

const stretto = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

/* ─── Che cosa si puo' fare ─── */

/** Le scorrettezze possibili adesso, con il perche' di quelle che non lo sono. */
export function scorrettezzeDi(stato) {
  const s = stato.settimana;
  const voci = SCORRETTEZZE.map((sc) => {
    const ultima = stato.scorrettezze[sc.id];
    const presto = ultima !== undefined && s - ultima < sc.ogni;
    const condizione = condizioneVale(stato, sc.quando);
    return {
      id: sc.id, nome: sc.nome, testo: sc.testo, spiega: sc.spiega,
      integrita: sc.integrita,
      disponibile: condizione && !presto && stato.fase !== 'finita',
      perche: !condizione ? (sc.quando.livelloMin !== undefined && (stato.lavoro?.livello ?? 0) < sc.quando.livelloMin ? 'serve un ruolo più alto' : 'serve un posto in azienda') : presto ? `fra ${sc.ogni - (s - ultima)} settimane` : null,
    };
  });
  const ultimaConf = stato.scorrettezze[RIPARAZIONE.id];
  const prestoConf = ultimaConf !== undefined && s - ultimaConf < ETICA.confessaOgni;
  voci.push({
    id: RIPARAZIONE.id, nome: RIPARAZIONE.nome, testo: RIPARAZIONE.testo, spiega: RIPARAZIONE.spiega, riparazione: true,
    disponibile: stato.nascosto.sospetto > 0 && !prestoConf && stato.fase !== 'finita',
    perche: stato.nascosto.sospetto <= 0 ? 'non hai niente da ammettere' : prestoConf ? `fra ${ETICA.confessaOgni - (s - ultimaConf)} settimane` : null,
  });
  return voci;
}

/** Farla. E' una decisione: nel log. Il vantaggio arriva subito. */
export function bara(stato, id) {
  if (stato.fase === 'finita') return { ok: false, errore: 'La partita è finita.' };
  const voce = scorrettezzeDi(stato).find((v) => v.id === id);
  if (!voce) return { ok: false, errore: 'Scorrettezza sconosciuta.' };
  if (!voce.disponibile) return { ok: false, errore: `Adesso no: ${voce.perche}.` };
  stato.scorrettezze[id] = stato.settimana;
  stato.log.push({ s: stato.settimana, tipo: 'scorrettezza', quale: id });
  if (id === RIPARAZIONE.id) {
    stato.vita.reputazione = stretto(stato.vita.reputazione - ETICA.confessaReputazione);
    stato.nascosto.sospetto = stretto(stato.nascosto.sospetto - ETICA.confessaSospetto);
    stato.vita.integrita = stretto(stato.vita.integrita + ETICA.confessaIntegrita);
    stato.contaScorrettezze.riparazioni += 1;
    return { ok: true, id, nome: voce.nome, testo: 'L’hai detto tu, prima che lo dicesse qualcun altro. La reputazione ne risente adesso; il resto comincia a risalire.' };
  }
  const sc = scorrettezzaById(id);
  const perche = applicaEffetti(stato, sc.effetti, [], sc.nome);
  stato.vita.integrita = stretto(stato.vita.integrita - sc.integrita);
  stato.nascosto.sospetto = stretto(stato.nascosto.sospetto + sc.sospetto);
  stato.contaScorrettezze.fatte += 1;
  return { ok: true, id, nome: sc.nome, testo: `Fatto. ${sc.spiega}`, perche };
}

/* ─── La settimana ─── */

/**
 * Ogni settimana: il sospetto si raffredda, l'integrita' si ripara con
 * le cose buone, e il caso tira. Torna l'esplosione, se c'e' stata.
 */
export function settimanaEtica(stato, piano, perche) {
  const v = stato.vita;
  const n = stato.nascosto;
  if (n.sospetto > 0) n.sospetto = stretto(n.sospetto - ETICA.sfiatoSospetto);
  if (v.integrita < ETICA.integritaTetto) {
    if ((piano.volontariato ?? 0) > 0) v.integrita = stretto(v.integrita + ETICA.integritaPerVolontariato);
    if ((piano.relazioni ?? 0) > 0) v.integrita = stretto(v.integrita + ETICA.integritaPerRelazioni);
  }
  if (stato.macchia && stato.macchia.fino !== null && stato.settimana >= stato.macchia.fino) {
    stato.macchia = null;
    perche.push({ cosa: 'etica', quanto: null, testo: 'Sono passati quattro anni: dello scandalo non parla più nessuno.' });
  }

  /* il tiro si fa sempre: il caso consuma un passo qualunque sia il sospetto */
  const visibilita = stato.lavoro?.visibilita ?? 0;
  const p = n.sospetto > 0 ? ETICA.esplosioneBase * (n.sospetto / 100) ** 2 * (ETICA.visibilitaMinima + visibilita / 100) : 0;
  const tiro = stato.caso.numero();
  if (n.sospetto <= 0 || tiro >= p) return null;
  return esplosione(stato, perche);
}

function esplosione(stato, perche) {
  const v = stato.vita;
  const n = stato.nascosto;
  const livello = stato.lavoro?.livello ?? 0;
  const dove = stato.lavoro ? aziendaById(stato.lavoro.aziendaId)?.nome : null;
  stato.contaScorrettezze.esplosioni += 1;
  let e;
  if (n.sospetto < ETICA.voce || livello < ETICA.scandaloDaLivello) {
    v.reputazione = stretto(v.reputazione - ETICA.voceReputazione);
    if (stato.lavoro) stato.lavoro.visibilita = stretto(stato.lavoro.visibilita - ETICA.voceVisibilita);
    n.sospetto = stretto(n.sospetto - ETICA.voceSospetto);
    e = { grado: 'voce', testo: 'Gira una voce su di te. Niente di provato — ma la reputazione ne risente, e qualcuno ha cominciato a guardare.' };
  } else if (n.sospetto < ETICA.scandalo || livello < ETICA.fineDaLivello) {
    const grosso = n.sospetto >= ETICA.scandalo;
    v.reputazione = stretto(v.reputazione - ETICA.scandaloReputazione);
    v.soldi += grosso ? ETICA.causaSoldi : ETICA.scandaloSoldi;
    n.sospetto = stretto(n.sospetto - ETICA.scandaloSospetto);
    const perSempre = livello >= ETICA.macchiaPerSempreDa;
    stato.macchia = { s: stato.settimana, fino: perSempre ? null : stato.settimana + ETICA.macchiaDura, livello };
    if (stato.lavoro && !SOPRAVVIVENZA[stato.lavoro.aziendaId]) stato.lavoro = null;
    e = { grado: grosso ? 'causa' : 'scandalo', testo: grosso
      ? `Lo scandalo è esploso, e con lo scandalo una causa: ${dove ? `${dove} ti ha lasciato a casa` : 'hai perso il posto'}, ${Math.abs(ETICA.causaSoldi).toLocaleString('it-IT')} € di spese legali, e la macchia resta${perSempre ? ' per sempre' : ' per quattro anni'}.`
      : `È esploso: ${dove ? `${dove} ti ha lasciato a casa` : 'hai perso il posto'}, la reputazione è a pezzi, e per quattro anni chi ti cerca lo trova. ACHIVIA, per adesso, non ti guarda.` };
  } else {
    e = { grado: 'fine', testo: 'È esploso tutto, e tu eri troppo in alto per farlo passare come una voce. Cause, giornali, il nome. È finita qui.' };
    stato.fase = 'finita';
    stato.esito = { causa: 'scandalo', settimana: stato.settimana, livello };
  }
  perche.push({ cosa: 'etica', quanto: null, testo: e.testo });
  stato.esplosioni.push({ s: stato.settimana, ...e });
  if (stato.esplosioni.length > 8) stato.esplosioni.shift();
  return e;
}

/** La macchia, per chi guarda le porte: c'e', e fino a quando. */
export const macchiaDi = (stato) => (stato.macchia ? { da: stato.macchia.s, fino: stato.macchia.fino, perSempre: stato.macchia.fino === null } : null);

/** Quanto pesa sulla probabilita' di un colloquio avere una macchia: la meta'. */
export const pesoMacchia = (stato) => (stato.macchia ? 0.5 : 1);

export { RIPARAZIONE };
