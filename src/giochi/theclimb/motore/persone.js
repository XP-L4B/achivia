/**
 * Le persone: chi si incontra, che cosa fa ogni settimana, che cosa si
 * puo' fare con loro, e che cosa si ricorda.
 *
 * Ogni persona ha una **fiducia** verso di te (0–100), un **potere**
 * (quanto e' in alto, sulla scala dei livelli), un **archetipo** e una
 * **memoria**: i torti e gli aiuti, con la settimana. La memoria e' la
 * meccanica che tiene insieme il gioco a lungo termine — chi hai fregato
 * se lo ricorda e puo' ricomparire duecento settimane dopo dall'altra
 * parte di un tavolo di colloquio (`pesoDelPassato`), e chi hai aiutato
 * anche.
 *
 * Tutto quello che il caso decide passa da `stato.caso`, quindi dal seme;
 * ogni mossa del giocatore e' una riga di log `{ tipo: 'persona' }`. I
 * numeri stanno in `bilancio.js` (`PERSONE`), i nomi e le schede in
 * `contenuti/persone.js`.
 */

import { PERSONE, AZIENDA, SOPRAVVIVENZA, PASSO } from '../contenuti/bilancio.js';
import { NOMI, archetipoById } from '../contenuti/persone.js';
import { AZIENDE, aziendaById } from '../contenuti/aziende.js';
import { livelloN } from '../contenuti/livelli.js';

const stretto = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

/* ─── Nascere ─── */

function nuovaPersona(stato, archetipo, { aziendaId = null, potere = 0, fiducia = 20 } = {}) {
  const usati = new Set(stato.persone.map((p) => p.nome));
  const liberi = NOMI.filter((n) => !usati.has(n));
  const nome = liberi.length ? stato.caso.scelta(liberi) : `${stato.caso.scelta(NOMI)} ${stato.persone.length}`;
  stato.contatore = (stato.contatore ?? 0) + 1;
  return {
    id: `p${stato.contatore}`,
    nome,
    archetipo,
    aziendaId,
    potere,
    fiducia,
    memoria: [],
    natoIl: stato.settimana,
    svelato: archetipoById(archetipo)?.svelato ?? true,
    dossier: 0,
    evitato: false,
    neutralizzato: false,
    ultimaAzione: {},
    andato: false,
  };
}

/** Una persona che arriva da un evento: un alleato incontrato, un mentore che si offre. */
export function aggiungiPersona(stato, archetipo, opzioni = {}) {
  if (!archetipoById(archetipo)) return null;
  const aziendaId = ['alleato', 'manipolatore', 'capo', 'capo_eccellente', 'tossico', 'hr'].includes(archetipo) ? (stato.lavoro?.aziendaId ?? null) : null;
  const p = nuovaPersona(stato, archetipo, { aziendaId, potere: opzioni.potere ?? 0, fiducia: opzioni.fiducia ?? 40 });
  stato.persone.push(p);
  return p;
}

/** I contatti con cui una vita comincia: la famiglia, per chi ce l'ha. */
export function contattiIniziali(stato, bg) {
  for (const id of bg.contattiIniziali ?? []) {
    const c = PERSONE.contatti[id];
    if (!c) continue;
    const p = nuovaPersona(stato, c.archetipo, { aziendaId: null, potere: c.potere, fiducia: c.fiducia });
    p.famiglia = true;
    stato.persone.push(p);
  }
}

/**
 * Entrando in un'azienda strutturata si incontrano il capo, un collega, HR e
 * il dirigente che potrebbe fare il tuo nome. Chi sono lo decidono i
 * numeri dell'azienda e il caso.
 */
