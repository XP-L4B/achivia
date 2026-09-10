/**
 * La bacheca degli annunci: chi puo' pubblicare, quanti, e a che
 * condizioni.
 *
 * Un annuncio e' l'unica cosa in tutta l'applicazione che un'organizzazione
 * scrive per farsi leggere da chi sta fuori. Le quest le vede il suo team,
 * i traguardi la sua gente, la vetrina della lega e' un tabellone di
 * numeri: qui invece un'azienda parla a degli sconosciuti. Percio' le
 * caselle obbligatorie non sono burocrazia — sono le domande a cui un
 * annuncio senza risposta non serve a nessuno.
 *
 *   Cosa.        Un ruolo, non "cerchiamo persone in gamba".
 *   Dove.        Almeno il paese. Un annuncio "in Europa" non si filtra e
 *                non si raggiunge.
 *   Come.        In sede, ibrido o da remoto: e' la prima cosa che chi
 *                cerca guarda, e l'unica che nessuno scrive spontaneamente.
 *   Quanto.      Un intervallo, da e a. Non e' gentilezza: e' l'unico modo
 *                perche' chi legge decida se vale la pena rispondere invece
 *                di scoprirlo al terzo colloquio.
 *   Che lavoro.  Cento caratteri come minimo. Sotto quella soglia non si
 *                sta descrivendo un lavoro, si sta mettendo un titolo due
 *                volte.
 *   Che cosa sai fare. Fino a cinque competenze, prese da un elenco chiuso.
 *                Queste non sono obbligatorie: un annuncio si puo'
 *                pubblicare senza, e la descrizione resta il posto in cui
 *                si dice quello che l'elenco non ha. Servono a rendere gli
 *                annunci confrontabili fra loro, che e' una cosa che il
 *                testo libero non sa fare.
 *   A chi.       Un indirizzo email a cui rispondere, e si vede. Senza,
 *                l'annuncio e' un cartello senza numero di telefono: si
 *                legge e non si puo' fare niente. Chi lo scrive deve
 *                sapere che quell'indirizzo lo leggeranno degli
 *                sconosciuti, e per questo la schermata glielo dice
 *                mentre lo scrive, non dopo.
 */

import {
  getAnnunci, getAnnuncioById, getAnnunciDiOrg, annunciVivi, inRisalto,
  salvaAnnuncioGrezzo, metteInRisalto, chiudiAnnuncio, riapriAnnuncio,
  eliminaAnnuncio, getUserById, getUsersByOrg,
  muoviCassa, creditiInCassa, save as salvaDeposito, nomeOrgDi, orgPersonalizzata,
  limitiDiOrg, getRisalto, RISALTO_DI_PARTENZA,
} from './db';
import { orgPremium } from './classifica';
import { centroZona, nomeZona, paeseById } from './geografia';
import { distanzaKm, fasciaDi, RAGGIO_MINIMO_KM } from './posizione';
import {
  COMPETENZE_RICHIESTE, GRUPPI_COMPETENZE, competenzaById, competenzeDiGruppo, nomeCompetenza,
} from './competenzeRichieste';

/* ─── Chi puo' scrivere ──────────────────────────────────────────────────*/

/**
 * Admin e co-admin di un'azienda. Sono la stessa cosa — nel modello un
 * co-admin e' un admin che non e' il proprietario — quindi la regola e' una
 * sola. Il negozio e l'osservatorio non hanno organizzazione e non passano
 * di qui nemmeno per sbaglio.
 *
 * Le organizzazioni personalizzate nemmeno, e per un motivo diverso: una
 * famiglia, un gruppo o un clan non assumono. Pubblicare un'offerta di
 * lavoro e' un atto da datore di lavoro — impegna chi la scrive con degli
 * sconosciuti che risponderanno — e quel tipo di organizzazione non e'
 * fatto per quello.
 */
export const puoPubblicareAnnunci = (persona) =>
  persona?.role === 'admin' && Boolean(persona.orgId) && !orgPersonalizzata(persona.orgId);

/* ─── Quanti se ne possono tenere aperti ─────────────────────────────────*/

/* Quanti annunci si tengono aperti lo dice il piano: uno con lo Standard,
   tre con il Silver, cinque con il Gold, venti con il Diamond. Erano due
   numeri scritti qui — uno e cinque — con accanto la nota "finche' i
   pacchetti non esistono". Adesso esistono, e questa riga li legge invece
   di sostituirli. */
