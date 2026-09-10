/**
 * La cassa dell'organizzazione: i crediti che ha, e chi li puo' dare.
 *
 * Il piano ci mette dentro la dotazione a ogni pagamento; da qui escono
 * verso le persone. E' il pezzo che mancava alla frase "crediti mensili da
 * distribuire": distribuire vuol dire averli da qualche parte prima di
 * darli, e finche' non c'era la cassa quel qualche parte non esisteva.
 *
 * Perche' un secondo portafoglio, dopo un anno in cui i crediti erano di
 * una persona e basta. Perche' questi non sono di nessuno in particolare:
 * sono dell'azienda. Metterli sul conto del proprietario avrebbe
 * funzionato per un'organizzazione con un capo solo, e sarebbe stato falso
 * per tutte le altre — al cambio di proprietario se li sarebbe portati via,
 * e due co-admin non avrebbero saputo quanti ne restassero.
 *
 * Chi puo' versare: l'admin, i co-admin, e chi ha un ruolo su misura con il
 * permesso `org.credits`. Quel permesso esisteva da sempre e non comandava
 * niente: adesso comanda questo.
 */

import {
  creditiInCassa, muoviCassa, muoviCrediti, movimenti, getUserById, getUsersByOrg,
  orgDiPersona, nomeOrg, orgChiusa, save,
} from './db';
import { puo } from './permessi';

const vietato = { ok: false, errore: 'Non hai il permesso di dare i crediti dell’organizzazione.' };

/** Se una persona puo' dare i crediti della cassa. */
export const puoUsareLaCassa = (persona) =>
  persona?.role === 'admin' || puo(persona, 'org.credits');

/** Quanto c'e' in cassa, e da dove e' arrivato. */
export function statoCassa(orgId) {
  const righe = movimenti({ orgId, cassa: true });
  const entrate = righe.filter((m) => m.quanti > 0).reduce((s, m) => s + m.quanti, 0);
  const uscite = righe.filter((m) => m.quanti < 0).reduce((s, m) => s - m.quanti, 0);
  return { saldo: creditiInCassa(orgId), entrate, uscite, movimenti: righe };
}

/**
 * Versa crediti dalla cassa a una persona dell'organizzazione.
 *
 * Due righe nel registro e non una: un'uscita dalla cassa e un'entrata sul
 * conto della persona. Costa una riga in piu' e ripaga subito — i due
 * registri restano quadrati ognuno per conto suo, e guardando il conto di
 * una persona si vede da dove sono arrivati quei crediti senza dover andare
 * a cercare nella cassa.
 *
 * Se la seconda meta' non riesce, la prima si annulla: meglio un
 * versamento che non parte di uno che sparisce per strada.
 */
export function versaDallaCassa(me, { aId, quanti, nota } = {}) {
  if (!puoUsareLaCassa(me)) return vietato;
  const somma = Math.max(0, Math.round(Number(quanti) || 0));
  if (!somma) return { ok: false, errore: 'Scrivi quanti crediti vuoi dare.' };
  const a = getUserById(aId);
  if (!a || a.orgId !== me.orgId) {
    return { ok: false, errore: 'Puoi darli solo a chi sta nella tua organizzazione.' };
  }
  /* L'admin non incassa crediti: e' quello che li mette in circolo, e un
     proprietario che si versa la cassa addosso non sta distribuendo niente,
     sta svuotando l'azienda nel proprio conto. Vale qui come vale per le
     ricompense delle quest. */
  if (a.role === 'admin') {
    return { ok: false, errore: 'Chi amministra non riceve crediti: è quello che li distribuisce.' };
  }
  if (creditiInCassa(me.orgId) < somma) {
    return { ok: false, errore: `In cassa ce ne sono ${creditiInCassa(me.orgId)}.` };
  }

  const uscita = muoviCassa({
    orgId: me.orgId,
    quanti: -somma,
    causale: 'versamento',
    riferimento: a.id,
    daId: me.id,
    nota,
  });
  if (!uscita) return { ok: false, errore: 'Non è stato possibile prendere i crediti dalla cassa.' };

  const entrata = muoviCrediti({
    userId: a.id,
    quanti: somma,
    causale: 'versamento',
    orgId: me.orgId,
    riferimento: uscita.id,
    daId: me.id,
    nota,
  });
  if (!entrata) {
    muoviCassa({ orgId: me.orgId, quanti: somma, causale: 'versamento', nota: 'annullato' });
    return { ok: false, errore: 'Non è stato possibile accreditarli.' };
  }
  save();
  return { ok: true, quanti: somma, aId: a.id, cassa: uscita.saldo };
}

/**
 * Le casse su cui una persona ha voce: quelle delle organizzazioni che
 * possiede.
 *
 * Non quelle in cui amministra e basta. Comprare crediti per una cassa e'
 * mettere denaro proprio dentro una cosa di qualcun altro, e da li' non
 * tornano indietro: la decisione e' di chi l'organizzazione ce l'ha. Un
 * co-admin che vuole rifornirla lo chiede a chi la possiede, ed e' giusto
 * che debba chiederlo.
 */
export const casseDiCui = (userId) =>
  orgDiPersona(userId)
    .filter((m) => m.proprietario && !orgChiusa(m.orgId))
    .map((m) => ({ orgId: m.orgId, nome: nomeOrg(m.orgId) || m.orgId, saldo: creditiInCassa(m.orgId) }));

/** A chi si possono dare: le persone dell'organizzazione, admin esclusi. */
export const chiPuoRicevere = (orgId) =>
  getUsersByOrg(orgId).filter((u) => u.role !== 'admin');
