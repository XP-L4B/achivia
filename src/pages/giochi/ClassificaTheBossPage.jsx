import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';
import {
  classificaTheBoss, divisioneDi, primatiTheBoss, LEGHE_THEBOSS, DIVISIONI,
  nomeDivisione, PESI,
} from '../../data/theboss';
import { PARTITA } from '../../giochi/theboss/contenuti/bilancio';
import '../../styles/theboss.css';

/**
 * La classifica: tre leghe, sei divisioni.
 *
 * La divisione e' quella di chi guarda, e si vede solo la sua: una
 * classifica in cui compaiono anche i CEO mentre tu sei stagista non e' una
 * classifica, e' un promemoria. Si sale col quinto migliore della stagione e
 * si scende col quinto peggiore; chi sparisce per due stagioni scende.
 *
 * Il filtro geografico non c'e', ed e' una scelta: il profilo di Achivia non
 * ha un campo paese, e l'unico dato di posizione che esiste e' il consenso
 * del mercato del lavoro, che dice dove una persona **vorrebbe lavorare** ed
 * e' stato dato per quello. Usarlo qui sarebbe usarlo per un'altra cosa.
 */
export default function ClassificaTheBossPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const me = user ? getUserById(user.id) || user : null;
  const [lega, setLega] = useState('sett');
  const mia = me ? divisioneDi(me.id).divisione : 'stagista';
  const [divisione, setDivisione] = useState(mia);
  const voci = classificaTheBoss({ lega, divisione });
  const primati = me ? primatiTheBoss(me.id) : null;
  const io = voci.find((v) => v.userId === me?.id) || null;

  return (
    <div className="page tb-classifica">
      <PageShell
        title="Classifica di The Boss"
        description="Tre leghe e sei divisioni. Conta la partita migliore del periodo, e il punteggio premia i giorni sopravvissuti più di ogni altra cosa."
      />

      <TerminalPanel titolo="Il periodo" meta={`sei nella divisione ${nomeDivisione(mia)}`}>
        <div className="tb-scelte">
          {LEGHE_THEBOSS.map((l) => (
            <Button key={l.id} variante={lega === l.id ? 'primario' : 'fantasma'} onClick={() => setLega(l.id)}>
              {l.nome}
            </Button>
          ))}
        </div>
        <div className="tb-scelte">
          {DIVISIONI.map((d) => (
            <Button key={d.id} variante={divisione === d.id ? 'primario' : 'fantasma'} onClick={() => setDivisione(d.id)}>
              {d.nome}
            </Button>
          ))}
        </div>
      </TerminalPanel>

      <TerminalPanel titolo={nomeDivisione(divisione)} meta={`${voci.length} in classifica`}>
        {voci.length === 0 ? (
          <p className="tv-nota">Ancora nessuna partita in questo periodo. La prima che finisci ti mette in classifica.</p>
        ) : (
          <TerminalRows voci={voci.slice(0, 30).map((v) => ({
            id: v.userId,
            label: `${v.posizione}. ${getUserById(v.userId)?.name || 'Qualcuno'}${v.userId === me?.id ? ' (tu)' : ''}`,
            valore: `${v.punti} pt · ${v.giorni} giorni${v.vinta ? ' · arrivato in fondo' : ''}`,
            tono: v.userId === me?.id ? 'attesa' : '',
          }))} />
        )}
        {io && <p className="tv-nota">Sei {io.posizione}° con {io.punti} punti.</p>}
      </TerminalPanel>

      {primati && (
        <TerminalPanel titolo="I tuoi primati">
          <TerminalRows voci={[
            ['Partite giocate', String(primati.partite)],
            ['Arrivate in fondo', String(primati.vinte)],
            ['Giorni, il record', String(primati.giorniMax)],
            ['Punteggio migliore', String(primati.puntiMax)],
            ['Produttività media migliore', `${primati.produttivitaMax}%`],
          ]} />
        </TerminalPanel>
      )}

      <TerminalPanel titolo="Come si fanno i punti">
        <TerminalRows voci={[
          ['Per ogni giorno sopravvissuto', `${PESI.giorno} punti`],
          ['Per ogni punto di produttività media', `${PESI.produttivita} punti`],
          ['Per il fatturato medio', `${PESI.fatturato} punti a moneta`],
          ['Per la cassa che avanza', `${PESI.cassa} punti a moneta`],
          [`Se arrivi al giorno ${PARTITA.giorni}`, `${PESI.vittoria} punti`],
        ]} />
        <p className="tv-nota">
          La cassa pesa poco apposta: chi accumula monete licenziando tutti ha giocato male, e non deve
          stare in cima.
        </p>
        <div className="tb-scelte">
          <Button variante="fantasma" onClick={() => navigate('/giochi/the-boss')}>Torna all’ufficio</Button>
        </div>
      </TerminalPanel>
    </div>
  );
}