export function nasceIlCast(stato, aziendaId) {
  const n = AZIENDA[aziendaId];
  if (!n) return [];
  const caso = stato.caso;
  const gia = stato.persone.filter((p) => p.aziendaId === aziendaId && !p.andato);
  if (gia.length) return gia;           // ci si torna: le stesse persone
  const livello = stato.lavoro?.livello ?? 0;
  const c = PERSONE.capo;
  let capo;
  if (n.management >= c.eccellenteDaManagement) capo = caso.forse(c.eccellenteSeBuono) ? 'capo_eccellente' : 'capo';
  else if (n.management <= c.tossicoFinoAManagement) capo = caso.forse(c.tossicoSeCattivo) ? 'tossico' : 'capo';
  else capo = caso.forse(c.tossicoAltrimenti) ? 'tossico' : caso.forse(c.eccellenteAltrimenti) ? 'capo_eccellente' : 'capo';
  const k = PERSONE.collega;
  const pManip = n.cultura <= k.culturaBassa ? k.manipolatoreSeBassa : k.manipolatoreAltrimenti;
  const collega = caso.forse(pManip) ? 'manipolatore' : caso.forse(k.alleatoAltrimenti) ? 'alleato' : null;
  const nati = [
    nuovaPersona(stato, capo, { aziendaId, potere: Math.min(10, livello + 1), fiducia: 30 }),
    nuovaPersona(stato, 'hr', { aziendaId, potere: 3, fiducia: 20 }),
    nuovaPersona(stato, 'sponsor', { aziendaId, potere: Math.min(n.tetto, livello + 3), fiducia: 10 }),
  ];
  if (collega) nati.push(nuovaPersona(stato, collega, { aziendaId, potere: livello, fiducia: collega === 'alleato' ? 35 : 45 }));
  stato.persone.push(...nati);
  return nati;
}

/* ─── Chi c'e' adesso ─── */

const vive = (p) => !p.andato;
const alMioFianco = (stato, p) => vive(p) && (p.aziendaId === null || (stato.lavoro && p.aziendaId === stato.lavoro.aziendaId));
export const personaById = (stato, id) => stato.persone.find((p) => p.id === id) || null;
export const sponsorDi = (stato) => (stato.sponsor ? personaById(stato, stato.sponsor.personaId) : null);

/** Le persone che contano adesso: quelle accanto, e quelle di fuori che si ricordano di te. */
export function personeVicine(stato) {
  return stato.persone.filter((p) => alMioFianco(stato, p) || p.memoria.length || p.archetipo === 'mentore' || stato.sponsor?.personaId === p.id);
}

/* ─── La settimana ─── */

/**
 * Quello che le persone fanno da sole ogni settimana. Torna niente:
 * scrive nello stato e nel perche'.
 */
