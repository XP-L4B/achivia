/**
 * Le casse: dove nascono, come si aprono, quando spariscono.
 *
 * Una cassa vive in una vasca come tutto il resto, e passa per tre stati:
 *
 *   chiusa    a terra, in vista, aspetta che il giocatore ci arrivi sopra;
 *   apre      il giocatore l'ha toccata: l'animazione dura `animazione`
 *             secondi, poi si vede il contenuto e l'effetto e' applicato
 *             nello stesso istante, da `apriCassa`, una volta sola;
 *   aperta    resta a terra `indugio` secondi a spegnersi, e sparisce.
 *
 * `apriCassa` e' la porta unica dell'apertura: pesca UN effetto coi pesi
 * della rarita' (saltando quelli che adesso non valgono), lo applica
 * attraverso `applicaEffetto`, e fa il resto — la scritta, le particelle,
 * l'onda, l'annuncio per il cruscotto, lo scossone per le epiche. Il
 * gestore non sa che effetti esistano: chiede al registro.
 *
 * Il posto di nascita si sceglie intorno al giocatore, a portata di vista,
 * mai addosso a lui ne' a un boss, sempre dentro il mondo. L'arena non ha
 * muri, quindi un punto dentro il mondo e' un punto raggiungibile.
 */

import { CONFIG_CASSE, scegliRarita, scegliEffetto } from './contenuti/casse';
import { effettoById, effettoValido, applicaEffetto, durataEffetto } from './effetti';
import { compatta } from './vasca';
import { RAGGIO_GIOCATORE } from './combattimento';

export const CH_CHIUSA = 0;
export const CH_APRE = 1;
export const CH_APERTA = 2;

export const nuovaCassa = () => ({
  x: 0, y: 0, rarita: null, st: CH_CHIUSA, t: 0, fase: 0, effetto: null, morta: false,
});

const numeriDi = (id) => CONFIG_CASSE.effetti[id] || {};

/** Un punto valido per una cassa, o `null` se in `tentativi` prove non se n'e' trovato uno. */
export function puntoCassa(stato) {
  const c = CONFIG_CASSE.nascita;
  const g = stato.giocatore; const m = stato.mondo;
  for (let k = 0; k < c.tentativi; k += 1) {
    const a = stato.caso.fra(0, Math.PI * 2);
    const d = stato.caso.fra(c.distanza[0], c.distanza[1]);
    const x = Math.min(m.w - c.margine, Math.max(c.margine, g.x + Math.cos(a) * d));
    const y = Math.min(m.h - c.margine, Math.max(c.margine, g.y + Math.sin(a) * d));
    if (Math.hypot(x - g.x, y - g.y) < c.lontanoDalGiocatore) continue;
    const b = stato.boss;
    if (b && Math.hypot(x - b.x, y - b.y) < c.lontanoDalBoss + b.tipo.raggio * b.scala) continue;
    return { x, y };
  }
  return null;
}

/** Quante casse chiuse ci sono in campo. */
export function casseChiuse(stato) {
  let n = 0;
  for (let i = 0; i < stato.casse.n; i += 1) if (stato.casse.lista[i].st === CH_CHIUSA) n += 1;
  return n;
}

/** Una cassa nuova in (x, y). La rarita' e' pescata se non e' data. */
export function nasciCassa(stato, x, y, rarita = null) {
  const v = stato.casse;
  if (v.n >= v.lista.length) return null;
  const c = v.lista[v.n]; v.n += 1;
  c.x = x; c.y = y; c.rarita = rarita || scegliRarita(stato.caso);
  c.st = CH_CHIUSA; c.t = 0; c.fase = stato.caso.numero(); c.effetto = null; c.morta = false;
  stato.eventi.push('cassa');
  return c;
}

/**
 * Apre una cassa: un effetto, applicato adesso. Torna l'id dell'effetto,
 * o `null` se la cassa era gia' aperta. `idForzato` serve alle prove.
 */
export function apriCassa(stato, c, idForzato = null) {
  if (c.st === CH_APERTA) return null;
  const rar = c.rarita;
  const id = idForzato ?? scegliEffetto(stato.caso, rar.id, (eid) => effettoValido(stato, eid));
  const f = effettoById(id);
  if (!f) return null;
  const testo = applicaEffetto(stato, id, rar.durata);
  c.effetto = id; c.st = CH_APERTA; c.t = 0;
  stato.casseAperte += 1;
  const durata = durataEffetto(id, rar.durata);
  stato.annuncio = {
    id, nome: f.nome, icona: f.icona, descrizione: f.descrivi(numeriDi(id)), durata,
    rarita: rar.id, raritaNome: rar.nome, colore: rar.colore, t: stato.tempo,
  };
  if (testo) stato.galleggia(stato, c.x, c.y - 14, testo, rar.luce);
  stato.spruzza(stato, c.x, c.y - 6, rar.particelle, rar.colore, 70 + rar.aura * 30);
  stato.onda(stato, c.x, c.y, rar.onda, rar.colore, 0.5);
  if (rar.aura >= 1) { stato.lampoSchermo = 0.25; stato.lampoColore = rar.colore; }
  if (rar.scuote) stato.scossa = 0.3;
  stato.eventi.push('cassa-aperta');
  if (rar.id === 'epica') { stato.casseEpiche += 1; stato.eventi.push('cassa-epica'); }
  return id;
}

/** Un passo delle casse: le nascite a orario, il tocco del giocatore, l'animazione, la sparizione. */
export function aggiornaCasse(stato, dt) {
  const c = CONFIG_CASSE; const g = stato.giocatore;
  // le nascite
  stato.prossimaCassa -= dt;
  if (stato.prossimaCassa <= 0) {
    stato.prossimaCassa = c.nascita.ogni + stato.caso.fra(-c.nascita.varia, c.nascita.varia);
    if (casseChiuse(stato) < c.nascita.inCampo) {
      const p = puntoCassa(stato);
      if (p) nasciCassa(stato, p.x, p.y);
    }
  }
  // il giro delle casse
  const V = stato.casse;
  const portata = c.apertura.raggio + RAGGIO_GIOCATORE;
  for (let i = 0; i < V.n; i += 1) {
    const k = V.lista[i];
    if (k.st === CH_CHIUSA) {
      const dx = k.x - g.x; const dy = k.y - g.y;
      if (dx * dx + dy * dy < portata * portata) { k.st = CH_APRE; k.t = 0; stato.eventi.push('cassa-apre'); }
    } else if (k.st === CH_APRE) {
      k.t += dt;
      if (k.t >= c.apertura.animazione) apriCassa(stato, k);
    } else {
      k.t += dt;
      if (k.t >= c.apertura.indugio) k.morta = true;
    }
  }
  compatta(V, 'morta');
}
