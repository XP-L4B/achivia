import TerminalBar from '../terminal/TerminalBar';
import { STRESS, NOIA } from '../../giochi/theclimb/contenuti/bilancio';
import { nomeBackground } from '../../data/theclimb';

/**
 * I numeri di una vita, quelli che si vedono.
 *
 * Cinque barre — salute, stress, noia, felicita', debito di sonno — e
 * sotto i numeri: la settimana e l'eta', i soldi, il lavoro, le persone.
 * Le competenze non stanno qui: sono diciassette, e un cruscotto con
 * ventidue barre non si legge. Stanno nel loro pannello, sotto il piano.
 *
 * Il sospetto non compare, e non e' una dimenticanza: e' la statistica
 * nascosta del gioco (fase sei), e un numero la renderebbe una barra da
 * tenere sotto la soglia.
 *
 * Le soglie dei colori sono quelle del motore (`STRESS`, `NOIA`): la barra
 * diventa gialla dove cominciano i segnali e rossa dove comincia il
 * crollo, cosi' il colore dice la stessa cosa che dicono i messaggi.
 */

const euro = (v) => `${Math.round(v).toLocaleString('it-IT')} €`;
const tonoSoglia = (v, segnali, crollo) => (v >= crollo ? 'errore' : v >= segnali ? 'attesa' : '');

export default function Cruscotto({ foto }) {
  if (!foto) return null;
  const c = foto.corpo;
  const v = foto.vita;
  return (
    <div className="ui-tile tc-cruscotto">
      <div className="tc-barre">
        <TerminalBar label="SALUTE" percentuale={c.salute} testo={`${Math.round(c.salute)}`} etichetta={`Salute ${Math.round(c.salute)} su cento`} tono={c.salute < 30 ? 'errore' : c.salute < 50 ? 'attesa' : ''} />
        <TerminalBar label="STRESS" percentuale={c.stress} testo={`${Math.round(c.stress)}`} etichetta={`Stress ${Math.round(c.stress)} su cento`} tono={tonoSoglia(c.stress, STRESS.segnali, STRESS.crollo)} />
        <TerminalBar label="NOIA" percentuale={c.noia} testo={`${Math.round(c.noia)}`} etichetta={`Noia ${Math.round(c.noia)} su cento`} tono={tonoSoglia(c.noia, NOIA.segnali, NOIA.crollo)} />
        <TerminalBar label="FELICITÀ" percentuale={c.felicita} testo={`${Math.round(c.felicita)}`} etichetta={`Felicità ${Math.round(c.felicita)} su cento`} tono={c.felicita < 30 ? 'attesa' : ''} />
        <TerminalBar label="SONNO ARRETRATO" percentuale={c.sonno} testo={`${Math.round(c.sonno)}`} etichetta={`Debito di sonno ${Math.round(c.sonno)} su cento`} tono={tonoSoglia(c.sonno, STRESS.sogliaSonno, 70)} />
      </div>
      <div className="tc-numeri">
        <span className="tc-voce"><small>SETTIMANA</small><b>{foto.settimana}<i>/{foto.settimaneMassime}</i></b></span>
        <span className="tc-voce"><small>ETÀ</small><b>{foto.eta}</b></span>
        <span className={`tc-voce${v.soldi < 0 ? ' is-allarme' : ''}`}><small>SOLDI</small><b>{euro(v.soldi)}</b></span>
        <span className="tc-voce"><small>ENERGIA</small><b>{foto.energia}</b></span>
        <span className="tc-voce"><small>LAVORO</small><b>{foto.lavoro ? foto.lavoro.livelloNome : 'nessuno'}</b></span>
        <span className="tc-voce"><small>RELAZIONI</small><b>{Math.round(v.relazioni)}</b></span>
        <span className="tc-voce"><small>RETE</small><b>{Math.round(v.rete)}</b></span>
        <span className="tc-voce"><small>REPUTAZIONE</small><b>{Math.round(v.reputazione)}</b></span>
        <span className="tc-voce"><small>VITA</small><b>{nomeBackground(foto.background)}</b></span>
        {foto.occasioni && (foto.occasioni.prese > 0 || foto.occasioni.lasciate > 0) && (
          <span className={`tc-voce${foto.occasioni.richiamo < 0.7 ? ' is-allarme' : ''}`}>
            <small>OCCASIONI</small>
            <b>{foto.occasioni.prese} prese<i> · {foto.occasioni.lasciate} lasciate</i></b>
          </span>
        )}
      </div>
    </div>
  );
}