export const tettoAnnunci = (orgId) => limitiDiOrg(orgId).annunci;

export const annunciApertiDi = (orgId) =>
  getAnnunciDiOrg(orgId).filter((a) => a.stato === 'pubblicato').length;

export const puoAprirneAncora = (orgId) => annunciApertiDi(orgId) < tettoAnnunci(orgId);

/* ─── Il risalto ─────────────────────────────────────────────────────────*/

/* Quanto costa mettere un annuncio in cima, per una, due o quattro
   settimane. Adesso il tariffario sta nel listino e si cambia da fuori:
   qui resta il nome, che lo leggono le schermate, e punta ai valori di
   partenza. Il servizio e' per tutti, freemium compresi: e' il modo in cui
   chi non paga l'abbonamento puo' comunque spendere per farsi vedere. */
/* Il tariffario del risalto vive nel listino. Questi due nomi restano qui
   perche' e' qui che le schermate degli annunci vengono a cercarli: uno
   e' il tariffario vero, l'altro i valori di partenza. */
export { getRisalto };
export const RISALTO = RISALTO_DI_PARTENZA;

export const costoRisalto = (settimane) =>
  getRisalto().find((r) => r.settimane === settimane)?.costo ?? null;

/**
 * Compra il risalto. Paga l'organizzazione, dalla sua cassa.
 *
 * Per un anno lo pagava chi lo comprava, dal proprio saldo, e la ragione
 * era che i crediti erano di una persona e non esisteva un secondo
 * portafoglio. Era un ripiego e si vedeva: mettere in cima un annuncio di
 * lavoro e' una spesa dell'azienda, e l'admin — che per regola non guadagna
 * crediti — avrebbe dovuto comprarseli per fare una cosa che l'azienda gli
 * chiede. Adesso la cassa c'e', ed e' li' che va presa.
 *
 * Se l'annuncio e' gia' in risalto, le settimane si sommano invece di
 * ripartire: chi rinnova prima della scadenza non deve perdere i giorni
 * che ha gia' pagato.
 */
export function compraRisalto(me, annuncioId, settimane) {
  const a = getAnnuncioById(annuncioId);
  if (!a) return { ok: false, errore: 'Annuncio non trovato.' };
  if (!puoPubblicareAnnunci(me) || me.orgId !== a.orgId) {
    return { ok: false, errore: 'Puoi mettere in risalto solo gli annunci della tua organizzazione.' };
  }
  const costo = costoRisalto(settimane);
  if (!costo) return { ok: false, errore: 'Durata non prevista.' };
  const uscita = muoviCassa({
    orgId: a.orgId,
    quanti: -costo,
    causale: 'risalto',
    riferimento: a.id,
    daId: me.id,
  });
  if (!uscita) {
    return {
      ok: false,
      errore: `Servono ${costo} crediti e in cassa ce ne sono ${creditiInCassa(a.orgId)}.`,
    };
  }
  salvaDeposito();
  const da = inRisalto(a) ? new Date(a.risaltoFinoAl).getTime() : Date.now();
  metteInRisalto(a.id, new Date(da + settimane * 7 * 86400000).toISOString());
  return { ok: true, annuncio: getAnnuncioById(a.id), costo };
}

/* ─── Che cosa serve per pubblicare ──────────────────────────────────────*/

export const MODALITA = [
  { id: 'sede', nome: 'In sede' },
  { id: 'ibrido', nome: 'Ibrido' },
  { id: 'remoto', nome: 'Da remoto' },
];

export const UNITA_PAGA = [
  { id: 'annuo', nome: 'RAL annua', breve: '€/anno' },
  { id: 'mensile', nome: 'Stipendio mensile lordo', breve: '€/mese' },
  { id: 'orario', nome: 'Paga oraria lorda', breve: '€/ora' },
];

export const MIN_DESCRIZIONE = 100;
export const MAX_DESCRIZIONE = 2000;
export const MAX_TITOLO = 80;
export const MAX_EMAIL = 120;

/* Cinque, e non e' un numero tondo scelto a caso: un annuncio che ne chiede
   dieci non sta dicendo che cosa serve, sta dicendo che non lo sa. */
export const MAX_COMPETENZE = 5;

