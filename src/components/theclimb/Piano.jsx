import TerminalBar from '../terminal/TerminalBar';
import { TEMPO, PASSO } from '../../giochi/theclimb/contenuti/bilancio';
import { NOMI } from '../../data/theclimb';

/**
 * Il piano della settimana: dove va il tempo.
 *
 * Una riga per attivita', con un piu' e un meno: tredici cursori su un
 * telefono sono tredici cose da centrare col pollice, tredici coppie di
 * pulsanti no. Il passo e' mezza unita' — cinque punti — perche' e' la
 * granularita' con cui una persona ragiona («un po' meno di sonno, un
 * po' piu' di studio»), e in cinque tocchi si sposta un'attivita' da zero
 * al massimo.
 *
 * Sotto il nome c'e' che cosa fa ogni unita', in gradini, e quanta energia
 * costa: e' la meccanica didattica del gioco — i numeri non si nascondono
 * — e senza questa riga il piano sarebbe una lista di parole.
 *
 * Le porte chiuse si vedono: un'attivita' che questa vita non puo' fare
 * sta nell'elenco, spenta, con scritto perche'. Toglierla sarebbe piu'
 * pulito e sarebbe una bugia.
 */

const PASSO_TOCCO = TEMPO.unita / 2;

function effettiDetti(a, percorso) {
  const voci = Object.entries(a.effetti ?? {}).map(([k, v]) => `${NOMI[k] ?? k} ${v > 0 ? '+' : '−'}${Math.abs(v)}`);
  if (typeof a.costo === 'number') voci.push(a.costo > 0 ? `+${a.costo * PASSO.soldi} €` : `${a.costo * PASSO.soldi} €`);
  else if (a.costo === 'dal percorso') voci.push(percorso ? 'costa quanto il percorso' : 'gratis senza un percorso');
  if (a.competenze?.dal === 'percorso') voci.push('insegna quello che insegna il percorso');
  else if (a.competenze?.dal === 'lavoro') voci.push('insegna quello che insegna il posto');
  else if (a.competenze) voci.push(`insegna ${Object.keys(a.competenze).filter((k) => k !== 'campo' && k !== 'dal').map((k) => k.replace(/_/g, ' ')).join(', ')}`);
  return voci.join(' · ');
}

export default function Piano({ foto, piano, energiaChiesta, onCambia }) {
  if (!foto) return null;
  const totale = Object.values(piano).reduce((s, t) => s + (t || 0), 0);
  const sforo = energiaChiesta > foto.energia;
  return (
    <div className="tc-piano">
      <div className="tc-barre">
        <TerminalBar
          label="TEMPO"
          percentuale={(totale / foto.tempo) * 100}
          testo={`${totale}/${foto.tempo}`}
          etichetta={`Tempo assegnato ${totale} su ${foto.tempo}`}
          tono={totale > foto.tempo ? 'errore' : ''}
        />
        <TerminalBar
          label="ENERGIA"
          percentuale={foto.energia ? (energiaChiesta / foto.energia) * 100 : 0}
          testo={`${Math.round(energiaChiesta)}/${foto.energia}`}
          etichetta={`Energia chiesta ${Math.round(energiaChiesta)} su ${foto.energia}`}
          tono={sforo ? 'errore' : ''}
        />
      </div>
      {sforo && <p className="tv-nota tc-avviso">Chiedi più energia di quella che hai: la differenza la paghi in salute e sonno.</p>}
      {totale < foto.tempo && <p className="tv-nota">Hai ancora {foto.tempo - totale} punti di tempo da assegnare. Quelli che non assegni non fanno niente.</p>}

      <ul className="tc-righe">
        {foto.attivita.map((a) => {
          const t = piano[a.id] ?? 0;
          if (a.invisibile) {
            return (
              <li key={a.id} className="tc-riga is-chiusa">
                <span className="tc-riga-nome"><b>{a.nome}</b><small>{a.perche}</small></span>
              </li>
            );
          }
          const puoMeno = t - PASSO_TOCCO >= a.minimo;
          const puoPiu = t + PASSO_TOCCO <= a.massimo && totale + PASSO_TOCCO <= foto.tempo;
          return (
            <li key={a.id} className={`tc-riga${t > 0 ? ' is-attiva' : ''}`}>
              <span className="tc-riga-nome">
                <b>{a.nome}{a.id === 'lavoro' && a.minimo > 0 ? <i> · almeno {a.minimo}</i> : null}</b>
                <small>energia {a.energia} per unità{effettiDetti(a, foto.percorso) ? ` · ${effettiDetti(a, foto.percorso)}` : ''}</small>
              </span>
              <span className="tc-riga-passo">
                <button type="button" className="ui-btn is-fantasma is-compatto is-icona" disabled={!puoMeno} onClick={() => onCambia(a.id, t - PASSO_TOCCO)} aria-label={`Meno ${a.nome}`}>−</button>
                <b className="tc-riga-valore" aria-live="polite">{t}</b>
                <button type="button" className="ui-btn is-fantasma is-compatto is-icona" disabled={!puoPiu} onClick={() => onCambia(a.id, t + PASSO_TOCCO)} aria-label={`Più ${a.nome}`}>+</button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
