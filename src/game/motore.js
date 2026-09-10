/**
 * Il motore: la facciata che React usa, e l'unica.
 *
 * Mette insieme la partita, l'ingresso, il disegno e il ciclo, e parla con
 * la schermata attraverso quattro chiamate: `onHud` (pochi numeri, otto
 * volte al secondo), `onScelta` (c'e' un modulo da scegliere: il tempo e'
 * fermo, e il motivo: 'iniziale', 'livello' o 'bottino'), `onFine` (la partita e' finita, ecco il riassunto) e `onPausa`
 * (il ciclo si e' fermato o e' ripartito — anche da solo, quando la scheda
 * va in secondo piano). React non vede mai un fotogramma.
 */

import { creaPartita, avanza, scegliModulo, fotografia, riassunto } from './partita';
import { creaIngresso } from './ingresso';
import { creaDisegno } from './disegno';
import { creaCiclo } from './ciclo';
import { caricaTutto } from './caricatore';
import { semeDalTempo } from './caso';

const OGNI_QUANTI_FOTOGRAMMI_HUD = 8;

export function creaMotore({ canvas, personaggio, livello = 1, moduliGratis = 0, seme, onHud, onScelta, onFine, onPausa }) {
  const stato = creaPartita({ personaggio, livello, moduliGratis, seme: seme ?? semeDalTempo() });
  const ingresso = creaIngresso();
  let disegno = null;
  let ciclo = null;
  let contatore = 0;
  let sceltaAnnunciata = false;
  let fineAnnunciata = false;
  let fermato = false;

  const dirDaPuntatore = (sx, sy) => disegno.direzioneDaSchermo(stato, sx, sy);

  const pronto = caricaTutto().then((asset) => {
    if (fermato) return;
    disegno = creaDisegno(canvas, asset);
    ciclo = creaCiclo({
      avanza: (dt) => {
        stato.raggioVista = disegno.raggioVista();
        avanza(stato, dt, ingresso.asse(dirDaPuntatore));
        if (stato.fase === 'scelta' && !sceltaAnnunciata) {
          sceltaAnnunciata = true;
          onScelta?.(stato.offerta.slice(), stato.motivo);
        }
        if (stato.fase === 'finita' && !fineAnnunciata) {
          fineAnnunciata = true;
          onFine?.(riassunto(stato));
        }
        contatore += 1;
        if (contatore % OGNI_QUANTI_FOTOGRAMMI_HUD === 0) onHud?.(fotografia(stato));
      },
      disegna: (orologio) => disegno.disegna(stato, orologio),
    });
    // La prima scelta — i moduli gratis dell'account — si annuncia subito.
    if (stato.fase === 'scelta') { sceltaAnnunciata = true; onScelta?.(stato.offerta.slice(), stato.motivo); }
    onHud?.(fotografia(stato));
  }).catch((errore) => {
    // Un canvas senza contesto, un'immagine che rompe il decoder: la partita non parte,
    // e lo si dice in console invece di lasciare una promessa rifiutata a mezz'aria.
    console.error('[arena] il motore non e\' partito', errore);
  });

  function pausa(v) {
    if (!ciclo || ciclo.inPausa === Boolean(v)) return;
    ciclo.pausa(v);
    onPausa?.(ciclo.inPausa);
  }

  const suPuntatoreGiu = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const r = canvas.getBoundingClientRect();
    ingresso.premiPuntatore(e.clientX - r.left, e.clientY - r.top);
    canvas.setPointerCapture?.(e.pointerId);
  };
  const suPuntatoreMuove = (e) => {
    if (!ingresso.puntatore.attivo) return;
    const r = canvas.getBoundingClientRect();
    ingresso.muoviPuntatore(e.clientX - r.left, e.clientY - r.top);
  };
  const suPuntatoreSu = () => ingresso.lasciaPuntatore();
  const suVisibilita = () => { if (document.visibilityState !== 'visible') pausa(true); };

  return {
    pronto,
    stato,
    avvia() {
      if (fermato) return;
      ingresso.attacca();
      canvas.addEventListener('pointerdown', suPuntatoreGiu);
      canvas.addEventListener('pointermove', suPuntatoreMuove);
      canvas.addEventListener('pointerup', suPuntatoreSu);
      canvas.addEventListener('pointercancel', suPuntatoreSu);
      document.addEventListener('visibilitychange', suVisibilita);
      ciclo?.avvia();
    },
    ferma() {
      fermato = true;
      ciclo?.ferma();
      disegno?.chiudi();
      ingresso.stacca();
      canvas.removeEventListener('pointerdown', suPuntatoreGiu);
      canvas.removeEventListener('pointermove', suPuntatoreMuove);
      canvas.removeEventListener('pointerup', suPuntatoreSu);
      canvas.removeEventListener('pointercancel', suPuntatoreSu);
      document.removeEventListener('visibilitychange', suVisibilita);
    },
    pausa,
    /**
     * Si esce a partita in corso.
     *
     * Torna il riassunto di adesso e chiude la partita, cosi' quello che
     * si e' fatto fino a qui viene registrato invece di sparire: dodici
     * minuti buttati perche' e' suonato il telefono sarebbero una
     * punizione, e uscire non e' barare — il tempo sopravvissuto e' quello
     * vero, e in classifica conta comunque la partita migliore.
     *
     * Torna `null` se la partita era gia' finita: la fine si annuncia una
     * volta sola, che sia per morte o per uscita.
     */
    abbandona() {
      if (fineAnnunciata) return null;
      fineAnnunciata = true;
      stato.fase = 'finita';
      ciclo?.pausa(true);
      return riassunto(stato);
    },
    get inPausa() { return ciclo?.inPausa ?? false; },
    /** La leva virtuale: la chiama il componente Leva. */
    leva(x, y) { ingresso.impostaLeva(x, y); },
    /** Il modulo scelto. Torna `true` se la partita riprende, `false` se c'e' un'altra scelta. */
    scegli(id) {
      const ok = scegliModulo(stato, id);
      if (!ok) return false;
      if (stato.fase === 'scelta') { onScelta?.(stato.offerta.slice(), stato.motivo); return false; }
      sceltaAnnunciata = false;
      onHud?.(fotografia(stato));
      return true;
    },
    fotografia: () => fotografia(stato),
  };
}