/* Un indirizzo si controlla per la forma e basta: una chiocciola sola, un
   punto nel dominio, niente spazi. Le espressioni regolari che pretendono
   di sapere quali indirizzi esistono davvero bocciano indirizzi veri, ed
   e' un errore peggiore di quello che vorrebbero evitare — l'unica prova
   che un indirizzo funziona e' scriverci. */
export const emailValida = (x) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(x || '').trim());

export const ANNUNCIO_VUOTO = {
  titolo: '',
  zona: { continente: '', paese: '', area: '' },
  modalita: '',
  unita: 'annuo',
  ralDa: '',
  ralA: '',
  descrizione: '',
  email: '',
  // Cinque caselle, e restano cinque anche vuote: la tendina che non ha
  // ancora niente dentro e' quella che dice che se ne puo' mettere un'altra.
  competenze: ['', '', '', '', ''],
};

/**
 * Le competenze scritte davvero, dalle cinque caselle del modulo. Le
 * caselle vuote non sono una competenza: si tolgono qui una volta sola,
 * cosi' nessuno deve ricordarsene altrove.
 */
export const competenzeDi = (dati) =>
  (dati?.competenze || []).map((x) => String(x || '').trim()).filter(Boolean);

/**
 * Che cosa manca perche' l'annuncio si possa pubblicare.
 *
 * Torna un elenco di problemi e non un vero/falso: un modulo che dice solo
 * "non va" costringe a indovinare quale delle caselle sia quella
 * sbagliata, e chi indovina due volte chiude la pagina.
 */
export function problemiDi(dati) {
  const p = [];
  const titolo = String(dati.titolo || '').trim();
  if (titolo.length < 3) p.push({ campo: 'titolo', testo: 'Scrivi che ruolo cerchi.' });
  if (titolo.length > MAX_TITOLO) p.push({ campo: 'titolo', testo: `Il titolo non supera i ${MAX_TITOLO} caratteri.` });

  if (!dati.zona?.continente || !dati.zona?.paese) {
    p.push({ campo: 'zona', testo: 'Indica almeno il paese: un annuncio senza un dove non si trova.' });
  }
  if (!MODALITA.some((m) => m.id === dati.modalita)) {
    p.push({ campo: 'modalita', testo: 'Dì se si lavora in sede, ibrido o da remoto.' });
  }

  const da = Number(dati.ralDa);
  const a = Number(dati.ralA);
  if (!Number.isFinite(da) || da <= 0 || !Number.isFinite(a) || a <= 0) {
    p.push({ campo: 'paga', testo: 'Indica da quanto a quanto: senza, chi legge non sa se rispondere.' });
  } else if (a < da) {
    p.push({ campo: 'paga', testo: 'Il massimo non può essere più basso del minimo.' });
  }

  const testo = String(dati.descrizione || '').trim();
  if (testo.length < MIN_DESCRIZIONE) {
    p.push({
      campo: 'descrizione',
      testo: `Servono almeno ${MIN_DESCRIZIONE} caratteri: ne hai scritti ${testo.length}.`,
    });
  }
  if (testo.length > MAX_DESCRIZIONE) {
    p.push({ campo: 'descrizione', testo: `Non più di ${MAX_DESCRIZIONE} caratteri.` });
  }

  const email = String(dati.email || '').trim();
  if (!email) {
    p.push({ campo: 'email', testo: 'Serve un indirizzo email a cui rispondere: sarà visibile a chi apre l’annuncio.' });
  } else if (!emailValida(email)) {
    p.push({ campo: 'email', testo: 'Questo indirizzo email non è scritto bene.' });
  } else if (email.length > MAX_EMAIL) {
    p.push({ campo: 'email', testo: `L’indirizzo non supera i ${MAX_EMAIL} caratteri.` });
  }

  /* Le competenze sono facoltative: qui non si controlla che ci siano, si
     controlla che quelle che ci sono vogliano dire qualcosa. */
  const scelte = competenzeDi(dati);
  if (scelte.length > MAX_COMPETENZE) {
    p.push({ campo: 'competenze', testo: `Non più di ${MAX_COMPETENZE} competenze.` });
  }
  if (scelte.some((x) => !competenzaById(x))) {
    p.push({ campo: 'competenze', testo: 'Una delle competenze scelte non è in elenco.' });
  }
  if (new Set(scelte).size !== scelte.length) {
    p.push({ campo: 'competenze', testo: 'La stessa competenza è scelta due volte.' });
  }
  return p;
}

