import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import Chips from '../../components/ui/Chips';
import NomePersona from '../../components/ui/NomePersona';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';
import { classificaDi, tempoLeggibile, LEGHE, PUNTI } from '../../data/arena';
import { personaggioById } from '../../game/contenuti/personaggi';
import { useMusicaFermaNellArena } from './musicaArena';

const NOMI_PODIO = ['Oro', 'Argento', 'Bronzo'];

/**
 * La classifica dell'arena: tre leghe, e un confronto.
 *
 * La settimana e il mese ripartono da zero quando cambiano; "Di sempre"
 * non riparte mai. Si confronta con tutti o con le organizzazioni di cui
 * si fa parte. La pagina dice dove si sta, quanti punti mancano per
 * salire di un posto, quanto manca alla fine della lega, e chi ha vinto
 * quella scorsa: tre ragioni per tornare. I punti non valgono niente
 * fuori dall'arena.
 */
export default function ClassificaArenaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = user ? getUserById(user.id) || user : null;
  useMusicaFermaNellArena();
  const [lega, setLega] = useState('sett');
  const [ambito, setAmbito] = useState('tutti');
  const c = classificaDi(me?.id, { lega, ambito });
  const ambitoValido = c.ambiti.some((a) => a.id === ambito) ? ambito : 'tutti';
  const cl = ambitoValido === ambito ? c : classificaDi(me?.id, { lega, ambito: ambitoValido });
  const nomePersonaggio = (id) => personaggioById(id)?.nome ?? id;

  return (
    <div className="page arena-classifica-pagina">
      <PageShell
        title="Classifica dell’arena"
        description="Chi resiste di più. La settimana e il mese ripartono da zero; la lega di sempre no. I punti sono del gioco: non valgono crediti."
      />

      <TerminalPanel titolo="La lega" meta={cl.etichetta}>
        <Chips items={LEGHE.map((l) => ({ id: l.id, label: l.nome }))} value={lega} onChange={setLega} ariaLabel="Lega" />
        {cl.ambiti.length > 1 && (
          <Chips items={cl.ambiti.map((a) => ({ id: a.id, label: a.nome }))} value={ambitoValido} onChange={setAmbito} ariaLabel="Con chi confrontarsi" />
        )}
        <TerminalRows
          voci={[
            ['Partecipanti', cl.partecipanti],
            [lega === 'sempre' ? 'Si azzera' : 'Si azzera fra', cl.scadenza],
          ]}
        />
        <p className="tv-nota">Punti: {PUNTI.secondo} al secondo, {PUNTI.nemico} per nemico, {PUNTI.livello} per livello, {PUNTI.boss} per boss. Conta la partita migliore del periodo.</p>
        <div className="arena-atrio-azioni" style={{ marginTop: 10 }}>
          <Button variante="primario" onClick={() => navigate('/arena')}>Gioca</Button>
        </div>
      </TerminalPanel>

      <TerminalPanel titolo="La tua posizione" meta={cl.mia ? `${cl.mia.posizione}º` : 'fuori classifica'}>
        {cl.mia ? (
          <>
            <TerminalRows
              voci={[
                ['Punti', cl.mia.punti],
                ['La partita migliore', `${tempoLeggibile(cl.mia.secondi)} · ${cl.mia.uccisioni} nemici · livello ${cl.mia.livello} · ${nomePersonaggio(cl.mia.personaggio)}`],
                ['Partite nel periodo', cl.mia.partite],
                cl.mia.sopra
                  ? ['Per salire di un posto', `${cl.mia.mancano} punti`]
                  : ['In testa', lega === 'sempre' ? 'nessuno ti ha ancora battuto' : 'difendi il posto fino alla fine'],
              ]}
            />
            {cl.mia.sopra && <p className="tv-nota">Sopra di te c’è <NomePersona persona={cl.mia.sopra.persona} mostraNumero={false} /> con {cl.mia.sopra.punti} punti.</p>}
          </>
        ) : (
          <p className="tv-nota">
            {lega === 'sempre'
              ? 'Non hai ancora giocato. Una partita basta per entrare.'
              : `Non hai ancora giocato in questo periodo: la lega si azzera fra ${cl.scadenza}, e una partita ti mette in classifica.`}
          </p>
        )}
      </TerminalPanel>

      <TerminalPanel titolo="I primi" meta={`${Math.min(10, cl.partecipanti)} su ${cl.partecipanti}`}>
        {cl.voci.length > 0 ? (
          <ol className="arena-posti" aria-label="Classifica">
            {cl.voci.map((v, i) => (
              <li key={v.userId} className={`arena-posto${v.userId === me?.id ? ' is-mio' : ''}${v.posizione <= 3 ? ` is-podio-${v.posizione}` : ''}`}>
                {v.posizione > 10 && i > 0 && cl.voci[i - 1].posizione < v.posizione - 1 && <span className="arena-posto-salto" aria-hidden="true">…</span>}
                <b className="arena-posto-numero">{v.posizione}</b>
                <span className="arena-posto-chi">
                  {v.persona ? <NomePersona persona={v.persona} mostraNumero={false} /> : <span>Qualcuno</span>}
                  <small>{tempoLeggibile(v.secondi)} · {v.uccisioni} nemici · liv. {v.livello} · {nomePersonaggio(v.personaggio)}</small>
                </span>
                <b className="arena-posto-punti">{v.punti}</b>
              </li>
            ))}
          </ol>
        ) : (
          <p className="tv-nota">Nessuno ha ancora giocato in questo periodo. Il primo posto è libero.</p>
        )}
      </TerminalPanel>

      {lega !== 'sempre' && (
        <TerminalPanel titolo={lega === 'sett' ? 'La settimana scorsa' : 'Il mese scorso'} meta={`${cl.scorsa.partecipanti} partecipanti`}>
          {cl.scorsa.podio.length > 0 ? (
            <>
              <TerminalRows
                voci={cl.scorsa.podio.map((v, i) => ({
                  id: v.userId,
                  label: NOMI_PODIO[i],
                  valore: `${v.persona?.nickname || v.persona?.name || 'Qualcuno'} · ${v.punti} punti`,
                }))}
              />
              <p className="tv-nota">
                {cl.scorsa.mia
                  ? `Tu eri ${cl.scorsa.mia.posizione}º con ${cl.scorsa.mia.punti} punti.`
                  : 'Tu non c’eri. Questa volta puoi esserci.'}
              </p>
            </>
          ) : (
            <p className="tv-nota">Nessuno ha giocato. La lega comincia da qui.</p>
          )}
        </TerminalPanel>
      )}
    </div>
  );
}