export function settimanaPersone(stato, piano, perche) {
  const c = stato.corpo;
  const v = stato.vita;
  const l = stato.lavoro;
  const vero = l && !SOPRAVVIVENZA[l.aziendaId];

  /* il mentore si incontra fuori */
  const rete = (piano.networking ?? 0) + (piano.volontariato ?? 0);
  if (rete >= PERSONE.mentore.unitaMinime * 10 && !stato.persone.some((p) => p.archetipo === 'mentore' && vive(p))) {
    if (stato.caso.forse(PERSONE.mentore.probabilitaSettimanale)) {
      const m = nuovaPersona(stato, 'mentore', { aziendaId: null, potere: Math.min(10, (l?.livello ?? 0) + 4), fiducia: 30 });
      stato.persone.push(m);
      perche.push({ cosa: 'persone', quanto: null, testo: `Hai conosciuto ${m.nome}: qualcuno che sa le cose, e ha voglia di spiegartele.` });
    }
  }

  for (const p of stato.persone) {
    if (!vive(p)) continue;
    p.fiducia = stretto(p.fiducia - PERSONE.sfiatoFiducia);
    const accanto = alMioFianco(stato, p) && (p.aziendaId !== null || p.archetipo === 'mentore' || p.famiglia);
    if (!accanto) continue;

    if (p.archetipo === 'tossico' && !p.neutralizzato) {
      const forza = p.fiducia < 10 ? PERSONE.tossico.rappresaglia : 1;
      c.stress += PERSONE.tossico.stress * forza;
      c.felicita -= PERSONE.tossico.felicita * forza;
      if (l) { l.visibilita = stretto(l.visibilita - PERSONE.tossico.visibilita * forza); l.performance = stretto(l.performance - PERSONE.tossico.performance * forza); }
      if (!p.svelato && stato.settimana - p.natoIl >= PERSONE.tossico.svelaDopo) {
        p.svelato = true;
        perche.push({ cosa: 'persone', quanto: null, testo: `${p.nome} non è un capo difficile: è un capo tossico. Ti carica, si prende i meriti, ti sminuisce davanti agli altri. Hai delle opzioni, e costano tutte.` });
      } else if (p.svelato) {
        perche.push({ cosa: 'stress', quanto: +PERSONE.tossico.stress * forza, testo: `${p.nome}: un’altra settimana sotto un capo tossico.` });
      }
    }
    if (p.archetipo === 'capo_eccellente' && l) {
      l.visibilita = stretto(l.visibilita + PERSONE.capoEccellente.visibilita);
      p.fiducia = stretto(p.fiducia + PERSONE.capoEccellente.fiducia);
    }
    if (p.archetipo === 'manipolatore' && !p.neutralizzato) {
      const quota = p.evitato ? PERSONE.manipolatore.evitaQuota : 1;
      v.reputazione = stretto(v.reputazione - PERSONE.manipolatore.reputazione * quota);
      if (l) l.visibilita = stretto(l.visibilita - PERSONE.manipolatore.visibilita * quota);
      const capisce = stato.soft.intelligenza_politica >= PERSONE.manipolatore.sogliaPolitica && stato.settimana - p.natoIl >= 4;
      if (!p.svelato && (capisce || stato.settimana - p.natoIl >= PERSONE.manipolatore.svelaComunqueDopo)) {
        p.svelato = true;
        perche.push({ cosa: 'persone', quanto: null, testo: capisce
          ? `Hai capito da dove arrivano i colpi: ${p.nome}. Le idee che sparivano, le voci in giro. Adesso puoi fare qualcosa.`
          : `Ci hai messo quasi un anno, ma l’hai capito: ${p.nome} ti rema contro da sempre. Con più intelligenza politica l’avresti visto prima.` });
      }
    }
    if (p.archetipo === 'alleato' && (piano.relazioni ?? 0) > 0) p.fiducia = stretto(p.fiducia + PERSONE.alleato.fiduciaConRelazioni);
    if (p.archetipo === 'mentore') {
      if (rete > 0 || (piano.relazioni ?? 0) > 0) p.fiducia = stretto(p.fiducia + 0.5);
      for (const id of PERSONE.mentore.soft) {
        if (id in stato.soft) stato.soft[id] = stretto(stato.soft[id] + PERSONE.mentore.crescitaPassiva * PASSO.competenza * (p.fiducia / 100));
      }
    }
    if (p.archetipo === 'sponsor' && vero && p.aziendaId === l.aziendaId) {
      p.fiducia = stretto(p.fiducia + PERSONE.sponsor.daPerformance * (l.performance - 60) / 10 + PERSONE.sponsor.daVisibilita * l.visibilita);
    }
  }

  /* lo sponsor: chi ha abbastanza fiducia e abbastanza potere fa il tuo nome */
  const candidato = stato.persone
    .filter((p) => vive(p) && p.archetipo === 'sponsor' && p.fiducia >= PERSONE.sponsor.fiduciaPerSponsor && p.potere >= (l?.livello ?? 0) + 1)
    .sort((a, b) => b.potere - a.potere)[0];
  if (candidato && stato.sponsor?.personaId !== candidato.id) {
    stato.sponsor = { personaId: candidato.id, nome: candidato.nome };
    perche.push({ cosa: 'persone', quanto: null, testo: `${candidato.nome} ha cominciato a fare il tuo nome nelle stanze dove tu non sei. Hai uno sponsor.` });
  } else if (stato.sponsor) {
    const s = sponsorDi(stato);
    if (!s || !vive(s) || s.fiducia < PERSONE.sponsor.fiduciaPerPerdere) {
      perche.push({ cosa: 'persone', quanto: null, testo: `${stato.sponsor.nome} non fa più il tuo nome.` });
      stato.sponsor = null;
    }
  }
}

