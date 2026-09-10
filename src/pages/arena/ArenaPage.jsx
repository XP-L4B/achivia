import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';
import {
  personaggiDi, moduliGratisDi, prossimoSblocco, prossimoModuloAl, schedaArena, tempoLeggibile, traguardiDi,
  bonusLeggibile, bonusLivelloDi, BONUS_PER_LIVELLO,
  LIVELLI_PER_MODULO,
} from '../../data/arena';
import ControlliMusica from '../../components/ui/ControlliMusica';
import { spriteDi } from '../../game/contenuti/personaggi';
import { useMusicaFermaNellArena } from './musicaArena';
import { scheda as schedaAsset } from '../../game/asset';

const SCALA_RITRATTO = 3;

/** Il primo fotogramma della posa ferma, come ritratto. */
function Ritratto({ personaggio }) {
  const a = schedaAsset(spriteDi(personaggio, 'idle'));
  if (!a?.via) return <span className="arena-ritratto is-vuoto" aria-hidden="true" />;
  const lato = a.riquadro * SCALA_RITRATTO;
  return (
    <span
      className="arena-ritratto"
      aria-hidden="true"
      style={{
        width: lato,
        height: lato,
        backgroundImage: `url(${a.via})`,
        backgroundSize: `${lato * a.fotogrammi}px ${lato}px`,
      }}
    />
  );
}

/**
 * L'atrio dell'arena: i primati, il personaggio, il pulsante per entrare.
 *
 * Qui si vede che cosa il proprio livello in Achivia ha aperto: i
 * personaggi sbloccati e i moduli gratis di partenza. Il resto e' la porta.
 */
export default function ArenaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = user ? getUserById(user.id) || user : null;
  useMusicaFermaNellArena();
  const personaggi = personaggiDi(me);
  const [scelto, setScelto] = useState(personaggi[0].id);
  const moduliGratis = moduliGratisDi(me);
  const prossimo = prossimoSblocco(me);
  const { primati, ultime } = schedaArena(me?.id);
  const traguardi = traguardiDi(me?.id);
  const attuale = personaggi.find((p) => p.id === scelto) || personaggi[0];

  return (
    <div className="page arena-atrio">
      <PageShell
        title="Achivia: Survival"
        description="Un’arena di sopravvivenza. Le ondate arrivano, tu spari da solo: muoviti, raccogli le gemme, sali di livello e scegli i moduli. Il tuo livello in Achivia apre personaggi e moduli di partenza."
      />

      <TerminalPanel titolo="Il tuo account" meta={`Livello ${me?.level ?? 1}`}>
        <TerminalRows
          voci={[
            ['Statistiche del personaggio', bonusLeggibile(me)],
            ['Moduli gratis all’inizio', moduliGratis],
            ['Prossimo modulo', `al livello ${prossimoModuloAl(me)}`],
            prossimo ? ['Prossimo personaggio', `${prossimo.nome}, al livello ${prossimo.sblocco}`] : ['Personaggi', 'tutti sbloccati'],
          ]}
        />
        <p className="tv-nota">
          Ogni livello dell’account rende il personaggio più forte dello {String(BONUS_PER_LIVELLO * 100).replace('.', ',')}%: vita, velocità, danno,
          gittata, raccolta e ricarica. Un modulo gratis ogni {LIVELLI_PER_MODULO} livelli, e un personaggio nuovo ogni {LIVELLI_PER_MODULO} fino
          al 50. Si guadagnano lavorando, non giocando.
        </p>
      </TerminalPanel>

      <TerminalPanel titolo="Il personaggio" meta={attuale.classe}>
        <div className="arena-schede" role="radiogroup" aria-label="Personaggio">
          {personaggi.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.id === scelto}
              className={`arena-scheda${p.id === scelto ? ' is-scelta' : ''}${p.sbloccato ? '' : ' is-chiusa'}`}
              disabled={!p.sbloccato}
              onClick={() => setScelto(p.id)}
            >
              <Ritratto personaggio={p} />
              <b className="arena-scheda-nome">{p.nome}</b>
              <span className="arena-scheda-classe">{p.classe}</span>
              {!p.sbloccato && <span className="arena-scheda-chiusa">dal livello {p.sblocco}</span>}
            </button>
          ))}
        </div>
        <p className="arena-scheda-desc">{attuale.descrizione}</p>
        <p className="tv-nota">
          {bonusLivelloDi(me) > 0
            ? `Il tuo livello ${me?.level ?? 1} lo porta in campo con ${bonusLeggibile(me)} di statistiche.`
            : 'Al livello 1 entra in campo con le statistiche della sua scheda: sali di livello in Achivia e diventa più forte.'}
        </p>
        <div className="arena-atrio-azioni">
          <Button variante="primario" onClick={() => navigate(`/arena/partita?p=${attuale.id}`)}>
            Entra nell’arena
          </Button>
          <Button variante="fantasma" onClick={() => navigate('/arena/traguardi')}>
            Traguardi {traguardi.sbloccati}/{traguardi.totale}
          </Button>
          <Button variante="fantasma" onClick={() => navigate('/arena/classifica')}>
            Classifica
          </Button>
        </div>
        <p className="tv-nota">Tastiera: WASD o frecce. Mouse: tieni premuto sulla tela. Telefono: la leva in basso. Si spara da soli.</p>
      </TerminalPanel>

      {/* Le opzioni: chiuse finche' non servono. Dentro ci sono i comandi della
          musica dell'applicazione, gli stessi delle impostazioni — nell'arena la
          musica non parte da sola, e questo e' il posto da cui riaccenderla. */}
      <TerminalPanel titolo="Opzioni" meta="musica" pieghevole apertoDiDefault={false}>
        <p className="tv-nota">Qui la musica non parte da sola: se l’hai spenta resta spenta. Da qui la riaccendi quando vuoi.</p>
        <ControlliMusica riga="tv-comando" />
      </TerminalPanel>

      <TerminalPanel titolo="I tuoi primati" meta={`${primati.partite} partite`}>
        {primati.partite > 0 ? (
          <>
            <TerminalRows
              voci={[
                ['Tempo più lungo', tempoLeggibile(primati.secondi)],
                ['Più nemici eliminati', primati.uccisioni],
                ['Livello più alto', primati.livello],
                ['Boss abbattuti in una partita', primati.boss || 0],
                ['Casse aperte in una partita', primati.casse || 0],
              ]}
            />
            {ultime.length > 0 && (
              <>
                <div className="tv-riga" aria-hidden="true" />
                <TerminalRows
                  voci={ultime.map((p) => ({
                    id: p.id,
                    label: `${new Date(p.giocataIl).toLocaleDateString('it-IT')} · ${p.personaggio}`,
                    valore: `${tempoLeggibile(p.secondi)} · ${p.uccisioni} elim.`,
                  }))}
                />
              </>
            )}
          </>
        ) : (
          <p className="tv-nota">Nessuna partita ancora. La prima è la più corta: serve a capire come si muovono le ossa.</p>
        )}
      </TerminalPanel>
    </div>
  );
}
