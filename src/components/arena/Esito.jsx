import Button from '../ui/Button';
import TerminalRows from '../terminal/TerminalRows';
import { tempoLeggibile } from '../../data/arena';
import { traguardoById } from '../../game/contenuti/traguardi';

/**
 * La fine della partita: quanto si e' durato, quanti se ne sono mandati
 * giu', a che livello si e' arrivati. E le due porte: un'altra, o l'atrio.
 */
export default function Esito({ riassunto, personaggio, primati, nuoviTraguardi = [], onAncora, onAtrio }) {
  if (!riassunto) return null;
  const sbloccati = nuoviTraguardi.map((id) => traguardoById(id)).filter(Boolean);
  const record = primati && (
    riassunto.secondi >= (primati.secondi || 0) || riassunto.uccisioni >= (primati.uccisioni || 0)
  );
  return (
    <div className="arena-velo" role="dialog" aria-modal="true" aria-labelledby="arena-esito-titolo">
      <section className="tv-panel arena-esito">
        <header className="tv-testa">
          <span className="tv-prompt" aria-hidden="true">&gt;&gt;</span>
          <h2 className="tv-titolo" id="arena-esito-titolo">Partita finita</h2>
          {record && <span className="tv-meta">nuovo primato</span>}
        </header>
        <div className="tv-riga-doppia" aria-hidden="true" />
        <TerminalRows
          voci={[
            ['Personaggio', personaggio?.nome ?? riassunto.personaggio],
            ['Tempo', tempoLeggibile(riassunto.secondi)],
            ['Nemici eliminati', riassunto.uccisioni],
            ['Livello raggiunto', riassunto.livello],
            ['Boss abbattuti', riassunto.boss || 0],
            ['Casse aperte', riassunto.casse || 0],
            ...(riassunto.sinergie?.length ? [['Sinergie', riassunto.sinergie.length]] : []),
          ]}
        />
        {sbloccati.length > 0 && (
          <p className="arena-esito-traguardi">
            <small>Traguardi sbloccati</small>
            {sbloccati.map((t) => <b key={t.id}>{t.nome}</b>)}
          </p>
        )}
        <div className="arena-esito-azioni">
          <Button variante="primario" onClick={onAncora}>Un’altra</Button>
          <Button variante="fantasma" onClick={onAtrio}>Torna all’atrio</Button>
        </div>
      </section>
    </div>
  );
}
