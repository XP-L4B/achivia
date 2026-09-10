import Button from '../ui/Button';
import TerminalBar from '../terminal/TerminalBar';
import { AZIONI } from '../../giochi/theclimb/contenuti/persone';

/**
 * Le persone: una scheda ciascuna, con la fiducia, il potere, dove
 * stanno, che cosa ricordano, e le mosse possibili.
 *
 * Le mosse non disponibili si vedono, spente, con il perche' accanto:
 * «serve uno sponsor», «fra 3 settimane», «non sai ancora chi e'». Una
 * mossa che sparisce quando non si puo' fare e' una porta che non si
 * sa di non poter aprire.
 *
 * La scheda «Nella vita reale» sta sotto il nome, per chi e' svelato.
 * Chi non lo e' — il capo prima del mese, il collega prima di capirlo —
 * ha solo il ruolo, e il resto lo si scopre.
 */
export default function Persone({ persone, onAgisci }) {
  if (!persone?.length) return <p className="tv-nota">Nessuno, per ora. Le persone si incontrano lavorando, facendo rete, facendo volontariato.</p>;
  return (
    <ul className="tc-persone">
      {persone.map((p) => (
        <li key={p.id} className={`tc-persona${p.andato ? ' is-andata' : ''}${p.sponsor ? ' is-sponsor' : ''}`}>
          <div className="tc-persona-testa">
            <span className="tc-persona-nome">
              <b>{p.nome}</b>
              <small>{p.ruolo} · {p.dove} · {p.potereNome}{p.sponsor ? ' · fa il tuo nome' : ''}{p.neutralizzato ? ' · non è più un problema' : ''}{p.evitato ? ' · a distanza' : ''}</small>
            </span>
            <span className="tc-persona-fiducia">
              <TerminalBar label="FIDUCIA" percentuale={p.fiducia} testo={`${p.fiducia}`} etichetta={`Fiducia di ${p.nome} verso di te: ${p.fiducia} su cento`} tono={p.fiducia < 20 ? 'errore' : ''} />
            </span>
          </div>
          {p.spiega && <p className="tc-persona-spiega">{p.spiega}</p>}
          {p.dossier > 0 && <p className="tv-nota">Dossier: {p.dossier} {p.dossier === 1 ? 'settimana' : 'settimane'} documentate.</p>}
          {p.memoria.length > 0 && (
            <p className="tv-nota tc-persona-memoria">
              Si ricorda: {p.memoria.map((m) => `${m.cosa === 'torto' ? 'un torto' : 'un aiuto'} (settimana ${m.s})`).join(', ')}.
            </p>
          )}
          {p.azioni.length > 0 && (
            <div className="tc-persona-mosse">
              {p.azioni.map((a) => (
                <span key={a.id} className="tc-mossa">
                  <Button
                    compatto
                    variante={a.id === 'ruba_merito' || a.id === 'scarica_colpa' ? 'pericolo' : a.id === 'vattene' ? 'fantasma' : 'secondario'}
                    disabled={!a.disponibile}
                    title={AZIONI[a.id]?.spiega}
                    onClick={() => onAgisci(p.id, a.id)}
                  >
                    {AZIONI[a.id]?.nome ?? a.id}{typeof a.probabilita === 'number' && a.probabilita < 1 && a.disponibile ? ` · ${Math.round(a.probabilita * 100)}%` : ''}
                  </Button>
                  {!a.disponibile && a.perche && <small className="tc-mossa-perche">{a.perche}</small>}
                </span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
