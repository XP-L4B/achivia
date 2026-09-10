/**
 * Le regole di Lexora viste dalle schermate.
 *
 * Sta fra il deposito e le pagine per la stessa ragione di `data/arena.js`:
 * una schermata importa da un posto solo, e il giorno che sotto ci sara' un
 * server le pagine non se ne accorgono.
 *
 * Lexora non paga: niente crediti, niente esperienza dell'account, e
 * i suoi traguardi sono un profilo a parte. Il livello di un account dice
 * quanto una persona ha lavorato; giocare non e' lavorare, e una parola
 * lunga non e' una quest.
 *
 * L'unica cosa che lega il gioco ad Achivia sono le persone: gli avversari
 * sono i colleghi dell'organizzazione, con i loro nomi e i loro profili.
 * Non c'e' un secondo accesso e non c'e' un secondo elenco di utenti.
 */

/* Il deposito di Lexora si importa da qui e non da `data/db.js`, che
   riespone tutto: db.js lo importa ogni schermata dell'applicazione, e
   quel `export *` si porterebbe dietro il motore e i cinquanta e passa
   chili di dizionari — dentro il pacchetto principale, addosso anche a chi
   a Lexora non gioca. Cosi' invece restano dove devono stare: nel pezzo
   che si carica aprendo il gioco. */
import {
  statisticheLexora, traguardiLexora, partiteLexora, sfideLexora, invitiLexora,
  turniTuoiLexora, avversariLexora, classificaLexora, sfidaLexora,
  creaSfidaLexora, accettaSfidaLexora, rifiutaSfidaLexora, abbandonaSfidaLexora,
  giocaSfidaLexora, giocaBotLexora, fotografiaSfida, apriTavoloLexora, LIVELLI_BOT,
  creaProvaLexora, livelloLexora,
} from './deposito/lexora';
import { chiaveLega, periodoLega, orgDiUtente, nomeOrg, LEGHE, getUserById } from './db';
import { elencoLingue, linguaById } from '../giochi/lexora/contenuti/lingue/registro';
import { valuta, CATEGORIE } from '../giochi/lexora/contenuti/traguardi';
import { CONFIG, LIVELLI, livelloDi, ULTIMO_LIVELLO } from '../giochi/lexora/contenuti/config';

export {
  creaSfidaLexora, accettaSfidaLexora, rifiutaSfidaLexora, abbandonaSfidaLexora,
  giocaSfidaLexora, giocaBotLexora, fotografiaSfida, apriTavoloLexora, sfidaLexora, avversariLexora,
  statisticheLexora, traguardiLexora, partiteLexora, LIVELLI_BOT, elencoLingue, linguaById, LEGHE, CONFIG,
  creaProvaLexora, livelloLexora, LIVELLI, livelloDi, ULTIMO_LIVELLO,
};

/** I livelli del bot, col loro nome e quello che promettono. */
export const BOT = [
  { id: 'facile', nome: 'Facile', nota: 'Gioca la prima parola che trova.' },
  { id: 'medio', nome: 'Medio', nota: 'Guarda i punti, ogni tanto sbaglia.' },
  { id: 'difficile', nome: 'Difficile', nota: 'Gioca la parola migliore che vede.' },
];

/** Quanto dura una partita, come si dice a chi non l'ha mai giocata. */
export const durataPartita = () => {
  /* Quattro tentativi a parola e' quello che ci vuole di solito, e
     `tipici` e' quanto ci si mette a pensarne uno: fra le due cose viene
     una stima onesta. Il caso peggiore — sei tentativi presi tutti per
     intero, in due — e' una mezz'ora che non succede mai, e scriverla
     nell'elenco dei giochi vorrebbe dire far scappare chi ha una pausa. */
  const tipici = CONFIG.partita.parole * 4 * 2 * CONFIG.turno.tipici;
  const minuti = Math.max(2, Math.round(tipici / 60));
  return `${minuti} minuti circa`;
};

/** Tutto quello che serve all'atrio: statistiche, sfide aperte, inviti. */
export function schedaLexora(userId) {
  const statistiche = statisticheLexora(userId);
  const sfide = sfideLexora(userId).filter((s) => s.stato === 'in corso');
  return {
    statistiche,
    inviti: invitiLexora(userId),
    inCorso: sfide,
    tocca: turniTuoiLexora(userId),
    ultime: partiteLexora(userId).slice(0, 5),
  };
}

