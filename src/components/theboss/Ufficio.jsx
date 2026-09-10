import { useEffect, useRef } from 'react';
import { MONDO, MURO, PAVIMENTO, ARREDI, POSTI, INGRESSO } from '../../giochi/theboss/contenuti/stanza';
import { umoreById } from '../../giochi/theboss/contenuti/umori';

/**
 * L'ufficio: la stanza, il capo, e chi e' appena entrato.
 *
 * Disegna su una tela e non con dei tag, per la stessa ragione dell'arena:
 * una stanza fatta di trenta immagini sovrapposte in HTML e' trenta nodi
 * che il browser ricompone a ogni fotogramma, e su un telefono si sente.
 * Qui e' un disegno solo.
 *
 * Il ritmo e' lento apposta — sei fotogrammi al secondo, quelli
 * dell'animazione di attesa — perche' non c'e' niente da inseguire: si
 * legge e si decide. La tela si ferma quando la scheda va in secondo piano,
 * e non parte proprio se chi guarda ha chiesto meno movimento
 * (`prefers-reduced-motion`): resta il primo fotogramma, e non si perde
 * niente di quello che c'e' da capire.
 *
 * L'emoji dell'umore **non** sta sulla tela: sta in un nodo HTML sopra la
 * testa. Cosi' e' testo vero — un lettore di schermo lo legge, si
 * ingrandisce con la pagina, e non diventa una macchia quando la tela si
 * ingrandisce di quattro.
 */
export default function Ufficio({ asset, visitatore, umore }) {
  const tela = useRef(null);

  /* Il disegno riparte quando cambia chi e' entrato: l'istante d'ingresso e'
     una variabile di questo effetto, non uno stato: nessuno la deve leggere
     da fuori e nessun ridisegno di React la deve resettare. */
  useEffect(() => {
    const canvas = tela.current;
    if (!canvas || !asset) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.imageSmoothingEnabled = false;
    const t0 = performance.now();

    const menoMoto = typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tessera = (nome, cx, cy, cw, ch, x, y) => {
      const a = asset.get(nome);
      if (!a?.img) return;
      ctx.drawImage(a.img, cx * 16, cy * 16, cw * 16, ch * 16, x, y, cw * 16, ch * 16);
    };

    /* `specchio` ribalta il fotogramma sul posto: i fogli disegnano tutti
       rivolti a destra, e il cavaliere deve guardare chi ha davanti, che
       entra da sinistra. Si ribalta qui e non nei file: e' reversibile,
       non tocca gli originali comprati, e resta scritto perche'. */
    const persona = (nome, x, y, fotogramma, specchio = false) => {
      const a = asset.get(nome);
      if (!a?.img) return;
      const q = a.riquadro;
      const f = fotogramma % (a.fotogrammi || 1);
      const px = Math.round(x);
      const py = Math.round(y);
      if (!specchio) {
        ctx.drawImage(a.img, f * q, 0, q, q, px, py, q, q);
        return;
      }
      ctx.save();
      ctx.translate(px + q, py);
      ctx.scale(-1, 1);
      ctx.drawImage(a.img, f * q, 0, q, q, 0, 0, q, q);
      ctx.restore();
    };

    function stanza() {
      for (let y = 0; y < MONDO.h; y += 16) {
        for (let x = 0; x < MONDO.w; x += 16) {
          tessera(PAVIMENTO.foglio, PAVIMENTO.cella[0], PAVIMENTO.cella[1], 1, 1, x, y);
        }
      }
      for (let x = 0; x < MONDO.w; x += 16) {
        tessera(MURO.foglio, MURO.alto[0], MURO.alto[1], 1, 1, x, 0);
        tessera(MURO.foglio, MURO.alto[0], MURO.alto[1], 1, 1, x, 16);
        tessera(MURO.foglio, MURO.basso[0], MURO.basso[1], 1, 1, x, 32);
      }
      for (const a of ARREDI) tessera(a.foglio, a.cella[0], a.cella[1], a.celle[0], a.celle[1], a.x, a.y);
    }

    let fermo = false;
    let richiesta = 0;
    function disegna(adesso) {
      if (!fermo) richiesta = requestAnimationFrame(disegna);
      const t = menoMoto ? 1 : (adesso - t0) / 1000;
      const f = menoMoto ? 0 : Math.floor(t * 6);
      ctx.clearRect(0, 0, MONDO.w, MONDO.h);
      stanza();
      persona('capo.fermo', POSTI.capo.x, POSTI.capo.y, f, POSTI.capo.guarda === 'sinistra');
      if (visitatore) {
        const avanzo = Math.min(1, t / INGRESSO.secondi);
        const x = POSTI.porta.x + (POSTI.visitatore.x - POSTI.porta.x) * avanzo;
        persona(`persona.${visitatore}`, x, POSTI.visitatore.y, f);
      }
    }
    richiesta = requestAnimationFrame(disegna);

    const sospendi = () => {
      if (document.hidden) { fermo = true; cancelAnimationFrame(richiesta); }
      else if (fermo) { fermo = false; richiesta = requestAnimationFrame(disegna); }
    };
    document.addEventListener('visibilitychange', sospendi);
    return () => {
      fermo = true;
      cancelAnimationFrame(richiesta);
      document.removeEventListener('visibilitychange', sospendi);
    };
  }, [asset, visitatore]);

  const u = umore ? umoreById(umore.id) : null;

  return (
    <div className="tb-ufficio">
      <canvas
        ref={tela}
        className="tb-tela"
        width={MONDO.w}
        height={MONDO.h}
        role="img"
        aria-label="L’ufficio del capo: gli scaffali delle pozioni, la lavagna dei numeri, la scrivania."
      />
      {u && (
        <span className="tb-umore" key={umore.n} aria-live="polite">
          <span aria-hidden="true">{u.emoji}</span>
          <span className="tb-solo-lettori">{u.nome}</span>
        </span>
      )}
    </div>
  );
}
