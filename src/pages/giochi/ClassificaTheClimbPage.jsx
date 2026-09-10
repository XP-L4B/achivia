import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import Chips from '../../components/ui/Chips';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';
import {
  classificaClimb, divisioneClimbDi, primatiClimb, partitaClimb,
  DIVISIONI_CLIMB, LEGHE_CLIMB, TEMI_CLIMB, PESI, nomeDivisioneClimb,
  BACKGROUND, LIVELLI, nomeBackground, nomePercorso, durataDetta, finaleDi,
} from '../../data/theclimb';
import '../../styles/theclimb.css';

const euro = (v) => `${Math.round(v).toLocaleString('it-IT')} €`;

/**
 * La classifica di The Climb: tre leghe, sei divisioni con nomi loro, i
 * filtri del brief (vita, strada) e le classifiche tematiche —
 * integrita', vita equilibrata, velocita'.
 *
 * Si vede la propria divisione, come in The Boss. E ogni riga si apre:
 * il profilo pubblico della corsa — com'e' finita, la carriera, e dove
 * sarebbero arrivate le stesse scelte partendo altrove — perche' i
 * giocatori imparino l'uno dall'altro.
 */
export default function ClassificaTheClimbPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const me = user ? getUserById(user.id) || user : null;
  const mia = me ? divisioneClimbDi(me.id).divisione : 'base';
  const [lega, setLega] = useState('sett');
  const [divisione, setDivisione] = useState(mia);
  const [tema, setTema] = useState('principale');
  const [background, setBackground] = useState('tutti');
  const [percorso, setPercorso] = useState('tutti');
  const [aperta, setAperta] = useState(null);
  const voci = classificaClimb({ lega, divisione, tema, background: background === 'tutti' ? null : background, percorso: percorso === 'tutti' ? null : percorso });
  const primati = me ? primatiClimb(me.id) : null;
  const io = voci.find((v) => v.userId === me?.id) || null;
  const profilo = aperta ? partitaClimb(aperta) : null;

  return (
    <div className="page tc-atrio">
      <PageShell
        title="Classifica di The Climb"
        description="Tre leghe, sei divisioni. Conta la vita migliore del periodo; il punteggio moltiplica per da dove si parte, così arrivare in cima partendo dal basso vale di più."
      />

      <TerminalPanel titolo="Il periodo" meta={`sei nella divisione ${nomeDivisioneClimb(mia)}`}>
        <div className="tc-azioni">
          {LEGHE_CLIMB.map((l) => <Button key={l.id} variante={lega === l.id ? 'primario' : 'fantasma'} onClick={() => setLega(l.id)}>{l.nome}</Button>)}
        </div>
        <div className="tc-azioni">
          {DIVISIONI_CLIMB.map((d) => <Button key={d.id} variante={divisione === d.id ? 'primario' : 'fantasma'} onClick={() => setDivisione(d.id)}>{d.nome}</Button>)}
        </div>
        <div className="tc-passo">
          <Chips ariaLabel="Il tema" items={TEMI_CLIMB.map((t) => ({ id: t.id, label: t.nome }))} value={tema} onChange={setTema} />
          <Chips ariaLabel="Da dove si parte" items={[{ id: 'tutti', label: 'Tutte le vite' }, ...BACKGROUND.map((b) => ({ id: b.id, label: b.nome }))]} value={background} onChange={setBackground} />
          <Chips ariaLabel="La strada" items={[{ id: 'tutti', label: 'Tutte le strade' }, { id: 'universita', label: 'Università' }, { id: 'altro', label: 'Non università' }]} value={percorso} onChange={setPercorso} />
        </div>
      </TerminalPanel>

      <TerminalPanel titolo={`${nomeDivisioneClimb(divisione)} · ${TEMI_CLIMB.find((t) => t.id === tema)?.nome}`} meta={`${voci.length} in classifica`}>
        {voci.length === 0 ? (
          <p className="tv-nota">Ancora nessuna vita finita qui. La prima che finisci — non abbandonata — ti mette in classifica.</p>
        ) : (
          <TerminalRows
            attivo={aperta}
            onSceglie={(id) => setAperta(aperta === id ? null : id)}
            ariaLabel="Le corse in classifica"
            voci={voci.slice(0, 30).map((v) => ({
              id: v.partitaId,
              label: `${v.posizione}. ${getUserById(v.userId)?.name || 'Qualcuno'}${v.userId === me?.id ? ' (tu)' : ''}`,
              valore: tema === 'velocita' ? `${v.settimane} settimane · ${v.punti} pt`
                : tema === 'equilibrio' ? `equilibrio ${v.equilibrio} · ${v.punti} pt`
                  : `${v.punti} pt · ${LIVELLI[v.livelloMassimo]?.nome ?? v.livelloMassimo} · ${nomeBackground(v.background)}`,
              tono: v.userId === me?.id ? 'attesa' : '',
            }))}
          />
        )}
        {io && <p className="tv-nota">Sei {io.posizione}° con {io.punti} punti.</p>}
      </TerminalPanel>

      {profilo && (
        <TerminalPanel titolo={`${getUserById(profilo.userId)?.name || 'Qualcuno'} — ${finaleDi(profilo.riassunto?.esito?.causa).titolo}`} meta={`${nomeBackground(profilo.background)} · ${nomePercorso(profilo.percorso)}`}>
          <TerminalRows voci={[
            ['Quanto è durata', durataDetta(profilo.riassunto?.settimane || 0)],
            ['Dove è arrivato', LIVELLI[profilo.riassunto?.livelloMassimo]?.nome ?? ''],
            ['Soldi', euro(profilo.riassunto?.soldi || 0)],
            ['Integrità', String(profilo.riassunto?.integrita ?? '')],
            ['Punti', String(profilo.punti)],
          ]} />
          {profilo.epilogo?.carriera?.length > 0 && (
            <ul className="tc-elenco tc-passo">{profilo.epilogo.carriera.map((c, i) => <li key={i}><small>settimana {c.s}</small> — {c.testo}</li>)}</ul>
          )}
          {profilo.confronto && (
            <p className="tv-nota">Altrove: {profilo.confronto.filter((c) => !c.mia).map((c) => `${c.nome} → ${c.livelloNome}`).join(' · ')}.</p>
          )}
        </TerminalPanel>
      )}

      {primati && primati.partite > 0 && (
        <TerminalPanel titolo="I tuoi primati">
          <TerminalRows voci={[
            ['Vite finite', String(primati.partite)],
            ['Arrivate in cima', String(primati.vittorie)],
            ['Il livello più alto', LIVELLI[primati.livelloMax]?.nome ?? String(primati.livelloMax)],
            ['Punteggio migliore', String(primati.puntiMax)],
            primati.settimaneMin ? ['La cima più veloce', `${primati.settimaneMin} settimane`] : null,
          ]} />
        </TerminalPanel>
      )}

      <TerminalPanel titolo="Come si fanno i punti">
        <TerminalRows voci={[
          ['Per ogni livello raggiunto', `${PESI.livello} punti`],
          ['CEO di ACHIVIA SPA', `${PESI.cima} punti`],
          ['Integrità, salute, relazioni, felicità', `× ${PESI.integrita}, ${PESI.salute}, ${PESI.relazioni}, ${PESI.felicita}`],
          ['Velocità', `${PESI.efficienzaBase} meno ${PESI.efficienzaPerSettimana} a settimana`],
          ['Ogni scandalo', `−${PESI.scandalo} punti`],
          ['Da dove parti', BACKGROUND.map((b) => `${b.nome} ×${String(b.moltiplicatore ?? '')}`).join(' · ')],
        ]} />
        <p className="tv-nota">Le vite si rigiocano dal seme e dal log prima di entrare: una vita che non torna non entra. Senza un server questa è l’unica difesa, ed è dichiarata.</p>
        <div className="tc-azioni">
          <Button variante="fantasma" onClick={() => navigate('/giochi/the-climb')}>Torna all’atrio</Button>
        </div>
      </TerminalPanel>
    </div>
  );
}
