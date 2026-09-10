import { useEffect, useState } from 'react';
import Button from './Button';
import MusicIcon from './MusicIcon';
import { accendi, impostaVolume, iscriviti, prossimo, statoMusica } from '../../data/musica';

/**
 * I comandi della musica di sottofondo.
 *
 * Stanno in due posti — nelle impostazioni e sulla schermata d'accesso — e
 * sono lo stesso pezzo di codice: due copie della stessa cosa finiscono per
 * assomigliarsi sempre meno.
 *
 * Sulla schermata d'accesso servono davvero: la musica parte al primo clic,
 * e il primo clic si fa li'. Chi la trova troppo alta, o non la vuole, deve
 * poterlo dire subito, non dopo essere entrato e aver trovato le
 * impostazioni.
 *
 *   completo   tre righe: se suona, quanto forte, e che cosa —
 *              con il modo di passare al brano dopo
 *   compatto   una riga sola: acceso/spento e il volume
 */
/* `riga` e' il nome di una classe, non uno stile: chi lo usa vuole che
   queste righe assomiglino a quelle intorno, e come sono fatte lo dice il
   foglio di stile. Passandolo come oggetto, ogni schermata se ne inventava
   una versione sua — e la versione delle impostazioni era un filo grigio
   chiaro su una fotografia. */
export default function ControlliMusica({ compatto = false, riga = '' }) {
  const [, ridisegna] = useState(0);
  useEffect(() => iscriviti(() => ridisegna((n) => n + 1)), []);
  const { accesa, volume, brano, quanti } = statoMusica();
  const percentuale = Math.round(volume * 100);

  const cursore = (
    <input
      type="range"
      className="ui-volume"
      id={compatto ? 'musica-volume-breve' : 'musica-volume'}
      name={compatto ? 'musica-volume-breve' : 'musica-volume'}
      min="0"
      max="100"
      step="1"
      value={percentuale}
      disabled={!accesa}
      onChange={(e) => impostaVolume(Number(e.target.value) / 100)}
      aria-label={`Volume della musica: ${percentuale} per cento`}
    />
  );

  if (compatto) {
    // Un riquadro solo, staccato dal fondo, con dentro le due cose che
    // servono: se la musica suona, e quanto forte. Il testo che c'era —
    // "Musica accesa", "Musica spenta" — lo dice adesso la nota, barrata o
    // no; per chi non vede il disegno resta scritto nell'etichetta.
    return (
      <div className="musica-breve">
        <button
          type="button"
          className="musica-breve-tasto"
          onClick={() => accendi(!accesa)}
          aria-pressed={accesa}
          aria-label={accesa ? 'Spegni la musica' : 'Accendi la musica'}
          title={accesa ? 'Spegni la musica' : 'Accendi la musica'}
        >
          <MusicIcon spenta={!accesa} size={20} />
        </button>
        {cursore}
      </div>
    );
  }

  return (
    <>
      <div className={riga}>
        <label htmlFor="musica-accesa">Musica di sottofondo</label>
        <input
          type="checkbox"
          id="musica-accesa"
          name="musica-accesa"
          checked={accesa}
          onChange={(e) => accendi(e.target.checked)}
          style={{ width: 'auto', accentColor: 'var(--tv-primary)' }}
        />
      </div>

      <div className={riga}>
        <label htmlFor="musica-volume">
          Volume
          {/* Il numero accanto al cursore: senza, la manopola non dice mai
              dove sta, e chi non vede la maniglia non sa che valore ha. */}
          <span style={{ marginLeft: 'var(--space-2)', color: 'var(--tv-dim)' }}>{percentuale}%</span>
        </label>
        {cursore}
      </div>

      <div className={riga}>
        <span className="tv-comando-nota" style={{ minWidth: 0 }}>
          {accesa ? (brano?.titolo ?? '—') : `${quanti} brani, in pausa`}
        </span>
        <Button variante="fantasma" compatto onClick={prossimo} disabled={!accesa}>
          Brano successivo
        </Button>
      </div>
    </>
  );
}
