import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import BackTile from '../../components/ui/BackTile';
import AchievementCard from '../../components/achievements/AchievementCard';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../../components/terminal/TerminalRows';
import AchievementDetailDialog from '../../components/achievements/AchievementDetailDialog';
import { useAuth } from '../../context/AuthContext';
import { getUserById, subscribe } from '../../data/db';
import { progressiDi, storicoDi, creditiDi, sincronizza } from '../../data/achievements';
import { VUOTO_PROFILO, VUOTO_RECENTI } from '../../data/achievementsCatalog';

const VISTE = [
  { id: 'percorso', label: 'Il percorso' },
  { id: 'storico',  label: 'Storico' },
];

const data = (v) => (v ? new Date(v).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

/**
 * "I miei achievement": tutti gli obiettivi, quelli presi e quelli da
 * prendere, con il punto del ciclo in corso e le volte gia' fatte.
 *
 * L'ordine mette davanti quelli piu' vicini al traguardo: e' l'informazione
 * per cui si apre questa pagina.
 */
export default function MyAchievementsPage() {
  const { user } = useAuth();
  const [, setVersione] = useState(0);
  const [vista, setVista] = useState('percorso');
  const [aperto, setAperto] = useState(null);
  useEffect(() => subscribe(() => setVersione((v) => v + 1)), []);

  const me = getUserById(user.id) || user;
  useEffect(() => { sincronizza(me.id); }, [me.id]);

  const progressi = [...progressiDi(me)].sort((a, b) => b.percentuale - a.percentuale);
  const storico = storicoDi(me);
  const totale = storico.length;

  return (
    <>
      <PageShell
        title="I miei achievement"
        description={totale > 0
          ? `${totale} medaglie conquistate finora. Ogni obiettivo riparte da capo appena lo raggiungi.`
          : 'Gli obiettivi che puoi conquistare, e quanto ti manca per ognuno.'}
      />

      <Chips items={VISTE} value={vista} onChange={setVista} ariaLabel="Cosa vedere" />

      {vista === 'percorso' && (
        <div style={{ padding: '0 14px 16px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Il riepilogo prima delle medaglie: quante ne hai prese in tutto e
              quanti obiettivi sono ancora aperti. */}
          <TerminalPanel
            titolo="MEDAGLIE"
            meta={`${progressi.length} obiettivi`}
            piede={totale > 0 ? 'REGISTRO: AGGIORNATO' : 'NESSUNO SBLOCCO ANCORA'}
            tonoPiede={totale > 0 ? '' : 'attesa'}
          >
            <TerminalValue valore={totale} unita="conquistate" nota="da quando sei qui" />
            <div className="tv-riga" aria-hidden="true" />
            <TerminalRows
              vivo
              voci={[
                ['Achievement sbloccati', progressi.filter((p) => p.volte > 0).length],
                { label: 'Ancora da prendere', valore: progressi.filter((p) => p.volte === 0).length, tono: 'attesa' },
              ]}
            />
          </TerminalPanel>

          {progressi.map((p) => (
            <AchievementCard
              key={p.definizione.id}
              progresso={p}
              crediti={creditiDi(me.orgId, p.definizione)}
              onApri={() => setAperto(p)}
            />
          ))}
        </div>
      )}

      {vista === 'storico' && (
        <div className="ui-corpo-stretto">
          <TerminalPanel titolo="STORICO" meta={totale > 0 ? `${totale} record` : ''}>
          {storico.length === 0 ? (
            <div className="empty-state">
              <b>{VUOTO_PROFILO.titolo}</b>
              <p style={{ margin: 'var(--space-2) 0 0' }}>{VUOTO_PROFILO.testo}</p>
            </div>
          ) : (
            <ol className="ach-storico">
              {storico.map(({ istanza, definizione, assegnatoDa }) => (
                <li key={istanza.id}>
                  <div className="ach-storico-testa">
                    <b>{definizione?.nome} #{istanza.ciclo}</b>
                    <span>{data(istanza.ottenutoIl)}</span>
                  </div>
                  <small>
                    {istanza.progresso}/{istanza.target} · {istanza.fonte === 'manual' ? 'assegnato' : 'automatico'}
                    {istanza.crediti > 0 ? ` · +${istanza.crediti} crediti` : ' · nessuna ricompensa'}
                    {assegnatoDa && ` · da ${assegnatoDa.name}`}
                  </small>
                  {istanza.motivo && <p className="ach-motivo">“{istanza.motivo}”</p>}
                </li>
              ))}
            </ol>
          )}
          {storico.length === 0 && <p className="tv-vuoto">{VUOTO_RECENTI}</p>}
          </TerminalPanel>
        </div>
      )}

      <AchievementDetailDialog progresso={aperto} onChiudi={() => setAperto(null)} />
      <BackTile />
    </>
  );
}
