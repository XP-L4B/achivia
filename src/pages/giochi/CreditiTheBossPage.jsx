import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import '../../styles/theboss.css';

/**
 * Crediti e licenze di The Boss.
 *
 * Non e' una cortesia: la licenza del pacchetto della scena chiede
 * l'attribuzione, e un file `CREDITS.md` dentro il repository non la vede
 * nessuno di quelli che giocano. Per questo la stessa cosa sta scritta qui,
 * raggiungibile dalla schermata iniziale del gioco.
 *
 * Il testo lungo, con l'elenco esatto delle modifiche fatte a ogni foglio,
 * sta in `src/giochi/theboss/CREDITS.md`: qui c'e' quello che una persona
 * legge, li' quello che serve a chi tocca gli asset.
 */
export default function CreditiTheBossPage() {
  const navigate = useNavigate();
  return (
    <div className="page theboss-crediti">
      <PageShell
        title="Crediti e licenze"
        description="I disegni di The Boss non sono nostri. Chi li ha fatti, con che licenza, e che cosa abbiamo cambiato."
      />

      <TerminalPanel titolo="La scena: l’ufficio" meta="LimeZu">
        <TerminalRows voci={[
          ['Pacchetto', 'Modern Interiors, versione completa'],
          ['Autore', 'LimeZu — limezu.itch.io/moderninteriors'],
          ['Licenza', 'Modern Interiors Full Version License'],
          ['Consente', 'uso e modifica in progetti commerciali e non'],
          ['Vieta', 'rivendere o ridistribuire l’asset, anche modificato'],
          ['Obblighi', 'attribuzione obbligatoria — questa schermata'],
        ]} />
        <p className="tv-nota">
          Modifiche: i fogli sono venduti a 48 pixel per cella e il gioco disegna a 16, quindi sono
          stati ridotti a un terzo. Dove la riduzione non era esatta, ogni blocco ha preso il suo
          colore più frequente. Nessuna ricolorazione, nessun ridisegno.
        </p>
      </TerminalPanel>

      <TerminalPanel titolo="I personaggi" meta="deepdivegamestudio">
        <TerminalRows voci={[
          ['Pacchetti', 'Basic Asset Pack 1, 2, 3 e Basic Demon Animations'],
          ['Autore', 'deepdivegamestudio (itch.io)'],
          ['Consente', 'uso commerciale e non, e modifica'],
          ['Vieta', 'rivendere o ridistribuire; progetti NFT o crypto'],
        ]} />
        <p className="tv-nota">
          Modifiche: nessuna sull’immagine. È cambiato solo il nome del file, che adesso dice il
          mestiere invece della specie.
        </p>
      </TerminalPanel>

      <TerminalPanel titolo="Il capo" meta="Tiny RPG Character Asset Pack">
        <TerminalRows voci={[
          ['Pacchetto', 'Tiny RPG Character Asset Pack 01 — Soldier & Orc'],
          ['Consente', 'uso commerciale e non, e modifica'],
          ['Vieta', 'rivendere o ridistribuire; progetti NFT o crypto'],
        ]} />
        <p className="tv-nota">
          Modifiche: ritagliato da riquadri di 100 pixel a 40, con gli stessi numeri del soldato di
          Achivia: Survival. È lo stesso disegno, ed è voluto.
        </p>
      </TerminalPanel>

      <TerminalPanel titolo="Il resto">
        <p className="theboss-riga">
          Pulsanti, pannelli, barre, angoli, colori e caratteri sono quelli di Achivia: per questo
          gioco non è stato aggiunto nessun disegno e nessuna libreria grafica.
        </p>
        <div className="theboss-azioni">
          <Button variante="fantasma" onClick={() => navigate('/giochi/the-boss')}>Torna al gioco</Button>
        </div>
      </TerminalPanel>
    </div>
  );
}
