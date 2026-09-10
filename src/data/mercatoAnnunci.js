/**
 * Il mercato visto dal lato di chi cerca: gli annunci.
 *
 * Tutte le altre tavole dell'osservatorio guardano quello che succede
 * dentro le organizzazioni — chi certifica che cosa, chi si muove — e per
 * questo si fermano al perimetro degli abbonati e non scendono mai sotto la
 * soglia di anonimato. Qui no, e la differenza va detta.
 *
 * Un annuncio e' un documento pubblico. L'organizzazione lo ha scritto
 * perche' lo leggano degli sconosciuti, e in bacheca lo legge chiunque
 * abbia un profilo Achivia, uno per uno, con la paga scritta dentro.
 * Aggregare cose gia' pubbliche non le rende piu' pubbliche: nascondere una
 * media perche' viene da due annunci sarebbe teatro, visto che i due
 * annunci si aprono a mano in dieci secondi. Percio' questa pagina conta
 * tutti gli annunci pubblicati — anche quelli delle organizzazioni senza
 * abbonamento, che del mercato del lavoro sono una parte vera — e non
 * applica nessuna soglia.
 *
 * Le fasce di dimensione sono pero' le stesse della lega e delle altre
 * tavole: un'organizzazione deve risultare della stessa taglia dappertutto,
 * altrimenti due numeri che parlano della stessa cosa non tornano.
 *
 * Sulla paga c'e' una scelta che vale la pena di scrivere. Gli annunci si
 * esprimono in RAL annua, in stipendio mensile o in paga oraria, e le tre
 * cose non si sommano: per portare un mensile a una RAL bisogna decidere
 * quante mensilita', e quel numero — tredici, quattordici — cambia il
 * risultato di quasi il venti per cento. Una media che nasconde una scelta
 * del genere e' una media falsa. Quindi non si converte niente: la RAL
 * media e' la media dei soli annunci espressi in RAL, e le altre due unita'
 * hanno la loro, dichiarata a parte.
 */

import { getAnnunci, getUsersByOrg } from './db';
import { DIMENSIONI } from './classifica';
import { finestre } from './osservatorio';
import { UNITA_PAGA, MODALITA } from './annunci';
import { COMPETENZE_RICHIESTE, nomeCompetenza } from './competenzeRichieste';
import { paeseById, continenteById } from './geografia';

export const FILTRI_ANNUNCI_MERCATO = {
  dimensione: 'tutte',
  zona: { continente: '', paese: '', area: '' },
  competenze: [],
};

const dentro = (quando, { da, a }) => {
  const t = new Date(quando).getTime();
  return Number.isFinite(t) && t >= da && t < a;
};

const media = (numeri) => (numeri.length
  ? Math.round(numeri.reduce((s, n) => s + n, 0) / numeri.length)
  : null);

const variazione = (ora, prima) => (prima > 0 ? Math.round(((ora - prima) / prima) * 100) : null);

/* Il punto medio della forbice. Un annuncio non offre una cifra, offre un
   intervallo: prendere il minimo direbbe sempre meno del vero, prendere il
   massimo sempre di piu'. */
const punto = (a) => (Number(a.ralDa) + Number(a.ralA)) / 2;

/** Quante persone ha l'organizzazione che pubblica: serve alla fascia. */
export const grandezzaOrg = (orgId) => getUsersByOrg(orgId).length;

/**
 * Gli annunci che passano i filtri. Il tempo non c'entra qui: lo applicano
 * le funzioni che contano, perche' ognuna guarda due finestre e non una.
 */
export function annunciFiltrati({ dimensione = 'tutte', zona = {}, competenze = [] } = {}) {
  const fascia = DIMENSIONI.find((d) => d.id === dimensione) || DIMENSIONI[0];
  const cercate = competenze.filter(Boolean);
  return getAnnunci().filter((a) => {
    const quanti = grandezzaOrg(a.orgId);
    if (quanti < fascia.min || quanti > fascia.max) return false;
    if (zona.continente && a.zona?.continente !== zona.continente) return false;
    if (zona.paese && a.zona?.paese !== zona.paese) return false;
    if (zona.area && a.zona?.area !== zona.area) return false;
    /* Chi ne sceglie tre vuole gli annunci che ne chiedono almeno una, non
       quelli che le chiedono tutte e tre: filtrare in "e" su tre competenze
       svuota qualsiasi bacheca. */
    if (cercate.length && !cercate.some((x) => (a.competenze || []).includes(x))) return false;
    return true;
  });
}

/** Le medie per unita' di misura, senza mescolarle mai. */
export function paghe(annunci) {
  return UNITA_PAGA.map((u) => {
    const suoi = annunci.filter((a) => (a.unita || 'annuo') === u.id);
    return {
      id: u.id,
      nome: u.nome,
      breve: u.breve,
      quanti: suoi.length,
      minimo: media(suoi.map((a) => Number(a.ralDa))),
      massimo: media(suoi.map((a) => Number(a.ralA))),
      media: media(suoi.map(punto)),
    };
  });
}

/**
 * Il colpo d'occhio: quanti annunci sono stati aperti nel periodo, come va
 * rispetto al periodo prima, quanto si offre e come si lavora.
 *
 * "Aperti" vuol dire pubblicati in quella finestra, non aperti adesso: un
 * annuncio chiuso il mese dopo e' stato lo stesso una posizione cercata, e
 * toglierlo dal conto direbbe che la domanda di quel mese non c'e' stata.
 */
