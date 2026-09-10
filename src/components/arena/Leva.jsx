import { useRef, useState } from 'react';

const RAGGIO = 44;   // px: quanto si puo' spostare il pomello
const ZONA_MORTA = 6;

/**
 * La leva virtuale, per il dito.
 *
 * Un cerchio con un pomello: si trascina, e la direzione arriva al motore
 * come un vettore in [-1, 1]. Al rilascio torna al centro e il vettore va
 * a zero. Si disegna solo dove il puntatore e' grosso — un dito — perche'
 * col mouse c'e' la tastiera, e c'e' il tenere premuto sulla tela.
 */
export default function Leva({ onMuovi }) {
  const [pomello, setPomello] = useState({ x: 0, y: 0, attiva: false });
  const origine = useRef(null);

  const aggiorna = (e) => {
    if (!origine.current) return;
    let dx = e.clientX - origine.current.x;
    let dy = e.clientY - origine.current.y;
    const l = Math.hypot(dx, dy);
    if (l > RAGGIO) { dx = (dx / l) * RAGGIO; dy = (dy / l) * RAGGIO; }
    setPomello({ x: dx, y: dy, attiva: true });
    if (l < ZONA_MORTA) onMuovi(0, 0);
    else onMuovi(dx / RAGGIO, dy / RAGGIO);
  };

  const giu = (e) => {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    origine.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    aggiorna(e);
  };
  const su = (e) => {
    origine.current = null;
    setPomello({ x: 0, y: 0, attiva: false });
    onMuovi(0, 0);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      className={`arena-leva${pomello.attiva ? ' is-attiva' : ''}`}
      onPointerDown={giu}
      onPointerMove={aggiorna}
      onPointerUp={su}
      onPointerCancel={su}
      role="presentation"
      aria-hidden="true"
    >
      <div className="arena-leva-pomello" style={{ transform: `translate(${pomello.x}px, ${pomello.y}px)` }} />
    </div>
  );
}