/** Ogni trimestre qualcuno sale, qualcuno cambia aria. E' cosi' che il passato viaggia. */
export function trimestrePersone(stato, perche) {
  const vere = AZIENDE.filter((a) => a.tipo === 'vera').map((a) => a.id);
  for (const p of stato.persone) {
    if (!vive(p) || p.archetipo === 'hr' || p.famiglia) continue;
    if (stato.caso.forse(PERSONE.trimestre.salePotere)) p.potere = Math.min(10, p.potere + 1);
    if (p.aziendaId && stato.caso.forse(PERSONE.trimestre.cambiaAzienda)) {
      const da = p.aziendaId;
      p.aziendaId = stato.caso.scelta(vere.filter((id) => id !== da));
      if (stato.lavoro?.aziendaId === da && (p.memoria.length || p.archetipo === 'tossico' || p.archetipo === 'capo_eccellente' || p.svelato)) {
        perche.push({ cosa: 'persone', quanto: null, testo: `${p.nome} se n’è andato: adesso è a ${aziendaById(p.aziendaId)?.nome}.` });
      }
    }
  }
}

/* ─── Il passato che torna ─── */

/**
 * Al colloquio in un'azienda: chi ci lavora, ha potere, e si ricorda di
 * te. Torna quanto pesa e le scene da raccontare.
 */
export function pesoDelPassato(stato, aziendaId) {
  let delta = 0;
  const scene = [];
  for (const p of stato.persone) {
    if (!vive(p) || p.aziendaId !== aziendaId || p.potere < PERSONE.passato.potereMinimo) continue;
    const torti = p.memoria.filter((m) => m.cosa === 'torto').reduce((s, m) => s + m.peso, 0);
    const aiuti = p.memoria.filter((m) => m.cosa === 'aiuto').length;
    if (torti > 0) {
      const t = Math.max(PERSONE.passato.tortoMassimo, PERSONE.passato.torto * torti);
      delta += t;
      const quando = stato.settimana - p.memoria.find((m) => m.cosa === 'torto').s;
      scene.push(`Nel panel c’è ${p.nome}. Sono passate ${quando} settimane, e se lo ricorda.`);
    } else if (aiuti > 0 && p.fiducia >= PERSONE.alleato.fiduciaPerAiuto) {
      delta += PERSONE.passato.aiuto;
      scene.push(`${p.nome} lavora qui, e ha fatto il tuo nome prima ancora che ti sedessi.`);
    }
  }
  return { delta, scene };
}

/* ─── Le mosse ─── */

/**
 * Le mosse possibili con una persona, adesso, e perche' una non lo e'.
 * Ogni voce: { id, nome, spiega, disponibile, perche, probabilita? }.
 */
