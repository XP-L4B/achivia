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
import { classificaDi, LEGHE } from '../../data/lexora';

const NOMI_PODIO = ['Oro', 'Argento', 'Bronzo'];

/**
 * La classifica di Lexora: le stesse tre leghe dell'arena.
 *
 * Conta la partita migliore del periodo, non la somma: cosi' chi gioca
 * venti partite non batte per stanchezza chi ne ha giocata una buona. La
 * settimana e il mese ripartono da zero; "Di sempre" no. I punti sono del
 * gioco e non valgono crediti.
 */
export default function ClassificaLexoraPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = user ? getUserById(user.id) || user : null;
  const [lega, setLega] = useState('sett');
  const [ambito, setAmbito] = useState('tutti');
  const cl = classificaDi(me?.id, { lega, ambito });

  return (
    <div className="page lex-classifica-pagina">
      <PageShell
        title="Classifica di Lexora"
        description="Chi fa più punti in una partita. La settimana e il mese ripartono da zero; la lega di sempre no. I punti sono del gioco: non valgono crediti."
      />

      <TerminalPanel titolo="La lega" meta={cl.etichetta}>
        <Chips items={LEGHE.map((l) => ({ id: l.id, label: l.nome }))} value={lega} onChange={setLega} ariaLabel="Lega" />
        {cl.ambiti.length > 1 && (
          <Chips items={cl.ambiti.map((a) => ({ id: a.id, label: a.nome }))} value={cl.ambito} onChange={setAmbito} ariaLabel="Con chi confrontarsi" />
        )}
        <TerminalRows
          voci={[
            ['Partecipanti', cl.partecipanti],
            [lega === 'sempre' ? 'Si azzera' : 'Si azzera fra', cl.scadenza],
          ]}
        />
        <div className="lex-azioni" style={{ marginTop: 10 }}>
          <Button variante="primario" onClick={() => navigate('/giochi/lexora')}>Gioca</Button>
        </div>
      </TerminalPanel>

      <TerminalPanel titolo="La tua posizione" meta={cl.mia ? `${cl.mia.posizione}º` : 'fuori classifica'}>
        {cl.mia ? (
          <>
            <TerminalRows
              voci={[
                ['Punti della partita migliore', cl.mia.punti],
                ['Partite nel periodo', cl.mia.partite],
                ['Vittorie nel periodo', cl.mia.vittorie],
                cl.mia.sopra
                  ? ['Per salire di un posto', `${cl.mia.mancano} punti`]
                  : ['In testa', lega === 'sempre' ? 'nessuno ti ha ancora battuto' : 'difendi il posto fino alla fine'],
              ]}
            />
            {cl.mia.sopra && (
              <p className="tv-nota">
                Sopra di te c’è <NomePersona persona={cl.mia.sopra.persona} mostraNumero={false} /> con {cl.mia.sopra.punti} punti.
              </p>
            )}
          </>
        ) : (
          <p className="tv-nota">
            {lega === 'sempre'
              ? 'Non hai ancora giocato. Una partita basta per entrare.'
              : `Non hai ancora giocato in questo periodo: la lega ${cl.scadenza}, e una partita ti mette in classifica.`}
          </p>
        )}
      </TerminalPanel>

      <TerminalPanel titolo="I primi" meta={`${Math.min(10, cl.partecipanti)} su ${cl.partecipanti}`}>
        {cl.voci.length > 0 ? (
          <ol className="arena-posti" aria-label="Classifica">
            {cl.voci.map((v, i) => (
              <li key={v.userId} className={`arena-posto${v.sono ? ' is-mio' : ''}${v.posizione <= 3 ? ` is-podio-${v.posizione}` : ''}`}>
                {v.posizione > 10 && i > 0 && cl.voci[i - 1].posizione < v.posizione - 1 && <span className="arena-posto-salto" aria-hidden="true">…</span>}
                <b className="arena-posto-numero">{v.posizione}</b>
                <span className="arena-posto-chi">
                  {v.persona ? <NomePersona persona={v.persona} mostraNumero={false} /> : <span>Qualcuno</span>}
                  <small>{v.partite} partite · {v.vittorie} vinte</small>
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
