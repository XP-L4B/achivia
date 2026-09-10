import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import ActionRow from '../../components/ui/ActionRow';
import { useAuth } from '../../context/AuthContext';
import {
  getTeamById, addTeam, updateTeam, deleteTeam,
  addTeamMember, removeTeamMember, getUsersByOrg, getUserById,
} from '../../data/db';
import checkIcon from '../../assets/ui/check.png';
import crossIcon from '../../assets/ui/cross.png';
import BackTile from '../../components/ui/BackTile';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

/**
 * Creazione e modifica di un team: nome, membri da aggiungere o togliere,
 * ed eliminazione. Con `:id` modifica, senza crea.
 */
export default function TeamEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const team = id ? getTeamById(id) : null;
  const [nome, setNome] = useState(team?.name ?? '');
  const [membri, setMembri] = useState(team?.memberIds ?? []);
  const [daAggiungere, setDaAggiungere] = useState('');
  const [errore, setErrore] = useState('');
  const [daEliminare, setDaEliminare] = useState(false);

  if (id && !team) return <PageShell title="Team" description="Team non trovato." />;

  const candidati = getUsersByOrg(user.orgId)
    .filter((u) => u.role !== 'admin' && !membri.includes(u.id));

  function aggiungi() {
    if (!daAggiungere) return;
    setMembri((m) => [...m, daAggiungere]);
    if (team) addTeamMember(team.id, daAggiungere);
    setDaAggiungere('');
  }

  function togli(uid) {
    setMembri((m) => m.filter((x) => x !== uid));
    if (team) removeTeamMember(team.id, uid);
  }

  function salva(e) {
    e.preventDefault();
    if (!nome.trim()) {
      setErrore('Dai un nome al team.');
      return;
    }
    if (team) {
      updateTeam(team.id, { name: nome.trim(), memberIds: membri });
      navigate(`/manager/management/teams/${team.id}`);
    } else {
      const creato = addTeam({
        orgId: user.orgId, name: nome.trim(), createdById: user.id, memberIds: membri,
      });
      navigate(`/manager/management/teams/${creato.id}`);
    }
  }

  function elimina() {
    deleteTeam(team.id);
    navigate('/manager/management/teams');
  }

  return (
    <>
      <PageShell
        title={team ? 'Modifica team' : 'Nuovo team'}
        description={team
          ? 'Cambia il nome, aggiungi o togli membri. Eliminando il team le persone restano nell\'organizzazione.'
          : 'Dai un nome al team e scegli chi ne fa parte.'}
      />

      <form className="ui-panel ui-blocco con-stacco" onSubmit={salva}>
        <label htmlFor="team-nome">Nome del team</label>
        <input
          id="team-nome"
          type="text"
          value={nome}
          onChange={(e) => { setNome(e.target.value); setErrore(''); }}
          placeholder="Es. Marketing"
          style={{ marginTop: 10 }}
        />
        {errore && <p className="ui-errore" role="alert">{errore}</p>}

        <p className="ui-ai-title" style={{ marginTop: 22 }}>Membri ({membri.length})</p>

        {membri.length === 0 && <p>Nessun membro.</p>}
        {membri.map((uid) => {
          const u = getUserById(uid);
          if (!u) return null;
          return (
            <div key={uid} className="ui-ai-row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
              <span>{u.name}</span>
              <button
                type="button"
                className="ui-ai-send"
                onClick={() => togli(uid)}
                aria-label={`Togli ${u.name} dal team`}
              >
                <img src={crossIcon} alt="" style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />
              </button>
            </div>
          );
        })}

        {candidati.length > 0 && (
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={daAggiungere}
              onChange={(e) => setDaAggiungere(e.target.value)}
              aria-label="Persona da aggiungere"
              style={{ flex: 1, minWidth: 160 }}
            >
              <option value="">Scegli una persona…</option>
              {candidati.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="button" className="px-btn" style={{ width: 'auto' }} onClick={aggiungi}>
              Aggiungi
            </button>
          </div>
        )}

        <div className="ui-quest-actions">
          <ActionRow icon={checkIcon} label="Salva" type="submit" />
          {team && <ActionRow icon={crossIcon} label="Elimina team" onClick={() => setDaEliminare(true)} />}
        </div>
      </form>
      {daEliminare && (
        <ConfirmDialog
          titolo={`Eliminare il team "${team.name}"?`}
          testo="Le persone restano nell’organizzazione: sparisce il gruppo, non chi ne faceva parte."
          conferma="Elimina"
          distruttiva
          onConferma={elimina}
          onChiudi={() => setDaEliminare(false)}
        />
      )}
      <BackTile />
    </>
  );
}
