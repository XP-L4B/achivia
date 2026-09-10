/**
 * IL CASTELLO — la dashboard con cui si tiene in piedi l'applicazione.
 *
 * Non e' un'area di Achivia come le altre: e' il posto da cui si guarda
 * Achivia. Quanti account ci sono e quanti se ne aggiungono, quante
 * organizzazioni sono aperte e di che tipo, quanti crediti si muovono e
 * per quale ragione, quanto entra al mese, che cosa si vende e a che
 * prezzo. Serve a fare due cose senza toccare il codice: capire come va, e
 * cambiare quello che si vende.
 *
 * Ci si entra con un account suo, come per il negozio e per l'osservatorio:
 * non c'e' permesso, ruolo o abbonamento che ci porti dentro. Si consegna a
 * mano e basta.
 *
 * ─── Sull'identita' delle persone ─────────────────────────────────────
 *
 * Il Castello e' anche il CRM, e un CRM che non sa con chi ha a che fare
 * non serve a niente. Ma "sapere con chi si ha a che fare" ha due livelli,
 * e tenerli separati e' l'unica cosa che rende questa dashboard difendibile:
 *
 *   il primo e' operativo — numero Achivia, email, quando si e' iscritto,
 *   quando si e' fatto vedere l'ultima volta, che cosa ha comprato, quanti
 *   crediti ha mosso e perche'. Serve tutti i giorni, e si vede sempre.
 *
 *   il secondo e' l'identita' anagrafica — il nome e il cognome dati alla
 *   registrazione. Serve di rado: quando c'e' un pagamento da verificare,
 *   una contestazione, una richiesta dell'autorita'. Si vede a richiesta,
 *   una persona alla volta, dichiarando perche', e ogni volta resta scritto
 *   chi ha guardato, chi ha guardato e quando.
 *
 * Il registro delle occhiate non e' burocrazia: e' quello che trasforma
 * "posso vedere tutto" in "posso vedere tutto e ne rispondo", ed e' la
 * differenza fra un CRM e uno schedario. Costa un clic e un motivo.
 */

import {
  getUsers, getUserById, getOrganizzazioni, membriDiOrg, orgPremium, tipoOrg,
  getAbbonamenti, movimenti, contoMovimenti, creditiInCircolo, casseTotali, creditiInCassa,
  giorniDaUltimoAccesso,
  pianoDiOrg, getPiani, getPacchetti, getOfferte, offertaValida, euro, contatoreAi,
  daRinnovare, getPagamenti, copertoFinoAl,
  db, ensureCastello, nuovoId, save,
} from './db';
import { nomePubblico } from './identita';

/* ─── Chi puo' entrare ───────────────────────────────────────*/

/**
 * Solo l'account del Castello, e non c'e' una seconda strada.
 *
 * Nessun permesso ci porta dentro, nessun ruolo su misura, nessun
 * abbonamento: e' un controllo sul ruolo e basta, come per il negozio e per
 * l'osservatorio. Un'area che si apre "anche a chi ha il permesso X" e'
 * un'area che prima o poi si apre a qualcuno che non doveva entrarci.
 */
export const puoEntrareNelCastello = (persona) => persona?.role === 'castle';

const vietato = { ok: false, errore: 'Questa dashboard non e’ tua.' };

/* ─── Le finestre di tempo ───────────────────────────────────*/

/**
 * Le finestre fisse. Sono quelle che si guardano davvero: due giorni per
 * sapere se qualcosa si e' rotto stanotte, una settimana per il polso, due
 * e un mese per la tendenza, poi il trimestre e l'anno.
 */
export const FINESTRE = [
  { id: '2g', nome: '2 giorni', giorni: 2 },
  { id: '7g', nome: '7 giorni', giorni: 7 },
  { id: '15g', nome: '15 giorni', giorni: 15 },
  { id: '30g', nome: '30 giorni', giorni: 30 },
  { id: '90g', nome: '90 giorni', giorni: 90 },
  { id: 'anno', nome: '1 anno', giorni: 365 },
  { id: 'sempre', nome: 'Sempre', giorni: null },
];