/**
 * Pubblica o aggiorna. Il tetto si controlla solo quando nasce un annuncio
 * nuovo o quando se ne riapre uno: modificarne uno gia' aperto non ne
 * aggiunge nessuno, e bloccare le modifiche a chi e' al limite sarebbe una
 * punizione senza motivo.
 */
export function salvaAnnuncio(me, dati) {
  if (!puoPubblicareAnnunci(me)) {
    return { ok: false, errore: 'Solo l’amministratore dell’organizzazione pubblica gli annunci.' };
  }
  const problemi = problemiDi(dati);
  if (problemi.length) return { ok: false, problemi };

  const nuovo = !dati.id;
  if (nuovo && !puoAprirneAncora(me.orgId)) {
    return {
      ok: false,
      errore: orgPremium(me.orgId)
        ? `Hai già ${tettoAnnunci(me.orgId)} annunci aperti: chiudine uno per pubblicarne un altro.`
        : 'Senza abbonamento si tiene un annuncio alla volta. Chiudi quello aperto, oppure passa a un abbonamento.',
    };
  }

  const zona = { ...dati.zona };
  const centro = centroZona(zona);
  const annuncio = salvaAnnuncioGrezzo({
    ...(dati.id ? { id: dati.id } : {}),
    orgId: me.orgId,
    creatoDaId: me.id,
    titolo: String(dati.titolo).trim(),
    zona,
    // Il centro della zona dichiarata: serve alla ricerca per distanza, ed
    // e' un punto del catalogo — non la posizione di un ufficio.
    posizione: centro ? { lat: centro.lat, lon: centro.lon, precisione: centro.precisione } : null,
    modalita: dati.modalita,
    unita: dati.unita || 'annuo',
    ralDa: Number(dati.ralDa),
    ralA: Number(dati.ralA),
    descrizione: String(dati.descrizione).trim(),
    // In minuscolo: gli indirizzi si scrivono come capita e nella scheda
    // devono avere tutti la stessa faccia.
    email: String(dati.email).trim().toLowerCase(),
    competenze: competenzeDi(dati),
  });
  return { ok: true, annuncio };
}

/* ─── Chiudere, riaprire, cancellare ─────────────────────────────────────*/

/* Passano tutte e tre dallo stesso controllo: l'annuncio deve essere della
   propria organizzazione. Senza, chiunque abbia un indirizzo e un po' di
   pazienza chiuderebbe gli annunci degli altri. */
const mio = (me, id) => {
  const a = getAnnuncioById(id);
  if (!a) return { ok: false, errore: 'Annuncio non trovato.' };
  if (!puoPubblicareAnnunci(me) || me.orgId !== a.orgId) {
    return { ok: false, errore: 'Questo annuncio non è della tua organizzazione.' };
  }
  return { ok: true, a };
};

/** Chiudere libera un posto e non cancella niente: l'annuncio resta,
    riaprirlo e' un clic, e nel frattempo non lo vede piu' nessuno. */
export function chiudi(me, id) {
  const esito = mio(me, id);
  if (!esito.ok) return esito;
  return { ok: true, annuncio: chiudiAnnuncio(id) };
}

/** Riaprire rioccupa un posto, percio' il tetto vale anche qui: altrimenti
    bastava chiudere e riaprire per averne quanti se ne vuole. */
export function riapri(me, id) {
  const esito = mio(me, id);
  if (!esito.ok) return esito;
  if (!puoAprirneAncora(me.orgId)) {
    return {
      ok: false,
      errore: `Hai già ${tettoAnnunci(me.orgId)} ${tettoAnnunci(me.orgId) === 1 ? 'annuncio aperto' : 'annunci aperti'}: chiudine uno per riaprire questo.`,
    };
  }
  return { ok: true, annuncio: riapriAnnuncio(id) };
}

export function elimina(me, id) {
  const esito = mio(me, id);
  if (!esito.ok) return esito;
  return { ok: eliminaAnnuncio(id) };
}

/* ─── Trovarli ───────────────────────────────────────────────────────────*/

export const FILTRI_ANNUNCI = {
  parole: '',
  zona: { continente: '', paese: '', area: '' },
  modalita: '',
  centro: null,
  raggioKm: 0,
};

