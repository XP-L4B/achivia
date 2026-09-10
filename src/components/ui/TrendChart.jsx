import { useMemo, useState } from 'react';
import Chips from './Chips';
import LineChart from './LineChart';
import TerminalPanel from '../terminal/TerminalPanel';
import { TerminalStato } from '../terminal/TerminalRows';
import { GRUPPI, METRICHE, serieStorica, serieStoricaOrg } from '../../data/trends';

/**
 * Vista a grafico: scelta del periodo e del dato, e la spezzata dei valori
 * mese per mese.
 *
 * Con `user` disegna i dati di una persona, con `orgId` quelli di tutta
 * l'organizzazione. Le metriche sono le stesse — le domande che si fanno a
 * una persona si fanno anche a un'azienda — e cosi' i due grafici si
 * leggono con lo stesso occhio.
 */

const PERIODI = [
  { id: '3',   label: '3 MESI',  mesi: 3 },
  { id: '6',   label: '6 MESI',  mesi: 6 },
  { id: '12',  label: '1 ANNO',  mesi: 12 },
  { id: 'custom', label: 'SCEGLI', mesi: null },
];

const iso = (d) => d.toISOString().slice(0, 10);

/** Primo giorno del mese, `mesi` indietro rispetto a oggi. */
function inizioPeriodo(mesi) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (mesi - 1));
  return d;
}

export default function TrendChart({ user, orgId }) {
  // L'istante di riferimento si fissa all'apertura, come nelle griglie: un
  // "adesso" che cambia a ogni render sposterebbe l'ultimo mese da solo.
  const [adesso] = useState(() => Date.now());
  const [periodo, setPeriodo] = useState('6');
  const [metrica, setMetrica] = useState(METRICHE[0].id);
  const [daCustom, setDaCustom] = useState(() => iso(inizioPeriodo(6)));
  const [aCustom, setACustom] = useState(() => iso(new Date()));

  const mesi = PERIODI.find((p) => p.id === periodo)?.mesi ?? null;
  const custom = mesi === null;

  const { da, a, invertito } = useMemo(() => {
    if (!custom) return { da: inizioPeriodo(mesi).getTime(), a: adesso, invertito: false };
    const d = new Date(daCustom).getTime();
    const f = new Date(aCustom).getTime();
    if (!Number.isFinite(d) || !Number.isFinite(f)) {
      return { da: inizioPeriodo(6).getTime(), a: adesso, invertito: false };
    }
    // Date al contrario: si mostra comunque qualcosa, avvisando.
    return { da: Math.min(d, f), a: Math.max(d, f), invertito: f < d };
  }, [custom, mesi, daCustom, aCustom, adesso]);

  const serie = useMemo(
    () => (orgId ? serieStoricaOrg({ orgId, metrica, da, a }) : serieStorica({ user, metrica, da, a })),
    [user, orgId, metrica, da, a]
  );

  const scelta = METRICHE.find((m) => m.id === metrica);

  return (
    <section>
      {/* I comandi stanno tutti sopra il grafico, in una fascia sola */}
      <Chips items={PERIODI} value={periodo} onChange={setPeriodo} ariaLabel="Periodo del grafico" />

      {custom && (
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: '0 14px', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
          <label className="label" style={{ flex: 1, minWidth: 130 }}>
            Dal
            <input type="date" value={daCustom} max={aCustom} onChange={(e) => setDaCustom(e.target.value)} />
          </label>
          <label className="label" style={{ flex: 1, minWidth: 130 }}>
            Al
            <input type="date" value={aCustom} min={daCustom} onChange={(e) => setACustom(e.target.value)} />
          </label>
        </div>
      )}

      <div style={{ padding: '0 14px', marginBottom: 'var(--space-3)' }}>
        <label className="label">
          Dato
          <select value={metrica} onChange={(e) => setMetrica(e.target.value)}>
            {/* I gruppi arrivano dall'elenco delle metriche: scritti a mano
                qui, un gruppo nuovo sarebbe invisibile finche' qualcuno non
                si ricordava di aggiungerlo anche in questa riga. */}
            {GRUPPI.map((gruppo) => (
              <optgroup key={gruppo} label={gruppo}>
                {METRICHE.filter((m) => m.gruppo === gruppo).map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo={scelta?.label}
          meta={serie.perAnno ? 'media per anno' : 'media mese per mese'}
          piede={serie.vuota ? 'SERIE: VUOTA' : `PUNTI_IN_SERIE: ${serie.punti.length}`}
          tonoPiede={serie.vuota ? 'attesa' : ''}
        >
          {invertito && (
            <TerminalStato tono="errore">
              Date invertite: il periodo è stato raddrizzato.
            </TerminalStato>
          )}

          {serie.vuota ? (
            <p className="tv-vuoto">
              Non c&apos;è ancora storico da mettere in grafico: i punti compaiono
              man mano che le quest vengono chiuse.
            </p>
          ) : (
            <LineChart
              punti={serie.punti}
              unita={serie.unita}
              etichetta={serie.etichetta}
              perAnno={serie.perAnno}
            />
          )}
        </TerminalPanel>
      </div>
    </section>
  );
}