export function riepilogoAnnunci({ giorni, ...filtri } = {}) {
  const tutti = annunciFiltrati(filtri);
  const { ora, prima } = finestre(giorni);
  const nuovi = tutti.filter((a) => dentro(a.creatoIl, ora));
  const vecchi = tutti.filter((a) => dentro(a.creatoIl, prima));

  const perModalita = MODALITA.map((m) => ({
    id: m.id,
    nome: m.nome,
    quanti: nuovi.filter((a) => a.modalita === m.id).length,
  }));

  return {
    aperti: nuovi.length,
    precedenti: vecchi.length,
    variazione: variazione(nuovi.length, vecchi.length),
    inBacheca: tutti.filter((a) => a.stato === 'pubblicato').length,
    organizzazioni: new Set(nuovi.map((a) => a.orgId)).size,
    conCompetenze: nuovi.filter((a) => (a.competenze || []).length > 0).length,
    paghe: paghe(nuovi),
    modalita: perModalita,
  };
}

/**
 * Le competenze richieste, una riga per competenza.
 *
 * Ci sono solo quelle che qualcuno ha chiesto davvero: un elenco di
 * cinquanta righe di cui quaranta a zero non e' una tavola, e' un modulo
 * vuoto. La quota si calcola sugli annunci che dichiarano competenze, non
 * su tutti: dire "il dieci per cento degli annunci chiede inglese" quando
 * meta' degli annunci non dichiara niente e' una frase che sembra vera e
 * non lo e'.
 */
export function competenzeRichieste({ giorni, ...filtri } = {}) {
  const tutti = annunciFiltrati(filtri);
  const { ora, prima } = finestre(giorni);
  const nuovi = tutti.filter((a) => dentro(a.creatoIl, ora));
  const vecchi = tutti.filter((a) => dentro(a.creatoIl, prima));
  const base = nuovi.filter((a) => (a.competenze || []).length > 0).length;

  return COMPETENZE_RICHIESTE.map((cc) => {
    const suoi = nuovi.filter((a) => (a.competenze || []).includes(cc.id));
    const suoiPrima = vecchi.filter((a) => (a.competenze || []).includes(cc.id)).length;
    const annuali = suoi.filter((a) => (a.unita || 'annuo') === 'annuo');
    return {
      // `chiave` e non `id`: e' il nome che la tavola dell'osservatorio usa
      // per distinguere una riga dall'altra, e le righe qui sono le sue.
      chiave: cc.id,
      id: cc.id,
      // `name` e `categoria`, non `nome` e `gruppo`: queste righe sono
      // competenze del catalogo, e il catalogo le chiama cosi'.
      nome: cc.name,
      gruppo: cc.categoria,
      annunci: suoi.length,
      precedenti: suoiPrima,
      variazione: variazione(suoi.length, suoiPrima),
      quota: base > 0 ? Number(((suoi.length / base) * 100).toFixed(1)) : 0,
      ral: media(annuali.map(punto)),
    };
  })
    .filter((r) => r.annunci > 0 || r.precedenti > 0)
    .sort((x, y) => y.annunci - x.annunci || x.nome.localeCompare(y.nome));
}

/**
 * Dove si cerca. Il livello si sceglie da solo: se chi guarda ha gia'
 * ristretto a un paese, le righe sono le sue regioni — altrimenti sarebbe
 * una tavola con una riga sola.
 */
export function dovesiCerca({ giorni, ...filtri } = {}) {
  const tutti = annunciFiltrati(filtri);
  const { ora } = finestre(giorni);
  const nuovi = tutti.filter((a) => dentro(a.creatoIl, ora));
  const perArea = Boolean(filtri.zona?.paese);

  const gruppi = new Map();
  for (const a of nuovi) {
    const chiave = perArea ? (a.zona?.area || '') : (a.zona?.paese || '');
    const nome = perArea
      ? (chiave || `${paeseById(a.zona?.paese)?.nome || '—'} · senza dettaglio`)
      : (paeseById(chiave)?.nome || continenteById(a.zona?.continente)?.nome || '—');
    if (!gruppi.has(chiave)) gruppi.set(chiave, { chiave, nome, righe: [] });
    gruppi.get(chiave).righe.push(a);
  }

  return [...gruppi.values()].map((g) => {
    const annuali = g.righe.filter((a) => (a.unita || 'annuo') === 'annuo');
    return {
      chiave: g.chiave || 'senza',
      nome: g.nome,
      annunci: g.righe.length,
      quota: nuovi.length > 0 ? Number(((g.righe.length / nuovi.length) * 100).toFixed(1)) : 0,
      ral: media(annuali.map(punto)),
    };
  }).sort((x, y) => y.annunci - x.annunci || x.nome.localeCompare(y.nome));
}

/** Il vocabolario per il filtro: solo le competenze che qualcuno chiede. */
export function competenzeInUso() {
  const quante = new Map();
  for (const a of getAnnunci()) {
    for (const cc of a.competenze || []) quante.set(cc, (quante.get(cc) || 0) + 1);
  }
  return [...quante.entries()]
    .map(([id, quanti]) => ({ id, nome: nomeCompetenza(id), quanti }))
    .sort((x, y) => y.quanti - x.quanti || x.nome.localeCompare(y.nome));
}