/**
 * Da un'identificazione di finestra alle due date che la delimitano.
 *
 * `personalizzata` con `da`/`a` copre il caso che le finestre fisse non
 * coprono mai: "com'e' andato dicembre", che non e' nessuno dei numeri qui
 * sopra e che si chiede appena finisce dicembre.
 */
export function finestraDa(id, { da, a } = {}, adesso = Date.now()) {
  if (id === 'personalizzata') {
    return {
      id, nome: 'Periodo scelto',
      da: da ? new Date(da).toISOString() : null,
      a: a ? new Date(`${String(a).slice(0, 10)}T23:59:59.999Z`).toISOString() : null,
    };
  }
  const f = FINESTRE.find((x) => x.id === id) || FINESTRE[1];
  return {
    id: f.id,
    nome: f.nome,
    da: f.giorni == null ? null : new Date(adesso - f.giorni * 86400000).toISOString(),
    a: null,
  };
}

const dentro = (iso, { da, a }) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (da && t < new Date(da).getTime()) return false;
  if (a && t > new Date(a).getTime()) return false;
  return true;
};

/* ─── Il polso ───────────────────────────────────────────────*/

/**
 * Quanti account, quanti nuovi, quanti vivi.
 *
 * I nuovi si contano solo fra quelli con una data vera: gli account nati
 * prima che la data esistesse ne hanno una ricostruita all'avvio, ed e'
 * segnata come stima apposta per poterla lasciare fuori da questo conto.
 * Contarla vorrebbe dire vedere seicento iscrizioni il giorno in cui si e'
 * aggiornata l'applicazione, che e' peggio che non vedere niente.
 */
export function polsoAccount(finestra, adesso = Date.now()) {
  const tutti = getUsers().filter((u) => !['shop', 'osservatorio', 'castle'].includes(u.role));
  const nuovi = tutti.filter((u) => !u.dataStimata && dentro(u.creatoIl, finestra));
  const attivi = (giorni) => tutti.filter((u) => {
    const d = giorniDaUltimoAccesso(u, adesso);
    return d !== null && d < giorni;
  }).length;
  return {
    totali: tutti.length,
    nuovi: nuovi.length,
    stimati: tutti.filter((u) => u.dataStimata).length,
    // Chi non e' in nessuna organizzazione: sono gli account che si sono
    // fermati sulla soglia, ed e' il numero che dice se il primo passo
    // dell'applicazione funziona.
    senzaOrg: tutti.filter((u) => !u.orgId && !suoiMembri(u.id)).length,
    attivi: { 2: attivi(2), 7: attivi(7), 15: attivi(15), 30: attivi(30) },
    mai: tutti.filter((u) => giorniDaUltimoAccesso(u, adesso) === null).length,
  };
}

const suoiMembri = (userId) =>
  (db.membri || []).some((m) => m.userId === userId && !m.uscitoIl);

/**
 * Le organizzazioni: quante ce ne sono, di che tipo, quante pagano.
 *
 * Le chiuse si contano a parte e non si sommano alle aperte: un'insegna
 * chiusa e' storia, non clientela, e sommarle e' il modo piu' comune di
 * raccontarsi che un'applicazione sta crescendo mentre non cresce.
 */
export function polsoOrganizzazioni(finestra) {
  const tutte = getOrganizzazioni();
  const aperte = tutte.filter((o) => !o.chiusaIl);
  const conta = (righe, tipo) => righe.filter((o) => tipoOrg(o.id) === tipo).length;
  return {
    aperte: aperte.length,
    chiuse: tutte.length - aperte.length,
    aziende: conta(aperte, 'azienda'),
    gruppi: conta(aperte, 'personalizzata'),
    paganti: aperte.filter((o) => orgPremium(o.id)).length,
    nate: tutte.filter((o) => dentro(o.creataIl, finestra)).length,
    chiusaNel: tutte.filter((o) => dentro(o.chiusaIl, finestra)).length,
    persone: aperte.reduce((s, o) => s + membriDiOrg(o.id).length, 0),
    // La piu' grande dice quanto in alto arriva il prodotto: se il massimo
    // sono sei persone, i piani da venti posti li sta comprando nessuno.
    massimo: aperte.reduce((max, o) => Math.max(max, membriDiOrg(o.id).length), 0),
  };
}