export function azioniDi(stato, persona) {
  const p = persona;
  const a = archetipoById(p.archetipo);
  const s = stato.settimana;
  const l = stato.lavoro;
  const voci = [];
  const ogni = (id, n) => (p.ultimaAzione[id] !== undefined && s - p.ultimaAzione[id] < n ? `fra ${n - (s - p.ultimaAzione[id])} settimane` : null);
  const vicino = alMioFianco(stato, p);
  const aggiungi = (id, disponibile, perche = null, extra = {}) => voci.push({ id, disponibile: disponibile && vive(p), perche: !vive(p) ? 'non c’è più' : disponibile ? null : perche, ...extra });

  for (const id of a?.azioni ?? []) {
    if (id === 'consiglio') aggiungi(id, vicino && !ogni(id, PERSONE.mentore.ogniSettimane), ogni(id, PERSONE.mentore.ogniSettimane) || 'non è qui');
    if (id === 'proponi') aggiungi(id, vicino && Boolean(l) && !ogni(id, PERSONE.sponsor.ogniSettimane), !l ? 'senza un lavoro non c’è niente da proporre' : ogni(id, PERSONE.sponsor.ogniSettimane) || 'non è qui', { probabilita: l && l.performance >= PERSONE.sponsor.performanceMinima ? 1 : 0 });
    if (id === 'documenta') aggiungi(id, vicino && p.svelato && !p.neutralizzato && !ogni(id, 1), 'niente da documentare');
    if (id === 'hr') aggiungi(id, vicino && p.svelato && !p.neutralizzato && !ogni(id, 13), ogni(id, 13) || 'niente da dire a HR', { probabilita: probabilitaHr(stato, p) });
    if (id === 'appello') aggiungi(id, vicino && p.svelato && !p.neutralizzato && Boolean(sponsorDi(stato)) && (sponsorDi(stato)?.potere ?? 0) > p.potere && !ogni(id, 13), !sponsorDi(stato) ? 'serve uno sponsor' : (sponsorDi(stato)?.potere ?? 0) <= p.potere ? 'il tuo sponsor non sta più in alto di lui' : ogni(id, 13) || 'già fatto', { probabilita: PERSONE.tossico.appelloBase });
    if (id === 'vattene') aggiungi(id, vicino && p.svelato && Boolean(l), 'non c’è un posto da lasciare');
    if (id === 'confronta') aggiungi(id, vicino && p.svelato && !p.neutralizzato && !ogni(id, 13), ogni(id, 13) || 'non sai ancora chi è', { probabilita: probabilitaConfronto(stato) });
    if (id === 'evita') aggiungi(id, vicino && p.svelato && !p.evitato && !p.neutralizzato, p.evitato ? 'già a distanza' : 'non sai ancora chi è');
    if (id === 'aiuta') aggiungi(id, vicino && !ogni(id, PERSONE.alleato.ogniSettimane), ogni(id, PERSONE.alleato.ogniSettimane) || 'non è qui');
    if (id === 'chiedi') aggiungi(id, vicino && p.fiducia >= PERSONE.alleato.fiduciaPerAiuto && Boolean(l) && !ogni(id, 13), p.fiducia < PERSONE.alleato.fiduciaPerAiuto ? `serve più fiducia (${Math.round(p.fiducia)} su ${PERSONE.alleato.fiduciaPerAiuto})` : ogni(id, 13) || 'senza un lavoro non serve');
  }
  /* le scorrettezze: con chi lavora accanto a te, e ha qualcosa da rubare */
  if (vicino && l && p.aziendaId === l.aziendaId && ['alleato', 'manipolatore', 'capo', 'capo_eccellente'].includes(p.archetipo)) {
    aggiungi('ruba_merito', !ogni('ruba_merito', 13), ogni('ruba_merito', 13));
    aggiungi('scarica_colpa', !ogni('scarica_colpa', 13), ogni('scarica_colpa', 13));
  }
  return voci;
}

const probabilitaHr = (stato, p) => {
  const n = stato.lavoro ? AZIENDA[stato.lavoro.aziendaId] : null;
  return stretto(PERSONE.tossico.hrBase + PERSONE.tossico.hrPerDossier * p.dossier + PERSONE.tossico.hrPerCultura * ((n?.cultura ?? 5) - 5), 0.05, 0.9, 0);
};
const probabilitaConfronto = (stato) => stretto(PERSONE.manipolatore.confrontaBase + PERSONE.manipolatore.confrontaPerPolitica * stato.soft.intelligenza_politica + PERSONE.manipolatore.confrontaPerComunicazione * stato.soft.comunicazione, 0.05, 0.9, 0);

/**
 * Fare una mossa. E' una decisione: nel log, e il caso — se serve —
 * consuma un passo dal seme. Torna l'esito con il testo.
 */