/** I traguardi di Lexora di una persona, pronti per la schermata. */
export function traguardiDi(userId) {
  const t = traguardiLexora(userId);
  const lista = valuta(t.misure, t.sbloccati);
  return { lista, categorie: CATEGORIE, sbloccati: lista.filter((v) => v.sbloccato).length, totale: lista.length };
}

/** Il nome di chi gioca, come si scrive in una riga di elenco. */
export function nomeGiocatore(g) {
  if (!g) return '—';
  if (g.bot) return `Bot ${g.bot}`;
  return getUserById(g.userId)?.name || g.nome || 'Giocatore';
}

/**
 * Com'e' finita una partita, dal punto di vista di una persona: 'vinta',
 * 'persa' o 'pareggio'.
 */
export function comeFini(partita, userId) {
  if (!partita?.esito) return null;
  if (partita.esito.pareggio) return 'pareggio';
  return partita.esito.vincitore === userId ? 'vinta' : 'persa';
}

/* ─── La classifica ─── */

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const giornoBreve = (t) => { const d = new Date(t); return `${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)}`; };

/** Il nome di una lega in corso, come nell'arena: le leghe sono le stesse. */
export function etichettaLega(lega, adesso = Date.now()) {
  if (lega === 'sempre') return 'Di sempre';
  const { inizio, fine } = periodoLega(lega, adesso);
  if (lega === 'mese') { const d = new Date(adesso); return `${MESI[d.getMonth()][0].toUpperCase()}${MESI[d.getMonth()].slice(1)} ${d.getFullYear()}`; }
  return `Settimana · ${giornoBreve(inizio)} – ${giornoBreve(fine - 24 * 3600 * 1000)}`;
}

/** Quanto manca alla fine della lega, in parole. */
export function quantoManca(lega, adesso = Date.now()) {
  if (lega === 'sempre') return 'non finisce mai';
  const { fine } = periodoLega(lega, adesso);
  const ore = Math.max(0, Math.round((fine - adesso) / 3600000));
  if (ore >= 48) return `chiude fra ${Math.round(ore / 24)} giorni`;
  if (ore >= 2) return `chiude fra ${ore} ore`;
  return 'chiude fra poco';
}

/** Gli ambiti in cui confrontarsi: tutti, e le organizzazioni di cui si fa parte. */
export function ambitiDi(userId) {
  return [
    { id: 'tutti', nome: 'Tutti' },
    ...orgDiUtente(userId).map((id) => ({ id, nome: nomeOrg(id) || 'La mia organizzazione' })),
  ];
}

/**
 * La classifica pronta per la schermata: le voci, la propria riga, quanto
 * manca per salire di un posto, e la lega scorsa. La firma e' quella
 * dell'arena — `classificaDi(userId, { lega, ambito })` — perche' le due
 * schermate si somigliano e chi legge una capisce l'altra.
 */
export function classificaDi(userId, { lega = 'sett', ambito = 'tutti', adesso = Date.now() } = {}) {
  const ambiti = ambitiDi(userId);
  const scelto = ambiti.some((a) => a.id === ambito) ? ambito : 'tutti';
  const tutte = classificaLexora({ lega, ambito: scelto, adesso });
  const conNome = (v) => ({ ...v, persona: getUserById(v.userId) || null, sono: v.userId === userId });
  const mia = tutte.find((v) => v.userId === userId) || null;
  const sopra = mia && mia.posizione > 1 ? tutte[mia.posizione - 2] : null;
  /* I primi dieci, piu' la propria riga se sta piu' giu': chi guarda deve
     vedersi senza scorrere una classifica di trecento nomi. */
  const teste = tutte.slice(0, 10);
  const voci = (mia && mia.posizione > 10 ? [...teste, mia] : teste).map(conNome);

  const { precedente } = periodoLega(lega, adesso);
  const scorse = precedente ? classificaLexora({ chiave: precedente, ambito: scelto, adesso }) : [];

  return {
    voci,
    ambiti,
    ambito: scelto,
    partecipanti: tutte.length,
    etichetta: etichettaLega(lega, adesso),
    scadenza: quantoManca(lega, adesso),
    chiave: chiaveLega(lega, adesso),
    mia: mia ? {
      ...conNome(mia),
      sopra: sopra ? conNome(sopra) : null,
      mancano: sopra ? Math.max(1, sopra.punti - mia.punti + 1) : 0,
    } : null,
    scorsa: {
      partecipanti: scorse.length,
      podio: scorse.slice(0, 3).map(conNome),
      mia: scorse.find((v) => v.userId === userId) || null,
    },
  };
}
