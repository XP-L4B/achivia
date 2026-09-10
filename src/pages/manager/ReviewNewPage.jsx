import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import { TerminalValue } from '../../components/terminal/TerminalRows';
import ActionRow from '../../components/ui/ActionRow';
import { useAuth } from '../../context/AuthContext';
import {
  getUserById, addReview, addReviewTemplate,
  getReviewTemplatesByOrg, averageScore,
} from '../../data/db';
import checkIcon from '../../assets/ui/check.png';
import makeNewIcon from '../../assets/ui/makeNew.png';
import crossIcon from '../../assets/ui/cross.png';
import PromptDialog from '../../components/ui/PromptDialog';

const VOTI = [1, 2, 3, 4, 5];

const nuovoCriterio = () => ({ label: '', description: '', score: 0, note: '' });

/**
 * Compilazione di una performance review: un elenco di criteri, ognuno con un
 * voto da 1 a 5 e una nota. Il punteggio medio si aggiorna mentre si compila.
 * "Salva modello" conserva le sole domande, per riusarle su altre persone.
 */
export default function ReviewNewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const soggetto = getUserById(id);
  const modelli = getReviewTemplatesByOrg(user.orgId);

  const [criteri, setCriteri] = useState([
    { label: 'Lavoro di squadra',
      description: 'Come collabora, comunica e contribuisce agli obiettivi comuni.',
      score: 0, note: '' },
  ]);
  const [nominando, setNominando] = useState(false);
  const [sintesi, setSintesi] = useState('');
  const [errore, setErrore] = useState('');

  if (!soggetto) return <PageShell title="Performance review" description="Persona non trovata." />;

  const media = averageScore(criteri);

  const aggiorna = (i, patch) =>
    setCriteri((c) => c.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  function usaModello(templateId) {
    const t = modelli.find((m) => m.id === templateId);
    if (!t) return;
    setCriteri(t.criteria.map((c) => ({ ...c, score: 0, note: '' })));
  }

  function salva() {
    if (criteri.some((c) => !c.label.trim())) {
      setErrore('Ogni criterio deve avere un titolo.');
      return;
    }
    if (!criteri.some((c) => c.score >= 1)) {
      setErrore('Dai almeno un voto prima di salvare.');
      return;
    }
    addReview({ subjectId: soggetto.id, authorId: user.id, criteria: criteri, summary: sintesi.trim() });
    navigate(`/manager/management/employees/${soggetto.id}/reviews`);
  }

  function salvaModello(nome) {
    addReviewTemplate({ orgId: user.orgId, name: nome, criteria: criteri });
    setNominando(false);
  }

  return (
    <>
      <PageShell
        title="Performance review"
        description={`Valutazione di ${soggetto.name}. Aggiungi i criteri che ti servono, dai un voto da 1 a 5 e annota il perché.`}
      />

      {modelli.length > 0 && (
        <div className="ui-corpo-stretto">
          <label htmlFor="modello">Parti da un modello</label>
          <select
            id="modello"
            defaultValue=""
            onChange={(e) => usaModello(e.target.value)}
            style={{ marginTop: 10 }}
          >
            <option value="">Nessun modello</option>
            {modelli.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      )}

      {criteri.map((c, i) => (
        <section key={i} className="ui-panel" style={{ margin: '0 14px 12px' }}>
          <input
            type="text"
            value={c.label}
            onChange={(e) => { aggiorna(i, { label: e.target.value }); setErrore(''); }}
            placeholder="Titolo del criterio"
            aria-label={`Titolo del criterio ${i + 1}`}
          />
          <textarea
            rows={2}
            value={c.description}
            onChange={(e) => aggiorna(i, { description: e.target.value })}
            placeholder="Che cosa si sta valutando"
            aria-label={`Descrizione del criterio ${i + 1}`}
            style={{ marginTop: 10 }}
          />

          <div className="ui-voti">
            {VOTI.map((v) => (
              <button
                key={v}
                type="button"
                className={`ui-voto${c.score === v ? ' active' : ''}`}
                onClick={() => { aggiorna(i, { score: v }); setErrore(''); }}
                aria-label={`Voto ${v}`}
                aria-pressed={c.score === v}
              >
                {v}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={c.note}
            onChange={(e) => aggiorna(i, { note: e.target.value })}
            placeholder="Nota"
            aria-label={`Nota del criterio ${i + 1}`}
            style={{ marginTop: 12 }}
          />

          {criteri.length > 1 && (
            <button
              type="button"
              className="px-btn ghost"
              style={{ width: 'auto', marginTop: 12 }}
              onClick={() => setCriteri((cs) => cs.filter((_, idx) => idx !== i))}
            >
              Togli criterio
            </button>
          )}
        </section>
      ))}

      <div className="ui-tiles one">
        <button type="button" className="ui-tile" onClick={() => setCriteri((c) => [...c, nuovoCriterio()])}>
          <img src={makeNewIcon} alt="" />
          <span>Aggiungi criterio</span>
        </button>
      </div>

      <section className="ui-panel" style={{ margin: '16px 14px' }}>
        <label htmlFor="sintesi">Sintesi</label>
        <textarea
          id="sintesi"
          rows={3}
          value={sintesi}
          onChange={(e) => setSintesi(e.target.value)}
          placeholder="Il commento che resta nello storico"
          style={{ marginTop: 10 }}
        />
        {/* Il punteggio medio si aggiorna mentre si compila: e' il numero che
            riassume tutta la scheda, e ora si legge come tale. */}
        <TerminalPanel titolo="PUNTEGGIO" style={{ marginTop: 16 }}>
          <TerminalValue valore={media || '—'} unita="/ 5" nota="media dei criteri" />
        </TerminalPanel>
      </section>

      {errore && <p className="ui-errore is-pagina" role="alert">{errore}</p>}

      <div className="ui-quest-actions" style={{ padding: '0 14px 24px' }}>
        <ActionRow icon={checkIcon} label="Salva" onClick={salva} />
        <ActionRow icon={makeNewIcon} label="Salva modello" onClick={() => setNominando(true)} />
        <ActionRow icon={crossIcon} label="Annulla" tone="wide" onClick={() => navigate(-1)} />
      </div>

      {nominando && (
        <PromptDialog
          titolo="Salva come modello"
          testo="I criteri di questa review restano pronti da riusare per le prossime."
          etichetta="Nome del modello"
          valoreIniziale="Review standard"
          righe={1}
          obbligatorio
          conferma="Salva"
          onConferma={salvaModello}
          onChiudi={() => setNominando(false)}
        />
      )}
    </>
  );
}