export function agisci(stato, personaId, azione) {
  if (stato.fase === 'finita') return { ok: false, errore: 'La partita è finita.' };
  const p = personaById(stato, personaId);
  if (!p) return { ok: false, errore: 'Persona sconosciuta.' };
  const voce = azioniDi(stato, p).find((v) => v.id === azione);
  if (!voce) return { ok: false, errore: 'Con questa persona non si può fare.' };
  if (!voce.disponibile) return { ok: false, errore: `Adesso no: ${voce.perche}.` };
  const c = stato.corpo; const v = stato.vita; const l = stato.lavoro;
  p.ultimaAzione[azione] = stato.settimana;
  stato.log.push({ s: stato.settimana, tipo: 'persona', persona: p.id, azione });
  const esito = { ok: true, azione, persona: p.nome, testo: '' };

  switch (azione) {
    case 'consiglio': {
      const soft = p.archetipo === 'mentore' ? PERSONE.mentore.soft : ['comunicazione', 'lavoro_di_squadra'];
      for (const id of soft) stato.soft[id] = stretto(stato.soft[id] + PERSONE.mentore.gradiniConsiglio * PASSO.competenza * 3);
      p.fiducia = stretto(p.fiducia + 5);
      esito.testo = `${p.nome} ti ha dato un’ora. Ne esci con qualcosa in più su ${soft.map((s) => s.replace(/_/g, ' ')).join(' e ')}.`;
      break;
    }
    case 'proponi': {
      if (l.performance >= PERSONE.sponsor.performanceMinima) {
        l.visibilita = stretto(l.visibilita + PERSONE.sponsor.proponiVisibilita);
        p.fiducia = stretto(p.fiducia + PERSONE.sponsor.proponiFiducia);
        esito.testo = `${p.nome} ha guardato il progetto e ha guardato te. Ti sei fatto vedere per la ragione giusta.`;
      } else {
        p.fiducia = stretto(p.fiducia - PERSONE.sponsor.proponiPenale);
        esito.testo = `${p.nome} ha chiesto come stessero andando le cose che hai già in mano. Non era il momento.`;
      }
      break;
    }
    case 'documenta': {
      p.dossier += 1;
      c.stress += PERSONE.tossico.dossierStress;
      esito.testo = `Date, mail, testimoni. Il dossier su ${p.nome} cresce: ${p.dossier} ${p.dossier === 1 ? 'settimana' : 'settimane'}.`;
      break;
    }
    case 'hr': {
      const pr = probabilitaHr(stato, p);
      const va = stato.caso.numero() < pr;
      if (va) {
        p.neutralizzato = true;
        v.reputazione = stretto(v.reputazione + PERSONE.tossico.hrReputazioneSeVa);
        esito.testo = `HR ha ascoltato, e stavolta ha funzionato: ${p.nome} è stato spostato. Avevi ${Math.round(pr * 100)} probabilità su cento${p.dossier ? ', e il dossier ha pesato' : ''}.`;
      } else {
        v.reputazione = stretto(v.reputazione - PERSONE.tossico.hrReputazioneSeNo);
        c.stress += PERSONE.tossico.hrStressSeNo;
        p.fiducia = stretto(p.fiducia - 30);
        esito.testo = `HR ha ascoltato, ha preso nota, e ha protetto l’azienda. Avevi ${Math.round(pr * 100)} probabilità su cento. Adesso ${p.nome} lo sa, e la voce è che sei tu quello difficile.`;
      }
      break;
    }
    case 'appello': {
      const va = stato.caso.numero() < PERSONE.tossico.appelloBase;
      const s = sponsorDi(stato);
      if (va) { p.neutralizzato = true; esito.testo = `${s.nome} ha fatto una telefonata. ${p.nome} da domani ha altro a cui pensare.`; }
      else { s.fiducia = stretto(s.fiducia - PERSONE.tossico.appelloPenale); esito.testo = `${s.nome} ha ascoltato e non ha mosso un dito: non era una battaglia sua. Hai speso un po’ della sua fiducia.`; }
      break;
    }
    case 'confronta': {
      const pr = probabilitaConfronto(stato);
      const va = stato.caso.numero() < pr;
      if (va) { p.neutralizzato = true; v.reputazione = stretto(v.reputazione + 2); esito.testo = `L’hai affrontato davanti a chi doveva sentire, con le date in mano. ${p.nome} ha smesso. Avevi ${Math.round(pr * 100)} probabilità su cento.`; }
      else { v.reputazione = stretto(v.reputazione - PERSONE.manipolatore.confrontaReputazioneSeNo); esito.testo = `Ti sei scaldato, lui no. La voce in giro adesso è che il problema sei tu. Avevi ${Math.round(pr * 100)} probabilità su cento.`; }
      break;
    }
    case 'evita': {
      p.evitato = true;
      esito.testo = `Niente più idee condivise con ${p.nome}. Il danno si dimezza; non sparisce.`;
      break;
    }
    case 'aiuta': {
      c.stress += PERSONE.alleato.aiutaStress;
      p.fiducia = stretto(p.fiducia + PERSONE.alleato.aiutaFiducia);
      p.memoria.push({ s: stato.settimana, cosa: 'aiuto', peso: 1 });
      esito.testo = `Hai dato una mano a ${p.nome} quando gli serviva. Non lo dimentica.`;
      break;
    }
    case 'chiedi': {
      l.performance = stretto(l.performance + PERSONE.alleato.chiediPerformance);
      l.visibilita = stretto(l.visibilita + 3);
      esito.testo = `${p.nome} ti ha coperto su una cosa, e ha fatto il tuo nome su un’altra.`;
      break;
    }
    case 'ruba_merito': {
      const r = PERSONE.rubaMerito;
      l.performance = stretto(l.performance + r.performance);
      l.visibilita = stretto(l.visibilita + r.visibilita);
      v.integrita = stretto(v.integrita - r.integrita);
      stato.nascosto.sospetto = stretto(stato.nascosto.sospetto + r.sospetto);
      p.fiducia = stretto(p.fiducia - r.fiducia);
      p.memoria.push({ s: stato.settimana, cosa: 'torto', peso: r.peso, quale: 'merito' });
      esito.testo = `Il lavoro era di ${p.nome}; il nome sul risultato è il tuo. Ha funzionato. Lui lo sa.`;
      break;
    }
    case 'scarica_colpa': {
      const r = PERSONE.scaricaColpa;
      c.stress = stretto(c.stress - r.stress);
      l.performance = stretto(l.performance + r.performance);
      v.integrita = stretto(v.integrita - r.integrita);
      stato.nascosto.sospetto = stretto(stato.nascosto.sospetto + r.sospetto);
      p.fiducia = stretto(p.fiducia - r.fiducia);
      p.memoria.push({ s: stato.settimana, cosa: 'torto', peso: r.peso, quale: 'colpa' });
      esito.testo = `L’errore era tuo, la colpa è di ${p.nome}. Per questa settimana dormi meglio.`;
      break;
    }
    case 'vattene':
      esito.testo = 'Te ne vai.';
      esito.lascia = true;
      break;
    default:
      break;
  }
  return esito;
}

/** Una persona come la vede il giocatore. */
export function schedaPersona(stato, p) {
  const a = p.svelato ? archetipoById(p.archetipo) : null;
  return {
    id: p.id,
    nome: p.nome,
    archetipo: p.svelato ? p.archetipo : (p.archetipo === 'tossico' ? 'capo' : 'collega'),
    ruolo: a ? a.nome : (p.archetipo === 'tossico' ? 'Il capo' : 'Un collega'),
    spiega: a?.spiega ?? null,
    dove: p.aziendaId ? aziendaById(p.aziendaId)?.nome ?? p.aziendaId : (p.famiglia ? 'di famiglia' : 'fuori dal lavoro'),
    potere: p.potere,
    potereNome: livelloN(Math.min(10, p.potere)).nome,
    fiducia: Math.round(p.fiducia),
    memoria: p.memoria.map((m) => ({ ...m })),
    svelato: p.svelato,
    neutralizzato: p.neutralizzato,
    evitato: p.evitato,
    dossier: p.dossier,
    sponsor: stato.sponsor?.personaId === p.id,
    vicino: alMioFianco(stato, p),
    andato: p.andato,
    azioni: azioniDi(stato, p),
  };
}
