import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import { useAuth } from '../../context/AuthContext';
import { enciclopediaClimb, corsaClimb, SCHEDE } from '../../data/theclimb';
import { schedeSbloccate } from '../../giochi/theclimb/motore/partita';
import { deserializza } from '../../giochi/theclimb/motore/partita';
import '../../styles/theclimb.css';

/**
 * L'enciclopedia: le schede «Nella vita reale», sbloccate man mano.
 *
 * Si vedono quelle che si sono incontrate — in questa vita o in una delle
 * precedenti — e si conta quante mancano, senza dire quali: la scheda
 * sul capo tossico si legge quando si e' avuto un capo tossico, non
 * prima. E' il modo in cui il gioco insegna: nel momento in cui serve.
 */
export default function EnciclopediaTheClimbPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const corsa = user ? corsaClimb(user.id) : null;
  const sbloccate = new Set(user ? enciclopediaClimb(user.id) : []);
  if (corsa?.motore) for (const id of schedeSbloccate(deserializza(corsa.motore))) sbloccate.add(id);
  const aperte = SCHEDE.filter((s) => sbloccate.has(s.id));
  const chiuse = SCHEDE.length - aperte.length;

  return (
    <div className="page tc-atrio">
      <PageShell
        title="Nella vita reale"
        description="Le cose che nessuno ti aveva detto, spiegate come le spiegherebbe un amico. Si sbloccano quando le incontri: nel gioco, e nella vita."
      />
      {aperte.length === 0 && (
        <TerminalPanel titolo="Ancora niente" meta={`${SCHEDE.length} schede`}>
          <p className="tc-riga-testo">Comincia una vita: la prima scheda arriva subito, le altre quando le incontri.</p>
        </TerminalPanel>
      )}
      {aperte.map((s) => (
        <TerminalPanel key={s.id} titolo={s.titolo} meta="nella vita reale">
          <p className="tc-riga-testo">{s.testo}</p>
        </TerminalPanel>
      ))}
      {chiuse > 0 && (
        <TerminalPanel titolo={`${chiuse} ${chiuse === 1 ? 'scheda ancora chiusa' : 'schede ancora chiuse'}`} meta="si aprono giocando">
          <p className="tv-nota">Non si dice quali: si leggono quando servono.</p>
        </TerminalPanel>
      )}
      <div className="tc-azioni tc-uscita">
        <Button variante="fantasma" onClick={() => navigate('/giochi/the-climb')}>Torna all’atrio</Button>
      </div>
    </div>
  );
}
