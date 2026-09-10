import { useId, useState } from 'react';

/**
 * Diagramma lineare a una sola serie, in SVG: il progetto non ha librerie di
 * grafici e per una spezzata non vale la pena aggiungerne una.
 *
 * Una serie sola non ha legenda — la dice il titolo — e il valore è scritto
 * solo sull'ultimo punto: un numero su ogni punto sarebbe illeggibile. Gli
 * altri valori si leggono passando sopra i punti (o con Tab da tastiera) e
 * restano comunque tutti nella vista a valori, che è la tabella di questo
 * grafico.
 */

/* I colori vengono dal terminale: il grafico e' un pannello di dati come gli
   altri, e una spezzata di un'altra tinta dentro la sua cornice sarebbe
   l'unico punto dell'app in cui i numeri cambiano lingua. Sono variabili CSS
   anche qui dentro, cosi' il fosforo si cambia da `terminal.css` come per
   tutto il resto — gli attributi di presentazione dell'SVG le accettano. */
const COLORE = 'var(--tv-primary)';
const GRIGLIA = 'var(--tv-ghost)';
const SUPERFICIE = 'var(--tv-bg)';

/** Tick tondi: il passo sale per 1, 2, 5 × 10ⁿ finché non ne restano pochi. */
function scalaY(max) {
  if (max <= 0) return { top: 1, passo: 1 };
  const grezzo = max / 4;
  const ordine = 10 ** Math.floor(Math.log10(grezzo));
  const passo = [1, 2, 5, 10].map((m) => m * ordine).find((p) => max / p <= 4) ?? ordine * 10;
  return { top: Math.ceil(max / passo) * passo, passo };
}

export default function LineChart({ punti, unita = '', etichetta = '', perAnno = false }) {
  const [attivo, setAttivo] = useState(null);
  const id = useId();

  const W = 320;
  const H = 180;
  const M = { top: 14, right: 16, bottom: 30, left: 34 };
  const pw = W - M.left - M.right;
  const ph = H - M.top - M.bottom;

  const max = Math.max(...punti.map((p) => p.valore), 0);
  const { top, passo } = scalaY(unita === '%' ? Math.max(max, 100) : max);
  const tick = [];
  for (let v = 0; v <= top; v += passo) tick.push(v);

  const x = (i) => (punti.length === 1 ? M.left + pw / 2 : M.left + (i * pw) / (punti.length - 1));
  const y = (v) => M.top + ph - (top > 0 ? (v / top) * ph : 0);

  const linea = punti.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.valore)}`).join(' ');
  const ultimo = punti.length - 1;

  // Con molti punti le etichette dei mesi si sovrappongono: se ne salta una
  // ogni n, tenendo sempre il primo e l'ultimo.
  const salto = Math.ceil(punti.length / 7);
  const mostraX = (i) => i === 0 || i === ultimo || i % salto === 0;

  const testo = (p) => `${p.etichetta}${p.anno ? ` ${String(p.anno).slice(2)}` : ''}: ${p.valore}${unita}`;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`${etichetta}: andamento per ${perAnno ? 'anno' : 'mese'}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Griglia e asse: filo sottile continuo, un passo sopra lo sfondo */}
        {tick.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} stroke={GRIGLIA} strokeWidth="1" />
            <text
              x={M.left - 6}
              y={y(v) + 3}
              textAnchor="end"
              fill="var(--tv-dim)"
              style={{ fontSize: 8, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--tv-font)' }}
            >
              {v}
            </text>
          </g>
        ))}

        {/* Mesi o anni */}
        {punti.map((p, i) => mostraX(i) && (
          <text
            key={p.chiave}
            x={x(i)}
            y={H - M.bottom + 14}
            textAnchor="middle"
            fill="var(--tv-dim)"
            style={{ fontSize: 8, fontFamily: 'var(--tv-font)' }}
          >
            {p.etichetta}
          </text>
        ))}

        {/* Il punto sotto il puntatore, incrociato con l'asse */}
        {attivo !== null && (
          <line
            x1={x(attivo)} x2={x(attivo)} y1={M.top} y2={M.top + ph}
            stroke="var(--tv-secondary)" strokeWidth="1" strokeDasharray="2 3"
          />
        )}

        <path d={linea} fill="none" stroke={COLORE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Anello nel colore della superficie: tiene i punti leggibili dove
            si sovrappongono alla linea */}
        {punti.map((p, i) => (
          <rect
            key={p.chiave}
            x={x(i) - 3} y={y(p.valore) - 3} width="6" height="6"
            fill={COLORE} stroke={SUPERFICIE} strokeWidth="2"
            opacity={attivo === null || attivo === i ? 1 : 0.65}
          />
        ))}

        {/* Valore del solo ultimo punto */}
        {punti.length > 0 && (
          <text
            x={Math.min(x(ultimo) + 6, W - 2)}
            y={y(punti[ultimo].valore) - 8}
            textAnchor={ultimo === 0 ? 'middle' : 'end'}
            fill="var(--tv-bright)"
            style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--tv-font)' }}
          >
            {punti[ultimo].valore}{unita}
          </text>
        )}

        {/* Zone di aggancio: larghe quanto la fetta, non quanto il pallino */}
        {punti.map((p, i) => (
          <rect
            key={p.chiave}
            x={x(i) - pw / Math.max(punti.length * 2, 2)}
            y={M.top}
            width={Math.max(pw / Math.max(punti.length, 1), 12)}
            height={ph}
            fill="transparent"
            tabIndex={0}
            role="button"
            aria-label={testo(p)}
            aria-describedby={`${id}-tip`}
            onMouseEnter={() => setAttivo(i)}
            onMouseLeave={() => setAttivo(null)}
            onFocus={() => setAttivo(i)}
            onBlur={() => setAttivo(null)}
            style={{ cursor: 'pointer', outline: 'none' }}
          />
        ))}
      </svg>

      {/* Il riquadro con il valore accompagna il grafico, non lo sostituisce:
          gli stessi numeri stanno nella vista a valori. */}
      <p
        id={`${id}-tip`}
        aria-live="polite"
        style={{
          margin: '6px 0 0',
          minHeight: '1.2em',
          textAlign: 'center',
          fontFamily: 'var(--tv-font)',
          fontSize: '0.64rem',
          letterSpacing: '0.05em',
          color: attivo === null ? 'var(--tv-dim)' : 'var(--tv-bright)',
        }}
      >
        {attivo === null ? 'Tocca un punto per leggerne il valore' : testo(punti[attivo])}
      </p>
    </div>
  );
}