/** I crediti mossi nella finestra, divisi per causale. */
export const polsoCrediti = (finestra) => ({
  ...contoMovimenti({ da: finestra.da, a: finestra.a }),
  inCircolo: creditiInCircolo(),
  // I crediti fermi nelle casse delle organizzazioni: sono gia' usciti dal
  // listino ma non sono ancora arrivati a nessuno, e vanno contati a parte
  // — sommarli ai portafogli farebbe sembrare in mano alle persone crediti
  // che nessuna persona ha.
  inCassa: casseTotali(),
});

/**
 * Il denaro: quanto entra al mese dagli abbonamenti in corso.
 *
 * E' una previsione, non un incasso, e va letta per quello che e': la somma
 * dei piani di chi in questo momento ha un abbonamento aperto, portata al
 * mese. I pagamenti veri non passano ancora da qui — quando passeranno,
 * questo numero avra' accanto quello vero e si potranno confrontare.
 */
export function polsoDenaro() {
  const aperte = getOrganizzazioni().filter((o) => !o.chiusaIl && orgPremium(o.id));
  let mensile = 0;
  const perPiano = {};
  for (const o of aperte) {
    const p = pianoDiOrg(o.id);
    const alMese = p.periodicita === 'annuale' ? Math.round(p.prezzo / 12) : p.prezzo;
    mensile += alMese;
    const voce = (perPiano[p.id] ||= { id: p.id, nome: p.nome, quante: 0, mensile: 0 });
    voce.quante += 1;
    voce.mensile += alMese;
  }
  return {
    mensile,
    annuo: mensile * 12,
    scritto: euro(mensile),
    paganti: aperte.length,
    perPiano: Object.values(perPiano).sort((a, b) => b.mensile - a.mensile),
  };
}

/**
 * Quello che e' stato incassato davvero, nella finestra.
 *
 * Sta accanto al ricavo atteso e non al suo posto: uno dice quanto valgono
 * gli abbonamenti aperti, l'altro quanto e' entrato. Quando i due numeri si
 * allontanano c'e' qualcuno che risulta abbonato e non paga, ed e' il buco
 * che nessun altro numero mostra.
 */
export function polsoIncasso(finestra) {
  const righe = getPagamenti().filter((p) => dentro(p.quando, finestra));
  return {
    quanti: righe.length,
    incassato: righe.reduce((s, p) => s + (Number(p.importo) || 0), 0),
    creditiDati: righe.reduce((s, p) => s + (Number(p.creditiDati) || 0), 0),
    daRinnovare: daRinnovare().length,
  };
}

/** Tutto il polso in una chiamata: e' quello che serve alla schermata. */
export const ilPolso = (finestra, adesso = Date.now()) => ({
  finestra,
  account: polsoAccount(finestra, adesso),
  organizzazioni: polsoOrganizzazioni(finestra),
  crediti: polsoCrediti(finestra),
  denaro: polsoDenaro(),
  incasso: polsoIncasso(finestra),
  listino: {
    piani: getPiani().filter((p) => p.attivo).length,
    pacchetti: getPacchetti().filter((p) => p.attivo).length,
    offerteInCorso: getOfferte().filter((o) => offertaValida(o, adesso)).length,
  },
});

/* ─── Le organizzazioni, una per una ─────────────────────────*/

/**
 * L'elenco delle organizzazioni come lo guarda chi le vende.
 *
 * Non c'e' il nome di nessuna persona: il proprietario e' un numero
 * Achivia. Per sapere chi e' si passa dal CRM, che e' il posto in cui
 * guardare qualcuno lascia una traccia.
 */
