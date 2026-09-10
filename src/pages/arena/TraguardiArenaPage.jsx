import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalBar from '../../components/terminal/TerminalBar';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';
import { traguardiDi } from '../../data/arena';
import { progressoLeggibile } from '../../game/contenuti/traguardi';
import { useMusicaFermaNellArena } from './musicaArena';

/**
 * I traguardi dell'arena: un profilo a parte, per chi gioca.
 *
 * Quarantasei, in quattro categorie. Ogni riga dice nome, che cosa e',
 * che cosa serve, a che punto si e' (la barra e i numeri) e se e'
 * sbloccato, con la data. Non c'entrano con gli achievement di Achivia:
 * quelli si guadagnano lavorando e contano nel profilo; questi contano
 * qui e basta.
 */
export default function TraguardiArenaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = user ? getUserById(user.id) || user : null;
  useMusicaFermaNellArena();
  const { lista, categorie, sbloccati, totale } = traguardiDi(me?.id);

  return (
    <div className="page arena-traguardi-pagina">
      <PageShell
        title="Traguardi dell’arena"
        description="Quello che hai fatto nell’arena, e quello che manca. Sono traguardi del gioco: non contano nel profilo di Achivia e non danno crediti."
      />

      <TerminalPanel titolo="In tutto" meta={`${sbloccati} su ${totale}`}>
        <TerminalBar
          label="SBLOCCATI"
          percentuale={totale ? (sbloccati / totale) * 100 : 0}
          testo={`${sbloccati}/${totale}`}
          etichetta={`${sbloccati} traguardi sbloccati su ${totale}`}
        />
        <div className="arena-atrio-azioni" style={{ marginTop: 10 }}>
          <Button variante="fantasma" onClick={() => navigate('/arena')}>Torna all’atrio</Button>
        </div>
      </TerminalPanel>

      {categorie.map((cat) => {
        const voci = lista.filter((v) => v.categoria === cat.id);
        const fatti = voci.filter((v) => v.sbloccato).length;
        return (
          <TerminalPanel key={cat.id} titolo={cat.nome} meta={`${fatti} su ${voci.length}`}>
            <ul className="arena-traguardi" aria-label={`Traguardi: ${cat.nome}`}>
              {voci.map((v) => (
                <li key={v.id} className={`arena-traguardo${v.sbloccato ? ' is-sbloccato' : ''}`}>
                  <div className="arena-traguardo-testa">
                    <b className="arena-traguardo-nome">{v.nome}</b>
                    <span className="arena-traguardo-stato">
                      {v.sbloccato
                        ? `Sbloccato${v.quando ? ` il ${new Date(v.quando).toLocaleDateString('it-IT')}` : ''}`
                        : 'Bloccato'}
                    </span>
                  </div>
                  <span className="arena-traguardo-desc">{v.descrizione}</span>
                  <span className="arena-traguardo-req">Requisito: {v.requisito}</span>
                  <TerminalBar
                    label="PROGRESSO"
                    percentuale={v.progresso * 100}
                    testo={progressoLeggibile(v)}
                    etichetta={`${v.nome}: ${progressoLeggibile(v)}${v.sbloccato ? ', sbloccato' : ''}`}
                    tono={v.sbloccato ? '' : ''}
                  />
                </li>
              ))}
            </ul>
          </TerminalPanel>
        );
      })}
    </div>
  );
}
