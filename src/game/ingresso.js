/**
 * L'ingresso: tastiera, leva virtuale e puntatore, ridotti a un asse.
 *
 * Tre modi di dire "vai di la'", uno solo che conta: la tastiera vince, poi
 * la leva, poi il puntatore tenuto premuto. Il motore chiede `asse()` una
 * volta per passo e riceve un vettore gia' normalizzato — o zero.
 *
 * Il puntatore si registra in coordinate di schermo: la conversione in
 * direzione di mondo la fa chi conosce la telecamera, cioe' il motore.
 */
export function creaIngresso() {
  const tasti = new Set();
  const leva = { x: 0, y: 0 };
  const puntatore = { attivo: false, sx: 0, sy: 0, dirX: 0, dirY: 0 };
  const asse = { x: 0, y: 0 };

  const giu = (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) {
      tasti.add(k);
      e.preventDefault();
    }
  };
  const su = (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    tasti.delete(k);
  };
  const perdiFuoco = () => tasti.clear();

  return {
    attacca(finestra = window) {
      finestra.addEventListener('keydown', giu);
      finestra.addEventListener('keyup', su);
      finestra.addEventListener('blur', perdiFuoco);
    },
    stacca(finestra = window) {
      finestra.removeEventListener('keydown', giu);
      finestra.removeEventListener('keyup', su);
      finestra.removeEventListener('blur', perdiFuoco);
      tasti.clear();
    },
    /** La leva: un vettore in [-1, 1], (0, 0) a riposo. */
    impostaLeva(x, y) { leva.x = x; leva.y = y; },
    /** Il puntatore premuto in un punto dello schermo (coordinate del canvas). */
    premiPuntatore(sx, sy) { puntatore.attivo = true; puntatore.sx = sx; puntatore.sy = sy; },
    muoviPuntatore(sx, sy) { if (puntatore.attivo) { puntatore.sx = sx; puntatore.sy = sy; } },
    lasciaPuntatore() { puntatore.attivo = false; },
    puntatore,
    /** L'asse del passo. `dirDaPuntatore` la passa il motore, che conosce la telecamera. */
    asse(dirDaPuntatore) {
      let x = 0; let y = 0;
      if (tasti.has('a') || tasti.has('ArrowLeft')) x -= 1;
      if (tasti.has('d') || tasti.has('ArrowRight')) x += 1;
      if (tasti.has('w') || tasti.has('ArrowUp')) y -= 1;
      if (tasti.has('s') || tasti.has('ArrowDown')) y += 1;
      if (x === 0 && y === 0 && (leva.x !== 0 || leva.y !== 0)) { x = leva.x; y = leva.y; }
      if (x === 0 && y === 0 && puntatore.attivo && dirDaPuntatore) {
        const d = dirDaPuntatore(puntatore.sx, puntatore.sy);
        x = d.x; y = d.y;
      }
      const l = Math.hypot(x, y);
      if (l > 1) { x /= l; y /= l; }
      asse.x = x; asse.y = y;
      return asse;
    },
  };
}
