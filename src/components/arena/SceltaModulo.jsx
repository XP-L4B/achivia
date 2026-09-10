import { useEffect } from 'react';
import { urlAsset } from '../../game/asset';

/**
 * La scelta di un modulo: tre carte, una si prende.
 *
 * Compare quando si sale di livello, all'inizio per le carte gratis
 * dell'account, e quando cade un boss: il bottino e' una carta in piu'.
 * Ogni carta porta la sua rarita' nel bordo: comune, insolita, rara, epica. Le carte sono armi nuove, potenziamenti di armi che si
 * hanno, evoluzioni e moduli: la carta porta un'etichetta che lo dice. Il tempo di gioco e' fermo finche' non si sceglie. Da
 * tastiera si prende con 1, 2 e 3.
 */
export default function SceltaModulo({ offerta, iniziale = false, bottino = false, restano = 0, onScegli }) {
  useEffect(() => {
    const tasto = (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= offerta.length) onScegli(offerta[n - 1].id);
    };
    window.addEventListener('keydown', tasto);
    return () => window.removeEventListener('keydown', tasto);
  }, [offerta, onScegli]);

  if (!offerta?.length) return null;

  return (
    <div className="arena-velo" role="dialog" aria-modal="true" aria-labelledby="arena-scelta-titolo">
      <section className="tv-panel arena-scelta">
        <header className="tv-testa">
          <span className="tv-prompt" aria-hidden="true">&gt;&gt;</span>
          <h2 className="tv-titolo" id="arena-scelta-titolo">
            {iniziale ? 'Modulo di partenza' : bottino ? 'Il boss è caduto' : 'Sei salito di livello'}
          </h2>
          {iniziale && restano > 1 && <span className="tv-meta">{restano} da scegliere</span>}
        </header>
        <div className="tv-riga-doppia" aria-hidden="true" />
        <p className="arena-scelta-nota">
          {iniziale
            ? 'Il tuo livello in Achivia ti dà questo modulo prima di cominciare.'
            : bottino
              ? 'Il bottino: una carta in più, e un po’ di vita. Il tempo è fermo.'
              : 'Scegli un modulo. Il tempo è fermo.'}
        </p>
        <div className="arena-moduli">
          {offerta.map((m, i) => {
            const icona = urlAsset(m.icona);
            return (
              <button key={m.id} type="button" className={`arena-modulo is-rarita-${m.rarita || 'comune'}`} onClick={() => onScegli(m.id)}>
                <span className="arena-modulo-testa">
                  <span className="arena-modulo-tasto" aria-hidden="true">{i + 1}</span>
                  {m.etichetta && <span className={`arena-modulo-etichetta is-${m.tipo || 'modulo'}`}>{m.etichetta}</span>}
                </span>
                {icona
                  ? <img className="arena-modulo-icona" src={icona} alt="" width={48} height={48} />
                  : <span className="arena-modulo-icona is-vuota" aria-hidden="true" />}
                <b className="arena-modulo-nome">{m.nome}</b>
                <span className="arena-modulo-desc">{m.descrizione}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
