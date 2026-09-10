import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import LexoraIcon from '../../components/ui/LexoraIcon';
import ClimbIcon from '../../components/ui/ClimbIcon';
import { giochiVisibili } from '../../data/giochi/catalogo';
import arenaIcon from '../../assets/ui/arena.png';
import calderoneIcon from '../../assets/cauldron_icon.png';

/* Il nome che sta nei dati diventa un disegno qui, e solo qui: il
   catalogo dei giochi non deve conoscere ne' React ne' i file delle
   immagini. Survival ha gia' la sua icona nell'app — quella del riquadro
   nel profilo — e usarne una seconda vorrebbe dire due Survival diversi. */
function Icona({ nome }) {
  if (nome === 'arena') return <img className="gioco-icona" src={arenaIcon} alt="" aria-hidden="true" />;
  if (nome === 'lexora') return <LexoraIcon size={44} className="gioco-icona" />;
  /* The Boss produce pozioni, e il calderone e' gia' in Achivia: un disegno
     nuovo per dire la stessa cosa sarebbe un disegno in piu' da mantenere. */
  if (nome === 'theboss') return <img className="gioco-icona" src={calderoneIcon} alt="" aria-hidden="true" />;
  if (nome === 'theclimb') return <ClimbIcon size={44} className="gioco-icona" />;
  return null;
}

/**
 * Games: la porta dei giochi di Achivia.
 *
 * Una scheda per gioco, tutte uguali di forma e diverse di contenuto: si
 * vede in un colpo che cosa sono, se si giocano da soli o in due, e quanto
 * durano. L'elenco sta in `data/giochi/catalogo.js`, quindi aggiungerne
 * uno non passa da qui.
 *
 * I giochi non pagano: niente crediti, niente esperienza dell'account.
 * Quelli si guadagnano lavorando, e la schermata lo dice invece di
 * lasciarlo scoprire.
 */
export default function GiochiPage() {
  const navigate = useNavigate();

  return (
    <div className="page giochi-hub">
      <PageShell
        title="Games"
        description="Gioca, sfida i tuoi colleghi, e stacca cinque minuti. I giochi non danno crediti né esperienza: quelli si guadagnano lavorando."
      />

      <div className="giochi-schede">
        {giochiVisibili().map((g) => (
          <TerminalPanel key={g.id} titolo={g.nome} meta={g.giocatori} className="gioco-scheda">
            <p className="gioco-sommario"><Icona nome={g.icona} />{g.sommario}</p>
            <p className="gioco-desc">{g.descrizione}</p>
            <p className="tv-nota">Una partita: {g.durata}.</p>
            <div className="gioco-azioni">
              <Button variante="primario" onClick={() => navigate(g.to)}>Gioca</Button>
            </div>
          </TerminalPanel>
        ))}
      </div>
    </div>
  );
}