const senzaAccenti = (t) => String(t || '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Come si legge un annuncio: quello che serve a mostrarlo, gia' pronto. */
export function schedaAnnuncio(a) {
  const org = nomeOrgDi(a.orgId);
  const unita = UNITA_PAGA.find((u) => u.id === a.unita) || UNITA_PAGA[0];
  return {
    ...a,
    organizzazione: org,
    dove: nomeZona(a.zona),
    paese: paeseById(a.zona?.paese)?.nome || '',
    comeSiLavora: MODALITA.find((m) => m.id === a.modalita)?.nome || '',
    paga: `${a.ralDa.toLocaleString('it-IT')} – ${a.ralA.toLocaleString('it-IT')} ${unita.breve}`,
    risalto: inRisalto(a),
    // I nomi, non gli identificativi: la scheda e' quello che si legge.
    competenzeNomi: (a.competenze || []).map(nomeCompetenza),
  };
}

/**
 * La ricerca: che cosa e dove.
 *
 * Le parole si cercano nel titolo, nella descrizione, nel nome
 * dell'organizzazione, nel luogo e nelle competenze richieste, tutte quante
 * e in qualunque ordine: chi scrive "capo turno magazzino" si aspetta di
 * trovare "responsabile di magazzino, turno notte", e cercare la frase
 * esatta glielo impedirebbe. Le competenze ci sono dentro perche' sono
 * parole che l'organizzazione ha scelto apposta per farsi trovare: cercare
 * "saldatura" e non vedere l'annuncio che chiede saldatura sarebbe
 * incomprensibile.
 *
 * Gli annunci in risalto stanno in cima, e non e' un trucco nascosto: la
 * scheda lo dice. Sotto, i piu' recenti.
 */
export function cercaAnnunci(filtri = {}) {
  const f = { ...FILTRI_ANNUNCI, ...filtri };
  const parole = senzaAccenti(f.parole).split(/\s+/).filter((x) => x.length > 1);

  const trovati = annunciVivi().map(schedaAnnuncio).filter((a) => {
    if (parole.length) {
      const dove = senzaAccenti(
        `${a.titolo} ${a.descrizione} ${a.organizzazione} ${a.dove} ${a.competenzeNomi.join(' ')}`,
      );
      if (!parole.every((x) => dove.includes(x))) return false;
    }
    if (f.modalita && a.modalita !== f.modalita) return false;
    if (f.zona?.continente && a.zona?.continente !== f.zona.continente) return false;
    if (f.zona?.paese && a.zona?.paese !== f.zona.paese) return false;
    if (f.zona?.area && a.zona?.area !== f.zona.area) return false;
    if (f.centro && f.raggioKm > 0) {
      if (!a.posizione) return false;
      const quanto = distanzaKm(f.centro, a.posizione);
      if (quanto === null || quanto > Math.max(RAGGIO_MINIMO_KM, f.raggioKm)) return false;
    }
    return true;
  });

  return trovati.sort((x, y) => (y.risalto - x.risalto)
    || (new Date(y.creatoIl) - new Date(x.creatoIl)));
}

/** Quanto dista un annuncio dal centro cercato, a fasce come per i profili. */
export const distanzaAnnuncio = (centro, a) => (centro && a?.posizione
  ? fasciaDi(distanzaKm(centro, a.posizione))
  : null);

/** Chi ha scritto l'annuncio, per la sua organizzazione. */
export const autoreDi = (a) => getUserById(a?.creatoDaId)?.name || null;

/** Quante persone lavorano nell'organizzazione che pubblica: e' un dato
    pubblico e dice a chi legge se sta guardando una bottega o una fabbrica. */
export const quantoEGrande = (orgId) => getUsersByOrg(orgId).length;

/** Le cinque caselle a partire da un annuncio gia' scritto: quelle che
    aveva, e le altre vuote in coda. */
export const caselleCompetenze = (a) => {
  const scelte = (a?.competenze || []).slice(0, MAX_COMPETENZE);
  return [...scelte, ...Array(MAX_COMPETENZE - scelte.length).fill('')];
};

export { getAnnunci, getAnnuncioById, getAnnunciDiOrg, inRisalto };
export { COMPETENZE_RICHIESTE, GRUPPI_COMPETENZE, competenzeDiGruppo, nomeCompetenza };
