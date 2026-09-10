/**
 * Chi lavora qui, come sta, e che cosa si ricorda.
 *
 * La memoria e' la parte che conta. Un dipendente ignorato tre volte non e'
 * un dipendente ignorato una volta: reagisce peggio alla stessa risposta,
 * cede prima, e quando se ne va se ne va di colpo. Senza memoria un gioco a
 * decisioni e' una sequenza di scelte scollegate, e la lezione — che quello
 * che fai alle persone torna indietro — non arriva mai.
 *
 * Le schede di partenza stanno in `contenuti/cast.js` e non portano numeri:
 * anzianita', stipendio e stato iniziale nascono qui, dal seme, cosi' due
 * partite con lo stesso seme hanno la stessa squadra e partite diverse no.
 */

import { DIPENDENTI, MANAGER } from '../contenuti/cast.js';
import { PARTENZA, STIPENDI } from '../contenuti/bilancio.js';

/** Uno che lavora qui, appena assunto dal caso. */
function nuovaPersona(scheda, caso, tipo) {
  const anzianita = tipo === 'dipendente' ? Math.round(caso.fra(0, 9)) : Math.round(caso.fra(2, 12));
  let stipendio = STIPENDI.base + anzianita * STIPENDI.perAnno;
  if (scheda.tratti?.includes('sottopagato')) stipendio *= STIPENDI.scontoSottopagato;
  if (scheda.tratti?.includes('indispensabile')) stipendio *= STIPENDI.premioIndispensabile;
  return {
    id: scheda.id,
    tipo,
    nome: scheda.nome,
    specie: scheda.specie,
    ruolo: scheda.ruolo,
    sprite: scheda.sprite,
    tratti: scheda.tratti ? [...scheda.tratti] : [],
    agenda: scheda.agenda || null,
    anzianita,
    stipendio: Math.round(stipendio),
    /* Come sta lui, che non e' come sta l'azienda: si puo' avere il morale
       aziendale a sessanta e dentro due persone a terra. */
    produttivita: Math.round(caso.fra(55, 88)),
    morale: Math.round(caso.fra(50, 80)),
    lealta: Math.round(caso.fra(45, 75)),
    /* Quello che si ricorda, e che dice nei dialoghi dopo. */
    memoria: { accettate: 0, rifiutate: 0, rimandate: 0, ignorate: 0, ultimaRisposta: null, ultimoGiorno: 0 },
    /* Chi se n'e' andato resta nell'elenco: serve al rapporto finale. */
    attivo: true,
    uscitoIl: 0,
    /* Il sostituto rende meno per un po': questi sono i giorni che mancano. */
    rodaggio: 0,
  };
}

export function assumiTutti(caso) {
  return [
    ...DIPENDENTI.map((s) => nuovaPersona(s, caso, 'dipendente')),
    ...MANAGER.map((s) => nuovaPersona(s, caso, 'assistant_manager')),
  ];
}

export const attivi = (persone) => persone.filter((p) => p.attivo);
export const dipendentiAttivi = (persone) => persone.filter((p) => p.attivo && p.tipo === 'dipendente');
export const managerAttivi = (persone) => persone.filter((p) => p.attivo && p.tipo === 'assistant_manager');

/**
 * Quanto pesa oggi il ricordo di chi ti sta davanti.
 *
 * Zero vuol dire che con lui sei in pari. Sopra zero vuol dire che ti sei
 * accumulato dei no e dei silenzi, e ogni no successivo costa di piu': i
 * silenzi valgono il doppio dei rifiuti, perche' un no almeno e' una
 * risposta.
 */
export function pesoDelRicordo(persona) {
  const m = persona.memoria;
  return m.rifiutate + m.ignorate * 2 + m.rimandate * 0.5;
}

/** Un tratto ce l'ha o no: si chiede cosi', e non leggendo l'elenco a mano. */
export const ha = (persona, tratto) => persona.tratti.includes(tratto);

/**
 * Com'e' andata, per lui.
 *
 * L'umore non dipende solo dalla risposta di adesso: chi e' gia' stato
 * rifiutato due volte reagisce peggio a parita' di decisione, e chi e'
 * fragile reagisce peggio comunque. E' la regola che rende visibile la
 * memoria — se la faccina fosse solo una funzione dell'ultima risposta, la
 * memoria sarebbe un numero che nessuno vede.
 */
export function umoreDopo(persona, azione) {
  const peso = pesoDelRicordo(persona);
  const fragile = ha(persona, 'fragile');
  const ambizioso = ha(persona, 'ambizioso');
  if (azione === 'accetta') {
    if (peso >= 3) return 'sollevato';
    if (ambizioso || persona.lealta > 70) return 'trionfante';
    return 'soddisfatto';
  }
  if (azione === 'rifiuta') {
    if (peso >= 4 || (fragile && peso >= 2)) return 'furioso';
    if (peso >= 2) return 'offeso';
    if (fragile) return 'umiliato';
    return 'deluso';
  }
  if (azione === 'rimanda') {
    if (peso >= 3) return 'rassegnato';
    return 'comprensivo';
  }
  /* scaduta: nessuna risposta */
  if (peso >= 3) return 'furioso';
  return 'ignorato';
}

/** Segna la risposta nella memoria di chi l'ha ricevuta. */
export function ricorda(persona, azione, giorno) {
  const m = persona.memoria;
  if (azione === 'accetta') m.accettate += 1;
  else if (azione === 'rifiuta') m.rifiutate += 1;
  else if (azione === 'rimanda') m.rimandate += 1;
  else m.ignorate += 1;
  m.ultimaRisposta = azione;
  m.ultimoGiorno = giorno;
}

/** Il costo del personale di oggi: chi c'e', quanto prende. */
export const costoDelPersonale = (persone) => dipendentiAttivi(persone).reduce((s, p) => s + p.stipendio, 0)
  + managerAttivi(persone).reduce((s, p) => s + Math.round(p.stipendio * 1.35), 0);

/** Lo stato di partenza dell'azienda: i cinque che si vedono e i due che no. */
export const aziendaDiPartenza = () => ({ ...PARTENZA, fatturato: 0, costi: 0 });