export function elencoOrganizzazioni({ adesso = Date.now() } = {}) {
  return getOrganizzazioni().map((o) => {
    const membri = membriDiOrg(o.id);
    const piano = pianoDiOrg(o.id);
    const proprietario = getUserById(o.proprietarioId);
    const vivi = membri.filter((m) => {
      const d = giorniDaUltimoAccesso(getUserById(m.userId), adesso);
      return d !== null && d < 30;
    }).length;
    const abbonamento = getAbbonamenti().find((a) => a.orgId === o.id && !a.a) || null;
    // Quanto usano l'assistente: e' la misura piu' diretta di quanto un
    // piano venga davvero consumato, e quella che dice se il tetto e' largo
    // o stretto per come lo si e' venduto.
    const ai = contatoreAi(o.id);
    return {
      id: o.id,
      nome: o.nome || o.id,
      codice: o.codice || '',
      tipo: tipoOrg(o.id),
      chiusa: Boolean(o.chiusaIl),
      chiusaIl: o.chiusaIl ?? null,
      creataIl: o.creataIl ?? null,
      piano: piano.nome,
      pianoId: piano.id,
      prezzo: piano.prezzo,
      paga: orgPremium(o.id),
      // Da quando paga: e' l'eta' del cliente, ed e' l'unica cosa che dice
      // se un abbonamento sta reggendo o e' appena cominciato.
      pagaDal: abbonamento?.da ?? null,
      copertaFinoAl: copertoFinoAl(o.id),
      persone: membri.length,
      vivi,
      posti: piano.limiti.posti,
      // Un'organizzazione al limite dei posti e' una che sta per comprare o
      // per andarsene: sono le due sole cose che puo' fare, e saperlo prima
      // e' tutta la differenza.
      alLimite: piano.limiti.posti != null && membri.length >= piano.limiti.posti,
      azioniAi: ai.tetto ? `${ai.usate} su ${ai.tetto}` : null,
      cassa: creditiInCassa(o.id),
      aiEsaurito: ai.esaurito,
      proprietarioId: o.proprietarioId ?? null,
      proprietario: proprietario ? `#${proprietario.achiviaId}` : '—',
    };
  }).sort((a, b) => Number(b.paga) - Number(a.paga) || b.persone - a.persone);
}

/* ─── Il CRM ─────────────────────────────────────────────────*/

/**
 * La scheda operativa di una persona: tutto quello che serve tutti i
 * giorni, e niente di quello che serve una volta all'anno.
 *
 * Il nome non c'e'. C'e' il nickname, che e' come la persona ha scelto di
 * farsi chiamare, e c'e' il numero Achivia, che la identifica senza
 * equivoci. Per il nome e il cognome c'e' `mostraIdentita`, che li da' e
 * lascia scritto che li ha dati.
 */
export function schedaCliente(userId, { adesso = Date.now() } = {}) {
  const u = getUserById(userId);
  if (!u) return null;
  const suoi = movimenti({ userId });
  const speso = suoi.filter((m) => m.quanti < 0).reduce((s, m) => s - m.quanti, 0);
  const comprato = suoi.filter((m) => m.causale === 'acquisto').reduce((s, m) => s + m.quanti, 0);
  const orgs = (db.membri || [])
    .filter((m) => m.userId === userId)
    .map((m) => {
      const o = getOrganizzazioni().find((x) => x.id === m.orgId);
      return {
        orgId: m.orgId,
        nome: o?.nome || m.orgId,
        ruolo: m.proprietario ? 'proprietario' : m.role,
        dentro: !m.uscitoIl,
        paga: orgPremium(m.orgId),
      };
    });
  return {
    id: u.id,
    numero: `#${u.achiviaId}`,
    nickname: nomePubblico(u),
    email: u.email || '',
    iscrittoIl: u.creatoIl ?? null,
    dataStimata: Boolean(u.dataStimata),
    ultimoAccesso: u.ultimoAccesso ?? null,
    ultimaAttivita: u.ultimaAttivita ?? null,
    ultimaAzione: u.ultimaAzione || '',
    giorniFermo: giorniDaUltimoAccesso(u, adesso),
    crediti: Number(u.credits) || 0,
    livello: Number(u.level) || 1,
    movimenti: suoi.length,
    speso,
    comprato,
    // Vale come cliente quello che ha pagato, non quello che ha guadagnato
    // giocando: la distinzione conta, perche' un saldo alto puo' venire da
    // tutte e due le parti e sono due persone diverse.
    valore: comprato,
    organizzazioni: orgs,
    proprietarioDi: orgs.filter((o) => o.ruolo === 'proprietario' && o.dentro).length,
  };
}

/**
 * L'elenco del CRM: le persone, ordinabili per quello che serve cercare.
 *
 * `cerca` accetta il numero Achivia o l'email. Non il nome: il nome qui non
 * c'e', e una ricerca che non trova mai niente e' peggio di una ricerca che
 * non esiste.
 */
export function elencoClienti({ cerca = '', ordina = 'valore', adesso = Date.now() } = {}) {
  const q = String(cerca).trim().toLowerCase().replace(/^#/, '');
  const righe = getUsers()
    .filter((u) => !['shop', 'osservatorio', 'castle'].includes(u.role))
    .map((u) => schedaCliente(u.id, { adesso }))
    .filter(Boolean)
    .filter((r) => !q || r.numero.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  const per = {
    valore: (a, b) => b.valore - a.valore || b.crediti - a.crediti,
    recenti: (a, b) => String(b.iscrittoIl || '').localeCompare(String(a.iscrittoIl || '')),
    fermi: (a, b) => (b.giorniFermo ?? -1) - (a.giorniFermo ?? -1),
    crediti: (a, b) => b.crediti - a.crediti,
  };
  return righe.sort(per[ordina] || per.valore);
}

/* ─── L'identita', e chi l'ha guardata ───────────────────────*/

/** Un motivo si scrive, non si sceglie da un elenco di comodo. */
export const MOTIVI_IDENTITA = [
  { id: 'pagamento', nome: 'Verifica di un pagamento' },
  { id: 'contestazione', nome: 'Contestazione o rimborso' },
  { id: 'abuso', nome: 'Segnalazione di abuso' },
  { id: 'autorita', nome: 'Richiesta dell’autorita’' },
  { id: 'altro', nome: 'Altro (spiegalo)' },
];

/**
 * Mostra il nome e il cognome di una persona, e lo scrive nel registro.
 *
 * Le due cose non sono separabili, ed e' il punto: non esiste una strada
 * per leggere l'anagrafica che non lasci la riga. Senza motivo non si
 * guarda — non perche' il motivo verra' letto tutti i giorni, ma perche'
 * doverlo scrivere e' quello che fa fermare un attimo a pensare se serve
 * davvero.
 */
export function mostraIdentita(me, userId, { motivo, nota } = {}) {
  if (!puoEntrareNelCastello(me)) return vietato;
  const u = getUserById(userId);
  if (!u) return { ok: false, errore: 'Questa persona non c’e’ piu’.' };
  const quale = MOTIVI_IDENTITA.find((m) => m.id === motivo);
  if (!quale) return { ok: false, errore: 'Scegli perche’ ti serve vedere l’identita’.' };
  const testo = String(nota || '').trim();
  if (motivo === 'altro' && testo.length < 3) {
    return { ok: false, errore: 'Se il motivo e’ "altro", scrivi quale.' };
  }

  ensureCastello();
  db.identitaViste.unshift({
    id: nuovoId('idv'),
    userId,
    numero: `#${u.achiviaId}`,
    daId: me.id,
    motivo,
    nota: testo,
    quando: new Date().toISOString(),
  });
  save();
  return { ok: true, nome: u.name || '—', email: u.email || '—' };
}

/** Il registro delle occhiate, dalla piu' recente. */
export function identitaViste({ userId } = {}) {
  ensureCastello();
  return db.identitaViste
    .filter((r) => !userId || r.userId === userId)
    .map((r) => ({
      ...r,
      motivoNome: MOTIVI_IDENTITA.find((m) => m.id === r.motivo)?.nome || r.motivo,
    }));
}
